// API配置文件
export const API_CONFIG = {
  // 千问AI配置
  QIANWEN: {
    BASE_URL: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    MODEL: "qwen-plus",
    API_KEY: "sk-e1bc339dda7744b5ad2635889f0fb770", // 直接使用API密钥
  },

  // 其他API配置
  TIMEOUT: 30000, // 30秒超时
  RETRY_TIMES: 3, // 重试次数
};

// 获取千问AI请求头
export const getQianwenHeaders = () => ({
  Authorization: `Bearer ${API_CONFIG.QIANWEN.API_KEY}`,
  "Content-Type": "application/json",
});

// 获取千问AI请求数据
export const getQianwenRequestData = (messages, stream = true) => ({
  model: API_CONFIG.QIANWEN.MODEL,
  messages: messages,
  stream: stream,
});
