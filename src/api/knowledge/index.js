import { http } from "../../utils/request";

// 知识库相关API
export const knowledgeAPI = {
  // 获取知识库列表
  getKnowledgeList: (params) => {
    return http.get("/knowledge/list", params);
  },
};

export default knowledgeAPI;
