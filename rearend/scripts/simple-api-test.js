const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

async function simpleTest() {
  try {
    console.log('🧪 简单API测试...\n');
    
    // 1. 测试无token的画廊API
    console.log('1️⃣ 测试无token访问画廊...');
    const noTokenResponse = await axios.get(`${API_BASE}/works/gallery?page=1&limit=10`);
    console.log('✅ 无token响应:');
    noTokenResponse.data.data.works.forEach(work => {
      console.log(`   作品${work.id}: ${work.title} - isLiked: ${work.isLiked}, likes: ${work.likes}`);
    });
    
    // 2. 测试用户登录
    console.log('\n2️⃣ 测试用户登录...');
    const loginResponse = await axios.post(`${API_BASE}/users/login`, {
      username: 'testlike@example.com', // API接受username或email
      password: 'test123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.token;
      console.log('✅ 登录成功');
      
      // 3. 测试带token的画廊API
      console.log('\n3️⃣ 测试带token访问画廊...');
      const tokenResponse = await axios.get(`${API_BASE}/works/gallery?page=1&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ 带token响应:');
      tokenResponse.data.data.works.forEach(work => {
        console.log(`   作品${work.id}: ${work.title} - isLiked: ${work.isLiked}, likes: ${work.likes}`);
      });
    } else {
      console.log('❌ 登录失败:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

simpleTest();