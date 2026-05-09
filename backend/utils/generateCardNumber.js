const { CARD } = require('../config/constants');

const luhnChecksum = (digits) => {
  let sum = 0, isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i]);
    if (isEven) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    isEven = !isEven;
  }
  return sum;
};

/** Luhn-valid 16-digit raw string (no spaces) */
const generateCardNumber = (type = 'debit') => {
  const prefix = type === 'credit' ? CARD.CREDIT_PREFIX : CARD.DEBIT_PREFIX;
  let partial = prefix;
  while (partial.length < 15) {
    partial += Math.floor(Math.random() * 10).toString();
  }
  const checkDigit = (10 - (luhnChecksum(partial + '0') % 10)) % 10;
  return partial + checkDigit;
};

/** "XXXX XXXX XXXX XXXX" display format */
const formatCardNumber = (raw) =>
  String(raw).replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();

/** 3-digit CVV string */
const generateCVV = () =>
  Math.floor(100 + Math.random() * 900).toString();

/** Expiry — returns integers so the DB column (INT) matches */
const generateExpiry = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1,                     // 1–12
    year:  now.getFullYear() + CARD.EXPIRY_YEARS,  // e.g. 2028
  };
};

module.exports = { generateCardNumber, formatCardNumber, generateCVV, generateExpiry };
