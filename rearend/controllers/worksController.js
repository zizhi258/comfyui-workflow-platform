const Work = require('../models/work.model');
const User = require('../models/user.model');
const UserWorkLike = require('../models/userWorkLike.model');
const fileManager = require('../utils/fileManager');
const { Op } = require('sequelize');

/**
 * 保存作品到画廊
 * 将临时图片移动到永久存储，并创建作品记录
 */
const saveWork = async (req, res) => {
  try {
    const {
      title = '未命名作品',
      description = '',
      tempFileName, // 临时文件名
      imageData, // 图片相关数据
      generationConfig, // 生成配置
      tags = []
    } = req.body;

    const userId = req.user.id;

    // 验证必要参数
    if (!tempFileName) {
      return res.status(400).json({
        success: false,
        message: '缺少临时文件信息'
      });
    }

    if (!imageData || !generationConfig) {
      return res.status(400).json({
        success: false,
        message: '缺少图片或生成配置信息'
      });
    }

    console.log(`用户 ${userId} 正在保存作品: ${title}`);
    console.log('临时文件:', tempFileName);

    // 将图片从temp目录移动到works目录
    const moveResult = await fileManager.moveToWorks(tempFileName, userId, {
      title,
      prompt: generationConfig.prompt
    });

    if (!moveResult.success) {
      return res.status(500).json({
        success: false,
        message: `保存图片失败: ${moveResult.error}`
      });
    }

    console.log('图片移动成功:', moveResult);

    // 创建作品记录
    const workData = {
      userId: userId,
      title: title.trim(),
      description: description.trim(),
      prompt: generationConfig.prompt,
      negativePrompt: generationConfig.negativePrompt || '',
      imageUrls: [moveResult.imageUrl], // 主图片URL
      thumbnailUrl: moveResult.thumbnailUrl,
      modelConfig: {
        model: generationConfig.model,
        size: generationConfig.size,
        batchSize: generationConfig.batchSize,
        cfgScale: generationConfig.cfgScale,
        steps: generationConfig.steps,
        sampler: generationConfig.sampler,
        clipSkip: generationConfig.clipSkip
      },
      tags: Array.isArray(tags) ? tags : [],
      isPublic: false, // 默认私有，用户可以后续修改
      originalFilename: moveResult.fileName,
      fileSize: moveResult.fileSize,
      dimensions: moveResult.dimensions,
      storageType: moveResult.storageType,
      storagePath: moveResult.storagePath,
      seed: imageData.seed || generationConfig.seed,
      promptId: imageData.promptId || null
    };

    const newWork = await Work.create(workData);

    console.log(`作品保存成功，ID: ${newWork.id}`);

    // 返回保存结果
    res.status(201).json({
      success: true,
      message: '作品保存成功',
      data: {
        work: {
          id: newWork.id,
          title: newWork.title,
          description: newWork.description,
          imageUrl: newWork.imageUrls[0],
          thumbnailUrl: newWork.thumbnailUrl,
          prompt: newWork.prompt,
          modelConfig: newWork.modelConfig,
          tags: newWork.tags,
          isPublic: newWork.isPublic,
          createdAt: newWork.createdAt,
          dimensions: newWork.dimensions,
          fileSize: newWork.fileSize
        }
      }
    });

  } catch (error) {
    console.error('保存作品失败:', error);
    res.status(500).json({
      success: false,
      message: '保存作品失败，请稍后重试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 获取用户的作品列表
 */
const getUserWorks = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 12,
      sort = 'created_at',
      order = 'DESC',
      search = '',
      isPublic
    } = req.query;

    // 构建查询条件
    const whereClause = { userId };
    
    // 搜索条件
    if (search.trim()) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search.trim()}%` } },
        { description: { [Op.like]: `%${search.trim()}%` } },
        { prompt: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    // 公开状态筛选
    if (isPublic !== undefined) {
      whereClause.isPublic = isPublic === 'true';
    }

    // 分页计算
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 查询作品
    const { count, rows } = await Work.findAndCountAll({
      where: whereClause,
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: offset,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatar']
      }]
    });

    // 计算分页信息
    const totalPages = Math.ceil(count / parseInt(limit));

    console.log(`用户 ${userId} 查询作品: ${count} 个结果`);

    // 获取用户点赞状态
    const workIds = rows.map(work => work.id);
    const userLikes = await UserWorkLike.findAll({
      where: {
        userId: userId,
        workId: { [Op.in]: workIds }
      }
    });
    const likedWorkIds = new Set(userLikes.map(like => like.workId));

    res.json({
      success: true,
      data: {
        works: rows.map(work => ({
          id: work.id,
          title: work.title,
          description: work.description,
          imageUrl: work.imageUrls[0], // 主图片
          thumbnailUrl: work.thumbnailUrl,
          prompt: work.prompt,
          modelConfig: work.modelConfig,
          tags: work.tags,
          isPublic: work.isPublic,
          views: work.views,
          likes: work.likes,
          dimensions: work.dimensions,
          fileSize: work.fileSize,
          createdAt: work.createdAt,
          updatedAt: work.updatedAt,
          author: work.author,
          isLiked: likedWorkIds.has(work.id)
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: totalPages,
          totalCount: count,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('获取用户作品失败:', error);
    res.status(500).json({
      success: false,
      message: '获取作品列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 获取公开作品画廊
 */
const getPublicGallery = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      sort = 'created_at',
      order = 'DESC',
      search = '',
      timeFilter = 'all' // today, week, month, all
    } = req.query;
    
    const userId = req.user?.id; // 用户可能未登录

    // 构建查询条件
    const whereClause = { isPublic: true };

    // 搜索条件
    if (search.trim()) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search.trim()}%` } },
        { description: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    // 时间筛选
    if (timeFilter !== 'all') {
      const now = new Date();
      let timeStart;
      
      switch (timeFilter) {
        case 'today':
          timeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          timeStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          timeStart = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }
      
      if (timeStart) {
        whereClause.createdAt = { [Op.gte]: timeStart };
      }
    }

    // 分页计算
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 查询公开作品
    const { count, rows } = await Work.findAndCountAll({
      where: whereClause,
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: offset,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatar']
      }]
    });

    // 计算分页信息
    const totalPages = Math.ceil(count / parseInt(limit));

    console.log(`公开画廊查询: ${count} 个结果`);

    // 获取用户点赞状态（如果用户已登录）
    let likedWorkIds = new Set();
    if (userId) {
      const workIds = rows.map(work => work.id);
      const userLikes = await UserWorkLike.findAll({
        where: {
          userId: userId,
          workId: { [Op.in]: workIds }
        }
      });
      likedWorkIds = new Set(userLikes.map(like => like.workId));
    }

    res.json({
      success: true,
      data: {
        works: rows.map(work => ({
          id: work.id,
          title: work.title,
          description: work.description,
          imageUrl: work.imageUrls[0],
          thumbnailUrl: work.thumbnailUrl,
          prompt: work.prompt,
          author: {
            id: work.author.id,
            username: work.author.username,
            avatar: work.author.avatar
          },
          tags: work.tags,
          views: work.views,
          likes: work.likes,
          dimensions: work.dimensions,
          createdAt: work.createdAt,
          featured: work.likes > 10, // 简单的推荐逻辑
          isNew: (new Date() - new Date(work.createdAt)) < 24 * 60 * 60 * 1000, // 24小时内为新作品
          isLiked: userId ? likedWorkIds.has(work.id) : false
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: totalPages,
          totalCount: count,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('获取公开画廊失败:', error);
    res.status(500).json({
      success: false,
      message: '获取画廊失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 获取单个作品详情
 */
const getWorkById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const work = await Work.findByPk(id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatar', 'bio']
      }]
    });

    if (!work) {
      return res.status(404).json({
        success: false,
        message: '作品不存在'
      });
    }

    // 检查访问权限
    if (!work.isPublic && work.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权访问该作品'
      });
    }

    // 增加浏览次数（如果不是作者本人）
    if (work.userId !== userId) {
      await work.increment('views');
    }

    // 获取用户点赞状态（如果用户已登录）
    let isLiked = false;
    if (userId) {
      const userLike = await UserWorkLike.findOne({
        where: {
          userId: userId,
          workId: work.id
        }
      });
      isLiked = !!userLike;
    }

    res.json({
      success: true,
      data: {
        work: {
          id: work.id,
          title: work.title,
          description: work.description,
          imageUrl: work.imageUrls[0],
          thumbnailUrl: work.thumbnailUrl,
          prompt: work.prompt,
          negativePrompt: work.negativePrompt,
          modelConfig: work.modelConfig,
          tags: work.tags,
          isPublic: work.isPublic,
          views: work.views + (work.userId !== userId ? 1 : 0), // 实时显示增加后的浏览数
          likes: work.likes,
          dimensions: work.dimensions,
          fileSize: work.fileSize,
          seed: work.seed,
          createdAt: work.createdAt,
          updatedAt: work.updatedAt,
          author: work.author,
          isOwner: work.userId === userId,
          isLiked: isLiked
        }
      }
    });

  } catch (error) {
    console.error('获取作品详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取作品详情失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 更新作品信息
 */
const updateWork = async (req, res) => {
  try {
    const workId = req.params.id;
    const userId = req.user.id;
    const {
      title,
      description,
      tags,
      isPublic
    } = req.body;

    // 查找作品
    const work = await Work.findByPk(workId);
    if (!work) {
      return res.status(404).json({
        success: false,
        message: '作品不存在'
      });
    }

    // 检查权限：只有作品作者可以编辑
    if (work.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权编辑该作品'
      });
    }

    // 更新作品信息
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (isPublic !== undefined) updateData.isPublic = Boolean(isPublic);

    await work.update(updateData);

    console.log(`用户 ${userId} 更新了作品 ${workId}:`, updateData);

    res.json({
      success: true,
      message: '作品更新成功',
      data: {
        work: {
          id: work.id,
          title: work.title,
          description: work.description,
          imageUrl: work.imageUrls[0],
          thumbnailUrl: work.thumbnailUrl,
          prompt: work.prompt,
          tags: work.tags,
          isPublic: work.isPublic,
          views: work.views,
          likes: work.likes,
          createdAt: work.createdAt,
          updatedAt: work.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('更新作品失败:', error);
    res.status(500).json({
      success: false,
      message: '更新作品失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 点赞/取消点赞作品
 */
const toggleWorkLike = async (req, res) => {
  try {
    const workId = parseInt(req.params.id);
    const userId = req.user.id;

    // 查找作品
    const work = await Work.findByPk(workId);
    if (!work) {
      return res.status(404).json({
        success: false,
        message: '作品不存在'
      });
    }

    // 检查作品是否公开（只有公开作品可以被点赞，作者本人也可以点赞自己的私有作品）
    if (!work.isPublic && work.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: '无法对此作品点赞'
      });
    }

    // 检查用户是否已经点赞过
    const existingLike = await UserWorkLike.findOne({
      where: {
        userId: userId,
        workId: workId
      }
    });

    let action, message;
    
    if (existingLike) {
      // 用户已经点赞过，执行取消点赞
      await existingLike.destroy();
      await work.decrement('likes');
      action = 'unlike';
      message = '取消点赞成功';
    } else {
      // 用户未点赞过，执行点赞
      await UserWorkLike.create({
        userId: userId,
        workId: workId
      });
      await work.increment('likes');
      action = 'like';
      message = '点赞成功';
    }

    await work.reload();

    console.log(`用户 ${userId} ${action === 'like' ? '点赞' : '取消点赞'}了作品 ${workId}`);

    res.json({
      success: true,
      message: message,
      data: {
        workId: work.id,
        likes: work.likes,
        isLiked: action === 'like',
        action
      }
    });

  } catch (error) {
    console.error('点赞操作失败:', error);
    res.status(500).json({
      success: false,
      message: '点赞操作失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 获取用户作品统计信息
 */
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // 获取用户所有作品的统计信息
    const works = await Work.findAll({
      where: { userId },
      attributes: ['likes', 'views']
    });

    const stats = {
      totalWorks: works.length,
      totalLikes: works.reduce((sum, work) => sum + (work.likes || 0), 0),
      totalViews: works.reduce((sum, work) => sum + (work.views || 0), 0)
    };

    console.log(`用户 ${userId} 的统计信息:`, stats);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('获取用户统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 删除作品
 */
const deleteWork = async (req, res) => {
  try {
    const workId = req.params.id;
    const userId = req.user.id;

    // 查找作品
    const work = await Work.findByPk(workId);
    if (!work) {
      return res.status(404).json({
        success: false,
        message: '作品不存在'
      });
    }

    // 检查权限：只有作品作者可以删除
    if (work.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权删除该作品'
      });
    }

    // 删除文件
    try {
      await fileManager.deleteWork(work.imageUrls, work.thumbnailUrl);
    } catch (fileError) {
      console.warn('删除文件失败，但继续删除数据库记录:', fileError.message);
    }

    // 删除数据库记录
    await work.destroy();

    console.log(`用户 ${userId} 删除了作品 ${workId}`);

    res.json({
      success: true,
      message: '作品删除成功'
    });

  } catch (error) {
    console.error('删除作品失败:', error);
    res.status(500).json({
      success: false,
      message: '删除作品失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  saveWork,
  getUserWorks,
  getPublicGallery,
  getWorkById,
  updateWork,
  deleteWork,
  toggleWorkLike,
  getUserStats
};