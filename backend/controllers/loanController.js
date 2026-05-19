const loanService  = require('../services/loanService');
const asyncHandler = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
  const loans = await loanService.getMyLoans(req.user.id);
  res.status(200).json({ status: 'success', data: { loans } });
});

const getOne = asyncHandler(async (req, res) => {
  const loan = await loanService.getLoanDetail(req.params.id, req.user.id);
  res.status(200).json({ status: 'success', data: { loan } });
});

const makePayment = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const payment = await loanService.makePayment(req.params.id, req.user.id, parseFloat(amount));
  res.status(201).json({ status: 'success', data: { payment } });
});

module.exports = { getAll, getOne, makePayment };
