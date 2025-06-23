const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const { Op } = require('sequelize');

/**
 * 获取用户通知列表
 */
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      type = '',
      isRead = '',
      priority = ''
    } = req.query;

    // 构建查询条件
    const whereClause = { userId };
    
    if (type) {
      whereClause.type = type;
    }
    
    if (isRead !== '') {
      whereClause.isRead = isRead === 'true';
    }
    
    if (priority) {
      whereClause.priority = priority;
    }
    
    // 排除过期的通知
    whereClause[Op.or] = [
      { expiresAt: null },
      { expiresAt: { [Op.gt]: new Date() } }
    ];

    // 分页计算
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 查询通知
    const { count, rows } = await Notification.findAndCountAll({
      where: whereClause,
      order: [
        ['isRead', 'ASC'], // 未读优先
        ['priority', 'DESC'], // 优先级高的优先
        ['createdAt', 'DESC'] // 时间倒序
      ],
      limit: parseInt(limit),
      offset: offset
    });

    // 计算分页信息
    const totalPages = Math.ceil(count / parseInt(limit));

    // 计算未读数量
    const unreadCount = await Notification.count({
      where: {
        userId: userId,
        isRead: false,
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gt]: new Date() } }
        ]
      }
    });

    console.log(`用户 ${userId} 查询通知: ${count} 个结果，${unreadCount} 个未读`);

    res.json({
      success: true,
      data: {
        notifications: rows.map(notification => ({
          id: notification.id,
          title: notification.title,
          content: notification.content,
          type: notification.type,
          priority: notification.priority,
          isRead: notification.isRead,
          relatedType: notification.relatedType,
          relatedId: notification.relatedId,
          metadata: notification.metadata,
          createdAt: notification.createdAt,
          expiresAt: notification.expiresAt
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: totalPages,
          totalCount: count,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1,
          limit: parseInt(limit)
        },
        unreadCount: unreadCount
      }
    });

  } catch (error) {
    console.error('获取用户通知失败:', error);
    res.status(500).json({
      success: false,
      message: '获取通知列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 标记通知为已读
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        userId: userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }

    await notification.update({ isRead: true });

    console.log(`用户 ${userId} 标记通知 ${notificationId} 为已读`);

    res.json({
      success: true,
      message: '标记已读成功',
      data: {
        id: notification.id,
        isRead: notification.isRead
      }
    });

  } catch (error) {
    console.error('标记通知已读失败:', error);
    res.status(500).json({
      success: false,
      message: '标记已读失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 批量标记通知为已读
 */
const markNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationIds = [], markAll = false } = req.body;

    let whereClause = { userId: userId, isRead: false };

    if (!markAll && notificationIds.length > 0) {
      whereClause.id = { [Op.in]: notificationIds };
    }

    const [updatedCount] = await Notification.update(
      { isRead: true },
      { where: whereClause }
    );

    console.log(`用户 ${userId} 批量标记了 ${updatedCount} 个通知为已读`);

    res.json({
      success: true,
      message: `成功标记 ${updatedCount} 个通知为已读`,
      data: {
        updatedCount: updatedCount
      }
    });

  } catch (error) {
    console.error('批量标记通知已读失败:', error);
    res.status(500).json({
      success: false,
      message: '批量标记已读失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 删除通知
 */
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        userId: userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }

    await notification.destroy();

    console.log(`用户 ${userId} 删除了通知 ${notificationId}`);

    res.json({
      success: true,
      message: '删除通知成功'
    });

  } catch (error) {
    console.error('删除通知失败:', error);
    res.status(500).json({
      success: false,
      message: '删除通知失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 获取未读通知数量
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Notification.count({
      where: {
        userId: userId,
        isRead: false,
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gt]: new Date() } }
        ]
      }
    });

    res.json({
      success: true,
      data: {
        unreadCount: unreadCount
      }
    });

  } catch (error) {
    console.error('获取未读通知数量失败:', error);
    res.status(500).json({
      success: false,
      message: '获取未读数量失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 创建通知（系统内部使用）
 */
const createNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    console.log(`创建通知成功: ${notification.title} (用户 ${notification.userId})`);
    return { success: true, notification };
  } catch (error) {
    console.error('创建通知失败:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 批量创建通知（系统内部使用）
 */
const createBulkNotifications = async (notificationsData) => {
  try {
    const notifications = await Notification.bulkCreate(notificationsData);
    console.log(`批量创建通知成功: ${notifications.length} 个通知`);
    return { success: true, notifications };
  } catch (error) {
    console.error('批量创建通知失败:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
  markNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
  createNotification,
  createBulkNotifications
};