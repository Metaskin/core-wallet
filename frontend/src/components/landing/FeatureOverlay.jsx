import { useState, useEffect, useCallback } from 'react';

// ─── Keyframes injected once ──────────────────────────────────────────────────
const CW_KEYFRAMES = `
  @keyframes cw-flow {
    0%   { transform: translateX(-14px); opacity: 0; }
    12%  { opacity: 1; }
    88%  { opacity: 1; }
    100% { transform: translateX(200px); opacity: 0; }
  }
  @keyframes cw-ring {
    0%   { transform: scale(0.4); opacity: 0.6; }
    100% { transform: scale(2.6); opacity: 0;   }
  }
  @keyframes cw-type {
    0%, 100% { transform: translateY(0px);  opacity: 0.28; }
    40%      { transform: translateY(-5px); opacity: 1;    }
  }
  @keyframes cw-bar {
    from { transform: scaleY(0); }
    to   { transform: scaleY(1); }
  }
  @keyframes cw-float {
    0%, 100% { transform: translateY(0px)  rotate(0deg);   }
    50%      { transform: translateY(-8px) rotate(1.2deg); }
  }
  @keyframes cw-scan {
    0%   { transform: translateY(-2px); opacity: 0;    }
    8%   { opacity: 0.6; }
    92%  { opacity: 0.6; }
    100% { transform: translateY(130px); opacity: 0;   }
  }
  @keyframes cw-count {
    from { opacity: 0; transform: translateY(7px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  @keyframes cw-row {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0);    }
  }
`;

function ensureKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('cw-kf')) return;
  const s = document.createElement('style');
  s.id = 'cw-kf';
  s.textContent = CW_KEYFRAMES;
  document.head.appendChild(s);
}

// ─── Visual components ────────────────────────────────────────────────────────

function TransferVisual() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-5 px-5">
      <div className="flex items-center w-full gap-3">
        {/* Sender */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-white/[0.07] border border-white/[0.10] flex items-center justify-center text-white/50 font-bold text-sm">A</div>
          <span className="text-white/22 text-[9px]">You</span>
        </div>

        {/* Flow track */}
        <div className="flex-1 relative h-7 overflow-hidden">
          <div className="absolute inset-y-0 inset-x-0 flex items-center">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          </div>
          {[0, 0.48, 0.96, 1.44, 1.92].map((delay, i) => (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400"
              style={{
                boxShadow: '0 0 6px #10b981',
                animation: `cw-flow 2.5s linear ${delay}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Receiver */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/[0.18] border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold text-sm">B</div>
          <span className="text-white/22 text-[9px]">Them</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-white font-bold text-2xl font-mono tracking-tight leading-none">$250.00</p>
        <p className="text-emerald-400 text-[11px] font-medium mt-1">sent instantly ✓</p>
      </div>
    </div>
  );
}

function CardVisual() {
  return (
    <div className="w-full h-full flex items-center justify-center px-4">
      <div
        className="relative w-full max-w-[200px] rounded-[16px] overflow-hidden select-none shadow-2xl shadow-black/60"
        style={{
          aspectRatio: '1.586',
          background: 'linear-gradient(135deg, #111827 0%, #1a2d45 45%, #0c172a 100%)',
          animation: 'cw-float 4s ease-in-out infinite',
        }}
      >
        <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-white/[0.03] blur-2xl" />
        {/* Chip */}
        <div className="absolute top-[22%] left-[12%] w-[18%] h-[28%] rounded-[4px] border border-white/[0.15] bg-gradient-to-br from-white/[0.10] to-white/[0.04] flex items-center justify-center">
          <div className="w-2/3 h-3/4 rounded-[2px] border border-white/[0.10]" />
        </div>
        {/* Contactless */}
        <div className="absolute top-[18%] right-[10%] text-white/20 text-xs leading-none">))))</div>
        {/* Scan line */}
        <div
          className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.45] to-transparent"
          style={{ animation: 'cw-scan 3s linear infinite' }}
        />
        {/* Details */}
        <div className="absolute bottom-[16%] left-[12%] right-[10%] flex items-end justify-between">
          <span className="text-white/30 font-mono text-[10px] tracking-[0.12em]">•••• 4291</span>
          <span className="text-white/22 font-mono text-[9px]">12/28</span>
        </div>
      </div>
    </div>
  );
}

function SecurityVisual() {
  // Three rings at different sizes so the ripple reads clearly
  const rings = [
    { size: 48, delay: 0 },
    { size: 68, delay: 0.8 },
    { size: 88, delay: 1.6 },
  ];
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
        {rings.map(({ size, delay }, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-emerald-400/20"
            style={{
              width: size,
              height: size,
              animation: `cw-ring 2.6s ease-out ${delay}s infinite`,
            }}
          />
        ))}
        <div className="relative z-10 w-[52px] h-[52px] rounded-2xl bg-emerald-500/[0.15] border border-emerald-500/30 flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <polyline points="9 12 11 14 15 10" strokeWidth="2.2"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

function BalanceVisual() {
  const bars = [52, 68, 38, 82, 61, 95, 47, 73];
  return (
    <div className="w-full h-full flex flex-col justify-center px-5 gap-3">
      <div className="flex items-baseline gap-2">
        <span className="text-white font-bold text-xl font-mono" style={{ animation: 'cw-count 0.5s ease 0.25s both', opacity: 0 }}>
          $12,450
        </span>
        <span className="text-emerald-400 text-xs font-medium" style={{ animation: 'cw-count 0.5s ease 0.55s both', opacity: 0 }}>
          ↑ 18%
        </span>
      </div>
      <div className="flex items-end gap-1.5 h-14">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-[3px]"
            style={{
              height: `${h}%`,
              transformOrigin: 'bottom',
              background: i === 5
                ? 'linear-gradient(to top, #059669, #10b981)'
                : `rgba(255,255,255,${0.04 + i * 0.022})`,
              animation: `cw-bar 0.5s cubic-bezier(0.34,1.4,0.64,1) ${i * 55}ms both`,
            }}
          />
        ))}
      </div>
      <p className="text-white/18 text-[9px]">Past 8 months</p>
    </div>
  );
}

function HistoryVisual() {
  const rows = [
    { name: 'Stripe payout',   amt: '+$500',   green: true,  d: '0.1s'  },
    { name: 'James K.',        amt: '−$120',   green: false, d: '0.25s' },
    { name: 'Monthly payroll', amt: '+$3,200', green: true,  d: '0.42s' },
  ];
  return (
    <div className="w-full h-full flex flex-col justify-center px-4 gap-2">
      {rows.map((r, i) => (
        <div
          key={i}
          className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5"
          style={{ animation: `cw-row 0.38s ease ${r.d} both`, opacity: 0 }}
        >
          <div
            className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center"
            style={{ background: r.green ? 'rgba(16,185,129,0.13)' : 'rgba(239,68,68,0.13)' }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: r.green ? '#10b981' : '#ef4444' }} />
          </div>
          <span className="flex-1 text-white/65 text-[11px] font-medium truncate">{r.name}</span>
          <span className="font-mono text-[11px] font-semibold shrink-0" style={{ color: r.green ? '#10b981' : '#fff' }}>
            {r.amt}
          </span>
        </div>
      ))}
    </div>
  );
}

function SupportVisual() {
  return (
    <div className="w-full h-full flex flex-col justify-center px-4 gap-3">
      <div className="flex items-end gap-2">
        <div className="w-7 h-7 rounded-full bg-emerald-500/[0.18] border border-emerald-500/25 shrink-0 flex items-center justify-center text-[8px] text-emerald-400 font-bold">
          CW
        </div>
        <div
          className="bg-white/[0.06] border border-white/[0.07] rounded-2xl rounded-bl-sm px-3 py-2.5 max-w-[85%]"
          style={{ animation: 'cw-count 0.38s ease 0.15s both', opacity: 0 }}
        >
          <p className="text-white/60 text-[11px] leading-relaxed">Hi! How can we help you today?</p>
        </div>
      </div>
      <div className="flex items-end gap-2">
        <div className="w-7 h-7 rounded-full bg-emerald-500/[0.18] border border-emerald-500/25 shrink-0 flex items-center justify-center text-[8px] text-emerald-400 font-bold">
          CW
        </div>
        <div
          className="bg-white/[0.06] border border-white/[0.07] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5"
          style={{ animation: 'cw-count 0.38s ease 0.35s both', opacity: 0 }}
        >
          {[0, 0.22, 0.44].map((delay, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white/30"
              style={{ animation: `cw-type 1.2s ease ${delay}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Showcase visual (image + premium fallback) ───────────────────────────────

function ShowcaseFallback() {
  const bars = [55, 40, 70, 45, 90, 60, 80];
  const txRows = [
    { name: 'Stripe payout',   amt: '+$500',   green: true,  d: '0.1s'  },
    { name: 'To James K.',     amt: '−$120',   green: false, d: '0.24s' },
    { name: 'Monthly payroll', amt: '+$3,200', green: true,  d: '0.38s' },
  ];
  return (
    <div className="w-full h-full flex overflow-hidden relative">
      {/* Ambient glow */}
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/[0.10] blur-3xl rounded-full pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.05] blur-2xl rounded-full pointer-events-none" />

      {/* Left: balance + chart */}
      <div className="flex flex-col justify-center px-5 sm:px-6 py-5 border-r border-white/[0.06] min-w-0 flex-1">
        <p className="text-white/22 text-[9px] uppercase tracking-widest mb-2">Total Balance</p>
        <p
          className="text-white font-bold text-xl sm:text-2xl font-mono leading-none mb-1"
          style={{ animation: 'cw-count 0.5s ease 0.2s both', opacity: 0 }}
        >
          $12,450.00
        </p>
        <p
          className="text-emerald-400 text-[11px] font-medium mb-4"
          style={{ animation: 'cw-count 0.5s ease 0.42s both', opacity: 0 }}
        >
          ↑ 18% this month
        </p>
        <div className="flex items-end gap-1 h-10">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-[2px]"
              style={{
                height: `${h}%`,
                transformOrigin: 'bottom',
                background: i === 4
                  ? 'linear-gradient(to top, #059669, #10b981)'
                  : `rgba(255,255,255,${0.04 + i * 0.02})`,
                animation: `cw-bar 0.45s ease ${i * 45}ms both`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Right: transactions */}
      <div className="flex flex-col justify-center px-4 sm:px-5 py-5 gap-2 flex-[1.4] min-w-0">
        <p className="text-white/22 text-[9px] uppercase tracking-widest mb-1">Recent</p>
        {txRows.map((r, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.05] rounded-xl px-3 py-2"
            style={{ animation: `cw-row 0.38s ease ${r.d} both`, opacity: 0 }}
          >
            <div
              className="w-5 h-5 rounded-lg shrink-0 flex items-center justify-center"
              style={{ background: r.green ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)' }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: r.green ? '#10b981' : '#ef4444' }} />
            </div>
            <span className="flex-1 text-white/55 text-[10px] font-medium truncate min-w-0">{r.name}</span>
            <span className="font-mono text-[10px] font-semibold shrink-0" style={{ color: r.green ? '#10b981' : '#f1f5f9' }}>
              {r.amt}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShowcaseVisual() {
  const [imgFailed, setImgFailed] = useState(false);

  if (!imgFailed) {
    return (
      <img
        src="/app-preview.png"
        alt="CoreWallet app preview"
        className="w-full h-full object-cover object-top"
        draggable={false}
        onError={() => setImgFailed(true)}
      />
    );
  }
  return <ShowcaseFallback />;
}

// Full-width showcase card rendered above the bento grid
function ShowcaseCard({ phase }) {
  const visible = phase === 'entering' || phase === 'exiting';
  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-white/[0.08]
                 h-[200px] sm:h-[240px] mb-3 sm:mb-4"
      style={{
        background: 'radial-gradient(ellipse at 30% 60%, rgba(16,185,129,0.09) 0%, transparent 55%), linear-gradient(150deg, #0b130b 0%, #060808 100%)',
        opacity:   visible   ? 1 : 0,
        transform: phase === 'entering' ? 'translateY(0)' : (phase === 'exiting' ? 'translateY(0)' : 'translateY(14px)'),
        transition: phase === 'entering'
          ? 'opacity 0.5s cubic-bezier(0.16,1,0.3,1) 60ms, transform 0.5s cubic-bezier(0.16,1,0.3,1) 60ms'
          : 'none',
      }}
    >
      <ShowcaseVisual />

      {/* Bottom text overlay */}
      <div className="absolute bottom-0 inset-x-0 px-5 py-4 bg-gradient-to-t from-black/75 via-black/40 to-transparent">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-emerald-400 text-[10px] font-semibold uppercase tracking-[0.12em] mb-1">
              CoreWallet · App Preview
            </p>
            <h3 className="text-white font-bold text-base sm:text-lg leading-tight tracking-tight">
              Beautifully built for daily use
            </h3>
          </div>
          <div className="shrink-0 ml-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm
                          px-2.5 py-1 rounded-full border border-white/[0.10]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/45 text-[9px] uppercase tracking-wider">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Feature cards data ───────────────────────────────────────────────────────

const CARDS = [
  {
    id: 'transfers',
    lgSpan: 'lg:col-span-3',
    smSpan: 'sm:col-span-2',
    accent: '#10b981',
    tag: 'Transfers',
    title: 'Instant money movement',
    desc: 'Send to anyone in seconds. No delays, no fees, no friction.',
    bg: 'radial-gradient(ellipse at 20% 0%, rgba(16,185,129,0.11) 0%, transparent 55%), linear-gradient(155deg, #0a1a0e 0%, #050808 100%)',
    Visual: TransferVisual,
  },
  {
    id: 'cards',
    lgSpan: 'lg:col-span-3',
    smSpan: 'sm:col-span-2',
    accent: '#e2e8f0',
    tag: 'Cards',
    title: 'Your card, your rules',
    desc: 'Virtual and physical cards issued instantly — debit or credit.',
    bg: 'radial-gradient(ellipse at 80% 0%, rgba(255,255,255,0.04) 0%, transparent 50%), linear-gradient(155deg, #111318 0%, #050808 100%)',
    Visual: CardVisual,
  },
  {
    id: 'security',
    lgSpan: 'lg:col-span-2',
    smSpan: 'sm:col-span-1',
    accent: '#10b981',
    tag: 'Security',
    title: 'Locked down tight',
    desc: '256-bit encryption. Token-scoped sessions. Zero compromises.',
    bg: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.09) 0%, transparent 60%), linear-gradient(155deg, #0a1510 0%, #050808 100%)',
    Visual: SecurityVisual,
  },
  {
    id: 'balance',
    lgSpan: 'lg:col-span-4',
    smSpan: 'sm:col-span-1',
    accent: '#10b981',
    tag: 'Balance',
    title: 'Every dollar, in focus',
    desc: 'Live balance, pending credits, and full history in one clear view.',
    bg: 'radial-gradient(ellipse at 30% 80%, rgba(16,185,129,0.07) 0%, transparent 55%), linear-gradient(155deg, #0d1212 0%, #050808 100%)',
    Visual: BalanceVisual,
  },
  {
    id: 'history',
    lgSpan: 'lg:col-span-3',
    smSpan: 'sm:col-span-1',
    accent: '#94a3b8',
    tag: 'History',
    title: 'Nothing gets lost',
    desc: 'A searchable, timestamped record of every transaction you make.',
    bg: 'linear-gradient(155deg, #0e1014 0%, #050808 100%)',
    Visual: HistoryVisual,
  },
  {
    id: 'support',
    lgSpan: 'lg:col-span-3',
    smSpan: 'sm:col-span-1',
    accent: '#10b981',
    tag: 'Support',
    title: 'Help, always close',
    desc: 'Real humans in your corner. Fast replies, zero bots.',
    bg: 'radial-gradient(ellipse at 0% 100%, rgba(16,185,129,0.07) 0%, transparent 55%), linear-gradient(155deg, #0a1209 0%, #050808 100%)',
    Visual: SupportVisual,
  },
];

// ─── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({ card, index, phase }) {
  // Stagger only on enter; during exit cards hold their final position so the
  // overlay container's fade handles the close animation cleanly.
  const isEntering = phase === 'entering';
  const isIdle     = phase === 'idle';

  return (
    <div
      className={`${card.lgSpan} ${card.smSpan} relative rounded-2xl overflow-hidden
                  border border-white/[0.07] cursor-default group
                  hover:border-white/[0.13]
                  transition-[border-color,box-shadow] duration-300
                  hover:shadow-[0_0_0_1px_rgba(16,185,129,0.10),0_8px_28px_rgba(0,0,0,0.45)]`}
      style={{
        background: card.bg,
        minHeight:  260,
        opacity:    isIdle     ? 0 : 1,
        transform:  isIdle     ? 'translateY(16px) scale(0.988)' : 'translateY(0) scale(1)',
        transition: isEntering
          ? `opacity 0.5s cubic-bezier(0.16,1,0.3,1) ${100 + index * 68}ms,
             transform 0.5s cubic-bezier(0.16,1,0.3,1) ${100 + index * 68}ms`
          : 'none',
      }}
    >
      {/* Visual zone */}
      <div className="h-[148px] flex items-center justify-center overflow-hidden relative">
        <card.Visual />
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-white/[0.055]" />

      {/* Text zone */}
      <div className="px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.13em] mb-1.5" style={{ color: card.accent }}>
          {card.tag}
        </p>
        <h3 className="text-white font-bold text-[1.02rem] leading-snug mb-1.5 tracking-tight">
          {card.title}
        </h3>
        <p className="text-white/36 text-[12.5px] leading-relaxed">{card.desc}</p>
      </div>

      {/* Accent dot */}
      <div
        className="absolute top-3.5 right-3.5 w-1.5 h-1.5 rounded-full opacity-35 group-hover:opacity-75 transition-opacity"
        style={{ background: card.accent }}
      />
    </div>
  );
}

// ─── Main overlay ─────────────────────────────────────────────────────────────

export default function FeatureOverlay({ open, onClose, onSignUp, onSignIn }) {
  // 'idle' → before enter animation starts
  // 'entering' → cards & container animate in
  // 'exiting' → container fades out, cards hold position
  const [mounted, setMounted] = useState(false);
  const [phase,   setPhase]   = useState('idle');

  useEffect(() => { ensureKeyframes(); }, []);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setPhase('idle');
      requestAnimationFrame(() => requestAnimationFrame(() => setPhase('entering')));
    } else {
      setPhase('exiting');
      const t = setTimeout(() => { setMounted(false); setPhase('idle'); }, 420);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleKey = useCallback((e) => { if (e.key === 'Escape') onClose(); }, [onClose]);

  useEffect(() => {
    if (!mounted) return;
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [mounted, handleKey]);

  if (!mounted) return null;

  const isEntering = phase === 'entering';
  const isExiting  = phase === 'exiting';

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#060808] overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-label="Feature showcase"
      style={{
        opacity:         isExiting ? 0 : (isEntering ? 1 : 0),
        // Do NOT use transform on this container — a CSS transform on an ancestor
        // breaks position:fixed children and also changes the stacking context.
        // Fade only is cleaner and avoids the "jumping black screen" issue.
        transition: isExiting
          ? 'opacity 0.38s cubic-bezier(0.4,0,1,1)'
          : 'opacity 0.32s cubic-bezier(0,0,0.2,1)',
        pointerEvents: isExiting ? 'none' : 'auto',
      }}
    >
      {/* ── Sticky header ── */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 h-16
                   border-b border-white/[0.06]"
        style={{ background: 'rgba(6,8,8,0.94)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-emerald-500 flex items-center justify-center text-white font-bold text-sm select-none shadow-md shadow-emerald-500/30">
            C
          </div>
          <span className="font-bold text-white text-base tracking-tight">CoreWallet</span>
        </div>

        <button
          onClick={onClose}
          aria-label="Close"
          className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08]
                     flex items-center justify-center text-white/45 hover:text-white
                     transition-all duration-150 active:scale-90"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="1" y1="1" x2="12" y2="12"/>
            <line x1="12" y1="1" x2="1"  y2="12"/>
          </svg>
        </button>
      </div>

      {/* ── Content ── */}
      <div className="px-4 sm:px-6 pt-8 pb-36 sm:pb-28 max-w-6xl mx-auto">

        {/* Section heading */}
        <div
          className="mb-7 sm:mb-9"
          style={{
            opacity:    isEntering ? 1 : 0,
            transform:  isEntering ? 'translateY(0)' : 'translateY(12px)',
            transition: isEntering ? 'opacity 0.45s ease 55ms, transform 0.45s ease 55ms' : 'none',
          }}
        >
          <p className="text-emerald-400 text-[10px] font-semibold uppercase tracking-[0.15em] mb-2.5">
            What CoreWallet does
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.08]">
            Built different.{' '}
            <span className="text-white/28">Built for you.</span>
          </h2>
        </div>

        {/* Showcase card (image or fallback) */}
        <ShowcaseCard phase={phase} />

        {/* Bento grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
          {CARDS.map((card, i) => (
            <FeatureCard key={card.id} card={card} index={i} phase={phase} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          className="mt-10 sm:mt-12 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-center"
          style={{
            opacity:    isEntering ? 1 : 0,
            transition: isEntering ? 'opacity 0.5s ease 560ms' : 'none',
          }}
        >
          <button
            onClick={onSignUp}
            className="px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400
                       active:scale-[0.97] text-white font-semibold text-base
                       transition-all duration-150 shadow-xl shadow-emerald-500/20
                       text-center"
          >
            Get started — it's free
          </button>
          <button
            onClick={onSignIn}
            className="px-8 py-4 rounded-2xl border border-white/[0.12] text-white/52
                       hover:text-white hover:border-white/20 font-medium text-base
                       transition-all duration-150 text-center"
          >
            I already have an account →
          </button>
        </div>
      </div>

      {/* Top ambient glow — absolute so it isn't affected by any transform */}
      <div
        className="absolute top-0 inset-x-0 h-48 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(16,185,129,0.06), transparent)' }}
      />
    </div>
  );
}
