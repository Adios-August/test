import { makeAutoObservable, runInAction } from "mobx";
import { makePersistable } from "mobx-persist-store";
import { loginAPI } from "../api";

class AuthStore {
  token = null;
  user = null;
  isAuthenticated = false;
  loading = false;
  currentWorkspace = null;

  constructor() {
    makeAutoObservable(this);

    // 配置持久化
    makePersistable(this, {
      name: "authStore",
      properties: ["token", "user", "isAuthenticated", "currentWorkspace"],
      storage: window.localStorage,
    });
  }

  // 设置token
  setToken(token) {
    this.token = token;
    this.isAuthenticated = !!token;
  }

  // 设置用户信息
  setUser(user) {
    this.user = user;
    // 如果用户有工作区信息且还没有设置当前工作区，则默认选择第一个
    if (user?.workspace && !this.currentWorkspace) {
      this.currentWorkspace = user.workspace.split(',')[0];
    }
  }

  // 设置当前工作区
  setCurrentWorkspace(workspace) {
    const oldWorkspace = this.currentWorkspace;
    this.currentWorkspace = workspace;
    // 触发工作区变更事件
    if (oldWorkspace !== workspace) {
      this.onWorkspaceChanged(workspace, oldWorkspace);
    }
  }

  // 工作区变更事件处理函数
  onWorkspaceChanged = (newWorkspace, oldWorkspace) => {
    // 这里可以添加全局通知逻辑，或者让各个组件监听此事件
    console.log(`工作区已从 ${oldWorkspace} 切换到 ${newWorkspace}`);
  }

  // 登录
  async login(username, password) {
    this.loading = true;
    try {
      const response = await loginAPI.login(username, password);

      // 根据API返回的数据结构处理
      if (response.code === 200 && response.data.success) {
        const { token, user, expiresIn } = response.data;
        runInAction(() => {
          this.setToken(token);
          this.setUser(user);
          this.loading = false;
        });
        return { success: true, data: response.data };
      } else {
        runInAction(() => {
          this.loading = false;
        });
        return { success: false, error: response.message || "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      runInAction(() => {
        this.loading = false;
      });
      return { success: false, error: "Network error" };
    }
  }

  // 登出
  logout() {
    this.setToken(null);
    this.setUser(null);
  }

  // 检查token是否有效
  async checkAuth() {
    if (!this.token) {
      return false;
    }

    try {
      // 简单检查：如果有token就认为有效
      // 实际项目中可以在这里添加token过期时间检查

      // 确保用户状态正确设置
      if (this.token && !this.user) {
        console.warn("AuthStore: 有token但没有用户信息，可能需要重新登录");
        // 这里可以添加从token恢复用户信息的逻辑
        // 或者调用API获取用户信息
      }

      return true;
    } catch (error) {
      console.error("Auth check error:", error);
      this.logout();
      return false;
    }
  }

  // 清除所有数据
  clearAuth() {
    this.token = null;
    this.user = null;
    this.isAuthenticated = false;
  }
}

export default new AuthStore();
