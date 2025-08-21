import React, { useState, useEffect } from 'react';
import { Layout, Menu, Spin, message, Button } from 'antd';
import { ReloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { homeAPI } from '../api/home';
import './CommonSidebar.scss';

const { Sider } = Layout;

const CommonSidebar = ({ 
  showBackButton = false, 
  onBackClick, 
  width = 300,
  height = "calc(100vh - 152px)",
  marginTop = "24px",
  enableNavigation = false,
  filterCategoryId = null,
  onCategoryClick = null
}) => {
  const navigate = useNavigate();
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [openKeys, setOpenKeys] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(false);

  // 获取分类树数据
  const fetchCategoryTree = async () => {
    setLoading(true);
    try {
      const response = await homeAPI.getCategoryTree();
      if (response.code === 200) {
        const data = response.data || [];
        setCategoryTree(data);
        // 不在这里设置默认展开，让后续的useEffect来处理
      } else {
        message.error(response.message || '获取分类树失败');
        // 如果API失败，设置空数组避免显示错误
        setCategoryTree([]);
      }
    } catch (error) {
      console.error('获取分类树失败:', error);
      message.error('获取分类树失败，请稍后重试');
      // 如果API失败，设置空数组避免显示错误
      setCategoryTree([]);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取分类树
  useEffect(() => {
    fetchCategoryTree();
  }, []);

  // 处理默认展开状态（只在没有特定目标时展开第一级）
  useEffect(() => {
    if (categoryTree.length === 0) return;
    
    // 检查是否有特定的目标分类
    const hasSpecificTarget = filterCategoryId || new URLSearchParams(window.location.search).get('category');
    
    if (!hasSpecificTarget) {
      // 只有在没有特定目标时才默认展开第一级分类
      const firstLevelKeys = categoryTree.map(item => item.id.toString());
      setOpenKeys(firstLevelKeys);
    }
  }, [categoryTree, filterCategoryId]);

  // 当有filterCategoryId时，初始化选中状态和展开父级
  useEffect(() => {
    if (!filterCategoryId || categoryTree.length === 0) return;
    const targetKey = filterCategoryId.toString();
    setSelectedKeys([targetKey]);
    
    // 收集需要展开的分类ID（目标分类及其所有父级）
    const expandKeys = new Set();
    
    const collectExpandKeys = (categoryId) => {
      const targetIdNum = Number(categoryId);
    const parent = findParentCategory(categoryTree, targetIdNum);
    if (parent) {
        expandKeys.add(parent.id.toString());
        // 递归收集所有父级
        collectExpandKeys(parent.id);
      }
    };
    
    collectExpandKeys(filterCategoryId);
    
    // 添加目标分类本身到展开列表（如果它有子分类的话）
    const hasChildren = (categoryId) => {
      const findCategory = (categories, targetId) => {
        for (const category of categories) {
          if (category.id.toString() === targetId.toString()) {
            return category.children && category.children.length > 0;
          }
          if (category.children) {
            const found = findCategory(category.children, targetId);
            if (found !== undefined) return found;
          }
        }
        return false;
      };
      return findCategory(categoryTree, categoryId);
    };
    
    if (hasChildren(filterCategoryId)) {
      expandKeys.add(filterCategoryId.toString());
    }
    
    // 设置展开的键，其他分类保持折叠
    setOpenKeys(Array.from(expandKeys));
  }, [filterCategoryId, categoryTree]);

  // 根据URL参数设置选中状态（不过滤分类树）
  useEffect(() => {
    if (categoryTree.length === 0) return;
    
    // 从URL中获取category参数
    const urlParams = new URLSearchParams(window.location.search);
    const urlCategoryId = urlParams.get('category');
    
    // 如果没有URL参数，不处理
    if (!urlCategoryId) return;
    
      const targetKey = urlCategoryId.toString();
      setSelectedKeys([targetKey]);
    
    // 收集需要展开的分类ID（目标分类及其所有父级）
    const expandKeys = new Set();
    
    const collectExpandKeys = (categoryId) => {
      const targetIdNum = Number(categoryId);
      const parent = findParentCategory(categoryTree, targetIdNum);
      if (parent) {
        expandKeys.add(parent.id.toString());
        // 递归收集所有父级
        collectExpandKeys(parent.id);
      }
    };
    
    collectExpandKeys(urlCategoryId);
    
    // 添加目标分类本身到展开列表（如果它有子分类的话）
    const hasChildren = (categoryId) => {
      const findCategory = (categories, targetId) => {
      for (const category of categories) {
        if (category.id.toString() === targetId.toString()) {
            return category.children && category.children.length > 0;
        }
        if (category.children) {
            const found = findCategory(category.children, targetId);
            if (found !== undefined) return found;
        }
      }
        return false;
    };
      return findCategory(categoryTree, categoryId);
    };
    
    if (hasChildren(urlCategoryId)) {
      expandKeys.add(urlCategoryId.toString());
    }
    
    // 设置展开的键，其他分类保持折叠
    setOpenKeys(Array.from(expandKeys));
  }, [categoryTree]);

  // 获取分类树（不过滤，只展开）
  const getFilteredCategoryTree = () => {
    // 直接返回完整的分类树，不进行过滤
    return categoryTree;
  };

  // 查找父级分类
  const findParentCategory = (categories, targetId, parent = null) => {
    for (const category of categories) {
      if (category.children) {
        for (const child of category.children) {
          if (child.id === targetId) {
            return category;
          }
        }
        const found = findParentCategory(category.children, targetId, category);
        if (found) return found;
      }
    }
    return null;
  };

  // 将API数据转换为菜单项格式
  const convertToMenuItems = (categories, isTopLevel = true) => {
    return categories.map(category => ({
      key: category.id.toString(),
      label: (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            // 主动设置选中高亮
            setSelectedKeys([category.id.toString()]);
            // 子项点击时，确保父级展开
            if (!isTopLevel) {
              const parentCategory = findParentCategory(categoryTree, category.id);
              if (parentCategory) {
                setOpenKeys((prev) => Array.from(new Set([...(prev || []), parentCategory.id.toString()])));
              }
            }
            if (onCategoryClick) {
              // 如果有搜索回调函数，优先调用搜索功能
              onCategoryClick(category, isTopLevel);
            } else if (enableNavigation) {
              // 否则使用原有的导航逻辑
          
              navigate(`/knowledge?category=${category.id}`);
            }
          }}
          style={{ cursor: (enableNavigation || onCategoryClick) ? 'pointer' : 'default' }}
        >
          {category.name}
        </div>
      ),
      children: category.children && category.children.length > 0 
        ? convertToMenuItems(category.children, false) 
        : undefined
    }));
  };

  // 使用过滤后的分类树生成菜单项
  const menuItems = convertToMenuItems(getFilteredCategoryTree());

  const handleMenuSelect = ({ key, keyPath }) => {

    setSelectedKeys([key]);
    
    // 如果启用了导航功能
    if (enableNavigation) {
      // 查找选中的分类项
      const findCategoryItem = (categories, targetKey) => {
        for (const category of categories) {
          if (category.id.toString() === targetKey) {
            return category;
          }
          if (category.children) {
            const found = findCategoryItem(category.children, targetKey);
            if (found) return found;
          }
        }
        return null;
      };
      
      const selectedItem = findCategoryItem(categoryTree, key);
  
      
      if (selectedItem) {
        // 检查是否是顶级分类（没有父级）
        const isTopLevelCategory = categoryTree.some(cat => cat.id.toString() === key);
    
        
        // 无论是顶级分类还是子分类，都跳转到知识库页面
    
        navigate(`/knowledge?category=${selectedItem.id}`);
      } else {
    
      }
    } else {
  
    }
  };

  const handleMenuOpenChange = (keys) => {

    setOpenKeys(keys);
  };

  const handleSubMenuTitleClick = ({ key }) => {

    
    // 如果启用了导航功能
    if (enableNavigation) {
      // 查找选中的分类项
      const findCategoryItem = (categories, targetKey) => {
        for (const category of categories) {
          if (category.id.toString() === targetKey) {
            return category;
          }
          if (category.children) {
            const found = findCategoryItem(category.children, targetKey);
            if (found) return found;
          }
        }
        return null;
      };
      
      const selectedItem = findCategoryItem(categoryTree, key);
  
      
      if (selectedItem) {
        // 检查是否是顶级分类
        const isTopLevelCategory = categoryTree.some(cat => cat.id.toString() === key);
        
        if (isTopLevelCategory) {
          // 点击的是顶级分类，跳转到知识库页面
      
          navigate('/knowledge');
        }
      }
    }
  };

  return (
    <Sider
      className="common-sidebar"
      width={width}
      style={{ height: height, marginTop: marginTop }}
    >
      <div className="sidebar-content">
        {showBackButton && (
          <div className="sidebar-title">
            <Button 
              type="link" 
              icon={<ArrowLeftOutlined />} 
              onClick={onBackClick}
              className="back-button"
            >
              返回搜索
            </Button>
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
            <p>加载中...</p>
          </div>
        ) : categoryTree.length > 0 ? (
                     <Menu
             className="category-tree"
             mode="inline"
             openKeys={openKeys}
             selectedKeys={selectedKeys}
             onOpenChange={handleMenuOpenChange}
             onSelect={handleMenuSelect}
             onClick={handleSubMenuTitleClick}
             inlineIndent={16}
             style={{ borderRight: 'none' }}
             items={menuItems}
           />
        ) : (
          <div className="empty-container">
            <p>暂无分类数据</p>
            <Button 
              type="link" 
              icon={<ReloadOutlined />} 
              onClick={fetchCategoryTree}
              style={{ marginTop: 8 }}
            >
              重新加载
            </Button>
          </div>
        )}
      </div>
    </Sider>
  );
};

export default CommonSidebar; 