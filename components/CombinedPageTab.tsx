'use client';

import { useState, useRef } from 'react';
import { addHistoryEntry } from '@/lib/history';

const MAX_FILE_BYTES = 1.5 * 1024 * 1024; // must match server-side MAX_IMAGE_BYTES

export default function CombinedPageTab() {
  const [title, setTitle] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imagePreviewName, setImagePreviewName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function isLikelyValidUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(
        `Ukuran gambar terlalu besar (maks ${(MAX_FILE_BYTES / 1024 / 1024).toFixed(1)}MB). Kompres dulu gambarnya.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
      setImagePreviewName(file.name);
    };
    reader.onerror = () => setError('Gagal membaca file gambar');
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImageDataUrl(null);
    setImagePreviewName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit() {
    setError(null);
    setResult(null);

    const trimmedUrl = inputUrl.trim();
    if (!trimmedUrl) {
      setError('Masukkan link terlebih dahulu');
      return;
    }
    if (!isLikelyValidUrl(trimmedUrl)) {
      setError('Link tidak valid. Pastikan diawali http:// atau https://');
      return;
    }
    if (!imageDataUrl) {
      setError('Upload gambar terlebih dahulu');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          url: trimmedUrl,
          image: imageDataUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal membuat halaman');
        return;
      }
      setResult(data.pageUrl);
      addHistoryEntry({
        id: data.code,
        type: 'page',
        url: data.pageUrl,
        originalUrl: trimmedUrl,
        title: title.trim() || undefined,
      });
    } catch {
      setError('Terjadi kesalahan jaringan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
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
          Judul (opsional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Cek video terbaru aku!"
          maxLength={200}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-2">Link</label>
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-2">Gambar</label>
        {!imageDataUrl ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-8 rounded-xl border-2 border-dashed border-slate-700 text-slate-400 hover:border-emerald-400/50 hover:text-emerald-400 transition text-sm"
          >
            Tap untuk upload gambar
          </button>
        ) : (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageDataUrl}
              alt={imagePreviewName}
              className="w-full aspect-square object-cover rounded-xl border border-slate-700"
            />
            <button
              onClick={clearImage}
              className="mt-2 text-sm text-red-400 hover:text-red-300"
            >
              ✕ Hapus gambar
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 hover:opacity-90 transition disabled:opacity-50"
      >
        {submitting ? 'Membuat halaman...' : 'Buat Halaman'}
      </button>

      {result && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
          <p className="text-xs text-slate-400">Halaman kamu:</p>
          <code className="block text-sm text-emerald-400 break-all">
            {result}
          </code>
          <button
            onClick={handleCopy}
            className="w-full py-2 rounded-lg text-sm bg-slate-800 hover:bg-slate-700 transition text-slate-200"
          >
            {copied ? 'Tersalin ✓' : 'Salin Link'}
          </button>
        </div>
      )}
    </div>
  );
}
