import { redirect, notFound } from 'next/navigation';
import { getRedis } from '@/lib/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SHORTLINK_PREFIX = 'link:';

interface LinkRecord {
  url: string;
  createdAt: string;
  clicks: number;
}

export default async function ShortlinkRedirect({
  params,
}: {
  params: { code: string };
}) {
  const { code } = params;

  let redis;
  try {
    redis = getRedis();
  } catch {
    // Database not configured — show a clear message instead of a raw 500.
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>Link tidak dapat dibuka</h1>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>
            Server sedang tidak dapat terhubung ke database. Coba lagi nanti.
          </p>
        </div>
      </main>
    );
  }

  const raw = await redis.get(SHORTLINK_PREFIX + code);
  if (!raw) {
    notFound();
  }

  let parsed: LinkRecord | null = null;
  try {
    parsed = JSON.parse(raw as string) as LinkRecord;
  } catch {
    parsed = null;
  }
  if (!parsed) {
    notFound();
  }
  // Non-null assertion: notFound() above throws at runtime when parsed is
  // null, so this line is unreachable in that case — the assertion reflects
  // that guarantee rather than bypassing it.
  const record: LinkRecord = parsed!;

  // Fire-and-forget click increment — does not block the redirect, and a
  // failure here should never prevent the user from reaching their link.
  const updated = { ...record, clicks: (record.clicks || 0) + 1 };
  redis.set(SHORTLINK_PREFIX + code, JSON.stringify(updated)).catch(() => {});

  redirect(record.url);
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#0f172a',
  padding: 24,
};

const cardStyle: React.CSSProperties = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 16,
  padding: 32,
  maxWidth: 400,
  textAlign: 'center',
  color: '#f1f5f9',
};
