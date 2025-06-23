<template>
  <div id="app">
    <el-container>
      <el-header class="navbar" height="70px">
        <div class="nav-content">
          <div class="nav-brand" @click="goHome">
            <el-icon class="brand-icon" size="32">
              <MagicStick />
            </el-icon>
            <h2>AIGC创意工作流平台</h2>
          </div>
          
          <!-- 已登录用户导航 -->
          <div v-if="userStore.isLoggedIn" class="nav-links">
            <!-- 桌面端菜单 -->
            <el-menu
              :default-active="activeIndex"
              mode="horizontal"
              class="nav-menu desktop-menu"
              @select="handleMenuSelect"
            >
              <el-menu-item index="/dashboard">
                <el-icon><House /></el-icon>
                <span>工作台</span>
              </el-menu-item>
              <el-menu-item index="/create">
                <el-icon><MagicStick /></el-icon>
                <span>创作</span>
              </el-menu-item>
              <el-menu-item index="/gallery">
                <el-icon><Picture /></el-icon>
                <span>画廊</span>
              </el-menu-item>
              <el-menu-item index="/my-works">
                <el-icon><Folder /></el-icon>
                <span>我的作品</span>
              </el-menu-item>
            </el-menu>
            
            <!-- 移动端菜单按钮 -->
            <el-button 
              class="mobile-menu-btn"
              circle
              @click="showMobileMenu = true"
            >
              <el-icon><Menu /></el-icon>
            </el-button>
            
            <el-dropdown @command="handleCommand" class="user-dropdown">
              <span class="user-info">
                <el-avatar :size="32" :src="userAvatar">
                  <el-icon><User /></el-icon>
                </el-avatar>
                <span class="username">{{ userStore.userName || '用户' }}</span>
                <el-icon class="arrow-down"><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>
                    个人资料
                  </el-dropdown-item>
                  <el-dropdown-item command="settings">
                    <el-icon><Setting /></el-icon>
                    设置
                  </el-dropdown-item>
                  <el-dropdown-item divided command="logout">
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          
          <!-- 未登录用户导航 -->
          <div v-else class="nav-links">
            <router-link to="/login" class="nav-link">
              <el-button type="primary" plain>登录</el-button>
            </router-link>
            <router-link to="/register" class="nav-link">
              <el-button type="primary">注册</el-button>
            </router-link>
          </div>
        </div>
      </el-header>
      
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
    
    <!-- 移动端抽屉菜单 -->
    <el-drawer
      v-model="showMobileMenu"
      title="导航菜单"
      direction="ltr"
      size="280px"
      class="mobile-nav-drawer"
    >
      <div class="mobile-menu-content">
        <div class="mobile-user-info">
          <el-avatar :size="48" :src="userAvatar">
            <el-icon><User /></el-icon>
          </el-avatar>
          <div class="mobile-user-details">
            <h4>{{ userStore.userName || '用户' }}</h4>
            <p>欢迎回来</p>
          </div>
        </div>
        
        <el-menu
          :default-active="activeIndex"
          class="mobile-menu"
          @select="handleMobileMenuSelect"
        >
          <el-menu-item index="/dashboard">
            <el-icon><House /></el-icon>
            <span>工作台</span>
          </el-menu-item>
          <el-menu-item index="/create">
            <el-icon><MagicStick /></el-icon>
            <span>创作</span>
          </el-menu-item>
          <el-menu-item index="/gallery">
            <el-icon><Picture /></el-icon>
            <span>画廊</span>
          </el-menu-item>
          <el-menu-item index="/my-works">
            <el-icon><Folder /></el-icon>
            <span>我的作品</span>
          </el-menu-item>
        </el-menu>
        
        <div class="mobile-menu-footer">
          <el-button @click="handleCommand('profile')" text>
            <el-icon><User /></el-icon>
            个人资料
          </el-button>
          <el-button @click="handleCommand('settings')" text>
            <el-icon><Setting /></el-icon>
            设置
          </el-button>
          <el-button @click="handleCommand('logout')" text type="danger">
            <el-icon><SwitchButton /></el-icon>
            退出登录
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { computed, watch, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from './stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  MagicStick,
  House,
  Picture,
  Folder,
  User,
  Setting,
  SwitchButton,
  ArrowDown,
  Menu
} from '@element-plus/icons-vue'

export default {
  name: 'App',
  components: {
    MagicStick,
    House,
    Picture,
    Folder,
    User,
    Setting,
    SwitchButton,
    ArrowDown,
    Menu
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const userStore = useUserStore()
    
    const showMobileMenu = ref(false)

    const activeIndex = computed(() => {
      return route.path
    })

    const userAvatar = computed(() => {
      // 可以从用户信息中获取头像URL
      return null // 暂时返回null，使用默认头像
    })

    const goHome = () => {
      if (userStore.isLoggedIn) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }

    const handleMenuSelect = (index) => {
      router.push(index)
    }
    
    const handleMobileMenuSelect = (index) => {
      router.push(index)
      showMobileMenu.value = false
    }

    const handleCommand = async (command) => {
      switch (command) {
        case 'profile':
          router.push('/profile')
          break
        case 'settings':
          ElMessage.info('设置功能开发中...')
          break
        case 'logout':
          try {
            await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning'
            })
            
            userStore.logout()
            ElMessage.success('已退出登录')
            router.push('/login')
            showMobileMenu.value = false
          } catch {
            // 用户取消操作
          }
          break
      }
    }

    // 监听路由变化，确保用户信息是最新的
    watch(() => route.path, () => {
      if (userStore.isLoggedIn && !userStore.user) {
        userStore.getProfile()
      }
    }, { immediate: true })

    return {
      userStore,
      activeIndex,
      userAvatar,
      showMobileMenu,
      goHome,
      handleMenuSelect,
      handleMobileMenuSelect,
      handleCommand
    }
  }
}
</script>

<style scoped>
.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: var(--shadow-sm);
  padding: 0;
}

.nav-content {
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.nav-brand:hover {
  opacity: 0.8;
}

.brand-icon {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  color: var(--primary-color);
}

.nav-brand h2 {
  margin: 0;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
  font-size: 1.5rem;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-link {
  text-decoration: none;
}

/* 导航菜单样式 */
.nav-menu {
  border-bottom: none;
  background: transparent;
}

.nav-menu .el-menu-item {
  border-bottom: 2px solid transparent;
  color: var(--text-primary);
  font-weight: 500;
  padding: 0 20px;
  margin: 0 5px;
  border-radius: 6px 6px 0 0;
  transition: all 0.3s ease;
}

.nav-menu .el-menu-item:hover {
  background-color: rgba(99, 102, 241, 0.1);
  color: var(--primary-color);
}

.nav-menu .el-menu-item.is-active {
  background-color: rgba(99, 102, 241, 0.1);
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.nav-menu .el-menu-item span {
  margin-left: 0.5rem;
}

/* 用户下拉菜单 */
.user-dropdown {
  margin-left: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-radius: 20px;
  transition: background-color 0.3s ease;
}

.user-info:hover {
  background-color: rgba(99, 102, 241, 0.1);
}

.username {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.9rem;
}

.arrow-down {
  color: var(--text-secondary);
  font-size: 12px;
  transition: transform 0.3s ease;
}

.user-dropdown.is-opened .arrow-down {
  transform: rotate(180deg);
}

.main-content {
  padding: 0;
  background: var(--bg-primary);
}

/* 移动端菜单按钮 */
.mobile-menu-btn {
  display: none;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .nav-menu .el-menu-item span {
    display: none;
  }
  
  .nav-menu .el-menu-item {
    padding: 0 15px;
  }
}

@media (max-width: 768px) {
  .nav-content {
    padding: 0 1rem;
  }
  
  .nav-brand h2 {
    font-size: 1.2rem;
  }
  
  .brand-icon {
    display: none;
  }
  
  .desktop-menu {
    display: none;
  }
  
  .mobile-menu-btn {
    display: flex;
  }
  
  .username {
    display: none;
  }
  
  .user-info {
    padding: 0.5rem;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .nav-brand h2 {
    font-size: 1rem;
  }
  
  .nav-links {
    gap: 0.5rem;
  }
  
  .nav-link .el-button {
    padding: 8px 12px;
    font-size: 0.9rem;
  }
}

/* Element Plus 组件样式覆盖 */
:deep(.el-dropdown-menu) {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
}

:deep(.el-dropdown-menu__item) {
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

:deep(.el-dropdown-menu__item:hover) {
  background-color: rgba(99, 102, 241, 0.1);
  color: var(--primary-color);
}

/* 移动端抽屉菜单样式 */
.mobile-nav-drawer :deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.mobile-nav-drawer :deep(.el-drawer__body) {
  padding: 0;
}

.mobile-menu-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.mobile-user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  color: white;
}

.mobile-user-details h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.mobile-user-details p {
  margin: 0.2rem 0 0 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.mobile-menu {
  flex: 1;
  border: none;
  background: transparent;
}

.mobile-menu .el-menu-item {
  height: 56px;
  line-height: 56px;
  padding: 0 1.5rem;
  margin: 0;
  border-radius: 0;
  font-size: 1rem;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.mobile-menu .el-menu-item:hover {
  background-color: rgba(99, 102, 241, 0.1);
  color: var(--primary-color);
}

.mobile-menu .el-menu-item.is-active {
  background-color: rgba(99, 102, 241, 0.1);
  color: var(--primary-color);
  border-right: 3px solid var(--primary-color);
}

.mobile-menu .el-menu-item span {
  margin-left: 1rem;
}

.mobile-menu-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mobile-menu-footer .el-button {
  justify-content: flex-start;
  width: 100%;
  height: 40px;
  padding: 0 1rem;
}

.mobile-menu-footer .el-button .el-icon {
  margin-right: 0.8rem;
}
</style>