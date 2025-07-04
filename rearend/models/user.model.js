const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('user', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // --- 新增字段 ---
  bio: {
    type: DataTypes.STRING(200), // 规范要求最大200字符
    allowNull: true,
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true, // 添加URL格式验证
    },
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // --- 积分系统字段 ---
  credits: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 500, // 新用户默认500积分
    validate: {
      min: 0 // 积分不能为负数
    }
  },
  total_earned_credits: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 500, // 记录总获得积分
    field: 'total_earned_credits'
  },
  total_spent_credits: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0, // 记录总消费积分
    field: 'total_spent_credits'
  },
  // --- 现有字段 ---
  last_login: {
    type: DataTypes.DATE,
  },
}, {
  tableName: 'users',
  timestamps: true, // Sequelize会自动管理 createdAt 和 updatedAt
  createdAt: 'created_at', // 映射到数据库的 created_at 字段
  updatedAt: 'updated_at', // 映射到数据库的 updated_at 字段
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      // 仅在密码字段被修改时才哈希
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
  },
});

// 定义关联关系
User.associate = (models) => {
  // 用户拥有多个作品
  User.hasMany(models.Work, {
    foreignKey: 'userId',
    as: 'works'
  });
  
  // 用户与作品点赞的多对多关系
  User.belongsToMany(models.Work, {
    through: models.UserWorkLike,
    foreignKey: 'userId',
    otherKey: 'workId',
    as: 'likedWorks'
  });
  
  // 用户有多个浏览记录
  User.hasMany(models.WorkView, {
    foreignKey: 'userId',
    as: 'viewRecords'
  });
  
  // 用户有多个积分交易记录
  User.hasMany(models.CreditTransaction, {
    foreignKey: 'userId',
    as: 'creditTransactions'
  });
};

module.exports = User;
