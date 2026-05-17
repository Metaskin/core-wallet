import { useState, useEffect } from 'react';
import { useAuth } from '../store/authStore';
import { cardAPI } from '../api';
import DebitCard   from '../components/cards/DebitCard';
import CreditCard  from '../components/cards/CreditCard';
import IssueCardModal from '../components/modals/IssueCardModal';
import PinModal       from '../components/modals/PinModal';
import toast from 'react-hot-toast';

export default function Cards() {
  const { user, account } = useAuth();
  const [cards,          setCards]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [loadError,      setLoadError]      = useState(false);
  const [issuing,        setIssuing]        = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);

  // { [cardId]: { fullNumber, cvv, expiry } }
  const [revealed,       setRevealed]       = useState({});
  const [pinModalCardId, setPinModalCardId] = useState(null);
  const [newCard,        setNewCard]        = useState(null);

  const loadCards = async () => {
    setLoadError(false);
    try {
      setLoading(true);
      const { data } = await cardAPI.getAll();
      setCards(data.data.cards);
    } catch {
      setLoadError(true);
      toast.error('Unable to load cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCards(); }, []);

  const handleIssue = async ({ type, cardType, design }) => {
    if (account?.status !== 'active') {
      toast.error('Cannot issue a card on a frozen account');
      return;
    }
    setIssuing(true);
    try {
      const { data } = await cardAPI.issue({
        cardType: cardType || type || 'debit',
        design,
        ...((cardType || type) === 'credit' ? { creditLimit: 5000 } : {}),
      });
      const issued = data.data.card;
      setNewCard({ id: issued.id, cvv: issued.cvv, fullNumber: issued.fullNumber });
      setShowIssueModal(false);
      await loadCards();
      toast.success(`${design} ${cardType || type} card issued`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue card');
    } finally {
      setIssuing(false);
    }
  };

  const handleReveal = (cardId) => {
    if (revealed[cardId]) {
      setRevealed(prev => { const n = { ...prev }; delete n[cardId]; return n; });
      return;
    }
    setPinModalCardId(cardId);
  };

  const handlePinSuccess = (cardId, details) => {
    setRevealed(prev => ({
      ...prev,
      [cardId]: {
        fullNumber: details.cardNumber,
        cvv:        details.cvv,
        expiry:     details.expiry,
      },
    }));
  };

  const toggleFreeze = async (cardId) => {
    try {
      const { data } = await cardAPI.toggleFreeze(cardId);
      setCards(cs => cs.map(c => c.id === cardId ? data.data.card : c));
      const frozen = data.data.card.status === 'frozen';
      toast.success(frozen ? 'Card frozen' : 'Card activated');
    } catch {
      toast.error('Failed to update card');
    }
  };

  const debitCards  = cards.filter(c => c.cardType === 'debit'  || c.type === 'debit');
  const creditCards = cards.filter(c => c.cardType === 'credit' || c.type === 'credit');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl w-full">

      {/* Header */}
      <div className="mb-6 animate-fade-up">
        <h1 className="text-gray-900 font-bold text-2xl">My Cards</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your virtual debit and credit cards</p>
      </div>

      {/* New card hint */}
      {newCard && (
        <div className="bank-card border-l-4 border-l-[#0072CE] px-4 py-3 mb-6 flex items-center gap-3 animate-fade-up">
          <div className="w-2 h-2 rounded-full bg-[#0072CE] animate-pulse shrink-0" />
          <p className="text-gray-600 text-sm flex-1">
            New card issued.{' '}
            <span className="text-[#0072CE] font-medium">Click "Show Details"</span>
            {' '}below your card to see the full number and CVV — shown once only.
          </p>
          <button onClick={() => setNewCard(null)} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
            <XIcon />
          </button>
        </div>
      )}

      {/* Load error */}
      {loadError && !loading && (
        <div className="bank-card border-l-4 border-l-bank-red px-5 py-4 mb-6 flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-gray-600 text-sm flex-1">Unable to load cards.</p>
          <button onClick={loadCards} className="text-[#0072CE] text-xs font-medium hover:text-navy transition-colors">
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Debit */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-800 font-semibold text-sm">Debit Cards</h2>
            {!loading && debitCards.length < 2 && (
              <button onClick={() => setShowIssueModal(true)} className="text-[#0072CE] text-xs font-medium hover:text-navy transition-colors">
                + Issue Card
              </button>
            )}
          </div>

          {loading ? (
            <div className="h-44 rounded-2xl shimmer" />
          ) : debitCards.length === 0 ? (
            <EmptyCard type="debit" onIssue={() => setShowIssueModal(true)} />
          ) : (
            <div className="space-y-5">
              {debitCards.map(card => {
                const isNew = newCard?.id === card.id;
                const rev   = revealed[card.id];
                return (
                  <div key={card.id}>
                    <DebitCard
                      card={card}
                      ownerName={user?.fullName}
                      cvv={isNew ? newCard.cvv : rev?.cvv}
                      fullCardNumber={isNew ? newCard.fullNumber : rev?.fullNumber}
                    />
                    <CardActions
                      card={card}
                      revealed={!!rev}
                      onReveal={() => handleReveal(card.id)}
                      onToggle={() => toggleFreeze(card.id)}
                    />
                    {rev && (
                      <SensitivePanel
                        fullNumber={rev.fullNumber}
                        cvv={rev.cvv}
                        expiry={rev.expiry || card.expiry}
                        onHide={() => handleReveal(card.id)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Credit */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-800 font-semibold text-sm">Credit Cards</h2>
            {!loading && creditCards.length < 2 && (
              <button onClick={() => setShowIssueModal(true)} className="text-[#0072CE] text-xs font-medium hover:text-navy transition-colors">
                + Issue Card
              </button>
            )}
          </div>

          {loading ? (
            <div className="h-44 rounded-2xl shimmer" />
          ) : creditCards.length === 0 ? (
            <EmptyCard type="credit" onIssue={() => setShowIssueModal(true)} />
          ) : (
            <div className="space-y-5">
              {creditCards.map(card => {
                const isNew = newCard?.id === card.id;
                const rev   = revealed[card.id];
                return (
                  <div key={card.id}>
                    <CreditCard
                      card={card}
                      ownerName={user?.fullName}
                      cvv={isNew ? newCard.cvv : rev?.cvv}
                      fullCardNumber={isNew ? newCard.fullNumber : rev?.fullNumber}
                    />
                    <CardActions
                      card={card}
                      revealed={!!rev}
                      onReveal={() => handleReveal(card.id)}
                      onToggle={() => toggleFreeze(card.id)}
                    />
                    {rev && (
                      <SensitivePanel
                        fullNumber={rev.fullNumber}
                        cvv={rev.cvv}
                        expiry={rev.expiry || card.expiry}
                        onHide={() => handleReveal(card.id)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <IssueCardModal
        open={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        onIssue={handleIssue}
        issuing={issuing}
        debitCount={debitCards.length}
        creditCount={creditCards.length}
      />

      {pinModalCardId && (
        <PinModal
          cardId={pinModalCardId}
          onSuccess={handlePinSuccess}
          onClose={() => setPinModalCardId(null)}
        />
      )}
    </div>
  );
}

function CardActions({ card, revealed, onReveal, onToggle }) {
  const frozen = card.status === 'frozen';
  return (
    <div className="flex gap-2 mt-3">
      <button
        onClick={onReveal}
        className={`flex-1 text-xs py-2.5 rounded-lg border transition-all flex items-center justify-center gap-1.5 font-medium ${
          revealed
            ? 'bg-[#EEF4FF] text-navy border-navy/20 hover:bg-[#E0EAFF]'
            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'
        }`}
      >
        {revealed ? <><EyeOffIcon /><span>Hide Details</span></> : <><EyeIcon /><span>Show Details</span></>}
      </button>

      <button
        onClick={onToggle}
        className={`flex-1 text-xs py-2.5 rounded-lg border transition-all font-medium ${
          frozen
            ? 'bg-emerald-50 text-bank-green border-emerald-200 hover:bg-emerald-100'
            : 'bg-white text-gray-500 border-gray-200 hover:bg-red-50 hover:text-bank-red hover:border-red-200'
        }`}
      >
        {frozen ? '▶ Unfreeze Card' : '⏸ Freeze Card'}
      </button>
    </div>
  );
}

function SensitivePanel({ fullNumber, cvv, expiry, onHide }) {
  const [copied, setCopied] = useState(null);

  const copy = async (text, label) => {
    try { await navigator.clipboard.writeText(text); } catch {
      const el = document.createElement('textarea');
      el.value = text; document.body.appendChild(el); el.select();
      document.execCommand('copy'); document.body.removeChild(el);
    }
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="mt-2 bank-card p-4 animate-fade-up border-l-4 border-l-bank-amber">
      <div className="flex items-center justify-between mb-3">
        <p className="section-label">Sensitive card details</p>
        <button onClick={onHide} className="text-gray-400 hover:text-gray-600 transition-colors">
          <XIcon />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <DetailField
          label="Full Number"
          value={fullNumber || '— not available —'}
          mono
          onCopy={fullNumber ? () => copy(fullNumber, 'number') : null}
          copied={copied === 'number'}
        />
        <DetailField
          label="Expires"
          value={expiry || '—'}
          mono
          onCopy={expiry ? () => copy(expiry, 'expiry') : null}
          copied={copied === 'expiry'}
        />
        <DetailField
          label="CVV"
          value={cvv || '—'}
          mono
          onCopy={cvv ? () => copy(cvv, 'cvv') : null}
          copied={copied === 'cvv'}
        />
      </div>

      <p className="text-gray-400 text-[10px] mt-3 text-center">
        Never share these details. Hide when done.
      </p>
    </div>
  );
}

function DetailField({ label, value, mono, onCopy, copied }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
      <p className="text-gray-400 text-[9px] uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-center justify-between gap-1">
        <p className={`text-gray-800 text-xs ${mono ? 'font-mono' : ''} truncate`}>{value}</p>
        {onCopy && (
          <button
            onClick={onCopy}
            className={`shrink-0 transition-colors ${copied ? 'text-bank-green' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyCard({ type, onIssue }) {
  return (
    <button
      onClick={onIssue}
      className="w-full h-44 rounded-2xl border-2 border-dashed border-gray-200
                 flex flex-col items-center justify-center gap-2 text-gray-300
                 hover:border-[#0072CE]/40 hover:text-[#0072CE]/50 transition-all"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
      <span className="text-xs font-medium">Issue {type} card</span>
    </button>
  );
}

function XIcon()      { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function EyeIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function EyeOffIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>; }
function CopyIcon()   { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>; }
function CheckIcon()  { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
