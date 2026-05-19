import { useState, useEffect } from 'react';
import { cashbackAPI } from '../api';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

const TIERS = [
  { name: 'Standard',  min: 0,   max: 100,  color: '#6B7280', bg: 'bg-gray-100',    text: 'text-gray-600' },
  { name: 'Silver',    min: 100, max: 250,  color: '#9CA3AF', bg: 'bg-slate-100',   text: 'text-slate-600' },
  { name: 'Gold',      min: 250, max: 500,  color: '#D97706', bg: 'bg-amber-100',   text: 'text-amber-700' },
  { name: 'Platinum',  min: 500, max: null, color: '#7C3AED', bg: 'bg-purple-100',  text: 'text-purple-700' },
];

const TX_COLORS = {
  earned:   'text-bank-green',
  redeemed: 'text-orange-600',
  bonus:    'text-purple-600',
  expired:  'text-gray-400',
};
const TX_BADGES = {
  earned:   'bg-emerald-100 text-emerald-700',
  redeemed: 'bg-orange-100 text-orange-600',
  bonus:    'bg-purple-100 text-purple-700',
  expired:  'bg-gray-100 text-gray-500',
};

const CATEGORIES = [
  { icon: '🛒', label: 'Groceries',       rate: '1%' },
  { icon: '⛽', label: 'Gas',             rate: '1%' },
  { icon: '🛍️', label: 'Online Shopping', rate: '2%' },
  { icon: '💵', label: 'Direct Deposit',  rate: '0.5%' },
];

function currentTier(balance) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (balance >= TIERS[i].min) return TIERS[i];
  }
  return TIERS[0];
}

export default function Cashback() {
  const [overview, setOverview] = useState(null);
  const [txns,     setTxns]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showRedeem, setShowRedeem] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [ovRes, txRes] = await Promise.all([
        cashbackAPI.getOverview(),
        cashbackAPI.getTransactions(),
      ]);
      setOverview(ovRes.data.data);
      setTxns(txRes.data.data?.transactions || txRes.data.data || []);
    } catch {
      toast.error('Failed to load cashback data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const balance      = parseFloat(overview?.balance        || 0);
  const totalEarned  = parseFloat(overview?.totalEarned    || 0);
  const totalRedeemed = parseFloat(overview?.totalRedeemed || 0);
  const tier         = currentTier(balance);
  const nextTier     = TIERS.find(t => t.min > balance);
  const tierProgress = nextTier
    ? Math.min(100, ((balance - tier.min) / (nextTier.min - tier.min)) * 100)
    : 100;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl w-full">
      <div className="mb-6 animate-fade-up">
        <h1 className="text-gray-900 font-bold text-2xl">Cashback Rewards</h1>
        <p className="text-gray-500 text-sm mt-1">Earn rewards on everyday purchases</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-44 rounded-xl shimmer" />
          <div className="h-28 rounded-xl shimmer" />
          <div className="h-40 rounded-xl shimmer" />
        </div>
      ) : (
        <>
          {/* Hero balance card */}
          <div className="bank-card p-6 mb-6 animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="section-label mb-1">Cashback Balance</p>
                <p className="text-bank-green font-bold text-4xl amount-display">{formatCurrency(balance)}</p>
                <span className={`badge mt-2 ${tier.bg} ${tier.text} font-semibold`}>{tier.name}</span>
              </div>
              <button onClick={() => setShowRedeem(true)} className="btn-primary text-sm">
                <GiftIcon /> Redeem
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-gray-100">
              <div>
                <p className="section-label mb-0.5">Total Earned</p>
                <p className="text-gray-900 font-semibold amount-display">{formatCurrency(totalEarned)}</p>
              </div>
              <div>
                <p className="section-label mb-0.5">Total Redeemed</p>
                <p className="text-gray-900 font-semibold amount-display">{formatCurrency(totalRedeemed)}</p>
              </div>
            </div>
          </div>

          {/* Tier progress */}
          <div className="bank-card p-5 mb-6 animate-fade-up" style={{ animationDelay: '0.08s' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-800 font-semibold text-sm">Tier Progress</p>
              <span className={`badge ${tier.bg} ${tier.text}`}>{tier.name}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${tierProgress}%`, backgroundColor: tier.color }}
              />
            </div>
            {nextTier ? (
              <p className="text-gray-400 text-xs">
                {formatCurrency(nextTier.min - balance)} more to reach <span className="font-medium" style={{ color: nextTier.color }}>{nextTier.name}</span>
              </p>
            ) : (
              <p className="text-purple-600 text-xs font-medium">You've reached the highest tier!</p>
            )}
            <div className="flex justify-between mt-3">
              {TIERS.map(t => (
                <div key={t.name} className="text-center">
                  <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${balance >= t.min ? 'bg-current' : 'bg-gray-200'}`} style={{ color: t.color, backgroundColor: balance >= t.min ? t.color : undefined }} />
                  <p className="text-[9px] text-gray-400 font-medium">{t.name}</p>
                  <p className="text-[9px] text-gray-400">${t.min}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Eligible categories */}
          <div className="bank-card p-5 mb-6 animate-fade-up" style={{ animationDelay: '0.11s' }}>
            <p className="text-gray-800 font-semibold text-sm mb-3">Earn Cashback On</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CATEGORIES.map(cat => (
                <div key={cat.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-2xl mb-1">{cat.icon}</div>
                  <p className="text-gray-700 text-xs font-medium leading-snug">{cat.label}</p>
                  <p className="text-bank-green font-bold text-sm mt-1">{cat.rate}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction history */}
          {txns.length > 0 && (
            <div className="bank-card overflow-hidden animate-fade-up" style={{ animationDelay: '0.14s' }}>
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-gray-800 font-semibold text-sm">Transaction History</p>
              </div>
              <div className="divide-y divide-gray-50">
                {txns.map((tx, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`badge ${TX_BADGES[tx.type] || 'bg-gray-100 text-gray-500'} capitalize text-[10px]`}>{tx.type}</span>
                        <p className="text-gray-800 text-sm font-medium truncate">{tx.merchant || tx.description}</p>
                      </div>
                      <div className="flex gap-2 mt-0.5 text-gray-400 text-xs">
                        {tx.category && <span>{tx.category}</span>}
                        <span>{new Date(tx.date || tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <span className={`font-bold text-sm amount-display shrink-0 ml-3 ${TX_COLORS[tx.type] || 'text-gray-700'}`}>
                      {tx.type === 'redeemed' ? '-' : '+'}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showRedeem && (
        <RedeemModal
          balance={balance}
          onClose={() => setShowRedeem(false)}
          onRedeemed={(amt) => {
            setOverview(prev => ({
              ...prev,
              balance:        (balance - amt).toFixed(2),
              totalRedeemed:  (totalRedeemed + amt).toFixed(2),
            }));
            setShowRedeem(false);
          }}
        />
      )}
    </div>
  );
}

function RedeemModal({ balance, onClose, onRedeemed }) {
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const handleRedeem = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt < 10)      return toast.error('Minimum redemption is $10');
    if (amt > balance)         return toast.error('Exceeds available balance');
    setSaving(true);
    try {
      await cashbackAPI.redeem({ amount: amt });
      toast.success(`${formatCurrency(amt)} redeemed to your checking account`);
      onRedeemed(amt);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Redemption failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl animate-fade-up">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-gray-900 font-bold text-lg">Redeem Cashback</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><XIcon /></button>
        </div>
        <form onSubmit={handleRedeem} className="p-5 space-y-4">
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <p className="section-label mb-1">Available Balance</p>
            <p className="text-bank-green font-bold text-3xl amount-display">{formatCurrency(balance)}</p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">Redeem Amount (min $10)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number" min="10" max={balance} step="0.01"
                className="input-base pl-7 amount-display"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[10, 25, 50].filter(v => v <= balance).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(String(v))}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  ${v}
                </button>
              ))}
              {balance >= 10 && (
                <button
                  type="button"
                  onClick={() => setAmount(balance.toFixed(2))}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Max
                </button>
              )}
            </div>
          </div>
          <p className="text-gray-400 text-xs">Redeemed funds are deposited to your primary checking account within 1–2 business days.</p>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Spinner /> : 'Redeem to Checking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Spinner() { return <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9"/></svg>; }
function XIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function GiftIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>; }
