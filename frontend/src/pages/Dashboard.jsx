import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { transactionAPI, cardAPI } from '../api';
import { formatCurrency, maskAccountNumber } from '../utils/formatters';
import SendMoneyModal from '../components/modals/SendMoneyModal';
import ReceiveMoneyModal from '../components/modals/ReceiveMoneyModal';
import TransactionList from '../components/transactions/TransactionList';
import DebitCard from '../components/cards/DebitCard';
import CreditCard from '../components/cards/CreditCard';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user, account, refreshAccount } = useAuth();
  const navigate = useNavigate();

  const [txData,      setTxData]      = useState({ transactions: [], pagination: {} });
  const [txLoad,      setTxLoad]      = useState(true);
  const [showSend,    setShowSend]    = useState(false);
  const [showReceive, setShowReceive] = useState(false);

  // ── Card state ──────────────────────────────────────────────────────────────
  const [cards,      setCards]      = useState([]);
  const [activeCard, setActiveCard] = useState(null);
  const [cardsLoad,  setCardsLoad]  = useState(true);

  // ── Data loaders ────────────────────────────────────────────────────────────
  const loadTransactions = async () => {
    try {
      setTxLoad(true);
      const { data } = await transactionAPI.getMine();
      setTxData(data.data);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setTxLoad(false);
    }
  };

  const loadCards = async () => {
    try {
      setCardsLoad(true);
      const { data } = await cardAPI.getAll();
      const fetched = data.data.cards || [];
      setCards(fetched);
      // Auto-select newest (last in list) or keep current selection
      if (fetched.length > 0) {
        setActiveCard(prev =>
          prev ? (fetched.find(c => c.id === prev.id) ?? fetched[fetched.length - 1])
               : fetched[fetched.length - 1]
        );
      } else {
        setActiveCard(null);
      }
    } catch {
      // silent — card section shows empty state
    } finally {
      setCardsLoad(false);
    }
  };

  useEffect(() => {
    loadTransactions();
    loadCards();
  }, []);

  const handleSendSuccess = () => {
    refreshAccount();
    loadTransactions();
    toast.success('Transfer sent!');
  };

  // Spend summary: total sent this month
  const totalSent = txData.transactions
    .filter(t => {
      const thisMonth = new Date().getMonth();
      return new Date(t.createdAt).getMonth() === thisMonth
        && (t.type === 'transfer' || t.type === 'debit')
        && t.sender?.accountNumber === account?.accountNumber;
    })
    .reduce((s, t) => s + parseFloat(t.amount), 0);

  const ledger    = account?.ledgerBalance    ?? account?.balance ?? null;
  const available = account?.availableBalance ?? account?.balance ?? null;

  // Sum pending incoming (credit) transactions not yet settled into ledger.
  // Strictly type==='credit' to exclude outgoing transfers; status==='pending' to
  // exclude completed/failed. These are not in `ledger` so there is no double-count.
  const pendingCreditSum = txData.transactions
    .filter(t => t.status === 'pending' && t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const displayTotal = ledger != null ? ledger + pendingCreditSum : null;

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Greeting */}
      <div className="mb-8 animate-fade-up">
        <h1 className="text-white font-bold text-2xl font-display">
          Good {timeOfDay()}, {user?.fullName?.split(' ')[0]} 👋
        </h1>
        <p className="text-white/40 text-sm mt-1">Here's your financial overview</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Left column ── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Balance card */}
          <div className="glass rounded-2xl p-6 animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Total Balance</p>
                <p className="amount-display text-white font-bold text-4xl">
                  {displayTotal != null ? formatCurrency(displayTotal) : '—'}
                </p>
              </div>
              <StatusBadge status={account?.status} />
            </div>

            {/* Available balance pill */}
            <div className="flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2.5 mt-4 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-white/40 text-xs">Available to spend</span>
              </div>
              <span className="amount-display text-emerald-400 font-semibold text-sm">
                {available != null ? formatCurrency(available) : '—'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-white/30 mb-6">
              <span className="font-mono">{account ? maskAccountNumber(account.accountNumber) : '—'}</span>
              <span>·</span>
              <span>{account?.currency || 'USD'}</span>
            </div>

            {/* Stat row */}
            <div className="grid grid-cols-3 gap-3">
              <StatPill label="Sent this month" value={formatCurrency(totalSent)} color="red" />
              <StatPill label="Transactions"    value={txData.pagination.total || 0} />
              <StatPill label="Account"         value={account?.status === 'active' ? 'Active' : 'Frozen'}
                        color={account?.status === 'active' ? 'green' : 'red'} />
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex gap-3 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <button
              onClick={() => account?.status === 'active' ? setShowSend(true) : toast.error('Account is frozen')}
              className="btn-primary flex-1 h-12"
            >
              <SendIcon /> Send Money
            </button>
            <button
              onClick={() => account?.status === 'active' ? setShowReceive(true) : toast.error('Account is frozen')}
              className="btn-ghost flex-1 h-12 border border-white/10"
            >
              <ReceiveIcon /> Receive
            </button>
            <button
              onClick={() => navigate('/transactions')}
              className="btn-ghost flex-1 h-12 border border-white/10"
            >
              <HistoryIcon /> History
            </button>
          </div>

          {/* Recent transactions */}
          <div className="glass rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-white font-semibold">Recent Transactions</h2>
              <span className="text-white/30 text-xs">{txData.pagination.total || 0} total</span>
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

        {/* ── Right column ── */}
        <div className="space-y-5">

          {/* Card carousel */}
          <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-white/40 text-xs uppercase tracking-wider">
                {activeCard
                  ? `${(activeCard.cardType || activeCard.type || 'debit').toUpperCase()} Card`
                  : 'Your Card'}
              </p>

              {/* Dot selector — only when multiple cards */}
              {cards.length > 1 && (
                <div className="flex items-center gap-1.5">
                  {cards.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setActiveCard(c)}
                      className={`rounded-full transition-all duration-200 ${
                        activeCard?.id === c.id
                          ? 'w-4 h-1.5 bg-accent'
                          : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {cardsLoad ? (
              <div className="w-full max-w-sm h-44 rounded-2xl shimmer" />
            ) : !activeCard ? (
              <NoCardPlaceholder onNavigate={() => navigate('/cards')} />
            ) : (activeCard.cardType === 'credit' || activeCard.type === 'credit') ? (
              <CreditCard card={activeCard} />
            ) : (
              <DebitCard card={activeCard} ownerName={user?.fullName} />
            )}

            {/* Manage link */}
            {!cardsLoad && cards.length > 0 && (
              <button
                onClick={() => navigate('/cards')}
                className="w-full mt-3 text-xs text-white/30 hover:text-accent transition-colors py-1"
              >
                Manage cards →
              </button>
            )}
          </div>

          {/* Account info */}
          <div className="glass rounded-2xl p-5 animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <h3 className="text-white/40 text-xs uppercase tracking-wider mb-4">Account Details</h3>
            <div className="space-y-3">
              <InfoRow label="Account No." value={account?.accountNumber || '—'} mono />
              <InfoRow label="Currency"    value={account?.currency || 'USD'} />
              <InfoRow label="Status"      value={account?.status || '—'} capitalize />
              <div className="border-t border-white/[0.05] pt-3 space-y-3">
                <InfoRow
                  label="Ledger Balance"
                  value={ledger != null ? formatCurrency(ledger) : '—'}
                  mono
                />
                <InfoRow
                  label="Available"
                  value={available != null ? formatCurrency(available) : '—'}
                  mono
                  color="green"
                />
              </div>
            </div>
          </div>

          {/* Spending ring */}
          <div className="glass rounded-2xl p-5 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-white/40 text-xs uppercase tracking-wider mb-4">Monthly Spend</h3>
            <div className="flex items-center gap-4">
              <SpendRing spent={totalSent} limit={ledger || 1} />
              <div>
                <p className="text-white font-bold amount-display">{formatCurrency(totalSent)}</p>
                <p className="text-white/30 text-xs">sent this month</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSend && account && (
        <SendMoneyModal
          account={account}
          onClose={() => setShowSend(false)}
          onSuccess={handleSendSuccess}
        />
      )}

      <ReceiveMoneyModal
        account={account}
        open={showReceive}
        onClose={() => setShowReceive(false)}
      />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NoCardPlaceholder({ onNavigate }) {
  return (
    <button
      onClick={onNavigate}
      className="w-full max-w-sm h-44 rounded-2xl border-2 border-dashed border-white/10
                 flex flex-col items-center justify-center gap-2 text-white/20
                 hover:border-accent/30 hover:text-accent/50 transition-all"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
      <span className="text-xs">Issue your first card</span>
    </button>
  );
}

function StatPill({ label, value, color }) {
  const colorMap = { red: 'text-red-400', green: 'text-emerald-400' };
  return (
    <div className="bg-white/[0.03] rounded-xl p-3">
      <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">{label}</p>
      <p className={`font-semibold text-sm amount-display ${colorMap[color] || 'text-white'}`}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value, mono, capitalize, color }) {
  const colorClass = color === 'green'  ? 'text-emerald-400'
                   : color === 'yellow' ? 'text-yellow-400'
                   : 'text-white';
  return (
    <div className="flex justify-between items-center">
      <span className="text-white/30 text-xs">{label}</span>
      <span className={`text-xs font-medium ${colorClass} ${mono ? 'font-mono' : ''} ${capitalize ? 'capitalize' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function SpendRing({ spent, limit }) {
  const pct = Math.min(100, (spent / Math.max(limit, 1)) * 100);
  const r = 22, circ = 2 * Math.PI * r;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
      <circle cx="28" cy="28" r={r} fill="none" stroke="#6366f1" strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
        strokeLinecap="round" transform="rotate(-90 28 28)" className="transition-all duration-700"/>
    </svg>
  );
}

function StatusBadge({ status }) {
  if (!status) return null;
  const styles = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    frozen: 'bg-red-500/10 text-red-400 border-red-500/20',
    closed: 'bg-white/10 text-white/40 border-white/10',
  };
  return (
    <span className={`badge border text-xs capitalize ${styles[status] || styles.active}`}>{status}</span>
  );
}

const timeOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
};

function SendIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>; }
function ReceiveIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"/></svg>; }
function HistoryIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
