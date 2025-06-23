# AIGC创意工作流平台 - API接口规范文档

## 基础信息

- **平台名称**: AIGC创意工作流平台 (创想引擎)
- **开发环境API**: `http://localhost:3000/api` (通过Vite代理)
- **生产环境API**: `https://api.yourdomain.com/api`
- **测试环境API**: `https://test-api.yourdomain.com/api`
- **请求格式**: JSON
- **响应格式**: JSON
- **认证方式**: Bearer Token

## 跨域处理

### 开发环境
使用Vite代理解决跨域问题，配置在 `vite.config.js`:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
    secure: false
  }
}
```

### 生产环境
后端需要配置CORS允许前端域名访问，或使用Nginx反向代理。

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

### 错误响应
```json
{
  "success": false,
  "error": "错误信息",
  "code": "ERROR_CODE"
}
```

## 用户认证接口

### 1. 用户注册

**接口地址**: `POST /api/users/register`

**功能说明**: 新用户注册账户

**请求参数**:
```json
{
  "username": "string",     // 用户名，3-20个字符，只能包含字母、数字和下划线
  "email": "string",        // 邮箱地址
  "password": "string"      // 密码，最少6个字符，需包含字母和数字
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "created_at": "2023-01-01T00:00:00Z"
    }
  }
}
```

**错误码**:
- `USER_EXISTS`: 用户名或邮箱已存在
- `INVALID_EMAIL`: 邮箱格式不正确
- `WEAK_PASSWORD`: 密码强度不够
- `INVALID_USERNAME`: 用户名格式不正确

### 2. 用户登录

**接口地址**: `POST /api/users/login`

**功能说明**: 用户登录获取访问令牌

**请求参数**:
```json
{
  "username": "string",     // 用户名或邮箱
  "password": "string",     // 密码
  "rememberMe": "boolean"   // 是否记住登录状态，可选，默认false
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "last_login": "2023-01-01T00:00:00Z"
    }
  }
}
```

**错误码**:
- `INVALID_CREDENTIALS`: 用户名或密码错误
- `USER_NOT_FOUND`: 用户不存在
- `ACCOUNT_LOCKED`: 账户被锁定

### 3. 获取用户信息

**接口地址**: `GET /api/users/profile`

**功能说明**: 获取当前登录用户的详细信息

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "bio": "AI艺术爱好者",
      "avatar": "https://example.com/avatar.jpg",
      "website": "https://mysite.com",
      "location": "北京，中国",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z",
      "last_login": "2023-01-01T00:00:00Z"
    }
  }
}
```

### 4. 更新用户信息

**接口地址**: `PUT /api/users/profile`

**功能说明**: 更新用户基本信息

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "username": "string",     // 用户名，可选
  "email": "string",        // 邮箱地址，可选
  "bio": "string",          // 个人简介，可选，最大200字符
  "website": "string",      // 个人网站，可选
  "location": "string"      // 所在地，可选
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "更新成功",
  "data": {
    "user": {
      "id": 1,
      "username": "newusername",
      "email": "newemail@example.com",
      "bio": "更新的个人简介",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  }
}
```

### 5. 修改密码

**接口地址**: `PUT /api/users/password`

**功能说明**: 修改用户密码

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "currentPassword": "string",  // 当前密码
  "newPassword": "string"       // 新密码，最少6个字符
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "密码修改成功"
}
```

**错误码**:
- `INVALID_PASSWORD`: 当前密码错误
- `WEAK_PASSWORD`: 新密码强度不够

### 6. 上传头像

**接口地址**: `POST /api/users/avatar`

**功能说明**: 上传用户头像

**请求头**:
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**请求参数**:
```
avatar: File  // 头像文件，支持jpg/png格式，最大2MB
```

**响应示例**:
```json
{
  "success": true,
  "message": "头像上传成功",
  "data": {
    "avatar_url": "https://example.com/avatars/user_1_avatar.jpg"
  }
}
```

## AIGC创作接口

### 1. 获取可用模型列表 (已实现)

**接口地址**: `GET /api/models`

**功能说明**: 从ComfyUI动态获取可用的AI模型列表，带有健壮的降级机制

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "message": "获取模型列表成功",
  "data": {
    "models": [
      {
        "label": "v1-5-pruned-emaonly-fp16",
        "value": "v1-5-pruned-emaonly-fp16.safetensors",
        "description": "v1-5-pruned-emaonly-fp16.safetensors - 来自ComfyUI"
      },
      {
        "label": "sd_xl_base_1.0",
        "value": "sd_xl_base_1.0.safetensors",
        "description": "sd_xl_base_1.0.safetensors - 来自ComfyUI"
      }
    ],
    "source": "comfyui"  // 数据来源: comfyui | default | fallback | error
  }
}
```

**降级机制**:
- ComfyUI可用时：返回实际可用模型列表
- ComfyUI不可用时：返回默认模型列表，确保前端正常工作
- 发生异常时：返回错误状态但仍提供默认模型

### 2. 创建生成任务 (已实现)

**接口地址**: `POST /api/generate`

**功能说明**: 提交AI图片生成任务

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数** (已简化)：
```json
{
  "prompt": "string",              // 正面提示词，必填，最大500字符
  "negativePrompt": "string",      // 负面提示词，可选，最大200字符，默认"blurry, bad quality, distorted, deformed"
  "model": "string",               // AI模型文件名，从/api/models获取
  "size": "string",                // 图片尺寸，默认"1024x1024"，支持512x512/768x512/512x768/1024x1024
  "batchSize": 1,                  // 生成数量，1-4，默认1
  "cfgScale": 7.5,                 // 创意程度，1-20，默认7.5
  "steps": 25,                     // 生成步数，10-50，默认25
  "seed": -1,                      // 随机种子，-1为随机
  "sampler": "string",             // 采样器，默认"dpmpp_2m_karras"，支持euler/ddim/dpmpp_sde_karras
  "clipSkip": 2                    // 剪辑跳过，1-2，默认2
}
```

**简化说明**:
- 移除了LoRA增强功能 (`lora` 参数)
- 移除了艺术风格选择 (`style` 参数)  
- 模型列表改为从ComfyUI动态获取，支持真实可用模型

**响应示例**:
```json
{
  "success": true,
  "message": "图片生成成功",
  "data": {
    "taskId": "task_1234567890",
    "images": [
      {
        "id": "img_1234567890_0",
        "url": "https://picsum.photos/512/512?random=1234567890",
        "seed": 123456,
        "config": {
          "prompt": "一只可爱的小猫",
          "model": "sd_xl_base",
          "size": "1024x1024"
        },
        "createdAt": "2024-01-01T00:00:00.000Z",
        "size": "1024x1024",
        "format": "png"
      }
    ],
    "config": {
      "prompt": "一只可爱的小猫",
      "negativePrompt": "blurry, low quality",
      "model": "sd_xl_base",
      "style": "realistic",
      "size": "1024x1024",
      "batchSize": 1,
      "cfgScale": 7.5,
      "steps": 25,
      "seed": 123456,
      "userId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "estimatedTime": 25,
      "cost": 15
    },
    "cost": 15,                    // 消耗积分
    "estimatedTime": 25,           // 预计用时（秒）
    "actualTime": 23,              // 实际用时（秒）
    "batchSize": 1
  }
}
```

**错误码**:
- `INVALID_PROMPT`: 提示词为空或超长
- `INVALID_BATCH_SIZE`: 批次大小超出范围
- `INVALID_CFG_SCALE`: CFG Scale超出范围
- `INVALID_STEPS`: 生成步数超出范围

### 3. 查询生成任务状态

**接口地址**: `GET /api/generate/{task_id}`

**功能说明**: 查询生成任务的进度和状态

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "task_id": "task_123456",
    "status": "completed",        // pending, processing, completed, failed
    "progress": 100,             // 进度百分比
    "images": [
      {
        "id": "img_123",
        "url": "https://example.com/images/generated_1.jpg",
        "thumbnail": "https://example.com/thumbnails/generated_1.jpg",
        "seed": 123456,
        "created_at": "2023-01-01T00:00:00Z"
      }
    ],
    "error": null                // 错误信息，仅在失败时有值
  }
}
```

## 作品管理接口

### 1. 获取用户作品列表

**接口地址**: `GET /api/works/my`

**功能说明**: 获取当前用户的所有作品

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:
```
page: number        // 页码，默认1
limit: number       // 每页数量，默认12
sort: string        // 排序方式: created, updated, likes, views
search: string      // 搜索关键词，可选
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "works": [
      {
        "id": 1,
        "title": "我的AI艺术作品",
        "description": "作品描述",
        "image_url": "https://example.com/works/work_1.jpg",
        "thumbnail_url": "https://example.com/thumbnails/work_1.jpg",
        "prompt": "生成提示词",
        "negative_prompt": "负面提示词",
        "params": {
          "model": "sd_xl_base",
          "width": 1024,
          "height": 1024,
          "cfg_scale": 7.5,
          "steps": 30
        },
        "tags": ["AI艺术", "风景"],
        "is_public": true,
        "views": 156,
        "likes": 23,
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_count": 58,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### 2. 获取公开作品画廊

**接口地址**: `GET /api/works/gallery`

**功能说明**: 获取所有公开的作品，用于画廊展示

**查询参数**:
```
page: number        // 页码，默认1
limit: number       // 每页数量，默认12
category: string    // 分类筛选，可选
sort: string        // 排序: latest, popular, rating, views
time_filter: string // 时间筛选: today, week, month
search: string      // 搜索关键词，可选
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "works": [
      {
        "id": 1,
        "title": "未来城市",
        "image_url": "https://example.com/works/work_1.jpg",
        "thumbnail_url": "https://example.com/thumbnails/work_1.jpg",
        "prompt": "A futuristic city...",
        "author": {
          "id": 1,
          "username": "creator1",
          "avatar": "https://example.com/avatars/user_1.jpg"
        },
        "category": "concept",
        "tags": ["科幻", "城市"],
        "views": 1234,
        "likes": 89,
        "comments_count": 12,
        "featured": true,
        "is_new": false,
        "created_at": "2023-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 10,
      "total_count": 120,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### 3. 更新作品信息

**接口地址**: `PUT /api/works/{work_id}`

**功能说明**: 更新作品的标题、描述等信息

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "title": "string",        // 作品标题，可选
  "description": "string",  // 作品描述，可选
  "tags": ["string"],       // 标签数组，可选
  "is_public": "boolean"    // 是否公开，可选
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "作品信息更新成功",
  "data": {
    "work": {
      "id": 1,
      "title": "更新的标题",
      "description": "更新的描述",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  }
}
```

### 4. 删除作品

**接口地址**: `DELETE /api/works/{work_id}`

**功能说明**: 删除用户的作品

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "message": "作品删除成功"
}
```

### 5. 点赞/取消点赞作品

**接口地址**: `POST /api/works/{work_id}/like`

**功能说明**: 点赞或取消点赞作品

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "is_liked": true,
    "likes_count": 90
  }
}
```

## 用户统计接口

### 1. 获取用户统计数据

**接口地址**: `GET /api/stats/user`

**功能说明**: 获取用户的统计信息

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "total_works": 23,
    "total_views": 1567,
    "total_likes": 234,
    "monthly_works": 8,
    "weekly_views": 456,
    "followers_count": 12,
    "following_count": 34
  }
}
```

## HTTP状态码说明

- `200 OK`: 请求成功
- `201 Created`: 资源创建成功
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未授权或token无效
- `403 Forbidden`: 权限不足
- `404 Not Found`: 资源不存在
- `409 Conflict`: 资源冲突（如用户名已存在）
- `422 Unprocessable Entity`: 请求参数验证失败
- `500 Internal Server Error`: 服务器内部错误

## 请求头说明

- `Content-Type: application/json`: 请求内容类型
- `Authorization: Bearer {token}`: 认证token，需要登录的接口必须包含

## 错误处理

所有接口在发生错误时都会返回统一的错误格式，前端应根据错误码和错误信息进行相应的处理。

## 配置文件

项目使用统一的配置文件管理API地址等配置信息：

### 配置文件位置
- 主配置：`/src/config/index.js`
- 环境变量：`.env.development`, `.env.production`, `.env.test`

### 配置项说明
```javascript
{
  API_BASE_URL: '/api',           // API基础地址
  API_TIMEOUT: 10000,             // 请求超时时间
  TOKEN_KEY: 'token',             // Token存储键名
  TOKEN_EXPIRE_TIME: 86400000,    // Token过期时间
  RETRY_COUNT: 3,                 // 请求重试次数
  UPLOAD_MAX_SIZE: 10485760       // 文件上传大小限制
}
```

## 业务逻辑说明

### AIGC创作工作流
1. **参数化配置**: 前端提供用户友好的参数配置界面，隐藏ComfyUI的复杂节点操作
2. **异步任务处理**: 图片生成为异步任务，通过task_id查询状态和进度
3. **成本计算**: 根据模型、尺寸、数量等参数计算积分消耗
4. **质量控制**: 提供多种采样器和参数组合，保证生成质量

### 作品管理
1. **版权保护**: 用户拥有其创作作品的完整权利
2. **隐私控制**: 支持公开/私有状态切换
3. **内容审核**: 公开作品需要通过内容审核机制
4. **存储优化**: 自动生成缩略图，优化加载速度

## 安全要求

### 认证与授权
- 所有敏感操作都需要有效的JWT Token
- Token过期后需要重新登录
- 实施角色权限控制（用户/管理员）

### 数据安全
- 用户密码使用bcrypt加密存储
- 敏感信息不在响应中返回
- 文件上传需要类型和大小验证
- 防止SQL注入和XSS攻击

### 频率限制
- 登录接口：每分钟最多5次尝试
- 注册接口：每小时最多3次
- 生成接口：普通用户每小时最多10次
- 其他接口：每分钟最多100次请求

## 错误处理规范

### 全局错误码
- `UNAUTHORIZED`: 未授权访问
- `FORBIDDEN`: 权限不足
- `NOT_FOUND`: 资源不存在
- `RATE_LIMITED`: 请求频率超限
- `SERVER_ERROR`: 服务器内部错误
- `MAINTENANCE`: 系统维护中

### 业务错误码
- `INSUFFICIENT_CREDITS`: 积分不足
- `INVALID_MODEL`: 无效的模型选择
- `GENERATION_FAILED`: 生成任务失败
- `CONTENT_VIOLATION`: 内容违规
- `DUPLICATE_TITLE`: 作品标题重复

## 版本管理

### API版本控制
- 当前版本: v1
- 向后兼容性保证
- 新版本API通过路径区分: `/api/v2/`

### 更新日志
- v1.0.0: 基础用户认证和作品管理
- v1.1.0: 新增AIGC创作接口
- v1.2.0: 新增统计和社交功能

## 注意事项

1. 所有时间字段均使用ISO 8601格式
2. Token有效期为24小时，如果设置了rememberMe则为30天
3. 密码传输前建议进行客户端加密
4. 敏感信息不会在响应中返回
5. 开发环境通过Vite代理解决跨域，生产环境需要后端配置CORS
6. 所有配置信息统一在config文件中管理，便于维护和部署
7. 图片文件采用CDN加速，提高访问速度
8. 支持图片懒加载和分页加载，优化用户体验
9. 实现图片水印和版权保护机制
10. 定期清理过期的临时文件和无效数据

## 前端集成说明

### Element Plus组件使用
- 统一使用Element Plus UI组件库
- 支持暗黑/明亮主题切换
- 响应式设计，兼容移动端

### 状态管理
- 使用Pinia进行状态管理
- 用户信息、作品数据等全局状态
- 支持持久化存储

### 配置管理
- 环境变量配置: `.env.development`, `.env.production`
- 统一配置文件: `src/config/index.js`
- 支持多环境部署

### 性能优化
- 路由懒加载
- 图片懒加载
- 组件按需引入
- 构建时代码分割