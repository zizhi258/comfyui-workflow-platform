const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

async function testLikeFunctionality() {
  console.log('🧪 开始测试点赞功能...\n');
  
  try {
    // 1. 登录获取token
    console.log('1️⃣ 登录获取token...');
    const loginResponse = await axios.post(`${API_BASE}/users/login`, {
      email: 'zizhi@example.com', // 假设这是测试用户
      password: 'password123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ 登录失败，创建测试用户...');
      await axios.post(`${API_BASE}/users/register`, {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
      
      const newLoginResponse = await axios.post(`${API_BASE}/users/login`, {
        email: 'test@example.com',
        password: 'password123'
      });
      
      if (!newLoginResponse.data.success) {
        throw new Error('无法登录或创建用户');
      }
      
      var token = newLoginResponse.data.token;
    } else {
      var token = loginResponse.data.token;
    }
    
    console.log('✅ 登录成功，获得token');
    
    // 2. 获取画廊作品（带token）
    console.log('\n2️⃣ 获取画廊作品（带认证）...');
    const galleryResponse = await axios.get(`${API_BASE}/works/gallery?page=1&limit=1`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!galleryResponse.data.success || galleryResponse.data.data.works.length === 0) {
      console.log('❌ 没有找到作品进行测试');
      return;
    }
    
    const work = galleryResponse.data.data.works[0];
    console.log(`✅ 找到作品: ${work.title} (ID: ${work.id})`);
    console.log(`   当前点赞状态: ${work.isLiked ? '已点赞' : '未点赞'}`);
    console.log(`   点赞数: ${work.likes}`);
    
    // 3. 执行点赞操作
    console.log('\n3️⃣ 执行点赞操作...');
    const likeResponse = await axios.post(`${API_BASE}/works/${work.id}/like`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`✅ 点赞操作成功: ${likeResponse.data.message}`);
    console.log(`   新的点赞状态: ${likeResponse.data.data.isLiked ? '已点赞' : '未点赞'}`);
    console.log(`   新的点赞数: ${likeResponse.data.data.likes}`);
    
    // 4. 再次获取画廊作品验证状态
    console.log('\n4️⃣ 验证点赞状态持久化...');
    const verifyResponse = await axios.get(`${API_BASE}/works/gallery?page=1&limit=1`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const updatedWork = verifyResponse.data.data.works[0];
    console.log(`✅ 验证结果:`);
    console.log(`   作品: ${updatedWork.title} (ID: ${updatedWork.id})`);
    console.log(`   点赞状态: ${updatedWork.isLiked ? '已点赞' : '未点赞'}`);
    console.log(`   点赞数: ${updatedWork.likes}`);
    
    // 5. 测试无token的情况
    console.log('\n5️⃣ 测试无token访问...');
    const noTokenResponse = await axios.get(`${API_BASE}/works/gallery?page=1&limit=1`);
    const noTokenWork = noTokenResponse.data.data.works[0];
    console.log(`✅ 无token访问结果:`);
    console.log(`   作品: ${noTokenWork.title} (ID: ${noTokenWork.id})`);
    console.log(`   点赞状态: ${noTokenWork.isLiked ? '已点赞' : '未点赞'} (应该是false)`);
    console.log(`   点赞数: ${noTokenWork.likes}`);
    
    console.log('\n🎉 点赞功能测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testLikeFunctionality();