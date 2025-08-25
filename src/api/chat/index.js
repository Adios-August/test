import { http } from "../../utils/request";

// AI对话相关API
export const chatAPI = {
  // RAG流式对话接口
  chatStream: (data) => {
    return http.post("/chat/stream", data);
  },

  // 非流式对话接口（如果需要）
  chat: (data) => {
    return http.post("/chat", data);
  },

  // 获取会话列表
  getSessions: (userId) => {
    const params = userId ? { userId } : undefined;
    return http.get("/chat/sessions", params);
  },

  // 获取会话历史
  getHistory: (sessionId, params) => {
    return http.get(`/chat/history/${sessionId}`, params);
  },
};

export default chatAPI;
