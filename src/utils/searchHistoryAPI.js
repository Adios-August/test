import { http } from './request';

// 添加搜索历史
export const addSearchHistory = async (query) => {
  try {
    // 从localStorage获取用户信息
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userId = userInfo.id;
    
    if (!userId || !query || !query.trim()) {
      return;
    }
    
    await http.post('/api/search/history', {
      userId,
      query: query.trim()
    });
  } catch (error) {
    console.error('添加搜索历史失败:', error);
    // 不显示错误消息，静默失败
  }
};