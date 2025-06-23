#!/usr/bin/env node

const ComfyUIDebugger = require('../utils/comfyuiDebug');

async function main() {
  const url = process.argv[2] || 'http://127.0.0.1:8188';
  
  console.log('🚀 ComfyUI 诊断工具');
  console.log('目标地址:', url);
  console.log('=' .repeat(50));
  
  const comfyDebugger = new ComfyUIDebugger(url);
  const results = await comfyDebugger.runDiagnostics();
  
  console.log('\n' + '='.repeat(50));
  
  if (results.connection && results.models) {
    console.log('🎉 ComfyUI服务状态良好，可以正常使用！');
  } else {
    console.log('⚠️  ComfyUI服务存在问题，请按照建议进行修复');
  }
  
  process.exit(results.connection && results.models ? 0 : 1);
}

main().catch(console.error);