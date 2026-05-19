const cashbackService = require('../services/cashbackService');
const cashbackRepo    = require('../repositories/cashbackRepository');
const asyncHandler    = require('../utils/asyncHandler');

const getOverview = asyncHandler(async (req, res) => {
  const data = await cashbackService.getMyCashback(req.user.id);
  res.status(200).json({ status: 'success', data });
});

const getTransactions = asyncHandler(async (req, res) => {
  const transactions = await cashbackRepo.findTransactionsByUserId(req.user.id);
  res.status(200).json({ status: 'success', data: { transactions } });
});

const redeem = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const transaction = await cashbackService.redeemCashback(req.user.id, parseFloat(amount));
  res.status(201).json({ status: 'success', data: { transaction } });
});

module.exports = { getOverview, getTransactions, redeem };
