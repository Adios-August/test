import { http } from "../../utils/request";

// 知识库相关API
export const knowledgeAPI = {
  // 获取知识库列表
  getKnowledgeList: (params) => {
    return http.get("/knowledge/list", params);
  },

  // 获取分类下的知识列表
  getCategoryKnowledge: (categoryId, params) => {
    return http.get(`/knowledge/category/${categoryId}`, params);
  },

  // 搜索知识列表
  searchKnowledge: (params) => {
    return http.get("/knowledge/search", params);
  },

  // 搜索知识（使用新的搜索接口）
  searchKnowledgeByQuery: (data) => {
    return http.post("/search", data);
  },
};

export default knowledgeAPI;
