import { makeAutoObservable } from "mobx";
import { makePersistable } from "mobx-persist-store";
import authStore from "./authStore";
import KnowledgeStore from "./knowledgeStore";

class RootStore {
  constructor() {
    makeAutoObservable(this);

    // 配置持久化
    makePersistable(this, {
      name: "rootStore",
      properties: ["appLoading", "currentRoute"],
      storage: window.localStorage,
    });
  }

  // 子store
  authStore = authStore;
  knowledgeStore = new KnowledgeStore();

  // 全局状态
  appLoading = false;
  currentRoute = "/";

  // 设置应用加载状态
  setAppLoading(loading) {
    this.appLoading = loading;
  }

  // 设置当前路由
  setCurrentRoute(route) {
    this.currentRoute = route;
  }

  // 初始化应用
  async initApp() {
    this.setAppLoading(true);
    try {
      // 检查用户认证状态
      await this.authStore.checkAuth();
    } catch (error) {
      console.error("App initialization error:", error);
    } finally {
      this.setAppLoading(false);
    }
  }
}

export default new RootStore();
