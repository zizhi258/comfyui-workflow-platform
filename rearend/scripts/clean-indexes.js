require('dotenv').config();
const { sequelize } = require('../database/database');

async function cleanIndexes() {
  try {
    console.log('🧹 开始清理users表索引...\n');
    
    // 1. 查看当前索引
    console.log('1️⃣ 获取当前索引信息...');
    const [indexes] = await sequelize.query("SHOW INDEX FROM users");
    
    console.log(`当前索引总数: ${indexes.length}`);
    
    // 分组索引
    const indexGroups = {};
    indexes.forEach(idx => {
      if (!indexGroups[idx.Key_name]) {
        indexGroups[idx.Key_name] = [];
      }
      indexGroups[idx.Key_name].push(idx);
    });
    
    console.log('索引分组:');
    Object.keys(indexGroups).forEach(keyName => {
      const group = indexGroups[keyName];
      console.log(`  ${keyName}: ${group.length} 条记录 (${group[0].Non_unique === 0 ? 'UNIQUE' : 'INDEX'})`);
    });
    
    // 2. 识别需要保留的索引
    const keepIndexes = ['PRIMARY', 'username', 'email']; // 保留主键和必要的唯一索引
    const dropIndexes = Object.keys(indexGroups).filter(name => !keepIndexes.includes(name));
    
    console.log('\n2️⃣ 计划删除的索引:');
    dropIndexes.forEach(name => {
      console.log(`  - ${name}`);
    });
    
    // 3. 删除多余索引
    console.log('\n3️⃣ 开始删除多余索引...');
    for (const indexName of dropIndexes) {
      try {
        if (indexName !== 'PRIMARY') { // 不能删除主键
          await sequelize.query(`DROP INDEX \`${indexName}\` ON users`);
          console.log(`✅ 删除索引: ${indexName}`);
        }
      } catch (error) {
        console.log(`❌ 删除索引失败 ${indexName}:`, error.message);
      }
    }
    
    // 4. 重新创建必要的唯一索引
    console.log('\n4️⃣ 重新创建必要索引...');
    try {
      // 创建username唯一索引
      await sequelize.query(`
        CREATE UNIQUE INDEX idx_users_username ON users (username)
      `).catch(() => console.log('username索引已存在'));
      
      // 创建email唯一索引  
      await sequelize.query(`
        CREATE UNIQUE INDEX idx_users_email ON users (email)
      `).catch(() => console.log('email索引已存在'));
      
      console.log('✅ 必要索引创建完成');
    } catch (error) {
      console.log('❌ 创建索引失败:', error.message);
    }
    
    // 5. 验证最终结果
    console.log('\n5️⃣ 验证清理结果...');
    const [finalIndexes] = await sequelize.query("SHOW INDEX FROM users");
    console.log(`清理后索引总数: ${finalIndexes.length}`);
    
    const finalGroups = {};
    finalIndexes.forEach(idx => {
      if (!finalGroups[idx.Key_name]) {
        finalGroups[idx.Key_name] = [];
      }
      finalGroups[idx.Key_name].push(idx);
    });
    
    console.log('最终索引:');
    Object.keys(finalGroups).forEach(keyName => {
      const group = finalGroups[keyName];
      console.log(`  ${keyName}: ${group[0].Non_unique === 0 ? 'UNIQUE' : 'INDEX'}`);
    });
    
    console.log('\n🎉 索引清理完成！');
    
  } catch (error) {
    console.error('❌ 索引清理失败:', error);
  } finally {
    await sequelize.close();
  }
}

cleanIndexes();