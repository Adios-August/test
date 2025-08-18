import { http } from "../../utils/request";

// 首页相关API
export const homeAPI = {
  // 获取分类树
  getCategoryTree: () => {
    return http.get("/categories/tree");
  },

  // 获取热门知识
  getPopularKnowledge: (limit) => {
    return http.get("/knowledge/popular", { limit });
  },

  // 获取最新知识
  getLatestKnowledge: (limit) => {
    return http.get("/knowledge/latest", { limit });
  },

  // 获取最热资料
  getHotDownloads: (limit) => {
    return http.get("/knowledge/hot-downloads", { limit });
  },

  // 获取推荐问题
  getRecommendedQuestions: (limit = 3) => {
    return http.get("/search/recommendations", { limit });
  },
};

export default homeAPI;
