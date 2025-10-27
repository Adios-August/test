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
    
    // 使用基础URL /api，路径中不再包含 /api
    await http.post('/search/history', {
      userId,
      query: query.trim()
    });
  } catch (error) {
    console.error('添加搜索历史失败:', error);
    // 不显示错误消息，静默失败
  }
};

// 删除搜索历史
export const deleteSearchHistory = async (id) => {
  try {
    if (!id && id !== 0) return;
    // 使用基础URL /api，路径中不再包含 /api
    await http.delete(`/search/history/${id}`);
  } catch (error) {
    console.error('删除搜索历史失败:', error);
  }
};