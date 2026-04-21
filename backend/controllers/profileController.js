const pool = require('../config/db');
const logChange = require('../utils/logChange');

exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT 
        users.id,
        users.name,
        users.email,
        users.role,
        profiles.major,
        profiles.bio,
        profiles.phone,
        profiles.address,
        profiles.birthday
      FROM users
      LEFT JOIN profiles ON users.id = profiles.user_id
      WHERE users.id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, major, bio, phone, address, birthday } = req.body;

    await pool.query(
      `UPDATE users
       SET name = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [name, userId]
    );

    await pool.query(
      `UPDATE profiles
       SET major = $1,
           bio = $2,
           phone = $3,
           address = $4,
           birthday = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $6`,
      [major, bio, phone, address, birthday, userId]
    );

    await logChange(
      userId,
      'UPDATE_PROFILE',
      'Updated profile information'
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPublicProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    // 1. 查用户 + profile
    const userResult = await pool.query(
      `
      SELECT
        users.id,
        users.name,
        users.email,
        profiles.major,
        profiles.bio,
        profiles.phone,
        profiles.address,
        profiles.birthday
      FROM users
      LEFT JOIN profiles ON users.id = profiles.user_id
      WHERE users.id = $1
      `,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    // 2. 查隐私设置
    const privacyResult = await pool.query(
      `SELECT * FROM privacy_settings WHERE user_id = $1`,
      [userId]
    );

    const privacy = privacyResult.rows[0] || {};

    // 3. 构造返回数据（重点）
    const publicProfile = {
      id: user.id,
      name: user.name,
    };

    if (privacy.show_major) publicProfile.major = user.major;
    if (privacy.show_bio) publicProfile.bio = user.bio;
    if (privacy.show_phone) publicProfile.phone = user.phone;
    if (privacy.show_address) publicProfile.address = user.address;
    if (privacy.show_birthday) publicProfile.birthday = user.birthday;

    res.json(publicProfile);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};