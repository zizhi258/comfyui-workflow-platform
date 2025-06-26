const fs = require('fs');
const path = require('path');
const axios = require('axios');
const WebSocket = require('ws');
const ComfyUIService = require('../services/comfyuiService');
const CreditService = require('../services/creditService');
const fileManager = require('../utils/fileManager');

// AIGC图片生成 - 集成ComfyUI
const generateImage = async (req, res) => {
  try {
    const {
      prompt,
      negativePrompt = '',
      model, // 必须由前端提供
      size = '1024x1024',
      batchSize = 1,
      cfgScale = 7.5,
      steps = 25,
      seed = -1,
      sampler, // 必须由前端提供
      clipSkip = 2,
      frontendTaskId // 前端提供的taskId
    } = req.body;

    // 验证必要参数
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: '请提供创意描述（prompt）'
      });
    }

    if (!model) {
      return res.status(400).json({
        success: false,
        message: '请选择模型'
      });
    }

    if (!sampler) {
      return res.status(400).json({
        success: false,
        message: '请选择采样器'
      });
    }

    console.log('收到生成请求参数:', { model, sampler, prompt: prompt.substring(0, 50) + '...' });

    // === 积分系统验证 ===
    const GENERATION_COST = 15; // 每次生成消耗15积分
    const totalCostCredits = GENERATION_COST * batchSize; // 根据批次计算总消耗
    
    console.log(`💰 积分消耗计算: ${GENERATION_COST} × ${batchSize} = ${totalCostCredits} 积分`);
    
    // 检查用户积分余额
    try {
      const userCredits = await CreditService.getUserCredits(req.user.id);
      console.log(`👤 用户当前积分: ${userCredits}`);
      
      if (userCredits < totalCostCredits) {
        return res.status(402).json({ // 402 Payment Required
          success: false,
          message: `积分不足，当前余额: ${userCredits}，需要: ${totalCostCredits}`,
          errorCode: 'INSUFFICIENT_CREDITS',
          data: {
            currentCredits: userCredits,
            requiredCredits: totalCostCredits,
            shortfall: totalCostCredits - userCredits
          }
        });
      }
    } catch (error) {
      console.error('检查积分失败:', error);
      return res.status(500).json({
        success: false,
        message: '积分系统错误，请稍后重试'
      });
    }

    // 验证参数范围
    if (batchSize < 1 || batchSize > 4) {
      return res.status(400).json({
        success: false,
        message: '批次大小必须在1-4之间'
      });
    }

    if (cfgScale < 1 || cfgScale > 20) {
      return res.status(400).json({
        success: false,
        message: 'CFG Scale必须在1-20之间'
      });
    }

    if (steps < 10 || steps > 50) {
      return res.status(400).json({
        success: false,
        message: '生成步数必须在10-50之间'
      });
    }

    // 计算预估时间和消耗
    const baseTime = 15;
    const sizeTime = size === '1024x1024' ? 10 : 0;
    const batchTime = (batchSize - 1) * 12;
    const stepsTime = Math.floor((steps - 20) / 5) * 2;
    const estimatedTime = Math.max(baseTime + sizeTime + batchTime + stepsTime, 5);

    const baseCost = 10;
    const sizeCost = size === '1024x1024' ? 5 : 0;
    const batchCost = (batchSize - 1) * 8;
    const totalCost = baseCost + sizeCost + batchCost;

    // 使用前端提供的taskId或生成新的
    const taskId = frontendTaskId || `task_${Date.now()}`;
    console.log('使用的taskId:', taskId);

    // 生成配置对象
    const generationConfig = {
      prompt: prompt.trim(),
      negativePrompt,
      model,
      size,
      batchSize,
      cfgScale,
      steps,
      seed: seed === -1 ? Math.floor(Math.random() * 1000000) : seed,
      sampler,
      clipSkip,
      userId: req.user.id,
      createdAt: new Date(),
      estimatedTime,
      cost: totalCost,
      taskId: taskId
    };

    // 初始化ComfyUI服务
    const comfyuiService = new ComfyUIService();
    
    // 检查ComfyUI服务状态
    const isHealthy = await comfyuiService.checkHealth();
    if (!isHealthy) {
      console.warn('ComfyUI服务不可用，使用模拟生成');
      console.log('💡 请确保ComfyUI正在运行:');
      console.log('   cd /path/to/ComfyUI');
      console.log('   python main.py --listen 127.0.0.1 --port 8188');
      
      // 如果ComfyUI不可用，回退到模拟生成
      return await generateMockImages(generationConfig, totalCost, estimatedTime, res, req.user.id, totalCostCredits, taskId);
    }

    // 调用ComfyUI生成图片 - 直接使用前端传来的模型和采样器名称
    const result = await comfyuiService.generateImage({
      prompt: generationConfig.prompt,
      negativePrompt: generationConfig.negativePrompt,
      model: generationConfig.model, // 直接使用前端传来的真实模型文件名
      size: generationConfig.size,
      batchSize: generationConfig.batchSize,
      cfgScale: generationConfig.cfgScale,
      steps: generationConfig.steps,
      seed: generationConfig.seed,
      sampler: generationConfig.sampler, // 直接使用前端传来的真实采样器名称
      clipSkip: generationConfig.clipSkip,
      type: 'text2img',
      frontendTaskId: taskId // 传递taskId给ComfyUI服务
    });

    if (!result.success) {
      console.error('ComfyUI生成失败，使用模拟生成:', result.error);
      // 如果生成失败，回退到模拟生成
      return await generateMockImages(generationConfig, totalCost, estimatedTime, res, req.user.id, totalCostCredits, taskId);
    }

    console.log('ComfyUI生成成功，处理返回数据:', result);

    // 处理ComfyUI生成的图片 - 保存到临时目录
    const processedImages = [];
    for (let index = 0; index < result.data.images.length; index++) {
      const img = result.data.images[index];
      console.log(`正在处理第${index + 1}张图片:`, img.url);
      
      // 保存图片到temp目录
      const saveResult = await fileManager.saveToTemp(img.url, {
        seed: generationConfig.seed + index,
        index: index,
        promptId: result.data.promptId
      });
      
      if (saveResult.success) {
        processedImages.push({
          id: `img_${Date.now()}_${index}`,
          url: saveResult.tempUrl, // 使用临时URL
          tempUrl: saveResult.tempUrl,
          tempFileName: saveResult.fileName,
          filename: img.filename, // ComfyUI原始文件名
          seed: generationConfig.seed + index,
          config: generationConfig,
          createdAt: new Date(),
          size: generationConfig.size,
          format: 'png',
          fileSize: saveResult.fileSize,
          dimensions: saveResult.dimensions,
          storageType: 'temp' // 标记为临时存储
        });
      } else {
        console.error(`保存第${index + 1}张图片失败:`, saveResult.error);
        // 如果保存失败，仍使用ComfyUI的URL
        processedImages.push({
          id: `img_${Date.now()}_${index}`,
          url: img.url,
          filename: img.filename,
          seed: generationConfig.seed + index,
          config: generationConfig,
          createdAt: new Date(),
          size: generationConfig.size,
          format: 'png',
          storageType: 'comfyui' // 标记为ComfyUI直接访问
        });
      }
    }

    console.log('处理后的图片数据:', processedImages);

    // === 生成成功，扣除积分 ===
    let creditTransactionResult = null;
    try {
      creditTransactionResult = await CreditService.spendCredits(
        req.user.id,
        totalCostCredits,
        `AI图片生成 - ${batchSize}张图片`,
        taskId,
        'image_generation'
      );
      
      console.log(`✅ 积分扣除成功: -${totalCostCredits} (余额: ${creditTransactionResult.balance_after})`);
    } catch (creditError) {
      console.error('扣除积分失败:', creditError);
      // 积分扣除失败，但不影响图片生成结果的返回
      // 可以考虑记录日志或发送通知给管理员
    }

    // 返回生成结果
    const responseData = {
      success: true,
      message: '图片生成成功',
      data: {
        taskId: taskId, // 使用前端提供的taskId
        images: processedImages,
        config: generationConfig,
        cost: totalCost, // 保留原有的cost字段（可能用于其他地方）
        creditsUsed: totalCostCredits, // 新增：积分消耗
        creditsRemaining: creditTransactionResult?.balance_after || null, // 新增：剩余积分
        estimatedTime: estimatedTime,
        actualTime: Math.floor(estimatedTime * (0.8 + Math.random() * 0.4)),
        batchSize: batchSize,
        workflow: result.data.workflow,
        provider: 'ComfyUI'
      }
    };

    console.log('最终返回给前端的数据:', JSON.stringify(responseData, null, 2));
    res.json(responseData);

  } catch (error) {
    console.error('图片生成错误:', error);
    res.status(500).json({
      success: false,
      message: '图片生成失败，请稍后重试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取生成任务状态（预留接口）
const getGenerationStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // 这里应该查询实际的任务状态
    // 目前返回模拟数据
    res.json({
      success: true,
      data: {
        taskId,
        status: 'completed', // pending, processing, completed, failed
        progress: 100,
        message: '生成完成'
      }
    });
  } catch (error) {
    console.error('获取生成状态错误:', error);
    res.status(500).json({
      success: false,
      message: '获取状态失败'
    });
  }
};

// 模拟图片生成（回退方案）
const generateMockImages = async (generationConfig, totalCost, estimatedTime, res, userId, totalCostCredits, taskId) => {
  const generatedImages = [];
  for (let i = 0; i < generationConfig.batchSize; i++) {
    const imageSeed = generationConfig.seed + i;
    const imageData = {
      id: `img_${Date.now()}_${i}`,
      url: `https://picsum.photos/512/512?random=${Date.now() + i}`,
      seed: imageSeed,
      config: generationConfig,
      createdAt: new Date(),
      size: generationConfig.size,
      format: 'png',
      storageType: 'mock'
    };
    generatedImages.push(imageData);
  }

  // === 模拟生成也要扣除积分 ===
  let creditTransactionResult = null;
  try {
    creditTransactionResult = await CreditService.spendCredits(
      userId,
      totalCostCredits,
      `AI图片生成(模拟) - ${generationConfig.batchSize}张图片`,
      taskId,
      'image_generation_mock'
    );
    
    console.log(`✅ 模拟生成积分扣除成功: -${totalCostCredits} (余额: ${creditTransactionResult.balance_after})`);
  } catch (creditError) {
    console.error('模拟生成扣除积分失败:', creditError);
    // 积分扣除失败，但不影响模拟生成结果的返回
  }

  return res.json({
    success: true,
    message: '图片生成成功（模拟）',
    data: {
      taskId: taskId,
      images: generatedImages,
      config: generationConfig,
      cost: totalCost,
      creditsUsed: totalCostCredits, // 新增：积分消耗
      creditsRemaining: creditTransactionResult?.balance_after || null, // 新增：剩余积分
      estimatedTime: estimatedTime,
      actualTime: Math.floor(estimatedTime * (0.8 + Math.random() * 0.4)),
      batchSize: generationConfig.batchSize,
      provider: 'Mock'
    }
  });
};

// 映射函数已删除 - 现在直接使用从ComfyUI动态获取的真实模型和采样器名称

module.exports = {
  generateImage,
  getGenerationStatus
};