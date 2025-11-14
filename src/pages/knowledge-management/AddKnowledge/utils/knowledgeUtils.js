// Tag validation utility
export const validateTag = (tag) => {
  const trimmedTag = tag.trim();
  // Length validation (by Unicode code points)
  if (Array.from(trimmedTag).length > 10) {
    return { valid: false, message: `标签'${trimmedTag}'超过 10 个字符` };
  }
  // Content validation (forbid commas and newlines)
  if (trimmedTag.includes(',') || trimmedTag.includes('\n')) {
    return { valid: false, message: '标签不可包含逗号或换行' };
  }
  return { valid: true, tag: trimmedTag };
};

// Tag normalization utility (NFKC normalization)
export const normalizeTag = (tag) => {
  return tag.normalize('NFKC').toLowerCase();
};

// Check if content is empty
export const isContentEmpty = (html) => {
  if (!html) return true;
  // Remove all HTML tags
  const textOnly = html.replace(/<[^>]*>/g, '');
  // Convert &nbsp; / &#160; to spaces
  const decoded = textOnly.replace(/&nbsp;|&#160;/g, ' ');
  // Remove all whitespace
  const cleaned = decoded.replace(/\s/g, '');
  return cleaned.length === 0;
};

// Throttle function
export const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;
  return function (...args) {
    const currentTime = Date.now();
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

// Convert API data to TreeSelect format
export const convertToTreeData = (categories) => {
  return categories.map(category => ({
    title: category.name,
    value: category.id,
    key: category.id,
    // 根据nodeType添加不同的图标和样式
    icon: category.nodeType === 'folder' ? '📁' : '📄',
    isLeaf: category.nodeType === 'doc',
    // 添加nodeType信息
    nodeType: category.nodeType,
    children: category.children && category.children.length > 0 
      ? convertToTreeData(category.children) 
      : undefined
  }));
};

// Form validation
// 允许通过 options 控制是否跳过某些校验，例如创建一级类目(parentId=0)时某些字段被隐藏
export const validateKnowledgeForm = (formData, contentHtml, options = {}) => {
  const { 
    allowNoCategory = false,
    skipTags = false,
    skipVisibility = false,
    skipEffectiveTime = false,
    skipContent = false,
    skipDisclaimer = false
  } = options;
  const errors = [];
  // Title validation
  if (!formData.title.trim()) {
    errors.push({ field: 'title', message: '请输入标题' });
  }
  // Category validation
  if (!allowNoCategory && (formData.category === null || formData.category === undefined || formData.category === '')) {
    errors.push({ field: 'category', message: '请选择分类' });
  }
  // Content validation
  if (!skipContent && isContentEmpty(contentHtml)) {
    errors.push({ field: 'content', message: '请填写正文内容' });
  }
  // Required fields validation
  // Tags validation
  if (!skipTags && (!formData.tags || formData.tags.length === 0)) {
    errors.push({ field: 'tags', message: '请至少添加一个标签' });
  }
  // Visibility validation
  if (!skipVisibility && (!formData.privateToRoles || formData.privateToRoles.length === 0)) {
    errors.push({ field: 'privateToRoles', message: '请选择可见范围' });
  }
  // Effective time validation
  if (!skipEffectiveTime) {
    const [startTime, endTime] = formData.effectiveTime;
    if (!startTime || !endTime) {
      errors.push({ field: 'effectiveTime', message: '请设置有效时间' });
    } else if (startTime >= endTime) {
      errors.push({ field: 'effectiveTime', message: '结束时间需晚于开始时间' });
    }
  }
  // Table validation
  if (formData.tableData) {
    try {
      const { validateTableData } = require('./tableUtils');
      const tableErrors = validateTableData(formData.tableData);
      if (tableErrors.length > 0) {
        errors.push({ field: 'table', message: tableErrors[0].message });
      }
    } catch (error) {
      console.warn('Table validation error:', error);
      // Don't block form submission if table validation fails
    }
  }
  // Disclaimer validation
  if (!skipDisclaimer && !formData.disclaimer) {
    errors.push({ field: 'disclaimer', message: '请确认内容不包含受限数据' });
  }
  return errors;
};
