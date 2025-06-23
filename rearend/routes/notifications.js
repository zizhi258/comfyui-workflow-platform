const express = require('express');
const router = express.Router();
const { protect: authenticateToken } = require('../middleware/authMiddleware');
const {
  getUserNotifications,
  markNotificationAsRead,
  markNotificationsAsRead,
  deleteNotification,
  getUnreadCount
} = require('../controllers/notificationController');

// 获取用户通知列表（需要认证）
router.get('/', authenticateToken, getUserNotifications);

// 获取未读通知数量（需要认证）
router.get('/unread-count', authenticateToken, getUnreadCount);

// 标记单个通知为已读（需要认证）
router.put('/:id/read', authenticateToken, markNotificationAsRead);

// 批量标记通知为已读（需要认证）
router.put('/mark-read', authenticateToken, markNotificationsAsRead);

// 删除通知（需要认证）
router.delete('/:id', authenticateToken, deleteNotification);

module.exports = router;