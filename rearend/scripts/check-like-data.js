const { sequelize } = require('../database/database');
const User = require('../models/user.model');
const Work = require('../models/work.model');
const UserWorkLike = require('../models/userWorkLike.model');

async function checkLikeData() {
  try {
    console.log('🔍 检查点赞相关数据...\n');
    
    // 检查用户
    const users = await User.findAll({
      attributes: ['id', 'username', 'email']
    });
    console.log('👥 用户列表:');
    users.forEach(user => {
      console.log(`   ${user.id}: ${user.username} (${user.email})`);
    });
    
    // 检查作品
    const works = await Work.findAll({
      attributes: ['id', 'title', 'userId', 'likes', 'isPublic']
    });
    console.log('\n📚 作品列表:');
    works.forEach(work => {
      console.log(`   ${work.id}: ${work.title} (用户${work.userId}, 点赞${work.likes}, ${work.isPublic ? '公开' : '私有'})`);
    });
    
    // 检查点赞记录
    const likes = await UserWorkLike.findAll();
    console.log('\n❤️ 点赞记录:');
    if (likes.length === 0) {
      console.log('   暂无点赞记录');
    } else {
      likes.forEach(like => {
        console.log(`   用户${like.userId} 点赞了作品${like.workId} (${like.createdAt})`);
      });
    }
    
    // 模拟创建一个点赞记录进行测试
    if (users.length > 0 && works.length > 0) {
      const testUserId = users[0].id;
      const testWorkId = works[0].id;
      
      console.log(`\n🧪 测试：为用户${testUserId}创建对作品${testWorkId}的点赞记录...`);
      
      // 检查是否已存在
      const existingLike = await UserWorkLike.findOne({
        where: { userId: testUserId, workId: testWorkId }
      });
      
      if (existingLike) {
        console.log('   该用户已经点赞过这个作品');
      } else {
        // 创建点赞记录
        await UserWorkLike.create({
          userId: testUserId,
          workId: testWorkId
        });
        
        // 更新作品点赞数
        await Work.increment('likes', {
          where: { id: testWorkId }
        });
        
        console.log('   ✅ 创建点赞记录成功');
      }
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await sequelize.close();
  }
}

checkLikeData();