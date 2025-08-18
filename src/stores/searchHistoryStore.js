import { makeAutoObservable } from "mobx";
import { makePersistable } from "mobx-persist-store";

class SearchHistoryStore {
  constructor() {
    makeAutoObservable(this);

    // 配置持久化
    makePersistable(this, {
      name: "searchHistoryStore",
      properties: ["searchHistory"],
      storage: window.localStorage,
    });
  }

  // 搜索历史记录
  searchHistory = [];

  // 最大历史记录数量
  maxHistoryCount = 20;

  // 添加搜索历史
  addSearchHistory(query) {
    if (!query || !query.trim()) return;

    const trimmedQuery = query.trim();

    // 移除重复的搜索记录
    this.searchHistory = this.searchHistory.filter((item) => item.query !== trimmedQuery);

    // 添加新的搜索记录到开头
    const newHistoryItem = {
      id: Date.now(),
      query: trimmedQuery,
      timestamp: new Date().toISOString(),
    };

    this.searchHistory.unshift(newHistoryItem);

    // 限制历史记录数量
    if (this.searchHistory.length > this.maxHistoryCount) {
      this.searchHistory = this.searchHistory.slice(0, this.maxHistoryCount);
    }
  }

  // 获取搜索历史（用于显示）
  getSearchHistory(limit = 10) {
    return this.searchHistory.slice(0, limit);
  }

  // 清空搜索历史
  clearSearchHistory() {
    this.searchHistory = [];
  }

  // 删除单个搜索记录
  removeSearchHistory(id) {
    this.searchHistory = this.searchHistory.filter((item) => item.id !== id);
  }

  // 获取历史记录数量
  get historyCount() {
    return this.searchHistory.length;
  }

  // 检查是否有历史记录
  get hasHistory() {
    return this.searchHistory.length > 0;
  }
}

export default new SearchHistoryStore();
