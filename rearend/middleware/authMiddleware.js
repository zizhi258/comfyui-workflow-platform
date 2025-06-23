const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const protect = async (req, res, next) => {
  let token;

  // 检查请求头中是否有 'Authorization' 并且以 'Bearer' 开头
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 1. 从请求头中提取 token (Bearer <token>)
      token = req.headers.authorization.split(' ')[1];

      // 2. 验证 token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. 根据 token 中的 id 查找用户，并将用户信息附加到 req 对象上
      // 我们不选择密码字段，以确保它不会在后续操作中泄露
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (!req.user) {
        return res.status(401).json({ success: false, error: '用户不存在', code: 'USER_NOT_FOUND' });
      }

      // 4. 调用下一个中间件或路由处理器
      next();
    } catch (error) {
      console.error('Token 验证失败:', error.message);
      return res.status(401).json({ success: false, error: '无权访问，Token 验证失败', code: 'TOKEN_INVALID' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, error: '无权访问，缺少 Token', code: 'NO_TOKEN' });
  }
};

// 可选认证中间件：有token则认证，无token则放行
const optionalAuth = async (req, res, next) => {
  let token;

  // 检查请求头中是否有 'Authorization' 并且以 'Bearer' 开头
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 1. 从请求头中提取 token (Bearer <token>)
      token = req.headers.authorization.split(' ')[1];

      // 2. 验证 token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. 根据 token 中的 id 查找用户，并将用户信息附加到 req 对象上
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (!req.user) {
        console.warn('Token有效但用户不存在:', decoded.id);
        // 不阻止请求，只是不设置用户信息
        req.user = null;
      }
    } catch (error) {
      console.warn('可选认证Token验证失败:', error.message);
      // 不阻止请求，只是不设置用户信息
      req.user = null;
    }
  }

  // 无论是否有token或认证是否成功，都继续执行
  next();
};

module.exports = { protect, optionalAuth };
