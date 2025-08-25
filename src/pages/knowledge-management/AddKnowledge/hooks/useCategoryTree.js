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

  // Check if a category node is a leaf node (has no children)
  const isLeafNode = useCallback((categoryId) => {
    if (!categoryId || !categoryTree.length) return false;
    
    const findNode = (nodes, id) => {
      for (const node of nodes) {
        if (node.id === id) {
          return node;
        }
        if (node.children && node.children.length > 0) {
          const found = findNode(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    
    const node = findNode(categoryTree, categoryId);
    return node ? (!node.children || node.children.length === 0) : false;
  }, [categoryTree]);

  return {
    loading,
    categoryTree,
    treeData,
    fetchCategoryTree,
    isLeafNode
  };
};
