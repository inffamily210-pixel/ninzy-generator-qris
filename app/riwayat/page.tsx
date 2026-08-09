'use client';

import { useEffect, useState } from 'react';
import {
  getHistory,
  removeHistoryEntry,
  clearHistory,
  type HistoryEntry,
} from '@/lib/history';

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} hari lalu`;
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function RiwayatPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  // Distinguishes "haven't checked localStorage yet" from "checked, and it's
  // empty" — without this, the empty-state message would flash briefly on
  // every load before localStorage is read on mount.
  const [loaded, setLoaded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setEntries(getHistory());
    setLoaded(true);
  }, []);

  async function handleCopy(entry: HistoryEntry) {
    try {
      await navigator.clipboard.writeText(entry.url);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId((current) => (current === entry.id ? null : current)), 2000);
    } catch {
      // Clipboard access can fail (permissions, insecure context) — the link
      // is still visible and selectable manually, so this is a soft failure.
    }
  }

  function handleRemove(id: string) {
    removeHistoryEntry(id);
    setEntries((current) => current.filter((e) => e.id !== id));
  }

  function handleClearAll() {
    if (!window.confirm('Hapus semua riwayat? Link dan halaman yang sudah dibuat tetap aktif, hanya riwayatnya yang dihapus dari perangkat ini.')) {
      return;
    }
    clearHistory();
    setEntries([]);
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <a
            href="/"
            className="text-slate-400 hover:text-slate-200 transition text-lg"
            aria-label="Kembali ke beranda"
          >
            ←
          </a>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Riwayat</h1>
            <p className="text-slate-500 text-xs">
              Tersimpan di perangkat ini saja
            </p>
          </div>
        </div>

        {loaded && entries.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm text-slate-400">
              Belum ada link atau halaman yang dibuat di perangkat ini.
            </p>
            <a
              href="/"
              className="inline-block mt-4 py-2 px-5 rounded-xl text-sm font-medium bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 hover:opacity-90 transition"
            >
              Buat sekarang
            </a>
          </div>
        )}

        {entries.length > 0 && (
          <>
            <div className="space-y-3 mb-6">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          entry.type === 'shortlink'
                            ? 'bg-teal-950 text-teal-400 border border-teal-900'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                        }`}
                      >
                        {entry.type === 'shortlink' ? 'Shortlink' : 'Halaman'}
                      </span>
                      {entry.title && (
                        <span className="text-sm text-slate-200 truncate">
                          {entry.title}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-500">
                      {formatRelativeTime(entry.createdAt)}
                    </span>
                  </div>

                  <code className="block text-sm text-emerald-400 break-all mb-1">
                    {entry.url}
                  </code>
                  <p className="text-xs text-slate-500 truncate mb-3">
                    → {entry.originalUrl}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(entry)}
                      className="flex-1 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 transition text-slate-200"
                    >
                      {copiedId === entry.id ? 'Tersalin ✓' : 'Salin'}
                    </button>
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 transition text-slate-200 text-center"
                    >
                      Buka
                    </a>
                    <button
                      onClick={() => handleRemove(entry.id)}
                      className="py-2 px-3 rounded-lg text-xs font-medium bg-red-950/40 hover:bg-red-950/70 border border-red-900 transition text-red-400"
                      aria-label="Hapus dari riwayat"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleClearAll}
              className="w-full py-2.5 rounded-xl text-sm text-slate-500 hover:text-red-400 transition"
            >
              Hapus semua riwayat
            </button>
          </>
        )}
      </div>
    </main>
  );
}
