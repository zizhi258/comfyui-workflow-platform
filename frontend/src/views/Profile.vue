<template>
  <div class="profile-page">
    <div class="profile-container">
      <!-- 用户信息卡片 -->
      <div class="user-card">
        <div class="user-header">
          <div class="avatar-section">
            <el-avatar :size="100" :src="userAvatar" class="user-avatar">
              <el-icon size="40"><User /></el-icon>
            </el-avatar>
            <el-button size="small" @click="showAvatarUpload = true">
              <el-icon><Camera /></el-icon>
              更换头像
            </el-button>
          </div>
          <div class="user-info">
            <h2 class="username">{{ userStore.user?.username || '用户' }}</h2>
            <p class="user-email">{{ userStore.user?.email }}</p>
            <p class="join-date">
              <el-icon><Calendar /></el-icon>
              加入时间：{{ formatDate(userStore.user?.created_at) }}
            </p>
            <div class="user-stats">
              <div class="stat-item">
                <el-skeleton-item v-if="loadingStats" variant="text" style="width: 60px; height: 24px;" />
                <span v-else class="stat-number">{{ userStats.totalWorks }}</span>
                <span class="stat-label">作品数</span>
              </div>
              <div class="stat-item">
                <el-skeleton-item v-if="loadingStats" variant="text" style="width: 60px; height: 24px;" />
                <span v-else class="stat-number">{{ userStats.totalLikes }}</span>
                <span class="stat-label">获赞数</span>
              </div>
              <div class="stat-item">
                <el-skeleton-item v-if="loadingStats" variant="text" style="width: 60px; height: 24px;" />
                <span v-else class="stat-number">{{ userStats.totalViews }}</span>
                <span class="stat-label">浏览量</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 设置选项卡 -->
      <div class="settings-section">
        <el-tabs v-model="activeTab" class="profile-tabs">
          <!-- 基本信息 -->
          <el-tab-pane label="基本信息" name="basic">
            <el-card class="setting-card">
              <template #header>
                <div class="card-header">
                  <span>个人信息</span>
                  <el-button type="primary" @click="editBasicInfo">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-button>
                </div>
              </template>
              
              <el-form :model="basicForm" :rules="basicRules" ref="basicFormRef" label-width="100px">
                <el-form-item label="用户名" prop="username">
                  <el-input
                    v-model="basicForm.username"
                    :disabled="!isEditingBasic"
                    placeholder="请输入用户名"
                  />
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                  <el-input
                    v-model="basicForm.email"
                    :disabled="!isEditingBasic"
                    placeholder="请输入邮箱"
                  />
                </el-form-item>
                <el-form-item label="个人简介">
                  <el-input
                    v-model="basicForm.bio"
                    :disabled="!isEditingBasic"
                    type="textarea"
                    :rows="3"
                    placeholder="介绍一下你自己..."
                    maxlength="200"
                    show-word-limit
                  />
                </el-form-item>
                <el-form-item label="个人网站">
                  <el-input
                    v-model="basicForm.website"
                    :disabled="!isEditingBasic"
                    placeholder="https://example.com"
                  />
                </el-form-item>
                <el-form-item label="所在地">
                  <el-input
                    v-model="basicForm.location"
                    :disabled="!isEditingBasic"
                    placeholder="城市，国家"
                  />
                </el-form-item>
                
                <el-form-item v-if="isEditingBasic">
                  <el-button type="primary" @click="saveBasicInfo">保存</el-button>
                  <el-button @click="cancelEditBasic">取消</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </el-tab-pane>

          <!-- 账户安全 -->
          <el-tab-pane label="账户安全" name="security">
            <el-card class="setting-card">
              <template #header>
                <span>修改密码</span>
              </template>
              
              <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
                <el-form-item label="当前密码" prop="currentPassword">
                  <el-input
                    v-model="passwordForm.currentPassword"
                    type="password"
                    placeholder="请输入当前密码"
                    show-password
                  />
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                  <el-input
                    v-model="passwordForm.newPassword"
                    type="password"
                    placeholder="请输入新密码"
                    show-password
                  />
                </el-form-item>
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    placeholder="请再次输入新密码"
                    show-password
                  />
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="changePassword">修改密码</el-button>
                </el-form-item>
              </el-form>
            </el-card>

            <el-card class="setting-card" style="margin-top: 1rem;">
              <template #header>
                <span>账户操作</span>
              </template>
              
              <div class="account-actions">
                <div class="action-item">
                  <div class="action-info">
                    <h4>导出数据</h4>
                    <p>下载你的所有作品和数据</p>
                  </div>
                  <el-button @click="exportData">导出</el-button>
                </div>
                
                <div class="action-item danger">
                  <div class="action-info">
                    <h4>删除账户</h4>
                    <p>永久删除你的账户和所有数据</p>
                  </div>
                  <el-button type="danger" @click="deleteAccount">删除账户</el-button>
                </div>
              </div>
            </el-card>
          </el-tab-pane>

          <!-- 隐私设置 -->
          <el-tab-pane label="隐私设置" name="privacy">
            <el-card class="setting-card">
              <template #header>
                <span>隐私设置</span>
              </template>
              
              <div class="privacy-settings">
                <div class="setting-item">
                  <div class="setting-info">
                    <h4>作品默认公开</h4>
                    <p>新创作的作品是否默认公开</p>
                  </div>
                  <el-switch v-model="privacySettings.defaultPublic" />
                </div>
                
                <div class="setting-item">
                  <div class="setting-info">
                    <h4>显示个人资料</h4>
                    <p>其他用户是否可以查看你的个人资料</p>
                  </div>
                  <el-switch v-model="privacySettings.profileVisible" />
                </div>
                
                <div class="setting-item">
                  <div class="setting-info">
                    <h4>显示在线状态</h4>
                    <p>其他用户是否可以看到你的在线状态</p>
                  </div>
                  <el-switch v-model="privacySettings.showOnlineStatus" />
                </div>
                
                <div class="setting-item">
                  <div class="setting-info">
                    <h4>接收邮件通知</h4>
                    <p>是否接收平台相关的邮件通知</p>
                  </div>
                  <el-switch v-model="privacySettings.emailNotifications" />
                </div>

                <el-button type="primary" @click="savePrivacySettings" style="margin-top: 1rem;">
                  保存设置
                </el-button>
              </div>
            </el-card>
          </el-tab-pane>

<<<<<<< HEAD
=======
          <!-- 通知设置 -->
          <el-tab-pane label="通知设置" name="notifications">
            <el-card class="setting-card">
              <template #header>
                <span>通知偏好</span>
              </template>
              
              <div class="notification-settings">
                <div class="setting-group">
                  <h4>邮件通知</h4>
                  <div class="setting-item">
                    <span>新的点赞和评论</span>
                    <el-switch v-model="notificationSettings.email.likes" />
                  </div>
                  <div class="setting-item">
                    <span>新的关注者</span>
                    <el-switch v-model="notificationSettings.email.followers" />
                  </div>
                  <div class="setting-item">
                    <span>系统公告</span>
                    <el-switch v-model="notificationSettings.email.announcements" />
                  </div>
                </div>
                
                <div class="setting-group">
                  <h4>站内通知</h4>
                  <div class="setting-item">
                    <span>新的点赞和评论</span>
                    <el-switch v-model="notificationSettings.push.likes" />
                  </div>
                  <div class="setting-item">
                    <span>新的关注者</span>
                    <el-switch v-model="notificationSettings.push.followers" />
                  </div>
                  <div class="setting-item">
                    <span>作品生成完成</span>
                    <el-switch v-model="notificationSettings.push.workComplete" />
                  </div>
                </div>

                <el-button type="primary" @click="saveNotificationSettings" style="margin-top: 1rem;">
                  保存设置
                </el-button>
              </div>
            </el-card>
          </el-tab-pane>
>>>>>>> b6cd7a7f157d5af40adb52a9e9ad251315e466cd
        </el-tabs>
      </div>
    </div>

    <!-- 头像上传对话框 -->
    <el-dialog v-model="showAvatarUpload" title="更换头像" width="400px" center>
      <div class="avatar-upload">
        <el-upload
          class="avatar-uploader"
          action="#"
          :show-file-list="false"
          :before-upload="beforeAvatarUpload"
          :http-request="uploadAvatar"
        >
          <img v-if="newAvatar" :src="newAvatar" class="avatar-preview" />
          <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
        </el-upload>
        <p class="upload-tip">支持 JPG、PNG 格式，文件大小不超过 2MB</p>
      </div>
      
      <template #footer>
        <el-button @click="showAvatarUpload = false">取消</el-button>
        <el-button type="primary" @click="saveAvatar" :disabled="!newAvatar">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useUserStore } from '../stores/user'
import { worksAPI } from '../utils/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  Camera,
  Calendar,
  Edit,
  Plus
} from '@element-plus/icons-vue'

export default {
  name: 'Profile',
  components: {
    User,
    Camera,
    Calendar,
    Edit,
    Plus
  },
  setup() {
    const userStore = useUserStore()
    
    // 响应式数据
    const activeTab = ref('basic')
    const showAvatarUpload = ref(false)
    const newAvatar = ref('')
    const isEditingBasic = ref(false)
    
    const basicFormRef = ref()
    const passwordFormRef = ref()

    // 用户统计
    const userStats = reactive({
      totalWorks: 0,
      totalLikes: 0,
      totalViews: 0
    })
    const loadingStats = ref(false)

    // 基本信息表单
    const basicForm = reactive({
      username: '',
      email: '',
      bio: '',
      website: '',
      location: ''
    })

    const originalBasicForm = reactive({})

    // 密码表单
    const passwordForm = reactive({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })

    // 隐私设置
    const privacySettings = reactive({
      defaultPublic: true,
      profileVisible: true,
      showOnlineStatus: true,
      emailNotifications: true
    })

<<<<<<< HEAD
=======
    // 通知设置
    const notificationSettings = reactive({
      email: {
        likes: true,
        followers: true,
        announcements: true
      },
      push: {
        likes: true,
        followers: true,
        workComplete: true
      }
    })
>>>>>>> b6cd7a7f157d5af40adb52a9e9ad251315e466cd

    // 表单验证规则
    const basicRules = reactive({
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '用户名长度为 3 到 20 个字符', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '请输入邮箱地址', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
      ]
    })

    const passwordRules = reactive({
      currentPassword: [
        { required: true, message: '请输入当前密码', trigger: 'blur' }
      ],
      newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '请确认新密码', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (value !== passwordForm.newPassword) {
              callback(new Error('两次输入的密码不一致'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ]
    })

    // 计算属性
    const userAvatar = computed(() => {
      return userStore.user?.avatar || null
    })

    // 获取用户统计数据
    const fetchUserStats = async () => {
      try {
        loadingStats.value = true
        const response = await worksAPI.getUserStats()
        
        if (response.success) {
          Object.assign(userStats, response.data)
        }
      } catch (error) {
        console.error('获取用户统计失败:', error)
        // 静默失败，不显示错误消息
      } finally {
        loadingStats.value = false
      }
    }

    // 方法
    const initializeUserData = () => {
      if (userStore.user) {
        Object.assign(basicForm, {
          username: userStore.user.username || '',
          email: userStore.user.email || '',
          bio: userStore.user.bio || '',
          website: userStore.user.website || '',
          location: userStore.user.location || ''
        })
        Object.assign(originalBasicForm, basicForm)
      }
      // 获取统计数据
      fetchUserStats()
    }

    const editBasicInfo = () => {
      isEditingBasic.value = true
    }

    const cancelEditBasic = () => {
      isEditingBasic.value = false
      Object.assign(basicForm, originalBasicForm)
    }

    const saveBasicInfo = async () => {
      if (!basicFormRef.value) return
      
      try {
        await basicFormRef.value.validate()
        
        // 这里应该调用API更新用户信息
        // await userStore.updateProfile(basicForm)
        
        Object.assign(originalBasicForm, basicForm)
        isEditingBasic.value = false
        ElMessage.success('个人信息更新成功')
      } catch (error) {
        console.error('Validation failed:', error)
      }
    }

    const changePassword = async () => {
      if (!passwordFormRef.value) return
      
      try {
        await passwordFormRef.value.validate()
        
        // 这里应该调用API修改密码
        // await userAPI.changePassword(passwordForm)
        
        ElMessage.success('密码修改成功')
        
        // 清空表单
        Object.keys(passwordForm).forEach(key => {
          passwordForm[key] = ''
        })
      } catch (error) {
        console.error('Password change failed:', error)
        ElMessage.error('密码修改失败')
      }
    }

    const savePrivacySettings = async () => {
      try {
        // 这里应该调用API保存隐私设置
        // await userAPI.updatePrivacySettings(privacySettings)
        
        ElMessage.success('隐私设置保存成功')
      } catch (error) {
        ElMessage.error('保存失败')
      }
    }

<<<<<<< HEAD
=======
    const saveNotificationSettings = async () => {
      try {
        // 这里应该调用API保存通知设置
        // await userAPI.updateNotificationSettings(notificationSettings)
        
        ElMessage.success('通知设置保存成功')
      } catch (error) {
        ElMessage.error('保存失败')
      }
    }
>>>>>>> b6cd7a7f157d5af40adb52a9e9ad251315e466cd

    const beforeAvatarUpload = (file) => {
      const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isJPG) {
        ElMessage.error('头像图片只能是 JPG/PNG 格式!')
        return false
      }
      if (!isLt2M) {
        ElMessage.error('头像图片大小不能超过 2MB!')
        return false
      }
      
      return true
    }

    const uploadAvatar = async (options) => {
      const file = options.file
      
      // 创建预览
      const reader = new FileReader()
      reader.onload = (e) => {
        newAvatar.value = e.target.result
      }
      reader.readAsDataURL(file)
    }

    const saveAvatar = async () => {
      try {
        // 这里应该调用API上传头像
        // await userAPI.uploadAvatar(newAvatar.value)
        
        ElMessage.success('头像更新成功')
        showAvatarUpload.value = false
        newAvatar.value = ''
      } catch (error) {
        ElMessage.error('头像上传失败')
      }
    }

    const exportData = async () => {
      try {
        ElMessage.info('正在准备数据导出...')
        // 这里应该调用API导出数据
        // await userAPI.exportUserData()
        
        setTimeout(() => {
          ElMessage.success('数据导出完成，请检查下载文件')
        }, 2000)
      } catch (error) {
        ElMessage.error('数据导出失败')
      }
    }

    const deleteAccount = async () => {
      try {
        await ElMessageBox.confirm(
          '删除账户将永久删除你的所有数据，此操作不可恢复。请输入 "DELETE" 确认删除：',
          '危险操作',
          {
            confirmButtonText: '确认删除',
            cancelButtonText: '取消',
            type: 'error',
            beforeClose: (action, instance, done) => {
              if (action === 'confirm') {
                instance.confirmButtonLoading = true
                instance.confirmButtonText = '删除中...'
                
                // 模拟删除操作
                setTimeout(() => {
                  instance.confirmButtonLoading = false
                  done()
                  ElMessage.success('账户已删除')
                  userStore.logout()
                }, 2000)
              } else {
                done()
              }
            }
          }
        )
      } catch {
        // 用户取消操作
      }
    }

    // 工具函数
    const formatDate = (dateString) => {
      if (!dateString) return ''
      return new Date(dateString).toLocaleDateString('zh-CN')
    }

    // 生命周期
    onMounted(() => {
      initializeUserData()
    })

    return {
      userStore,
      activeTab,
      showAvatarUpload,
      newAvatar,
      isEditingBasic,
      basicFormRef,
      passwordFormRef,
      userStats,
      loadingStats,
      basicForm,
      passwordForm,
      privacySettings,
<<<<<<< HEAD
=======
      notificationSettings,
>>>>>>> b6cd7a7f157d5af40adb52a9e9ad251315e466cd
      basicRules,
      passwordRules,
      userAvatar,
      editBasicInfo,
      cancelEditBasic,
      saveBasicInfo,
      changePassword,
      savePrivacySettings,
<<<<<<< HEAD
=======
      saveNotificationSettings,
>>>>>>> b6cd7a7f157d5af40adb52a9e9ad251315e466cd
      beforeAvatarUpload,
      uploadAvatar,
      saveAvatar,
      exportData,
      deleteAccount,
      formatDate
    }
  }
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.profile-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* 用户信息卡片 */
.user-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.user-header {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-info {
  flex: 1;
}

.username {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
}

.user-email {
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.join-date {
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.user-stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--primary-color);
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* 设置区域 */
.settings-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.profile-tabs :deep(.el-tabs__header) {
  margin-bottom: 2rem;
}

.profile-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: var(--border-color);
}

.setting-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 账户操作 */
.account-actions {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.action-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.action-item.danger {
  border-color: #fecaca;
  background-color: #fef2f2;
}

.action-info h4 {
  margin: 0 0 0.3rem 0;
  color: var(--text-primary);
}

.action-info p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* 隐私和通知设置 */
.privacy-settings,
.notification-settings {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info h4 {
  margin: 0 0 0.3rem 0;
  color: var(--text-primary);
}

.setting-info p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.setting-group {
  padding: 1rem 0;
}

.setting-group h4 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
}

/* 头像上传 */
.avatar-upload {
  text-align: center;
}

.avatar-uploader :deep(.el-upload) {
  border: 1px dashed var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
  width: 178px;
  height: 178px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-uploader :deep(.el-upload:hover) {
  border-color: var(--primary-color);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.avatar-preview {
  width: 178px;
  height: 178px;
  object-fit: cover;
}

.upload-tip {
  margin-top: 1rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-page {
    padding: 1rem;
  }
  
  .user-header {
    flex-direction: column;
    text-align: center;
  }
  
  .user-stats {
    justify-content: center;
  }
  
  .settings-section {
    padding: 1.5rem;
  }
  
  .action-item {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .username {
    font-size: 1.5rem;
  }
  
  .user-stats {
    flex-direction: column;
    gap: 1rem;
  }
  
  .profile-tabs :deep(.el-tabs__item) {
    padding: 0 10px;
    font-size: 0.9rem;
  }
}
</style>