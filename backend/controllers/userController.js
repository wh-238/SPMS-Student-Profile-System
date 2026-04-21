const pool = require('../config/db');

exports.searchUsers = async (req, res) => {
  try {
    const keyword = req.query.keyword || '';
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 5, 1), 20);
    const offset = (page - 1) * limit;

    const sort = req.query.sort === 'desc' ? 'DESC' : 'ASC';

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM users
       WHERE name ILIKE $1`,
      [`%${keyword}%`]
    );

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    const result = await pool.query(
      `
      SELECT 
        users.id,
        users.name,
        profiles.major,
        profiles.bio,
        profiles.phone,
        profiles.address,
        profiles.birthday,
        privacy_settings.show_major,
        privacy_settings.show_bio,
        privacy_settings.show_phone,
        privacy_settings.show_address,
        privacy_settings.show_birthday
      FROM users
      LEFT JOIN profiles ON users.id = profiles.user_id
      LEFT JOIN privacy_settings ON users.id = privacy_settings.user_id
      WHERE users.name ILIKE $1
      ORDER BY users.name ${sort}
      LIMIT $2 OFFSET $3
      `,
      [`%${keyword}%`, limit, offset]
    );

    const users = result.rows.map(user => {
      const publicUser = {
        id: user.id,
        name: user.name
      };

      if (user.show_major && user.major) publicUser.major = user.major;
      if (user.show_bio && user.bio) publicUser.bio = user.bio;
      if (user.show_phone && user.phone) publicUser.phone = user.phone;
      if (user.show_address && user.address) publicUser.address = user.address;
      if (user.show_birthday && user.birthday) publicUser.birthday = user.birthday;

      return publicUser;
    });

    if (users.length === 0) {
      return res.json({
        page,
        limit,
        total,
        totalPages,
        users: [],
        message: 'No users found'
      });
    }

    res.json({
      page,
      limit,
      total,
      totalPages,
      users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};