import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { transactionAPI, cardAPI, statementAPI, accountAPI } from '../api';
import { formatCurrency } from '../utils/formatters';
import SendMoneyModal    from '../components/modals/SendMoneyModal';
import ReceiveMoneyModal from '../components/modals/ReceiveMoneyModal';
import TransactionList   from '../components/transactions/TransactionList';
import DebitCard         from '../components/cards/DebitCard';
import CreditCard        from '../components/cards/CreditCard';
import toast from 'react-hot-toast';

// ── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (target == null || isNaN(target)) return;
    const from = prev.current;
    prev.current = target;
    let raf; let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setValue(from + (target - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
      else setValue(target);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

const GREETING = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

export default function Dashboard() {
  const { user, account, primaryChecking, primarySavings, refreshAccount } = useAuth();
  const navigate = useNavigate();

  const [txData,         setTxData]         = useState({ transactions: [], pagination: {} });
  const [txLoad,         setTxLoad]         = useState(true);
  const [showSend,       setShowSend]       = useState(false);
  const [showReceive,    setShowReceive]    = useState(false);
  const [showMoveMoney,  setShowMoveMoney]  = useState(false);
  const [openingSavings, setOpeningSavings] = useState(false);

  const [cards,      setCards]      = useState([]);
  const [activeCard, setActiveCard] = useState(null);
  const [cardsLoad,  setCardsLoad]  = useState(true);

  const loadTransactions = async () => {
    try {
      setTxLoad(true);
      const { data } = await transactionAPI.getMine();
      setTxData(data.data);
    } catch { /* silent */ }
    finally  { setTxLoad(false); }
  };

  const loadCards = async () => {
    try {
      setCardsLoad(true);
      const { data } = await cardAPI.getAll();
      const fetched = data.data.cards || [];
      setCards(fetched);
      if (fetched.length > 0) {
        setActiveCard(prev =>
          prev ? (fetched.find(c => c.id === prev.id) ?? fetched[fetched.length - 1])
               : fetched[fetched.length - 1]
        );
      } else setActiveCard(null);
    } catch { /* silent */ }
    finally { setCardsLoad(false); }
  };

  useEffect(() => { loadTransactions(); loadCards(); }, []);

  const handleSendSuccess = () => { refreshAccount(); loadTransactions(); toast.success('Transfer sent!'); };

  const handleOpenSavings = async () => {
    setOpeningSavings(true);
    try {
      await accountAPI.createSavings();
      await refreshAccount();
      toast.success('Savings account opened!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to open savings account');
    } finally {
      setOpeningSavings(false);
    }
  };

  // Use primaryChecking as the main "account" — fallback to legacy account
  const checking = primaryChecking || account;
  const savings  = primarySavings;

  const checkingBalance = checking?.ledgerBalance ?? null;
  const savingsBalance  = savings?.ledgerBalance  ?? null;
  const totalBalance    = (checkingBalance ?? 0) + (savingsBalance ?? 0);
  const pending         = checking?.pendingBalance ?? 0;
  const available       = checking?.availableBalance ?? checkingBalance;

  const totalSent = useMemo(() => (
    txData.transactions
      .filter(t => {
        const thisMonth = new Date().getMonth();
        return new Date(t.createdAt).getMonth() === thisMonth
          && (t.type === 'transfer' || t.type === 'debit');
      })
      .reduce((s, t) => s + parseFloat(t.amount), 0)
  ), [txData.transactions]);

  const animatedTotal    = useCountUp(totalBalance ?? 0);
  const animatedChecking = useCountUp(checkingBalance ?? 0);
  const animatedSavings  = useCountUp(savingsBalance ?? 0);

  const handleStatementDownload = async () => {
    try {
      const { data } = await statementAPI.download();
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url; a.download = 'statement.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Statement download not available yet'); }
  };

  const canTransact = checking?.status === 'active';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">

      {/* ── Greeting ────────────────────────────────────────────────────────── */}
      <div className="mb-6 animate-fade-up">
        <h1 className="text-gray-900 font-bold text-2xl">
          {GREETING()}, {user?.firstName || user?.fullName?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here's your financial overview</p>
      </div>

      {/* ── Combined balance hero ────────────────────────────────────────────── */}
      <div className="bank-card p-6 mb-4 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-start justify-between gap-4 mb-1">
          <div className="flex-1 min-w-0">
            <p className="section-label mb-2">Total Balance</p>
            <p className="amount-display text-gray-900 font-bold text-4xl leading-none">
              {totalBalance != null ? formatCurrency(animatedTotal) : '—'}
            </p>
          </div>
          <AccountStatusBadge status={checking?.status} />
        </div>

        {pending > 0 && (
          <p className="text-bank-amber text-xs mt-2 font-medium">
            + {formatCurrency(pending)} pending
          </p>
        )}

        {/* Checking + Savings breakdown */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <AccountCard
            label="Checking"
            balance={checkingBalance}
            animated={animatedChecking}
            accountNumber={checking?.maskedAccountNumber}
            status={checking?.status}
            active
          />
          {savings ? (
            <AccountCard
              label="Savings"
              balance={savingsBalance}
              animated={animatedSavings}
              accountNumber={savings?.maskedAccountNumber}
              status={savings?.status}
            />
          ) : (
            <button
              onClick={handleOpenSavings}
              disabled={openingSavings}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200
                         text-gray-400 hover:border-[#0072CE]/40 hover:text-[#0072CE] transition-all p-4 min-h-[90px]"
            >
              {openingSavings ? (
                <Spinner />
              ) : (
                <>
                  <PlusCircleIcon />
                  <span className="text-xs font-medium text-center leading-tight">Open Savings Account</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Quick actions ────────────────────────────────────────────────────── */}
      <div className="flex gap-3 overflow-x-auto pb-1 mb-5 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none animate-fade-up"
           style={{ animationDelay: '0.08s' }}>
        {[
          { label: 'Send',       icon: <SendIcon />,    onClick: () => canTransact ? setShowSend(true) : toast.error('Account is frozen') },
          { label: 'Receive',    icon: <ReceiveIcon />, onClick: () => canTransact ? setShowReceive(true) : toast.error('Account is frozen') },
          savings
            ? { label: 'Move Money', icon: <MoveIcon />,  onClick: () => canTransact ? setShowMoveMoney(true) : toast.error('Account is frozen') }
            : { label: 'Open Savings', icon: <PiggyIcon />, onClick: handleOpenSavings },
          { label: 'History',    icon: <HistoryIcon />, onClick: () => navigate('/transactions') },
          { label: 'Analytics',  icon: <AnalyticsIcon />, onClick: () => navigate('/analytics') },
        ].map(({ label, icon, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="flex flex-col items-center gap-1.5 min-w-[68px] bg-white rounded-xl border border-gray-200
                       py-3 px-2 hover:border-[#0072CE]/40 hover:bg-[#F0F7FF] hover:shadow-card transition-all shrink-0"
          >
            <div className="w-9 h-9 rounded-full bg-[#EEF4FF] flex items-center justify-center text-navy">
              {icon}
            </div>
            <span className="text-[11px] font-medium text-gray-600 whitespace-nowrap">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Two-column layout ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Left: transactions */}
        <div className="xl:col-span-2 space-y-5">

          <div className="grid grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: '0.12s' }}>
            <StatPill label="Sent this month" value={formatCurrency(totalSent)} color="red" />
            <StatPill label="Transactions"    value={txData.pagination.total ?? 0} />
            <StatPill label="Account"
              value={checking?.status === 'active' ? 'Active' : (checking?.status || '—')}
              color={checking?.status === 'active' ? 'green' : 'red'} />
          </div>

          <div className="bank-card overflow-hidden animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-gray-800 font-semibold text-sm">Recent Transactions</h2>
              <button onClick={() => navigate('/transactions')}
                className="text-[#0072CE] text-xs font-medium hover:text-[#003087] transition-colors">
                View all →
              </button>
            </div>
            <div className="p-2">
              <TransactionList
                transactions={txData.transactions.slice(0, 8)}
                loading={txLoad}
                accountNumber={checking?.accountNumber}
              />
            </div>
          </div>
        </div>

        {/* Right: card + account details */}
        <div className="space-y-5">

          {/* Card carousel */}
          <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="section-label">
                {activeCard
                  ? `${(activeCard.cardType || activeCard.type || 'debit').toUpperCase()} Card`
                  : 'Your Card'}
              </p>
              {cards.length > 1 && (
                <div className="flex items-center gap-1.5">
                  {cards.map(c => (
                    <button key={c.id} onClick={() => setActiveCard(c)}
                      className={`rounded-full transition-all duration-200 ${
                        activeCard?.id === c.id ? 'w-4 h-1.5 bg-navy' : 'w-1.5 h-1.5 bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {cardsLoad ? (
              <div className="w-full h-44 rounded-2xl shimmer" />
            ) : !activeCard ? (
              <button
                onClick={() => navigate('/cards')}
                className="w-full h-44 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col
                           items-center justify-center gap-2 text-gray-300
                           hover:border-[#0072CE]/40 hover:text-[#0072CE]/50 transition-all"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                <span className="text-xs font-medium">Issue your first card</span>
              </button>
            ) : (activeCard.cardType || activeCard.type) === 'credit' ? (
              <CreditCard card={activeCard} ownerName={user?.fullName} />
            ) : (
              <DebitCard  card={activeCard} ownerName={user?.fullName} />
            )}
          </div>

          {/* Account details */}
          <div className="bank-card p-5 animate-fade-up" style={{ animationDelay: '0.18s' }}>
            <p className="section-label mb-3">Checking Account</p>
            <div className="space-y-2.5">
              <InfoRow label="Account #" value={checking?.accountNumber || '—'} mono />
              <InfoRow label="Routing #"  value={checking?.routingNumber  || '026009593'} mono />
              <InfoRow label="Currency"   value={checking?.currency       || 'USD'} />
              <InfoRow label="Status"
                value={checking?.status || '—'}
                valueClass={`capitalize font-medium ${checking?.status === 'active' ? 'text-bank-green' : 'text-bank-red'}`}
              />
            </div>
            <button
              onClick={handleStatementDownload}
              className="w-full mt-4 py-2.5 rounded-xl text-xs font-medium text-navy border border-navy/20
                         bg-[#EEF4FF] hover:bg-[#E0EAFF] transition-colors flex items-center justify-center gap-1.5"
            >
              <DownloadIcon /> Download Statement
            </button>
          </div>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────────── */}
      {showSend && (
        <SendMoneyModal
          account={checking}
          onClose={() => setShowSend(false)}
          onSuccess={handleSendSuccess}
        />
      )}
      {showReceive && (
        <ReceiveMoneyModal
          account={checking}
          onClose={() => setShowReceive(false)}
        />
      )}
      {showMoveMoney && checking && savings && (
        <MoveMoneyModal
          checking={checking}
          savings={savings}
          onClose={() => setShowMoveMoney(false)}
          onSuccess={() => { refreshAccount(); loadTransactions(); setShowMoveMoney(false); }}
        />
      )}
    </div>
  );
}

// ── Account balance card ───────────────────────────────────────────────────────
function AccountCard({ label, balance, animated, accountNumber, status, active }) {
  return (
    <div className={`rounded-xl p-4 border ${active ? 'bg-navy text-white border-navy' : 'bg-gray-50 border-gray-100'}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ${active ? 'text-white/60' : 'text-gray-500'}`}>
        {label}
      </p>
      <p className={`amount-display font-bold text-lg leading-none mb-2 ${active ? 'text-white' : 'text-gray-800'}`}>
        {balance != null ? formatCurrency(animated) : '—'}
      </p>
      <p className={`font-mono text-[10px] truncate ${active ? 'text-white/40' : 'text-gray-400'}`}>
        {accountNumber || '—'}
      </p>
    </div>
  );
}

// ── Move Money Modal ──────────────────────────────────────────────────────────
function MoveMoneyModal({ checking, savings, onClose, onSuccess }) {
  const [direction, setDirection] = useState('to-savings'); // 'to-savings' | 'to-checking'
  const [amount,    setAmount]    = useState('');
  const [note,      setNote]      = useState('');
  const [loading,   setLoading]   = useState(false);

  const from = direction === 'to-savings' ? checking : savings;
  const to   = direction === 'to-savings' ? savings  : checking;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return toast.error('Enter a valid amount');
    setLoading(true);
    try {
      await accountAPI.internalTransfer(from.id, to.id, parsed, note || undefined);
      toast.success(`Moved ${formatCurrency(parsed)} to ${to.nickname}`);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full sm:max-w-sm bg-white sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-card-lg">

        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EEF4FF] flex items-center justify-center text-navy">
              <MoveIcon size={15} />
            </div>
            <p className="font-semibold text-gray-800 text-sm">Move Money</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
            <XIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Direction toggle */}
          <div className="bg-gray-100 rounded-xl p-1 flex gap-1">
            {[
              { val: 'to-savings',  label: 'To Savings'  },
              { val: 'to-checking', label: 'To Checking' },
            ].map(({ val, label }) => (
              <button key={val} type="button" onClick={() => setDirection(val)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  direction === val ? 'bg-white text-navy shadow-sm' : 'text-gray-500'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* From → To summary */}
          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">From</p>
                <p className="font-semibold text-gray-800 mt-0.5">{from.nickname}</p>
                <p className="text-gray-400 font-mono">{from.maskedAccountNumber}</p>
                <p className="text-[#0072CE] font-semibold mt-1">{formatCurrency(from.ledgerBalance)} available</p>
              </div>
              <div className="text-gray-300 text-lg">→</div>
              <div className="text-right">
                <p className="text-gray-400">To</p>
                <p className="font-semibold text-gray-800 mt-0.5">{to.nickname}</p>
                <p className="text-gray-400 font-mono">{to.maskedAccountNumber}</p>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">Amount</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
              <input
                type="number" min="0.01" step="0.01"
                className="input-base pl-7"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">Note (optional)</label>
            <input type="text" className="input-base" placeholder="e.g. Monthly savings"
              value={note} onChange={e => setNote(e.target.value)} maxLength={100} />
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <><Spinner size={14} /> Moving…</> : `Move ${amount ? formatCurrency(parseFloat(amount)) : 'Money'}`}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────
function AccountStatusBadge({ status }) {
  if (!status) return null;
  const frozen = status === 'frozen';
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
      frozen ? 'bg-red-50 text-bank-red border-red-200' : 'bg-emerald-50 text-bank-green border-emerald-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${frozen ? 'bg-bank-red' : 'bg-bank-green'}`} />
      {frozen ? 'Frozen' : 'Active'}
    </span>
  );
}

function StatPill({ label, value, color }) {
  const colClass = color === 'red' ? 'text-bank-red' : color === 'green' ? 'text-bank-green' : 'text-navy';
  return (
    <div className="bank-card px-3 py-3 text-center">
      <p className={`font-bold text-base ${colClass} amount-display`}>{value}</p>
      <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

function InfoRow({ label, value, mono, valueClass }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className={`text-xs text-right truncate ${mono ? 'font-mono text-gray-600' : 'text-gray-700'} ${valueClass || ''}`}>{value}</span>
    </div>
  );
}

function Spinner({ size = 14 }) {
  return <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9"/></svg>;
}
function XIcon()       { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function SendIcon()    { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>; }
function ReceiveIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>; }
function HistoryIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
function AnalyticsIcon(){ return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>; }
function MoveIcon({ size = 17 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>; }
function PiggyIcon()  { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2z"/><path d="M2 9v1a2 2 0 002 2h1"/><path d="M16 11h0"/></svg>; }
function PlusCircleIcon(){ return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>; }
function CardIcon()    { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>; }
function DownloadIcon(){ return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
