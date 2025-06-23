const { sequelize } = require('../database/database');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');

async function simpleNotificationTest() {
  try {
    console.log('🧪 简单通知测试...\n');
    
    // 1. 检查通知表
    const notificationCount = await Notification.count();
    console.log(`📊 数据库中共有 ${notificationCount} 条通知`);
    
    // 2. 检查第一个用户的通知
    const firstUser = await User.findOne();
    if (!firstUser) {
      console.log('❌ 没有找到用户');
      return;
    }
    
    console.log(`👤 测试用户: ${firstUser.username} (ID: ${firstUser.id})`);
    
    const userNotifications = await Notification.findAll({
      where: { userId: firstUser.id }
    });
    
    console.log(`📨 用户通知数量: ${userNotifications.length}`);
    
    if (userNotifications.length > 0) {
      console.log('📋 通知列表:');
      userNotifications.forEach((notification, index) => {
        console.log(`   ${index + 1}. ${notification.title} (${notification.type}, ${notification.isRead ? '已读' : '未读'})`);
      });
    }
    
    // 3. 测试创建新通知
    console.log('\n🆕 创建测试通知...');
    const newNotification = await Notification.create({
      userId: firstUser.id,
      title: 'API测试通知',
      content: '这是一个通过脚本创建的测试通知',
      type: 'system',
      priority: 'normal'
    });
    
    console.log(`✅ 创建通知成功，ID: ${newNotification.id}`);
    
    // 4. 计算未读数量
    const unreadCount = await Notification.count({
      where: {
        userId: firstUser.id,
        isRead: false
      }
    });
    
    console.log(`📈 用户未读通知数量: ${unreadCount}`);
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await sequelize.close();
  }
}

simpleNotificationTest();