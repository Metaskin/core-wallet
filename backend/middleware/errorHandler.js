const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal server error';

  // Postgres unique-constraint violation
  if (err.code === '23505') {
    statusCode = 409;
    message = 'A record with that value already exists';
  }

  // Postgres foreign-key violation
  if (err.code === '23503') {
    statusCode = 400;
    message = 'Referenced record does not exist';
  }

  // JWT errors (shouldn't normally reach here — authService re-throws AppError)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Don't leak internals in production client responses
  if (process.env.NODE_ENV === 'production' && !err.isOperational) {
    statusCode = 500;
    message = 'Something went wrong';
  }

  // Always log to server console — in production this surfaces in Render logs
  // and is the only way to diagnose non-operational 500 errors.
  console.error(`[${req.method}] ${req.path} ${statusCode} — ${err.stack || err.message}`);

  res.status(statusCode).json({
    status:  statusCode < 500 ? 'fail' : 'error',
    message,
  });
};

module.exports = errorHandler;
