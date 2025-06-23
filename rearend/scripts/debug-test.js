const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

async function debugTest() {
  try {
    console.log('🔍 调试点赞状态问题...\n');
    
    // 1. 登录
    console.log('1️⃣ 登录...');
    const loginResponse = await axios.post(`${API_BASE}/users/login`, {
      username: 'testlike@example.com',
      password: 'test123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ 登录失败:', loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.data.token;
    if (!token) {
      console.log('❌ 没有获得token:', loginResponse.data);
      return;
    }
    console.log('✅ 登录成功，token:', token.substring(0, 20) + '...');
    
    // 2. 测试带token的画廊请求
    console.log('\n2️⃣ 请求画廊...');
    const galleryResponse = await axios.get(`${API_BASE}/works/gallery?page=1&limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 画廊响应:');
    galleryResponse.data.data.works.forEach(work => {
      console.log(`   作品${work.id}: ${work.title} - isLiked: ${work.isLiked}, likes: ${work.likes}`);
    });
    
    // 3. 对作品1执行点赞操作
    console.log('\n3️⃣ 对作品1执行点赞...');
    try {
      const likeResponse = await axios.post(`${API_BASE}/works/1/like`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ 点赞响应:', likeResponse.data);
    } catch (likeError) {
      console.log('❌ 点赞失败:', likeError.response?.data || likeError.message);
    }
    
    // 4. 再次请求画廊验证状态
    console.log('\n4️⃣ 再次请求画廊验证...');
    const verifyResponse = await axios.get(`${API_BASE}/works/gallery?page=1&limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 验证响应:');
    verifyResponse.data.data.works.forEach(work => {
      console.log(`   作品${work.id}: ${work.title} - isLiked: ${work.isLiked}, likes: ${work.likes}`);
    });
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

debugTest();