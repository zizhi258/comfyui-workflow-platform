<template>
  <div class="create-page">
    <div class="create-container">
      <!-- 左侧配置面板 -->
      <div class="config-panel">
        <div class="panel-header">
          <h2 class="panel-title">
            <el-icon><MagicStick /></el-icon>
            创意工作流配置
          </h2>
          <p class="panel-subtitle">通过简单配置，让AI为你创造精彩作品</p>
        </div>

        <el-scrollbar class="config-content">
          <!-- 提示词输入 -->
          <div class="config-section">
            <h3 class="section-title">
              <el-icon><Edit /></el-icon>
              创意描述
            </h3>
            <el-form-item label="正面提示词">
              <el-input
                v-model="config.prompt"
                type="textarea"
                :rows="4"
                placeholder="描述你想要创作的画面，例如：一只可爱的小猫坐在花园里，阳光透过树叶洒下..."
                show-word-limit
                maxlength="500"
              />
            </el-form-item>
            <el-form-item label="负面提示词">
              <el-input
                v-model="config.negativePrompt"
                type="textarea"
                :rows="2"
                placeholder="描述你不希望出现的元素，例如：模糊、变形、低质量..."
                show-word-limit
                maxlength="200"
              />
            </el-form-item>
          </div>

          <!-- 模型选择 -->
          <div class="config-section">
            <h3 class="section-title">
              <el-icon><Cpu /></el-icon>
              AI模型选择
            </h3>
            <el-form-item label="基础模型">
              <el-select
                v-model="config.model"
                placeholder="选择AI模型"
                class="full-width"
                :loading="isLoadingModels"
                :disabled="isLoadingModels"
              >
                <el-option
                  v-for="model in availableModels"
                  :key="model.value"
                  :label="model.label"
                  :value="model.value"
                >
                  <div class="model-option">
                    <span>{{ model.label }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </div>

          <!-- 参数设置 -->
          <div class="config-section">
            <h3 class="section-title">
              <el-icon><Setting /></el-icon>
              生成参数
            </h3>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="图片尺寸">
                  <el-select v-model="config.size" class="full-width">
                    <el-option label="512×512 (正方形)" value="512x512" />
                    <el-option label="768×512 (横版)" value="768x512" />
                    <el-option label="512×768 (竖版)" value="512x768" />
                    <el-option
                      label="1024×1024 (高清正方形)"
                      value="1024x1024"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="生成数量">
                  <el-input-number
                    v-model="config.batchSize"
                    :min="1"
                    :max="4"
                    class="full-width"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="创意程度">
              <el-slider
                v-model="config.cfgScale"
                :min="1"
                :max="20"
                :step="0.5"
                show-tooltip
                :format-tooltip="formatCfgTooltip"
              />
            </el-form-item>

            <el-form-item label="生成步数">
              <el-slider
                v-model="config.steps"
                :min="10"
                :max="50"
                :step="5"
                show-tooltip
                :format-tooltip="formatStepsTooltip"
              />
            </el-form-item>

            <el-form-item label="随机种子">
              <el-row :gutter="8">
                <el-col :span="16">
                  <el-input-number
                    v-model="config.seed"
                    :min="-1"
                    class="full-width"
                    placeholder="随机种子 (-1为随机)"
                  />
                </el-col>
                <el-col :span="8">
                  <el-button @click="randomSeed" class="full-width">
                    <el-icon><Refresh /></el-icon>
                    随机
                  </el-button>
                </el-col>
              </el-row>
            </el-form-item>
          </div>

          <!-- 高级选项 -->
          <div class="config-section">
            <el-collapse v-model="advancedOpen">
              <el-collapse-item title="高级选项" name="advanced">
                <el-form-item label="采样器">
                  <el-select
                    v-model="config.sampler"
                    class="full-width"
                    :loading="isLoadingSamplers"
                    :disabled="isLoadingSamplers"
                  >
                    <el-option
                      v-for="sampler in availableSamplers"
                      :key="sampler"
                      :label="sampler"
                      :value="sampler"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="剪辑跳过">
                  <el-input-number
                    v-model="config.clipSkip"
                    :min="1"
                    :max="2"
                    class="full-width"
                  />
                </el-form-item>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-scrollbar>

        <!-- 生成按钮 -->
        <div class="panel-footer">
          <el-button
            type="primary"
            size="large"
            :loading="isGenerating"
            @click="generateImage"
            class="generate-btn"
            :disabled="
              !config.prompt.trim() || userStore.userCredits < estimatedCredits
            "
          >
            <el-icon v-if="!isGenerating"><MagicStick /></el-icon>
            {{ isGenerating ? "创作中..." : "开始创作" }}
          </el-button>
          <div class="cost-info">
            <el-icon><Coin /></el-icon>
            预计消耗: {{ estimatedCredits }} 积分
          </div>
          <div
            class="balance-info"
            :class="{ insufficient: userStore.userCredits < estimatedCredits }"
          >
            余额: {{ userStore.userCredits }} 积分
            <span
              v-if="userStore.userCredits < estimatedCredits"
              class="insufficient-text"
            >
              (不足)
            </span>
          </div>
        </div>
      </div>

      <!-- 右侧结果展示 -->
      <div class="result-panel">
        <div class="result-header">
          <h3 class="result-title">创作结果</h3>
          <div class="result-actions" v-if="generatedImages.length > 0">
            <el-button size="small" @click="downloadAll">
              <el-icon><Download /></el-icon>
              全部下载
            </el-button>
            <el-button size="small" @click="saveToGallery">
              <el-icon><Star /></el-icon>
              保存到画廊
            </el-button>
          </div>
        </div>

        <div class="result-content">
          <!-- 生成中状态 -->
          <div v-if="isGenerating" class="generating-state">
            <div class="generating-animation">
              <el-icon size="64"><MagicStick /></el-icon>
            </div>
            <h4>AI正在创作中...</h4>
            <p>{{ progressDetail.title }}</p>
            <p v-if="progressDetail.totalSteps > 0" class="progress-detail">
              步骤 {{ progressDetail.step }} / {{ progressDetail.totalSteps }}
            </p>
            <p v-else>请稍等，预计需要 {{ estimatedTime }} 秒</p>
            <el-progress :percentage="generationProgress" :stroke-width="6" />
          </div>

          <!-- 结果展示 -->
          <div v-else-if="generatedImages.length > 0" class="result-grid">
            <div
              v-for="(image, index) in generatedImages"
              :key="index"
              class="result-item"
            >
              <div class="image-container">
                <img
                  :src="getFullImageUrl(image.url)"
                  :alt="`Generated image ${index + 1}`"
                  @click="showPreview(image)"
                  @error="handleImageError"
                />
                <div class="image-overlay">
                  <el-button circle @click="downloadImage(image)">
                    <el-icon><Download /></el-icon>
                  </el-button>
                  <el-button circle @click="showPreview(image)">
                    <el-icon><View /></el-icon>
                  </el-button>
                  <el-button circle @click="saveToGalleryWithDialog(image)">
                    <el-icon><Star /></el-icon>
                  </el-button>
                  <el-button circle @click="useAsReference(image)">
                    <el-icon><Refresh /></el-icon>
                  </el-button>
                </div>
              </div>
              <div class="image-info">
                <p class="image-seed">种子: {{ image.seed }}</p>
                <p class="image-time">{{ formatTime(image.createdAt) }}</p>
                <p
                  class="image-debug"
                  v-if="$dev"
                  style="font-size: 0.7rem; color: #999; word-break: break-all"
                >
                  URL: {{ image.url }}
                </p>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else class="empty-result">
            <el-empty description="还没有生成任何作品" :image-size="150">
              <div class="empty-tips">
                <h4>开始你的AI创作之旅</h4>
                <p>
                  在左侧输入创意描述，选择合适的风格和参数，点击"开始创作"即可生成精美的AI艺术作品
                </p>
              </div>
            </el-empty>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片预览对话框 -->
    <el-dialog v-model="previewVisible" title="图片预览" width="80%" center>
      <div class="preview-container">
        <img
          v-if="previewImage"
          :src="getFullImageUrl(previewImage.url)"
          alt="Preview"
          @error="handleImageError"
        />
      </div>
    </el-dialog>

    <!-- 保存作品对话框 -->
    <el-dialog
      v-model="saveDialogVisible"
      title="保存到画廊"
      width="500px"
      center
    >
      <el-form :model="saveForm" label-width="80px">
        <el-form-item label="作品标题">
          <el-input
            v-model="saveForm.title"
            placeholder="为你的作品起个名字"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="作品描述">
          <el-input
            v-model="saveForm.description"
            type="textarea"
            :rows="3"
            placeholder="描述一下这个作品..."
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="标签">
          <el-input
            v-model="saveForm.tagsInput"
            placeholder="用逗号分隔标签，如：风景,动漫,写实"
            maxlength="100"
          />
          <div class="tags-preview" v-if="saveForm.tags.length > 0">
            <el-tag
              v-for="tag in saveForm.tags"
              :key="tag"
              size="small"
              style="margin-right: 8px; margin-top: 8px"
            >
              {{ tag }}
            </el-tag>
          </div>
        </el-form-item>
        <el-form-item label="公开状态">
          <el-switch
            v-model="saveForm.isPublic"
            active-text="公开"
            inactive-text="私有"
          />
          <div class="form-tip">私有作品仅自己可见，公开作品会显示在画廊中</div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="saveDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="confirmSaveWork"
            :loading="isSaving"
            :disabled="!saveForm.title.trim()"
          >
            {{ isSaving ? "保存中..." : "保存作品" }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { generateAPI, worksAPI } from "../utils/api";
import {
  getFullImageUrl,
  handleImageError,
  downloadImage as downloadImageUtil,
} from "../utils/imageUtils";
import progressWS from "../utils/websocket";
import { useUserStore } from "../stores/user";
import {
  MagicStick,
  Edit,
  Cpu,
  Setting,
  Refresh,
  Download,
  Star,
  View,
  Coin,
} from "@element-plus/icons-vue";

export default {
  name: "Create",
  components: {
    MagicStick,
    Edit,
    Cpu,
    Setting,
    Refresh,
    Download,
    Star,
    View,
    Coin,
  },
  setup() {
    // 用户状态
    const userStore = useUserStore();

    // 配置数据
    const config = reactive({
      prompt: "",
      negativePrompt: "blurry, bad quality, distorted, deformed",
      model: "", // 将通过API动态设置
      size: "1024x1024",
      batchSize: 1,
      cfgScale: 7.5,
      steps: 25,
      seed: -1,
      sampler: "", // 将通过API动态设置
      clipSkip: 2,
    });

    // 状态数据
    const isGenerating = ref(false);
    const generationProgress = ref(0);
    const progressDetail = ref({ step: 0, totalSteps: 0, title: "准备中..." });
    const generatedImages = ref([]);
    const previewVisible = ref(false);
    const previewImage = ref(null);
    const advancedOpen = ref([]);

    // 保存相关状态
    const saveDialogVisible = ref(false);
    const isSaving = ref(false);
    const currentSaveImage = ref(null);
    const saveForm = reactive({
      title: "",
      description: "",
      tagsInput: "",
      tags: [],
      isPublic: false,
    });

    // 模型数据
    const availableModels = ref([]);
    const isLoadingModels = ref(false);

    // 采样器数据
    const availableSamplers = ref([]);
    const isLoadingSamplers = ref(false);

    // 计算属性
    const estimatedCost = computed(() => {
      const baseCost = 10;
      const sizeCost = config.size === "1024x1024" ? 5 : 0;
      const batchCost = (config.batchSize - 1) * 8;
      return baseCost + sizeCost + batchCost;
    });

    // 积分消耗计算
    const estimatedCredits = computed(() => {
      return 15 * config.batchSize; // 每张图片15积分
    });

    const estimatedTime = computed(() => {
      const baseTime = 15;
      const sizeTime = config.size === "1024x1024" ? 10 : 0;
      const batchTime = (config.batchSize - 1) * 12;
      const stepsTime = Math.floor((config.steps - 20) / 5) * 2;
      return Math.max(baseTime + sizeTime + batchTime + stepsTime, 5);
    });

    // 方法
    const formatCfgTooltip = (value) => {
      if (value <= 5) return "保守创作";
      if (value <= 10) return "平衡创作";
      if (value <= 15) return "大胆创作";
      return "极度创意";
    };

    const formatStepsTooltip = (value) => {
      if (value <= 20) return "快速生成";
      if (value <= 35) return "标准质量";
      return "高质量";
    };

    const randomSeed = () => {
      config.seed = Math.floor(Math.random() * 1000000);
    };

    // 获取可用模型列表
    const fetchAvailableModels = async () => {
      try {
        isLoadingModels.value = true;
        const response = await generateAPI.getAvailableModels();
        if (response.success) {
          availableModels.value = response.data.models;
          // 自动选择第一个可用模型
          if (availableModels.value.length > 0) {
            config.model = availableModels.value[0].value;
            console.log("自动选择模型:", config.model);
          }
        }
      } catch (error) {
        console.error("获取模型列表失败:", error);
        ElMessage.warning("获取模型列表失败，使用默认模型");
        // 使用默认模型
        availableModels.value = [
          { label: "默认模型", value: "default.safetensors" },
        ];
        config.model = "default.safetensors";
        console.log("使用默认模型:", config.model);
      } finally {
        isLoadingModels.value = false;
      }
    };

    // 获取可用采样器列表
    const fetchAvailableSamplers = async () => {
      try {
        isLoadingSamplers.value = true;
        const response = await generateAPI.getAvailableSamplers();
        if (response.success) {
          availableSamplers.value = response.data.samplers;
          // 自动选择第一个可用采样器
          if (availableSamplers.value.length > 0) {
            config.sampler = availableSamplers.value[0];
            console.log("自动选择采样器:", config.sampler);
          }
        }
      } catch (error) {
        console.error("获取采样器列表失败:", error);
        ElMessage.warning("获取采样器列表失败，使用默认采样器");
        // 使用默认采样器
        availableSamplers.value = ["euler", "euler_a", "ddim", "dpmpp_2m"];
        config.sampler = "euler";
        console.log("使用默认采样器:", config.sampler);
      } finally {
        isLoadingSamplers.value = false;
      }
    };

    const generateImage = async () => {
      if (!config.prompt.trim()) {
        ElMessage.warning("请输入创意描述");
        return;
      }

      if (!config.model) {
        ElMessage.warning("请选择模型");
        return;
      }

      if (!config.sampler) {
        ElMessage.warning("请选择采样器");
        return;
      }

      // 检查积分余额
      if (userStore.userCredits < estimatedCredits.value) {
        ElMessage.error(
          `积分不足！需要 ${estimatedCredits.value} 积分，当前余额 ${userStore.userCredits} 积分`
        );
        return;
      }

      console.log("生成图片配置:", {
        model: config.model,
        sampler: config.sampler,
        prompt: config.prompt.substring(0, 50) + "...",
        estimatedCredits: estimatedCredits.value,
      });

      isGenerating.value = true;
      generationProgress.value = 0;

      try {
        // 生成前端taskId，提前订阅
        const frontendTaskId = `task_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        console.log("🎲 生成前端taskId:", frontendTaskId);

        // 预先订阅进度更新
        if (progressWS.getConnectionStatus().isConnected) {
          console.log("🔔 预订阅WebSocket进度更新");

          const success = progressWS.subscribeProgress(
            frontendTaskId,
            (progressData) => {
              console.log("📊 收到进度更新:", progressData);

              if (progressData.error || progressData.failed) {
                console.error("❌ 任务失败:", progressData.error);
                ElMessage.error(progressData.error || "生成失败");
                generationProgress.value = 0;
              } else if (progressData.completed) {
                console.log("✅ 任务完成");
                generationProgress.value = 100;
              } else if (progressData.percent !== undefined) {
                generationProgress.value = Math.min(progressData.percent, 99);

                // 更新详细进度信息
                progressDetail.value = {
                  step: progressData.step || 0,
                  totalSteps: progressData.totalSteps || 0,
                  title: progressData.title || "生成中...",
                };

                console.log(
                  `🎯 生成进度: ${progressData.percent}% (${progressData.step}/${progressData.totalSteps})`
                );
              }
            }
          );

          if (!success) {
            console.warn("⚠️ WebSocket进度订阅失败，使用模拟进度");
            startFallbackProgress();
          }
        } else {
          console.warn("⚠️ WebSocket未连接，使用模拟进度");
          startFallbackProgress();
        }

        // 调用真实的API接口，传递frontendTaskId
        console.log("开始调用生成API...");
        const response = await generateAPI.generateImage({
          prompt: config.prompt,
          negativePrompt: config.negativePrompt,
          model: config.model,
          size: config.size,
          batchSize: config.batchSize,
          cfgScale: config.cfgScale,
          steps: config.steps,
          seed: config.seed,
          sampler: config.sampler,
          clipSkip: config.clipSkip,
          frontendTaskId: frontendTaskId, // 传递前端生成的taskId
        });

        console.log("API调用完成，收到响应:", response);

        if (response.success) {
          // 只有在WebSocket未连接时才直接设置为100%
          if (!progressWS.getConnectionStatus().isConnected) {
            generationProgress.value = 100;
          }
          // 处理成功响应
          console.log("生成成功，处理图片数据:", response.data.images);
          generatedImages.value = response.data.images.map((img) => ({
            id: img.id,
            url: img.url,
            tempUrl: img.tempUrl,
            tempFileName: img.tempFileName,
            seed: img.seed,
            createdAt: img.createdAt,
            config: img.config,
            storageType: img.storageType || "temp",
            fileSize: img.fileSize,
            dimensions: img.dimensions,
          }));

          console.log("前端图片数据更新完成:", generatedImages.value);

          // 更新用户积分余额
          if (response.data.creditsRemaining !== null) {
            userStore.updateCredits(response.data.creditsRemaining);
            console.log("积分余额已更新:", response.data.creditsRemaining);
          }

          // 调试：打印图片URL信息
          generatedImages.value.forEach((img, index) => {
            console.log(`图片 ${index + 1}:`, {
              originalUrl: img.url,
              fullUrl: getFullImageUrl(img.url),
              tempUrl: img.tempUrl,
              tempFileName: img.tempFileName,
              storageType: img.storageType,
            });
          });

          const creditsUsed =
            response.data.creditsUsed || estimatedCredits.value;
          ElMessage.success(
            `创作完成！消耗 ${creditsUsed} 积分，余额 ${
              response.data.creditsRemaining || userStore.userCredits
            } 积分`
          );
        } else {
          console.error("API返回失败:", response);
          throw new Error(response.message || "生成失败");
        }
      } catch (error) {
        console.error("Generation error:", error);

        // 处理特定的错误类型
        if (error.response && error.response.status === 402) {
          // 积分不足错误
          const errorData = error.response.data;
          ElMessage.error(
            `积分不足！需要 ${
              errorData.data?.requiredCredits || estimatedCredits.value
            } 积分，当前余额 ${
              errorData.data?.currentCredits || userStore.userCredits
            } 积分`
          );

          // 刷新用户积分信息
          userStore.refreshCredits();
        } else {
          ElMessage.error(error.message || "生成失败，请重试");
        }
      } finally {
        isGenerating.value = false;
        generationProgress.value = 0;
        progressDetail.value = { step: 0, totalSteps: 0, title: "准备中..." };
      }
    };

    const showPreview = (image) => {
      previewImage.value = image;
      previewVisible.value = true;
    };

    const downloadImage = async (image) => {
      try {
        const filename = `ai_art_${image.seed}_${Date.now()}.png`;
        await downloadImageUtil(image.url, filename);
        ElMessage.success("图片下载成功");
      } catch (error) {
        console.error("下载失败:", error);
        ElMessage.error("下载失败，请重试");
      }
    };

    const downloadAll = async () => {
      try {
        const downloads = generatedImages.value.map(async (image, index) => {
          const filename = `ai_art_batch_${index + 1}_${image.seed}.png`;
          return downloadImageUtil(image.url, filename);
        });

        await Promise.all(downloads);
        ElMessage.success(`成功下载 ${generatedImages.value.length} 张图片`);
      } catch (error) {
        console.error("批量下载失败:", error);
        ElMessage.error("批量下载失败，请重试");
      }
    };

    // 监听标签输入变化
    const updateTags = () => {
      if (saveForm.tagsInput.trim()) {
        saveForm.tags = saveForm.tagsInput
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
      } else {
        saveForm.tags = [];
      }
    };

    // 打开保存对话框（单张图片）
    const saveToGalleryWithDialog = (image) => {
      if (!image.tempFileName && image.storageType !== "temp") {
        ElMessage.warning("该图片无法保存，可能已经保存过或来源异常");
        return;
      }

      currentSaveImage.value = image;
      // 重置表单
      saveForm.title = `AI创作-${new Date().toLocaleString()}`;
      saveForm.description =
        config.prompt.substring(0, 100) +
        (config.prompt.length > 100 ? "..." : "");
      saveForm.tagsInput = "";
      saveForm.tags = [];
      saveForm.isPublic = false;

      saveDialogVisible.value = true;
    };

    // 批量保存到画廊
    const saveToGallery = async () => {
      const tempImages = generatedImages.value.filter(
        (img) => img.storageType === "temp" && img.tempFileName
      );

      if (tempImages.length === 0) {
        ElMessage.warning("没有可保存的临时图片");
        return;
      }

      try {
        const results = await Promise.all(
          tempImages.map(async (image, index) => {
            return await worksAPI.saveWork({
              title: `AI创作-${new Date().toLocaleString()}-${index + 1}`,
              description:
                config.prompt.substring(0, 100) +
                (config.prompt.length > 100 ? "..." : ""),
              tempFileName: image.tempFileName,
              imageData: {
                seed: image.seed,
                promptId: image.id,
              },
              generationConfig: config,
              tags: ["AI生成", "自动保存"],
            });
          })
        );

        const successCount = results.filter((r) => r.success).length;
        if (successCount > 0) {
          ElMessage.success(`成功保存 ${successCount} 张作品到画廊`);
          // 更新图片状态，标记为已保存
          generatedImages.value = generatedImages.value.map((img) => {
            if (img.storageType === "temp" && img.tempFileName) {
              return { ...img, storageType: "saved" };
            }
            return img;
          });
        } else {
          ElMessage.error("保存失败，请重试");
        }
      } catch (error) {
        console.error("批量保存失败:", error);
        ElMessage.error("保存失败：" + (error.message || "未知错误"));
      }
    };

    // 确认保存单张作品
    const confirmSaveWork = async () => {
      if (!saveForm.title.trim()) {
        ElMessage.warning("请输入作品标题");
        return;
      }

      if (!currentSaveImage.value || !currentSaveImage.value.tempFileName) {
        ElMessage.error("图片数据异常，无法保存");
        return;
      }

      isSaving.value = true;

      try {
        // 更新标签
        updateTags();

        const response = await worksAPI.saveWork({
          title: saveForm.title.trim(),
          description: saveForm.description.trim(),
          tempFileName: currentSaveImage.value.tempFileName,
          imageData: {
            seed: currentSaveImage.value.seed,
            promptId: currentSaveImage.value.id,
          },
          generationConfig: config,
          tags: saveForm.tags,
        });

        if (response.success) {
          ElMessage.success("作品保存成功！");
          saveDialogVisible.value = false;

          // 更新该图片的状态
          const imageIndex = generatedImages.value.findIndex(
            (img) => img.id === currentSaveImage.value.id
          );
          if (imageIndex !== -1) {
            generatedImages.value[imageIndex] = {
              ...generatedImages.value[imageIndex],
              storageType: "saved",
              workId: response.data.work.id,
            };
          }
        } else {
          ElMessage.error("保存失败：" + (response.message || "未知错误"));
        }
      } catch (error) {
        console.error("保存作品失败:", error);
        ElMessage.error("保存失败：" + (error.message || "网络错误"));
      } finally {
        isSaving.value = false;
      }
    };

    const useAsReference = (image) => {
      ElMessageBox.confirm("是否使用此图片的参数作为新的生成配置？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "info",
      }).then(() => {
        Object.assign(config, image.config);
        ElMessage.success("参数已应用");
      });
    };

    const formatTime = (time) => {
      return new Date(time).toLocaleTimeString("zh-CN");
    };

    // 模拟进度更新（WebSocket失败时的回退方案）
    const startFallbackProgress = () => {
      const progressInterval = setInterval(() => {
        if (generationProgress.value < 90) {
          generationProgress.value += Math.random() * 8;
        }
      }, 800);

      // 保存interval引用以便清理
      return progressInterval;
    };

    // 组件挂载时获取模型和采样器列表
    onMounted(async () => {
      fetchAvailableModels();
      fetchAvailableSamplers();

      // 初始化WebSocket连接
      try {
        await progressWS.connect();
        console.log("✅ WebSocket连接初始化成功");
      } catch (error) {
        console.warn("⚠️ WebSocket连接失败，将使用模拟进度:", error);
      }
    });

    // 组件卸载时清理WebSocket连接
    onUnmounted(() => {
      progressWS.disconnect();
    });

    return {
      userStore,
      config,
      isGenerating,
      generationProgress,
      progressDetail,
      generatedImages,
      previewVisible,
      previewImage,
      advancedOpen,
      availableModels,
      isLoadingModels,
      availableSamplers,
      isLoadingSamplers,
      // 保存相关
      saveDialogVisible,
      isSaving,
      currentSaveImage,
      saveForm,
      // 方法
      fetchAvailableModels,
      fetchAvailableSamplers,
      estimatedCost,
      estimatedCredits,
      estimatedTime,
      formatCfgTooltip,
      formatStepsTooltip,
      randomSeed,
      generateImage,
      showPreview,
      downloadImage,
      downloadAll,
      saveToGallery,
      saveToGalleryWithDialog,
      confirmSaveWork,
      updateTags,
      useAsReference,
      formatTime,
      startFallbackProgress,
      // 图片处理工具
      getFullImageUrl,
      handleImageError,
    };
  },
};
</script>

<style scoped>
.create-page {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 1.5rem;
}

.create-container {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 1.5rem;
  max-width: 1600px;
  margin: 0 auto;
  height: calc(100vh - 2rem);
}

/* 左侧配置面板 */
.config-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all var(--transition-slow);
}

.config-panel:hover {
  box-shadow: var(--shadow-xl);
  transform: translateY(-2px);
}

.panel-header {
  padding: 2rem;
  border-bottom: 1px solid var(--border-light);
  background: linear-gradient(
    135deg,
    rgba(37, 99, 235, 0.02),
    rgba(14, 165, 233, 0.02)
  );
}

.panel-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  letter-spacing: -0.025em;
}

.panel-title .el-icon {
  color: var(--primary-color);
}

.panel-subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.5;
}

.config-content {
  flex: 1;
  padding: 0 2rem;
}

.config-section {
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border-light);
}

.config-section:last-child {
  border-bottom: none;
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  letter-spacing: -0.025em;
}

.section-title .el-icon {
  color: var(--primary-color);
}

.full-width {
  width: 100%;
}

.model-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* 风格选择 */
.style-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.8rem;
}

.style-card {
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.style-card:hover {
  border-color: var(--primary-color);
}

.style-card.active {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.style-preview {
  width: 100%;
  height: 60px;
  overflow: hidden;
}

.style-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.style-name {
  display: block;
  padding: 0.5rem;
  font-size: 0.8rem;
  background: #f8f9fa;
  color: var(--text-primary);
}

/* 底部按钮 */
.panel-footer {
  padding: 2rem;
  border-top: 1px solid var(--border-light);
  background: var(--bg-tertiary);
}

.generate-btn {
  width: 100%;
  height: 52px;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  border-radius: var(--radius-lg);
  letter-spacing: 0.025em;
  transition: all var(--transition-normal);
}

.generate-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.cost-info {
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
}

.balance-info {
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-lg);
  background: rgba(37, 99, 235, 0.05);
  border: 1px solid rgba(37, 99, 235, 0.1);
  transition: all var(--transition-normal);
  font-weight: 500;
}

.balance-info.insufficient {
  color: var(--danger-color);
  background: rgba(220, 38, 38, 0.05);
  border: 1px solid rgba(220, 38, 38, 0.2);
}

.insufficient-text {
  color: var(--danger-color);
  font-weight: 600;
  font-size: 0.8rem;
}

/* 右侧结果面板 */
.result-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all var(--transition-slow);
}

.result-panel:hover {
  box-shadow: var(--shadow-xl);
  transform: translateY(-2px);
}

.result-header {
  padding: 2rem;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(
    135deg,
    rgba(37, 99, 235, 0.02),
    rgba(14, 165, 233, 0.02)
  );
}

.result-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.025em;
}

.result-actions {
  display: flex;
  gap: 0.75rem;
}

.result-actions .el-button {
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: all var(--transition-normal);
}

.result-actions .el-button:hover {
  transform: translateY(-1px);
}

.result-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

/* 生成中状态 */
.generating-state {
  text-align: center;
  padding: 4rem 2rem;
}

.generating-animation {
  color: var(--primary-color);
  animation: pulse 2s infinite;
  margin-bottom: 1.5rem;
}

.generating-state h4 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  letter-spacing: -0.025em;
}

.generating-state p {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}

.progress-detail {
  font-weight: 500;
  color: var(--primary-color);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}

/* 结果网格 */
.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}

.result-item {
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
}

.result-item:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.image-container {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all var(--transition-slow);
}

.image-container:hover img {
  transform: scale(1.08);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  opacity: 0;
  transition: all var(--transition-normal);
}

.image-overlay .el-button {
  border-radius: 50%;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.image-overlay .el-button:hover {
  background: white;
  transform: scale(1.1);
}

.result-item:hover .image-overlay {
  opacity: 1;
}

.image-info {
  padding: 1rem;
}

.image-seed,
.image-time {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 0.25rem 0;
  font-weight: 500;
}

/* 空状态 */
.empty-result {
  padding: 4rem 2rem;
  text-align: center;
}

.empty-tips h4 {
  color: var(--text-primary);
  margin-bottom: 1rem;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.025em;
}

.empty-tips p {
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 0.95rem;
  max-width: 400px;
  margin: 0 auto;
}

/* 预览对话框 */
.preview-container {
  text-align: center;
}

.preview-container img {
  max-width: 100%;
  max-height: 70vh;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

/* 保存对话框样式 */
.tags-preview {
  margin-top: 12px;
}

.form-tip {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 6px;
  line-height: 1.4;
}

.dialog-footer {
  text-align: right;
}

.dialog-footer .el-button {
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: all var(--transition-normal);
}

.dialog-footer .el-button:hover {
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .create-container {
    grid-template-columns: 350px 1fr;
  }
}

@media (max-width: 900px) {
  .create-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
    height: auto;
  }

  .config-panel {
    height: auto;
  }

  .result-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}

@media (max-width: 640px) {
  .create-page {
    padding: 0.5rem;
  }

  .style-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
