import axios from 'axios'
import config, { API_BASE_URL, API_TIMEOUT, TOKEN_KEY } from '../config'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data || error.message)
  }
)

export const userAPI = {
  login: (data) => api.post('/users/login', data),
  register: (data) => api.post('/users/register', data),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data)
}

// AIGC生成相关API
export const generateAPI = {
  // 生成图片 - 使用更长的超时时间
  generateImage: (data) => api.post('/generate', data, { timeout: 120000 }), // 2分钟超时
  // 获取生成状态
  getGenerationStatus: (taskId) => api.get(`/generate/status/${taskId}`),
  // 获取可用模型列表
  getAvailableModels: () => api.get('/models'),
  // 获取可用采样器列表
  getAvailableSamplers: () => api.get('/models/samplers')
}

// 作品管理相关API
export const worksAPI = {
  // 保存作品到画廊
  saveWork: (data) => api.post('/works/save', data),
  // 获取用户作品列表
  getUserWorks: (params) => api.get('/works/my', { params }),
  // 获取公开画廊
  getPublicGallery: (params) => api.get('/works/gallery', { params }),
  // 获取作品详情
  getWorkById: (id) => api.get(`/works/${id}`),
  // 更新作品信息
  updateWork: (id, data) => api.put(`/works/${id}`, data),
  // 删除作品
  deleteWork: (id) => api.delete(`/works/${id}`),
  // 点赞/取消点赞作品
  toggleWorkLike: (id) => api.post(`/works/${id}/like`),
  // 增加作品浏览量
  incrementWorkView: (id) => api.post(`/works/${id}/view`),
  // 获取用户统计信息
  getUserStats: () => api.get('/works/stats')
}

// 积分系统API
export const creditAPI = {
  // 获取积分余额
  getCredits: () => api.get('/users/credits'),
  
  // 获取积分统计
  getCreditStats: () => api.get('/users/credits/stats'),
  
  // 获取积分交易记录
  getTransactions: (params = {}) => api.get('/users/credits/transactions', { params })
}

export default api