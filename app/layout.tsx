import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ninzy Generator',
  description:
    'QRIS statis ke dinamis, QR code dari link, shortlink, dan halaman gabungan link + gambar.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
