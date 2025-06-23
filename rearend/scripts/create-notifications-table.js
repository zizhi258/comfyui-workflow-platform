const { sequelize } = require('../database/database');
const Notification = require('../models/notification.model');

async function createNotificationsTable() {
  try {
    console.log('开始创建通知表...');
    
    // 同步Notification表到数据库
    await Notification.sync({ force: false });
    
    console.log('通知表创建成功！');
    console.log('表结构:');
    console.log('- id: 主键');
    console.log('- user_id: 用户ID');
    console.log('- title: 通知标题');
    console.log('- content: 通知内容');
    console.log('- type: 通知类型 (system, like, comment, follow, work, other)');
    console.log('- is_read: 是否已读');
    console.log('- priority: 优先级 (low, normal, high, urgent)');
    console.log('- related_type: 关联资源类型');
    console.log('- related_id: 关联资源ID');
    console.log('- metadata: 额外元数据 (JSON)');
    console.log('- expires_at: 过期时间');
    console.log('- created_at: 创建时间');
    console.log('- updated_at: 更新时间');
    
  } catch (error) {
    console.error('创建通知表失败:', error);
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createNotificationsTable();
}

module.exports = createNotificationsTable;