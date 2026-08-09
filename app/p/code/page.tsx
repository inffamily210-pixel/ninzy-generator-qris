import { notFound } from 'next/navigation';
import { getRedis } from '@/lib/redis';
import type { Metadata } from 'next';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAGE_PREFIX = 'page:';

interface PageRecord {
  title: string;
  url: string;
  image: string;
  createdAt: string;
  views: number;
}

async function getRecord(code: string): Promise<PageRecord | null> {
  try {
    const redis = getRedis();
    const raw = await redis.get(PAGE_PREFIX + code);
    if (!raw) return null;
    return JSON.parse(raw as string) as PageRecord;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { code: string };
}): Promise<Metadata> {
  const record = await getRecord(params.code);
  if (!record) return { title: 'Halaman tidak ditemukan — Ninzy Generator' };
  return {
    title: record.title || 'Dibagikan lewat Ninzy Generator',
    openGraph: {
      title: record.title || 'Dibagikan lewat Ninzy Generator',
      images: [record.image],
    },
  };
}

export default async function SharedPage({
  params,
}: {
  params: { code: string };
}) {
  const fetched = await getRecord(params.code);
  if (!fetched) {
    notFound();
  }
  // Rebind with a non-null assertion: `notFound()` above throws at runtime
  // (verified: it's Next.js's control-flow function for the 404 boundary),
  // so this line is unreachable when fetched is null. The assertion is safe
  // because of that guard, not a bypass of it.
  const record: PageRecord = fetched!;

  // Fire-and-forget view increment, same reasoning as the shortlink route:
  // never block rendering on this, and never let it fail the request.
  (async () => {
    try {
      const redis = getRedis();
      const updated = { ...record, views: (record.views || 0) + 1 };
      await redis.set(PAGE_PREFIX + params.code, JSON.stringify(updated));
    } catch {
      // best-effort only
    }
  })();

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={record.image}
          alt={record.title || 'Gambar'}
          className="w-full aspect-square object-cover bg-slate-800"
        />
        <div className="p-6">
          {record.title && (
            <h1 className="text-lg font-bold text-slate-50 mb-4">
              {record.title}
            </h1>
          )}
          <a
            href={record.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-3 px-4 rounded-xl font-semibold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:opacity-90 transition"
          >
            Buka Link
          </a>
          <p className="text-center text-xs text-slate-500 mt-4">
            Dibuat dengan Ninzy Generator
          </p>
        </div>
      </div>
    </main>
  );
}
