import { http } from "../../utils/request";

// AI对话相关API
export const chatAPI = {
  // RAG流式对话接口
  chatStream: (data) => {
    return http.post("/api/chat/stream", data);
  },

  // 非流式对话接口（如果需要）
  chat: (data) => {
    return http.post("/api/chat", data);
  },
};

export default chatAPI;
