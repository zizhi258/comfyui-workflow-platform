<template>
  <div class="my-works-page">
    <!-- 移动端面包屑 -->
    <div class="mobile-breadcrumb">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/dashboard' }">工作台</el-breadcrumb-item>
        <el-breadcrumb-item>我的作品</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    
    <div class="works-container">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">
            <el-icon><Folder /></el-icon>
            我的作品
          </h1>
          <p class="page-subtitle">管理和展示你的AI创作作品集</p>
        </div>
        
        <!-- 操作栏 -->
        <div class="actions-bar">
          <el-row :gutter="16" justify="space-between" align="middle">
            <el-col :span="12">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索我的作品..."
                prefix-icon="Search"
                clearable
              />
            </el-col>
            <el-col :span="12" class="action-buttons">
              <el-select v-model="sortBy" placeholder="排序" @change="applySorting">
                <el-option label="创建时间" value="created" />
                <el-option label="修改时间" value="updated" />
                <el-option label="点赞最多" value="likes" />
                <el-option label="浏览最多" value="views" />
              </el-select>
              <el-button-group>
                <el-button
                  :type="viewMode === 'grid' ? 'primary' : 'default'"
                  @click="viewMode = 'grid'"
                >
                  <el-icon><Grid /></el-icon>
                </el-button>
                <el-button
                  :type="viewMode === 'list' ? 'primary' : 'default'"
                  @click="viewMode = 'list'"
                >
                  <el-icon><List /></el-icon>
                </el-button>
              </el-button-group>
              <el-button type="primary" @click="$router.push('/create')">
                <el-icon><Plus /></el-icon>
                新建作品
              </el-button>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="stats-section">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-card class="stat-card">
              <el-statistic title="总作品数" :value="stats.total" />
              <div class="stat-icon">
                <el-icon size="24" color="#6366f1"><Picture /></el-icon>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <el-statistic title="总浏览量" :value="stats.totalViews" />
              <div class="stat-icon">
                <el-icon size="24" color="#10b981"><View /></el-icon>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <el-statistic title="总点赞数" :value="stats.totalLikes" />
              <div class="stat-icon">
                <el-icon size="24" color="#f59e0b"><Star /></el-icon>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <el-statistic title="本月创作" :value="stats.monthlyWorks" />
              <div class="stat-icon">
                <el-icon size="24" color="#ef4444"><TrendCharts /></el-icon>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 作品展示区域 -->
      <div class="works-content">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <el-skeleton animated>
            <template #template>
              <div :class="viewMode === 'grid' ? 'skeleton-grid' : 'skeleton-list'">
                <div v-for="i in 8" :key="i" class="skeleton-item">
                  <el-skeleton-item variant="image" :style="viewMode === 'grid' ? 'height: 200px;' : 'height: 120px; width: 120px;'" />
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

        <!-- 网格视图 -->
        <div v-else-if="viewMode === 'grid'" class="works-grid">
          <div
            v-for="work in filteredWorks"
            :key="work.id"
            class="work-card"
            @click="openWorkDetail(work)"
          >
            <div class="work-image">
              <img 
                :src="getFullImageUrl(work.image)" 
                :alt="work.title"
                @error="handleImageError"
              />
              <div class="work-overlay">
                <div class="overlay-actions">
                  <el-button circle @click.stop="editWork(work)">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button circle @click.stop="shareWork(work)">
                    <el-icon><Share /></el-icon>
                  </el-button>
                  <el-button circle type="danger" @click.stop="deleteWork(work)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
              <!-- 状态标签 -->
              <div class="work-status">
                <el-tag
                  v-if="work.isPublic"
                  type="success"
                  effect="dark"
                  size="small"
                >
                  公开
                </el-tag>
                <el-tag
                  v-else
                  type="info"
                  effect="dark"
                  size="small"
                >
                  私有
                </el-tag>
              </div>
            </div>
            
            <div class="work-info">
              <h4 class="work-title">{{ work.title }}</h4>
              <div class="work-meta">
                <span class="work-date">{{ formatTime(work.createdAt) }}</span>
                <div class="work-status-switch" @click.stop>
                  <el-switch
                    v-model="work.isPublic"
                    size="small"
                    @change="toggleWorkPublic(work)"
                    :disabled="work.updating"
                  />
                </div>
                <div class="work-stats">
                  <span class="stat-item">
                    <el-icon><View /></el-icon>
                    {{ work.views }}
                  </span>
                  <span class="stat-item">
                    <el-icon><Star /></el-icon>
                    {{ work.likes }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 列表视图 -->
        <div v-else class="works-list">
          <el-table :data="filteredWorks" style="width: 100%">
            <el-table-column width="120">
              <template #default="{ row }">
                <div class="list-image">
                  <img 
                    :src="getFullImageUrl(row.image)" 
                    :alt="row.title" 
                    @click="openWorkDetail(row)"
                    @error="handleImageError"
                  />
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="作品名称" min-width="200">
              <template #default="{ row }">
                <div class="work-title-cell">
                  <h4 @click="openWorkDetail(row)">{{ row.title }}</h4>
                  <p class="work-prompt-preview">{{ truncateText(row.prompt, 80) }}</p>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="120" class-name="hidden-sm-and-down">
              <template #default="{ row }">
                {{ formatTime(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column prop="views" label="浏览量" width="100" class-name="hidden-xs-only" />
            <el-table-column prop="likes" label="点赞数" width="100" class-name="hidden-xs-only" />
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <el-switch
                  v-model="row.isPublic"
                  active-text="公开"
                  inactive-text="私有"
                  @change="toggleWorkPublic(row)"
                  :disabled="row.updating"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160">
              <template #default="{ row }">
                <el-button size="small" @click="editWork(row)">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button size="small" @click="shareWork(row)">
                  <el-icon><Share /></el-icon>
                </el-button>
                <el-button size="small" type="danger" @click="deleteWork(row)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && filteredWorks.length === 0" class="empty-works">
          <el-empty
            description="还没有创作任何作品"
            :image-size="150"
          >
            <div class="empty-actions">
              <el-button type="primary" size="large" @click="$router.push('/create')">
                <el-icon><Plus /></el-icon>
                开始创作
              </el-button>
              <el-button @click="clearSearch" v-if="searchKeyword">
                清除搜索
              </el-button>
            </div>
          </el-empty>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="pagination.totalCount > 0" class="pagination-section">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[12, 24, 48]"
          :total="pagination.totalCount"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 作品详情/编辑对话框 -->
    <el-dialog
      v-model="detailVisible"
      :title="isEditing ? '编辑作品' : '作品详情'"
      width="80%"
      center
    >
      <div v-if="selectedWork" class="work-detail">
        <div class="detail-image">
          <img 
            :src="getFullImageUrl(selectedWork.image)" 
            :alt="selectedWork.title"
            @error="handleImageError"
          />
        </div>
        <div class="detail-form">
          <el-form v-if="isEditing" :model="editForm" label-width="80px">
            <el-form-item label="作品名称">
              <el-input v-model="editForm.title" />
            </el-form-item>
            <el-form-item label="描述">
              <el-input
                v-model="editForm.description"
                type="textarea"
                :rows="3"
                placeholder="为你的作品添加描述..."
              />
            </el-form-item>
            <el-form-item label="标签">
              <el-select
                v-model="editForm.tags"
                multiple
                filterable
                allow-create
                placeholder="添加标签"
                style="width: 100%"
              >
                <el-option
                  v-for="tag in commonTags"
                  :key="tag"
                  :label="tag"
                  :value="tag"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="公开状态">
              <el-switch
                v-model="editForm.isPublic"
                active-text="公开"
                inactive-text="私有"
              />
            </el-form-item>
          </el-form>
          
          <div v-else class="detail-info">
            <h3>{{ selectedWork.title }}</h3>
            <p v-if="selectedWork.description" class="work-description">
              {{ selectedWork.description }}
            </p>
            <div class="work-prompt">
              <h5>生成提示词</h5>
              <p>{{ selectedWork.prompt }}</p>
            </div>
            <div class="work-params">
              <h5>生成参数</h5>
              <el-descriptions :column="2" size="small">
                <el-descriptions-item label="模型">{{ selectedWork.params?.model }}</el-descriptions-item>
                <el-descriptions-item label="尺寸">{{ selectedWork.params?.size }}</el-descriptions-item>
                <el-descriptions-item label="步数">{{ selectedWork.params?.steps }}</el-descriptions-item>
                <el-descriptions-item label="创意程度">{{ selectedWork.params?.cfgScale }}</el-descriptions-item>
              </el-descriptions>
            </div>
            <div class="work-tags" v-if="selectedWork.tags && selectedWork.tags.length">
              <h5>标签</h5>
              <el-tag
                v-for="tag in selectedWork.tags"
                :key="tag"
                style="margin-right: 8px; margin-bottom: 8px;"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailVisible = false">取消</el-button>
          <el-button v-if="isEditing" type="primary" @click="saveWork">
            保存
          </el-button>
          <el-button v-else type="primary" @click="isEditing = true">
            编辑
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { worksAPI } from '../utils/api'
import { getFullImageUrl, handleImageError } from '../utils/imageUtils'
import {
  Folder,
  Search,
  Grid,
  List,
  Plus,
  Picture,
  View,
  Star,
  TrendCharts,
  Edit,
  Share,
  Delete
} from '@element-plus/icons-vue'

export default {
  name: 'MyWorks',
  components: {
    Folder,
    Search,
    Grid,
    List,
    Plus,
    Picture,
    View,
    Star,
    TrendCharts,
    Edit,
    Share,
    Delete
  },
  setup() {
    // 响应式数据
    const loading = ref(false)
    const viewMode = ref('grid')
    const searchKeyword = ref('')
    const sortBy = ref('created')
    const currentPage = ref(1)
    const pageSize = ref(12)
    
    const selectedWork = ref(null)
    const detailVisible = ref(false)
    const isEditing = ref(false)
    
    // 编辑表单
    const editForm = reactive({
      title: '',
      description: '',
      tags: [],
      isPublic: true
    })

    // 统计数据
    const stats = reactive({
      total: 0,
      totalViews: 0,
      totalLikes: 0,
      monthlyWorks: 0
    })
    
    // 分页数据
    const pagination = reactive({
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
      hasNext: false,
      hasPrev: false
    })

    // 常用标签
    const commonTags = ['AI艺术', '写实', '动漫', '风景', '人物', '抽象', '科幻', '奇幻']

    // 作品数据
    const myWorks = ref([])

    // 计算属性（显示当前页的作品）
    const filteredWorks = computed(() => {
      return myWorks.value
    })

    // 加载用户作品数据
    const loadWorks = async (showLoading = true) => {
      if (showLoading) {
        loading.value = true
      }
      
      try {
        const params = {
          page: currentPage.value,
          limit: pageSize.value,
          sort: getSortField(),
          order: 'DESC',
          search: searchKeyword.value.trim()
        }
        
        console.log('加载作品参数:', params)
        
        const response = await worksAPI.getUserWorks(params)
        
        if (response.success) {
          console.log('作品加载成功:', response.data)
          
          // 转换数据格式
          myWorks.value = response.data.works.map(work => ({
            id: work.id,
            title: work.title,
            description: work.description,
            image: work.imageUrl, // 使用主图片URL
            thumbnailUrl: work.thumbnailUrl,
            prompt: work.prompt,
            tags: work.tags || [],
            views: work.views,
            likes: work.likes,
            createdAt: work.createdAt,
            updatedAt: work.updatedAt,
            isPublic: work.isPublic,
            dimensions: work.dimensions,
            fileSize: work.fileSize,
            params: {
              model: work.modelConfig?.model,
              size: work.modelConfig?.size,
              steps: work.modelConfig?.steps,
              cfgScale: work.modelConfig?.cfgScale,
              sampler: work.modelConfig?.sampler
            }
          }))
          
          // 更新分页信息
          Object.assign(pagination, response.data.pagination)
          
          // 更新统计信息
          updateStats(response.data.works)
          
        } else {
          console.error('加载作品失败:', response.message)
          ElMessage.error('加载作品失败: ' + (response.message || '未知错误'))
        }
      } catch (error) {
        console.error('加载作品异常:', error)
        ElMessage.error('加载作品失败: ' + (error.message || '网络错误'))
      } finally {
        if (showLoading) {
          loading.value = false
        }
      }
    }
    
    // 更新统计信息
    const updateStats = (works) => {
      stats.total = pagination.totalCount
      stats.totalViews = works.reduce((sum, work) => sum + work.views, 0)
      stats.totalLikes = works.reduce((sum, work) => sum + work.likes, 0)
      
      // 计算本月作品数
      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      stats.monthlyWorks = works.filter(work => 
        new Date(work.createdAt) >= thisMonth
      ).length
    }
    
    // 获取排序字段
    const getSortField = () => {
      const sortMap = {
        'created': 'created_at',
        'updated': 'updated_at',
        'likes': 'likes',
        'views': 'views'
      }
      return sortMap[sortBy.value] || 'created_at'
    }

    const handleSearch = () => {
      currentPage.value = 1
      loadWorks()
    }

    const applySorting = () => {
      currentPage.value = 1
      loadWorks()
    }

    const clearSearch = () => {
      searchKeyword.value = ''
    }

    const openWorkDetail = (work) => {
      selectedWork.value = work
      isEditing.value = false
      detailVisible.value = true
    }

    const editWork = (work) => {
      selectedWork.value = work
      isEditing.value = true
      detailVisible.value = true
      
      // 填充编辑表单
      Object.assign(editForm, {
        title: work.title,
        description: work.description || '',
        tags: work.tags || [],
        isPublic: work.isPublic
      })
    }

    const saveWork = async () => {
      try {
        const response = await worksAPI.updateWork(selectedWork.value.id, {
          title: editForm.title,
          description: editForm.description,
          tags: editForm.tags,
          isPublic: editForm.isPublic
        })
        
        if (response.success) {
          // 更新本地数据
          const workIndex = myWorks.value.findIndex(w => w.id === selectedWork.value.id)
          if (workIndex > -1) {
            myWorks.value[workIndex] = {
              ...myWorks.value[workIndex],
              title: editForm.title,
              description: editForm.description,
              tags: editForm.tags,
              isPublic: editForm.isPublic,
              updatedAt: response.data.work.updatedAt
            }
          }
          
          // 更新selectedWork
          Object.assign(selectedWork.value, {
            title: editForm.title,
            description: editForm.description,
            tags: editForm.tags,
            isPublic: editForm.isPublic,
            updatedAt: response.data.work.updatedAt
          })
          
          ElMessage.success('保存成功')
          isEditing.value = false
        } else {
          ElMessage.error('保存失败：' + (response.message || '未知错误'))
        }
      } catch (error) {
        console.error('保存作品失败:', error)
        ElMessage.error('保存失败：' + (error.message || '网络错误'))
      }
    }

    const toggleWorkPublic = async (work) => {
      // 添加更新状态
      work.updating = true
      
      try {
        const response = await worksAPI.updateWork(work.id, {
          isPublic: work.isPublic
        })
        
        if (response.success) {
          ElMessage.success(work.isPublic ? '作品已设为公开' : '作品已设为私有')
        } else {
          // 恢复原状态
          work.isPublic = !work.isPublic
          ElMessage.error('更新失败：' + (response.message || '未知错误'))
        }
      } catch (error) {
        // 恢复原状态
        work.isPublic = !work.isPublic
        console.error('切换作品状态失败:', error)
        ElMessage.error('更新失败：' + (error.message || '网络错误'))
      } finally {
        work.updating = false
      }
    }

    const shareWork = (work) => {
      ElMessage.success('分享链接已复制到剪贴板')
    }

    const deleteWork = async (work) => {
      try {
        await ElMessageBox.confirm(`确定要删除作品"${work.title}"吗？删除后无法恢复！`, '确认删除', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        const response = await worksAPI.deleteWork(work.id)
        
        if (response.success) {
          // 从本地数据中移除
          const index = myWorks.value.findIndex(w => w.id === work.id)
          if (index > -1) {
            myWorks.value.splice(index, 1)
            stats.total--
          }
          
          // 如果当前页没有数据了，回到上一页
          if (myWorks.value.length === 0 && currentPage.value > 1) {
            currentPage.value--
            loadWorks()
          }
          
          ElMessage.success('删除成功')
        } else {
          ElMessage.error('删除失败：' + (response.message || '未知错误'))
        }
      } catch (error) {
        if (error !== 'cancel') { // 不是用户取消操作
          console.error('删除作品失败:', error)
          ElMessage.error('删除失败：' + (error.message || '网络错误'))
        }
      }
    }

    const handleSizeChange = (val) => {
      pageSize.value = val
      currentPage.value = 1
      loadWorks()
    }

    const handleCurrentChange = (val) => {
      currentPage.value = val
      loadWorks()
    }

    // 工具函数
    const formatTime = (time) => {
      return new Date(time).toLocaleDateString('zh-CN')
    }

    const truncateText = (text, maxLength) => {
      if (!text) return ''
      if (text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    }

    // 搜索防抖
    let searchTimer = null
    const debouncedSearch = () => {
      if (searchTimer) {
        clearTimeout(searchTimer)
      }
      searchTimer = setTimeout(() => {
        handleSearch()
      }, 500)
    }
    
    // 监听搜索关键词变化
    watch(searchKeyword, () => {
      debouncedSearch()
    })
    
    // 生命周期
    onMounted(() => {
      loadWorks()
    })

    return {
      loading,
      viewMode,
      searchKeyword,
      sortBy,
      currentPage,
      pageSize,
      selectedWork,
      detailVisible,
      isEditing,
      editForm,
      stats,
      pagination,
      commonTags,
      myWorks,
      filteredWorks,
      loadWorks,
      handleSearch,
      applySorting,
      clearSearch,
      openWorkDetail,
      editWork,
      saveWork,
      toggleWorkPublic,
      shareWork,
      deleteWork,
      handleSizeChange,
      handleCurrentChange,
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
.my-works-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.works-container {
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

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

/* 统计信息 */
.stats-section {
  margin-bottom: 2rem;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-card :deep(.el-card__body) {
  padding: 1.5rem;
}

.stat-icon {
  position: absolute;
  top: 1rem;
  right: 1rem;
  opacity: 0.1;
}

/* 作品展示 */
.works-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-item {
  border-radius: 12px;
  overflow: hidden;
  background: #f5f5f5;
}

/* 网格视图 */
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

.overlay-actions {
  display: flex;
  gap: 1rem;
}

.work-status {
  position: absolute;
  top: 1rem;
  left: 1rem;
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
  gap: 1rem;
}

.work-date {
  font-size: 0.9rem;
  color: var(--text-secondary);
  flex: 1;
}

.work-status-switch {
  display: flex;
  align-items: center;
  margin: 0 0.5rem;
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

/* 列表视图 */
.works-list :deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

.list-image {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
}

.list-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.work-title-cell h4 {
  margin: 0 0 0.5rem 0;
  cursor: pointer;
  color: var(--primary-color);
}

.work-title-cell h4:hover {
  text-decoration: underline;
}

.work-prompt-preview {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* 空状态 */
.empty-works {
  text-align: center;
  padding: 3rem;
}

.empty-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

/* 分页 */
.pagination-section {
  display: flex;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

/* 作品详情 */
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

.detail-form,
.detail-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.work-description {
  color: var(--text-secondary);
  line-height: 1.6;
}

.work-prompt h5,
.work-params h5,
.work-tags h5 {
  color: var(--text-primary);
  margin-bottom: 0.8rem;
}

.work-prompt p {
  color: var(--text-secondary);
  line-height: 1.6;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
}

/* 移动端面包屑 */
.mobile-breadcrumb {
  display: none;
  padding: 0.8rem 1rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-color);
}

.mobile-breadcrumb :deep(.el-breadcrumb__inner) {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.mobile-breadcrumb :deep(.el-breadcrumb__inner.is-link) {
  color: var(--primary-color);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .works-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .mobile-breadcrumb {
    display: block;
  }
  
  .my-works-page {
    padding: 0.5rem;
  }
  
  .page-header {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 1.8rem;
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
  
  .header-content {
    text-align: center;
    margin-bottom: 1rem;
  }
  
  .action-buttons {
    flex-direction: column;
    width: 100%;
    gap: 0.5rem;
  }
  
  .action-buttons .el-button {
    width: 100%;
    justify-content: center;
  }
  
  .works-content {
    padding: 1rem;
  }
  
  .stats-section {
    margin-bottom: 1.5rem;
  }
  
  .stats-section .el-col {
    margin-bottom: 1rem;
  }
  
  .stat-card {
    height: auto;
    min-height: 80px;
  }
  
  .actions-bar {
    margin-bottom: 1rem;
  }
  
  .actions-bar .el-row {
    gap: 0.5rem;
  }
  
  .actions-bar .el-col {
    margin-bottom: 0.5rem;
  }
  
  .view-mode-switch {
    justify-content: center;
  }
  
  .works-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 0.8rem;
  }
  
  .work-card {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .work-info {
    padding: 1rem;
  }
  
  .work-title {
    font-size: 1rem;
    margin-bottom: 0.8rem;
  }
  
  .work-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .work-stats {
    align-self: flex-end;
    gap: 0.8rem;
  }
  
  .work-status-switch {
    align-self: flex-start;
    margin: 0;
  }
  
  .works-list :deep(.el-table) {
    font-size: 0.9rem;
  }
  
  .works-list :deep(.el-table .el-table__cell) {
    padding: 8px 4px;
  }
  
  .works-list :deep(.hidden-sm-and-down) {
    display: none;
  }
  
  .list-image {
    width: 60px;
    height: 60px;
  }
  
  .work-detail {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .detail-image img {
    max-height: 50vh;
  }
}

@media (max-width: 480px) {
  .my-works-page {
    padding: 0.25rem;
  }
  
  .page-header {
    padding: 0.8rem;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .works-content {
    padding: 0.8rem;
  }
  
  .works-grid {
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }
  
  .work-card {
    margin-bottom: 0.5rem;
  }
  
  .work-info {
    padding: 0.8rem;
  }
  
  .work-title {
    font-size: 0.95rem;
  }
  
  .actions-bar .el-row .el-col {
    margin-bottom: 0.8rem;
  }
  
  .actions-bar .el-input,
  .actions-bar .el-select {
    width: 100%;
  }
  
  .stats-section .el-col {
    margin-bottom: 0.8rem;
  }
  
  .stat-card :deep(.el-card__body) {
    padding: 1rem;
  }
  
  .works-list :deep(.el-table .el-table__cell) {
    padding: 6px 2px;
    font-size: 0.85rem;
  }
  
  .works-list :deep(.hidden-xs-only) {
    display: none;
  }
  
  .list-image {
    width: 50px;
    height: 50px;
  }
  
  .work-title-cell h4 {
    font-size: 0.9rem;
    margin-bottom: 0.3rem;
  }
  
  .work-prompt-preview {
    font-size: 0.8rem;
  }
  
  .pagination-section {
    padding: 1rem;
  }
  
  .pagination-section :deep(.el-pagination) {
    justify-content: center;
  }
  
  .pagination-section :deep(.el-pagination .el-pager li) {
    min-width: 28px;
    height: 28px;
    line-height: 28px;
    font-size: 0.9rem;
  }
}
</style>