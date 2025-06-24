const express = require('express');
const router = express.Router();
const { protect: authenticateToken, optionalAuth } = require('../middleware/authMiddleware');
const {
  saveWork,
  getUserWorks,
  getPublicGallery,
  getWorkById,
  updateWork,
  deleteWork,
  toggleWorkLike,
  getUserStats,
  incrementWorkView
} = require('../controllers/worksController');

// 保存作品到画廊（需要认证）
router.post('/save', authenticateToken, saveWork);

// 获取用户的作品列表（需要认证）
router.get('/my', authenticateToken, getUserWorks);

// 获取用户统计信息（需要认证）
router.get('/stats', authenticateToken, getUserStats);

// 获取公开作品画廊（可选认证：有token则获取用户点赞状态）
router.get('/gallery', optionalAuth, getPublicGallery);

// 更新作品信息（需要认证）
router.put('/:id', authenticateToken, updateWork);

// 删除作品（需要认证）
router.delete('/:id', authenticateToken, deleteWork);

// 点赞/取消点赞作品（需要认证）
router.post('/:id/like', authenticateToken, toggleWorkLike);

// 增加作品浏览量（可选认证：支持匿名用户）
router.post('/:id/view', optionalAuth, incrementWorkView);

// 获取单个作品详情（可选认证：有token则获取用户点赞状态）
router.get('/:id', optionalAuth, getWorkById);

module.exports = router;