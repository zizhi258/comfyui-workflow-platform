const ComfyUIService = require('../services/comfyuiService');

async function testComfyUIIntegration() {
  console.log('🔬 测试完整ComfyUI集成流程...\n');
  
  const comfyuiService = new ComfyUIService();
  
  // 1. 健康检查
  console.log('1️⃣ ComfyUI健康检查...');
  const isHealthy = await comfyuiService.checkHealth();
  console.log(`健康状态: ${isHealthy ? '✅ 正常' : '❌ 异常'}\n`);
  
  // 2. 测试工作流生成
  console.log('2️⃣ 测试工作流生成...');
  
  const testParams = {
    prompt: 'a beautiful cat sitting in a garden',
    negativePrompt: 'blurry, low quality',
    model: 'sd_xl_base_1.0.safetensors',
    lora: '',
    style: 'realistic',
    size: '1024x1024',
    batchSize: 1,
    cfgScale: 7.5,
    steps: 25,
    seed: 123456,
    sampler: 'dpmpp_2m_karras',
    clipSkip: 2,
    type: 'text2img'
  };
  
  try {
    console.log('📝 生成参数:');
    console.log('  提示词:', testParams.prompt);
    console.log('  模型:', testParams.model);
    console.log('  尺寸:', testParams.size);
    console.log('  步数:', testParams.steps);
    console.log('  CFG:', testParams.cfgScale);
    
    console.log('\n🚀 开始生成...');
    const result = await comfyuiService.generateImage(testParams);
    
    console.log('\n📊 生成结果:');
    console.log('成功:', result.success);
    
    if (result.success) {
      console.log('✅ ComfyUI生成成功!');
      console.log('任务ID:', result.data.promptId);
      console.log('图片数量:', result.data.images.length);
      console.log('使用工作流:', result.data.workflow);
      
      result.data.images.forEach((img, index) => {
        console.log(`图片 ${index + 1}:`);
        console.log('  URL:', img.url);
        console.log('  文件名:', img.filename);
      });
    } else {
      console.log('❌ ComfyUI生成失败:', result.error);
      
      if (result.error.includes('连接ComfyUI失败')) {
        console.log('\n💡 解决建议:');
        console.log('1. 确保ComfyUI已启动:');
        console.log('   cd /path/to/ComfyUI');
        console.log('   python main.py --listen 127.0.0.1 --port 8188');
        console.log('2. 检查端口是否被占用:');
        console.log('   netstat -tlnp | grep 8188');
        console.log('3. 检查防火墙设置');
      } else if (result.error.includes('工作流格式错误')) {
        console.log('\n💡 解决建议:');
        console.log('1. 检查工作流模板JSON格式');
        console.log('2. 验证占位符替换逻辑');
        console.log('3. 确保所有必需参数都已提供');
      }
    }
    
  } catch (error) {
    console.log('❌ 测试过程中出现异常:', error.message);
    console.log('错误堆栈:', error.stack);
  }
  
  console.log('\n🏁 ComfyUI集成测试完成');
}

testComfyUIIntegration().catch(console.error);