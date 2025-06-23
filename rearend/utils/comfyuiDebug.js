const axios = require('axios');

/**
 * ComfyUI调试工具
 */
class ComfyUIDebugger {
  constructor(comfyuiUrl = 'http://127.0.0.1:8188') {
    this.comfyuiUrl = comfyuiUrl;
  }

  /**
   * 运行完整的ComfyUI诊断
   */
  async runDiagnostics() {
    console.log('🔍 开始ComfyUI诊断...\n');
    
    const results = {
      connection: false,
      endpoints: {},
      models: false,
      suggestions: []
    };

    // 1. 基础连接测试
    console.log('1️⃣ 测试基础连接...');
    try {
      const response = await axios.get(this.comfyuiUrl, { timeout: 3000 });
      console.log('✅ 基础连接成功');
      results.connection = true;
    } catch (error) {
      console.log('❌ 基础连接失败:', error.message);
      if (error.code === 'ECONNREFUSED') {
        results.suggestions.push('ComfyUI服务未启动，请运行: python main.py --listen 127.0.0.1 --port 8188');
      } else if (error.code === 'ENOTFOUND') {
        results.suggestions.push('检查ComfyUI服务地址是否正确');
      }
    }

    // 2. 关键端点测试
    console.log('\n2️⃣ 测试关键端点...');
    const endpoints = [
      '/system_stats',
      '/queue', 
      '/history',
      '/object_info'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${this.comfyuiUrl}${endpoint}`, { timeout: 5000 });
        console.log(`✅ ${endpoint}: HTTP ${response.status}`);
        results.endpoints[endpoint] = true;
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.message}`);
        results.endpoints[endpoint] = false;
      }
    }

    // 3. 模型信息检查
    console.log('\n3️⃣ 检查模型信息...');
    try {
      const response = await axios.get(`${this.comfyuiUrl}/object_info`, { timeout: 10000 });
      if (response.data && response.data.CheckpointLoaderSimple) {
        const checkpoints = response.data.CheckpointLoaderSimple.input.required.ckpt_name[0];
        console.log('✅ 发现可用模型:', checkpoints.length, '个');
        console.log('📋 前3个模型:', checkpoints.slice(0, 3));
        results.models = true;
        
        if (checkpoints.length === 0) {
          results.suggestions.push('没有找到可用的模型文件，请将.safetensors文件放在ComfyUI/models/checkpoints/目录下');
        }
      } else {
        console.log('❌ 无法获取模型信息');
        results.suggestions.push('ComfyUI节点信息不完整，可能需要重启服务');
      }
    } catch (error) {
      console.log('❌ 模型信息检查失败:', error.message);
    }

    // 4. 简单工作流测试
    console.log('\n4️⃣ 测试简单工作流...');
    try {
      const testWorkflow = this.createTestWorkflow();
      const response = await axios.post(`${this.comfyuiUrl}/prompt`, {
        client_id: 'debug-test',
        prompt: testWorkflow
      }, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
        validateStatus: status => status < 500
      });

      if (response.status === 200) {
        console.log('✅ 工作流提交成功');
        console.log('📄 任务ID:', response.data.prompt_id);
      } else {
        console.log('❌ 工作流提交失败:', response.status);
        console.log('💬 错误详情:', response.data);
        
        if (response.status === 400) {
          results.suggestions.push('工作流格式有误，请检查节点参数和连接');
        }
      }
    } catch (error) {
      console.log('❌ 工作流测试失败:', error.message);
    }

    // 5. 输出诊断结果
    console.log('\n📊 诊断结果总结:');
    console.log('连接状态:', results.connection ? '✅ 正常' : '❌ 失败');
    console.log('模型可用:', results.models ? '✅ 正常' : '❌ 异常');
    
    const workingEndpoints = Object.values(results.endpoints).filter(v => v).length;
    console.log(`端点状态: ${workingEndpoints}/${endpoints.length} 正常`);

    if (results.suggestions.length > 0) {
      console.log('\n💡 建议解决方案:');
      results.suggestions.forEach((suggestion, index) => {
        console.log(`${index + 1}. ${suggestion}`);
      });
    }

    return results;
  }

  /**
   * 创建测试工作流
   */
  createTestWorkflow() {
    return {
      "3": {
        "inputs": {
          "seed": 123456,
          "steps": 20,
          "cfg": 8,
          "sampler_name": "euler",
          "scheduler": "normal",
          "denoise": 1,
          "model": ["4", 0],
          "positive": ["6", 0],
          "negative": ["7", 0],
          "latent_image": ["5", 0]
        },
        "class_type": "KSampler"
      },
      "4": {
        "inputs": {
          "ckpt_name": "model.safetensors"
        },
        "class_type": "CheckpointLoaderSimple"
      },
      "5": {
        "inputs": {
          "width": 512,
          "height": 512,
          "batch_size": 1
        },
        "class_type": "EmptyLatentImage"
      },
      "6": {
        "inputs": {
          "text": "test prompt",
          "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "7": {
        "inputs": {
          "text": "",
          "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "8": {
        "inputs": {
          "samples": ["3", 0],
          "vae": ["4", 2]
        },
        "class_type": "VAEDecode"
      },
      "9": {
        "inputs": {
          "filename_prefix": "test",
          "images": ["8", 0]
        },
        "class_type": "SaveImage"
      }
    };
  }

  /**
   * 快速健康检查
   */
  async quickHealthCheck() {
    try {
      const response = await axios.get(`${this.comfyuiUrl}/queue`, { timeout: 3000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

module.exports = ComfyUIDebugger;