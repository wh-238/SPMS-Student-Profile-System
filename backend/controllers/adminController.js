const pool = require('../config/db');
const logChange = require('../utils/logChange');
const bcrypt = require('bcrypt');

// 1. 获取所有用户
exports.getAllUsers = async (req, res) => {
  try {
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
        profiles.birthday,
        users.created_at,
        users.updated_at
      FROM users
      LEFT JOIN profiles ON users.id = profiles.user_id
      ORDER BY users.id ASC
      `
    );

    res.json(result.rows);
  } catch (error) {
    console.error('getAllUsers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. 获取单个用户详情
exports.getUserByIdForAdmin = async (req, res) => {
  try {
    const userId = req.params.id;

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
        profiles.birthday,
        privacy_settings.show_major,
        privacy_settings.show_bio,
        privacy_settings.show_phone,
        privacy_settings.show_address,
        privacy_settings.show_birthday,
        users.created_at,
        users.updated_at
      FROM users
      LEFT JOIN profiles ON users.id = profiles.user_id
      LEFT JOIN privacy_settings ON users.id = privacy_settings.user_id
      WHERE users.id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('getUserByIdForAdmin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. 获取所有 change logs
exports.getAllChangeLogs = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        change_logs.id,
        change_logs.user_id,
        users.name,
        change_logs.action,
        change_logs.details,
        change_logs.changed_at
      FROM change_logs
      LEFT JOIN users ON change_logs.user_id = users.id
      ORDER BY change_logs.changed_at DESC
      `
    );

    res.json(result.rows);
  } catch (error) {
    console.error('getAllChangeLogs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 4. 获取某个用户的 change logs
exports.getLogsByUserId = async (req, res) => {
  try {
    const userId = req.params.id;

    const result = await pool.query(
      `
      SELECT
        change_logs.id,
        change_logs.user_id,
        users.name,
        change_logs.action,
        change_logs.details,
        change_logs.changed_at
      FROM change_logs
      LEFT JOIN users ON change_logs.user_id = users.id
      WHERE change_logs.user_id = $1
      ORDER BY change_logs.changed_at DESC
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('getLogsByUserId error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 5. 修改用户角色（可选）
exports.updateUserRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const result = await pool.query(
      `
      UPDATE users
      SET role = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, name, email, role
      `,
      [role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('updateUserRole error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 6. 删除用户（admin）
exports.deleteUserByAdmin = async (req, res) => {
  const client = await pool.connect();

  try {
    const targetUserId = Number(req.params.id);
    const adminUserId = req.user?.id;

    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    if (!adminUserId) {
      return res.status(401).json({ message: 'Invalid token user' });
    }

    if (targetUserId === adminUserId) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    await client.query('BEGIN');

    const targetResult = await client.query(
      'SELECT id, name, email, role FROM users WHERE id = $1 FOR UPDATE',
      [targetUserId]
    );

    if (targetResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'User not found' });
    }

    const targetUser = targetResult.rows[0];

    if (targetUser.role === 'admin') {
      const adminCountResult = await client.query(
        "SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin'"
      );

      if (adminCountResult.rows[0].count <= 1) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Cannot delete the last admin account' });
      }
    }

    await client.query('DELETE FROM change_logs WHERE user_id = $1', [targetUserId]);
    await client.query('DELETE FROM privacy_settings WHERE user_id = $1', [targetUserId]);
    await client.query('DELETE FROM profiles WHERE user_id = $1', [targetUserId]);
    await client.query('DELETE FROM users WHERE id = $1', [targetUserId]);

    await client.query('COMMIT');

    await logChange(
      adminUserId,
      'ADMIN_DELETE_USER',
      `Deleted user ${targetUser.name} (id=${targetUser.id}, email=${targetUser.email}, role=${targetUser.role})`
    );

    res.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role
      }
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('deleteUserByAdmin rollback error:', rollbackError);
    }
    console.error('deleteUserByAdmin error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

// 7. 管理员新增用户
exports.createUserByAdmin = async (req, res) => {
  const client = await pool.connect();

  try {
    const { name, email, password, role } = req.body;
    const adminUserId = req.user?.id;

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const userRole = role === 'admin' ? 'admin' : 'user';

    if (!trimmedName) {
      return res.status(400).json({ message: 'Name is required' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (!password || String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    await client.query('BEGIN');

    const emailCheck = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (emailCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(String(password), salt);

    const userResult = await client.query(
      `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role
      `,
      [trimmedName, normalizedEmail, passwordHash, userRole]
    );

    const newUser = userResult.rows[0];

    await client.query(
      'INSERT INTO profiles (user_id) VALUES ($1)',
      [newUser.id]
    );

    await client.query(
      'INSERT INTO privacy_settings (user_id) VALUES ($1)',
      [newUser.id]
    );

    await client.query('COMMIT');

    await logChange(
      adminUserId,
      'ADMIN_CREATE_USER',
      `Created user ${newUser.name} (id=${newUser.id}, email=${newUser.email}, role=${newUser.role})`
    );

    return res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('createUserByAdmin rollback error:', rollbackError);
    }

    console.error('createUserByAdmin error:', error);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};