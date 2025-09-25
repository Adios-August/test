import { http } from "../../utils/request";

// 知识库相关API
export const knowledgeAPI = {
  // 获取知识库列表（现在只返回顶层目录）
  getKnowledgeList: (params) => {
    return http.get("/knowledge", params);
  },

  // 获取父知识下的子节点（用于懒加载子目录）
  getChildren: (parentId, params) => {
    return http.get(`/knowledge/${parentId}/children`, params);
  },

  // 搜索知识列表
  searchKnowledge: (params) => {
    return http.get("/knowledge/search", params);
  },

  // 搜索知识（使用新的搜索接口）
  searchKnowledgeByQuery: (data) => {
    return http.post("/search", data);
  },

  // 获取知识详情
  getKnowledgeDetail: (id) => {
    return http.get(`/knowledge/${id}`);
  },

  // 创建知识
  createKnowledge: (data) => {
    return http.post("/knowledge", data);
  },

  // 更新知识
  updateKnowledge: (id, data) => {
    return http.put(`/knowledge/${id}`, data);
  },

  // 删除知识
  deleteKnowledge: (id) => {
    return http.delete(`/knowledge/${id}`);
  },

  // 上传图片
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append("image", file);
    return http.post("/uploads/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // 上传附件
  uploadAttachment: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return http.post("/uploads/attachment", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // 为特定知识上传附件
  uploadKnowledgeAttachment: (knowledgeId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return http.post(`/knowledge/${knowledgeId}/document`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteKnowledgeAttachment: (knowledgeId, attachmentId) => {
    return http.delete(`/knowledge/${knowledgeId}/document/${attachmentId}`);
  },
  
  // 收藏知识
  favoriteKnowledge: (knowledgeId) => {
    return http.post(`/engagement/favorite/${knowledgeId}`);
  },

  // 取消收藏知识
  unfavoriteKnowledge: (knowledgeId) => {
    return http.delete(`/engagement/favorite/${knowledgeId}`);
  },

  // 获取收藏列表
  getFavorites: (params) => {
    return http.get("/engagement/favorites", params);
  },
};

export default knowledgeAPI;
