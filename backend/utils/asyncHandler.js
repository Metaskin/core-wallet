/**
 * Wraps async route handlers so thrown errors are forwarded to Express error middleware.
 * Not strictly required for Express 5 but keeps compatibility with Express 4.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
