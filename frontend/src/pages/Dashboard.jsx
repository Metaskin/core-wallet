import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { transactionAPI, cardAPI, statementAPI } from '../api';
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
    let raf;
    let start = null;
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
  const { user, account, refreshAccount } = useAuth();
  const navigate = useNavigate();

  const [txData,      setTxData]      = useState({ transactions: [], pagination: {} });
  const [txLoad,      setTxLoad]      = useState(true);
  const [showSend,    setShowSend]    = useState(false);
  const [showReceive, setShowReceive] = useState(false);

  const [cards,      setCards]      = useState([]);
  const [activeCard, setActiveCard] = useState(null);
  const [cardsLoad,  setCardsLoad]  = useState(true);

  const loadTransactions = async () => {
    try {
      setTxLoad(true);
      const { data } = await transactionAPI.getMine();
      setTxData(data.data);
    } catch { /* silent — empty state shown */ }
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

  // Totals
  const ledger    = account?.ledgerBalance    ?? null;
  const available = account?.availableBalance ?? null;
  const pending   = account?.pendingBalance   ?? 0;

  const pendingCreditSum = useMemo(() => (
    txData.transactions
      .filter(t => t.status === 'pending' && t.type === 'credit')
      .reduce((s, t) => s + parseFloat(t.amount), 0)
  ), [txData.transactions]);

  const displayTotal = ledger != null ? ledger + pendingCreditSum : null;

  const totalSent = useMemo(() => (
    txData.transactions
      .filter(t => {
        const thisMonth = new Date().getMonth();
        return new Date(t.createdAt).getMonth() === thisMonth
          && (t.type === 'transfer' || t.type === 'debit')
          && t.sender?.accountNumber === account?.accountNumber;
      })
      .reduce((s, t) => s + parseFloat(t.amount), 0)
  ), [txData.transactions, account]);

  const animatedBalance   = useCountUp(displayTotal ?? 0);
  const animatedAvailable = useCountUp(available ?? 0);

  const availPct = displayTotal > 0 ? Math.min(100, ((available ?? 0) / displayTotal) * 100) : 0;

  const handleStatementDownload = async () => {
    try {
      const { data } = await statementAPI.download();
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'statement.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Statement download not available yet');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">

      {/* ── Greeting ────────────────────────────────────────────────────────── */}
      <div className="mb-6 animate-fade-up">
        <h1 className="text-gray-900 font-bold text-2xl">
          {GREETING()}, {user?.firstName || user?.fullName?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here's your financial overview</p>
      </div>

      {/* ── Balance hero ─────────────────────────────────────────────────────── */}
      <div className="bank-card p-6 mb-5 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-start justify-between gap-4 mb-1">
          <div className="flex-1 min-w-0">
            <p className="section-label mb-2">Total Balance</p>
            <p className="amount-display text-gray-900 font-bold text-4xl leading-none">
              {displayTotal != null ? formatCurrency(animatedBalance) : '—'}
            </p>
          </div>
          <AccountStatusBadge status={account?.status} />
        </div>

        {/* Available / Pending */}
        <div className="flex flex-wrap items-center gap-5 mt-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Available</p>
            <p className="amount-display text-sm font-semibold text-bank-green">
              {available != null ? formatCurrency(animatedAvailable) : '—'}
            </p>
          </div>
          {pending > 0 && (
            <div className="group relative">
              <p className="text-xs text-gray-500 mb-0.5">Pending</p>
              <p className="amount-display text-sm font-semibold text-bank-amber cursor-help">
                {formatCurrency(pending)}
              </p>
              <div className="absolute bottom-full left-0 mb-2 w-56 bg-gray-900 text-white text-xs rounded-lg px-3 py-2
                              opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10 shadow-lg">
                Pending funds are processing and may take 1–3 business days to clear.
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-[#0072CE] rounded-full transition-all duration-1000"
            style={{ width: `${availPct}%` }}
          />
        </div>

        {/* Account info row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
          <span className="font-mono">{account?.maskedAccountNumber || '—'}</span>
          <span>·</span>
          <span>{account?.currency || 'USD'}</span>
          <span>·</span>
          <span className={account?.status === 'frozen' ? 'text-bank-red font-medium' : 'text-bank-green font-medium capitalize'}>
            {account?.status || 'Active'}
          </span>
        </div>
      </div>

      {/* ── Quick actions ────────────────────────────────────────────────────── */}
      <div className="flex gap-3 overflow-x-auto pb-1 mb-5 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none animate-fade-up"
           style={{ animationDelay: '0.08s' }}>
        {[
          { label: 'Send',      icon: <SendIcon />,    onClick: () => account?.status === 'active' ? setShowSend(true) : toast.error('Account is frozen') },
          { label: 'Receive',   icon: <ReceiveIcon />, onClick: () => account?.status === 'active' ? setShowReceive(true) : toast.error('Account is frozen') },
          { label: 'History',   icon: <HistoryIcon />, onClick: () => navigate('/transactions') },
          { label: 'Analytics', icon: <AnalyticsIcon />, onClick: () => navigate('/analytics') },
          { label: 'Cards',     icon: <CardIcon />,    onClick: () => navigate('/cards') },
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

          {/* Stat pills */}
          <div className="grid grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: '0.12s' }}>
            <StatPill label="Sent this month" value={formatCurrency(totalSent)} color="red" />
            <StatPill label="Transactions"    value={txData.pagination.total ?? 0} />
            <StatPill label="Account"
              value={account?.status === 'active' ? 'Active' : (account?.status || '—')}
              color={account?.status === 'active' ? 'green' : 'red'} />
          </div>

          {/* Recent transactions */}
          <div className="bank-card overflow-hidden animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-gray-800 font-semibold text-sm">Recent Transactions</h2>
              <button
                onClick={() => navigate('/transactions')}
                className="text-[#0072CE] text-xs font-medium hover:text-[#003087] transition-colors"
              >
                View all →
              </button>
            </div>
            <div className="p-2">
              <TransactionList
                transactions={txData.transactions.slice(0, 8)}
                loading={txLoad}
                accountNumber={account?.accountNumber}
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
              <NoCardPlaceholder onNavigate={() => navigate('/cards')} />
            ) : (activeCard.cardType === 'credit' || activeCard.type === 'credit') ? (
              <CreditCard card={activeCard} />
            ) : (
              <DebitCard card={activeCard} ownerName={user?.fullName} />
            )}

            {!cardsLoad && cards.length > 0 && (
              <button
                onClick={() => navigate('/cards')}
                className="w-full mt-3 text-xs text-gray-400 hover:text-[#0072CE] transition-colors py-1"
              >
                Manage cards →
              </button>
            )}
          </div>

          {/* Account details */}
          <div className="bank-card p-5 animate-fade-up" style={{ animationDelay: '0.18s' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-label">Account Details</h3>
              <div className="flex items-center gap-1 text-[10px] text-bank-green font-medium">
                <ShieldCheckIcon />
                Secure
              </div>
            </div>
            <div className="space-y-3">
              <InfoRow label="Account No."    value={account?.accountNumber || '—'} mono />
              <InfoRow label="Currency"       value={account?.currency || 'USD'} />
              <InfoRow label="Status"         value={account?.status || '—'} capitalize
                color={account?.status === 'active' ? 'green' : account?.status === 'frozen' ? 'red' : undefined} />
              <div className="border-t border-gray-100 pt-3 space-y-3">
                <InfoRow label="Ledger Balance"
                  value={ledger != null ? formatCurrency(ledger) : '—'} mono />
                <InfoRow label="Available"
                  value={available != null ? formatCurrency(available) : '—'} mono color="green" />
              </div>
            </div>
            <button
              onClick={handleStatementDownload}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium
                         text-navy border border-navy/20 hover:bg-navy/5 transition-colors"
            >
              <DownloadIcon />
              Download Statement
            </button>
          </div>

          {/* Monthly spend */}
          <div className="bank-card p-5 animate-fade-up" style={{ animationDelay: '0.22s' }}>
            <h3 className="section-label mb-4">Monthly Spend</h3>
            <div className="flex items-center gap-4">
              <SpendRing spent={totalSent} total={displayTotal || 1} />
              <div>
                <p className="amount-display text-gray-900 font-bold text-lg">{formatCurrency(totalSent)}</p>
                <p className="text-gray-400 text-xs mt-0.5">sent this month</p>
                <button
                  onClick={() => navigate('/analytics')}
                  className="text-[#0072CE] text-xs font-medium hover:text-navy transition-colors mt-2 block"
                >
                  View Report →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {showSend && account && (
        <SendMoneyModal account={account} onClose={() => setShowSend(false)} onSuccess={handleSendSuccess} />
      )}
      <ReceiveMoneyModal account={account} open={showReceive} onClose={() => setShowReceive(false)} />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NoCardPlaceholder({ onNavigate }) {
  return (
    <button
      onClick={onNavigate}
      className="w-full h-44 rounded-2xl border-2 border-dashed border-gray-200
                 flex flex-col items-center justify-center gap-2 text-gray-300
                 hover:border-[#0072CE]/40 hover:text-[#0072CE]/50 transition-all"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
      <span className="text-xs font-medium">Issue your first card</span>
    </button>
  );
}

function StatPill({ label, value, color }) {
  const colorMap = { red: 'text-bank-red', green: 'text-bank-green' };
  return (
    <div className="bank-card p-3">
      <p className="section-label mb-1.5">{label}</p>
      <p className={`font-semibold text-sm amount-display ${colorMap[color] || 'text-gray-800'}`}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value, mono, capitalize, color }) {
  const colorClass = color === 'green' ? 'text-bank-green'
                   : color === 'red'   ? 'text-bank-red'
                   : 'text-gray-800';
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400 text-xs">{label}</span>
      <span className={`text-xs font-medium ${colorClass} ${mono ? 'font-mono' : ''} ${capitalize ? 'capitalize' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function AccountStatusBadge({ status }) {
  if (!status) return null;
  const map = {
    active: 'bg-emerald-50 text-bank-green border-emerald-200',
    frozen: 'bg-red-50 text-bank-red border-red-200',
    closed: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize shrink-0 ${map[status] || map.active}`}>
      {status}
    </span>
  );
}

function SpendRing({ spent, total }) {
  const pct = Math.min(100, (spent / Math.max(total, 1)) * 100);
  const r = 22, circ = 2 * Math.PI * r;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="#E5E7EB" strokeWidth="4"/>
      <circle cx="28" cy="28" r={r} fill="none" stroke="#0072CE" strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
        strokeLinecap="round" transform="rotate(-90 28 28)" className="transition-all duration-700"/>
    </svg>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function SendIcon()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>; }
function ReceiveIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"/></svg>; }
function HistoryIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
function AnalyticsIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>; }
function CardIcon()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>; }
function DownloadIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function ShieldCheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  );
}
