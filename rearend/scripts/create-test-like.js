const { sequelize } = require('../database/database');
const User = require('../models/user.model');
const Work = require('../models/work.model');
const UserWorkLike = require('../models/userWorkLike.model');

async function createTestLike() {
  try {
    console.log('❤️ 为测试用户创建点赞记录...\n');
    
    // 找到测试用户
    const user = await User.findOne({
      where: { email: 'testlike@example.com' }
    });
    
    if (!user) {
      console.log('❌ 测试用户不存在');
      return;
    }
    
    // 找到第一个作品
    const work = await Work.findOne({
      where: { isPublic: true }
    });
    
    if (!work) {
      console.log('❌ 没有找到公开作品');
      return;
    }
    
    console.log(`用户: ${user.username} (ID: ${user.id})`);
    console.log(`作品: ${work.title} (ID: ${work.id})`);
    
    // 检查是否已经点赞过
    const existingLike = await UserWorkLike.findOne({
      where: {
        userId: user.id,
        workId: work.id
      }
    });
    
    if (existingLike) {
      console.log('✅ 该用户已经点赞过这个作品');
    } else {
      // 创建点赞记录
      await UserWorkLike.create({
        userId: user.id,
        workId: work.id
      });
      
      // 更新作品点赞数
      await work.increment('likes');
      
      console.log('✅ 创建点赞记录成功');
    }
    
    // 验证点赞记录
    const allLikes = await UserWorkLike.findAll({
      where: { userId: user.id }
    });
    
    console.log(`\n📊 用户 ${user.username} 的所有点赞记录:`);
    allLikes.forEach(like => {
      console.log(`   - 作品 ${like.workId} (${like.createdAt})`);
    });
    
  } catch (error) {
    console.error('❌ 创建失败:', error);
  } finally {
    await sequelize.close();
  }
}

createTestLike();