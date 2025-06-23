const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 尝试加载Sharp，如果失败则使用备选方案
let sharp = null;
try {
  sharp = require('sharp');
  console.log('✅ Sharp图片处理库加载成功');
} catch (error) {
  console.warn('⚠️ Sharp库加载失败，将使用备选图片处理方案:', error.message);
}

class FileManager {
  constructor() {
    this.baseUploadPath = path.join(__dirname, '../public/uploads');
    this.tempPath = path.join(this.baseUploadPath, 'temp');
    this.worksPath = path.join(this.baseUploadPath, 'works');
    this.thumbnailsPath = path.join(this.baseUploadPath, 'thumbnails');
    
    this.ensureDirectories();
  }

  /**
   * 确保所有必要的目录存在
   */
  async ensureDirectories() {
    const dirs = [this.tempPath, this.worksPath, this.thumbnailsPath];
    for (const dir of dirs) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
        console.log(`创建目录: ${dir}`);
      }
    }
  }

  /**
   * 从ComfyUI下载图片到temp目录
   * @param {string} comfyuiImageUrl - ComfyUI图片URL
   * @param {Object} metadata - 图片元数据
   * @returns {Promise<Object>} 保存结果
   */
  async saveToTemp(comfyuiImageUrl, metadata = {}) {
    try {
      const axios = require('axios');
      
      // 生成临时文件名
      const tempFileName = `temp_${Date.now()}_${uuidv4()}.png`;
      const tempFilePath = path.join(this.tempPath, tempFileName);
      
      console.log('正在下载图片:', comfyuiImageUrl);
      
      // 下载图片
      const response = await axios({
        method: 'GET',
        url: comfyuiImageUrl,
        responseType: 'stream',
        timeout: 30000
      });
      
      // 保存到临时目录
      const writer = require('fs').createWriteStream(tempFilePath);
      response.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      // 获取文件信息
      const stats = await fs.stat(tempFilePath);
      const dimensions = await this.getImageDimensions(tempFilePath);
      
      // 生成临时访问URL
      const tempUrl = `/uploads/temp/${tempFileName}`;
      
      console.log(`图片已保存到临时目录: ${tempFileName}`);
      
      return {
        success: true,
        tempPath: tempFilePath,
        tempUrl: tempUrl,
        fileName: tempFileName,
        fileSize: stats.size,
        dimensions: dimensions,
        metadata: metadata
      };
      
    } catch (error) {
      console.error('保存图片到临时目录失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 将图片从temp目录移动到works目录（保存到画廊）
   * @param {string} tempFileName - 临时文件名
   * @param {number} userId - 用户ID
   * @param {Object} workData - 作品数据
   * @returns {Promise<Object>} 移动结果
   */
  async moveToWorks(tempFileName, userId, workData = {}) {
    try {
      const tempFilePath = path.join(this.tempPath, tempFileName);
      
      // 检查临时文件是否存在
      try {
        await fs.access(tempFilePath);
      } catch {
        throw new Error('临时文件不存在');
      }
      
      // 生成永久文件名
      const timestamp = Date.now();
      const permanentFileName = `work_${userId}_${timestamp}_${uuidv4()}.png`;
      const permanentFilePath = path.join(this.worksPath, permanentFileName);
      
      // 移动文件
      await fs.rename(tempFilePath, permanentFilePath);
      
      // 生成缩略图
      const thumbnailResult = await this.generateThumbnail(permanentFilePath, permanentFileName);
      
      // 获取文件信息
      const stats = await fs.stat(permanentFilePath);
      const dimensions = await this.getImageDimensions(permanentFilePath);
      
      // 生成访问URL
      const imageUrl = `/uploads/works/${permanentFileName}`;
      
      console.log(`图片已移动到永久目录: ${permanentFileName}`);
      
      return {
        success: true,
        imageUrl: imageUrl,
        thumbnailUrl: thumbnailResult.thumbnailUrl,
        fileName: permanentFileName,
        fileSize: stats.size,
        dimensions: dimensions,
        storageType: 'local',
        storagePath: permanentFilePath
      };
      
    } catch (error) {
      console.error('移动图片到永久目录失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 生成缩略图
   * @param {string} originalPath - 原图路径
   * @param {string} originalFileName - 原图文件名
   * @returns {Promise<Object>} 缩略图结果
   */
  async generateThumbnail(originalPath, originalFileName) {
    try {
      const thumbnailFileName = `thumb_${originalFileName}`;
      const thumbnailPath = path.join(this.thumbnailsPath, thumbnailFileName);
      
      if (sharp) {
        // 使用Sharp生成缩略图
        await sharp(originalPath)
          .resize(300, 300, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);
        
        console.log(`✅ 使用Sharp生成缩略图: ${thumbnailFileName}`);
      } else {
        // 备选方案：直接复制原图作为缩略图
        console.log(`⚠️ Sharp不可用，使用原图作为缩略图: ${thumbnailFileName}`);
        await fs.copyFile(originalPath, thumbnailPath);
      }
      
      const thumbnailUrl = `/uploads/thumbnails/${thumbnailFileName}`;
      
      return {
        success: true,
        thumbnailUrl: thumbnailUrl,
        thumbnailPath: thumbnailPath
      };
      
    } catch (error) {
      console.error('生成缩略图失败:', error);
      return {
        success: false,
        thumbnailUrl: null,
        error: error.message
      };
    }
  }

  /**
   * 获取图片尺寸
   * @param {string} imagePath - 图片路径
   * @returns {Promise<Object>} 图片尺寸信息
   */
  async getImageDimensions(imagePath) {
    try {
      if (sharp) {
        const metadata = await sharp(imagePath).metadata();
        return {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format
        };
      } else {
        // 备选方案：返回默认尺寸
        console.log('⚠️ Sharp不可用，返回默认图片尺寸');
        return { 
          width: 1024, 
          height: 1024, 
          format: 'png' 
        };
      }
    } catch (error) {
      console.error('获取图片尺寸失败:', error);
      return { width: 0, height: 0, format: 'unknown' };
    }
  }

  /**
   * 删除文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>} 删除结果
   */
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      console.log(`文件已删除: ${filePath}`);
      return true;
    } catch (error) {
      console.error('删除文件失败:', error);
      return false;
    }
  }

  /**
   * 清理过期的临时文件（超过1小时）
   * @returns {Promise<number>} 清理的文件数量
   */
  async cleanupTempFiles() {
    try {
      const files = await fs.readdir(this.tempPath);
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      let cleanedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(this.tempPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < oneHourAgo) {
          await this.deleteFile(filePath);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`清理了 ${cleanedCount} 个过期临时文件`);
      }
      
      return cleanedCount;
    } catch (error) {
      console.error('清理临时文件失败:', error);
      return 0;
    }
  }

  /**
   * 删除作品文件（包括主图和缩略图）
   * @param {Array} imageUrls - 图片URL数组
   * @param {string} thumbnailUrl - 缩略图URL
   * @returns {Promise<Object>} 删除结果
   */
  async deleteWork(imageUrls, thumbnailUrl) {
    const result = {
      success: true,
      deletedFiles: [],
      errors: []
    };

    try {
      // 删除主图片文件
      if (imageUrls && Array.isArray(imageUrls)) {
        for (const imageUrl of imageUrls) {
          try {
            // 从URL中提取文件路径
            const fileName = path.basename(imageUrl);
            const filePath = path.join(this.worksPath, fileName);
            
            if (await this.fileExists(filePath)) {
              await this.deleteFile(filePath);
              result.deletedFiles.push(filePath);
              console.log(`删除主图片文件: ${filePath}`);
            }
          } catch (error) {
            result.errors.push(`删除主图片失败: ${error.message}`);
            console.error('删除主图片文件失败:', error);
          }
        }
      }

      // 删除缩略图文件
      if (thumbnailUrl) {
        try {
          const thumbnailFileName = path.basename(thumbnailUrl);
          const thumbnailPath = path.join(this.thumbnailsPath, thumbnailFileName);
          
          if (await this.fileExists(thumbnailPath)) {
            await this.deleteFile(thumbnailPath);
            result.deletedFiles.push(thumbnailPath);
            console.log(`删除缩略图文件: ${thumbnailPath}`);
          }
        } catch (error) {
          result.errors.push(`删除缩略图失败: ${error.message}`);
          console.error('删除缩略图文件失败:', error);
        }
      }

      if (result.errors.length > 0) {
        result.success = false;
      }

      return result;
    } catch (error) {
      console.error('删除作品文件失败:', error);
      return {
        success: false,
        deletedFiles: [],
        errors: [error.message]
      };
    }
  }

  /**
   * 获取文件存储统计信息
   * @returns {Promise<Object>} 存储统计
   */
  async getStorageStats() {
    try {
      const tempFiles = await fs.readdir(this.tempPath);
      const workFiles = await fs.readdir(this.worksPath);
      const thumbnailFiles = await fs.readdir(this.thumbnailsPath);
      
      return {
        tempFiles: tempFiles.length,
        workFiles: workFiles.length,
        thumbnailFiles: thumbnailFiles.length,
        lastCleanup: new Date().toISOString()
      };
    } catch (error) {
      console.error('获取存储统计失败:', error);
      return {};
    }
  }
}

// 创建单例实例
const fileManager = new FileManager();

// 设置定时清理任务（每小时执行一次）
setInterval(() => {
  fileManager.cleanupTempFiles();
}, 60 * 60 * 1000);

module.exports = fileManager;