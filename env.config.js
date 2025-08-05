// 环境变量配置
export const envConfig = {
  // API配置
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",

  // 应用配置
  APP_TITLE: import.meta.env.VITE_APP_TITLE || "Smart Search",
  APP_VERSION: import.meta.env.VITE_APP_VERSION || "1.0.0",

  // 开发环境配置
  DEV_MODE: import.meta.env.VITE_DEV_MODE === "true",
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === "true",

  // 其他配置
  UPLOAD_MAX_SIZE: parseInt(import.meta.env.VITE_UPLOAD_MAX_SIZE) || 10485760,
  SESSION_TIMEOUT: parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 3600000,
};

export default envConfig;
