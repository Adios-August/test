import axios from "axios";
import { message } from "antd";

// 创建axios实例
const request = axios.create({
  baseURL: "/api",
  timeout: 10000, // 请求超时时间
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 在发送请求之前做些什么

    // 添加token到请求头
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 开发环境下打印请求信息
    if (import.meta.env.VITE_DEV_MODE === "true") {
      console.log("Request:", config.method?.toUpperCase(), config.url, config);
    }

    return config;
  },
  (error) => {
    // 对请求错误做些什么
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么

    // 开发环境下打印响应信息
    if (import.meta.env.VITE_DEV_MODE === "true") {
      console.log("Response:", response.config.url, response.data);
    }

    // 如果响应成功，直接返回数据
    if (response.status === 200) {
      return response.data;
    }

    return response;
  },
  (error) => {
    // 对响应错误做点什么

    console.error("Response Error:", error);

    // 处理不同的错误状态码
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          message.error(data?.message || "请求参数错误");
          break;
        case 401:
          message.error("未授权，请重新登录");
          // 清除token并跳转到登录页
          localStorage.removeItem("token");
          window.location.href = "/login";
          break;
        case 403:
          message.error("拒绝访问");
          break;
        case 404:
          message.error("请求的资源不存在");
          break;
        case 500:
          message.error("服务器内部错误");
          break;
        case 502:
          message.error("网关错误");
          break;
        case 503:
          message.error("服务不可用");
          break;
        case 504:
          message.error("网关超时");
          break;
        default:
          message.error(data?.message || "网络错误");
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      message.error("网络连接失败，请检查网络设置");
    } else {
      // 请求配置出错
      message.error("请求配置错误");
    }

    return Promise.reject(error);
  }
);

// 封装常用的请求方法
export const http = {
  get: (url, params, config = {}) => {
    return request.get(url, { params, ...config });
  },

  post: (url, data, config = {}) => {
    return request.post(url, data, config);
  },

  put: (url, data, config = {}) => {
    return request.put(url, data, config);
  },

  delete: (url, config = {}) => {
    return request.delete(url, config);
  },

  patch: (url, data, config = {}) => {
    return request.patch(url, data, config);
  },
};

// 导出axios实例
export default request;
