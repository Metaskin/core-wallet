import { formatCurrency, formatDate } from '../../utils/formatters';
import { classifyTransaction } from '../../utils/merchantDisplay';

const STATUS_STYLES = {
  completed: 'bg-emerald-50 text-bank-green border-emerald-200',
  pending:   'bg-amber-50 text-bank-amber border-amber-200',
  failed:    'bg-red-50 text-bank-red border-red-200',
  reversed:  'bg-gray-100 text-gray-400 border-gray-200',
};

export default function TransactionList({ transactions = [], loading = false, accountNumber, onSelect }) {
  if (loading) {
    return (
      <div className="space-y-2 p-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl shimmer" />
        ))}
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-gray-400">
        <svg className="mb-3 opacity-40" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <p className="text-sm text-gray-500">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-50">
      {transactions.map((tx, i) => {
        const incoming = isIncoming(tx, accountNumber);
        const amount   = parseFloat(tx.amount);
        const failed   = tx.status === 'failed';
        const clickable = !!onSelect;
        const { merchantName, txType, subDetail } = classifyTransaction(tx);

        return (
          <div
            key={tx.id}
            onClick={clickable ? () => onSelect(tx) : undefined}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            onKeyDown={clickable ? (e) => e.key === 'Enter' && onSelect(tx) : undefined}
            className={`flex items-center gap-3 px-4 py-3.5 transition-colors
              ${clickable ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100' : ''}
              ${failed ? 'opacity-60' : ''}`}
            style={{ animationDelay: `${i * 0.03}s` }}
          >
            {/* Icon bubble */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              failed   ? 'bg-red-50'     :
              incoming ? 'bg-emerald-50' : 'bg-blue-50'
            }`}>
              {failed   ? <FailIcon />      :
               incoming ? <ArrowDownIcon /> : <ArrowUpIcon />}
            </div>

            {/* Left: merchant + type + date */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${failed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                {merchantName}
              </p>
              <p className="text-gray-400 text-xs mt-0.5 truncate">
                {subDetail ? `${subDetail} · ` : ''}{txType} · {formatDate(tx.createdAt)}
              </p>
            </div>

            {/* Right: amount + status */}
            <div className="text-right shrink-0">
              <p className={`amount-display font-semibold text-sm ${
                failed   ? 'text-gray-400 line-through' :
                incoming ? 'text-bank-green' : 'text-gray-800'
              }`}>
                {incoming ? '+' : '−'}{formatCurrency(amount)}
              </p>
              <span className={`badge border text-[10px] mt-0.5 ${STATUS_STYLES[tx.status] || STATUS_STYLES.completed}`}>
                {tx.status}
              </span>
            </div>

            {/* Chevron */}
            {clickable && (
              <svg className="text-gray-300 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}

function isIncoming(tx, accountNumber) {
  if (tx.type === 'credit') return true;
  if (tx.type === 'debit')  return false;
  return tx.receiver?.accountNumber === accountNumber;
}

function ArrowDownIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1A7A4A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
    </svg>
  );
}
function ArrowUpIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0072CE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
    </svg>
  );
}
function FailIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}
