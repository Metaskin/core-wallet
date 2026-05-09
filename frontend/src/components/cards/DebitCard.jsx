import { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';

const DESIGN_BG = {
  blue:  'linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #1d4ed8 100%)',
  black: 'linear-gradient(135deg, #0a0a0a 0%, #171717 55%, #262626 100%)',
  gold:  'linear-gradient(135deg, #3b1507 0%, #78350f 35%, #a16207 68%, #ca8a04 100%)',
};

// cvv and fullCardNumber are only provided on first issuance — never returned by subsequent API calls
export default function DebitCard({ card, accountNumber, balance, ownerName, cvv, fullCardNumber }) {
  const [flipped, setFlipped] = useState(false);
  const design   = card?.design || 'blue';
  const bg       = DESIGN_BG[design] || DESIGN_BG.blue;
  const isFrozen = card?.status === 'frozen';

  return (
    <div
      style={{ perspective: '1000px' }}
      className="w-full max-w-sm select-none cursor-pointer"
      onClick={() => setFlipped(f => !f)}
      title={flipped ? 'Click to flip back' : 'Click to flip card'}
    >
      <div
        style={{
          transformStyle:  'preserve-3d',
          transition:      'transform 0.65s cubic-bezier(0.4, 0.2, 0.2, 1)',
          transform:       flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          position:        'relative',
        }}
      >
        {/* ── Front ── */}
        <div
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', background: bg }}
          className={`rounded-2xl p-5 overflow-hidden relative ${isFrozen ? 'grayscale opacity-70' : ''} transition-all`}
        >
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/[0.04] pointer-events-none" />
          <div className="absolute -right-6 -bottom-12 w-36 h-36 rounded-full bg-white/[0.04] pointer-events-none" />

          {/* Chip + Network */}
          <div className="flex justify-between items-center mb-5">
            <Chip design={design} />
            <div className="flex items-center gap-2">
              {isFrozen && (
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60 bg-white/10 px-2 py-0.5 rounded border border-white/10">
                  Frozen
                </span>
              )}
              <MastercardRings />
            </div>
          </div>

          {/* Card number */}
          <p className="font-mono text-white/85 text-sm tracking-[0.22em] mb-5">
            {card ? `•••• •••• •••• ${card.last4}` : '•••• •••• •••• ••••'}
          </p>

          {/* Bottom row */}
          <div className="flex justify-between items-end">
            <div>
              <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Card Holder</p>
              <p className="text-white font-semibold text-[13px] uppercase tracking-wide truncate max-w-[150px]">
                {card?.cardHolderName || ownerName || 'CARD HOLDER'}
              </p>
            </div>
            <div className="text-right">
              {card ? (
                <>
                  <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Expires</p>
                  <p className="text-white font-mono text-sm">
                    {card.expiry || `${String(card.expiryMonth).padStart(2,'0')}/${String(card.expiryYear).slice(-2)}`}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Balance</p>
                  <p className="text-white font-semibold text-sm amount-display">
                    {balance != null ? formatCurrency(balance) : '—'}
                  </p>
                </>
              )}
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
          {/* Magnetic stripe */}
          <div className="w-full h-9 bg-black/80 mt-6" />

          {/* Signature strip + CVV */}
          <div className="flex items-stretch gap-2 px-4 mt-3">
            <div
              className="flex-1 rounded-sm h-9 flex items-center px-2"
              style={{
                background: 'repeating-linear-gradient(to right, rgba(180,180,180,0.35) 0px, rgba(180,180,180,0.35) 4px, rgba(255,255,255,0.8) 4px, rgba(255,255,255,0.8) 8px)',
              }}
            >
              <span className="text-black/25 text-[9px] italic select-none">
                {card?.cardHolderName || ownerName || 'Authorized Signature'}
              </span>
            </div>
            <div className="shrink-0 flex flex-col items-center justify-center">
              <div className="bg-white rounded px-3 py-1 min-w-[44px] text-center">
                <span className="font-mono text-black font-bold text-sm tracking-widest">{cvv || '•••'}</span>
              </div>
              <p className="text-white/40 text-[8px] uppercase tracking-wider mt-1">CVV</p>
            </div>
          </div>

          {/* Full card number shown on first issuance only */}
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

function Chip({ design }) {
  const chipBg    = design === 'black' ? 'bg-zinc-400/60'    : 'bg-yellow-300/80';
  const innerBg   = design === 'gold'  ? 'border-yellow-700/50' : 'border-yellow-600/40';
  return (
    <div className={`w-10 h-7 rounded-md ${chipBg} flex items-center justify-center`}>
      <div className={`w-7 h-5 rounded-sm border-2 ${innerBg} grid grid-cols-2 gap-0.5 p-0.5`}>
        <div className="bg-yellow-600/30 rounded-sm" /><div className="bg-yellow-600/30 rounded-sm" />
        <div className="bg-yellow-600/30 rounded-sm" /><div className="bg-yellow-600/30 rounded-sm" />
      </div>
    </div>
  );
}

function MastercardRings() {
  return (
    <div className="w-8 h-5 relative">
      <div className="absolute w-5 h-5 rounded-full bg-red-500/70 left-0 top-0" />
      <div className="absolute w-5 h-5 rounded-full bg-orange-400/70 right-0 top-0" />
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
