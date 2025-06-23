<template>
  <div class="page-container">
    <div class="auth-card fade-in">
      <div class="auth-header">
        <el-icon class="auth-icon" size="48">
          <Avatar />
        </el-icon>
        <h1 class="auth-title">欢迎回来</h1>
        <p class="auth-subtitle">登录您的AIGC创意工作流账户</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="form"
        :rules="rules"
        class="auth-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名或邮箱"
            prefix-icon="User"
            size="large"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item>
          <div class="form-options">
            <el-checkbox v-model="form.rememberMe">
              记住我
            </el-checkbox>
            <el-link type="primary" :underline="false">
              忘记密码？
            </el-link>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="auth-submit-btn"
            :loading="userStore.isLoading"
            @click="handleLogin"
          >
            <el-icon v-if="!userStore.isLoading">
              <Right />
            </el-icon>
            {{ userStore.isLoading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="auth-links">
        还没有账户？
        <router-link to="/register">
          <el-link type="primary" :underline="false">
            立即注册
          </el-link>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import { Avatar, Right } from '@element-plus/icons-vue'

export default {
  name: 'Login',
  components: {
    Avatar,
    Right
  },
  setup() {
    const router = useRouter()
    const userStore = useUserStore()
    const loginFormRef = ref()
    
    const form = reactive({
      username: '',
      password: '',
      rememberMe: false
    })
    
    const rules = reactive({
      username: [
        { required: true, message: '请输入用户名或邮箱', trigger: 'blur' },
        { min: 3, message: '用户名至少3个字符', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码至少6个字符', trigger: 'blur' }
      ]
    })

    const handleLogin = async () => {
      if (!loginFormRef.value) return
      
      try {
        await loginFormRef.value.validate()
        
        const result = await userStore.login({
          username: form.username,
          password: form.password,
          rememberMe: form.rememberMe
        })

        if (result.success) {
          ElMessage.success('登录成功！')
          setTimeout(() => {
            router.push('/dashboard')
          }, 1000)
        } else {
          ElMessage.error(result.error || '登录失败')
        }
      } catch (error) {
        console.error('表单验证失败:', error)
      }
    }

    return {
      form,
      rules,
      userStore,
      loginFormRef,
      handleLogin
    }
  }
}
</script>

<style scoped>
.auth-icon {
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.form-options {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.auth-submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
</style>