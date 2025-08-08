import { http } from "../../utils/request";

// 首页相关API
export const homeAPI = {
  // 获取热门知识列表
  getPopularKnowledge: (limit = 10) => {
    return http.get("/knowledge/popular", { limit });
  },

  // 获取最新知识列表
  getLatestKnowledge: (limit = 10) => {
    return http.get("/knowledge/latest", { limit });
  },

  // 获取分类树
  getCategoryTree: () => {
    return http.get("/categories/tree");
  },
};

export default homeAPI;
