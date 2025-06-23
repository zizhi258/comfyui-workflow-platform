const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const modelsController = require('../controllers/modelsController');

// 所有模型相关的路由都需要认证
router.use(protect);

// GET /api/models - 获取可用模型列表
router.get('/', modelsController.getAvailableModels);

// GET /api/models/samplers - 获取可用采样器列表
router.get('/samplers', modelsController.getAvailableSamplers);

module.exports = router;