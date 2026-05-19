const creditScoreService = require('../services/creditScoreService');
const asyncHandler       = require('../utils/asyncHandler');

const getScore = asyncHandler(async (req, res) => {
  const data = await creditScoreService.getCreditScore(req.user.id);
  res.status(200).json({ status: 'success', data });
});

module.exports = { getScore };
