const supportService = require('../services/supportService');
const asyncHandler   = require('../utils/asyncHandler');

const createTicket = asyncHandler(async (req, res) => {
  const { subject, message } = req.body;
  const result = await supportService.createTicket({ userId: req.user.id, subject, message });
  res.status(201).json({ status: 'success', message: 'Ticket created successfully', data: result });
});

const getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await supportService.getMyTickets(req.user.id);
  res.json({ status: 'success', data: { tickets } });
});

const getTicketDetail = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const result  = await supportService.getTicketDetail(req.params.id, req.user.id, isAdmin);
  res.json({ status: 'success', data: result });
});

const addMessage = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const msg = await supportService.addMessage({
    ticketId:   req.params.id,
    userId:     req.user.id,
    senderRole: isAdmin ? 'admin' : 'user',
    message:    req.body.message,
    isAdmin,
  });
  res.status(201).json({ status: 'success', data: { message: msg } });
});

// Admin only
const getAllTickets = asyncHandler(async (req, res) => {
  const page    = parseInt(req.query.page  || 1);
  const limit   = parseInt(req.query.limit || 50);
  const tickets = await supportService.getAllTickets({ page, limit });
  res.json({ status: 'success', data: { tickets } });
});

const updateStatus = asyncHandler(async (req, res) => {
  const ticket = await supportService.setStatus(req.params.id, req.body.status);
  res.json({ status: 'success', data: { ticket } });
});

module.exports = { createTicket, getMyTickets, getTicketDetail, addMessage, getAllTickets, updateStatus };
