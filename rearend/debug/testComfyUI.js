const axios = require('axios');

async function testComfyUIConnection() {
  const comfyuiUrl = 'http://127.0.0.1:8188';
  
  console.log('正在测试ComfyUI连接...');
  
  try {
    // 1. 测试基本连接
    console.log('1. 测试基本连接...');
    const healthResponse = await axios.get(`${comfyuiUrl}/system_stats`, { timeout: 5000 });
    console.log('✅ ComfyUI服务正常运行');
    console.log('系统信息:', healthResponse.data);
    
    // 2. 测试获取模型列表
    console.log('\n2. 测试获取模型列表...');
    try {
      const modelsResponse = await axios.get(`${comfyuiUrl}/object_info`, { timeout: 10000 });
      console.log('✅ 获取模型信息成功');
      
      // 检查是否有CheckpointLoaderSimple
      if (modelsResponse.data.CheckpointLoaderSimple) {
        console.log('✅ CheckpointLoaderSimple节点可用');
        const checkpoints = modelsResponse.data.CheckpointLoaderSimple.input.required.ckpt_name[0];
        console.log('可用模型:', checkpoints.slice(0, 3)); // 只显示前3个
      }
    } catch (error) {
      console.log('❌ 获取模型信息失败:', error.message);
    }
    
    // 3. 测试简单工作流
    console.log('\n3. 测试简单工作流提交...');
    
    const simpleWorkflow = {
      "3": {
        "inputs": {
          "seed": 123456,
          "steps": 20,
          "cfg": 8.0,
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
          "ckpt_name": "model.safetensors" // 这里需要实际存在的模型名
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
          "text": "a beautiful cat",
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
          "filename_prefix": "ComfyUI",
          "images": ["8", 0]
        },
        "class_type": "SaveImage"
      }
    };
    
    try {
      const promptResponse = await axios.post(`${comfyuiUrl}/prompt`, {
        client_id: "test-client",
        prompt: simpleWorkflow
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ 工作流提交成功');
      console.log('响应:', promptResponse.data);
      
    } catch (error) {
      console.log('❌ 工作流提交失败');
      console.log('错误状态:', error.response?.status);
      console.log('错误信息:', error.response?.data || error.message);
      
      if (error.response?.data) {
        console.log('详细错误:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
  } catch (error) {
    console.log('❌ ComfyUI连接失败:', error.message);
    console.log('请确保ComfyUI正在运行并监听在 http://127.0.0.1:8188');
  }
}

// 运行测试
testComfyUIConnection();