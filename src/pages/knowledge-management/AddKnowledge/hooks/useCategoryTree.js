import { useState, useCallback } from 'react';
import { message } from 'antd';
import { homeAPI } from '../../../../api/home';
import { convertToTreeData } from '../utils/knowledgeUtils';

export const useCategoryTree = () => {
  const [loading, setLoading] = useState(false);
  const [categoryTree, setCategoryTree] = useState([]);

  // Fetch category tree data
  const fetchCategoryTree = useCallback(async () => {
    setLoading(true);
    try {
      const response = await homeAPI.getCategoryTree();
      if (response.code === 200) {
        const data = response.data || [];
        setCategoryTree(data);
      } else {
        message.error(response.message || '获取分类树失败');
        setCategoryTree([]);
      }
    } catch (error) {
      console.error('获取分类树失败:', error);
      message.error('获取分类树失败，请稍后重试');
      setCategoryTree([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Convert to TreeSelect format data
  const treeData = convertToTreeData(categoryTree);

  return {
    loading,
    categoryTree,
    treeData,
    fetchCategoryTree
  };
};
