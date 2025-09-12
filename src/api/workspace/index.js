import { http } from "../../utils/request";

// Workspace相关API
export const workspaceAPI = {
  // 获取所有workspace列表
  getWorkspaces: () => {
    return http.get("/workspaces");
  },

  // 创建新的workspace
  // 数据格式: { code: "string", name: "string", description: "string" }
  createWorkspace: (data) => {
    return http.post("/workspaces", data);
  },

  // 更新workspace
  updateWorkspace: (id, data) => {
    return http.put(`/workspaces/${id}`, data);
  },

  // 删除workspace
  deleteWorkspace: (id) => {
    return http.delete(`/workspaces/${id}`);
  },

  // 获取workspace详情
  getWorkspaceDetail: (id) => {
    return http.get(`/workspaces/${id}`);
  },
};

export default workspaceAPI;