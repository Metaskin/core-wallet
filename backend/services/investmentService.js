const { pool, withTransaction } = require('../config/database');
const investmentRepo            = require('../repositories/investmentRepository');
const AppError                  = require('../utils/AppError');
const { notify }                = require('./notificationService');

const getInvestmentOverview = async (userId) => {
  const account = await investmentRepo.findAccountByUserId(userId);
  if (!account) throw new AppError('Investment account not found', 404);

  const [holdings, transactions] = await Promise.all([
    investmentRepo.findHoldingsByAccountId(account.id),
    investmentRepo.findTransactionsByAccountId(account.id),
  ]);

  // Compute asset allocation percentages
  const totalValue = holdings.reduce((sum, h) => sum + parseFloat(h.current_value || 0), 0);
  const holdingsWithAllocation = holdings.map(h => {
    const currentValue = parseFloat(h.current_value || 0);
    const allocationPct = totalValue > 0
      ? parseFloat((currentValue / totalValue * 100).toFixed(2))
      : 0;
    return { ...h, allocation_percentage: allocationPct };
  });

  return {
    account,
    holdings:     holdingsWithAllocation,
    transactions,
    totalValue,
  };
};

const transferFunds = async (userId, direction, amount) => {
  if (!['to_investment', 'from_investment'].includes(direction)) {
    throw new AppError('Invalid transfer direction', 400);
  }
  if (amount <= 0) throw new AppError('Transfer amount must be greater than zero', 400);

  const investmentAccount = await investmentRepo.findAccountByUserId(userId);
  if (!investmentAccount) throw new AppError('Investment account not found', 404);

  // Find checking account for this user
  const { rows: checkingRows } = await pool.query(
    `SELECT * FROM accounts WHERE user_id = $1 AND account_type = 'checking' AND status = 'active' LIMIT 1`,
    [userId]
  );
  if (!checkingRows.length) throw new AppError('Checking account not found', 404);
  const checkingAccount = checkingRows[0];

  let _notif = null;

  await withTransaction(async (client) => {
    // Lock both accounts
    await client.query(`SELECT id FROM accounts WHERE id = $1 FOR UPDATE`, [checkingAccount.id]);
    await client.query(`SELECT id FROM investment_accounts WHERE id = $1 FOR UPDATE`, [investmentAccount.id]);

    const checkingBalance    = parseFloat(checkingAccount.balance);
    const investmentBalance  = parseFloat(investmentAccount.balance);

    if (direction === 'to_investment') {
      if (checkingBalance < amount) throw new AppError('Insufficient balance in checking account', 400);

      // Deduct from checking
      await client.query(
        `UPDATE accounts SET balance = balance - $1, updated_at = NOW() WHERE id = $2`,
        [amount, checkingAccount.id]
      );
      // Add to investment
      const newInvestmentBalance = investmentBalance + amount;
      await investmentRepo.updateAccountBalance(investmentAccount.id, newInvestmentBalance, client);
      // Create investment transaction
      await investmentRepo.createTransfer({
        accountId:   investmentAccount.id,
        type:        'deposit',
        amount,
        description: 'Transfer from checking account',
      }, client);

      _notif = {
        userId,
        type:    'investment_deposit',
        title:   'Investment deposit',
        message: `$${parseFloat(amount).toFixed(2)} has been transferred to your investment account.`,
      };
    } else {
      // from_investment
      if (investmentBalance < amount) throw new AppError('Insufficient balance in investment account', 400);

      // Deduct from investment
      const newInvestmentBalance = investmentBalance - amount;
      await investmentRepo.updateAccountBalance(investmentAccount.id, newInvestmentBalance, client);
      // Add to checking
      await client.query(
        `UPDATE accounts SET balance = balance + $1, updated_at = NOW() WHERE id = $2`,
        [amount, checkingAccount.id]
      );
      // Create investment transaction
      await investmentRepo.createTransfer({
        accountId:   investmentAccount.id,
        type:        'withdrawal',
        amount,
        description: 'Transfer to checking account',
      }, client);

      _notif = {
        userId,
        type:    'investment_withdrawal',
        title:   'Investment withdrawal',
        message: `$${parseFloat(amount).toFixed(2)} has been transferred from your investment account.`,
      };
    }
  });

  if (_notif) {
    notify({
      userId:   _notif.userId,
      type:     _notif.type,
      title:    _notif.title,
      message:  _notif.message,
      severity: 'info',
      metadata: { direction, amount },
    });
  }

  return { direction, amount };
};

module.exports = { getInvestmentOverview, transferFunds };
