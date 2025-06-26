const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // 导入上传中间件

// --- 公开路由 ---
router.post('/register', userController.register);
router.post('/login', userController.login);

// --- 受保护的路由 (需要认证) ---
// 使用 protect 中间件来保护下面的所有路由
router.use(protect);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/password', userController.updatePassword);

// 头像上传路由，注意中间件的使用顺序
// protect 先验证用户，然后 upload.single('avatar') 处理文件
router.post('/avatar', upload.single('avatar'), userController.uploadAvatar);

// === 积分系统路由 ===
router.get('/credits', userController.getCredits);
router.get('/credits/stats', userController.getCreditStats);
router.get('/credits/transactions', userController.getCreditTransactions);

module.exports = router;
