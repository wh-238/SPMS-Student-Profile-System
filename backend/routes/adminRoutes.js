const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const {
  getAllUsers,
  getUserByIdForAdmin,
  getAllChangeLogs,
  getLogsByUserId,
  updateUserRole,
  deleteUserByAdmin,
  createUserByAdmin
} = require('../controllers/adminController');

// 所有 admin 路由都先过 auth + role
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// 用户管理
router.get('/users', getAllUsers);
router.post('/users', createUserByAdmin);
router.get('/users/:id', getUserByIdForAdmin);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUserByAdmin);

// 日志管理
router.get('/logs', getAllChangeLogs);
router.get('/logs/user/:id', getLogsByUserId);

module.exports = router;