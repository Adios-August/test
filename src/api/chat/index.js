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

  // 删除会话
  deleteSession: (sessionId) => {
    return http.delete(`/chat/sessions/${sessionId}`);
  },

  // 重命名会话
  renameSession: (sessionId, newName) => {
    return http.put(`/chat/sessions/${sessionId}`, { sessionName: newName });
  },

  // 新增会话
  createSession: (data) => {
    return http.post("/chat/sessions", data);
  },
};

export default chatAPI;
