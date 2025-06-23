const { sequelize } = require('../database/database');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');

async function createTestNotifications() {
  try {
    console.log('创建测试通知...\n');
    
    // 获取第一个用户
    const user = await User.findOne();
    if (!user) {
      console.log('❌ 没有找到用户');
      return;
    }
    
    console.log(`为用户 ${user.username} (ID: ${user.id}) 创建测试通知`);
    
    const testNotifications = [
      {
        userId: user.id,
        title: '欢迎使用AIGC平台',
        content: '欢迎来到AIGC创意平台！这里是您探索AI艺术创作的地方。',
        type: 'system',
        priority: 'high',
        metadata: { welcome: true }
      },
      {
        userId: user.id,
        title: '您的作品获得了点赞',
        content: '您的作品《AI创作-测试》获得了3个新的点赞！',
        type: 'like',
        priority: 'normal',
        relatedType: 'work',
        relatedId: 1,
        metadata: { likeCount: 3 }
      },
      {
        userId: user.id,
        title: '系统维护通知',
        content: '系统将于今晚23:00-01:00进行维护升级，期间可能影响服务使用。',
        type: 'system',
        priority: 'urgent',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天后过期
      },
      {
        userId: user.id,
        title: '新功能上线',
        content: '全新的作品分享功能已上线，快去试试吧！',
        type: 'system',
        priority: 'normal',
        metadata: { feature: 'share' }
      },
      {
        userId: user.id,
        title: '创作提醒',
        content: '您已经3天没有创作新作品了，不如现在就开始新的创作吧！',
        type: 'other',
        priority: 'low',
        metadata: { reminder: true }
      }
    ];
    
    // 批量创建通知
    const notifications = await Notification.bulkCreate(testNotifications);
    
    console.log(`✅ 成功创建 ${notifications.length} 个测试通知:`);
    notifications.forEach((notification, index) => {
      console.log(`   ${index + 1}. ${notification.title} (${notification.type}, ${notification.priority})`);
    });
    
    // 模拟一些已读通知
    await Notification.update(
      { isRead: true },
      { 
        where: { 
          userId: user.id,
          type: 'system'
        },
        limit: 1
      }
    );
    
    console.log('\n📊 通知统计:');
    const totalCount = await Notification.count({ where: { userId: user.id } });
    const unreadCount = await Notification.count({ 
      where: { userId: user.id, isRead: false } 
    });
    
    console.log(`   总通知数: ${totalCount}`);
    console.log(`   未读通知: ${unreadCount}`);
    console.log(`   已读通知: ${totalCount - unreadCount}`);
    
  } catch (error) {
    console.error('❌ 创建测试通知失败:', error);
  } finally {
    await sequelize.close();
  }
}

createTestNotifications();