const supportRepo = require('../repositories/supportRepository');
const AppError    = require('../utils/AppError');

const fmtTicket = (t) => ({
  id:           t.id,
  subject:      t.subject,
  status:       t.status,
  messageCount: t.message_count ?? 0,
  userName:     t.user_name,
  userId:       t.user_id,
  createdAt:    t.created_at,
  updatedAt:    t.updated_at,
});

const fmtMessage = (m) => ({
  id:         m.id,
  ticketId:   m.ticket_id,
  message:    m.message,
  senderRole: m.sender_role,
  senderName: m.sender_name,
  userId:     m.user_id,
  createdAt:  m.created_at,
});

const createTicket = async ({ userId, subject, message }) => {
  const ticket = await supportRepo.createTicket({ userId, subject });
  const msg    = await supportRepo.addMessage({
    ticketId:   ticket.id,
    userId,
    senderRole: 'user',
    message,
  });
  return {
    ticket:   fmtTicket({ ...ticket, message_count: 1 }),
    message:  fmtMessage(msg),
    success:  'Ticket created successfully',
  };
};

const getMyTickets = async (userId) => {
  const rows = await supportRepo.findByUserId(userId);
  return rows.map(fmtTicket);
};

const getTicketDetail = async (ticketId, userId, isAdmin) => {
  const ticket = await supportRepo.findById(ticketId);
  if (!ticket) throw new AppError('Ticket not found', 404);
  if (!isAdmin && ticket.user_id !== userId) throw new AppError('Not authorised', 403);

  const messages = await supportRepo.findMessages(ticketId);
  return {
    ticket:   fmtTicket(ticket),
    messages: messages.map(fmtMessage),
  };
};

const addMessage = async ({ ticketId, userId, senderRole, message, isAdmin }) => {
  const ticket = await supportRepo.findById(ticketId);
  if (!ticket) throw new AppError('Ticket not found', 404);
  if (ticket.status === 'resolved') throw new AppError('This ticket is already resolved', 400);
  if (!isAdmin && ticket.user_id !== userId) throw new AppError('Not authorised', 403);

  const msg = await supportRepo.addMessage({ ticketId, userId, senderRole, message });

  // Status transitions: user reply re-opens a pending ticket; admin reply pends an open one
  if (senderRole === 'user'  && ticket.status === 'pending') await supportRepo.updateStatus(ticketId, 'open');
  if (senderRole === 'admin' && ticket.status === 'open')    await supportRepo.updateStatus(ticketId, 'pending');

  return fmtMessage(msg);
};

const getAllTickets = async ({ page, limit } = {}) => {
  const rows = await supportRepo.findAll({ page, limit });
  return rows.map(fmtTicket);
};

const setStatus = async (ticketId, status) => {
  const ticket = await supportRepo.findById(ticketId);
  if (!ticket) throw new AppError('Ticket not found', 404);
  await supportRepo.updateStatus(ticketId, status);
  // Re-fetch with JOINs so the response includes user_name and message_count,
  // not the bare UPDATE RETURNING * row which lacks those computed fields.
  const updated = await supportRepo.findById(ticketId);
  return fmtTicket(updated);
};

module.exports = { createTicket, getMyTickets, getTicketDetail, addMessage, getAllTickets, setStatus };
