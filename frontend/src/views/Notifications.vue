<template>
  <div class="notifications-page">
    <div class="notifications-container">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">
            <el-icon><Bell /></el-icon>
            消息通知
          </h1>
          <div class="header-actions">
            <el-button 
              type="primary" 
              @click="markAllAsRead"
              :disabled="unreadCount === 0"
            >
              <el-icon><Check /></el-icon>
              全部已读
            </el-button>
            <el-button @click="refreshNotifications">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
        
        <!-- 筛选和统计 -->
        <div class="filter-section">
          <el-row :gutter="16">
            <el-col :span="6">
              <el-select v-model="typeFilter" placeholder="通知类型" clearable @change="applyFilters">
                <el-option label="全部" value="" />
                <el-option label="系统通知" value="system" />
                <el-option label="点赞通知" value="like" />
                <el-option label="评论通知" value="comment" />
                <el-option label="关注通知" value="follow" />
                <el-option label="作品通知" value="work" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-col>
            <el-col :span="6">
              <el-select v-model="readFilter" placeholder="阅读状态" clearable @change="applyFilters">
                <el-option label="全部" value="" />
                <el-option label="未读" value="false" />
                <el-option label="已读" value="true" />
              </el-select>
            </el-col>
            <el-col :span="6">
              <el-select v-model="priorityFilter" placeholder="优先级" clearable @change="applyFilters">
                <el-option label="全部" value="" />
                <el-option label="紧急" value="urgent" />
                <el-option label="高" value="high" />
                <el-option label="普通" value="normal" />
                <el-option label="低" value="low" />
              </el-select>
            </el-col>
            <el-col :span="6">
              <div class="stats-info">
                <el-tag type="danger" v-if="unreadCount > 0">
                  {{ unreadCount }} 条未读
                </el-tag>
                <el-tag v-else>
                  全部已读
                </el-tag>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 通知列表 -->
      <div class="notifications-content">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <el-skeleton animated>
            <template #template>
              <div class="skeleton-list">
                <div v-for="i in 8" :key="i" class="skeleton-item">
                  <el-skeleton-item variant="circle" style="width: 40px; height: 40px;" />
                  <div style="flex: 1; margin-left: 16px;">
                    <el-skeleton-item variant="h3" style="width: 60%;" />
                    <el-skeleton-item variant="text" style="margin-top: 8px;" />
                    <el-skeleton-item variant="text" style="width: 30%; margin-top: 8px;" />
                  </div>
                </div>
              </div>
            </template>
          </el-skeleton>
        </div>

        <!-- 通知列表 -->
        <div v-else-if="notifications.length > 0" class="notifications-list">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="notification-item"
            :class="{ 'unread': !notification.isRead, 'urgent': notification.priority === 'urgent' }"
          >
            <!-- 通知图标 -->
            <div class="notification-icon">
              <el-icon :class="getNotificationIconClass(notification.type, notification.priority)">
                <component :is="getNotificationIcon(notification.type)" />
              </el-icon>
            </div>
            
            <!-- 通知内容 -->
            <div class="notification-content" @click="markAsRead(notification)">
              <div class="notification-header">
                <h4 class="notification-title">{{ notification.title }}</h4>
                <div class="notification-meta">
                  <el-tag 
                    :type="getPriorityTagType(notification.priority)" 
                    size="small"
                    v-if="notification.priority !== 'normal'"
                  >
                    {{ getPriorityText(notification.priority) }}
                  </el-tag>
                  <el-tag 
                    :type="getTypeTagType(notification.type)" 
                    size="small"
                  >
                    {{ getTypeText(notification.type) }}
                  </el-tag>
                  <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
                </div>
              </div>
              <p class="notification-text">{{ notification.content }}</p>
            </div>
            
            <!-- 操作按钮 -->
            <div class="notification-actions">
              <el-dropdown @command="handleNotificationAction">
                <el-button circle size="small" text>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item 
                      :command="{action: 'read', id: notification.id}" 
                      v-if="!notification.isRead"
                    >
                      <el-icon><Check /></el-icon>
                      标记已读
                    </el-dropdown-item>
                    <el-dropdown-item 
                      :command="{action: 'delete', id: notification.id}"
                      divided
                    >
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-notifications">
          <el-empty
            description="暂无通知"
            :image-size="150"
          >
            <p>您目前没有任何通知消息</p>
          </el-empty>
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="totalCount"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { notificationAPI } from '../utils/api'
import {
  Bell,
  Check,
  Refresh,
  MoreFilled,
  Delete,
  Warning,
  ChatDotRound,
  Star,
  User,
  Document,
  InfoFilled
} from '@element-plus/icons-vue'

export default {
  name: 'Notifications',
  components: {
    Bell,
    Check,
    Refresh,
    MoreFilled,
    Delete,
    Warning,
    ChatDotRound,
    Star,
    User,
    Document,
    InfoFilled
  },
  setup() {
    // 响应式数据
    const loading = ref(false)
    const notifications = ref([])
    const unreadCount = ref(0)
    const currentPage = ref(1)
    const pageSize = ref(20)
    const totalCount = ref(0)
    const totalPages = ref(0)
    
    // 筛选条件
    const typeFilter = ref('')
    const readFilter = ref('')
    const priorityFilter = ref('')

    // 方法
    const loadNotifications = async (isRefresh = false) => {
      loading.value = true
      try {
        const params = {
          page: isRefresh ? 1 : currentPage.value,
          limit: pageSize.value,
          type: typeFilter.value,
          isRead: readFilter.value,
          priority: priorityFilter.value
        }
        
        const response = await notificationAPI.getUserNotifications(params)
        
        if (response.success) {
          notifications.value = response.data.notifications
          unreadCount.value = response.data.unreadCount
          totalCount.value = response.data.pagination.totalCount
          totalPages.value = response.data.pagination.totalPages
          
          if (isRefresh) {
            currentPage.value = 1
          }
        } else {
          throw new Error(response.message || '加载失败')
        }
      } catch (error) {
        console.error('加载通知失败:', error)
        ElMessage.error('加载通知失败: ' + (error.message || '未知错误'))
      } finally {
        loading.value = false
      }
    }

    const markAsRead = async (notification) => {
      if (notification.isRead) return
      
      try {
        const response = await notificationAPI.markAsRead(notification.id)
        
        if (response.success) {
          notification.isRead = true
          unreadCount.value = Math.max(0, unreadCount.value - 1)
          // ElMessage.success('标记已读成功')
        }
      } catch (error) {
        console.error('标记已读失败:', error)
        ElMessage.error('标记已读失败')
      }
    }

    const markAllAsRead = async () => {
      try {
        await ElMessageBox.confirm(
          '确定要将所有未读通知标记为已读吗？',
          '批量操作',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
          }
        )
        
        const response = await notificationAPI.markBatchAsRead({ markAll: true })
        
        if (response.success) {
          notifications.value.forEach(notification => {
            notification.isRead = true
          })
          unreadCount.value = 0
          ElMessage.success(`成功标记 ${response.data.updatedCount} 个通知为已读`)
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('批量标记已读失败:', error)
          ElMessage.error('批量标记失败')
        }
      }
    }

    const handleNotificationAction = async (command) => {
      const { action, id } = command
      
      if (action === 'read') {
        const notification = notifications.value.find(n => n.id === id)
        if (notification) {
          await markAsRead(notification)
        }
      } else if (action === 'delete') {
        try {
          await ElMessageBox.confirm(
            '确定要删除这条通知吗？',
            '删除通知',
            {
              confirmButtonText: '删除',
              cancelButtonText: '取消',
              type: 'warning'
            }
          )
          
          const response = await notificationAPI.deleteNotification(id)
          
          if (response.success) {
            const index = notifications.value.findIndex(n => n.id === id)
            if (index !== -1) {
              const notification = notifications.value[index]
              if (!notification.isRead) {
                unreadCount.value = Math.max(0, unreadCount.value - 1)
              }
              notifications.value.splice(index, 1)
              totalCount.value--
            }
            ElMessage.success('删除成功')
          }
        } catch (error) {
          if (error !== 'cancel') {
            console.error('删除通知失败:', error)
            ElMessage.error('删除失败')
          }
        }
      }
    }

    const applyFilters = () => {
      currentPage.value = 1
      loadNotifications(true)
    }

    const refreshNotifications = () => {
      loadNotifications(true)
    }

    const handlePageChange = (page) => {
      currentPage.value = page
      loadNotifications()
    }

    const handleSizeChange = (size) => {
      pageSize.value = size
      currentPage.value = 1
      loadNotifications(true)
    }

    // 工具函数
    const getNotificationIcon = (type) => {
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

    const getNotificationIconClass = (type, priority) => {
      const baseClass = 'notification-icon-svg'
      const typeClass = `type-${type}`
      const priorityClass = priority === 'urgent' ? 'urgent' : priority === 'high' ? 'high' : ''
      return [baseClass, typeClass, priorityClass].filter(Boolean).join(' ')
    }

    const getPriorityTagType = (priority) => {
      const typeMap = {
        urgent: 'danger',
        high: 'warning',
        normal: '',
        low: 'info'
      }
      return typeMap[priority] || ''
    }

    const getPriorityText = (priority) => {
      const textMap = {
        urgent: '紧急',
        high: '重要',
        normal: '普通',
        low: '一般'
      }
      return textMap[priority] || '普通'
    }

    const getTypeTagType = (type) => {
      const typeMap = {
        system: 'primary',
        like: 'success',
        comment: 'warning',
        follow: 'info',
        work: '',
        other: ''
      }
      return typeMap[type] || ''
    }

    const getTypeText = (type) => {
      const textMap = {
        system: '系统',
        like: '点赞',
        comment: '评论',
        follow: '关注',
        work: '作品',
        other: '其他'
      }
      return textMap[type] || '其他'
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

    // 生命周期
    onMounted(() => {
      loadNotifications()
    })

    return {
      loading,
      notifications,
      unreadCount,
      currentPage,
      pageSize,
      totalCount,
      totalPages,
      typeFilter,
      readFilter,
      priorityFilter,
      loadNotifications,
      markAsRead,
      markAllAsRead,
      handleNotificationAction,
      applyFilters,
      refreshNotifications,
      handlePageChange,
      handleSizeChange,
      getNotificationIcon,
      getNotificationIconClass,
      getPriorityTagType,
      getPriorityText,
      getTypeTagType,
      getTypeText,
      formatTime
    }
  }
}
</script>

<style scoped>
.notifications-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.notifications-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* 页面头部 */
.page-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.filter-section .stats-info {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

/* 通知列表 */
.notifications-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-item {
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  border-radius: 8px;
  background: #f5f5f5;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 1.5rem;
  border-radius: 12px;
  background: white;
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
  cursor: pointer;
}

.notification-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.notification-item.unread {
  border-left: 4px solid var(--primary-color);
  background: #fafbff;
}

.notification-item.urgent {
  border-left-color: #f56565;
  background: #fff5f5;
}

.notification-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}

.notification-icon-svg {
  font-size: 20px;
}

.notification-icon-svg.type-system { color: #409eff; }
.notification-icon-svg.type-like { color: #67c23a; }
.notification-icon-svg.type-comment { color: #e6a23c; }
.notification-icon-svg.type-follow { color: #909399; }
.notification-icon-svg.type-work { color: #606266; }
.notification-icon-svg.urgent { color: #f56565; }
.notification-icon-svg.high { color: #e6a23c; }

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.notification-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.4;
}

.notification-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.notification-time {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.notification-text {
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

.notification-actions {
  flex-shrink: 0;
  margin-left: 1rem;
}

/* 分页 */
.pagination-wrapper {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

/* 空状态 */
.empty-notifications {
  text-align: center;
  padding: 3rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .notifications-page {
    padding: 1rem;
  }
  
  .page-header {
    padding: 1.5rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .page-title {
    font-size: 1.5rem;
    justify-content: center;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .notifications-content {
    padding: 1.5rem;
  }
  
  .notification-item {
    padding: 1rem;
  }
  
  .notification-header {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .notification-meta {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .filter-section .el-row .el-col {
    margin-bottom: 1rem;
  }
  
  .notification-item {
    flex-direction: column;
    gap: 1rem;
  }
  
  .notification-icon {
    align-self: flex-start;
    margin-right: 0;
  }
  
  .notification-actions {
    margin-left: 0;
    align-self: flex-end;
  }
}
</style>