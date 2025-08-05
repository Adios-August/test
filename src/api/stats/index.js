import { http } from "../../utils/request";

// 统计相关API
export const statsAPI = {
  // 获取访问统计
  getVisitStats: (params) => {
    return http.get("/stats/visits", params);
  },
};

export default statsAPI;
