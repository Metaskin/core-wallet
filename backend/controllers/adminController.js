const txService      = require('../services/transactionService');
const accountService = require('../services/accountService');
const authService    = require('../services/authService');
const userRepo       = require('../repositories/userRepository');
const asyncHandler   = require('../utils/asyncHandler');

const getAllUsers = asyncHandler(async (req, res) => {
  const rows = await userRepo.findAll();
  const users = rows.map(r => ({
    id:          r.id,
    email:       r.email,
    fullName:    r.full_name,
    role:        r.role,
    avatarColor: r.avatar_color,
    isActive:    r.is_active,
    createdAt:   r.created_at,
    lastLoginAt: r.last_login_at,
    account: r.account_id ? {
      id:            r.account_id,
      accountNumber: r.account_number,
      balance:       parseFloat(r.balance),
      currency:      r.currency,
      status:        r.account_status,
    } : null,
  }));
  res.json({ status: 'success', data: { users, total: users.length } });
});

const createUser = asyncHandler(async (req, res) => {
  const { email, password, fullName, avatarColor, initialBalance } = req.body;
  const result = await authService.register({ email, password, fullName, avatarColor });

  // Optionally seed initial balance
  if (initialBalance && parseFloat(initialBalance) > 0) {
    await txService.adminCredit({
      accountId:   result.account.id,
      amount:      parseFloat(initialBalance),
      description: 'Account opening balance',
      adminId:     req.user.id,
    });
  }

  res.status(201).json({ status: 'success', data: result });
});

const creditAccount = asyncHandler(async (req, res) => {
  const { accountId, amount, description } = req.body;
  const tx = await txService.adminCredit({
    accountId, amount: parseFloat(amount), description, adminId: req.user.id,
  });
  res.json({ status: 'success', data: { transaction: tx } });
});

const debitAccount = asyncHandler(async (req, res) => {
  const { accountId, amount, description } = req.body;
  const tx = await txService.adminDebit({
    accountId, amount: parseFloat(amount), description, adminId: req.user.id,
  });
  res.json({ status: 'success', data: { transaction: tx } });
});

const toggleAccountStatus = asyncHandler(async (req, res) => {
  const account = await accountService.toggleStatus(req.params.accountId);
  res.json({ status: 'success', data: { account } });
});

const getAllTransactions = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page  || 1));
  const limit = Math.min(100,  parseInt(req.query.limit || 50));
  const { rows, total } = await txService.getAllTransactions({ page, limit });
  res.json({
    status: 'success',
    data: { transactions: rows, pagination: { page, limit, total } },
  });
});

module.exports = { getAllUsers, createUser, creditAccount, debitAccount, toggleAccountStatus, getAllTransactions };
