const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/database');

const WorkView = sequelize.define('WorkView', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true, // 允许匿名用户浏览
    comment: '用户ID，null表示匿名用户'
  },
  workId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '作品ID'
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '用户IP地址，用于匿名用户去重'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '用户代理字符串'
  },
  viewedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '浏览时间'
  }
}, {
  tableName: 'work_views',
  timestamps: false, // 使用自定义的 viewedAt 字段
  indexes: [
    {
      fields: ['workId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['userId', 'workId', 'viewedAt']
    },
    {
      fields: ['ipAddress', 'workId', 'viewedAt']
    }
  ]
});

// 定义关联关系
WorkView.associate = (models) => {
  // 浏览记录属于某个用户
  WorkView.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  // 浏览记录属于某个作品
  WorkView.belongsTo(models.Work, {
    foreignKey: 'workId',
    as: 'work'
  });
};

module.exports = WorkView;