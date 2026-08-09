'use client';

import { useState } from 'react';
import QRCanvas from './QRCanvas';
import { addHistoryEntry } from '@/lib/history';

export default function LinkToQRTab() {
  const [inputUrl, setInputUrl] = useState('');
  const [qrValue, setQrValue] = useState('');
  const [shortening, setShortening] = useState(false);
  const [shortResult, setShortResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function isLikelyValidUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function handleGenerateQR() {
    setError(null);
    setShortResult(null);
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setError('Masukkan link terlebih dahulu');
      return;
    }
    if (!isLikelyValidUrl(trimmed)) {
      setError('Link tidak valid. Pastikan diawali http:// atau https://');
      return;
    }
    setQrValue(trimmed);
  }

  async function handleCreateShortlink() {
    setError(null);
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setError('Masukkan link terlebih dahulu');
      return;
    }
    if (!isLikelyValidUrl(trimmed)) {
      setError('Link tidak valid. Pastikan diawali http:// atau https://');
      return;
    }
    setShortening(true);
    setShortResult(null);
    try {
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal membuat shortlink');
        return;
      }
      setShortResult(data.shortUrl);
      addHistoryEntry({
        id: data.code,
        type: 'shortlink',
        url: data.shortUrl,
        originalUrl: data.originalUrl,
      });
    } catch {
      setError('Terjadi kesalahan jaringan. Coba lagi.');
    } finally {
      setShortening(false);
    }
  }

  async function handleCopy() {
    if (!shortResult) return;
    try {
      await navigator.clipboard.writeText(shortResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Gagal menyalin ke clipboard');
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm text-slate-400 mb-2">
          Link (TikTok, YouTube, atau link apapun)
        </label>
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="https://tiktok.com/@user/video/..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleGenerateQR}
          className="py-3 px-4 rounded-xl font-medium text-sm bg-slate-800 hover:bg-slate-700 transition text-slate-200 border border-slate-700"
        >
          Buat QR Code
        </button>
        <button
          onClick={handleCreateShortlink}
          disabled={shortening}
          className="py-3 px-4 rounded-xl font-medium text-sm bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 hover:opacity-90 transition disabled:opacity-50"
        >
          {shortening ? 'Membuat...' : 'Buat Shortlink'}
        </button>
      </div>

      {shortResult && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
          <p className="text-xs text-slate-400">Shortlink kamu:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm text-emerald-400 break-all">
              {shortResult}
            </code>
          </div>
          <button
            onClick={handleCopy}
            className="w-full py-2 rounded-lg text-sm bg-slate-800 hover:bg-slate-700 transition text-slate-200"
          >
            {copied ? 'Tersalin ✓' : 'Salin Link'}
          </button>
        </div>
      )}

      {qrValue && (
        <div className="pt-2">
          <QRCanvas value={qrValue} downloadName="ninzy-qr" />
        </div>
      )}
    </div>
  );
}
