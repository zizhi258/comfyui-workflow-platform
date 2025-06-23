<template>
  <div class="notification-bell">
    <el-popover
      placement="bottom-end"
      width="350"
      trigger="click"
      :disabled="loading"
    >
      <template #reference>
        <el-badge 
          :value="unreadCount" 
          :hidden="unreadCount === 0" 
          :max="99"
          class="notification-badge"
        >
          <el-button circle text size="large" @click="loadRecentNotifications">
            <el-icon size="20">
              <Bell />
            </el-icon>
          </el-button>
        </el-badge>
      </template>

      <!-- 通知弹窗内容 -->
      <div class="notification-popup">
        <div class="popup-header">
          <h4>最近通知</h4>
          <div class="header-actions">
            <el-button 
              text 
              size="small" 
              @click="markAllAsRead"
              :disabled="unreadCount === 0"
            >
              全部已读
            </el-button>
            <el-button 
              text 
              size="small" 
              @click="goToNotifications"
            >
              查看全部
            </el-button>
          </div>
        </div>

        <!-- 通知列表 -->
        <div class="notifications-list" v-loading="loading">
          <div 
            v-for="notification in recentNotifications" 
            :key="notification.id"
            class="notification-item"
            :class="{ 'unread': !notification.isRead }"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-icon">
              <el-icon :class="getIconClass(notification.type, notification.priority)">
                <component :is="getIcon(notification.type)" />
              </el-icon>
            </div>
            <div class="notification-content">
              <p class="notification-title">{{ notification.title }}</p>
              <p class="notification-text">{{ truncateText(notification.content, 50) }}</p>
              <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="!loading && recentNotifications.length === 0" class="empty-state">
            <el-icon size="40" color="#ddd">
              <Bell />
            </el-icon>
            <p>暂无通知</p>
          </div>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { notificationAPI } from '../utils/api'
import {
  Bell,
  InfoFilled,
  Star,
  ChatDotRound,
  User,
  Document
} from '@element-plus/icons-vue'

export default {
  name: 'NotificationBell',
  components: {
    Bell,
    InfoFilled,
    Star,
    ChatDotRound,
    User,
    Document
  },
  setup() {
    const router = useRouter()
    
    // 响应式数据
    const loading = ref(false)
    const unreadCount = ref(0)
    const recentNotifications = ref([])
    
    let intervalId = null

    // 方法
    const loadUnreadCount = async () => {
      try {
        const response = await notificationAPI.getUnreadCount()
        if (response.success) {
          unreadCount.value = response.data.unreadCount
        }
      } catch (error) {
        console.error('获取未读数量失败:', error)
      }
    }

    const loadRecentNotifications = async () => {
      loading.value = true
      try {
        const response = await notificationAPI.getUserNotifications({
          page: 1,
          limit: 5,
          isRead: false
        })
        
        if (response.success) {
          recentNotifications.value = response.data.notifications
          unreadCount.value = response.data.unreadCount
        }
      } catch (error) {
        console.error('获取最近通知失败:', error)
      } finally {
        loading.value = false
      }
    }

    const markAllAsRead = async () => {
      try {
        const response = await notificationAPI.markBatchAsRead({ markAll: true })
        
        if (response.success) {
          recentNotifications.value.forEach(notification => {
            notification.isRead = true
          })
          unreadCount.value = 0
          ElMessage.success('全部标记为已读')
        }
      } catch (error) {
        console.error('批量标记已读失败:', error)
        ElMessage.error('操作失败')
      }
    }

    const handleNotificationClick = async (notification) => {
      // 标记为已读
      if (!notification.isRead) {
        try {
          await notificationAPI.markAsRead(notification.id)
          notification.isRead = true
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        } catch (error) {
          console.error('标记已读失败:', error)
        }
      }
      
      // 根据通知类型跳转到相应页面
      if (notification.relatedType === 'work' && notification.relatedId) {
        router.push(`/gallery?highlight=${notification.relatedId}`)
      } else {
        router.push('/notifications')
      }
    }

    const goToNotifications = () => {
      router.push('/notifications')
    }

    // 工具函数
    const getIcon = (type) => {
      const iconMap = {
        system: 'InfoFilled',
        like: 'Star',
        comment: 'ChatDotRound',
        follow: 'User',
        work: 'Document',
        other: 'Bell'
      }
      return iconMap[type] || 'Bell'
    }

    const getIconClass = (type, priority) => {
      const classes = ['notification-type-icon']
      classes.push(`type-${type}`)
      if (priority === 'urgent') classes.push('urgent')
      if (priority === 'high') classes.push('high')
      return classes.join(' ')
    }

    const formatTime = (time) => {
      const now = new Date()
      const notificationTime = new Date(time)
      const diff = now - notificationTime
      
      const minutes = Math.floor(diff / (1000 * 60))
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      if (minutes < 1) return '刚刚'
      if (minutes < 60) return `${minutes}分钟前`
      if (hours < 24) return `${hours}小时前`
      if (days < 7) return `${days}天前`
      
      return notificationTime.toLocaleDateString('zh-CN')
    }

    const truncateText = (text, maxLength) => {
      if (text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    }

    // 定期检查未读数量
    const startPolling = () => {
      loadUnreadCount() // 立即加载一次
      intervalId = setInterval(loadUnreadCount, 30000) // 每30秒检查一次
    }

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }

    // 生命周期
    onMounted(() => {
      startPolling()
    })

    onUnmounted(() => {
      stopPolling()
    })

    return {
      loading,
      unreadCount,
      recentNotifications,
      loadRecentNotifications,
      markAllAsRead,
      handleNotificationClick,
      goToNotifications,
      getIcon,
      getIconClass,
      formatTime,
      truncateText
    }
  }
}
</script>

<style scoped>
.notification-bell {
  position: relative;
}

.notification-badge :deep(.el-badge__content) {
  font-size: 10px;
  padding: 0 4px;
  height: 16px;
  line-height: 16px;
  border-radius: 8px;
}

.notification-popup {
  max-height: 400px;
  overflow: hidden;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.popup-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.notifications-list {
  max-height: 300px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: 8px;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.unread {
  background-color: #f0f9ff;
  border-left: 3px solid var(--primary-color);
}

.notification-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  background-color: #f5f7fa;
}

.notification-type-icon {
  font-size: 16px;
}

.notification-type-icon.type-system { color: #409eff; }
.notification-type-icon.type-like { color: #67c23a; }
.notification-type-icon.type-comment { color: #e6a23c; }
.notification-type-icon.type-follow { color: #909399; }
.notification-type-icon.type-work { color: #606266; }
.notification-type-icon.urgent { color: #f56565; }
.notification-type-icon.high { color: #e6a23c; }

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px 0;
  line-height: 1.3;
}

.notification-text {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0 0 4px 0;
  line-height: 1.3;
}

.notification-time {
  font-size: 11px;
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 24px 12px;
  color: var(--text-secondary);
}

.empty-state p {
  margin: 8px 0 0 0;
  font-size: 12px;
}

/* 滚动条样式 */
.notifications-list::-webkit-scrollbar {
  width: 4px;
}

.notifications-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.notifications-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.notifications-list::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>