const { sequelize } = require('../database/database');
const User = require('../models/user.model');

async function createTestUser() {
  try {
    console.log('👤 创建测试用户...\n');
    
    const userData = {
      username: 'testlike',
      email: 'testlike@example.com',
      password: 'test123'
    };
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({
      where: { email: userData.email }
    });
    
    if (existingUser) {
      console.log('✅ 测试用户已存在:', existingUser.username);
      return existingUser;
    }
    
    // 创建新用户
    const newUser = await User.create(userData);
    console.log('✅ 创建测试用户成功:', newUser.username);
    console.log(`   邮箱: ${newUser.email}`);
    console.log(`   密码: test123`);
    
    return newUser;
    
  } catch (error) {
    console.error('❌ 创建失败:', error);
  } finally {
    await sequelize.close();
  }
}

createTestUser();