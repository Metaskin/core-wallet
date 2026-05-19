const beneficiaryService = require('../services/beneficiaryService');
const asyncHandler       = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
  const beneficiaries = await beneficiaryService.getMyBeneficiaries(req.user.id);
  res.status(200).json({ status: 'success', data: { beneficiaries } });
});

const create = asyncHandler(async (req, res) => {
  const beneficiary = await beneficiaryService.addBeneficiary(req.user.id, req.body);
  res.status(201).json({ status: 'success', data: { beneficiary } });
});

const update = asyncHandler(async (req, res) => {
  const beneficiary = await beneficiaryService.updateBeneficiary(req.params.id, req.user.id, req.body);
  res.status(200).json({ status: 'success', data: { beneficiary } });
});

const remove = asyncHandler(async (req, res) => {
  await beneficiaryService.deleteBeneficiary(req.params.id, req.user.id);
  res.status(204).send();
});

module.exports = { getAll, create, update, remove };
