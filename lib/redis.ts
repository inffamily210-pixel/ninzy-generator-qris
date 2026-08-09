import Redis from 'ioredis';

// Serverless functions can be invoked many times per second, each potentially
// re-running this module. Without a global singleton, every invocation would
// open a brand new Redis connection and never close it, exhausting the
// provider's connection limit within minutes. Reusing the same client across
// invocations (when the runtime happens to reuse the same warm instance)
// avoids that.
declare global {
  // eslint-disable-next-line no-var
  var __ninzyRedis: Redis | undefined;
}

function createClient(): Redis {
  const url = process.env.REDIS_URL;
  if (!url) {
    // Thrown lazily (only when a route actually tries to use Redis), not at
    // module load time, so the rest of the app (client-side QR/QRIS features
    // that need no database) keeps working even before REDIS_URL is set.
    throw new Error(
      'REDIS_URL belum diset. Buka Vercel Dashboard → Storage → Create Database → pilih provider Redis (Upstash/Redis Cloud), lalu hubungkan ke project ini. Environment variable akan otomatis ditambahkan — redeploy setelah itu.'
    );
  }
  const client = new Redis(url, {
    // Fail fast instead of hanging a serverless function until platform timeout
    connectTimeout: 5000,
    maxRetriesPerRequest: 2,
  });
  client.on('error', (err) => {
    console.error('[redis] connection error:', err.message);
  });
  return client;
}

export function getRedis(): Redis {
  if (!global.__ninzyRedis) {
    global.__ninzyRedis = createClient();
  }
  return global.__ninzyRedis;
}
