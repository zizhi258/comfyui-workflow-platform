const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/database');

const Work = sequelize.define('Work', {
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
    defaultValue: '未命名作品'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  prompt: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  negativePrompt: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'negative_prompt'
  },
  // 存储图片URL数组，JSON格式
  imageUrls: {
    type: DataTypes.JSON,
    allowNull: false,
    field: 'image_urls',
    defaultValue: []
  },
  // 缩略图URL
  thumbnailUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'thumbnail_url'
  },
  // 生成配置参数，JSON格式
  modelConfig: {
    type: DataTypes.JSON,
    allowNull: false,
    field: 'model_config',
    defaultValue: {}
  },
  // 标签数组，JSON格式
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  // 是否公开
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_public'
  },
  // 浏览次数
  views: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  // 点赞次数
  likes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  // 文件信息
  originalFilename: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'original_filename'
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'file_size'
  },
  dimensions: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  // 存储类型和路径
  storageType: {
    type: DataTypes.ENUM('temp', 'local', 'oss', 's3'),
    allowNull: false,
    defaultValue: 'temp',
    field: 'storage_type'
  },
  storagePath: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'storage_path'
  },
  // 生成种子和相关信息
  seed: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  promptId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'prompt_id'
  }
}, {
  tableName: 'works',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['is_public']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['views']
    },
    {
      fields: ['likes']
    }
  ]
});

// 定义关联关系
Work.associate = (models) => {
  // 作品属于用户
  Work.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'author'
  });
  
  // 作品与用户点赞的多对多关系
  Work.belongsToMany(models.User, {
    through: models.UserWorkLike,
    foreignKey: 'workId',
    otherKey: 'userId',
    as: 'likedByUsers'
  });
  
  // 作品有多个浏览记录
  Work.hasMany(models.WorkView, {
    foreignKey: 'workId',
    as: 'viewRecords'
  });
};

module.exports = Work;