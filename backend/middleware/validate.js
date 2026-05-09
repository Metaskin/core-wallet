const AppError = require('../utils/AppError');

/**
 * Factory: returns an Express middleware that validates req.body against a Joi schema.
 * On failure, throws a 422 AppError with the first validation message.
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: true, stripUnknown: true });
  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }
  req.body = value;
  next();
};

module.exports = validate;
