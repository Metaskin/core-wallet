const Joi = require('joi');

const pinSchema = Joi.object({
  pin: Joi.string().pattern(/^\d{4,6}$/).required().messages({
    'string.pattern.base': 'PIN must be 4 to 6 digits',
    'any.required':        'PIN is required',
  }),
});

module.exports = { pinSchema };
