/**
 * WebSocket工具类 - 用于实时接收生图进度
 */

class ProgressWebSocket {
  constructor() {
    this.ws = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 2000
    this.progressCallbacks = new Map()
  }

  /**
   * 连接WebSocket服务器
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        // 根据当前页面协议自动选择ws或wss
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const host = window.location.hostname
        const port = '8000' // 后端API端口
        
        const wsUrl = `${protocol}//${host}:${port}`
        console.log('🔗 尝试连接WebSocket:', wsUrl)
        
        this.ws = new WebSocket(wsUrl)
        
        this.ws.onopen = () => {
          console.log('✅ WebSocket连接已建立')
          this.isConnected = true
          this.reconnectAttempts = 0
          
          // 发送连接测试消息
          this.ws.send(JSON.stringify({
            type: 'ping',
            message: 'WebSocket连接测试'
          }))
          
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.ws.onclose = () => {
          console.log('❌ WebSocket连接已断开')
          this.isConnected = false
          this.handleReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket连接错误:', error)
          this.isConnected = false
          reject(error)
        }

      } catch (error) {
        console.error('❌ WebSocket初始化失败:', error)
        reject(error)
      }
    })
  }

  /**
   * 处理收到的消息
   */
  handleMessage(data) {
    try {
      const message = JSON.parse(data)
      console.log('📨 收到WebSocket消息:', message)

      switch (message.type) {
        case 'subscribed':
          console.log(`✅ 已订阅任务进度: ${message.taskId}`)
          break
          
        case 'progress':
          this.handleProgressUpdate(message)
          break
          
        case 'completed':
          this.handleTaskComplete(message)
          break
          
        case 'error':
          this.handleTaskError(message)
          break
          
        default:
          console.log('🔄 未知消息类型:', message.type)
      }
    } catch (error) {
      console.error('❌ 解析WebSocket消息失败:', error)
    }
  }

  /**
   * 处理进度更新
   */
  handleProgressUpdate(message) {
    const { taskId, data } = message
    console.log(`🎯 处理进度更新 - taskId: ${taskId}, 数据:`, data)
    
    if (this.progressCallbacks.has(taskId)) {
      const callback = this.progressCallbacks.get(taskId)
      console.log(`✅ 找到回调函数，执行进度更新: ${data.percent}%`)
      
      callback({
        percent: data.percent,
        step: data.step,
        totalSteps: data.totalSteps,
        node: data.node,
        title: data.title,
        timestamp: message.timestamp,
        completed: data.completed
      })
    } else {
      console.warn(`❌ 未找到taskId的回调函数: ${taskId}`)
      console.log(`🔍 当前注册的回调:`, Array.from(this.progressCallbacks.keys()))
    }
  }

  /**
   * 处理任务完成
   */
  handleTaskComplete(message) {
    const { taskId } = message
    console.log(`✅ 任务完成: ${taskId}`)
    
    if (this.progressCallbacks.has(taskId)) {
      const callback = this.progressCallbacks.get(taskId)
      callback({ percent: 100, completed: true })
      this.progressCallbacks.delete(taskId)
    }
  }

  /**
   * 处理任务错误
   */
  handleTaskError(message) {
    const { taskId, error } = message
    console.error(`❌ 任务错误: ${taskId}`, error)
    
    if (this.progressCallbacks.has(taskId)) {
      const callback = this.progressCallbacks.get(taskId)
      callback({ error: error, failed: true })
      this.progressCallbacks.delete(taskId)
    }
  }

  /**
   * 订阅任务进度
   */
  subscribeProgress(taskId, callback) {
    if (!this.isConnected) {
      console.warn('❌ WebSocket未连接，无法订阅进度')
      return false
    }

    this.progressCallbacks.set(taskId, callback)
    
    const subscribeMessage = {
      type: 'subscribe',
      taskId: taskId
    }
    
    this.ws.send(JSON.stringify(subscribeMessage))
    console.log(`🔔 订阅任务进度: ${taskId}`)
    
    return true
  }

  /**
   * 取消订阅
   */
  unsubscribeProgress(taskId) {
    this.progressCallbacks.delete(taskId)
    console.log(`🔕 取消订阅任务: ${taskId}`)
  }

  /**
   * 处理重连
   */
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`🔄 尝试重连WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error(`❌ 重连失败 (${this.reconnectAttempts}):`, error)
        })
      }, this.reconnectDelay)
    } else {
      console.error('❌ WebSocket重连次数超限，停止重连')
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
      this.isConnected = false
      this.progressCallbacks.clear()
      console.log('📴 WebSocket已断开')
    }
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: this.ws ? this.ws.readyState : WebSocket.CLOSED,
      reconnectAttempts: this.reconnectAttempts
    }
  }
}

// 创建全局实例
const progressWS = new ProgressWebSocket()

export default progressWS