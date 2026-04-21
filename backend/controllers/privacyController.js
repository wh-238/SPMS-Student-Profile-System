const pool = require('../config/db');
const logChange = require('../utils/logChange');

exports.getMyPrivacy = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT * FROM privacy_settings WHERE user_id = $1',
      [userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateMyPrivacy = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      show_major,
      show_bio,
      show_phone,
      show_address,
      show_birthday
    } = req.body;

    await pool.query(
      `UPDATE privacy_settings
       SET show_major = $1,
           show_bio = $2,
           show_phone = $3,
           show_address = $4,
           show_birthday = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $6`,
      [show_major, show_bio, show_phone, show_address, show_birthday, userId]
    );

    await logChange(
      userId,
      'UPDATE_PRIVACY',
      'Updated privacy settings'
    );

    res.json({ message: 'Privacy updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};