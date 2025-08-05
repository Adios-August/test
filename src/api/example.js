import { homeAPI, knowledgeAPI, statsAPI } from "./index";

// API使用示例

// 首页API使用示例
export const homeExample = {
  // 获取首页轮播图
  async getBanners() {
    try {
      const result = await homeAPI.getBanners();
      console.log("首页轮播图:", result);
      return result;
    } catch (error) {
      console.error("获取轮播图失败:", error);
      throw error;
    }
  },
};

// 知识库API使用示例
export const knowledgeExample = {
  // 获取知识库列表
  async getKnowledgeList(params = {}) {
    try {
      const result = await knowledgeAPI.getKnowledgeList(params);
      console.log("知识库列表:", result);
      return result;
    } catch (error) {
      console.error("获取知识库列表失败:", error);
      throw error;
    }
  },

  // 获取知识详情
  async getKnowledgeDetail(id) {
    try {
      const result = await knowledgeAPI.getKnowledgeDetail(id);
      console.log("知识详情:", result);
      return result;
    } catch (error) {
      console.error("获取知识详情失败:", error);
      throw error;
    }
  },

  // 搜索知识库
  async searchKnowledge(keyword) {
    try {
      const result = await knowledgeAPI.searchKnowledge({ keyword });
      console.log("搜索结果:", result);
      return result;
    } catch (error) {
      console.error("搜索失败:", error);
      throw error;
    }
  },
};

// 统计API使用示例
export const statsExample = {
  // 获取访问统计
  async getVisitStats(params = {}) {
    try {
      const result = await statsAPI.getVisitStats(params);
      console.log("访问统计:", result);
      return result;
    } catch (error) {
      console.error("获取访问统计失败:", error);
      throw error;
    }
  },
};

// React组件中使用API的示例
export const componentUsageExample = `
// 在React组件中使用API的示例
import React, { useState, useEffect } from 'react';
import { knowledgeAPI } from '@/api';

const KnowledgeList = () => {
  const [knowledgeList, setKnowledgeList] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchKnowledgeList = async () => {
    setLoading(true);
    try {
      const result = await knowledgeAPI.getKnowledgeList();
      setKnowledgeList(result.data || []);
    } catch (error) {
      console.error('获取知识库列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (keyword) => {
    try {
      const result = await knowledgeAPI.searchKnowledge({ keyword });
      setKnowledgeList(result.data || []);
    } catch (error) {
      console.error('搜索失败:', error);
    }
  };

  useEffect(() => {
    fetchKnowledgeList();
  }, []);

  return (
    <div>
      {/* 组件内容 */}
    </div>
  );
};

export default KnowledgeList;
`;

// 错误处理示例
export const errorHandlingExample = `
// 错误处理示例
const handleApiCall = async () => {
  try {
    const result = await knowledgeAPI.getKnowledgeList();
    console.log('API调用成功:', result);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('用户未登录，跳转到登录页');
    } else if (error.response?.status === 500) {
      console.log('服务器错误，请稍后重试');
    }
  }
};
`;
