# ComfyUI AIGC 创意工作流平台

> 一个基于 ComfyUI 的全栈 AI 艺术创作平台，让 AI 绘画变得简单易用

## 项目简介

这是一个面向普通用户的 AIGC 创作平台，将复杂的 ComfyUI 节点式操作封装为简单易用的参数化界面。用户只需输入创意描述和简单配置，即可生成高质量的 AI 艺术作品，并支持作品保存、分享和社区互动。

### 核心特性

- **简化创作**: 将 ComfyUI 复杂工作流封装为友好的 Web 界面
- **智能集成**: 动态获取可用模型和采样器，支持多种 AI 工作流
- **用户系统**: 完整的用户注册、登录、个人资料管理
- **作品管理**: 支持作品保存、展示、点赞、下载功能
- **社区画廊**: 公开作品展示，支持搜索、筛选、互动
- **响应式设计**: 适配桌面和移动端设备
- **实时反馈**: WebSocket 实时显示生成进度

## 🏗️ 系统架构

```
ComfyUI Platform
├── frontend/          # Vue 3 前端应用
├── rearend/           # Node.js 后端服务
├── database/          # MySQL 数据库
└── workflows/         # ComfyUI 工作流模板
```

## 🛠️ 技术栈

### 前端技术

- **Vue 3** + Composition API
- **Element Plus** - UI 组件库
- **Pinia** - 状态管理
- **Vue Router 4** - 路由管理
- **Vite** - 构建工具
- **Axios** - HTTP 客户端

### 后端技术

- **Node.js** + **Express** - 服务端框架
- **MySQL** + **Sequelize** - 数据库及 ORM
- **JWT** + **bcryptjs** - 身份认证与加密
- **Multer** + **Sharp** - 文件上传与图像处理
- **WebSocket** - 实时通信

### AI 集成

- **ComfyUI API** - AI 图像生成引擎
- **动态工作流** - 智能参数替换和模板管理

## 快速开始

### 环境要求

- Node.js 16+
- MySQL 8.0+
- ComfyUI (运行在 127.0.0.1:8188)

### 1. 克隆项目

```bash
git clone https://github.com/your-username/comfyui-platform.git
cd comfyui-platform
```

### 2. 安装依赖

**后端依赖**:

```bash
cd rearend
npm install
```

**前端依赖**:

```bash
cd frontend
npm install
```

### 3. 配置环境

创建后端环境配置文件 `rearend/.env`:

```env
# 数据库配置
DB_NAME=comfyui_platform
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
DB_DIALECT=mysql

# JWT配置
JWT_SECRET=your_jwt_secret_key

# ComfyUI配置
COMFYUI_URL=http://127.0.0.1:8188

# 基础URL
BASE_URL=http://localhost:8000

# 服务端口
PORT=8000
```

### 4. 初始化数据库

```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE comfyui_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 启动后端服务（自动同步数据库表）
cd rearend
npm run dev
```

### 5. 启动 ComfyUI 服务

```bash
# 在ComfyUI目录下启动
python main.py --listen 127.0.0.1 --port 8188
```

### 6. 启动应用

**启动后端服务**:

```bash
cd rearend
npm run dev
```

**启动前端服务**:

```bash
cd frontend
npm run dev
```

访问 http://localhost:3000 开始使用平台。

## 📖 使用指南

### 用户注册和登录

1. 访问平台首页
2. 点击"注册"创建账户
3. 使用邮箱和密码登录

### 创建 AI 艺术作品

1. 登录后进入"创作"页面
2. 输入创意描述（提示词）
3. 选择 AI 模型和生成参数
4. 点击"开始创作"等待生成
5. 预览结果并保存到画廊

### 浏览和互动

1. 访问"画廊"查看公开作品
2. 点赞、下载感兴趣的作品
3. 在"我的作品"中管理个人创作

## 🎯 核心功能

### AI 图像生成

- **文生图**: 根据文字描述生成图像
- **多模型支持**: 动态获取 ComfyUI 可用模型
- **参数调优**: 支持尺寸、步数、创意程度等配置
- **批量生成**: 一次生成多张图片
- **实时监控**: WebSocket 显示生成进度

### 作品管理

- **智能保存**: 临时文件自动管理和永久化存储
- **缩略图生成**: 自动生成优化的预览图
- **标签系统**: 支持作品分类和标签
- **隐私控制**: 公开/私有状态切换
- **批量操作**: 支持批量保存和管理

### 用户社区

- **个人主页**: 展示用户信息和作品
- **作品画廊**: 公开作品展示和发现
- **点赞系统**: 社区互动和作品评价
- **搜索筛选**: 多维度作品搜索和筛选

## 📁 项目结构

### 前端结构

```
frontend/
├── src/
│   ├── components/          # 通用组件
│   ├── views/              # 页面组件
│   │   ├── Create.vue      # 创作页面
│   │   ├── Gallery.vue     # 画廊页面
│   │   ├── Dashboard.vue   # 工作台
│   │   └── Profile.vue     # 个人资料
│   ├── stores/             # Pinia状态管理
│   ├── router/             # 路由配置
│   ├── utils/              # 工具函数
│   └── config/             # 配置文件
```

### 后端结构

```
rearend/
├── controllers/            # 控制器
│   ├── userController.js   # 用户管理
│   ├── generateController.js # AI生成
│   └── worksController.js  # 作品管理
├── models/                 # 数据模型

系统支持多种ComfyUI工作流，位于 `rearend/workflows/`:

>>>>>>> 065931b1d814bcf31442bb4482973c3cc594c45c
- `img2img_basic.json` - 图生图（功能还未实现）
- `upscale_basic.json` - 图像放大（功能还未实现）

详细配置请参考：[ComfyUI工作流配置指南](rearend/ComfyUI工作流配置指南.md)

### API接口文档
完整的API文档请查看：[API接口规范](frontend/API接口规范.md)

##  安全特性

- **JWT身份认证**: 安全的用户认证机制
- **密码加密**: bcrypt加密存储用户密码
- **文件验证**: 严格的文件类型和大小限制
- **权限控制**: 基于用户角色的访问控制
- **防重复点赞**: 数据库级别的重复操作防护
- **浏览量防刷**: 时间窗口限制机制

##  数据库设计

### 核心数据表

- **users**: 用户信息表
- **works**: 作品信息表
- **user_work_likes**: 用户点赞关联表
- **work_views**: 作品浏览记录表

##  开发日志

- **v1.0.0**: 基础用户系统和ComfyUI集成
- **v1.1.0**: 作品管理和点赞功能
- **v1.2.0**: 移动端适配和性能优化

##  许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

##  所涉及的开源项目

- [ComfyUI](https://github.com/comfyanonymous/ComfyUI) - 强大的AI图像生成工具
- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [Element Plus](https://element-plus.org/) - 优秀的Vue 3 UI组件库
- [Express.js](https://expressjs.com/) - 快速、开放、极简的Web框架

```
