const accountService = require('../services/accountService');
const asyncHandler   = require('../utils/asyncHandler');
const AppError       = require('../utils/AppError');

// GET /accounts/me — returns all accounts (checking + savings)
const getMyAccounts = asyncHandler(async (req, res) => {
  const accounts = await accountService.getMyAccounts(req.user.id);
  const primary  = accounts.find(a => a.accountType === 'checking') || accounts[0];
  res.json({ status: 'success', data: { account: primary, accounts } });
});

// POST /accounts/savings — open a savings account
const createSavingsAccount = asyncHandler(async (req, res) => {
  const account = await accountService.createSavingsAccount(req.user.id);
  res.status(201).json({ status: 'success', data: { account } });
});

// POST /accounts/internal-transfer — move money between own accounts
const internalTransfer = asyncHandler(async (req, res) => {
  const { fromAccountId, toAccountId, amount, description } = req.body;
  if (!fromAccountId || !toAccountId) throw new AppError('fromAccountId and toAccountId are required', 400);
  if (!amount || isNaN(parseFloat(amount))) throw new AppError('Valid amount is required', 400);

  const tx = await accountService.internalTransfer({
    userId:        req.user.id,
    fromAccountId,
    toAccountId,
    amount:        parseFloat(amount),
    description,
  });
  res.status(201).json({ status: 'success', data: { transaction: tx } });
});

module.exports = { getMyAccounts, createSavingsAccount, internalTransfer };
