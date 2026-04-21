const express = require('express');
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// 发送消息（需要认证）
router.post('/send', authMiddleware, chatController.sendMessage);

// 获取对话历史（需要认证）
router.get('/history/:userId', authMiddleware, chatController.getHistory);

// 清除对话历史（需要认证）
router.delete('/history/:userId', authMiddleware, chatController.clearHistory);

module.exports = router;
