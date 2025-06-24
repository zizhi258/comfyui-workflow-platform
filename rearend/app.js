// 导入模块
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/user');
const generateRoutes = require('./routes/generate');
const modelsRoutes = require('./routes/models');
const worksRoutes = require('./routes/works');
const { sequelize, connectDB, initModels } = require('./database/database'); // 导入 sequelize 和 connectDB

const path = require('path'); // 确保引入 path 模块
const app = express();
const PORT = process.env.PORT || 8000;


// 使用中间件
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // 允许前端域名
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));//解析 application/x-www-form-urlencoded 请求体的中间件。

// 配置静态文件服务，用于访问上传的头像
// 例如: http://localhost:8000/uploads/avatars/user-1-1678886400000.png
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
// 设置路由
app.use('/api/users', userRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/models', modelsRoutes);
app.use('/api/works', worksRoutes);

// 定义一个根路由用于测试
app.get('/', (req, res) => {
  res.send('<h1>后端服务已启动 (Express + Sequelize + MySQL)</h1><p>API 根路径为 /api</p>');
});




// 启动服务器并连接数据库
const startServer = async () => {
  try {
    // 连接数据库
    await connectDB();
    
    // 初始化模型关联
    initModels();
    console.log("模型关联已初始化。");
    
    // 将所有模型与数据库同步
    // 使用安全的同步策略，只创建不存在的表，不修改现有表结构
    try {
      await sequelize.sync({ 
        // alter: false, // 不修改现有表结构，避免索引冲突
        // force: false  // 不删除现有表
      }); 
      console.log("所有模型均已成功同步。");
    } catch (syncError) {
      console.warn("表同步出现问题，尝试安全模式:", syncError.message);
      // 如果同步失败，尝试只验证连接，不修改表结构
      await sequelize.authenticate();
      console.log("数据库连接正常，使用现有表结构。");
    }

    app.listen(PORT, () => {
      console.log(`服务器正在 http://localhost:${PORT} 上运行`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

startServer();
