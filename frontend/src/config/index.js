// 应用配置文件
const config = {
  // 从环境变量获取配置，优先使用环境变量，否则使用默认值
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  API_TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
  APP_TITLE: import.meta.env.VITE_APP_TITLE || '用户管理系统',
  
  // 通用配置
  TOKEN_KEY: 'token',
  TOKEN_EXPIRE_TIME: 24 * 60 * 60 * 1000, // 24小时
  REMEMBER_EXPIRE_TIME: 30 * 24 * 60 * 60 * 1000, // 30天
  
  // 请求重试配置
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000,
  
  // 文件上传配置
  UPLOAD_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  UPLOAD_ACCEPT: '.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx',
  
  // 分页配置
  PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
}

// 获取当前环境
const getEnv = () => {
  return import.meta.env.MODE || 'development'
}

// 导出当前环境的配置
const currentConfig = config

export default currentConfig

// 也可以单独导出各个配置项
export const {
  API_BASE_URL,
  API_TIMEOUT,
  TOKEN_KEY,
  TOKEN_EXPIRE_TIME,
  REMEMBER_EXPIRE_TIME
} = currentConfig