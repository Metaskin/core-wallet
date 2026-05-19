import { useState, useEffect } from 'react';
import { cardAPI, cardReplacementAPI } from '../api';
import toast from 'react-hot-toast';

const REPLACEMENT_REASONS = [
  { value: 'lost',     label: 'Lost Card' },
  { value: 'stolen',   label: 'Stolen Card' },
  { value: 'damaged',  label: 'Damaged Card' },
  { value: 'expired',  label: 'Card Expired' },
];

const TIMELINE_STEPS = [
  { key: 'requested',  label: 'Requested',  desc: 'Your replacement request has been received' },
  { key: 'processing', label: 'Processing', desc: 'Your new card is being prepared' },
  { key: 'shipping',   label: 'Shipping',   desc: 'Your card is on its way' },
  { key: 'delivered',  label: 'Delivered',  desc: 'Card delivered — activate it to start using it' },
];

function statusBadge(s) {
  if (s === 'active')  return 'bg-emerald-100 text-emerald-700';
  if (s === 'frozen')  return 'bg-blue-100 text-blue-700';
  if (s === 'blocked') return 'bg-red-100 text-red-600';
  return 'bg-gray-100 text-gray-500';
}

export default function CardServices() {
  const [cards,         setCards]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [replacingCard, setReplacingCard] = useState(null); // card object
  const [statuses,      setStatuses]      = useState({}); // { [cardId]: replacementStatus }
  const [freezing,      setFreezing]      = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await cardAPI.getAll();
      const loadedCards = data.data?.cards || [];
      setCards(loadedCards);

      // Load replacement status for each card
      const statusEntries = await Promise.all(
        loadedCards.map(async (card) => {
          try {
            const res = await cardReplacementAPI.getStatus(card.id);
            return [card.id, res.data.data];
          } catch {
            return [card.id, null];
          }
        })
      );
      setStatuses(Object.fromEntries(statusEntries));
    } catch {
      toast.error('Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleToggleFreeze = async (card) => {
    setFreezing(card.id);
    try {
      const { data } = await cardAPI.toggleFreeze(card.id);
      setCards(prev => prev.map(c => c.id === card.id ? (data.data?.card || { ...c, status: c.status === 'frozen' ? 'active' : 'frozen' }) : c));
      const frozen = data.data?.card?.status === 'frozen';
      toast.success(frozen ? 'Card frozen' : 'Card activated');
    } catch {
      toast.error('Failed to update card');
    } finally {
      setFreezing(null);
    }
  };

  const onReplacement = (cardId, statusData) => {
    setStatuses(prev => ({ ...prev, [cardId]: statusData }));
    // The original card gets frozen
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, status: 'frozen' } : c));
    setReplacingCard(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl w-full">
      <div className="mb-6 animate-fade-up">
        <h1 className="text-gray-900 font-bold text-2xl">Card Services</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your cards and request replacements</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[0,1,2].map(i => <div key={i} className="h-32 rounded-xl shimmer" />)}
        </div>
      ) : cards.length === 0 ? (
        <div className="bank-card flex flex-col items-center justify-center py-16 text-center animate-fade-up">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <CardIcon className="text-gray-400" />
          </div>
          <p className="text-gray-700 font-semibold text-sm">No cards found</p>
          <p className="text-gray-400 text-xs mt-1">Issue a card from the Cards page first</p>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          {cards.map(card => {
            const replacementStatus = statuses[card.id];
            const hasReplacement    = replacementStatus && replacementStatus.status !== 'none' && replacementStatus.status;
            const frozen            = card.status === 'frozen';
            const isFreezingThis    = freezing === card.id;

            return (
              <div key={card.id} className="bank-card overflow-hidden">
                {/* Card row */}
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Mini card visual */}
                    <div className={`w-16 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      card.cardType === 'credit'
                        ? 'bg-gradient-to-br from-purple-900 to-indigo-900'
                        : 'bg-gradient-to-br from-navy to-[#0072CE]'
                    }`}>
                      <span className="text-white font-mono text-[10px] font-bold">
                        •••• {(card.last4 || card.maskedCardNumber?.slice(-4) || '????')}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-gray-900 font-semibold text-sm capitalize">
                          {card.cardType || card.type || 'Card'} Card
                        </span>
                        <span className={`badge ${statusBadge(card.status)} capitalize text-[10px]`}>{card.status}</span>
                        {card.design && <span className="badge bg-gray-100 text-gray-500 capitalize text-[10px]">{card.design}</span>}
                      </div>
                      <p className="text-gray-400 font-mono text-xs mt-0.5">
                        •••• {card.last4 || (card.maskedCardNumber || '????').slice(-4)}
                        {card.expiry && <span className="ml-2">Exp {card.expiry}</span>}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleToggleFreeze(card)}
                      disabled={isFreezingThis || card.status === 'blocked'}
                      className={`flex-1 text-xs py-2 rounded-lg border transition-all font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                        frozen
                          ? 'bg-emerald-50 text-bank-green border-emerald-200 hover:bg-emerald-100'
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-red-50 hover:text-bank-red hover:border-red-200'
                      }`}
                    >
                      {isFreezingThis ? (
                        <Spinner />
                      ) : frozen ? (
                        <><UnfreezeIcon /> Unfreeze</>
                      ) : (
                        <><FreezeIcon /> Freeze</>
                      )}
                    </button>
                    <button
                      onClick={() => setReplacingCard(card)}
                      disabled={!!hasReplacement}
                      className="flex-1 text-xs py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshIcon /> {hasReplacement ? 'Replacement Pending' : 'Request Replacement'}
                    </button>
                  </div>
                </div>

                {/* Replacement status timeline */}
                {hasReplacement && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <p className="section-label mb-3">Replacement Status</p>
                    <ReplacementTimeline status={replacementStatus} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {replacingCard && (
        <ReplacementModal
          card={replacingCard}
          onClose={() => setReplacingCard(null)}
          onDone={onReplacement}
        />
      )}
    </div>
  );
}

function ReplacementTimeline({ status }) {
  const currentIdx = TIMELINE_STEPS.findIndex(s => s.key === status.status);

  return (
    <div className="space-y-3">
      {TIMELINE_STEPS.map((step, i) => {
        const done    = currentIdx >= i;
        const current = currentIdx === i;
        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 transition-all ${
                done    ? 'bg-navy border-navy' :
                current ? 'bg-white border-navy' : 'bg-white border-gray-200'
              }`}>
                {done && <CheckSmallIcon />}
              </div>
              {i < TIMELINE_STEPS.length - 1 && (
                <div className={`w-0.5 flex-1 mt-1 ${done ? 'bg-navy' : 'bg-gray-200'}`} style={{ minHeight: '16px' }} />
              )}
            </div>
            <div className="pb-3">
              <p className={`text-sm font-semibold ${done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
              <p className={`text-xs ${done ? 'text-gray-500' : 'text-gray-300'}`}>{step.desc}</p>
              {step.key === 'delivered' && status.expectedDelivery && (
                <p className="text-navy text-xs font-medium mt-0.5">
                  Expected: {new Date(status.expectedDelivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReplacementModal({ card, onClose, onDone }) {
  const [reason,  setReason]  = useState(REPLACEMENT_REASONS[0].value);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data } = await cardReplacementAPI.requestReplacement(card.id, { reason });
      toast.success('Replacement card requested. Your current card has been frozen.');
      const statusData = data.data?.replacement || { status: 'requested', reason, requestedAt: new Date().toISOString() };
      onDone(card.id, statusData);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request replacement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl animate-fade-up">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-gray-900 font-bold text-lg">Request Replacement</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><XIcon /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2.5 items-start">
            <AlertIcon className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-amber-700 text-xs leading-relaxed">
              Your current card ending in <span className="font-mono font-bold">{card.last4 || '????'}</span> will be <strong>immediately frozen</strong> once you submit this request.
            </p>
          </div>

          {/* Reason selector */}
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-2">Reason for Replacement</label>
            <div className="space-y-2">
              {REPLACEMENT_REASONS.map(r => (
                <label
                  key={r.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    reason === r.value
                      ? 'border-navy bg-[#EEF4FF]'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    reason === r.value ? 'border-navy' : 'border-gray-300'
                  }`}>
                    {reason === r.value && <div className="w-2 h-2 rounded-full bg-navy" />}
                  </div>
                  <input type="radio" className="hidden" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} />
                  <span className="text-sm text-gray-700 font-medium">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <p className="text-gray-400 text-xs">
            Replacement cards typically arrive in 5–7 business days. Expedited shipping is available at a branch.
          </p>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
              {loading ? <Spinner /> : 'Request Replacement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner() { return <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9"/></svg>; }
function XIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function CardIcon({ className = '' }) { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>; }
function FreezeIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 7l-5-5-5 5"/><path d="M17 17l-5 5-5-5"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M7 7l-5 5 5 5"/><path d="M17 7l5 5-5 5"/></svg>; }
function UnfreezeIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function RefreshIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>; }
function AlertIcon({ className = '' }) { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function CheckSmallIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
