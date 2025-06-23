# ComfyUI 工作流配置指南

## 概述

本项目已集成ComfyUI API，支持多种AI图片生成工作流。系统会根据用户选择自动选择合适的工作流模板，并替换其中的参数占位符。

## 🔧 环境配置

### 1. 启动ComfyUI服务
```bash
# 确保ComfyUI运行在默认端口
python main.py --listen 127.0.0.1 --port 8188
```

### 2. 配置环境变量
在 `.env` 文件中设置：
```env
COMFYUI_URL=http://127.0.0.1:8188
COMFYUI_TIMEOUT=300000
```

## 📁 工作流文件结构

```
/rearend/workflows/
├── text2img_basic.json      # 基础文生图工作流
├── text2img_lora.json       # 带LoRA的文生图工作流
├── img2img_basic.json       # 图生图工作流
└── upscale_basic.json       # 图片放大工作流
```

## 🎯 工作流选择逻辑

系统根据以下条件自动选择工作流：

1. **图生图模式**: `img2img_basic.json`
2. **图片放大模式**: `upscale_basic.json`
3. **带LoRA的文生图**: `text2img_lora.json`
4. **基础文生图**: `text2img_basic.json`

## 🔄 参数占位符说明

### 通用占位符

| 占位符 | 说明 | 示例值 | 必需 |
|--------|------|--------|------|
| `{{POSITIVE_PROMPT}}` | 正面提示词 | "a beautiful cat" | ✅ |
| `{{NEGATIVE_PROMPT}}` | 负面提示词 | "blurry, low quality" | ✅ |
| `{{MODEL_NAME}}` | 模型文件名 | "sd_xl_base_1.0.safetensors" | ✅ |
| `{{WIDTH}}` | 图片宽度 | 1024 | ✅ |
| `{{HEIGHT}}` | 图片高度 | 1024 | ✅ |
| `{{BATCH_SIZE}}` | 批次大小 | 1 | ✅ |
| `{{CFG_SCALE}}` | CFG比例 | 7.5 | ✅ |
| `{{STEPS}}` | 生成步数 | 25 | ✅ |
| `{{SEED}}` | 随机种子 | 123456 | ✅ |
| `{{SAMPLER}}` | 采样器 | "dpmpp_2m_karras" | ✅ |

### LoRA专用占位符

| 占位符 | 说明 | 示例值 | 必需 |
|--------|------|--------|------|
| `{{LORA_NAME}}` | LoRA文件名 | "detail_tweaker_xl.safetensors" | ❌ |
| `{{LORA_STRENGTH}}` | LoRA强度 | 1.0 | ❌ |

### 图生图专用占位符

| 占位符 | 说明 | 示例值 | 必需 |
|--------|------|--------|------|
| `{{INPUT_IMAGE}}` | 输入图片路径 | "input.jpg" | ✅ |
| `{{DENOISE_STRENGTH}}` | 去噪强度 | 0.75 | ✅ |

### 放大专用占位符

| 占位符 | 说明 | 示例值 | 必需 |
|--------|------|--------|------|
| `{{UPSCALE_WIDTH}}` | 放大后宽度 | 2048 | ✅ |
| `{{UPSCALE_HEIGHT}}` | 放大后高度 | 2048 | ✅ |
| `{{UPSCALE_MODEL}}` | 放大模型 | "RealESRGAN_x4plus.pth" | ✅ |

## 🎨 模型映射配置

### 基础模型映射
```javascript
const modelMapping = {
  'sd_xl_base': 'sd_xl_base_1.0.safetensors',
  'realistic_vision': 'realisticVisionV60B1_v51VAE.safetensors',
  'anime_pastel': 'animePastelDream_softBakedVAE.safetensors',
  'dreamshaper': 'dreamshaper_8.safetensors'
};
```

### LoRA模型映射
```javascript
const loraMapping = {
  'detail_tweaker': 'detail_tweaker_xl.safetensors',
  'lcm_lora': 'lcm_lora_xl.safetensors',
  'film_grain': 'film_grain_xl.safetensors'
};
```

## 🔧 自定义工作流

### 1. 创建新工作流

1. 在ComfyUI中设计工作流
2. 导出为JSON格式
3. 将关键参数替换为占位符
4. 保存到 `/workflows/` 目录

### 2. 占位符替换示例

原始节点：
```json
{
  "inputs": {
    "text": "a beautiful landscape",
    "clip": ["4", 1]
  },
  "class_type": "CLIPTextEncode"
}
```

添加占位符后：
```json
{
  "inputs": {
    "text": "{{POSITIVE_PROMPT}}",
    "clip": ["4", 1]
  },
  "class_type": "CLIPTextEncode"
}
```

### 3. 修改控制器逻辑

在 `generateController.js` 中添加新工作流的选择逻辑：

```javascript
// 选择合适的工作流
let workflowName;
if (type === 'your_new_type') {
  workflowName = 'your_new_workflow.json';
} else if (type === 'img2img') {
  workflowName = 'img2img_basic.json';
}
// ... 其他条件
```

## 📊 工作流节点说明

### 核心节点类型

1. **CheckpointLoaderSimple**: 加载基础模型
2. **CLIPTextEncode**: 文本编码（提示词）
3. **EmptyLatentImage**: 创建空白潜在图像
4. **KSampler**: 核心采样器
5. **VAEDecode**: VAE解码生成图片
6. **SaveImage**: 保存图片
7. **LoraLoader**: 加载LoRA模型
8. **LoadImage**: 加载输入图片
9. **VAEEncode**: VAE编码图片
10. **ImageUpscaleWithModel**: 模型放大

### 节点连接规则

- 模型输出连接到采样器的model输入
- CLIP输出连接到文本编码的clip输入
- 潜在图像连接到采样器的latent_image输入
- 采样器输出连接到VAE解码的samples输入

## 🚀 性能优化

### 1. 模型预加载
```bash
# 在ComfyUI启动时预加载常用模型
python main.py --preload-models
```

### 2. GPU内存优化
```bash
# 启用低显存模式
python main.py --lowvram
```

### 3. 并发处理
```bash
# 启用队列并发
python main.py --queue-size 5
```

## 🔍 调试和监控

### 1. 查看ComfyUI日志
ComfyUI控制台会显示详细的执行日志，包括：
- 节点执行顺序
- 参数验证结果
- 错误信息

### 2. WebSocket监控
系统通过WebSocket实时监控任务状态：
```javascript
// 监听执行进度
ws.on('message', (data) => {
  const message = JSON.parse(data);
  if (message.type === 'progress') {
    console.log(`进度: ${message.data.value}/${message.data.max}`);
  }
});
```

### 3. 健康检查
系统会自动检查ComfyUI服务状态：
```javascript
const isHealthy = await comfyuiService.checkHealth();
```

## ⚠️ 注意事项

1. **模型文件名**: 确保 `modelMapping` 中的文件名与ComfyUI中的实际文件名匹配
2. **工作流兼容性**: 不同版本的ComfyUI可能有节点差异，需要适配
3. **内存管理**: 大模型和高分辨率图片会消耗大量GPU内存
4. **超时设置**: 复杂工作流可能需要更长的执行时间
5. **错误处理**: 系统会自动回退到模拟生成，确保服务可用性

## 🔄 故障排除

### 常见问题

1. **连接失败**: 检查ComfyUI是否启动，端口是否正确
2. **模型不存在**: 确认模型文件在ComfyUI的models目录中
3. **工作流错误**: 检查JSON格式和节点连接
4. **内存不足**: 降低批次大小或图片分辨率
5. **生成超时**: 增加COMFYUI_TIMEOUT设置

### 日志分析
```bash
# 查看系统日志
tail -f /path/to/app.log

# 查看ComfyUI日志
tail -f /path/to/comfyui.log
```

## 📝 更新工作流

当需要更新工作流时：

1. 停止服务
2. 更新JSON文件
3. 重启服务
4. 测试新工作流

系统支持热重载，无需重启整个应用即可加载新工作流。