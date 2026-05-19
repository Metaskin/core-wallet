const { pool }           = require('../config/database');
const checkDepositRepo   = require('../repositories/checkDepositRepository');
const AppError           = require('../utils/AppError');
const { notify }         = require('./notificationService');

const getMyDeposits = async (userId) => {
  const { rows: accountRows } = await pool.query(
    `SELECT id FROM accounts WHERE user_id = $1`,
    [userId]
  );
  if (!accountRows.length) return [];
  const accountIds = accountRows.map(a => a.id);
  return checkDepositRepo.findByAccountIds(accountIds);
};

const submitDeposit = async (userId, { accountId, amount, checkNumber, memo, frontImageData, backImageData }) => {
  // Verify accountId belongs to userId
  const { rows: accountRows } = await pool.query(
    `SELECT id FROM accounts WHERE id = $1 AND user_id = $2`,
    [accountId, userId]
  );
  if (!accountRows.length) throw new AppError('Account not found or does not belong to you', 404);

  // Validate amount
  const parsedAmount = parseFloat(amount);
  if (parsedAmount <= 0) throw new AppError('Deposit amount must be greater than zero', 400);
  if (parsedAmount > 10000) throw new AppError('Deposit amount exceeds the daily limit of $10,000', 400);

  // Generate reference: 'DEP-' + year + '-' + padded sequence
  const { rows: seqRows } = await pool.query(
    `SELECT nextval('deposit_reference_seq')::int AS seq`
  );
  const year      = new Date().getFullYear();
  const seq       = seqRows[0].seq;
  const reference = `DEP-${year}-${String(seq).padStart(6, '0')}`;

  const deposit = await checkDepositRepo.create({
    accountId,
    amount:         parsedAmount,
    checkNumber,
    memo,
    frontImageData,
    backImageData,
    reference,
  });

  notify({
    userId,
    type:     'check_deposit_submitted',
    title:    'Check deposit submitted',
    message:  `Your check deposit of $${parsedAmount.toFixed(2)} (ref: ${reference}) has been submitted and is pending review.`,
    severity: 'info',
    metadata: { reference, amount: parsedAmount, accountId },
  });

  return deposit;
};

module.exports = { getMyDeposits, submitDeposit };
