const { pool }       = require('../config/database');
const cashbackRepo   = require('../repositories/cashbackRepository');
const AppError       = require('../utils/AppError');
const { notify }     = require('./notificationService');

const getMyCashback = async (userId) => {
  const [rewards, transactions] = await Promise.all([
    cashbackRepo.findByUserId(userId),
    cashbackRepo.findTransactionsByUserId(userId),
  ]);
  return { rewards, transactions };
};

const redeemCashback = async (userId, amount) => {
  const parsedAmount = parseFloat(amount);
  if (parsedAmount <= 0) throw new AppError('Redemption amount must be greater than zero', 400);
  if (parsedAmount > 500) throw new AppError('Maximum redemption per transaction is $500', 400);

  const rewards = await cashbackRepo.findByUserId(userId);
  if (!rewards) throw new AppError('Cashback rewards account not found', 404);

  const currentBalance = parseFloat(rewards.balance);
  if (parsedAmount > currentBalance) {
    throw new AppError(`Insufficient cashback balance. Available: $${currentBalance.toFixed(2)}`, 400);
  }

  // Find user's checking account
  const { rows: accountRows } = await pool.query(
    `SELECT * FROM accounts WHERE user_id = $1 AND account_type = 'checking' AND status = 'active' LIMIT 1`,
    [userId]
  );
  if (!accountRows.length) throw new AppError('Checking account not found', 404);
  const checkingAccount = accountRows[0];

  // Deduct from cashback balance
  const newBalance      = currentBalance - parsedAmount;
  const totalEarned     = parseFloat(rewards.total_earned || 0);
  const totalRedeemed   = parseFloat(rewards.total_redeemed || 0) + parsedAmount;

  await cashbackRepo.updateBalance(userId, newBalance, totalEarned, totalRedeemed);

  // Add to checking account
  await pool.query(
    `UPDATE accounts SET balance = balance + $1, updated_at = NOW() WHERE id = $2`,
    [parsedAmount, checkingAccount.id]
  );

  // Record the transaction
  const transaction = await cashbackRepo.createTransaction({
    userId,
    transactionId: null,
    type:          'redeemed',
    amount:        parsedAmount,
    merchant:      null,
    category:      null,
    multiplier:    null,
    description:   `Cashback redeemed to checking account`,
  });

  notify({
    userId,
    type:     'cashback_redeemed',
    title:    'Cashback redeemed',
    message:  `$${parsedAmount.toFixed(2)} in cashback rewards has been credited to your checking account.`,
    severity: 'success',
    metadata: { amount: parsedAmount, newBalance },
  });

  return transaction;
};

module.exports = { getMyCashback, redeemCashback };
