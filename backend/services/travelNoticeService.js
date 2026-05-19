const travelNoticeRepo = require('../repositories/travelNoticeRepository');
const AppError         = require('../utils/AppError');
const { notify }       = require('./notificationService');

const getMyTravelNotices = async (userId) => {
  return travelNoticeRepo.findByUserId(userId);
};

const createTravelNotice = async (userId, data) => {
  const { destination, destinationCountry, startDate, endDate, emergencyContactName, emergencyContactPhone, notes } = data;

  if (!startDate || !endDate) throw new AppError('Start date and end date are required', 400);
  if (new Date(endDate) <= new Date(startDate)) {
    throw new AppError('End date must be after start date', 400);
  }

  const notice = await travelNoticeRepo.create({
    userId,
    destination,
    destinationCountry,
    startDate,
    endDate,
    emergencyContactName,
    emergencyContactPhone,
    notes,
  });

  notify({
    userId,
    type:     'travel_notice_submitted',
    title:    'Travel notice submitted',
    message:  `Your travel notice for ${destination} has been submitted successfully.`,
    severity: 'info',
    metadata: { destination, startDate, endDate },
  });

  return notice;
};

const updateTravelNotice = async (id, userId, data) => {
  const notice = await travelNoticeRepo.findById(id);
  if (!notice) throw new AppError('Travel notice not found', 404);
  if (notice.user_id !== userId) throw new AppError('Not authorised to update this travel notice', 403);

  return travelNoticeRepo.update(id, data);
};

const cancelTravelNotice = async (id, userId) => {
  const notice = await travelNoticeRepo.findById(id);
  if (!notice) throw new AppError('Travel notice not found', 404);
  if (notice.user_id !== userId) throw new AppError('Not authorised to cancel this travel notice', 403);

  return travelNoticeRepo.update(id, { status: 'cancelled' });
};

module.exports = { getMyTravelNotices, createTravelNotice, updateTravelNotice, cancelTravelNotice };
