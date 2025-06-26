<template>
  <div class="gallery-page">
    <div class="gallery-container">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">
            <el-icon><Picture /></el-icon>
            创意画廊
          </h1>
          <p class="page-subtitle">发现来自全球创作者的精彩AI艺术作品</p>
        </div>
        
        <!-- 筛选和搜索 -->
        <div class="filter-section">
          <el-row :gutter="16">
            <el-col :span="8">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索作品..."
                prefix-icon="Search"
                clearable
                @input="handleSearch"
              />
            </el-col>
            <el-col :span="4">
              <el-select v-model="categoryFilter" placeholder="分类" clearable @change="applyFilters">
                <el-option label="全部" value="" />
                <el-option label="真实摄影" value="realistic" />
                <el-option label="动漫插画" value="anime" />
                <el-option label="艺术绘画" value="artistic" />
                <el-option label="概念设计" value="concept" />
                <el-option label="风景" value="landscape" />
                <el-option label="人物" value="portrait" />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-select v-model="sortBy" placeholder="排序" @change="applyFilters">
                <el-option label="最新" value="latest" />
                <el-option label="最热" value="popular" />
                <el-option label="评分最高" value="rating" />
                <el-option label="浏览最多" value="views" />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-select v-model="timeFilter" placeholder="时间" clearable @change="applyFilters">
                <el-option label="今天" value="today" />
                <el-option label="本周" value="week" />
                <el-option label="本月" value="month" />
                <el-option label="全部时间" value="" />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-button type="primary" @click="refreshGallery">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 作品展示区域 -->
      <div class="gallery-content">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <el-skeleton animated>
            <template #template>
              <div class="skeleton-grid">
                <div v-for="i in 12" :key="i" class="skeleton-item">
                  <el-skeleton-item variant="image" style="height: 200px;" />
                  <div style="padding: 14px;">
                    <el-skeleton-item variant="h3" style="width: 50%;" />
                    <div style="margin-top: 10px;">
                      <el-skeleton-item variant="text" style="margin-right: 16px;" />
                      <el-skeleton-item variant="text" style="width: 30%;" />
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </el-skeleton>
        </div>

        <!-- 作品网格 -->
        <div v-else-if="galleryWorks.length > 0" class="works-grid">
          <div
            v-for="work in galleryWorks"
            :key="work.id"
            class="work-card"
            @click="openWorkDetail(work)"
          >
            <div class="work-image">
              <img 
                :src="work.image" 
                :alt="work.title" 
                @error="handleImageError"
              />
              <div class="work-overlay">
                <div class="overlay-content">
                  <el-button circle type="primary" @click.stop="likeWork(work)">
                    <el-icon><StarFilled v-if="work.isLiked" /><Star v-else /></el-icon>
                  </el-button>
                  <el-button circle @click.stop="shareWork(work)">
                    <el-icon><Share /></el-icon>
                  </el-button>
                  <el-button circle @click.stop="downloadWork(work)">
                    <el-icon><Download /></el-icon>
                  </el-button>
                </div>
              </div>
              <!-- 标签 -->
              <div class="work-tags">
                <el-tag v-if="work.featured" type="warning" effect="dark" size="small">
                  精选
                </el-tag>
                <el-tag v-if="work.isNew" type="success" effect="dark" size="small">
                  新作
                </el-tag>
              </div>
            </div>
            
            <div class="work-info">
              <h4 class="work-title">{{ work.title }}</h4>
              <div class="work-meta">
                <div class="author-info">
                  <el-avatar :size="24" :src="work.author.avatar">
                    <el-icon><User /></el-icon>
                  </el-avatar>
                  <span class="author-name">{{ work.author.name }}</span>
                </div>
                <div class="work-stats">
                  <span class="stat-item">
                    <el-icon><View /></el-icon>
                    {{ formatNumber(work.views) }}
                  </span>
                  <span class="stat-item">
                    <el-icon><Star /></el-icon>
                    {{ formatNumber(work.likes) }}
                  </span>
                </div>
              </div>
              <p class="work-prompt" v-if="work.prompt">
                {{ truncateText(work.prompt, 100) }}
              </p>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-gallery">
          <el-empty
            description="暂无作品"
            :image-size="150"
          >
            <p>暂时没有找到符合条件的作品</p>
            <el-button type="primary" @click="clearFilters">
              清除筛选条件
            </el-button>
          </el-empty>
        </div>

        <!-- 加载更多 -->
        <div v-if="hasMore && !loading" class="load-more">
          <el-button
            size="large"
            :loading="loadingMore"
            @click="loadMore"
          >
            {{ loadingMore ? '加载中...' : '加载更多' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 作品详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      :title="selectedWork?.title"
      width="80%"
      center
      class="work-detail-dialog"
    >
      <div v-if="selectedWork" class="work-detail">
        <div class="detail-image">
          <img 
          :src="selectedWork.image" 
          :alt="selectedWork.title" 
          @error="handleImageError"
        />
        </div>
        <div class="detail-info">
          <div class="detail-meta">
            <div class="author-section">
              <el-avatar :size="40" :src="selectedWork.author.avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div class="author-details">
                <h4>{{ selectedWork.author.name }}</h4>
                <p>{{ formatTime(selectedWork.createdAt) }}</p>
              </div>
            </div>
            <div class="detail-stats">
              <el-statistic title="浏览量" :value="selectedWork.views" />
              <el-statistic title="点赞数" :value="selectedWork.likes" />
              <el-statistic title="评论数" :value="selectedWork.comments || 0" />
            </div>
          </div>
          
          <div class="detail-prompt" v-if="selectedWork.prompt">
            <h5>创作描述</h5>
            <p>{{ selectedWork.prompt }}</p>
          </div>
          
          <div class="detail-params" v-if="selectedWork.params">
            <h5>生成参数</h5>
            <el-descriptions :column="2" size="small">
              <el-descriptions-item label="模型">{{ selectedWork.params.model }}</el-descriptions-item>
              <el-descriptions-item label="尺寸">{{ selectedWork.params.size }}</el-descriptions-item>
              <el-descriptions-item label="步数">{{ selectedWork.params.steps }}</el-descriptions-item>
              <el-descriptions-item label="创意程度">{{ selectedWork.params.cfgScale }}</el-descriptions-item>
            </el-descriptions>
          </div>
          
          <div class="detail-actions">
            <el-button type="primary" @click="likeWork(selectedWork)">
              <el-icon><StarFilled v-if="selectedWork.isLiked" /><Star v-else /></el-icon>
              {{ selectedWork.isLiked ? '取消点赞' : '点赞' }}
            </el-button>
            <el-button @click="shareWork(selectedWork)">
              <el-icon><Share /></el-icon>
              分享
            </el-button>
            <el-button @click="downloadWork(selectedWork)">
              <el-icon><Download /></el-icon>
              下载
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { worksAPI } from '../utils/api'
import { getFullImageUrl, handleImageError, downloadImage as downloadImageUtil } from '../utils/imageUtils'
import {
  Picture,
  Search,
  Refresh,
  Star,
  StarFilled,
  Share,
  Download,
  View,
  User
} from '@element-plus/icons-vue'

export default {
  name: 'Gallery',
  components: {
    Picture,
    Search,
    Refresh,
    Star,
    StarFilled,
    Share,
    Download,
    View,
    User
  },
  setup() {
    // 响应式数据
    const loading = ref(false)
    const loadingMore = ref(false)
    const galleryWorks = ref([])
    const selectedWork = ref(null)
    const detailVisible = ref(false)
    
    // 筛选条件
    const searchKeyword = ref('')
    const categoryFilter = ref('')
    const sortBy = ref('latest')
    const timeFilter = ref('')
    const currentPage = ref(1)
    const hasMore = ref(true)

    // 分页数据
    const pageSize = 12
    const totalWorks = ref(0)

    // 方法
    const loadGallery = async (isRefresh = false) => {
      loading.value = true
      try {
        const params = {
          page: isRefresh ? 1 : currentPage.value,
          limit: pageSize,
          search: searchKeyword.value,
          timeFilter: timeFilter.value
        }
        
        // 后端还不支持分类筛选，暂时注释
        // if (categoryFilter.value) {
        //   params.category = categoryFilter.value
        // }
        
        // 排序参数映射
        if (sortBy.value === 'popular') {
          params.sort = 'likes'
          params.order = 'DESC'
        } else if (sortBy.value === 'views') {
          params.sort = 'views' 
          params.order = 'DESC'
        } else {
          params.sort = 'created_at'
          params.order = 'DESC'
        }
        
        const response = await worksAPI.getPublicGallery(params)
        if (response.success) {
          const works = response.data.works.map(work => {
            // 处理图片URL
            const imageUrl = work.imageUrl || ''
            const thumbnailUrl = work.thumbnailUrl || imageUrl
            
            return {
              id: work.id,
              title: work.title,
              image: getFullImageUrl(thumbnailUrl || imageUrl),
              prompt: work.prompt || work.description || '',
              author: {
                name: work.author?.username || '匿名用户',
                avatar: work.author?.avatar ? getFullImageUrl(work.author.avatar) : null
              },
              views: work.views || 0,
              likes: work.likes || 0,
              comments: 0, // 暂时没有评论功能
              createdAt: work.createdAt,
              isLiked: work.isLiked || false, // 使用服务器返回的点赞状态
              featured: work.featured || false,
              isNew: work.isNew || false,
              category: work.category || 'artistic',
              params: {
                model: '未知', // 后端暂时没有返回这些参数
                size: work.dimensions || '未知',
                steps: 0,
                cfgScale: 0
              }
            }
          })
          
          if (isRefresh) {
            galleryWorks.value = works
            currentPage.value = 1
          } else {
            galleryWorks.value = works
          }
          
          totalWorks.value = response.data.pagination?.totalCount || 0
          hasMore.value = galleryWorks.value.length < totalWorks.value
        } else {
          throw new Error(response.message || '加载失败')
        }
      } catch (error) {
        console.error('加载画廊失败:', error)
        ElMessage.error('加载画廊失败: ' + (error.message || '未知错误'))
      } finally {
        loading.value = false
      }
    }

    const loadMore = async () => {
      if (!hasMore.value || loadingMore.value) return
      
      loadingMore.value = true
      try {
        const nextPage = currentPage.value + 1
        const params = {
          page: nextPage,
          limit: pageSize,
          search: searchKeyword.value,
          timeFilter: timeFilter.value
        }
        
        // 排序参数映射
        if (sortBy.value === 'popular') {
          params.sort = 'likes'
          params.order = 'DESC'
        } else if (sortBy.value === 'views') {
          params.sort = 'views' 
          params.order = 'DESC'
        } else {
          params.sort = 'created_at'
          params.order = 'DESC'
        }
        
        const response = await worksAPI.getPublicGallery(params)
        if (response.success) {
          const newWorks = response.data.works.map(work => {
            const imageUrl = work.imageUrl || ''
            const thumbnailUrl = work.thumbnailUrl || imageUrl
            
            return {
              id: work.id,
              title: work.title,
              image: getFullImageUrl(thumbnailUrl || imageUrl),
              prompt: work.prompt || work.description || '',
              author: {
                name: work.author?.username || '匿名用户',
                avatar: work.author?.avatar ? getFullImageUrl(work.author.avatar) : null
              },
              views: work.views || 0,
              likes: work.likes || 0,
              comments: 0,
              createdAt: work.createdAt,
              isLiked: work.isLiked || false, // 使用服务器返回的点赞状态
              featured: work.featured || false,
              isNew: work.isNew || false,
              category: work.category || 'artistic',
              params: {
                model: '未知',
                size: work.dimensions || '未知',
                steps: 0,
                cfgScale: 0
              }
            }
          })
          
          galleryWorks.value.push(...newWorks)
          currentPage.value = nextPage
          hasMore.value = galleryWorks.value.length < totalWorks.value
        }
      } catch (error) {
        console.error('加载更多失败:', error)
        ElMessage.error('加载更多失败')
      } finally {
        loadingMore.value = false
      }
    }

    const handleSearch = () => {
      // 实现搜索逻辑
      applyFilters()
    }

    const applyFilters = () => {
      // 重新加载第一页数据
      loadGallery(true)
    }

    const clearFilters = () => {
      searchKeyword.value = ''
      categoryFilter.value = ''
      sortBy.value = 'latest'
      timeFilter.value = ''
      loadGallery()
    }

    const refreshGallery = () => {
      loadGallery()
    }

    const openWorkDetail = async (work) => {
      selectedWork.value = work
      detailVisible.value = true
      
      // 增加浏览量
      try {
        const response = await worksAPI.incrementWorkView(work.id)
        if (response.success && response.data.increased) {
          // 更新本地显示的浏览量
          work.views = response.data.views
          // 如果selectedWork是同一个作品，也更新它
          if (selectedWork.value && selectedWork.value.id === work.id) {
            selectedWork.value.views = response.data.views
          }
        }
      } catch (error) {
        // 浏览量增加失败时静默处理，不影响用户体验
        console.warn('增加浏览量失败:', error)
      }
    }

    const likeWork = async (work) => {
      const originalLiked = work.isLiked
      const originalLikes = work.likes
      
      // 乐观更新UI
      work.isLiked = !work.isLiked
      work.likes += work.isLiked ? 1 : -1
      
      try {
        const response = await worksAPI.toggleWorkLike(work.id)
        
        if (response.success) {
          // 使用服务器返回的真实点赞数和状态
          work.likes = response.data.likes
          work.isLiked = response.data.isLiked
          ElMessage.success(response.message || (work.isLiked ? '点赞成功' : '取消点赞'))
        } else {
          throw new Error(response.message || '操作失败')
        }
      } catch (error) {
        // 恢复原状态
        work.isLiked = originalLiked
        work.likes = originalLikes
        console.error('点赞操作失败:', error)
        ElMessage.error('操作失败，请重试')
      }
    }

    const shareWork = (work) => {
      ElMessage.success('分享链接已复制到剪贴板')
    }

    const downloadWork = async (work) => {
      try {
        const filename = `gallery_${work.title}_${work.id}.png`
        await downloadImageUtil(work.image, filename)
        ElMessage.success('下载成功')
      } catch (error) {
        console.error('下载失败:', error)
        ElMessage.error('下载失败，请重试')
      }
    }

    // 工具函数
    const formatNumber = (num) => {
      if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k'
      }
      return num.toString()
    }

    const formatTime = (time) => {
      return new Date(time).toLocaleDateString('zh-CN')
    }

    const truncateText = (text, maxLength) => {
      if (text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    }

    // 生命周期
    onMounted(() => {
      loadGallery()
    })

    return {
      loading,
      loadingMore,
      galleryWorks,
      selectedWork,
      detailVisible,
      searchKeyword,
      categoryFilter,
      sortBy,
      timeFilter,
      hasMore,
      loadGallery,
      loadMore,
      handleSearch,
      applyFilters,
      clearFilters,
      refreshGallery,
      openWorkDetail,
      likeWork,
      shareWork,
      downloadWork,
      formatNumber,
      formatTime,
      truncateText,
      // 图片处理工具
      getFullImageUrl,
      handleImageError
    }
  }
}
</script>

<style scoped>
.gallery-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.gallery-container {
  max-width: 1600px;
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
  text-align: center;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.filter-section {
  margin-top: 1.5rem;
}

/* 作品展示 */
.gallery-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.skeleton-item {
  border-radius: 12px;
  overflow: hidden;
  background: #f5f5f5;
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.work-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.work-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.work-image {
  position: relative;
  aspect-ratio: 3/4;
  overflow: hidden;
}

.work-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.work-card:hover .work-image img {
  transform: scale(1.05);
}

.work-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.work-card:hover .work-overlay {
  opacity: 1;
}

.overlay-content {
  display: flex;
  gap: 1rem;
}

.work-tags {
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: flex;
  gap: 0.5rem;
}

.work-info {
  padding: 1.5rem;
}

.work-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.work-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.author-name {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.work-stats {
  display: flex;
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.work-prompt {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* 加载更多 */
.load-more {
  text-align: center;
  margin-top: 2rem;
}

/* 空状态 */
.empty-gallery {
  text-align: center;
  padding: 3rem;
}

/* 作品详情对话框 */
.work-detail {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
}

.detail-image {
  text-align: center;
}

.detail-image img {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 8px;
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.author-section {
  display: flex;
  gap: 1rem;
}

.author-details h4 {
  margin: 0 0 0.3rem 0;
  color: var(--text-primary);
}

.author-details p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.detail-stats {
  display: flex;
  gap: 1rem;
}

.detail-prompt h5,
.detail-params h5 {
  color: var(--text-primary);
  margin-bottom: 0.8rem;
}

.detail-prompt p {
  color: var(--text-secondary);
  line-height: 1.6;
}

.detail-actions {
  display: flex;
  gap: 1rem;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .works-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .gallery-page {
    padding: 1rem;
  }
  
  .page-header {
    padding: 1.5rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .gallery-content {
    padding: 1.5rem;
  }
  
  .works-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .work-detail {
    grid-template-columns: 1fr;
  }
  
  .detail-meta {
    flex-direction: column;
    gap: 1rem;
  }
  
  .detail-stats {
    justify-content: space-around;
  }
}

@media (max-width: 480px) {
  .works-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-section .el-row .el-col {
    margin-bottom: 1rem;
  }
}
</style>