import { http } from "../../utils/request";

// 反馈相关API
export const feedbackAPI = {
  // 提交反馈（点赞/点踩）
  submitFeedback: (data) => {
    return http.post("/engagement/feedback", data);
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
};

export default feedbackAPI;
