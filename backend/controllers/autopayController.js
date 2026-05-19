const autopayService = require('../services/autopayService');
const asyncHandler   = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
  const autopay = await autopayService.getMyAutopay(req.user.id);
  res.status(200).json({ status: 'success', data: { autopay } });
});

const create = asyncHandler(async (req, res) => {
  const { accountId, name, biller, amount, category, frequency, customDay, nextDueDate } = req.body;
  const autopay = await autopayService.createAutopay({
    userId: req.user.id,
    accountId,
    name,
    biller,
    amount,
    category,
    frequency,
    customDay,
    nextDueDate,
  });
  res.status(201).json({ status: 'success', data: { autopay } });
});

const update = asyncHandler(async (req, res) => {
  const autopay = await autopayService.updateAutopay(req.params.id, req.user.id, req.body);
  res.status(200).json({ status: 'success', data: { autopay } });
});

const remove = asyncHandler(async (req, res) => {
  await autopayService.deleteAutopay(req.params.id, req.user.id);
  res.status(204).send();
});

module.exports = { getAll, create, update, remove };
