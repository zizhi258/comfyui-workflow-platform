const ComfyUIService = require('../services/comfyuiService');

// 获取可用模型列表
const getAvailableModels = async (req, res) => {
  try {
    const comfyuiService = new ComfyUIService();
    
    // 检查ComfyUI服务状态
    const isHealthy = await comfyuiService.checkHealth();
    
    if (!isHealthy) {
      console.warn('ComfyUI服务不可用，返回默认模型列表');
      
      // 返回默认模型列表
      return res.json({
        success: true,
        message: '使用默认模型列表（ComfyUI服务不可用）',
        data: {
          models: [
            { 
              label: '默认模型', 
              value: 'default.safetensors',
              description: 'ComfyUI服务不可用时的默认模型'
            }
          ],
          source: 'default'
        }
      });
    }

    // 从ComfyUI获取模型列表
    const models = await comfyuiService.getAvailableModels();
    
    if (models.success) {
      res.json({
        success: true,
        message: '获取模型列表成功',
        data: {
          models: models.data,
          source: 'comfyui'
        }
      });
    } else {
      // ComfyUI返回错误，使用默认模型
      res.json({
        success: true,
        message: '获取模型列表失败，使用默认模型',
        data: {
          models: [
            { 
              label: '默认模型', 
              value: 'default.safetensors',
              description: '获取模型列表失败时的默认模型'
            }
          ],
          source: 'fallback'
        }
      });
    }

  } catch (error) {
    console.error('获取模型列表错误:', error);
    
    // 发生异常时也返回默认模型，确保前端能正常工作
    res.json({
      success: true,
      message: '获取模型列表异常，使用默认模型',
      data: {
        models: [
          { 
            label: '默认模型', 
            value: 'default.safetensors',
            description: '服务异常时的默认模型'
          }
        ],
        source: 'error'
      }
    });
  }
};

// 获取可用采样器列表
const getAvailableSamplers = async (req, res) => {
  try {
    const comfyuiService = new ComfyUIService();
    
    // 检查ComfyUI服务状态
    const isHealthy = await comfyuiService.checkHealth();
    
    if (!isHealthy) {
      console.warn('ComfyUI服务不可用，返回默认采样器列表');
      
      // 返回默认采样器列表
      return res.json({
        success: true,
        message: '使用默认采样器列表（ComfyUI服务不可用）',
        data: {
          samplers: ['euler', 'euler_a', 'heun', 'dpm_2', 'dpm_2_a', 'lms', 'dpm_fast', 'dpm_adaptive', 'dpmpp_2s_a', 'dpmpp_sde', 'dpmpp_2m', 'ddim', 'uni_pc', 'uni_pc_bh2'],
          source: 'default'
        }
      });
    }

    // 从ComfyUI获取采样器列表
    const samplers = await comfyuiService.getAvailableSamplers();
    
    if (samplers.success) {
      res.json({
        success: true,
        message: '获取采样器列表成功',
        data: {
          samplers: samplers.data,
          source: 'comfyui'
        }
      });
    } else {
      // ComfyUI返回错误，使用默认采样器
      res.json({
        success: true,
        message: '获取采样器列表失败，使用默认采样器',
        data: {
          samplers: ['euler', 'euler_a', 'heun', 'dpm_2', 'dpm_2_a', 'lms', 'dpm_fast', 'dpm_adaptive', 'dpmpp_2s_a', 'dpmpp_sde', 'dpmpp_2m', 'ddim', 'uni_pc', 'uni_pc_bh2'],
          source: 'fallback'
        }
      });
    }

  } catch (error) {
    console.error('获取采样器列表错误:', error);
    
    // 发生异常时也返回默认采样器，确保前端能正常工作
    res.json({
      success: true,
      message: '获取采样器列表异常，使用默认采样器',
      data: {
        samplers: ['euler', 'euler_a', 'heun', 'dpm_2', 'dpm_2_a', 'lms', 'dpm_fast', 'dpm_adaptive', 'dpmpp_2s_a', 'dpmpp_sde', 'dpmpp_2m', 'ddim', 'uni_pc', 'uni_pc_bh2'],
        source: 'error'
      }
    });
  }
};

module.exports = {
  getAvailableModels,
  getAvailableSamplers
};