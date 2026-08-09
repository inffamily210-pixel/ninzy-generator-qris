'use client';

import { useState } from 'react';
import LinkToQRTab from '@/components/LinkToQRTab';
import CombinedPageTab from '@/components/CombinedPageTab';
import { TabButton } from '@/components/TabButton';

type Tab = 'link' | 'page';

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('link');

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="flex justify-end mb-4">
          <a
            href="/riwayat"
            className="text-xs text-slate-400 hover:text-emerald-400 transition flex items-center gap-1"
          >
            📋 Riwayat
          </a>
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20">
            🔗
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Ninzy Generator</h1>
          <p className="text-slate-400 text-sm mt-1">
            Link, QR code, dan halaman share dalam satu tempat
          </p>
        </div>

        <a
          href="/qris.html"
          className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 mb-6 hover:border-emerald-400/50 transition group"
        >
          <span className="text-sm text-slate-200">
            🧾 Convert QRIS Statis ke Dinamis
          </span>
          <span className="text-slate-500 group-hover:text-emerald-400 transition">
            →
          </span>
        </a>

        <div className="flex gap-2 mb-6">
          <TabButton active={tab === 'link'} onClick={() => setTab('link')}>
            Link → QR
          </TabButton>
          <TabButton active={tab === 'page'} onClick={() => setTab('page')}>
            Halaman Gabungan
          </TabButton>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          {tab === 'link' ? <LinkToQRTab /> : <CombinedPageTab />}
        </div>

        <p className="text-center text-xs text-slate-600 mt-8">
          Ninzy Generator v2.0
        </p>
      </div>
    </main>
  );
}
