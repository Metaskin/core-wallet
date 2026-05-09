import { useState, useEffect } from 'react';

const DESIGNS = [
  {
    id:    'blue',
    label: 'Blue',
    bg:    'linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #1d4ed8 100%)',
  },
  {
    id:    'black',
    label: 'Black',
    bg:    'linear-gradient(135deg, #0a0a0a 0%, #171717 55%, #262626 100%)',
  },
  {
    id:    'gold',
    label: 'Gold',
    bg:    'linear-gradient(135deg, #3b1507 0%, #78350f 35%, #a16207 68%, #ca8a04 100%)',
  },
];

export default function IssueCardModal({ open, onClose, onIssue, issuing, debitCount = 0, creditCount = 0 }) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [type,    setType]    = useState('debit');
  const [design,  setDesign]  = useState('blue');

  useEffect(() => {
    if (open) {
      setMounted(true);
      setType('debit');
      setDesign('blue');
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 260);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!mounted) return null;

  const canIssueDebit  = debitCount  < 2;
  const canIssueCredit = creditCount < 2;
  const canIssue       = type === 'debit' ? canIssueDebit : canIssueCredit;
  const activeBg       = DESIGNS.find(d => d.id === design)?.bg;

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
            <div>
              <p className="text-white font-semibold">Issue New Card</p>
              <p className="text-white/30 text-xs mt-0.5">Virtual card, delivered instantly</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/20 hover:text-white/60 transition-colors p-1.5 rounded-lg hover:bg-white/5"
            >
              <XIcon />
            </button>
          </div>

          <div className="px-6 py-5 space-y-5">

            {/* Card type toggle */}
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Card Type</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { t: 'debit',  label: 'Debit',  can: canIssueDebit  },
                  { t: 'credit', label: 'Credit', can: canIssueCredit },
                ].map(({ t, label, can }) => (
                  <button
                    key={t}
                    disabled={!can}
                    onClick={() => setType(t)}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-all border
                      ${type === t
                        ? 'bg-accent/15 text-accent border-accent/30'
                        : 'bg-white/[0.03] text-white/40 border-white/[0.06] hover:bg-white/[0.06] hover:text-white/70'
                      } disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    {label}
                    {!can && <span className="block text-[10px] opacity-60 font-normal mt-0.5">Max reached</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Design picker */}
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Select Design</p>
              <div className="grid grid-cols-3 gap-2">
                {DESIGNS.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setDesign(d.id)}
                    className={`rounded-xl overflow-hidden transition-all
                      ${design === d.id
                        ? 'ring-2 ring-white/40 ring-offset-1 ring-offset-black/20'
                        : 'opacity-55 hover:opacity-80'
                      }`}
                  >
                    {/* Mini card face */}
                    <div style={{ background: d.bg }} className="w-full h-[68px] p-2.5 relative">
                      {/* Mini chip */}
                      <div className="w-5 h-3.5 rounded-sm bg-yellow-300/70 mb-2" />
                      {/* Mini card number dots */}
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} className="flex gap-0.5">
                            {[0, 1, 2, 3].map(j => (
                              <div key={j} className="w-0.5 h-0.5 rounded-full bg-white/40" />
                            ))}
                          </div>
                        ))}
                      </div>
                      {/* Check */}
                      {design === d.id && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center">
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className={`text-center text-[11px] font-medium py-1.5
                                   ${design === d.id ? 'text-white' : 'text-white/40'}`}>
                      {d.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Live preview */}
            <div style={{ background: activeBg }} className="rounded-xl p-4 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/[0.04] pointer-events-none" />
              <div className="flex justify-between items-start">
                <div>
                  <div className="w-8 h-5 rounded-sm bg-yellow-300/75 mb-3" />
                  <p className="font-mono text-white/65 text-xs tracking-[0.18em]">•••• •••• •••• ••••</p>
                </div>
                <div className="text-right">
                  <p className="text-white/30 text-[9px] uppercase tracking-widest mb-1">
                    {type === 'credit' ? 'Credit Card' : 'Debit Card'}
                  </p>
                  <p className="text-white/50 text-xs capitalize">{design}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 pb-5">
            <button onClick={onClose} className="btn-ghost flex-1 border border-white/10">
              Cancel
            </button>
            <button
              onClick={() => onIssue({ type, cardType: type, design })}
              disabled={issuing || !canIssue}
              className="btn-primary flex-1"
            >
              {issuing && <Spinner />}
              {issuing ? 'Issuing…' : `Issue ${type === 'debit' ? 'Debit' : 'Credit'} Card`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function XIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}

function Spinner() {
  return <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25" /><path d="M21 12a9 9 0 00-9-9" /></svg>;
}
