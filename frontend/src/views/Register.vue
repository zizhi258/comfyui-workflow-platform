<template>
  <div class="page-container">
    <div class="auth-card fade-in">
      <div class="auth-header">
        <el-icon class="auth-icon" size="48">
          <UserFilled />
        </el-icon>
        <h1 class="auth-title">创建账户</h1>
        <p class="auth-subtitle">加入AIGC创意工作流平台，开启智能创作之旅</p>
      </div>
      
      <el-form
        ref="registerFormRef"
        :model="form"
        :rules="rules"
        class="auth-form"
        @submit.prevent="handleRegister"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            size="large"
            clearable
          />
        </el-form-item>

        <el-form-item prop="email">
          <el-input
            v-model="form.email"
            type="email"
            placeholder="请输入邮箱地址"
            prefix-icon="Message"
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

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="form.agreeTerms" size="large">
            我已阅读并同意
            <el-link type="primary" :underline="false">用户协议</el-link>
            和
            <el-link type="primary" :underline="false">隐私政策</el-link>
          </el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="auth-submit-btn"
            :loading="userStore.isLoading"
            :disabled="!form.agreeTerms"
            @click="handleRegister"
          >
            <el-icon v-if="!userStore.isLoading">
              <Check />
            </el-icon>
            {{ userStore.isLoading ? '注册中...' : '创建账户' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="auth-links">
        已有账户？
        <router-link to="/login">
          <el-link type="primary" :underline="false">
            立即登录
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
import { UserFilled, Check } from '@element-plus/icons-vue'

export default {
  name: 'Register',
  components: {
    UserFilled,
    Check
  },
  setup() {
    const router = useRouter()
    const userStore = useUserStore()
    const registerFormRef = ref()
    
    const form = reactive({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false
    })
    
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== form.password) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }
    
    const rules = reactive({
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '用户名长度为3-20个字符', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '请输入邮箱地址', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '密码长度为6-20个字符', trigger: 'blur' },
        { pattern: /^(?=.*[a-zA-Z])(?=.*\d)/, message: '密码必须包含字母和数字', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '请确认密码', trigger: 'blur' },
        { validator: validateConfirmPassword, trigger: 'blur' }
      ]
    })

    const handleRegister = async () => {
      if (!registerFormRef.value) return
      
      if (!form.agreeTerms) {
        ElMessage.warning('请先同意用户协议和隐私政策')
        return
      }
      
      try {
        await registerFormRef.value.validate()
        
        const result = await userStore.register({
          username: form.username,
          email: form.email,
          password: form.password
        })

        if (result.success) {
          ElMessage.success({
            message: '注册成功！即将跳转到登录页面...',
            duration: 3000
          })
          setTimeout(() => {
            router.push('/login')
          }, 2000)
        } else {
          ElMessage.error(result.error || '注册失败')
        }
      } catch (error) {
        console.error('表单验证失败:', error)
      }
    }

    return {
      form,
      rules,
      userStore,
      registerFormRef,
      handleRegister
    }
  }
}
</script>

<style scoped>
.auth-icon {
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.auth-submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.auth-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>