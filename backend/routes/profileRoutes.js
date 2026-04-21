const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { getMyProfile, updateMyProfile, getPublicProfile } = require('../controllers/profileController');

router.get('/me', authMiddleware, getMyProfile);
router.put('/me', authMiddleware, updateMyProfile);
router.get('/public/:id', getPublicProfile);

module.exports = router;