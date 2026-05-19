const billPayService = require('../services/billPayService');
const asyncHandler   = require('../utils/asyncHandler');

const getBillers = asyncHandler(async (req, res) => {
  const billers = await billPayService.getBillers(req.user.id);
  res.status(200).json({ status: 'success', data: { billers } });
});

const addBiller = asyncHandler(async (req, res) => {
  const biller = await billPayService.addBiller(req.user.id, req.body);
  res.status(201).json({ status: 'success', data: { biller } });
});

const removeBiller = asyncHandler(async (req, res) => {
  await billPayService.removeBiller(req.params.id, req.user.id);
  res.status(204).send();
});

const getPayments = asyncHandler(async (req, res) => {
  const payments = await billPayService.getPayments(req.user.id);
  res.status(200).json({ status: 'success', data: { payments } });
});

const schedulePayment = asyncHandler(async (req, res) => {
  const payment = await billPayService.schedulePayment(req.user.id, req.body);
  res.status(201).json({ status: 'success', data: { payment } });
});

const cancelPayment = asyncHandler(async (req, res) => {
  const payment = await billPayService.cancelPayment(req.params.id, req.user.id);
  res.status(200).json({ status: 'success', data: { payment } });
});

module.exports = { getBillers, addBiller, removeBiller, getPayments, schedulePayment, cancelPayment };
