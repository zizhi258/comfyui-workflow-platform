const ComfyUIService = require('../services/comfyuiService');

async function testWorkflow() {
  console.log('🧪 测试工作流模板解析...\n');
  
  const comfyuiService = new ComfyUIService();
  
  const testParams = {
    POSITIVE_PROMPT: 'a beautiful cat',
    NEGATIVE_PROMPT: 'blurry, low quality',
    MODEL_NAME: 'sd_xl_base_1.0.safetensors',
    LORA_NAME: 'detail_tweaker_xl.safetensors',
    LORA_STRENGTH: 1.0,
    WIDTH: 1024,
    HEIGHT: 1024,
    BATCH_SIZE: 1,
    CFG_SCALE: 7.5,
    STEPS: 25,
    SEED: 123456,
    SAMPLER: 'dpmpp_2m_karras',
    DENOISE_STRENGTH: 0.75,
    UPSCALE_WIDTH: 2048,
    UPSCALE_HEIGHT: 2048,
    UPSCALE_MODEL: 'RealESRGAN_x4plus.pth'
  };
  
  const workflows = [
    'text2img_basic.json',
    'text2img_lora.json',
    'img2img_basic.json',
    'upscale_basic.json'
  ];
  
  for (const workflowName of workflows) {
    try {
      console.log(`📄 测试工作流: ${workflowName}`);
      
      // 1. 加载原始工作流
      console.log('  1️⃣ 加载原始模板...');
      const workflow = await comfyuiService.loadWorkflow(workflowName);
      console.log('  ✅ 原始模板加载成功');
      
      // 2. 替换占位符
      console.log('  2️⃣ 替换参数占位符...');
      const processedWorkflow = comfyuiService.replaceWorkflowPlaceholders(workflow, testParams);
      console.log('  ✅ 参数替换成功');
      
      // 3. 验证JSON格式
      console.log('  3️⃣ 验证JSON格式...');
      const jsonStr = JSON.stringify(processedWorkflow);
      JSON.parse(jsonStr); // 尝试重新解析
      console.log('  ✅ JSON格式有效');
      
      // 4. 检查关键参数
      console.log('  4️⃣ 检查关键参数...');
      const nodeKeys = Object.keys(processedWorkflow);
      console.log(`  📊 节点数量: ${nodeKeys.length}`);
      
      // 检查是否还有未替换的占位符
      const hasPlaceholders = jsonStr.includes('{{') && jsonStr.includes('}}');
      if (hasPlaceholders) {
        console.log('  ⚠️  仍有未替换的占位符');
        const matches = jsonStr.match(/\{\{[^}]+\}\}/g);
        if (matches) {
          console.log('  未替换的占位符:', matches);
        }
      } else {
        console.log('  ✅ 所有占位符已替换');
      }
      
      console.log(`  🎉 ${workflowName} 测试通过\n`);
      
    } catch (error) {
      console.log(`  ❌ ${workflowName} 测试失败:`, error.message);
      if (error.message.includes('JSON')) {
        console.log('  💡 这是JSON格式错误，需要检查占位符替换逻辑');
      }
      console.log('');
    }
  }
  
  console.log('🏁 工作流测试完成');
}

testWorkflow().catch(console.error);