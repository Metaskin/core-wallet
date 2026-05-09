import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function ReceiveMoneyModal({ account, open, onClose }) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 260);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!mounted || !account) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(account.accountNumber);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea');
      el.value = account.accountNumber;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    toast.success('Account number copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-250
                  ${visible ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none pointer-events-none'}`}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={`w-full max-w-sm transition-all duration-250
                       ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="glass-bright rounded-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <ReceiveIcon />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Receive Money</p>
                <p className="text-white/30 text-xs">Share your account number</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/20 hover:text-white/60 transition-colors p-1.5 rounded-lg hover:bg-white/5"
            >
              <XIcon />
            </button>
          </div>

          {/* QR code */}
          <div className="flex justify-center px-6 pt-6 pb-4">
            <div className="bg-white rounded-2xl p-4 inline-block shadow-lg">
              <MockQR value={account.accountNumber} />
            </div>
          </div>

          {/* Account number */}
          <div className="px-6 pb-2">
            <p className="text-white/30 text-[10px] uppercase tracking-wider text-center mb-2">Account Number</p>
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 flex items-center justify-between gap-3">
              <span className="text-white font-mono font-bold text-lg tracking-widest">
                {account.accountNumber}
              </span>
              <button
                onClick={handleCopy}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${copied
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/[0.06] text-white/50 border border-white/10 hover:bg-accent/15 hover:text-accent hover:border-accent/30'
                  }`}
              >
                {copied ? <CheckLabel /> : <CopyLabel />}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="px-6 py-4">
            <p className="text-white/25 text-xs text-center leading-relaxed">
              Share this number with the sender. Transfers arrive instantly once confirmed.
            </p>
          </div>

          <div className="px-6 pb-5">
            <button onClick={onClose} className="w-full btn-ghost border border-white/10 h-11 text-sm">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CopyLabel() {
  return (
    <span className="flex items-center gap-1.5">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
      </svg>
      Copy
    </span>
  );
}

function CheckLabel() {
  return (
    <span className="flex items-center gap-1.5">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      Copied
    </span>
  );
}

function ReceiveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent, #6366f1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 17 12 21 16 17"/>
      <line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"/>
    </svg>
  );
}

function XIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}

// Deterministic mock QR — generates a stable pixel pattern from the account number
function MockQR({ value }) {
  const N = 21;

  // Simple but stable hash
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }

  const bit = (r, c) => {
    let s = h ^ (r * 31 + c * 37);
    s ^= s >>> 16; s = Math.imul(s, 0x45d9f3b) >>> 0;
    s ^= s >>> 16;
    return s & 1;
  };

  // QR finder pattern: top-left, top-right, bottom-left
  const inFinder = (r, c) => (r < 8 && c < 8) || (r < 8 && c >= N - 8) || (r >= N - 8 && c < 8);
  const finderFilled = (r, c) => {
    const fr = r >= N - 8 ? r - (N - 8) : r;
    const fc = c >= N - 8 ? c - (N - 8) : c;
    const row = r < 8 ? r : fr;
    const col = c >= N - 8 && !(c < 8) ? fc : c;
    const pr = r < 8 ? r : (r >= N - 8 ? r - (N - 8) : r);
    const pc = (c < 8) ? c : (c >= N - 8 ? c - (N - 8) : c);
    return pr === 0 || pr === 6 || pc === 0 || pc === 6 ||
           (pr >= 2 && pr <= 4 && pc >= 2 && pc <= 4);
  };

  const cells = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const filled = inFinder(r, c) ? finderFilled(r, c) : bit(r, c) === 1;
      if (filled) {
        cells.push(
          <rect key={`${r}-${c}`} x={c * 5} y={r * 5} width="4.2" height="4.2" rx="0.6" fill="#111" />
        );
      }
    }
  }

  return (
    <svg width="105" height="105" viewBox={`0 0 ${N * 5} ${N * 5}`}>
      <rect width={N * 5} height={N * 5} fill="white" />
      {cells}
    </svg>
  );
}
