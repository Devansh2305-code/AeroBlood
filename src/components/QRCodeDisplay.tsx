import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

export default function QRCodeDisplay({ value, size = 180 }: QRCodeDisplayProps) {
  const [qrSrc, setQrSrc] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    QRCode.toDataURL(
      value,
      {
        width: size,
        margin: 2,
        color: {
          dark: '#0F172A', // Deep slate-900 matching AeroBlood corporate branding
          light: '#FFFFFF', // Clean background
        },
        errorCorrectionLevel: 'H', // High error tolerance for scan reliability
      },
      (err, url) => {
        if (err) {
          console.error('[QR] Generation Error:', err);
          setError(true);
        } else {
          setQrSrc(url);
        }
      }
    );
  }, [value, size]);

  if (error) {
    return (
      <div 
        className="flex items-center justify-center text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl"
        style={{ width: size, height: size }}
      >
        QR Generation Failed
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center bg-slate-100 p-3 rounded-2xl border border-slate-200 shadow-inner">
      {qrSrc ? (
        <img
          src={qrSrc}
          alt="AeroBlood Passport Security Token"
          width={size}
          height={size}
          className="rounded-xl border border-slate-200 shadow-sm transition-transform duration-300 hover:scale-[1.02]"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div 
          className="flex flex-col items-center justify-center text-[10px] text-slate-400 font-mono animate-pulse bg-white rounded-xl border border-slate-100"
          style={{ width: size, height: size }}
        >
          <span className="mb-1">Securing token...</span>
          <span className="text-[8px] opacity-60">FCM SECURE-ID</span>
        </div>
      )}
    </div>
  );
}
