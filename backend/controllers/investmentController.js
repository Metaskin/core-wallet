const investmentService = require('../services/investmentService');
const investmentRepo    = require('../repositories/investmentRepository');
const asyncHandler      = require('../utils/asyncHandler');
const AppError          = require('../utils/AppError');

const getOverview = asyncHandler(async (req, res) => {
  const overview = await investmentService.getInvestmentOverview(req.user.id);
  res.status(200).json({ status: 'success', data: overview });
});

const transfer = asyncHandler(async (req, res) => {
  const { direction, amount } = req.body;
  const result = await investmentService.transferFunds(req.user.id, direction, parseFloat(amount));
  res.status(201).json({ status: 'success', data: result });
});

const getTransactions = asyncHandler(async (req, res) => {
  const account = await investmentRepo.findAccountByUserId(req.user.id);
  if (!account) throw new AppError('Investment account not found', 404);
  const transactions = await investmentRepo.findTransactionsByAccountId(account.id);
  res.status(200).json({ status: 'success', data: { transactions } });
});

module.exports = { getOverview, transfer, getTransactions };
