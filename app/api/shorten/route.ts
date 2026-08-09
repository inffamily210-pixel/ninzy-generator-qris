import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import { generateCode, isValidUrl } from '@/lib/codes';

export const runtime = 'nodejs';

const SHORTLINK_PREFIX = 'link:';
const MAX_GENERATE_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Body request harus JSON valid' },
      { status: 400 }
    );
  }

  const url = (body as { url?: unknown })?.url;
  if (typeof url !== 'string' || !url.trim()) {
    return NextResponse.json(
      { error: 'Field "url" wajib diisi' },
      { status: 400 }
    );
  }

  const trimmedUrl = url.trim();
  if (!isValidUrl(trimmedUrl)) {
    return NextResponse.json(
      { error: 'URL tidak valid. Pastikan diawali dengan http:// atau https://' },
      { status: 400 }
    );
  }

  let redis;
  try {
    redis = getRedis();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Database belum terhubung' },
      { status: 503 }
    );
  }

  // Collision check: with a 7-char code from a 57-symbol alphabet there are
  // ~58 billion combinations, so collisions are extremely rare, but a single
  // retry-on-collision loop costs almost nothing and removes the risk
  // entirely rather than leaving a theoretical data-overwrite bug.
  let code = '';
  let attempts = 0;
  while (attempts < MAX_GENERATE_ATTEMPTS) {
    code = generateCode();
    const exists = await redis.exists(SHORTLINK_PREFIX + code);
    if (!exists) break;
    attempts++;
  }
  if (attempts >= MAX_GENERATE_ATTEMPTS) {
    return NextResponse.json(
      { error: 'Gagal membuat kode unik, coba lagi' },
      { status: 500 }
    );
  }

  const record = {
    url: trimmedUrl,
    createdAt: new Date().toISOString(),
    clicks: 0,
  };

  await redis.set(SHORTLINK_PREFIX + code, JSON.stringify(record));

  const origin = req.nextUrl.origin;
  return NextResponse.json({
    code,
    shortUrl: `${origin}/s/${code}`,
    originalUrl: trimmedUrl,
  });
}
