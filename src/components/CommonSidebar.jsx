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
        // 默认展开第一级分类
        const firstLevelKeys = data.map(item => item.id.toString());
        setOpenKeys(firstLevelKeys);
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

  // 当有filterCategoryId时，初始化选中状态和展开父级
  useEffect(() => {
    if (!filterCategoryId || categoryTree.length === 0) return;
    const targetKey = filterCategoryId.toString();
    setSelectedKeys([targetKey]);
    // 展开父级（对于顶级分类无父级）
    const targetIdNum = Number(filterCategoryId);
    const parent = findParentCategory(categoryTree, targetIdNum);
    if (parent) {
      setOpenKeys((prev) => Array.from(new Set([...(prev || []), parent.id.toString()])));
    }
  }, [filterCategoryId, categoryTree]);

  // 根据URL参数设置选中状态（不过滤分类树）
  useEffect(() => {
    if (categoryTree.length === 0) return;
    
    // 从URL中获取category参数
    const urlParams = new URLSearchParams(window.location.search);
    const urlCategoryId = urlParams.get('category');
    
    if (urlCategoryId) {
      const targetKey = urlCategoryId.toString();
      setSelectedKeys([targetKey]);
      // 展开父级（对于顶级分类无父级）
      const targetIdNum = Number(urlCategoryId);
      const parent = findParentCategory(categoryTree, targetIdNum);
      if (parent) {
        setOpenKeys((prev) => Array.from(new Set([...(prev || []), parent.id.toString()])));
      }
    }
  }, [categoryTree]);

  // 根据filterCategoryId过滤分类树
  const getFilteredCategoryTree = () => {
    if (!filterCategoryId || categoryTree.length === 0) {
      return categoryTree;
    }
    
    // 查找目标分类
    const findCategoryById = (categories, targetId) => {
      for (const category of categories) {
        if (category.id.toString() === targetId.toString()) {
          return category;
        }
        if (category.children) {
          const found = findCategoryById(category.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };
    
    const targetCategory = findCategoryById(categoryTree, filterCategoryId);
    if (targetCategory) {
      // 返回目标分类及其子分类
      return [targetCategory];
    }
    
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
              console.log('点击分类:', category.name, category.id);
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
    console.log("选择菜单项:", key, keyPath);
    console.log("enableNavigation:", enableNavigation);
    console.log("categoryTree:", categoryTree);
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
      console.log("selectedItem:", selectedItem);
      
      if (selectedItem) {
        // 检查是否是顶级分类（没有父级）
        const isTopLevelCategory = categoryTree.some(cat => cat.id.toString() === key);
        console.log("isTopLevelCategory:", isTopLevelCategory);
        
        // 无论是顶级分类还是子分类，都跳转到知识库页面
        console.log('跳转到知识库页面:', selectedItem.name, selectedItem.id);
        navigate(`/knowledge?category=${selectedItem.id}`);
      } else {
        console.log("未找到选中的项目");
      }
    } else {
      console.log("导航功能未启用");
    }
  };

  const handleMenuOpenChange = (keys) => {
    console.log('展开/折叠状态变化:', keys);
    setOpenKeys(keys);
  };

  const handleSubMenuTitleClick = ({ key }) => {
    console.log("子菜单标题点击:", key);
    
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
      console.log("子菜单标题选中项:", selectedItem);
      
      if (selectedItem) {
        // 检查是否是顶级分类
        const isTopLevelCategory = categoryTree.some(cat => cat.id.toString() === key);
        
        if (isTopLevelCategory) {
          // 点击的是顶级分类，跳转到知识库页面
          console.log('子菜单标题跳转到知识库页面:', selectedItem.name);
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
             onTitleClick={handleSubMenuTitleClick}
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