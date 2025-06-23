const { sequelize } = require('../database/database');
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');

async function checkUserPassword() {
  try {
    console.log('🔍 检查用户密码...\n');
    
    // 获取用户
    const user = await User.findOne({
      where: { email: '2017267046@qq.com' }
    });
    
    if (!user) {
      console.log('❌ 用户不存在');
      return;
    }
    
    console.log(`找到用户: ${user.username} (${user.email})`);
    console.log(`密码哈希: ${user.password.substring(0, 20)}...`);
    
    // 测试密码验证
    const testPasswords = ['password123', '123456', 'admin'];
    
    for (const password of testPasswords) {
      try {
        const isValid = await bcrypt.compare(password, user.password);
        console.log(`密码 "${password}": ${isValid ? '✅ 正确' : '❌ 错误'}`);
      } catch (error) {
        console.log(`密码 "${password}": ❌ 验证失败 - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await sequelize.close();
  }
}

checkUserPassword();