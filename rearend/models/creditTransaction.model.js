const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/database');

const CreditTransaction = sequelize.define('CreditTransaction', {
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
  // 交易类型
  type: {
    type: DataTypes.ENUM('earn', 'spend', 'refund', 'admin_adjust'),
    allowNull: false,
    comment: 'earn=获得, spend=消费, refund=退款, admin_adjust=管理员调整'
  },
  // 积分变化量（正数为增加，负数为减少）
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notZero(value) {
        if (value === 0) {
          throw new Error('积分变化量不能为0');
        }
      }
    }
  },
  // 交易前积分余额
  balance_before: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'balance_before'
  },
  // 交易后积分余额
  balance_after: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'balance_after'
  },
  // 交易描述
  description: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  // 关联的业务ID（如生成任务ID、订单ID等）
  reference_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'reference_id'
  },
  // 关联的业务类型
  reference_type: {
    type: DataTypes.ENUM('image_generation', 'registration', 'admin', 'refund'),
    allowNull: true,
    field: 'reference_type'
  },
  // 操作员ID（管理员调整时使用）
  operator_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'operator_id'
  }
}, {
  tableName: 'credit_transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['type']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['reference_id', 'reference_type']
    }
  ]
});

// 定义关联关系
CreditTransaction.associate = (models) => {
  // 交易记录属于用户
  CreditTransaction.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  // 操作员关联（管理员调整时）
  CreditTransaction.belongsTo(models.User, {
    foreignKey: 'operator_id',
    as: 'operator'
  });
};

module.exports = CreditTransaction;