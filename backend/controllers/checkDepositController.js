const checkDepositService = require('../services/checkDepositService');
const checkDepositRepo    = require('../repositories/checkDepositRepository');
const asyncHandler        = require('../utils/asyncHandler');
const AppError            = require('../utils/AppError');

const getAll = asyncHandler(async (req, res) => {
  const deposits = await checkDepositService.getMyDeposits(req.user.id);
  res.status(200).json({ status: 'success', data: { deposits } });
});

const submit = asyncHandler(async (req, res) => {
  const { accountId, amount, checkNumber, memo, frontImageData, backImageData } = req.body;
  const deposit = await checkDepositService.submitDeposit(req.user.id, {
    accountId,
    amount,
    checkNumber,
    memo,
    frontImageData,
    backImageData,
  });
  res.status(201).json({ status: 'success', data: { deposit } });
});

const getOne = asyncHandler(async (req, res) => {
  const deposit = await checkDepositRepo.findById(req.params.id);
  if (!deposit) throw new AppError('Check deposit not found', 404);

  // Verify ownership via account
  const accounts = req.accounts || (req.account ? [req.account] : []);
  const accountIds = accounts.map(a => a.id);
  if (!accountIds.includes(deposit.account_id)) {
    throw new AppError('Not authorised to view this deposit', 403);
  }

  res.status(200).json({ status: 'success', data: { deposit } });
});

module.exports = { getAll, submit, getOne };
