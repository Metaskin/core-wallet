const Joi = require('joi');

const createTicket = Joi.object({
  subject: Joi.string().min(5).max(255).required(),
  message: Joi.string().min(10).max(5000).required(),
});

const addMessage = Joi.object({
  message: Joi.string().min(1).max(5000).required(),
});

const updateStatus = Joi.object({
  status: Joi.string().valid('open', 'pending', 'resolved').required(),
});

module.exports = { createTicket, addMessage, updateStatus };
