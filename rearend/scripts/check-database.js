require('dotenv').config();
const { sequelize } = require('../database/database');
const User = require('../models/user.model');

async function checkDatabase() {
  try {
    console.log('🔍 检查数据库状态...\n');
    
    // 1. 测试数据库连接
    console.log('1️⃣ 测试数据库连接...');
    await sequelize.authenticate();
    console.log('✅ 数据库连接正常');
    
    // 2. 检查表结构
    console.log('\n2️⃣ 检查表结构...');
    const [results] = await sequelize.query("SHOW TABLES");
    console.log('📋 现有表:', results.map(r => Object.values(r)[0]));
    
    // 3. 检查users表结构
    console.log('\n3️⃣ 检查users表结构...');
    try {
      const [columns] = await sequelize.query("DESCRIBE users");
      console.log('📊 users表字段:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key ? `(${col.Key})` : ''}`);
      });
    } catch (error) {
      console.log('❌ users表不存在或无法访问');
    }
    
    // 4. 检查索引
    console.log('\n4️⃣ 检查users表索引...');
    try {
      const [indexes] = await sequelize.query("SHOW INDEX FROM users");
      console.log('🔑 索引信息:');
      const indexCount = indexes.length;
      console.log(`  总索引数: ${indexCount} (MySQL限制: 64)`);
      
      const uniqueIndexes = indexes.filter(idx => idx.Non_unique === 0);
      console.log(`  唯一索引: ${uniqueIndexes.length}`);
      
      if (indexCount > 50) {
        console.log('⚠️  索引数量较多，可能需要清理');
      }
    } catch (error) {
      console.log('❌ 无法获取索引信息');
    }
    
    // 5. 测试模型操作
    console.log('\n5️⃣ 测试User模型...');
    try {
      const userCount = await User.count();
      console.log('👥 现有用户数:', userCount);
      console.log('✅ User模型工作正常');
    } catch (error) {
      console.log('❌ User模型测试失败:', error.message);
    }
    
    console.log('\n🎉 数据库检查完成！');
    
  } catch (error) {
    console.error('❌ 数据库检查失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkDatabase();