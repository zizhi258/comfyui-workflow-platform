const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('../models/user.model');

// --- 辅助函数：格式化用户数据 ---
const formatUserData = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    bio: user.bio,
    avatar: user.avatar ? `${process.env.BASE_URL}${user.avatar.replace('public', '')}` : null, // 生成完整的URL
    website: user.website,
    location: user.location,
    last_login: user.last_login,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
};

// 1. 用户注册
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  // --- 输入验证 ---
  if (!validator.isLength(username, { min: 3, max: 20 }) || !/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(422).json({ success: false, error: '用户名必须为3-20个字符，且只能包含字母、数字和下划线', code: 'INVALID_USERNAME' });
  }
  if (!validator.isEmail(email)) {
    return res.status(422).json({ success: false, error: '邮箱格式不正确', code: 'INVALID_EMAIL' });
  }
  if (!validator.isLength(password, { min: 6 }) || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
    return res.status(422).json({ success: false, error: '密码最少6位，且需包含字母和数字', code: 'WEAK_PASSWORD' });
  }

  try {
    // 检查用户或邮箱是否已存在
    const userExists = await User.findOne({ where: { [Op.or]: [{ username }, { email }] } });
    if (userExists) {
      return res.status(409).json({ success: false, error: '用户名或邮箱已存在', code: 'USER_EXISTS' });
    }

    // 创建用户 (密码哈希由模型hook处理)
    const newUser = await User.create({ username, email, password });

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          created_at: newUser.created_at,
        }
      }
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ success: false, error: '服务器内部错误', code: 'SERVER_ERROR' });
  }
};

// 2. 用户登录
exports.login = async (req, res) => {
  const { username, password, rememberMe = false } = req.body;

  try {
    // 允许使用用户名或邮箱登录
    const user = await User.findOne({ where: { [Op.or]: [{ username: username }, { email: username }] } });

    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在', code: 'USER_NOT_FOUND' });
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: '用户名或密码错误', code: 'INVALID_CREDENTIALS' });
    }

    // 更新最后登录时间
    user.last_login = new Date();
    await user.save();

    // 生成JWT
    const payload = { id: user.id, username: user.username };
    const expiresIn = rememberMe ? '30d' : '24h'; // 根据rememberMe设置有效期
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

    res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          last_login: user.last_login,
        }
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ success: false, error: '服务器内部错误', code: 'SERVER_ERROR' });
  }
};

// 3. 获取用户信息
exports.getProfile = async (req, res) => {
  // 中间件已将用户信息附加到 req.user
  res.status(200).json({
    success: true,
    data: {
      user: formatUserData(req.user)
    }
  });
};

// 4. 更新用户信息
exports.updateProfile = async (req, res) => {
  const { username, email, bio, website, location } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在', code: 'USER_NOT_FOUND' });
    }

    // 检查新的用户名或邮箱是否已被其他用户占用
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) return res.status(409).json({ success: false, error: '用户名已存在', code: 'USERNAME_EXISTS' });
      user.username = username;
    }
    if (email && email !== user.email) {
      if (!validator.isEmail(email)) return res.status(422).json({ success: false, error: '邮箱格式不正确', code: 'INVALID_EMAIL' });
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) return res.status(409).json({ success: false, error: '邮箱已存在', code: 'EMAIL_EXISTS' });
      user.email = email;
    }

    // 更新其他可选字段
    user.bio = bio !== undefined ? bio : user.bio;
    user.website = website !== undefined ? website : user.website;
    user.location = location !== undefined ? location : user.location;

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: '更新成功',
      data: {
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          bio: updatedUser.bio,
          updated_at: updatedUser.updated_at,
        }
      }
    });
  } catch (error) {
    console.error('更新个人资料失败:', error);
    res.status(500).json({ success: false, error: '服务器内部错误', code: 'SERVER_ERROR' });
  }
};

// 5. 修改密码
exports.updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  // 验证新密码强度
  if (!validator.isLength(newPassword, { min: 6 })) {
    return res.status(422).json({ success: false, error: '新密码最少6位', code: 'WEAK_PASSWORD' });
  }

  try {
    // 需要获取包含密码哈希的完整用户对象
    const user = await User.scope('withPassword').findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在', code: 'USER_NOT_FOUND' });
    }

    // 验证当前密码
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: '当前密码错误', code: 'INVALID_PASSWORD' });
    }

    // 更新密码 (哈希由模型hook处理)
    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ success: false, error: '服务器内部错误', code: 'SERVER_ERROR' });
  }
};

// 6. 上传头像
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请选择要上传的头像文件', code: 'NO_FILE_UPLOADED' });
    }

    const user = await User.findByPk(req.user.id);
    // 将文件路径保存到数据库，注意路径分隔符统一为'/'
    const avatarPath = req.file.path.replace(/\\/g, "/");
    user.avatar = avatarPath;
    await user.save();

    res.status(200).json({
      success: true,
      message: '头像上传成功',
      data: {
        // 返回完整的可访问URL
        avatar_url: `${process.env.BASE_URL}${avatarPath.replace('public', '')}`
      }
    });
  } catch (error) {
    console.error('上传头像失败:', error);
    res.status(500).json({ success: false, error: '服务器内部错误', code: 'SERVER_ERROR' });
  }
};
