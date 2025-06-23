const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

async function testNotificationsAPI() {
  try {
    console.log('🧪 测试通知系统API...\n');
    
    // 1. 登录获取token
    console.log('1️⃣ 登录...');
    const loginResponse = await axios.post(`${API_BASE}/users/login`, {
      username: '2017267046@qq.com', // 使用第一个用户的邮箱
      password: 'password123'
    });
    
    // 尝试不同的登录凭据
    if (!loginResponse.data.success) {
      console.log('❌ 第一个用户登录失败，尝试测试用户...');
      const loginResponse2 = await axios.post(`${API_BASE}/users/login`, {
        username: 'testlike@example.com',
        password: 'test123'
      });
      
      if (!loginResponse2.data.success) {
        console.log('❌ 登录失败，请检查用户凭据:', loginResponse.data, loginResponse2.data);
        return;
      }
      var token = loginResponse2.data.data.token;
      console.log('✅ 使用测试用户登录成功');
    } else {
      var token = loginResponse.data.data.token;
      console.log('✅ 使用主用户登录成功');
    }
    
    // console.log('✅ 登录成功');
    
    // 2. 获取未读通知数量
    console.log('\n2️⃣ 获取未读通知数量...');
    const unreadResponse = await axios.get(`${API_BASE}/notifications/unread-count`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ 未读通知数量:', unreadResponse.data.data.unreadCount);
    
    // 3. 获取通知列表
    console.log('\n3️⃣ 获取通知列表...');
    const notificationsResponse = await axios.get(`${API_BASE}/notifications?page=1&limit=5`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (notificationsResponse.data.success) {
      const notifications = notificationsResponse.data.data.notifications;
      console.log(`✅ 获取到 ${notifications.length} 条通知:`);
      notifications.forEach((notification, index) => {
        console.log(`   ${index + 1}. ${notification.title} (${notification.type}, ${notification.isRead ? '已读' : '未读'})`);
      });
    }
    
    // 4. 标记第一个未读通知为已读
    const unreadNotification = notificationsResponse.data.data.notifications.find(n => !n.isRead);
    if (unreadNotification) {
      console.log('\n4️⃣ 标记通知为已读...');
      const readResponse = await axios.put(`${API_BASE}/notifications/${unreadNotification.id}/read`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (readResponse.data.success) {
        console.log(`✅ 成功标记通知 "${unreadNotification.title}" 为已读`);
      }
    }
    
    // 5. 再次检查未读数量
    console.log('\n5️⃣ 再次检查未读数量...');
    const unreadResponse2 = await axios.get(`${API_BASE}/notifications/unread-count`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ 更新后的未读通知数量:', unreadResponse2.data.data.unreadCount);
    
    console.log('\n🎉 通知系统API测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testNotificationsAPI();