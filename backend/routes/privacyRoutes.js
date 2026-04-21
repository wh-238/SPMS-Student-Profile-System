const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { getMyPrivacy, updateMyPrivacy } = require('../controllers/privacyController');

router.get('/me', authMiddleware, getMyPrivacy);
router.put('/me', authMiddleware, updateMyPrivacy);

module.exports = router;
