const wireTransferService = require('../services/wireTransferService');
const wireTransferRepo    = require('../repositories/wireTransferRepository');
const asyncHandler        = require('../utils/asyncHandler');
const AppError            = require('../utils/AppError');

const getAll = asyncHandler(async (req, res) => {
  const transfers = await wireTransferService.getMyWireTransfers(req.user.id);
  res.status(200).json({ status: 'success', data: { transfers } });
});

const initiate = asyncHandler(async (req, res) => {
  const transfer = await wireTransferService.initiateWire(req.user.id, req.body);
  res.status(201).json({ status: 'success', data: { transfer } });
});

const getOne = asyncHandler(async (req, res) => {
  const transfer = await wireTransferRepo.findById(req.params.id);
  if (!transfer) throw new AppError('Wire transfer not found', 404);

  // Verify ownership via account
  const accounts   = req.accounts || (req.account ? [req.account] : []);
  const accountIds = accounts.map(a => a.id);
  if (!accountIds.includes(transfer.account_id)) {
    throw new AppError('Not authorised to view this wire transfer', 403);
  }

  res.status(200).json({ status: 'success', data: { transfer } });
});

const cancel = asyncHandler(async (req, res) => {
  const transfer = await wireTransferService.cancelWire(req.params.id, req.user.id);
  res.status(200).json({ status: 'success', data: { transfer } });
});

module.exports = { getAll, initiate, getOne, cancel };
