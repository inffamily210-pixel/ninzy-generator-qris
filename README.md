# Ninzy Generator

Convert QRIS statis ke dinamis, ubah link apapun (TikTok, YouTube, dll) jadi
QR code atau shortlink, dan buat halaman gabungan link + gambar untuk
dibagikan.

## Yang berubah dari versi sebelumnya

Versi sebelumnya adalah satu file HTML statis. Fitur shortlink dan halaman
gabungan link+gambar butuh data tersimpan permanen supaya bisa dibuka orang
lain kapan saja — ini butuh database, jadi project ini sekarang berbentuk
aplikasi Next.js dengan backend, bukan lagi satu file HTML.

Tool convert QRIS tetap 100% sama seperti sebelumnya (semua logic jalan di
browser, tidak butuh database) — bisa diakses di `/qris.html` setelah
deploy.

## Setup (sekali saja)

### 1. Deploy ke Vercel

Push repo ini ke GitHub, lalu import di [vercel.com/new](https://vercel.com/new).
Vercel otomatis mendeteksi ini sebagai project Next.js.

### 2. Buat database Redis

Fitur shortlink dan halaman gabungan **tidak akan berfungsi** sampai langkah
ini selesai (fitur convert QRIS di `/qris.html` tetap jalan normal tanpa
ini).

1. Buka project di Vercel Dashboard → tab **Storage**
2. Klik **Create Database** → pilih provider Redis (misalnya **Upstash
   Redis** atau **Redis Cloud** — keduanya gratis untuk skala kecil)
3. Ikuti langkah provisioning (pilih nama, region, plan gratis)
4. Hubungkan database ke project ini saat diminta

Vercel otomatis menambahkan environment variable koneksi ke project.

### 3. Pastikan nama environment variable-nya `REDIS_URL`

1. Buka Project Settings → **Environment Variables**
2. Cek nama variable yang baru ditambahkan otomatis di langkah 2
3. Jika namanya **bukan** `REDIS_URL` (misalnya `KV_URL` atau nama lain),
   tambahkan variable baru bernama `REDIS_URL` dengan nilai yang sama
   (connection string yang diawali `redis://` atau `rediss://`)
4. Redeploy project (Deployments → titik tiga pada deployment terakhir →
   Redeploy) supaya environment variable baru terbaca

Selesai — semua fitur sekarang aktif.

## Struktur project

```
app/
  page.tsx              halaman utama (Link → QR, Halaman Gabungan)
  riwayat/page.tsx        daftar link/halaman yang pernah dibuat di browser ini
  api/shorten/route.ts   API buat shortlink
  api/pages/route.ts     API buat halaman gabungan link+gambar
  s/[code]/page.tsx       redirect shortlink
  p/[code]/page.tsx       halaman publik gabungan link+gambar
lib/
  redis.ts               koneksi database
  codes.ts                generate kode pendek + validasi URL
  history.ts              riwayat lokal (localStorage), dipakai halaman /riwayat
components/
  LinkToQRTab.tsx         UI fitur link → QR + shortlink
  CombinedPageTab.tsx      UI fitur halaman gabungan
  QRCanvas.tsx             render QR code ke canvas
public/
  qris.html                tool convert QRIS (versi sebelumnya, tidak diubah)
```

## Develop lokal

```bash
npm install
cp .env.example .env.local   # isi REDIS_URL dengan connection string database kamu
npm run dev
```

## Batasan yang perlu diketahui

- Gambar untuk halaman gabungan dibatasi **1.5MB** (disimpan langsung di
  database, bukan object storage terpisah)
- Kode shortlink/halaman adalah 7 karakter acak — tidak bisa custom/pilih
  sendiri di versi ini
- Riwayat (`/riwayat`) tersimpan di `localStorage`, per-browser — pindah
  browser, device, atau mode incognito berarti riwayat kosong lagi. Ini
  bukan bug: link dan halaman yang sudah dibuat tetap aktif dan bisa
  dibuka siapa saja yang punya link-nya, hanya *daftar riwayatnya* yang
  lokal per-browser.
