const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '通知标题'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '通知内容'
  },
  type: {
    type: DataTypes.ENUM('system', 'like', 'comment', 'follow', 'work', 'other'),
    allowNull: false,
    defaultValue: 'system',
    comment: '通知类型'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_read',
    comment: '是否已读'
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'normal',
    comment: '优先级'
  },
  // 关联的资源信息（可选）
  relatedType: {
    type: DataTypes.ENUM('work', 'user', 'comment', 'system'),
    allowNull: true,
    field: 'related_type',
    comment: '关联资源类型'
  },
  relatedId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'related_id',
    comment: '关联资源ID'
  },
  // 额外数据（JSON格式）
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    comment: '额外元数据'
  },
  // 过期时间（可选）
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expires_at',
    comment: '过期时间'
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['is_read']
    },
    {
      fields: ['type']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['user_id', 'is_read']
    }
  ]
});

// 定义关联关系
Notification.associate = (models) => {
  // 通知属于用户
  Notification.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

module.exports = Notification;