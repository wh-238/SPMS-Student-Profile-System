const pool = require('../config/db');

const logChange = async (userId, action, details = '') => {
  try {
    await pool.query(
      `
      INSERT INTO change_logs (user_id, action, details)
      VALUES ($1, $2, $3)
      `,
      [userId, action, details]
    );
  } catch (error) {
    console.error('Error logging change:', error);
  }
};

module.exports = logChange;