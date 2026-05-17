import { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';

const DESIGN_BG = {
  blue:  'linear-gradient(135deg, #1a1145 0%, #2d1b69 40%, #1e3a8a 100%)',
  black: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 55%, #16213e 100%)',
  gold:  'linear-gradient(135deg, #2d1206 0%, #6b2d0a 35%, #8b5523 68%, #b8860b 100%)',
};

// cvv / fullCardNumber only provided on first issuance
export default function CreditCard({ card, cvv, fullCardNumber, ownerName }) {
  const [flipped, setFlipped] = useState(false);
  if (!card) return null;

  const used      = card.creditUsed      || 0;
  const limit     = card.creditLimit     || 5000;
  const available = card.availableCredit ?? (limit - used);
  const pctUsed   = Math.min(100, (used / limit) * 100);
  const isFrozen  = card.status === 'frozen' || card.isActive === false;
  const barColor  = pctUsed > 80 ? '#ef4444' : pctUsed > 50 ? '#f59e0b' : '#10b981';
  const design    = card.design || 'blue';
  const bg        = DESIGN_BG[design] || DESIGN_BG.blue;

  return (
    <div
      style={{ perspective: '1000px' }}
      className="w-full max-w-sm select-none cursor-pointer"
      onClick={() => setFlipped(f => !f)}
      title={flipped ? 'Click to flip back' : 'Click to flip card'}
    >
      <div
        style={{
          transformStyle: 'preserve-3d',
          transition:     'transform 0.65s cubic-bezier(0.4, 0.2, 0.2, 1)',
          transform:      flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          position:       'relative',
        }}
      >
        {/* ── Front ── */}
        <div
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', background: bg }}
          className={`rounded-2xl p-5 overflow-hidden relative ${isFrozen ? 'grayscale opacity-70' : ''} transition-all`}
        >
          <div className="absolute -left-6 -bottom-6 w-32 h-32 rounded-full bg-white/[0.04] pointer-events-none" />
          <div className="absolute -right-4 top-2 w-24 h-24 rounded-full bg-white/[0.04] pointer-events-none" />

          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Credit Card</p>
              <p className="text-white font-semibold text-sm">Virtual Credit</p>
            </div>
            <div className="flex items-center gap-2">
              {isFrozen && (
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60 bg-white/10 px-2 py-0.5 rounded border border-white/10">
                  Frozen
                </span>
              )}
              <CreditRings />
            </div>
          </div>

          {/* Card number */}
          <p className="font-mono text-white/70 text-sm tracking-[0.22em] mb-4">
            •••• •••• •••• {card.last4}
          </p>

          {/* Utilisation bar */}
          <div className="mb-3">
            <div className="flex justify-between text-[10px] text-white/40 mb-1.5">
              <span>Used {formatCurrency(used)}</span>
              <span>Limit {formatCurrency(limit)}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pctUsed}%`, backgroundColor: barColor }}
              />
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex justify-between items-end">
            <div>
              <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Card Holder</p>
              <p className="text-white font-semibold text-[13px] uppercase tracking-wide truncate max-w-[150px]">
                {card.cardHolderName || ownerName || 'CARD HOLDER'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Available</p>
              <p className="text-white amount-display font-semibold text-sm">{formatCurrency(available)}</p>
            </div>
          </div>

          {/* Flip hint */}
          <div className="absolute bottom-2 right-3 flex items-center gap-1 opacity-25 pointer-events-none">
            <FlipIcon />
            <span className="text-white text-[8px] uppercase tracking-widest">flip</span>
          </div>
        </div>

        {/* ── Back ── */}
        <div
          style={{
            backfaceVisibility:       'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform:                'rotateY(180deg)',
            background:               bg,
            position:                 'absolute',
            inset:                    '0',
          }}
          className={`rounded-2xl overflow-hidden relative ${isFrozen ? 'grayscale opacity-70' : ''}`}
        >
          <div className="w-full h-9 bg-black/80 mt-6" />

          <div className="flex items-stretch gap-2 px-4 mt-3">
            <div
              className="flex-1 rounded-sm h-9 flex items-center px-2"
              style={{ background: 'repeating-linear-gradient(to right, rgba(180,180,180,0.35) 0px, rgba(180,180,180,0.35) 4px, rgba(255,255,255,0.8) 4px, rgba(255,255,255,0.8) 8px)' }}
            >
              <span className="text-black/25 text-[9px] italic select-none">{card.cardHolderName || ownerName || 'Authorized Signature'}</span>
            </div>
            <div className="shrink-0 flex flex-col items-center justify-center">
              <div className="bg-white rounded px-3 py-1 min-w-[44px] text-center">
                <span className="font-mono text-black font-bold text-sm tracking-widest">{cvv || '•••'}</span>
              </div>
              <p className="text-white/40 text-[8px] uppercase tracking-wider mt-1">CVV</p>
            </div>
          </div>

          {fullCardNumber && (
            <div className="px-4 mt-3">
              <p className="text-white/30 text-[8px] uppercase tracking-widest mb-1">Card Number</p>
              <p className="font-mono text-white/80 text-xs tracking-[0.15em]">
                {fullCardNumber.replace(/(.{4})/g, '$1 ').trim()}
              </p>
            </div>
          )}

          {cvv && (
            <p className="text-white/25 text-[9px] text-center px-4 mt-2 leading-relaxed">
              Save your details — they won't be shown again
            </p>
          )}

          <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
            <p className="text-white/20 text-[9px] uppercase tracking-[0.25em]">CoreWallet</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreditRings() {
  return (
    <div className="w-8 h-5 relative">
      <div className="absolute w-5 h-5 rounded-full bg-indigo-400/50 left-0 top-0" />
      <div className="absolute w-5 h-5 rounded-full bg-violet-400/50 right-0 top-0" />
    </div>
  );
}

function FlipIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 4v6h6" /><path d="M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 105.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
    </svg>
  );
}
