/**
 * 初始化现有用户积分脚本
 * 为所有现有用户添加默认的500积分
 */

require('dotenv').config();
const { sequelize, connectDB, initModels } = require('../database/database');
const User = require('../models/user.model');
const CreditService = require('../services/creditService');

const initUserCredits = async () => {
  try {
    console.log('🚀 开始初始化用户积分系统...');
    
    // 连接数据库
    await connectDB();
    
    // 初始化模型关联
    initModels();
    
    // 同步数据库表结构（添加新的积分字段）
    await sequelize.sync({ alter: true });
    console.log('✅ 数据库表结构已更新');
    
    // 查找所有现有用户
    const users = await User.findAll({
      where: {
        credits: 0, // 只处理积分为0的用户（避免重复处理）
      },
      attributes: ['id', 'username', 'email', 'credits', 'created_at']
    });
    
    console.log(`📊 找到 ${users.length} 个需要初始化积分的用户`);
    
    if (users.length === 0) {
      console.log('✨ 所有用户积分已初始化完成');
      return;
    }
    
    let successCount = 0;
    let failureCount = 0;
    
    // 批量初始化用户积分
    for (const user of users) {
      try {
        console.log(`🔄 正在为用户 ${user.username} (ID: ${user.id}) 初始化积分...`);
        
        // 使用积分服务初始化积分
        await CreditService.initializeUserCredits(user.id, 500);
        
        successCount++;
        console.log(`✅ 用户 ${user.username} 积分初始化成功 (+500积分)`);
        
        // 添加延迟避免数据库压力
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        failureCount++;
        console.error(`❌ 用户 ${user.username} 积分初始化失败:`, error.message);
      }
    }
    
    console.log('\n📈 积分初始化统计:');
    console.log(`✅ 成功: ${successCount} 个用户`);
    console.log(`❌ 失败: ${failureCount} 个用户`);
    console.log(`📊 总计: ${users.length} 个用户`);
    
    if (successCount > 0) {
      console.log('\n🎉 用户积分初始化完成！');
      console.log('💡 每个用户已获得 500 积分，可用于 AI 图片生成');
    }
    
  } catch (error) {
    console.error('❌ 积分初始化过程发生错误:', error);
  } finally {
    // 关闭数据库连接
    await sequelize.close();
    console.log('📋 数据库连接已关闭');
    process.exit(0);
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  console.log('='.repeat(60));
  console.log('🏦 ComfyUI 平台 - 用户积分初始化脚本');
  console.log('='.repeat(60));
  
  initUserCredits().catch((error) => {
    console.error('💥 脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = initUserCredits;