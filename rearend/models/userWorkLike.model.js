const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/database');

const UserWorkLike = sequelize.define('UserWorkLike', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  workId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'works',
      key: 'id'
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_work_likes',
  timestamps: true,
  updatedAt: false, // 点赞记录不需要更新时间
  indexes: [
    {
      unique: true,
      fields: ['userId', 'workId'] // 确保用户对同一作品只能点赞一次
    }
  ]
});

// 定义关联关系
UserWorkLike.associate = (models) => {
  // UserWorkLike 属于 User
  UserWorkLike.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  // UserWorkLike 属于 Work
  UserWorkLike.belongsTo(models.Work, {
    foreignKey: 'workId',
    as: 'work'
  });
};

module.exports = UserWorkLike;