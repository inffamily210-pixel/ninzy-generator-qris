'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QRCanvasProps {
  value: string;
  size?: number;
  downloadName?: string;
}

export default function QRCanvas({
  value,
  size = 280,
  downloadName = 'qr-code',
}: QRCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value || !canvasRef.current) return;
    setError(null);
    QRCode.toCanvas(
      canvasRef.current,
      value,
      {
        width: size,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      },
      (err) => {
        if (err) setError('Gagal membuat QR code');
      }
    );
  }, [value, size]);

  function handleDownload() {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${downloadName}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  if (!value) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-3 rounded-xl">
        <canvas ref={canvasRef} />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        onClick={handleDownload}
        className="w-full py-2.5 px-4 rounded-xl font-medium text-sm bg-slate-800 hover:bg-slate-700 transition text-slate-200 border border-slate-700"
      >
        Download QR
      </button>
    </div>
  );
}
