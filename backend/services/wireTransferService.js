const { pool }         = require('../config/database');
const wireTransferRepo = require('../repositories/wireTransferRepository');
const AppError         = require('../utils/AppError');
const { notify }       = require('./notificationService');

const DOMESTIC_FEE     = 25.00;
const INTERNATIONAL_FEE = 45.00;

const getMyWireTransfers = async (userId) => {
  const { rows: accountRows } = await pool.query(
    `SELECT id FROM accounts WHERE user_id = $1`,
    [userId]
  );
  if (!accountRows.length) return [];
  const accountIds = accountRows.map(a => a.id);
  return wireTransferRepo.findByAccountIds(accountIds);
};

const initiateWire = async (userId, data) => {
  const { accountId, type, recipientName, recipientBank, routingNumber, recipientAccountNumber, swiftBic, iban, amount, currency, memo } = data;

  // Verify account belongs to userId
  const { rows: accountRows } = await pool.query(
    `SELECT * FROM accounts WHERE id = $1 AND user_id = $2`,
    [accountId, userId]
  );
  if (!accountRows.length) throw new AppError('Account not found or does not belong to you', 404);
  const account = accountRows[0];

  const parsedAmount = parseFloat(amount);
  if (parsedAmount <= 0) throw new AppError('Transfer amount must be greater than zero', 400);

  // Validate type
  if (!['domestic', 'international'].includes(type)) {
    throw new AppError('Transfer type must be domestic or international', 400);
  }

  // Validate required fields per type
  if (type === 'domestic' && !routingNumber) {
    throw new AppError('Routing number is required for domestic wire transfers', 400);
  }
  if (type === 'international' && !swiftBic && !iban) {
    throw new AppError('SWIFT/BIC code or IBAN is required for international wire transfers', 400);
  }

  const fee = type === 'domestic' ? DOMESTIC_FEE : INTERNATIONAL_FEE;
  const totalDeduction = parsedAmount + fee;

  // Validate sufficient balance
  const balance = parseFloat(account.balance);
  if (balance < totalDeduction) {
    throw new AppError(`Insufficient balance. Required: $${totalDeduction.toFixed(2)} (includes $${fee.toFixed(2)} fee)`, 400);
  }

  // Generate reference
  const { rows: seqRows } = await pool.query(
    `SELECT nextval('wire_reference_seq')::int AS seq`
  );
  const year      = new Date().getFullYear();
  const seq       = seqRows[0].seq;
  const reference = `WR-${year}-${String(seq).padStart(6, '0')}`;

  // Calculate estimated delivery
  const deliveryDays  = type === 'domestic' ? 1 : 3;
  const deliveryDate  = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
  const estimatedDelivery = deliveryDate.toISOString();

  // Deduct amount + fee from account balance
  await pool.query(
    `UPDATE accounts SET balance = balance - $1, updated_at = NOW() WHERE id = $2`,
    [totalDeduction, accountId]
  );

  const transfer = await wireTransferRepo.create({
    accountId,
    type,
    recipientName,
    recipientBank,
    routingNumber,
    recipientAccountNumber,
    swiftBic,
    iban,
    amount:           parsedAmount,
    currency:         currency || 'USD',
    fee,
    memo,
    reference,
    estimatedDelivery,
  });

  notify({
    userId,
    type:     'wire_transfer_initiated',
    title:    'Wire transfer initiated',
    message:  `Your wire transfer of $${parsedAmount.toFixed(2)} to ${recipientName} (ref: ${reference}) has been initiated.`,
    severity: 'info',
    metadata: { reference, amount: parsedAmount, fee, type, recipientName },
  });

  return transfer;
};

const cancelWire = async (id, userId) => {
  const transfer = await wireTransferRepo.findById(id);
  if (!transfer) throw new AppError('Wire transfer not found', 404);

  // Verify ownership
  const { rows: accountRows } = await pool.query(
    `SELECT id FROM accounts WHERE id = $1 AND user_id = $2`,
    [transfer.account_id, userId]
  );
  if (!accountRows.length) throw new AppError('Not authorised to cancel this wire transfer', 403);

  if (!['pending', 'processing'].includes(transfer.status)) {
    throw new AppError('Only pending or processing wire transfers can be cancelled', 400);
  }

  // Refund amount + fee back to account
  const totalRefund = parseFloat(transfer.amount) + parseFloat(transfer.fee);
  await pool.query(
    `UPDATE accounts SET balance = balance + $1, updated_at = NOW() WHERE id = $2`,
    [totalRefund, transfer.account_id]
  );

  const updated = await wireTransferRepo.updateStatus(id, 'cancelled');

  notify({
    userId,
    type:     'wire_transfer_cancelled',
    title:    'Wire transfer cancelled',
    message:  `Your wire transfer (ref: ${transfer.reference}) has been cancelled and $${totalRefund.toFixed(2)} has been refunded to your account.`,
    severity: 'warning',
    metadata: { reference: transfer.reference, amount: transfer.amount, fee: transfer.fee },
  });

  return updated;
};

module.exports = { getMyWireTransfers, initiateWire, cancelWire };
