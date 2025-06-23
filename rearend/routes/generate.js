const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const generateController = require('../controllers/generateController');

// 所有生成相关的路由都需要认证
router.use(protect);

// POST /api/generate - 核心AIGC图片生成接口
router.post('/', generateController.generateImage);

module.exports = router;