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
    
    // 监听工作区变化事件
    this.setupWorkspaceChangeListener();
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
  
  // 设置工作区变化监听器
  setupWorkspaceChangeListener() {
    const originalOnWorkspaceChanged = this.authStore.onWorkspaceChanged;
    
    // 覆盖authStore的onWorkspaceChanged方法
    this.authStore.onWorkspaceChanged = (newWorkspace, oldWorkspace) => {
      // 调用原始方法
      if (originalOnWorkspaceChanged) {
        originalOnWorkspaceChanged(newWorkspace, oldWorkspace);
      }
      
      // 触发全局工作区变更处理
      this.handleWorkspaceChanged(newWorkspace, oldWorkspace);
    };
  }
  
  // 全局工作区变更处理
  handleWorkspaceChanged = async (newWorkspace, oldWorkspace) => {
    try {
      // 显示加载状态
      this.setAppLoading(true);
      
      // 重置相关store的状态
      this.knowledgeStore.reset();
      
      // 这里可以添加其他需要在工作区变更时刷新的数据
      // 例如重新加载首页数据、菜单数据等
      // 由于我们没有看到具体的数据加载方法，这里先添加控制台日志，
      // 实际项目中应该调用相应的API方法重新加载数据
      console.log(`全局：工作区已从 ${oldWorkspace} 切换到 ${newWorkspace}，已重置相关数据`);
      console.log(`提示：在实际应用中，这里应该调用相应的API方法重新加载数据`);
    } catch (error) {
      console.error("处理工作区变更时出错：", error);
    } finally {
      // 隐藏加载状态
      this.setAppLoading(false);
    }
  }
}

export default new RootStore();
