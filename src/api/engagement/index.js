import { http } from "../../utils/request";

export const engagementAPI = {
  // 针对知识（旧接口，仍保留）
  like: (knowledgeId, userId = 1) => {
    return http.post(`/engagement/like/${knowledgeId}`, { userId });
  },
  unlike: (knowledgeId, userId = 1) => {
    return http.post(`/engagement/unlike/${knowledgeId}`, { userId });
  },
  feedback: (knowledgeId, content = "", userId = 1) => {
    // 后端使用 @RequestParam 接收，将参数放在 query/body 都可
    return http.post(`/engagement/feedback/${knowledgeId}`, { content, userId });
  },
  // 针对AI回答（新接口，按 sessionId + messageId）
  likeAnswer: (sessionId, messageId, userId = 1) => {
    return http.post(`/chat/answer/${sessionId}/${messageId}/like`, { userId });
  },
  dislikeAnswer: (sessionId, messageId, content = "", userId = 1) => {
    return http.post(`/chat/answer/${sessionId}/${messageId}/dislike`, { content, userId });
  },
};

export default engagementAPI;


