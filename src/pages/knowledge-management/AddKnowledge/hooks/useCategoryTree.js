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
      const response = await homeAPI.getKnowledgeFullTree();
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

  // Check if a category node is a leaf node (document type)
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
    // 使用nodeType字段判断是否为叶子节点（文档类型）
    return node ? node.nodeType === 'doc' : false;
  }, [categoryTree]);

  // 新增：检查节点是否为文件夹
  const isFolderNode = useCallback((categoryId) => {
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
    return node ? node.nodeType === 'folder' : false;
  }, [categoryTree]);

  // 新增：获取节点的完整信息
  const getNodeInfo = useCallback((categoryId) => {
    if (!categoryId || !categoryTree.length) return null;
    
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
    
    return findNode(categoryTree, categoryId);
  }, [categoryTree]);

  return {
    loading,
    categoryTree,
    treeData,
    fetchCategoryTree,
    isLeafNode,
    isFolderNode,
    getNodeInfo
  };
};
