export const formatCurrency = (amount, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);

export const formatDate = (date) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));

export const formatDateShort = (date) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(date));

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
