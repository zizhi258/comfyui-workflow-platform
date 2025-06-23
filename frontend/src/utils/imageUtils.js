// 图片URL处理工具

/**
 * 获取完整的图片URL
 * @param {string} imageUrl - 图片URL（可能是相对路径）
 * @returns {string} 完整的图片URL
 */
export function getFullImageUrl(imageUrl) {
  if (!imageUrl) return '';
  
  // 如果已经是完整URL，直接返回
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // 确保URL以/开头
  const cleanUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  
  // 在开发环境中，Vite会代理/uploads路径到后端
  // 在生产环境中，可能需要完整的服务器地址
  const isDev = import.meta.env.MODE === 'development';
  
  if (isDev) {
    // 开发环境：使用相对路径，Vite会自动代理
    return cleanUrl;
  } else {
    // 生产环境：使用完整URL
    const baseUrl = window.location.origin;
    return `${baseUrl}${cleanUrl}`;
  }
}

/**
 * 处理图片加载错误
 * @param {Event} event - 图片加载错误事件
 */
export function handleImageError(event) {
  console.error('图片加载失败:', event.target.src);
  
  // 设置默认占位图
  event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNTAgMTAwQzEyNy45MSAxMDAgMTEwIDExNy45MSAxMTAgMTQwQzExMCAxNjIuMDkgMTI3LjkxIDE4MCAxNTAgMTgwQzE3Mi4wOSAxODAgMTkwIDE2Mi4wOSAxOTAgMTQwQzE5MCAxMTcuOTEgMTcyLjA5IDEwMCAxNTAgMTAwWiIgZmlsbD0iI0Q0RURGQyIvPgo8cGF0aCBkPSJNMjAwIDIxMEgyMDBMMTcwIDEzMEwxMzAgMTgwTDEwMCAxNDBMMTAwIDIxMEgyMDBaIiBmaWxsPSIjRDRFREZDIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMjQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5IiBmb250LXNpemU9IjE0IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPuWbvueJh+WKoOi9veWksei0pTwvdGV4dD4KPC9zdmc+';
}

/**
 * 预加载图片
 * @param {string} imageUrl - 图片URL
 * @returns {Promise<boolean>} 是否加载成功
 */
export function preloadImage(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = getFullImageUrl(imageUrl);
  });
}

/**
 * 下载图片
 * @param {string} imageUrl - 图片URL
 * @param {string} filename - 下载文件名
 */
export async function downloadImage(imageUrl, filename = 'image.png') {
  try {
    const fullUrl = getFullImageUrl(imageUrl);
    
    // 创建一个临时的a标签来触发下载
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = filename;
    link.target = '_blank'; // 在新标签页打开，避免跨域问题
    
    // 如果是同域，直接下载
    if (fullUrl.startsWith(window.location.origin) || fullUrl.startsWith('/')) {
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // 跨域情况下，先尝试fetch下载
      try {
        const response = await fetch(fullUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 清理对象URL
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } catch (fetchError) {
        console.warn('Fetch下载失败，尝试直接打开:', fetchError);
        // 如果fetch失败，在新窗口打开
        window.open(fullUrl, '_blank');
      }
    }
  } catch (error) {
    console.error('下载图片失败:', error);
    throw error;
  }
}