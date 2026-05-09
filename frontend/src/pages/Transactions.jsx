import { useState, useEffect } from 'react';
import { useAuth } from '../store/authStore';
import { transactionAPI } from '../api';
import TransactionList  from '../components/transactions/TransactionList';
import TransactionModal from '../components/transactions/TransactionModal';
import toast from 'react-hot-toast';

export default function Transactions() {
  const { account } = useAuth();
  const [txData,    setTxData]    = useState({ transactions: [], pagination: {} });
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [selected,  setSelected]  = useState(null);  // transaction shown in modal
  const [modalOpen, setModalOpen] = useState(false);

  const load = async (p = 1) => {
    try {
      setLoading(true);
      const { data } = await transactionAPI.getMine(p, 20);
      setTxData(data.data);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page]);

  const handleSelect = (tx) => {
    setSelected(tx);
    setModalOpen(true);
  };

  const handleClose = () => setModalOpen(false);

  // Optimistically remove the deleted transaction from local state
  const handleDeleted = (deletedId) => {
    setTxData(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== deletedId),
      pagination: {
        ...prev.pagination,
        total: Math.max(0, (prev.pagination.total || 1) - 1),
      },
    }));
  };

  const { transactions, pagination } = txData;
  const totalPages = Math.ceil((pagination.total || 0) / (pagination.limit || 20));

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="mb-8 animate-fade-up">
        <h1 className="text-white font-bold text-2xl font-display">Transaction History</h1>
        <p className="text-white/40 text-sm mt-1">
          {pagination.total || 0} transactions · Account {account?.accountNumber}
        </p>
      </div>

      <div className="glass rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <div className="p-2">
          <TransactionList
            transactions={transactions}
            loading={loading}
            accountNumber={account?.accountNumber}
            onSelect={handleSelect}
          />
        </div>

        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.06]">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost text-xs px-4 py-2 border border-white/10 disabled:opacity-30"
            >
              ← Previous
            </button>
            <span className="text-white/30 text-xs">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-ghost text-xs px-4 py-2 border border-white/10 disabled:opacity-30"
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
