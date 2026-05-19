export const formatCurrency = (amount, currency = 'USD') => {
  const n = parseFloat(amount);
  if (isNaN(n) || amount === null || amount === undefined) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(0);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(n);
};

export const formatDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(d);
};

export const formatDateShort = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
};

export const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

export const maskAccountNumber = (num = '') =>
  `•••• ${num.slice(-4)}`;

export const txTypeLabel = (tx, accountId) => {
  if (tx.type === 'credit') return { label: 'Credit', dir: 'in' };
  if (tx.type === 'debit')  return { label: 'Debit',  dir: 'out' };
  // transfer
  if (tx.receiver?.accountNumber && !tx.sender?.accountNumber) return { label: 'Received', dir: 'in' };
  return { label: 'Sent', dir: 'out' };
};
