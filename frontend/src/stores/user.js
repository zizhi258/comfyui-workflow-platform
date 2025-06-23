import { defineStore } from 'pinia'
import { userAPI } from '../utils/api'
import { TOKEN_KEY } from '../config'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: localStorage.getItem(TOKEN_KEY) || null,
    isLoading: false,
    error: null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userName: (state) => state.user?.username || ''
  },

  actions: {
    async login(credentials) {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await userAPI.login(credentials)
        this.token = response.data.token
        this.user = response.data.user
        localStorage.setItem(TOKEN_KEY, response.data.token)
        return { success: true }
      } catch (error) {
        this.error = error.message || '登录失败'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    async register(userData) {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await userAPI.register(userData)
        return { success: true, message: response.message || '注册成功' }
      } catch (error) {
        this.error = error.message || '注册失败'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    async getProfile() {
      if (!this.token) return
      
      try {
        const response = await userAPI.getProfile()
        this.user = response.data.user
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    },

    logout() {
      this.user = null
      this.token = null
      this.error = null
      localStorage.removeItem(TOKEN_KEY)
    }
  }
})