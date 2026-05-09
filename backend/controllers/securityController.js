const securityService = require('../services/securityService');
const asyncHandler    = require('../utils/asyncHandler');

const setPin = asyncHandler(async (req, res) => {
  await securityService.setPin(req.user.id, req.body.pin);
  res.json({ status: 'success', message: 'PIN set successfully' });
});

const verifyPin = asyncHandler(async (req, res) => {
  await securityService.verifyPin(req.user.id, req.body.pin);
  res.json({ status: 'success', message: 'PIN verified' });
});

const hasPin = asyncHandler(async (req, res) => {
  const result = await securityService.hasPin(req.user.id);
  res.json({ status: 'success', data: { hasPin: result } });
});

module.exports = { setPin, verifyPin, hasPin };
