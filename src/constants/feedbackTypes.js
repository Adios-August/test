// 反馈类型常量

// 知识内容反馈类型（用于 /api/engagement/feedback/{knowledgeId} 接口）
export const KNOWLEDGE_FEEDBACK_TYPES = {
  OUT_OF_DATE: "out_of_date", // 内容过时
  UNCLEAR: "unclear", // 内容不清晰
  NOT_RELEVANT: "not_relevant", // 内容不相关
};

// AI回答反馈类型（可能需要其他接口）
export const AI_FEEDBACK_TYPES = {
  LIKE: "like", // 点赞
  DISLIKE: "dislike", // 点踩
};

// 获取知识反馈类型选项（用于Select组件）
export const getKnowledgeFeedbackOptions = () => [
  { value: KNOWLEDGE_FEEDBACK_TYPES.OUT_OF_DATE, label: "内容过时" },
  { value: KNOWLEDGE_FEEDBACK_TYPES.UNCLEAR, label: "内容不清晰" },
  { value: KNOWLEDGE_FEEDBACK_TYPES.NOT_RELEVANT, label: "内容不相关" },
];
