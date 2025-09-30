import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Menu, Spin } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { useCategoryTree } from '../hooks/useCategoryTree';
import '../../../../components/CommonSidebar.scss';

const CategorySidebar = ({
  selectedCategory,
  onCategoryChange,
  onLeafNodeCheck,
  onFolderNodeCheck,
}) => {
  const [searchParams] = useSearchParams();
  const { loading, categoryTree, fetchCategoryTree, isLeafNode, isFolderNode } = useCategoryTree();
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [openKeys, setOpenKeys] = useState([]);

  useEffect(() => { fetchCategoryTree(); }, [fetchCategoryTree]);

  // —— URL参数处理：从URL中提取parentId并设置为选中状态 —— //
  useEffect(() => {
    const parentId = searchParams.get('parentId');
    const nodeType = searchParams.get('nodeType');
    
    if (!selectedCategory && categoryTree?.length >= 0) {
      if (parentId === '0' || parentId === null || !parentId) {
        // 选中根目录
        onCategoryChange?.(0);
        onLeafNodeCheck?.(false);
        onFolderNodeCheck?.(true); // 根目录被视为文件夹节点
      } else if (parentId && parentId !== '0') {
        // 选中具体的分类
        const parentIdNum = parseInt(parentId, 10);
        onCategoryChange?.(parentIdNum);
        onLeafNodeCheck?.(isLeafNode(parentIdNum));
        onFolderNodeCheck?.(isFolderNode(parentIdNum));
      }
    }
  }, [searchParams, selectedCategory, categoryTree, onCategoryChange, onLeafNodeCheck, onFolderNodeCheck, isLeafNode, isFolderNode]);

  // —— 选中态同步 —— //
  useEffect(() => {
    if (selectedCategory === 0) {
      setSelectedKeys(['root']);
    } else if (selectedCategory) {
      setSelectedKeys([String(selectedCategory)]);
    } else {
      setSelectedKeys([]);
    }
  }, [selectedCategory]);

  // —— 展开态联动（选中项或树更新时） —— //
  const computeOpenKeysForSelection = useCallback((nodes, targetId) => {
    if (!targetId || !Array.isArray(nodes)) return [];
    const dfs = (arr, id, path=[]) => {
      for (const n of arr) {
        const p = [...path, String(n.id)];
        if (n.id === id) {
          const s = new Set(p.slice(0, -1));
          if (Array.isArray(n.children) && n.children.length > 0) s.add(String(n.id));
          return Array.from(s);
        }
        if (Array.isArray(n.children) && n.children.length > 0) {
          const r = dfs(n.children, id, p);
          if (r) return r;
        }
      }
      return null;
    };
    return dfs(nodes, targetId) ?? [];
  }, []);

  useEffect(() => {
    if (selectedCategory && (categoryTree?.length ?? 0) > 0) {
      setOpenKeys(computeOpenKeysForSelection(categoryTree, selectedCategory));
    } else if ((categoryTree?.length ?? 0) > 0) {
      setOpenKeys([]);
    }
  }, [selectedCategory, categoryTree, computeOpenKeysForSelection]);

  // —— 事件 —— //
  const handleMenuSelect = useCallback(
    ({ key }) => {
      if (key === 'root') {
        setSelectedKeys([key]);
        onCategoryChange?.(0);
        onLeafNodeCheck?.(false);
        onFolderNodeCheck?.(true); // 根目录被视为文件夹节点
      } else {
        const id = Number(key);
        setSelectedKeys([key]);
        onCategoryChange?.(id);
        onLeafNodeCheck?.(isLeafNode(id));
        onFolderNodeCheck?.(isFolderNode(id));
      }
    },
    [onCategoryChange, onLeafNodeCheck, onFolderNodeCheck, isLeafNode, isFolderNode]
  );

  const handleOpenChange = useCallback((keys) => setOpenKeys(keys), []);

  // 点击"文件夹标题"时，让它也可选中 + 保持打开
  const handleFolderTitleClick = useCallback((e, idStr) => {
    // 阻止默认"切换展开"的冒泡，避免与我们手动设置 openKeys 冲突
    e.preventDefault();
    e.stopPropagation();

    const id = Number(idStr);
    setSelectedKeys([idStr]);
    onCategoryChange?.(id);
    onLeafNodeCheck?.(isLeafNode(id));
    onFolderNodeCheck?.(isFolderNode(id));
    setOpenKeys((prev) => (prev.includes(idStr) ? prev : [...prev, idStr]));
  }, [onCategoryChange, onLeafNodeCheck, onFolderNodeCheck, isLeafNode, isFolderNode]);

  // 只保留 nodeType === 'folder'
  const renderMenu = useCallback((nodes) => {
    if (!Array.isArray(nodes)) return null;
    return nodes
      .filter(n => n?.nodeType === 'folder')
      .map(n => {
        const key = String(n.id);
        const folderChildren = (n.children || []).filter(c => c?.nodeType === 'folder');
        const isSelectedFolder = selectedKeys[0] === key;

        if (folderChildren.length > 0) {
          // 有子节点 → SubMenu（标题可点击以"选中文件夹本身"）
          return (
            <Menu.SubMenu
              key={key}
              title={
                <div
                  className={`submenu-title ${isSelectedFolder ? 'is-selected' : ''}`}
                  onClick={(e) => handleFolderTitleClick(e, key)}
                >
                  {n.name}
                </div>
              }
            >
              {renderMenu(folderChildren)}
            </Menu.SubMenu>
          );
        }

        // 无子节点 → 普通可选 Menu.Item
        return (
          <Menu.Item key={key}>
            {n.name}
          </Menu.Item>
        );
      });
  }, [handleFolderTitleClick, selectedKeys]);

  return (
    <div className="common-sidebar" style={{
      height: 'calc(100vh - 134px)',
      marginTop: '8px',
      marginLeft: '16px',
      marginRight: '8px',
      marginBottom: '16px',
      width: '280px',
      minWidth: '280px',
    }}>
      <div className="sidebar-content">
        <div className="sidebar-title">知识存放目录</div>

        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
            <p>加载中...</p>
          </div>
        ) : (categoryTree?.length ?? 0) >= 0 ? (
          <Menu
            className="category-tree"
            mode="inline"
            openKeys={openKeys}
            selectedKeys={selectedKeys}
            onOpenChange={handleOpenChange}
            onSelect={handleMenuSelect}
            inlineIndent={16}
            style={{ borderRight: 'none', backgroundColor: 'transparent' }}
          >
            {/* Root level option */}
            <Menu.Item key="root" style={{ 
              fontWeight: selectedKeys[0] === 'root' ? 'bold' : 'normal',
              backgroundColor: selectedKeys[0] === 'root' ? '#f0f0f0' : 'transparent'
            }}>
              Root
            </Menu.Item>
            <Menu.Divider />
            {renderMenu(categoryTree)}
          </Menu>
        ) : (
          <div className="empty-container"><p>暂无分类数据</p></div>
        )}
      </div>
    </div>
  );
};

export default CategorySidebar;
