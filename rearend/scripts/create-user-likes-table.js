const { sequelize } = require('../database/database');
const UserWorkLike = require('../models/userWorkLike.model');

async function createUserLikesTable() {
  try {
    console.log('开始创建用户点赞表...');
    
    // 同步UserWorkLike表到数据库
    await UserWorkLike.sync({ force: false });
    
    console.log('用户点赞表创建成功！');
    console.log('表结构:');
    console.log('- id: 主键');
    console.log('- userId: 用户ID');
    console.log('- workId: 作品ID');
    console.log('- createdAt: 点赞时间');
    console.log('- 唯一索引: (userId, workId) 防止重复点赞');
    
  } catch (error) {
    console.error('创建用户点赞表失败:', error);
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createUserLikesTable();
}

module.exports = createUserLikesTable;