import { useState, useEffect } from 'react';
import { investmentAPI, accountAPI } from '../api';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const ALLOCATION_COLORS = {
  etf:    '#0072CE',
  stocks: '#1A7A4A',
  bonds:  '#F59E0B',
  other:  '#6366F1',
  cash:   '#6B7280',
};

const TYPE_BADGE = {
  buy:      'bg-emerald-100 text-emerald-700',
  sell:     'bg-red-100 text-red-700',
  dividend: 'bg-purple-100 text-purple-700',
  deposit:  'bg-blue-100 text-blue-700',
  withdraw: 'bg-amber-100 text-amber-700',
};

export default function Investments() {
  const [overview,  setOverview]  = useState(null);
  const [txns,      setTxns]      = useState([]);
  const [accounts,  setAccounts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(null); // 'deposit' | 'withdraw' | null

  const load = async () => {
    try {
      setLoading(true);
      const [ovRes, txRes, accRes] = await Promise.all([
        investmentAPI.getOverview(),
        investmentAPI.getTransactions(),
        accountAPI.getAll(),
      ]);
      setOverview(ovRes.data.data);
      setTxns(txRes.data.data?.transactions || txRes.data.data || []);
      const accs = accRes.data.data?.accounts || accRes.data.data || [];
      setAccounts(Array.isArray(accs) ? accs : [accs]);
    } catch {
      toast.error('Failed to load investment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const dailyChange  = overview?.dailyChange  || 0;
  const totalReturn  = overview?.totalReturn  || 0;
  const totalValue   = overview?.totalValue   || 0;
  const dailyPct     = overview?.dailyChangePct || 0;
  const totalRetPct  = overview?.totalReturnPct || 0;
  const isUp         = dailyChange >= 0;

  const allocation = overview?.allocation
    ? Object.entries(overview.allocation).map(([key, val]) => ({
        name:  key.charAt(0).toUpperCase() + key.slice(1),
        value: parseFloat(val) || 0,
        color: ALLOCATION_COLORS[key] || '#9CA3AF',
      })).filter(d => d.value > 0)
    : [];

  const holdings = overview?.holdings || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl w-full">
      {/* Header */}
      <div className="mb-6 animate-fade-up">
        <h1 className="text-gray-900 font-bold text-2xl">Investment Portfolio</h1>
        <p className="text-gray-500 text-sm mt-1">Your investment accounts and holdings</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-40 rounded-xl shimmer" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-64 rounded-xl shimmer" />
            <div className="h-64 rounded-xl shimmer" />
          </div>
        </div>
      ) : (
        <>
          {/* Hero card */}
          <div className="bank-card p-6 mb-6 animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="section-label mb-2">Total Portfolio Value</p>
                <p className="text-gray-900 font-bold text-4xl amount-display">{formatCurrency(totalValue)}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`flex items-center gap-1 font-semibold text-sm ${isUp ? 'text-bank-green' : 'text-bank-red'}`}>
                    {isUp ? <ArrowUpIcon /> : <ArrowDownIcon />}
                    {formatCurrency(Math.abs(dailyChange))} ({Math.abs(dailyPct).toFixed(2)}%)
                  </span>
                  <span className="text-gray-400 text-xs">today</span>
                </div>
              </div>
              <div className="text-right">
                <p className="section-label mb-1">Total Return</p>
                <p className={`font-bold text-xl amount-display ${totalReturn >= 0 ? 'text-bank-green' : 'text-bank-red'}`}>
                  {formatCurrency(Math.abs(totalReturn))}
                </p>
                <p className={`text-sm font-medium ${totalReturn >= 0 ? 'text-bank-green' : 'text-bank-red'}`}>
                  {totalReturn >= 0 ? '+' : '-'}{Math.abs(totalRetPct).toFixed(2)}%
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal('deposit')}  className="btn-primary flex-1 text-sm">Add Funds</button>
              <button onClick={() => setShowModal('withdraw')} className="btn-ghost flex-1 text-sm">Withdraw</button>
            </div>
          </div>

          {/* Allocation + Holdings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            {/* Pie chart */}
            <div className="bank-card p-5">
              <p className="text-gray-800 font-semibold text-sm mb-4">Asset Allocation</p>
              {allocation.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={allocation} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={3}>
                      {allocation.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v.toFixed(1)}%`]} />
                    <Legend
                      formatter={(val) => <span className="text-xs text-gray-600">{val}</span>}
                      iconType="circle"
                      iconSize={8}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-xs text-center py-8">No allocation data</p>
              )}
            </div>

            {/* Recent transactions */}
            <div className="bank-card p-5">
              <p className="text-gray-800 font-semibold text-sm mb-4">Recent Activity</p>
              {txns.length === 0 ? (
                <p className="text-gray-400 text-xs">No recent transactions</p>
              ) : (
                <div className="space-y-2">
                  {txns.slice(0, 5).map((tx, i) => (
                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className={`badge text-[10px] ${TYPE_BADGE[tx.type] || 'bg-gray-100 text-gray-600'} capitalize`}>{tx.type}</span>
                        <span className="text-gray-700 text-xs truncate max-w-[100px]">{tx.symbol || tx.description}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-xs font-semibold amount-display ${tx.type === 'sell' || tx.type === 'withdraw' ? 'text-bank-red' : 'text-bank-green'}`}>
                          {tx.type === 'sell' || tx.type === 'withdraw' ? '-' : '+'}{formatCurrency(tx.amount)}
                        </p>
                        <p className="text-gray-400 text-[10px]">
                          {new Date(tx.date || tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Holdings table */}
          {holdings.length > 0 && (
            <div className="bank-card overflow-hidden animate-fade-up" style={{ animationDelay: '0.15s' }}>
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-gray-800 font-semibold text-sm">Holdings</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-5 py-3 section-label">Symbol</th>
                      <th className="text-left px-3 py-3 section-label hidden sm:table-cell">Name</th>
                      <th className="text-right px-3 py-3 section-label">Shares</th>
                      <th className="text-right px-3 py-3 section-label hidden sm:table-cell">Avg Cost</th>
                      <th className="text-right px-3 py-3 section-label hidden md:table-cell">Price</th>
                      <th className="text-right px-3 py-3 section-label">Value</th>
                      <th className="text-right px-5 py-3 section-label">Gain/Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((h, i) => {
                      const gain    = (parseFloat(h.currentPrice) - parseFloat(h.avgCost)) * parseFloat(h.shares);
                      const gainPct = parseFloat(h.avgCost) > 0 ? ((parseFloat(h.currentPrice) - parseFloat(h.avgCost)) / parseFloat(h.avgCost)) * 100 : 0;
                      const positive = gain >= 0;
                      return (
                        <tr key={i} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-navy">{h.symbol}</td>
                          <td className="px-3 py-3.5 text-gray-600 hidden sm:table-cell truncate max-w-[120px]">{h.name}</td>
                          <td className="px-3 py-3.5 text-right text-gray-700">{parseFloat(h.shares).toFixed(4)}</td>
                          <td className="px-3 py-3.5 text-right text-gray-500 amount-display hidden sm:table-cell">{formatCurrency(h.avgCost)}</td>
                          <td className="px-3 py-3.5 text-right text-gray-700 amount-display hidden md:table-cell">{formatCurrency(h.currentPrice)}</td>
                          <td className="px-3 py-3.5 text-right font-semibold text-gray-900 amount-display">{formatCurrency(h.value || parseFloat(h.currentPrice) * parseFloat(h.shares))}</td>
                          <td className={`px-5 py-3.5 text-right font-semibold amount-display ${positive ? 'text-bank-green' : 'text-bank-red'}`}>
                            {positive ? '+' : ''}{formatCurrency(gain)}
                            <span className="text-[10px] block font-normal">
                              {positive ? '+' : ''}{gainPct.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <TransferModal
          mode={showModal}
          accounts={accounts}
          onClose={() => setShowModal(null)}
          onDone={() => { setShowModal(null); load(); }}
        />
      )}
    </div>
  );
}

function TransferModal({ mode, accounts, onClose, onDone }) {
  const [amount,  setAmount]  = useState('');
  const [accId,   setAccId]   = useState(accounts[0]?.id || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    if (!accId)           return toast.error('Select an account');
    setLoading(true);
    try {
      await investmentAPI.transfer({ amount: amt, accountId: accId, type: mode });
      toast.success(mode === 'deposit' ? 'Funds added to portfolio' : 'Withdrawal initiated');
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl animate-fade-up">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-gray-900 font-bold text-lg capitalize">{mode === 'deposit' ? 'Add Funds' : 'Withdraw Funds'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><XIcon /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {mode === 'withdraw' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-amber-700 text-xs font-medium">Withdrawals may take 1–3 business days to settle to your bank account.</p>
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">Amount</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number" min="1" step="0.01"
                className="input-base pl-7 amount-display"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">
              {mode === 'deposit' ? 'From Account' : 'To Account'}
            </label>
            <select className="input-base" value={accId} onChange={e => setAccId(e.target.value)}>
              <option value="">Select account</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {(a.accountType || 'Account').charAt(0).toUpperCase() + (a.accountType || '').slice(1)} •••• {(a.accountNumber || '').slice(-4)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <Spinner /> : (mode === 'deposit' ? 'Add Funds' : 'Withdraw')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Spinner() { return <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9"/></svg>; }
function XIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function ArrowUpIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>; }
function ArrowDownIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>; }
