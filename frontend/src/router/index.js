import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Dashboard from '../views/Dashboard.vue'
import Create from '../views/Create.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/create',
    name: 'Create',
    component: Create,
    meta: { requiresAuth: true }
  },
  {
    path: '/create/paint',
    name: 'CreatePaint',
    component: Create,
    meta: { requiresAuth: true }
  },
  {
    path: '/create/enhance',
    name: 'CreateEnhance',
    component: Create,
    meta: { requiresAuth: true }
  },
  {
    path: '/create/style-transfer',
    name: 'CreateStyleTransfer',
    component: Create,
    meta: { requiresAuth: true }
  },
  {
    path: '/create/batch',
    name: 'CreateBatch',
    component: Create,
    meta: { requiresAuth: true }
  },
  {
    path: '/gallery',
    name: 'Gallery',
    component: () => import('../views/Gallery.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my-works',
    name: 'MyWorks',
    component: () => import('../views/MyWorks.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const isLoggedIn = userStore.isLoggedIn

  // 需要登录的页面
  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/login')
    return
  }

  // 需要游客状态的页面（登录、注册）
  if (to.meta.requiresGuest && isLoggedIn) {
    next('/dashboard')
    return
  }

  next()
})

export default router