import { formatCurrency, formatDate } from '../../utils/formatters';
import { getDisplayName } from '../../utils/merchantDisplay';

const STATUS_STYLES = {
  completed: 'bg-emerald-500/10 text-emerald-400',
  pending:   'bg-yellow-500/10  text-yellow-400',
  failed:    'bg-red-500/10     text-red-400',
  reversed:  'bg-white/10       text-white/40',
};

// onSelect is optional — when not provided rows are not clickable
export default function TransactionList({ transactions = [], loading = false, accountNumber, onSelect }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl shimmer" />
        ))}
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/20">
        <svg className="mb-3 opacity-30" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <p className="text-sm">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {transactions.map((tx, i) => {
        const isIncoming = isCredit(tx, accountNumber);
        const amount     = parseFloat(tx.amount);
        const clickable  = !!onSelect;

        return (
          <div
            key={tx.id}
            onClick={clickable ? () => onSelect(tx) : undefined}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            onKeyDown={clickable ? (e) => e.key === 'Enter' && onSelect(tx) : undefined}
            className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors
              ${clickable
                ? 'cursor-pointer hover:bg-white/[0.05] active:bg-white/[0.07]'
                : 'hover:bg-white/[0.03]'
              }`}
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            {/* Icon */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
              ${isIncoming ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              {isIncoming
                ? <ArrowDownIcon className="text-emerald-400" />
                : <ArrowUpIcon   className="text-red-400" />}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {getCounterparty(tx, accountNumber)}
              </p>
              <p className="text-white/30 text-xs flex items-center gap-2">
                <span className="font-mono">{tx.reference}</span>
                <span>·</span>
                <span>{formatDate(tx.createdAt)}</span>
              </p>
            </div>

            {/* Amount + status */}
            <div className="text-right shrink-0">
              <p className={`amount-display font-semibold text-sm ${isIncoming ? 'text-emerald-400' : 'text-white'}`}>
                {isIncoming ? '+' : '−'}{formatCurrency(amount)}
              </p>
              <span className={`badge text-[10px] mt-0.5 ${STATUS_STYLES[tx.status] || STATUS_STYLES.completed}`}>
                {tx.status}
              </span>
            </div>

            {/* Chevron hint (only when clickable) */}
            {clickable && (
              <svg className="text-white/15 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}

function isCredit(tx, accountNumber) {
  if (tx.type === 'credit')  return true;
  if (tx.type === 'debit')   return false;
  return tx.receiver?.accountNumber === accountNumber;
}

function getCounterparty(tx, accountNumber) {
  const credit = isCredit(tx, accountNumber);
  const extRef  = tx.externalReference || tx.external_reference;

  if (extRef) {
    // Call getDisplayName once — random selection must not be called twice
    const name = getDisplayName(tx) || extRef;
    return credit ? `From ${name}` : `To ${name}`;
  }

  if (credit) return `From ${tx.fromName || '—'}`;
  return `To ${tx.toName || '—'}`;
}

function ArrowDownIcon({ className = '' }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
    </svg>
  );
}
function ArrowUpIcon({ className = '' }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
    </svg>
  );
}
