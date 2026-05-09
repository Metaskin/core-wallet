module.exports = {
  JWT_SECRET:     process.env.JWT_SECRET     || 'corewallet_dev_secret_change_in_prod',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  BCRYPT_ROUNDS: 12,

  TRANSFER: {
    MAX_AMOUNT: parseFloat(process.env.MAX_TRANSFER_AMOUNT || '50000'),
    MIN_AMOUNT: parseFloat(process.env.MIN_TRANSFER_AMOUNT || '0.01'),
  },

  PAGINATION: {
    DEFAULT_PAGE:  1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT:     100,
  },

  CARD: {
    DEBIT_PREFIX: '4',   // Visa-style
    CREDIT_PREFIX: '5',  // Mastercard-style
    EXPIRY_YEARS: 3,
  },

  ACCOUNT: {
    NUMBER_PREFIX: 'CW',
    NUMBER_LENGTH: 10,
  },
};
