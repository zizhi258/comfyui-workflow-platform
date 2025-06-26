const { Sequelize } = require('sequelize');
require('dotenv').config();

// config() 是 dotenv 模块提供的一个核心方法。当你调用这个方法时，它会执行以下操作：
// 寻找文件：在你的项目根目录下寻找一个名为 .env 的文件。
// 解析文件：读取 .env 文件中的内容。这个文件的格式通常是 KEY=VALUE 键值对，每行一个。
// 注入变量：将解析出来的键值对，添加到 Node.js 的内置 process.env 对象中。
// 如果 process.env 中已经存在同名的变量，dotenv 默认不会覆盖它。

// 使用环境变量创建一个新的 Sequelize 实例
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false, // 设置为 true 可以查看执行的 SQL 语句
  }
);

// 测试数据库连接的函数
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL 数据库连接成功。');
  } catch (error) {
    console.error('无法连接到数据库:', error);
  }
};

// 初始化模型关联
const initModels = () => {
  const User = require('../models/user.model');
  const Work = require('../models/work.model');
  const UserWorkLike = require('../models/userWorkLike.model');
  const WorkView = require('../models/workView.model');
  const CreditTransaction = require('../models/creditTransaction.model');
  
  const models = { User, Work, UserWorkLike, WorkView, CreditTransaction };
  
  // 执行关联，避免了循环依赖
  Object.keys(models).forEach(modelName => {
    //Object.keys(models)返回 ['User', 'Work', 'UserWorkLike', 'WorkView']
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
  });
  
  return models;
};

// 导出 sequelize 实例和连接函数
module.exports = { sequelize, connectDB, initModels };