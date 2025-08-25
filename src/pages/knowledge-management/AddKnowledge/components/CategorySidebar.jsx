import React, { useEffect } from 'react';
import { TreeSelect, Spin } from 'antd';
import { useCategoryTree } from '../hooks/useCategoryTree';

const CategorySidebar = ({ selectedCategory, onCategoryChange, onLeafNodeCheck }) => {
  const { loading, treeData, fetchCategoryTree, isLeafNode } = useCategoryTree();

  // Fetch category tree on component mount
  useEffect(() => {
    fetchCategoryTree();
  }, [fetchCategoryTree]);

  // Check leaf node status when selectedCategory changes and tree data is available
  useEffect(() => {
    if (selectedCategory && treeData.length > 0 && onLeafNodeCheck) {
      onLeafNodeCheck(isLeafNode(selectedCategory));
    }
  }, [selectedCategory, treeData, isLeafNode, onLeafNodeCheck]);

  // Handle category change and check if it's a leaf node
  const handleCategoryChange = (value) => {
    onCategoryChange(value);
    if (onLeafNodeCheck) {
      onLeafNodeCheck(isLeafNode(value));
    }
  };

  return (
    <div className="knowledge-sidebar">
      <div className="sidebar-content">
        <div className="sidebar-title">知识存放目录</div>
        
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
            <p>加载中...</p>
          </div>
        ) : (
          <TreeSelect
            className="category-tree-select"
            style={{ width: '100%' }}
            value={selectedCategory}
            placeholder="请选择分类"
            treeData={treeData}
            treeDefaultExpandAll
            showSearch
            allowClear
            onChange={handleCategoryChange}
          />
        )}
      </div>
    </div>
  );
};

export default CategorySidebar;
