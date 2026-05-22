import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../api';
import { formatCurrency, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  completed: 'bg-green-50 text-green-700',
  pending:   'bg-yellow-50 text-yellow-700',
  failed:    'bg-red-50 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const TYPE_LABELS = {
  transfer:   'Transfer',
  credit:     'Credit',
  debit:      'Debit',
  wire:       'Wire',
  deposit:    'Deposit',
  withdrawal: 'Withdrawal',
};

export default function AdminTransactions() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search,  setSearch]  = useState('');

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getTransactions(p);
      const list = data?.data?.transactions ?? data?.data ?? [];
      if (p === 1) {
        setRows(list);
      } else {
        setRows(prev => [...prev, ...list]);
      }
      setHasMore(list.length >= 20);
      setPage(p);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const filtered = rows.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (t.reference  || '').toLowerCase().includes(q) ||
      (t.type       || '').toLowerCase().includes(q) ||
      (t.status     || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">All Transfers</h1>
          <p className="text-gray-400 text-sm mt-0.5">Platform-wide transaction ledger</p>
        </div>
        <input
          type="search"
          placeholder="Search by reference, type, status…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-72 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy/20"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <svg className="animate-spin mr-2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/>
              <path d="M21 12a9 9 0 00-9-9"/>
            </svg>
            <span className="text-sm">Loading transactions…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-50">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <p className="text-sm">{search ? 'No transactions match your search' : 'No transactions found'}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">Reference</th>
                    <th className="text-left px-5 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">Type</th>
                    <th className="text-right px-5 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">Amount</th>
                    <th className="text-left px-5 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-500 truncate max-w-[160px]">
                        {t.reference || t.id?.slice(0, 8)}
                      </td>
                      <td className="px-5 py-3.5 text-gray-700 capitalize">
                        {TYPE_LABELS[t.type] || t.type}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold text-gray-900">
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS_COLORS[t.status] || 'bg-gray-100 text-gray-500'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                        {formatDate(t.createdAt || t.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="sm:hidden divide-y divide-gray-50">
              {filtered.map((t) => (
                <div key={t.id} className="px-4 py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-gray-900 text-sm font-medium capitalize">{TYPE_LABELS[t.type] || t.type}</p>
                    <p className="text-gray-400 text-xs font-mono truncate">{t.reference || t.id?.slice(0, 8)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-gray-900 text-sm font-mono font-semibold">{formatCurrency(t.amount)}</p>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${STATUS_COLORS[t.status] || 'bg-gray-100 text-gray-500'}`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="px-5 py-4 border-t border-gray-50 text-center">
                <button
                  onClick={() => load(page + 1)}
                  disabled={loading}
                  className="text-navy text-sm font-medium hover:underline disabled:opacity-40"
                >
                  {loading ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <p className="text-gray-400 text-xs text-center mt-4">
        Showing {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
        {search && ` matching "${search}"`}
      </p>
    </div>
  );
}
