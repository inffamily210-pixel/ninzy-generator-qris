export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-slate-100 mb-2">
          Halaman tidak ditemukan
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          Link ini mungkin sudah kedaluwarsa atau kodenya salah ketik.
        </p>
        <a
          href="/"
          className="inline-block py-2.5 px-6 rounded-xl font-medium text-sm bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 hover:opacity-90 transition"
        >
          Kembali ke Beranda
        </a>
      </div>
    </main>
  );
}
