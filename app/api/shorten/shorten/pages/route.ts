import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import { generateCode, isValidUrl } from '@/lib/codes';

export const runtime = 'nodejs';

const PAGE_PREFIX = 'page:';
const MAX_GENERATE_ATTEMPTS = 5;

// Redis (especially free tiers on Upstash/Redis Cloud) typically caps total
// memory in the tens of MB. Base64 also inflates size by ~33% over the raw
// file. Capping at 1.5MB of *decoded* image data keeps each stored page to a
// predictable, small footprint so a handful of users can't exhaust a free
// tier's storage by themselves.
const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function parseDataUrl(dataUrl: string): { mime: string; base64: string } | null {
  const match = /^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mime: match[1], base64: match[2] };
}

function estimateDecodedBytes(base64: string): number {
  // Standard base64-to-bytes size estimate, accounting for padding.
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

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

  const { title, url, image } = (body ?? {}) as {
    title?: unknown;
    url?: unknown;
    image?: unknown;
  };

  if (typeof url !== 'string' || !url.trim() || !isValidUrl(url.trim())) {
    return NextResponse.json(
      { error: 'URL tidak valid. Pastikan diawali dengan http:// atau https://' },
      { status: 400 }
    );
  }

  if (typeof image !== 'string' || !image.startsWith('data:image/')) {
    return NextResponse.json(
      { error: 'Gambar wajib diisi (format data URL image/*)' },
      { status: 400 }
    );
  }

  const parsed = parseDataUrl(image);
  if (!parsed) {
    return NextResponse.json(
      { error: 'Format data gambar tidak valid' },
      { status: 400 }
    );
  }
  if (!ALLOWED_IMAGE_TYPES.includes(parsed.mime)) {
    return NextResponse.json(
      { error: 'Tipe gambar harus JPEG, PNG, WebP, atau GIF' },
      { status: 400 }
    );
  }
  const decodedSize = estimateDecodedBytes(parsed.base64);
  if (decodedSize > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      {
        error: `Ukuran gambar terlalu besar (maks ${(MAX_IMAGE_BYTES / 1024 / 1024).toFixed(1)}MB). Kompres dulu gambarnya.`,
      },
      { status: 413 }
    );
  }

  const safeTitle =
    typeof title === 'string' && title.trim() ? title.trim().slice(0, 200) : '';

  let redis;
  try {
    redis = getRedis();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Database belum terhubung' },
      { status: 503 }
    );
  }

  let code = '';
  let attempts = 0;
  while (attempts < MAX_GENERATE_ATTEMPTS) {
    code = generateCode();
    const exists = await redis.exists(PAGE_PREFIX + code);
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
    title: safeTitle,
    url: url.trim(),
    image,
    createdAt: new Date().toISOString(),
    views: 0,
  };

  await redis.set(PAGE_PREFIX + code, JSON.stringify(record));

  const origin = req.nextUrl.origin;
  return NextResponse.json({
    code,
    pageUrl: `${origin}/p/${code}`,
  });
}
