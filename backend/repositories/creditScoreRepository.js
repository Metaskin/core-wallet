const { pool } = require('../config/database');

const findHistoryByUserId = async (userId, limit = 18, client = pool) => {
  const { rows } = await client.query(
    `SELECT * FROM credit_score_history WHERE user_id = $1 ORDER BY month_year DESC LIMIT $2`,
    [userId, limit]
  );
  return rows;
};

module.exports = { findHistoryByUserId };
