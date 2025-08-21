import { makeAutoObservable } from "mobx";

class KnowledgeStore {
  // 知识库结果列表
  knowledgeList = [];

  // 当前选中的知识ID
  selectedKnowledgeId = null;

  // 知识详情缓存
  knowledgeDetailCache = new Map();

  // 加载状态
  loading = false;

  // 分页信息
  pagination = {
    current: 1,
    pageSize: 10,
    total: 0,
  };

  constructor() {
    makeAutoObservable(this);
  }

  // 设置知识库结果列表
  setKnowledgeList(list) {
    this.knowledgeList = list;
  }

  // 添加知识到列表
  addKnowledge(knowledge) {
    this.knowledgeList.push(knowledge);
  }

  // 更新知识列表中的某个知识
  updateKnowledge(updatedKnowledge) {
    const index = this.knowledgeList.findIndex((item) => item.id === updatedKnowledge.id);
    if (index !== -1) {
      this.knowledgeList[index] = updatedKnowledge;
    }
  }

  // 移除知识
  removeKnowledge(knowledgeId) {
    this.knowledgeList = this.knowledgeList.filter((item) => item.id !== knowledgeId);
  }

  // 设置选中的知识ID
  setSelectedKnowledgeId(id) {
    this.selectedKnowledgeId = id;
  }

  // 获取选中的知识
  get selectedKnowledge() {
    return this.knowledgeList.find((item) => item.id === this.selectedKnowledgeId);
  }

  // 缓存知识详情
  cacheKnowledgeDetail(id, detail) {
    this.knowledgeDetailCache.set(id, detail);
  }

  // 获取缓存的知识详情
  getCachedKnowledgeDetail(id) {
    return this.knowledgeDetailCache.get(id);
  }

  // 清除知识详情缓存
  clearKnowledgeDetailCache() {
    this.knowledgeDetailCache.clear();
  }

  // 设置加载状态
  setLoading(loading) {
    this.loading = loading;
  }

  // 设置分页信息
  setPagination(pagination) {
    this.pagination = { ...this.pagination, ...pagination };
  }

  // 重置store状态
  reset() {
    this.knowledgeList = [];
    this.selectedKnowledgeId = null;
    this.knowledgeDetailCache.clear();
    this.loading = false;
    this.pagination = {
      current: 1,
      pageSize: 10,
      total: 0,
    };
  }

  // 获取知识ID列表
  get knowledgeIds() {
    return this.knowledgeList.map((item) => item.id);
  }

  // 检查知识是否在列表中
  hasKnowledge(id) {
    return this.knowledgeList.some((item) => item.id === id);
  }

  // 根据ID获取知识
  getKnowledgeById(id) {
    return this.knowledgeList.find((item) => item.id === id);
  }
}

export default KnowledgeStore;
