import axios from "axios";
import { message } from "antd";

// 全局 GET 去重与短期缓存（StrictMode/双触发防抖）
const inFlightGet = new Map(); // key -> Promise
const getCache = new Map(); // key -> { data, expire }
const DEFAULT_GET_TTL_MS = 2000; // 短期缓存 TTL，2 秒内重复调用直接命中缓存

const makeGetKey = (url, params) => {
  let p = "";
  try {
    p = params ? JSON.stringify(params) : "";
  } catch (_) {
    // 非可序列化参数时，退化为空串
    p = "";
  }
  return `GET:${url}?${p}`;
};

// 统一的token获取函数
const getTokenFromStorage = () => {
  try {
    const authStoreData = localStorage.getItem("authStore");
    if (authStoreData) {
      const parsedData = JSON.parse(authStoreData);
      return parsedData.token;
    }
  } catch (error) {
    console.warn("Failed to parse authStore data:", error);
  }
  return null;
};

// 创建axios实例
const request = axios.create({
  baseURL: "/api",
  timeout: 60000, // 请求超时时间
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 在发送请求之前做些什么

    // 添加token到请求头（登录接口除外）
    const isLoginRequest = config.url && config.url.includes("/auth/login");
    const token = getTokenFromStorage();

    if (token && !isLoginRequest) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 开发环境下打印请求信息
    if (import.meta.env.VITE_DEV_MODE === "true") {
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
    const key = makeGetKey(url, params);

    // 命中短期缓存，直接返回缓存结果（与 axios 拦截器保持一致，返回的是 response.data）
    const cached = getCache.get(key);
    if (cached && cached.expire > Date.now()) {
      return Promise.resolve(cached.data);
    }

    // 如有相同在途请求，复用同一个 Promise，避免并发重复
    const inFlight = inFlightGet.get(key);
    if (inFlight) {
      return inFlight;
    }

    const promise = request
      .get(url, { params, ...config })
      .then((data) => {
        // 写入短期缓存
        getCache.set(key, { data, expire: Date.now() + DEFAULT_GET_TTL_MS });
        inFlightGet.delete(key);
        return data;
      })
      .catch((err) => {
        inFlightGet.delete(key);
        throw err;
      });

    inFlightGet.set(key, promise);
    return promise;
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

// 封装带认证的fetch请求
export const authenticatedFetch = (url, options = {}) => {
  const token = getTokenFromStorage();
  const headers = {
    ...options.headers,
  };

  // 为非登录接口添加token
  const isLoginRequest = url && url.includes("/auth/login");
  if (token && !isLoginRequest) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

// 导出axios实例
export default request;
