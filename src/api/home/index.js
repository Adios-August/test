import { http } from '../../utils/request';
import authStore from '../../stores/authStore';

// 首页相关API
export const homeAPI = {
  // 获取完整知识树（兼容端点，内部由知识树生成）
  getKnowledgeFullTree: () => {
    return http.get("/categories/tree");
  },

  // 获取热门知识
  getPopularKnowledge: (limit) => {
    return http.get("/knowledge/popular", { 
      limit, 
      workspace: authStore.currentWorkspace 
    });
  },

  // 获取最新知识
  getLatestKnowledge: (limit) => {
    return http.get("/knowledge/latest", { 
      limit, 
      workspace: authStore.currentWorkspace 
    });
  },

  // 获取最热资料
  getHotDownloads: (limit) => {
    return http.get("/knowledge/hot-downloads", { 
      limit, 
      workspace: authStore.currentWorkspace 
    });
  },

  // 获取推荐问题
  getRecommendedQuestions: (limit = 3) => {
    return http.get("/search/recommendations", { limit });
  },

  // 获取历史问题
  getHistoryQuestions: (userId) => {
    return http.get(`/search/history/user/${userId}`);
  },
};

export default homeAPI;
