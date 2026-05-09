const Joi = require('joi');

const issueCard = Joi.object({
  type:        Joi.string().valid('debit', 'credit', 'virtual').default('debit'),
  cardType:    Joi.string().valid('debit', 'credit', 'virtual').default('debit'),
  design:      Joi.string().valid('blue', 'black', 'gold').default('blue'),
  creditLimit: Joi.number().positive().max(50000).optional(),
});

module.exports = { issueCard };
