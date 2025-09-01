import { http } from "../../utils/request";

export const engagementAPI = {
  // 针对知识（旧接口，仍保留）
  like: (knowledgeId, userId) => {
    return http.post(`/engagement/like/${knowledgeId}`, { userId });
  },
  unlike: (knowledgeId, userId) => {
    return http.post(`/engagement/unlike/${knowledgeId}`, { userId });
  },
  feedback: (knowledgeId, content = "", userId) => {
    // 后端使用 @RequestParam 接收，将参数放在 query/body 都可
    return http.post(`/engagement/feedback/${knowledgeId}`, { content, userId });
  },
  // 针对AI回答（新接口，按 sessionId + messageId）
  likeAnswer: (sessionId, messageId, userId) => {
    return http.post(`/chat/answer/${sessionId}/${messageId}/like`, { userId });
  },
  dislikeAnswer: (sessionId, messageId, content = "", userId) => {
    return http.post(`/chat/answer/${sessionId}/${messageId}/dislike`, { content, userId });
  },
  // 查询收藏状态
  getFavoriteStatus: (knowledgeId) => {
    return http.get(`/engagement/favorite/status/${knowledgeId}`);
  },
  // 添加收藏
  addFavorite: (knowledgeId, userId) => {
    return http.post(`/engagement/favorite/${knowledgeId}`, { userId });
  },
  // 取消收藏
  removeFavorite: (knowledgeId, userId) => {
    return http.post(`/engagement/unfavorite/${knowledgeId}`, { userId });
  },
};

export default engagementAPI;
