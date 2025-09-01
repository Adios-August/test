import { http } from "../../utils/request";
import { KNOWLEDGE_FEEDBACK_TYPES } from "../../constants/feedbackTypes";

// 反馈相关API
export const feedbackAPI = {
  // 提交反馈（针对知识内容的反馈）
  // 接口：POST /api/engagement/feedback/{knowledgeId}
  // 参数：content, feedbackType, userId (作为请求体数据)
  // feedbackType 可选值：out_of_date|unclear|not_relevant
  submitFeedback: (knowledgeId, content, feedbackType, userId) => {
    const data = {
      content: content || "",
      feedbackType: feedbackType || "",
      userId: userId,
    };
    return http.post(`/engagement/feedback/${knowledgeId}`, data);
  },

  // 获取反馈列表
  getFeedbackList: (params) => {
    return http.get("/engagement/feedbacks", params);
  },

  // 删除反馈
  deleteFeedback: (id) => {
    return http.delete(`/engagement/feedback/${id}`);
  },

  // 获取消息的反馈状态
  getMessageFeedback: (messageId) => {
    return http.get(`/engagement/feedback/message/${messageId}`);
  },

  // 获取反馈类型枚举列表
  getFeedbackTypes: () => {
    return http.get("/engagement/feedback/types");
  },
};

export default feedbackAPI;
