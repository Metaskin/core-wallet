import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../store/authStore';
import { transactionAPI } from '../api';
import TransactionList  from '../components/transactions/TransactionList';
import TransactionModal from '../components/transactions/TransactionModal';
import toast from 'react-hot-toast';

const FILTERS = ['All', 'Completed', 'Pending', 'Failed'];

export default function Transactions() {
  const { account } = useAuth();
  const [txData,    setTxData]    = useState({ transactions: [], pagination: {} });
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [selected,  setSelected]  = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('All');

  const load = async (p = 1) => {
    try {
      setLoading(true);
      const { data } = await transactionAPI.getMine(p, 50);
      setTxData(data.data);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page]);

  const handleSelect = (tx) => { setSelected(tx); setModalOpen(true); };
  const handleClose  = ()    => setModalOpen(false);

  const handleDeleted = (deletedId) => {
    setTxData(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== deletedId),
      pagination: { ...prev.pagination, total: Math.max(0, (prev.pagination.total || 1) - 1) },
    }));
  };

  // Client-side filter + search
  const filtered = useMemo(() => {
    let list = txData.transactions;
    if (filter !== 'All') {
      list = list.filter(t => t.status?.toLowerCase() === filter.toLowerCase());
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        (t.reference || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.fromName || '').toLowerCase().includes(q) ||
        (t.toName || '').toLowerCase().includes(q) ||
        (t.externalReference || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [txData.transactions, filter, search]);

  // Pending first, then everything else
  const { pendingTxs, otherTxs } = useMemo(() => ({
    pendingTxs: filtered.filter(t => t.status === 'pending'),
    otherTxs:   filtered.filter(t => t.status !== 'pending'),
  }), [filtered]);

  const { pagination } = txData;
  const totalPages = Math.ceil((pagination.total || 0) / (pagination.limit || 50));
  const pendingCount = txData.transactions.filter(t => t.status === 'pending').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl w-full">

      {/* Header */}
      <div className="mb-6 animate-fade-up">
        <h1 className="text-gray-900 font-bold text-2xl">Transaction History</h1>
        <p className="text-gray-500 text-sm mt-1">
          {pagination.total || 0} transactions · {account?.maskedAccountNumber || account?.accountNumber}
        </p>
      </div>

      {/* Search + filters */}
      <div className="space-y-3 mb-5 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <div className="relative">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, reference, or description…"
            className="input-base pl-10"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XSmallIcon />
            </button>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                filter === f
                  ? 'bg-navy text-white shadow-sm'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {f}
              {f === 'Pending' && pendingCount > 0 && (
                <span className="ml-1.5 bg-bank-amber/20 text-bank-amber px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bank-card overflow-hidden animate-fade-up" style={{ animationDelay: '0.1s' }}>
        {loading ? (
          <div className="p-2">
            <TransactionList transactions={[]} loading={true} accountNumber={account?.accountNumber} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            search={search}
            filter={filter}
            onClear={() => { setSearch(''); setFilter('All'); }}
          />
        ) : (
          <>
            {pendingTxs.length > 0 && (
              <>
                <SectionDivider label="Pending" count={pendingTxs.length} />
                <div className="px-2 pb-2">
                  <TransactionList
                    transactions={pendingTxs}
                    loading={false}
                    accountNumber={account?.accountNumber}
                    onSelect={handleSelect}
                  />
                </div>
              </>
            )}
            {otherTxs.length > 0 && (
              <>
                {pendingTxs.length > 0 && <SectionDivider label="Completed" count={otherTxs.length} />}
                <div className="px-2 pb-2">
                  <TransactionList
                    transactions={otherTxs}
                    loading={false}
                    accountNumber={account?.accountNumber}
                    onSelect={handleSelect}
                  />
                </div>
              </>
            )}
          </>
        )}

        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost text-xs px-4 py-2 disabled:opacity-30"
            >
              ← Previous
            </button>
            <span className="text-gray-400 text-xs">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-ghost text-xs px-4 py-2 disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <TransactionModal
        transaction={selected}
        accountNumber={account?.accountNumber}
        open={modalOpen}
        onClose={handleClose}
        onDeleted={handleDeleted}
      />
    </div>
  );
}

function SectionDivider({ label, count }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
      <span className="section-label">{label}</span>
      <span className="text-[10px] text-gray-400 font-medium">{count}</span>
    </div>
  );
}

function EmptyState({ search, filter, onClear }) {
  const hasFilters = search || filter !== 'All';
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      </div>
      <p className="text-gray-700 font-semibold text-sm">
        {hasFilters ? 'No matching transactions' : 'No transactions yet'}
      </p>
      <p className="text-gray-400 text-xs mt-1 max-w-xs">
        {hasFilters
          ? 'Try adjusting your search or filters'
          : 'Your transactions will appear here once you start sending or receiving money'}
      </p>
      {hasFilters && (
        <button onClick={onClear} className="mt-4 text-xs text-[#0072CE] font-medium hover:text-navy transition-colors">
          Clear filters
        </button>
      )}
    </div>
  );
}

function SearchIcon({ className }) {
  return <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
function XSmallIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
