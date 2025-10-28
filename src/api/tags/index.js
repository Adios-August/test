import { http } from '../../utils/request';

// 标签相关API
export const tagsAPI = {
  // 获取所有标签
  getAllTags: () => {
    return http.get("/api/tags/all");
  },

  // 搜索标签
  searchTags: (keyword, limit = 10) => {
    return http.get("/api/tags/search", { keyword, limit });
  },

  // 获取标签建议
  suggestTags: (input, limit = 5) => {
    return http.get("/api/tags/suggest", { input, limit });
  },

  // 获取热门标签
  getPopularTags: (limit = 20) => {
    return http.get("/api/tags/popular", { limit });
  },

  // 获取标签统计
  getTagStatistics: () => {
    return http.get("/api/tags/statistics");
  }
};

export default tagsAPI;
