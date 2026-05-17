const txService    = require('../services/transactionService');
const asyncHandler = require('../utils/asyncHandler');
const AppError     = require('../utils/AppError');
const { PAGINATION } = require('../config/constants');

const transfer = asyncHandler(async (req, res) => {
  const { senderAccountNumber, toAccountNumber, amount, description } = req.body;
  const tx = await txService.transfer({
    senderAccountNumber,
    toAccountNumber,
    amount: parseFloat(amount),
    description,
    userId: req.user.id,
  });
  res.status(201).json({ status: 'success', data: { transaction: tx } });
});

const getMyTransactions = asyncHandler(async (req, res) => {
  const accounts = req.accounts || (req.account ? [req.account] : []);
  if (!accounts.length) {
    return res.json({ status: 'success', data: { transactions: [], pagination: { page: 1, limit: 20, total: 0 } } });
  }
  const page  = Math.max(1, parseInt(req.query.page  || PAGINATION.DEFAULT_PAGE));
  const limit = Math.min(PAGINATION.MAX_LIMIT, parseInt(req.query.limit || PAGINATION.DEFAULT_LIMIT));
  const accountIds = accounts.map(a => a.id);

  const { rows, total } = await txService.getMyTransactions(accountIds, { page, limit });
  res.json({
    status: 'success',
    data: {
      transactions: rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

const getAllTransactions = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page  || PAGINATION.DEFAULT_PAGE));
  const limit = Math.min(PAGINATION.MAX_LIMIT, parseInt(req.query.limit || PAGINATION.DEFAULT_LIMIT));

  const { rows, total } = await txService.getAllTransactions({ page, limit });
  res.json({
    status: 'success',
    data: {
      transactions: rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

const deleteTransaction = asyncHandler(async (req, res) => {
  const accounts = req.accounts || (req.account ? [req.account] : []);
  if (!accounts.length) throw new AppError('Account not found', 404);
  await txService.deleteTransaction({
    transactionId: req.params.id,
    accountIds:    accounts.map(a => a.id),
  });
  res.json({ status: 'success', message: 'Transaction deleted' });
});

module.exports = { transfer, getMyTransactions, getAllTransactions, deleteTransaction };
