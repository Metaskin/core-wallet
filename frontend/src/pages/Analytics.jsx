import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { transactionAPI } from '../api';
import { formatCurrency, formatDateShort } from '../utils/formatters';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#003087', '#0072CE', '#1A7A4A', '#B8860B', '#C0392B', '#6366f1', '#7c3aed', '#0891b2'];

const CATEGORY_LABELS = {
  SEA_DRILL_INTL:   'Salary / Income',
  RETAIL_STORE:     'Retail Shopping',
  FOOD_OUTLET:      'Food & Dining',
  UTILITY_PROVIDER: 'Utilities',
  AUTO_FINANCE:     'Auto Finance',
  PEER_TRANSFER:    'Transfers',
};

function resolveCategory(tx) {
  const ref = tx.externalReference || tx.external_reference;
  if (ref && CATEGORY_LABELS[ref]) return CATEGORY_LABELS[ref];
  if (ref) return ref.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  if (tx.type === 'credit') return 'Credits Received';
  return 'Other Transfers';
}

function isOutgoing(tx, accountNumber) {
  if (tx.type === 'debit')   return true;
  if (tx.type === 'credit')  return false;
  return tx.sender?.accountNumber === accountNumber;
}

export default function Analytics() {
  const { account } = useAuth();
  const navigate = useNavigate();
  const [txData,   setTxData]   = useState({ transactions: [] });
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Fetch up to 200 for analytics accuracy
        const { data } = await transactionAPI.getMine(1, 200);
        setTxData(data.data);
      } catch { /* show empty state */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const thisMonth = new Date().getMonth();
  const thisYear  = new Date().getFullYear();

  // Month's completed outgoing transactions only
  const monthlyTxs = useMemo(() => (
    txData.transactions.filter(t => {
      const d = new Date(t.createdAt);
      return d.getMonth() === thisMonth
        && d.getFullYear() === thisYear
        && t.status === 'completed'
        && isOutgoing(t, account?.accountNumber);
    })
  ), [txData.transactions, account, thisMonth, thisYear]);

  const totalSpent = useMemo(() => (
    monthlyTxs.reduce((s, t) => s + parseFloat(t.amount), 0)
  ), [monthlyTxs]);

  // Category breakdown
  const categories = useMemo(() => {
    const map = {};
    monthlyTxs.forEach(t => {
      const cat = resolveCategory(t);
      map[cat] = (map[cat] || 0) + parseFloat(t.amount);
    });
    return Object.entries(map)
      .map(([name, amount]) => ({ name, amount, pct: totalSpent > 0 ? (amount / totalSpent) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthlyTxs, totalSpent]);

  // Last 6 months summary
  const monthlyTrend = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth();
      const y = d.getFullYear();
      const spent = txData.transactions
        .filter(t => {
          const td = new Date(t.createdAt);
          return td.getMonth() === m && td.getFullYear() === y
            && t.status === 'completed'
            && isOutgoing(t, account?.accountNumber);
        })
        .reduce((s, t) => s + parseFloat(t.amount), 0);
      months.push({
        label: d.toLocaleString('default', { month: 'short' }),
        amount: spent,
      });
    }
    return months;
  }, [txData.transactions, account]);

  const maxBar = Math.max(...monthlyTrend.map(m => m.amount), 1);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-card-md px-3 py-2 text-sm">
        <p className="font-semibold text-gray-900">{payload[0].name}</p>
        <p className="text-[#0072CE] font-mono">{formatCurrency(payload[0].value)}</p>
        <p className="text-gray-400 text-xs">{payload[0].payload.pct?.toFixed(1)}%</p>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl w-full">

      {/* Header */}
      <div className="mb-6 animate-fade-up">
        <h1 className="text-gray-900 font-bold text-2xl">Spending Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} overview
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : monthlyTxs.length === 0 ? (
        <EmptyAnalytics onNavigate={() => navigate('/transactions')} />
      ) : (
        <div className="space-y-5">

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <SummaryCard label="Total Spent" value={formatCurrency(totalSpent)} color="red" />
            <SummaryCard label="Transactions"  value={monthlyTxs.length} />
            <SummaryCard
              label="Top Category"
              value={categories[0]?.name || '—'}
              small
              className="col-span-2 sm:col-span-1"
            />
          </div>

          {/* Donut chart + legend */}
          <div className="bank-card p-5 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-gray-800 font-semibold text-sm">Spending by Category</h2>
              <span className="section-label">{new Date().toLocaleString('default', { month: 'long' })}</span>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* Donut */}
              <div className="w-full md:w-auto shrink-0">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={categories}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="amount"
                      paddingAngle={2}
                    >
                      {categories.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend / breakdown */}
              <div className="flex-1 w-full space-y-2.5">
                {categories.map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs text-gray-700 font-medium truncate">{cat.name}</span>
                        <span className="amount-display text-xs text-gray-900 font-semibold shrink-0">{formatCurrency(cat.amount)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${cat.pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 w-9 text-right shrink-0">{cat.pct.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 6-month bar trend */}
          <div className="bank-card p-5 animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <h2 className="text-gray-800 font-semibold text-sm mb-4">6-Month Spending Trend</h2>
            <div className="flex items-end gap-3 h-32">
              {monthlyTrend.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="amount-display text-[9px] text-gray-400 hidden sm:block">
                    {m.amount > 0 ? `$${Math.round(m.amount / 1000)}k` : '—'}
                  </span>
                  <div className="w-full flex items-end" style={{ height: '80px' }}>
                    <div
                      className="w-full rounded-t-md transition-all duration-700"
                      style={{
                        height: `${Math.max(4, (m.amount / maxBar) * 80)}px`,
                        backgroundColor: i === monthlyTrend.length - 1 ? '#003087' : '#E5E7EB',
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 py-2">
            Based on completed outgoing transactions ·{' '}
            <button onClick={() => navigate('/transactions')} className="text-[#0072CE] hover:text-navy transition-colors font-medium">
              View all transactions →
            </button>
          </p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color, small, className = '' }) {
  const colorMap = { red: 'text-bank-red', green: 'text-bank-green' };
  return (
    <div className={`bank-card p-4 ${className}`}>
      <p className="section-label mb-1.5">{label}</p>
      <p className={`font-bold amount-display ${small ? 'text-sm' : 'text-lg'} ${colorMap[color] || 'text-gray-900'} truncate`}>
        {value}
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl shimmer" />)}
      </div>
      <div className="h-64 rounded-xl shimmer" />
      <div className="h-48 rounded-xl shimmer" />
    </div>
  );
}

function EmptyAnalytics({ onNavigate }) {
  return (
    <div className="bank-card flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-up">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      </div>
      <p className="text-gray-800 font-semibold text-base mb-1">No transactions this month yet</p>
      <p className="text-gray-400 text-sm mb-6">Analytics will appear once you've made transactions this month</p>
      <button onClick={onNavigate} className="btn-outline text-sm">
        View Transaction History
      </button>
    </div>
  );
}
