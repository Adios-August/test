import React, { useEffect } from 'react';
import { TreeSelect, Spin } from 'antd';
import { useCategoryTree } from '../hooks/useCategoryTree';

const CategorySidebar = ({ selectedCategory, onCategoryChange }) => {
  const { loading, treeData, fetchCategoryTree } = useCategoryTree();

  // Fetch category tree on component mount
  useEffect(() => {
    fetchCategoryTree();
  }, [fetchCategoryTree]);

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
            onChange={onCategoryChange}
          />
        )}
      </div>
    </div>
  );
};

export default CategorySidebar;
