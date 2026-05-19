const travelNoticeService = require('../services/travelNoticeService');
const asyncHandler        = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
  const notices = await travelNoticeService.getMyTravelNotices(req.user.id);
  res.status(200).json({ status: 'success', data: { notices } });
});

const create = asyncHandler(async (req, res) => {
  const notice = await travelNoticeService.createTravelNotice(req.user.id, req.body);
  res.status(201).json({ status: 'success', data: { notice } });
});

const update = asyncHandler(async (req, res) => {
  const notice = await travelNoticeService.updateTravelNotice(req.params.id, req.user.id, req.body);
  res.status(200).json({ status: 'success', data: { notice } });
});

const cancel = asyncHandler(async (req, res) => {
  const notice = await travelNoticeService.cancelTravelNotice(req.params.id, req.user.id);
  res.status(200).json({ status: 'success', data: { notice } });
});

module.exports = { getAll, create, update, cancel };
