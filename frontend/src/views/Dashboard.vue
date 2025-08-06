<template>
  <div class="dashboard">
    <!-- 欢迎横幅区域 -->
    <section class="welcome-banner">
      <div class="banner-content">
        <div class="welcome-text">
          <h1 class="welcome-title">
            欢迎回来，{{ userStore.userName || "创作者" }}！
          </h1>
          <p class="welcome-subtitle">
            在创想引擎中释放你的创意，用AI重新定义视觉创作
          </p>
        </div>
        <div class="quick-actions">
          <el-button
            type="primary"
            size="large"
            @click="startCreating"
            class="create-btn"
          >
            <el-icon><MagicStick /></el-icon>
            开始创作
          </el-button>
          <el-button
            type="info"
            size="large"
            plain
            @click="viewGallery"
            class="gallery-btn"
          >
            <el-icon><Picture /></el-icon>
            作品画廊
          </el-button>
        </div>
      </div>
      <div class="banner-decoration">
        <div class="floating-icon icon-1">
          <el-icon size="24"><Cpu /></el-icon>
        </div>
        <div class="floating-icon icon-2">
          <el-icon size="32"><MagicStick /></el-icon>
        </div>
        <div class="floating-icon icon-3">
          <el-icon size="20"><Picture /></el-icon>
        </div>
      </div>
    </section>

    <!-- 功能卡片区域 -->
    <section class="features-section">
      <h2 class="section-title">探索创意工具</h2>
      <div class="features-grid">
        <el-card
          v-for="feature in features"
          :key="feature.id"
          class="feature-card"
          shadow="hover"
          @click="navigateToFeature(feature.route)"
        >
          <div class="feature-icon">
            <el-icon :size="48">
              <component :is="feature.icon" />
            </el-icon>
          </div>
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-description">{{ feature.description }}</p>
          <div class="feature-tags">
            <el-tag
              v-for="tag in feature.tags"
              :key="tag"
              size="small"
              effect="light"
              class="feature-tag"
            >
              {{ tag }}
            </el-tag>
          </div>
        </el-card>
      </div>
    </section>

    <!-- 最近作品区域 -->
    <section class="recent-works-section">
      <div class="section-header">
        <h2 class="section-title">最近的创作</h2>
        <el-button text type="primary" @click="viewAllWorks">
          查看全部 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="works-grid">
        <!-- 加载状态 -->
        <div v-if="loadingRecentWorks" class="loading-works">
          <el-skeleton animated>
            <template #template>
              <div class="skeleton-works">
                <div v-for="i in 6" :key="i" class="skeleton-work-item">
                  <el-skeleton-item
                    variant="image"
                    style="height: 200px; border-radius: 8px"
                  />
                  <div style="padding: 1rem 0">
                    <el-skeleton-item variant="h3" style="width: 60%" />
                    <el-skeleton-item
                      variant="text"
                      style="width: 40%; margin-top: 0.5rem"
                    />
                  </div>
                </div>
              </div>
            </template>
          </el-skeleton>
        </div>

        <!-- 作品列表 -->
        <div
          v-else-if="recentWorks.length > 0"
          v-for="work in recentWorks"
          :key="work.id"
          class="work-item"
        >
          <div class="work-image">
            <img
              :src="work.thumbnail"
              :alt="work.title"
              @error="handleImageError"
            />
            <div class="work-overlay">
              <el-button circle type="primary">
                <el-icon><View /></el-icon>
              </el-button>
            </div>
          </div>
          <div class="work-info">
            <h4 class="work-title">{{ work.title }}</h4>
            <p class="work-time">{{ formatTime(work.createdAt) }}</p>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="recentWorks.length === 0" class="empty-works">
          <el-empty description="还没有创作作品" :image-size="120">
            <el-button type="primary" @click="startCreating">
              开始第一个创作
            </el-button>
          </el-empty>
        </div>
      </div>
    </section>

    <!-- 统计信息区域 -->
    <section class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon size="32" color="#6366f1"><Picture /></el-icon>
          </div>
          <div class="stat-content">
            <h3 class="stat-number">{{ stats.totalWorks }}</h3>
            <p class="stat-label">创作作品</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon size="32" color="#10b981"><Timer /></el-icon>
          </div>
          <div class="stat-content">
            <h3 class="stat-number">{{ stats.timesSaved }}</h3>
            <p class="stat-label">节省时间 (小时)</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon size="32" color="#f59e0b"><Star /></el-icon>
          </div>
          <div class="stat-content">
            <h3 class="stat-number">{{ stats.satisfaction }}%</h3>
            <p class="stat-label">满意度</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon size="32" color="#ef4444"><TrendCharts /></el-icon>
          </div>
          <div class="stat-content">
            <h3 class="stat-number">{{ stats.improvement }}%</h3>
            <p class="stat-label">效率提升</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../stores/user";
import { worksAPI } from "../utils/api";
import { getFullImageUrl, handleImageError } from "../utils/imageUtils";
import { ElMessage } from "element-plus";
import {
  MagicStick,
  Picture,
  Cpu,
  ArrowRight,
  View,
  Timer,
  Star,
  TrendCharts,
  Brush,
  Camera,
  DocumentCopy,
  Setting,
} from "@element-plus/icons-vue";

export default {
  name: "Dashboard",
  components: {
    MagicStick,
    Picture,
    Cpu,
    ArrowRight,
    View,
    Timer,
    Star,
    TrendCharts,
    Brush,
    Camera,
    DocumentCopy,
    Setting,
  },
  setup() {
    const router = useRouter();
    const userStore = useUserStore();

    // 功能卡片数据
    const features = ref([
      {
        id: 1,
        title: "AI绘画生成",
        description: "通过文字描述生成高质量AI艺术作品，支持多种艺术风格",
        icon: "Brush",
        route: "/create/paint",
        tags: ["文生图", "艺术风格", "高清输出"],
      },
      {
        id: 2,
        title: "图像增强",
        description: "一键提升图片分辨率和质量，让模糊图片重获新生",
        icon: "Picture",
        route: "/create/enhance",
        tags: ["超分辨率", "去噪", "细节恢复"],
      },
      {
        id: 3,
        title: "风格转换",
        description: "将普通照片转换为各种艺术风格，如油画、素描等",
        icon: "Camera",
        route: "/create/style-transfer",
        tags: ["风格迁移", "艺术化", "个性定制"],
      },
      {
        id: 4,
        title: "批量处理",
        description: "批量处理多张图片，提高工作效率",
        icon: "DocumentCopy",
        route: "/create/batch",
        tags: ["批量操作", "效率工具", "自动化"],
      },
    ]);

    // 最近作品数据
    const recentWorks = ref([]);
    const loadingRecentWorks = ref(false);

    // 统计数据
    const stats = reactive({
      totalWorks: 23,
      timesSaved: 156,
      satisfaction: 95,
      improvement: 78,
    });

    // 方法
    const startCreating = () => {
      router.push("/create");
    };

    const viewGallery = () => {
      router.push("/gallery");
    };

    const navigateToFeature = (route) => {
      router.push(route);
    };

    const viewAllWorks = () => {
      router.push("/my-works");
    };

    const formatTime = (time) => {
      return new Date(time).toLocaleDateString("zh-CN");
    };

    // 获取最近作品
    const fetchRecentWorks = async () => {
      try {
        loadingRecentWorks.value = true;
        const response = await worksAPI.getUserWorks({
          page: 1,
          limit: 6,
          sort: "created_at",
          order: "DESC",
        });

        if (response.success) {
          recentWorks.value = response.data.works.map((work) => ({
            id: work.id,
            title: work.title,
            thumbnail: getFullImageUrl(work.thumbnailUrl || work.imageUrl),
            image: getFullImageUrl(work.imageUrl),
            createdAt: work.createdAt,
            views: work.views,
            likes: work.likes,
            isPublic: work.isPublic,
          }));

          // 更新统计数据
          stats.totalWorks = response.data.pagination?.totalCount || 0;
        }
      } catch (error) {
        console.error("获取最近作品失败:", error);
        // 静默失败，不显示错误消息，避免影响用户体验
      } finally {
        loadingRecentWorks.value = false;
      }
    };

    // 获取用户数据
    const fetchUserData = async () => {
      try {
        await userStore.getProfile();
      } catch (error) {
        console.error("获取用户信息失败:", error);
      }
    };

    onMounted(() => {
      fetchUserData();
      fetchRecentWorks();
    });

    return {
      userStore,
      features,
      recentWorks,
      loadingRecentWorks,
      stats,
      startCreating,
      viewGallery,
      navigateToFeature,
      viewAllWorks,
      fetchRecentWorks,
      formatTime,
      getFullImageUrl,
      handleImageError,
    };
  },
};
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 2rem;
}

/* 欢迎横幅 */
.welcome-banner {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl);
  padding: 3rem;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  transition: all var(--transition-slow);
}

.welcome-banner:hover {
  box-shadow: var(--shadow-xl);
  transform: translateY(-2px);
}

.banner-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 2;
  position: relative;
}

.welcome-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  letter-spacing: -0.025em;
}

.welcome-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 0;
  line-height: 1.5;
}

.quick-actions {
  display: flex;
  gap: 1rem;
}

.create-btn,
.gallery-btn {
  padding: 12px 24px;
  border-radius: var(--radius-lg);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all var(--transition-normal);
}

.create-btn:hover,
.gallery-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* 浮动装饰 */
.banner-decoration {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.floating-icon {
  position: absolute;
  color: var(--primary-color);
  opacity: 0.1;
  animation: float 6s ease-in-out infinite;
}

.icon-1 {
  top: 20%;
  right: 15%;
  animation-delay: 0s;
}
.icon-2 {
  top: 60%;
  right: 8%;
  animation-delay: 2s;
}
.icon-3 {
  top: 40%;
  right: 25%;
  animation-delay: 4s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* 功能卡片区域 */
.features-section {
  margin-bottom: 3rem;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  text-align: center;
  letter-spacing: -0.025em;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl);
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-slow);
  box-shadow: var(--shadow-sm);
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl);
  border-color: var(--primary-color);
}

.feature-icon {
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.feature-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 0.8rem;
  color: var(--text-primary);
  letter-spacing: -0.025em;
}

.feature-description {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.feature-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

.feature-tag {
  border-radius: var(--radius-lg);
}

/* 最近作品区域 */
.recent-works-section {
  margin-bottom: 3rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.work-item {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-sm);
}

.work-item:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.work-image {
  position: relative;
  height: 150px;
  overflow: hidden;
}

.work-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.work-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.work-item:hover .work-overlay {
  opacity: 1;
}

.work-info {
  padding: 1rem;
}

.work-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.work-time {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.empty-works {
  grid-column: 1 / -1;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: 2rem;
  box-shadow: var(--shadow-sm);
}

/* 统计信息区域 */
.stats-section {
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-sm);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.2rem;
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* 骨架屏样式 */
.skeleton-works {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.skeleton-work-item {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
  padding: 0 0 1rem 0;
  box-shadow: var(--shadow-sm);
}

/* 空状态样式 */
.empty-works {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem 1rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }

  .welcome-banner {
    padding: 2rem;
  }

  .banner-content {
    flex-direction: column;
    text-align: center;
    gap: 2rem;
  }

  .welcome-title {
    font-size: 2rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions {
    flex-direction: column;
    width: 100%;
  }

  .create-btn,
  .gallery-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
