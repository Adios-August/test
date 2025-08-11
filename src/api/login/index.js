import { http } from "../../utils/request";

// 登录相关API
export const loginAPI = {
  // 用户登录
  login: (username, password) => {
    return http.post("/auth/login", { username, password });
  },
};

export default loginAPI;
