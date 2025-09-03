/**
 * HTML处理工具函数
 */

/**
 * 清理HTML标签，获取纯文本内容
 * @param {string} htmlString - 包含HTML标签的字符串
 * @returns {string} 清理后的纯文本
 */
export const stripHtmlTags = (htmlString) => {
  if (!htmlString || typeof htmlString !== 'string') {
    return htmlString || '';
  }
  
  // 如果内容不包含HTML标签，直接返回
  if (!htmlString.includes('<')) {
    return htmlString;
  }
  
  try {
    // 创建临时DOM元素来解析HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    
    // 获取纯文本内容
    const textContent = tempDiv.textContent || tempDiv.innerText || htmlString;
    
    // 清理临时元素
    tempDiv.remove();
    
    return textContent;
  } catch (error) {
    console.warn('HTML标签清理失败:', error);
    // 如果解析失败，使用正则表达式移除标签
    return htmlString.replace(/<[^>]*>/g, '');
  }
};

/**
 * 修复HTML中的相对链接，将不完整的URL转换为绝对URL
 * @param {string} htmlString - 包含HTML的字符串
 * @returns {string} 修复链接后的HTML字符串
 */
export const sanitizeHtmlLinks = (htmlString) => {
  if (!htmlString || typeof htmlString !== 'string') {
    return htmlString || '';
  }
  
  // 创建临时DOM元素来解析和修改HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlString;
  
  // 查找所有带href属性的a标签
  const links = tempDiv.querySelectorAll('a[href]');
  
  links.forEach(link => {
    const href = link.getAttribute('href');
    
    // 检查href是否是应该转换为绝对URL的相对URL
    if (href && 
        !href.startsWith('http://') && 
        !href.startsWith('https://') && 
        !href.startsWith('mailto:') && 
        !href.startsWith('tel:') && 
        !href.startsWith('#') && 
        !href.startsWith('/') &&
        (href.includes('.') || href.includes('www.'))) {
      
      // 为类似域名的URL添加https://前缀
      if (href.startsWith('www.') || /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}/.test(href)) {
        link.setAttribute('href', `https://${href}`);
      }
    }
    
    // 为外部链接添加target="_blank"以提升用户体验
    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
  
  const result = tempDiv.innerHTML;
  
  // 清理临时元素
  tempDiv.remove();
  
  return result;
};

/**
 * 检查字符串是否包含HTML标签
 * @param {string} str - 要检查的字符串
 * @returns {boolean} 是否包含HTML标签
 */
export const containsHtml = (str) => {
  if (!str || typeof str !== 'string') {
    return false;
  }
  return /<[^>]*>/g.test(str);
};

/**
 * 安全地渲染HTML内容，修复链接并清理危险内容
 * @param {string} htmlString - HTML字符串
 * @param {Object} options - 配置选项
 * @param {boolean} options.fixLinks - 是否修复链接，默认true
 * @param {boolean} options.stripTags - 是否只返回纯文本，默认false
 * @returns {string} 处理后的内容
 */
export const safeRenderHtml = (htmlString, options = {}) => {
  const { fixLinks = true, stripTags = false } = options;
  
  if (!htmlString) {
    return '';
  }
  
  if (stripTags) {
    return stripHtmlTags(htmlString);
  }
  
  if (fixLinks) {
    return sanitizeHtmlLinks(htmlString);
  }
  
  return htmlString;
};
