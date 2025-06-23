const { Sequelize } = require('sequelize');
require('dotenv').config();

// 使用环境变量创建一个新的 Sequelize 实例
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false, // 设置为 console.log 可以查看执行的 SQL 语句
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
  
  const models = { User, Work, UserWorkLike };
  
  // 执行关联
  Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
  });
  
  return models;
};

// 导出 sequelize 实例和连接函数
module.exports = { sequelize, connectDB, initModels };