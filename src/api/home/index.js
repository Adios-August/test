import { http } from "../../utils/request";

// 首页相关API
export const homeAPI = {
  // 获取首页轮播图
  getBanners: () => {
    return http.get("/home/banners");
  },
};

export default homeAPI;
