const { pool }     = require('../config/database');
const billPayRepo  = require('../repositories/billPayRepository');
const AppError     = require('../utils/AppError');
const { notify }   = require('./notificationService');

const getBillers = async (userId) => {
  return billPayRepo.findBillersByUserId(userId);
};

const addBiller = async (userId, data) => {
  const { name, accountNumber, category } = data;
  return billPayRepo.createBiller({ userId, name, accountNumber, category });
};

const removeBiller = async (billerId, userId) => {
  const biller = await billPayRepo.findBillerById(billerId);
  if (!biller) throw new AppError('Biller not found', 404);
  if (biller.user_id !== userId) throw new AppError('Not authorised to remove this biller', 403);
  await billPayRepo.deleteBiller(billerId);
};

const getPayments = async (userId) => {
  return billPayRepo.findPaymentsByUserId(userId);
};

const schedulePayment = async (userId, { billerId, accountId, amount, scheduledDate, dueDate, memo, isRecurring, frequency }) => {
  // Verify biller belongs to userId
  const biller = await billPayRepo.findBillerById(billerId);
  if (!biller) throw new AppError('Biller not found', 404);
  if (biller.user_id !== userId) throw new AppError('Not authorised to use this biller', 403);

  // Verify accountId belongs to userId
  const { rows: accountRows } = await pool.query(
    `SELECT id FROM accounts WHERE id = $1 AND user_id = $2`,
    [accountId, userId]
  );
  if (!accountRows.length) throw new AppError('Account not found or does not belong to you', 404);

  // Generate reference
  const { rows: seqRows } = await pool.query(
    `SELECT nextval('bill_pay_reference_seq')::int AS seq`
  );
  const year      = new Date().getFullYear();
  const seq       = seqRows[0].seq;
  const reference = `BILL-${year}-${String(seq).padStart(6, '0')}`;

  const payment = await billPayRepo.createPayment({
    billerId,
    accountId,
    amount:       parseFloat(amount),
    scheduledDate,
    dueDate,
    memo,
    reference,
    isRecurring,
    frequency,
  });

  notify({
    userId,
    type:     'bill_payment_scheduled',
    title:    'Bill payment scheduled',
    message:  `Your payment of $${parseFloat(amount).toFixed(2)} to ${biller.name} (ref: ${reference}) has been scheduled.`,
    severity: 'info',
    metadata: { reference, amount: parseFloat(amount), billerId, scheduledDate },
  });

  return payment;
};

const cancelPayment = async (paymentId, userId) => {
  const payment = await billPayRepo.findPaymentsByUserId(userId);
  const found   = payment.find(p => p.id === paymentId);

  if (!found) {
    // Try to find by direct query to check if it exists at all vs. ownership
    const { rows } = await pool.query(
      `SELECT bp.id, b.user_id FROM bill_pay_payments bp JOIN bill_pay_billers b ON b.id = bp.biller_id WHERE bp.id = $1`,
      [paymentId]
    );
    if (!rows.length) throw new AppError('Payment not found', 404);
    throw new AppError('Not authorised to cancel this payment', 403);
  }

  return billPayRepo.cancelPayment(paymentId);
};

module.exports = { getBillers, addBiller, removeBiller, getPayments, schedulePayment, cancelPayment };
