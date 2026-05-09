const Joi = require('joi');

const transfer = Joi.object({
  senderAccountNumber: Joi.string().trim().uppercase().required(),
  toAccountNumber:     Joi.string().trim().uppercase().required(),
  amount:  Joi.number().positive().precision(2).max(50000).required(),
  description: Joi.string().trim().max(255).optional().allow(''),
});

const adminAction = Joi.object({
  accountId:   Joi.string().uuid().required(),
  amount:      Joi.number().positive().precision(2).required(),
  description: Joi.string().trim().max(255).optional().allow(''),
});

module.exports = { transfer, adminAction };
