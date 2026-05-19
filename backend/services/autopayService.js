const { pool }      = require('../config/database');
const autopayRepo   = require('../repositories/autopayRepository');
const AppError      = require('../utils/AppError');

const getMyAutopay = async (userId) => {
  return autopayRepo.findByUserId(userId);
};

const createAutopay = async ({ userId, accountId, name, biller, amount, category, frequency, customDay, nextDueDate }) => {
  // Verify account belongs to user
  const { rows } = await pool.query(
    `SELECT id FROM accounts WHERE id = $1 AND user_id = $2`,
    [accountId, userId]
  );
  if (!rows.length) throw new AppError('Account not found or does not belong to you', 404);

  return autopayRepo.create({ userId, accountId, name, biller, amount, category, frequency, customDay, nextDueDate });
};

const updateAutopay = async (id, userId, fields) => {
  const autopay = await autopayRepo.findById(id);
  if (!autopay) throw new AppError('Autopay not found', 404);
  if (autopay.user_id !== userId) throw new AppError('Not authorised to update this autopay', 403);

  return autopayRepo.update(id, fields);
};

const deleteAutopay = async (id, userId) => {
  const autopay = await autopayRepo.findById(id);
  if (!autopay) throw new AppError('Autopay not found', 404);
  if (autopay.user_id !== userId) throw new AppError('Not authorised to delete this autopay', 403);

  await autopayRepo.remove(id);
};

module.exports = { getMyAutopay, createAutopay, updateAutopay, deleteAutopay };
