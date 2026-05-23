import { useEffect, useRef, useState } from 'react';

export function QRCodeDisplay({ url, size = 176 }) {
  const canvasRef = useRef(null);
  const [state, setState] = useState('loading'); // 'loading' | 'ready' | 'error'

  useEffect(() => {
    let alive = true;
    setState('loading');

    import('qrcode')
      .then(({ default: QR }) => {
        if (!alive || !canvasRef.current) return;
        return QR.toCanvas(canvasRef.current, url, {
          width: size,
          margin: 2,
          color: { dark: '#003087', light: '#FFFFFF' },
          errorCorrectionLevel: 'M',
        });
      })
      .then(() => { if (alive) setState('ready'); })
      .catch(() => { if (alive) setState('error'); });

    return () => { alive = false; };
  }, [url, size]);

  if (state === 'error') {
    return (
      <div
        style={{ width: size, height: size }}
        className="bg-gray-50 border border-gray-200 rounded-xl flex flex-col items-center justify-center text-center p-3 gap-2"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3" rx="0.5"/>
          <rect x="19" y="14" width="2" height="2" rx="0.5"/><rect x="14" y="19" width="2" height="2" rx="0.5"/>
          <rect x="18" y="18" width="3" height="3" rx="0.5"/>
        </svg>
        <p className="text-[10px] text-gray-400 font-mono break-all leading-snug">{url}</p>
        <p className="text-[9px] text-gray-300">Run npm install to enable QR</p>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {state === 'loading' && (
        <div
          style={{ width: size, height: size }}
          className="absolute inset-0 bg-gray-100 rounded-xl animate-pulse"
        />
      )}
      <canvas
        ref={canvasRef}
        className={`rounded-xl shadow-sm transition-opacity duration-300 ${state === 'ready' ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
