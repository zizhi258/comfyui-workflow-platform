const User = require('../models/user.model');
const CreditTransaction = require('../models/creditTransaction.model');
const { sequelize } = require('../database/database');

/**
 * 积分系统服务
 */
class CreditService {
  /**
   * 获取用户积分余额
   * @param {number} userId - 用户ID
   * @returns {Promise<number>} 积分余额
   */
  static async getUserCredits(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: ['credits']
      });
      
      if (!user) {
        throw new Error('用户不存在');
      }
      
      return user.credits;
    } catch (error) {
      console.error('获取用户积分失败:', error);
      throw error;
    }
  }

  /**
   * 检查用户积分是否足够
   * @param {number} userId - 用户ID
   * @param {number} amount - 需要的积分数量
   * @returns {Promise<boolean>} 是否足够
   */
  static async checkCreditsBalance(userId, amount) {
    try {
      const currentCredits = await this.getUserCredits(userId);
      return currentCredits >= amount;
    } catch (error) {
      console.error('检查积分余额失败:', error);
      return false;
    }
  }

  /**
   * 消费积分（事务操作）
   * @param {number} userId - 用户ID
   * @param {number} amount - 消费积分数量
   * @param {string} description - 消费描述
   * @param {string} referenceId - 关联业务ID
   * @param {string} referenceType - 关联业务类型
   * @returns {Promise<Object>} 交易结果
   */
  static async spendCredits(userId, amount, description, referenceId = null, referenceType = null) {
    const transaction = await sequelize.transaction();
    
    try {
      // 获取用户当前积分（加锁）
      const user = await User.findByPk(userId, {
        attributes: ['id', 'credits', 'total_spent_credits'],
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      const currentCredits = user.credits;
      
      // 检查积分是否足够
      if (currentCredits < amount) {
        throw new Error(`积分不足，当前余额: ${currentCredits}，需要: ${amount}`);
      }

      const newCredits = currentCredits - amount;
      const newTotalSpent = user.total_spent_credits + amount;

      // 更新用户积分
      await user.update({
        credits: newCredits,
        total_spent_credits: newTotalSpent
      }, { transaction });

      // 记录交易流水
      const creditTransaction = await CreditTransaction.create({
        userId: userId,
        type: 'spend',
        amount: -amount, // 负数表示消费
        balance_before: currentCredits,
        balance_after: newCredits,
        description: description,
        reference_id: referenceId,
        reference_type: referenceType
      }, { transaction });

      await transaction.commit();

      console.log(`✅ 用户 ${userId} 消费积分成功: -${amount} (${currentCredits} → ${newCredits})`);
      
      return {
        success: true,
        transaction: creditTransaction,
        balance_before: currentCredits,
        balance_after: newCredits,
        amount_spent: amount
      };
    } catch (error) {
      await transaction.rollback();
      console.error('消费积分失败:', error);
      throw error;
    }
  }

  /**
   * 获得积分（事务操作）
   * @param {number} userId - 用户ID
   * @param {number} amount - 获得积分数量
   * @param {string} description - 获得描述
   * @param {string} referenceId - 关联业务ID
   * @param {string} referenceType - 关联业务类型
   * @returns {Promise<Object>} 交易结果
   */
  static async earnCredits(userId, amount, description, referenceId = null, referenceType = null) {
    const transaction = await sequelize.transaction();
    
    try {
      // 获取用户当前积分（加锁）
      const user = await User.findByPk(userId, {
        attributes: ['id', 'credits', 'total_earned_credits'],
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      const currentCredits = user.credits;
      const newCredits = currentCredits + amount;
      const newTotalEarned = user.total_earned_credits + amount;

      // 更新用户积分
      await user.update({
        credits: newCredits,
        total_earned_credits: newTotalEarned
      }, { transaction });

      // 记录交易流水
      const creditTransaction = await CreditTransaction.create({
        userId: userId,
        type: 'earn',
        amount: amount, // 正数表示获得
        balance_before: currentCredits,
        balance_after: newCredits,
        description: description,
        reference_id: referenceId,
        reference_type: referenceType
      }, { transaction });

      await transaction.commit();

      console.log(`✅ 用户 ${userId} 获得积分成功: +${amount} (${currentCredits} → ${newCredits})`);
      
      return {
        success: true,
        transaction: creditTransaction,
        balance_before: currentCredits,
        balance_after: newCredits,
        amount_earned: amount
      };
    } catch (error) {
      await transaction.rollback();
      console.error('获得积分失败:', error);
      throw error;
    }
  }

  /**
   * 退款积分
   * @param {number} userId - 用户ID
   * @param {number} amount - 退款积分数量
   * @param {string} description - 退款描述
   * @param {string} referenceId - 关联业务ID
   * @returns {Promise<Object>} 交易结果
   */
  static async refundCredits(userId, amount, description, referenceId = null) {
    return await this.earnCredits(userId, amount, description, referenceId, 'refund');
  }

  /**
   * 获取用户积分交易记录
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 交易记录列表
   */
  static async getUserTransactions(userId, options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        type = null,
        startDate = null,
        endDate = null
      } = options;

      const whereClause = { userId };
      
      if (type) {
        whereClause.type = type;
      }
      
      if (startDate || endDate) {
        whereClause.created_at = {};
        if (startDate) {
          whereClause.created_at[sequelize.Op.gte] = startDate;
        }
        if (endDate) {
          whereClause.created_at[sequelize.Op.lte] = endDate;
        }
      }

      const transactions = await CreditTransaction.findAndCountAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize,
        attributes: [
          'id', 'type', 'amount', 'balance_before', 'balance_after',
          'description', 'reference_id', 'reference_type', 'created_at'
        ]
      });

      return {
        transactions: transactions.rows,
        total: transactions.count,
        page,
        pageSize,
        totalPages: Math.ceil(transactions.count / pageSize)
      };
    } catch (error) {
      console.error('获取交易记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户积分统计
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 积分统计信息
   */
  static async getUserCreditStats(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: ['credits', 'total_earned_credits', 'total_spent_credits']
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      return {
        current_credits: user.credits,
        total_earned: user.total_earned_credits,
        total_spent: user.total_spent_credits,
        net_credits: user.total_earned_credits - user.total_spent_credits
      };
    } catch (error) {
      console.error('获取积分统计失败:', error);
      throw error;
    }
  }

  /**
   * 初始化新用户积分
   * @param {number} userId - 用户ID
   * @param {number} initialCredits - 初始积分（默认500）
   * @returns {Promise<Object>} 初始化结果
   */
  static async initializeUserCredits(userId, initialCredits = 500) {
    try {
      return await this.earnCredits(
        userId, 
        initialCredits, 
        '新用户注册赠送', 
        `user_${userId}`, 
        'registration'
      );
    } catch (error) {
      console.error('初始化用户积分失败:', error);
      throw error;
    }
  }
}

module.exports = CreditService;