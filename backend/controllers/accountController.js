const accountService = require('../services/accountService');
const asyncHandler   = require('../utils/asyncHandler');

const getMyAccount = asyncHandler(async (req, res) => {
  const account = await accountService.getMyAccount(req.user.id);
  res.json({ status: 'success', data: { account } });
});

module.exports = { getMyAccount };
