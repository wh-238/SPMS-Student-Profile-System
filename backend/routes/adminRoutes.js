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
const {
  getReportedPostsForAdmin,
  moderatePost
} = require('../controllers/postsController');

router.use(authMiddleware);
router.use(roleMiddleware('admin'));

router.get('/users', getAllUsers);
router.post('/users', createUserByAdmin);
router.get('/users/:id', getUserByIdForAdmin);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUserByAdmin);

router.get('/logs', getAllChangeLogs);
router.get('/logs/user/:id', getLogsByUserId);

router.get('/posts/reports', getReportedPostsForAdmin);
router.post('/posts/:id/moderate', moderatePost);

module.exports = router;
