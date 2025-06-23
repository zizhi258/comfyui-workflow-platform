require('dotenv').config();
const { sequelize } = require('../database/database');

async function resetDatabase() {
  try {
    console.log('🔄 开始重置数据库...');
    
    // 1. 删除所有表
    console.log('1️⃣ 删除现有表...');
    await sequelize.drop({ cascade: true });
    console.log('✅ 表删除成功');
    
    // 2. 重新创建所有表
    console.log('2️⃣ 重新创建表结构...');
    await sequelize.sync({ force: true });
    console.log('✅ 表创建成功');
    
    console.log('🎉 数据库重置完成！');
    
  } catch (error) {
    console.error('❌ 数据库重置失败:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

resetDatabase();