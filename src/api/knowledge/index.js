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

  // 创建知识
  createKnowledge: (data) => {
    return http.post("/knowledge/create", data);
  },

  // 上传图片
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return http.post("/uploads/image", formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // 上传附件
  uploadAttachment: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return http.post("/uploads/attachment", formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

export default knowledgeAPI;
