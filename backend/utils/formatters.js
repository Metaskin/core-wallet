const formatCurrency = (amount, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

const formatDate = (date) =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));

const maskCardNumber = (cardNumber) =>
  `**** **** **** ${cardNumber.slice(-4)}`;

const formatTransaction = (t) => {
  const senderName   = t.sender_name   || null;
  const receiverName = t.receiver_name || null;
  const adminName    = t.admin_name    || null;
  const extRef       = t.external_reference || null;

  return {
    id:          t.id,
    reference:   t.reference,
    type:        t.type,
    amount:      parseFloat(t.amount),
    currency:    t.currency,
    description: t.description,
    status:      t.status,
    createdAt:   t.created_at,
    externalReference: extRef,
    fromName: senderName   || extRef || adminName || 'System',
    toName:   receiverName || extRef || adminName || 'System',
    sender: t.sender_account_number
      ? { accountNumber: t.sender_account_number, name: senderName }
      : null,
    receiver: t.receiver_account_number
      ? { accountNumber: t.receiver_account_number, name: receiverName }
      : null,
    adminName,
    balanceSnapshot: {
      senderBefore:   t.sender_balance_before   != null ? parseFloat(t.sender_balance_before)   : null,
      senderAfter:    t.sender_balance_after     != null ? parseFloat(t.sender_balance_after)     : null,
      receiverBefore: t.receiver_balance_before  != null ? parseFloat(t.receiver_balance_before)  : null,
      receiverAfter:  t.receiver_balance_after   != null ? parseFloat(t.receiver_balance_after)   : null,
    },
  };
};

module.exports = { formatCurrency, formatDate, maskCardNumber, formatTransaction };
