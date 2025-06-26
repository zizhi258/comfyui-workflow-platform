const axios = require('axios');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ComfyUIService {
  constructor() {
    this.comfyuiUrl = process.env.COMFYUI_URL || 'http://127.0.0.1:8188';
    this.clientId = uuidv4();
    this.workflowsPath = path.join(__dirname, '../workflows');
  }

  /**
   * 生成图片
   * @param {Object} params - 生成参数
   * @returns {Promise<Object>} 生成结果
   */
  async generateImage(params) {
    try {
      const {
        prompt,
        negativePrompt = '',
        model, // 必须由前端提供，不设默认值
        size = '1024x1024',
        batchSize = 1,
        cfgScale = 7.5,
        steps = 25,
        seed = -1,
        sampler, // 必须由前端提供，不设默认值
        clipSkip = 2,
        type = 'text2img',
        frontendTaskId // 前端提供的taskId
      } = params;

      // 验证必要参数
      if (!model) {
        throw new Error('模型参数是必需的');
      }
      if (!sampler) {
        throw new Error('采样器参数是必需的');
      }

      console.log('接收到的生成参数:', { model, sampler, prompt: prompt?.substring(0, 50) + '...' });

      // 解析尺寸
      const [width, height] = size.split('x').map(Number);
      
      // 生成随机种子
      const finalSeed = seed === -1 ? Math.floor(Math.random() * 2147483647) : seed;

      // 选择合适的工作流
      let workflowName;
      if (type === 'img2img') {
        workflowName = 'img2img_basic.json';
      } else if (type === 'upscale') {
        workflowName = 'upscale_basic.json';
      } else {
        workflowName = 'text2img_basic.json';
      }

      // 加载并处理工作流
      const workflow = await this.loadWorkflow(workflowName);
      const processedWorkflow = this.replaceWorkflowPlaceholders(workflow, {
        POSITIVE_PROMPT: prompt,
        NEGATIVE_PROMPT: negativePrompt,
        MODEL_NAME: model,
        WIDTH: width,
        HEIGHT: height,
        BATCH_SIZE: batchSize,
        CFG_SCALE: cfgScale,
        STEPS: steps,
        SEED: finalSeed,
        SAMPLER: sampler,
        DENOISE_STRENGTH: 0.75, // 用于img2img
        UPSCALE_WIDTH: width * 2, // 用于放大
        UPSCALE_HEIGHT: height * 2,
        UPSCALE_MODEL: 'RealESRGAN_x4plus.pth'
      });

      // 提交任务到ComfyUI
      const promptResponse = await this.submitPrompt(processedWorkflow);
      
      if (!promptResponse.success) {
        throw new Error(promptResponse.error || '提交任务失败');
      }

      const promptId = promptResponse.prompt_id;

      // 监听任务执行，传递frontendTaskId用于进度转发
      const result = await this.waitForCompletion(promptId, frontendTaskId);
      
      console.log('准备返回ComfyUI结果:', {
        promptId,
        imagesCount: result.images.length,
        seed: finalSeed,
        workflow: workflowName
      });

      return {
        success: true,
        data: {
          promptId,
          images: result.images,
          config: params,
          seed: finalSeed,
          workflow: workflowName
        }
      };

    } catch (error) {
      console.error('ComfyUI生成失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 加载工作流文件
   * @param {string} workflowName - 工作流文件名
   * @returns {Object} 工作流JSON
   */
  async loadWorkflow(workflowName) {
    const workflowPath = path.join(this.workflowsPath, workflowName);
    
    if (!fs.existsSync(workflowPath)) {
      throw new Error(`工作流文件不存在: ${workflowName}`);
    }
    
    const workflowContent = fs.readFileSync(workflowPath, 'utf8');
    return JSON.parse(workflowContent);
  }

  /**
   * 替换工作流中的占位符
   * @param {Object} workflow - 工作流JSON
   * @param {Object} params - 替换参数
   * @returns {Object} 处理后的工作流
   */
  replaceWorkflowPlaceholders(workflow, params) {
    let workflowStr = JSON.stringify(workflow);
    
    // 替换所有占位符
    Object.keys(params).forEach(key => {
      const value = params[key];
      const placeholder = `PLACEHOLDER_${key}`;
      
      // 根据值的类型进行正确的替换
      if (typeof value === 'string') {
        // 字符串类型：正确转义特殊字符
        const escapedValue = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        workflowStr = workflowStr.replace(new RegExp(`"${placeholder}"`, 'g'), `"${escapedValue}"`);
      } else if (typeof value === 'number') {
        // 数字类型：替换占位符为数字（去掉引号）
        workflowStr = workflowStr.replace(new RegExp(`"${placeholder}"`, 'g'), value.toString());
      } else if (typeof value === 'boolean') {
        // 布尔类型：替换占位符为布尔值（去掉引号）
        workflowStr = workflowStr.replace(new RegExp(`"${placeholder}"`, 'g'), value.toString());
      } else {
        // 其他类型使用JSON序列化
        workflowStr = workflowStr.replace(new RegExp(`"${placeholder}"`, 'g'), JSON.stringify(value));
      }
    });
    
    try {
      return JSON.parse(workflowStr);
    } catch (error) {
      console.error('工作流JSON解析失败:', error.message);
      console.error('处理后的工作流字符串:', workflowStr.substring(0, 500) + '...');
      throw new Error('工作流格式错误');
    }
  }

  /**
   * 提交任务到ComfyUI
   * @param {Object} workflow - 处理后的工作流
   * @returns {Promise<Object>} 提交结果
   */
  async submitPrompt(workflow) {
    try {
      console.log('正在提交工作流到ComfyUI:', this.comfyuiUrl);
      console.log('客户端ID:', this.clientId);
      
      // 验证工作流格式
      if (!workflow || typeof workflow !== 'object') {
        throw new Error('工作流格式无效');
      }
      
      const requestData = {
        client_id: this.clientId,
        prompt: workflow
      };
      
      console.log('请求数据键:', Object.keys(requestData));
      console.log('工作流节点数:', Object.keys(workflow).length);
      
      const response = await axios.post(`${this.comfyuiUrl}/prompt`, requestData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        },
        validateStatus: function (status) {
          return status < 500; // 接受所有小于500的状态码
        }
      });

      console.log('ComfyUI响应状态:', response.status);
      console.log('ComfyUI响应数据:', response.data);

      if (response.status === 200 && response.data && response.data.prompt_id) {
        return {
          success: true,
          prompt_id: response.data.prompt_id,
          number: response.data.number
        };
      } else {
        let errorMsg = '提交失败';
        if (response.data && response.data.error) {
          errorMsg = `ComfyUI错误: ${JSON.stringify(response.data.error)}`;
        } else if (response.status === 400) {
          errorMsg = `请求格式错误 (400): ${JSON.stringify(response.data)}`;
        }
        
        console.error('ComfyUI提交失败:', errorMsg);
        return {
          success: false,
          error: errorMsg
        };
      }
    } catch (error) {
      console.error('提交ComfyUI任务异常:', error);
      
      let errorMessage = error.message;
      if (error.response) {
        errorMessage = `HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`;
        console.error('错误响应:', error.response.data);
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'ComfyUI服务未启动或连接被拒绝';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'ComfyUI服务地址无法解析';
      }
      
      return {
        success: false,
        error: `连接ComfyUI失败: ${errorMessage}`
      };
    }
  }

  /**
   * 等待任务完成
   * @param {string} promptId - ComfyUI任务ID
   * @param {string} frontendTaskId - 前端任务ID，用于进度转发
   * @returns {Promise<Object>} 完成结果
   */
  async waitForCompletion(promptId, frontendTaskId) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${this.comfyuiUrl.replace('http', 'ws')}/ws?clientId=${this.clientId}`);
      const timeout = setTimeout(() => {
        console.log('任务超时，关闭WebSocket连接');
        ws.close();
        reject(new Error('任务超时'));
      }, 600000); // 10分钟超时

      ws.on('open', () => {
        console.log('WebSocket连接已建立');
      });

      ws.on('message', async (data) => {
        try {
          // 检查数据类型
          let messageText;
          if (Buffer.isBuffer(data)) {
            messageText = data.toString('utf8');
          } else {
            messageText = data.toString();
          }
          
          // 跳过空消息或非JSON数据
          if (!messageText || messageText.trim() === '') {
            return;
          }
          
          // 尝试解析JSON，如果失败则跳过这条消息
          let message;
          try {
            message = JSON.parse(messageText);
          } catch (parseError) {
            // 跳过非JSON消息（可能是二进制数据或其他格式）
            console.log('跳过非JSON消息:', messageText.substring(0, 50));
            return;
          }
          
          console.log('收到WebSocket消息:', message);
          
          if (message.type === 'executing' && message.data.node === null) {
            // 任务完成
            console.log('任务执行完成，开始获取图片');
            
            // 发送完成消息给前端
            this.forwardCompletionToFrontend(frontendTaskId || promptId);
            
            clearTimeout(timeout);
            ws.close();
            
            // 获取生成的图片
            const images = await this.getGeneratedImages(promptId);
            resolve({ images });
          }
          
          if (message.type === 'execution_error') {
            console.error('执行错误:', message.data);
            clearTimeout(timeout);
            ws.close();
            reject(new Error(`执行错误: ${JSON.stringify(message.data)}`));
          }
          
          // 记录进度信息并转发给前端
          if (message.type === 'progress') {
            console.log('🎯 收到ComfyUI进度消息:', JSON.stringify(message.data, null, 2));
            // 使用frontendTaskId转发进度
            this.forwardProgressToFrontend(frontendTaskId || promptId, message.data);
          }
          
          // 记录其他类型的消息用于调试
          if (message.type === 'executing') {
            console.log('⚙️ ComfyUI执行状态:', message.data);
          }
          
        } catch (error) {
          console.error('处理WebSocket消息失败:', error);
        }
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`WebSocket错误: ${error.message}`));
      });

      ws.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }

  /**
   * 获取生成的图片
   * @param {string} promptId - 任务ID
   * @returns {Promise<Array>} 图片列表
   */
  async getGeneratedImages(promptId) {
    try {
      console.log('正在获取生成的图片，promptId:', promptId);
      
      // 等待一下确保图片已经保存
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 获取历史记录
      const historyResponse = await axios.get(`${this.comfyuiUrl}/history/${promptId}`, { timeout: 10000 });
      const history = historyResponse.data[promptId];
      
      console.log('历史记录响应:', history ? '找到历史记录' : '未找到历史记录');
      
      if (!history || !history.outputs) {
        console.log('没有找到输出数据');
        return [];
      }

      const images = [];
      
      // 遍历输出节点查找图片
      Object.keys(history.outputs).forEach(nodeId => {
        const output = history.outputs[nodeId];
        console.log(`节点 ${nodeId} 输出:`, output);
        
        if (output.images && Array.isArray(output.images)) {
          output.images.forEach((imageInfo, index) => {
            const imageUrl = `${this.comfyuiUrl}/view?filename=${imageInfo.filename}&subfolder=${imageInfo.subfolder || ''}&type=${imageInfo.type || 'output'}`;
            console.log(`找到图片 ${index + 1}:`, imageInfo.filename);
            
            images.push({
              filename: imageInfo.filename,
              subfolder: imageInfo.subfolder || '',
              type: imageInfo.type || 'output',
              url: imageUrl
            });
          });
        }
      });

      console.log(`总共找到 ${images.length} 张图片`);
      return images;
    } catch (error) {
      console.error('获取生成图片失败:', error.message);
      return [];
    }
  }

  /**
   * 获取可用模型列表
   * @returns {Promise<Object>} 模型列表
   */
  async getAvailableModels() {
    try {
      console.log('正在获取ComfyUI模型列表...');
      
      const response = await axios.get(`${this.comfyuiUrl}/object_info`, { 
        timeout: 10000,
        validateStatus: function (status) {
          return status < 500;
        }
      });
      
      if (response.status === 200 && response.data && response.data.CheckpointLoaderSimple) {
        const checkpointInfo = response.data.CheckpointLoaderSimple;
        
        if (checkpointInfo.input && checkpointInfo.input.required && checkpointInfo.input.required.ckpt_name) {
          const modelFiles = checkpointInfo.input.required.ckpt_name[0];
          
          // 转换为前端需要的格式
          const models = modelFiles.map(filename => ({
            label: filename.replace('.safetensors', '').replace('.ckpt', ''),
            value: filename,
            description: `${filename} - 来自ComfyUI`
          }));
          
          console.log(`✅ 找到 ${models.length} 个可用模型`);
          
          return {
            success: true,
            data: models
          };
        }
      }
      
      console.log('❌ ComfyUI响应格式异常');
      return {
        success: false,
        error: 'ComfyUI响应格式异常'
      };
      
    } catch (error) {
      console.error('获取ComfyUI模型列表失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取可用采样器列表
   * @returns {Promise<Object>} 采样器列表
   */
  async getAvailableSamplers() {
    try {
      console.log('正在获取ComfyUI采样器列表...');
      
      const response = await axios.get(`${this.comfyuiUrl}/object_info`, { 
        timeout: 10000,
        validateStatus: function (status) {
          return status < 500;
        }
      });
      
      if (response.status === 200 && response.data && response.data.KSampler) {
        const ksamplerInfo = response.data.KSampler;
        
        if (ksamplerInfo.input && ksamplerInfo.input.required && ksamplerInfo.input.required.sampler_name) {
          const samplerNames = ksamplerInfo.input.required.sampler_name[0];
          
          console.log(`✅ 找到 ${samplerNames.length} 个可用采样器:`, samplerNames);
          
          return {
            success: true,
            data: samplerNames
          };
        }
      }
      
      console.log('❌ ComfyUI采样器响应格式异常');
      return {
        success: false,
        error: 'ComfyUI采样器响应格式异常'
      };
      
    } catch (error) {
      console.error('获取ComfyUI采样器列表失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 检查ComfyUI服务状态
   * @returns {Promise<boolean>} 服务是否可用
   */
  async checkHealth() {
    try {
      console.log('正在检查ComfyUI健康状态:', this.comfyuiUrl);
      
      // 尝试多个端点来检查服务状态
      const endpoints = ['/system_stats', '/queue', '/history'];
      
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`${this.comfyuiUrl}${endpoint}`, { 
            timeout: 5000,
            validateStatus: function (status) {
              return status < 500;
            }
          });
          
          if (response.status === 200) {
            console.log(`✅ ComfyUI健康检查通过 (${endpoint})`);
            return true;
          }
        } catch (err) {
          console.log(`❌ 端点 ${endpoint} 检查失败:`, err.message);
          continue;
        }
      }
      
      console.log('❌ 所有健康检查端点都失败');
      return false;
      
    } catch (error) {
      console.error('ComfyUI健康检查异常:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.log('提示: ComfyUI服务可能未启动，请运行: python main.py --listen 127.0.0.1 --port 8188');
      }
      return false;
    }
  }

  /**
   * 转发进度信息给前端
   * @param {string} promptId - 任务ID
   * @param {Object} progressData - 进度数据
   */
  forwardProgressToFrontend(promptId, progressData) {
    try {
      console.log(`🔄 尝试转发进度 - taskId: ${promptId}`);
      console.log(`📊 原始进度数据:`, progressData);
      console.log(`🔗 活跃连接数: ${global.wsConnections ? global.wsConnections.size : 0}`);
      
      // 检查是否有客户端订阅了这个任务的进度
      if (global.wsConnections && global.wsConnections.has(promptId)) {
        const clientWs = global.wsConnections.get(promptId);
        console.log(`✅ 找到订阅客户端，连接状态: ${clientWs.readyState}`);
        
        // 检查连接是否仍然活跃
        if (clientWs.readyState === clientWs.OPEN) {
          // 计算进度百分比 - 兼容不同的数据格式
          let progressPercent = 0;
          let step = 0;
          let totalSteps = 0;
          let title = '生成中...';
          
          // 处理不同的进度数据格式
          if (progressData.value !== undefined && progressData.max !== undefined) {
            step = progressData.value;
            totalSteps = progressData.max;
            if (totalSteps > 0) {
              progressPercent = Math.round((step / totalSteps) * 100);
            }
          } else if (progressData.progress !== undefined) {
            // 某些版本可能使用不同的字段名
            progressPercent = Math.round(progressData.progress * 100);
          }
          
          // 提取标题信息
          if (progressData.node) {
            title = `处理节点: ${progressData.node}`;
          }
          
          const progressMessage = {
            type: 'progress',
            taskId: promptId,
            data: {
              percent: progressPercent,
              step: step,
              totalSteps: totalSteps,
              node: progressData.node || '',
              title: title,
              raw: progressData // 保留原始数据
            },
            timestamp: new Date().toISOString()
          };
          
          clientWs.send(JSON.stringify(progressMessage));
          console.log(`📤 进度已转发给前端: ${progressPercent}% (${step}/${totalSteps}) - ${title}`);
        } else {
          // 清理无效连接
          global.wsConnections.delete(promptId);
          console.log(`🗑️ 清理无效的WebSocket连接: ${promptId}`);
        }
      } else {
        console.log(`❌ 未找到taskId的订阅客户端: ${promptId}`);
        if (global.wsConnections) {
          console.log(`🔍 当前活跃的订阅:`, Array.from(global.wsConnections.keys()));
        }
      }
    } catch (error) {
      console.error('❌ 转发进度信息失败:', error);
    }
  }

  /**
   * 转发任务完成消息给前端
   * @param {string} promptId - 任务ID
   */
  forwardCompletionToFrontend(promptId) {
    try {
      console.log(`✅ 发送完成消息 - taskId: ${promptId}`);
      
      if (global.wsConnections && global.wsConnections.has(promptId)) {
        const clientWs = global.wsConnections.get(promptId);
        
        if (clientWs.readyState === clientWs.OPEN) {
          const completionMessage = {
            type: 'progress',
            taskId: promptId,
            data: {
              percent: 100,
              completed: true,
              title: '生成完成'
            },
            timestamp: new Date().toISOString()
          };
          
          clientWs.send(JSON.stringify(completionMessage));
          console.log(`📤 完成消息已发送给前端: ${promptId}`);
          
          // 清理连接
          global.wsConnections.delete(promptId);
        }
      }
    } catch (error) {
      console.error('❌ 转发完成消息失败:', error);
    }
  }
}

module.exports = ComfyUIService;