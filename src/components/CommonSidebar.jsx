import React, { useState, useEffect, useRef } from 'react';
import { Layout, Menu, Spin, message, Button } from 'antd';
import { ReloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { homeAPI } from '../api/home';
import { knowledgeAPI } from '../api/knowledge';
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
  onCategoryClick = null,
  collapsed = false,
  selectedKnowledgeId = null
}) => {
  console.log('CommonSidebar component rendered');
  const navigate = useNavigate();
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [openKeys, setOpenKeys] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const hasInitialized = useRef(false);

  // 调试信息
  console.log('CommonSidebar - received selectedKnowledgeId:', selectedKnowledgeId);
  console.log('CommonSidebar - received filterCategoryId:', filterCategoryId);
  console.log('CommonSidebar - categoryTree length:', categoryTree.length);
  console.log('CommonSidebar - hasInitialized.current:', hasInitialized.current);

  // 获取知识树数据（根节点 children）
  const fetchCategoryTree = async () => {
    console.log('fetchCategoryTree called');
    console.log('About to call homeAPI.getKnowledgeFullTree()');
    setLoading(true);
    try {
      console.log('Making API call to /categories/tree...');
      console.log('Current timestamp:', new Date().toISOString());
      
      // 添加超时处理
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API call timeout after 10 seconds')), 10000);
      });
      
      const apiPromise = homeAPI.getKnowledgeFullTree();
      
      console.log('Waiting for API response...');
      const response = await Promise.race([apiPromise, timeoutPromise]);
      
      console.log('API call completed at:', new Date().toISOString());
      console.log('getKnowledgeFullTree response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', response ? Object.keys(response) : 'null response');
      if (response.code === 200) {
        const records = response.data || [];
        console.log('Raw tree data:', records);
        console.log('Records type:', typeof records);
        console.log('Records is array:', Array.isArray(records));
        console.log('Records length:', records.length);
        // 递归映射为通用树结构
        const mapTree = (nodes) => (nodes || []).map(n => ({
          id: n.id,
          name: n.name,
          children: mapTree(n.children)
        }));
        const data = mapTree(records);
        console.log('Mapped tree data:', data);
        console.log('Mapped data length:', data.length);
        console.log('About to call setCategoryTree with data:', data);
        setCategoryTree(data);
        console.log('setCategoryTree called successfully');
        // 不在这里设置默认展开，让后续的useEffect来处理
      } else {
        console.error('API response error:', response);
        console.log('Response code:', response.code);
        console.log('Response message:', response.message);
        message.error(response.message || '获取知识树失败');
        // 如果API失败，设置空数组避免显示错误
        console.log('Setting categoryTree to empty array due to API error');
        setCategoryTree([]);
      }
    } catch (error) {
      console.error('获取知识树失败:', error);
      console.log('Error type:', typeof error);
      console.log('Error message:', error.message);
      console.log('Error stack:', error.stack);
      message.error('获取知识树失败，请稍后重试');
      // 如果API失败，设置空数组避免显示错误
      console.log('Setting categoryTree to empty array due to catch error');
      setCategoryTree([]);
    } finally {
      console.log('fetchCategoryTree finally block - setting loading to false');
      setLoading(false);
    }
  };

  // 组件挂载时获取分类树
  useEffect(() => {
    console.log('fetchCategoryTree useEffect triggered, hasInitialized.current:', hasInitialized.current);
    if (!hasInitialized.current) {
      console.log('Initializing and calling fetchCategoryTree');
      hasInitialized.current = true;
      fetchCategoryTree();
    } else {
      console.log('Already initialized, skipping fetchCategoryTree');
    }
  }, []);

  // 处理默认展开状态（默认不展开任何分类）
  useEffect(() => {
    console.log('Default expand useEffect - categoryTree length:', categoryTree.length);
    if (categoryTree.length === 0) return;
    
    // 检查是否有特定的目标分类
    const hasSpecificTarget = filterCategoryId || new URLSearchParams(window.location.search).get('parent');
    
    if (!hasSpecificTarget) {
      // 默认不展开任何分类，保持折叠状态
      setOpenKeys([]);
    }
  }, [categoryTree, filterCategoryId]);

  // 当有selectedKnowledgeId时，需要查找该知识所属的分类并设置选中状态
  // 添加一个强制触发的 useEffect 来测试
  useEffect(() => {
    console.log('=== FORCE TRIGGER useEffect ===');
    console.log('This useEffect should always trigger on every render');
  });

  useEffect(() => {
    console.log('=== selectedKnowledgeId useEffect START ===');
    console.log('selectedKnowledgeId value check:', selectedKnowledgeId);
    console.log('categoryTree length check:', categoryTree?.length);
    console.log('useEffect triggered with dependencies:', { selectedKnowledgeId, categoryTreeLength: categoryTree?.length });
    
    if (selectedKnowledgeId && categoryTree?.length > 0) {
      console.log('selectedKnowledgeId changed:', selectedKnowledgeId);
      console.log('categoryTree:', categoryTree);
      
      // 通过API获取知识详情来获取分类信息
      const fetchKnowledgeAndSetCategory = async () => {
        try {
          const response = await knowledgeAPI.getKnowledgeDetail(selectedKnowledgeId);
          console.log('Knowledge detail response:', response);
          
          if (response.code === 200 && response.data) {
            const knowledgeData = response.data;
            console.log('Knowledge data:', knowledgeData);
            
            // 尝试从知识数据中获取分类ID
            const categoryId = knowledgeData.categoryId || knowledgeData.category_id || knowledgeData.category?.id;
            console.log('Found categoryId:', categoryId);
            
            if (categoryId) {
              // 查找分类在树中的位置并设置选中状态
              const findCategoryInTree = (tree, targetId) => {
                for (const node of tree) {
                  if (node.id === targetId || node.key === targetId) {
                    return node;
                  }
                  if (node.children && node.children.length > 0) {
                    const found = findCategoryInTree(node.children, targetId);
                    if (found) return found;
                  }
                }
                return null;
              };
              
              const targetCategory = findCategoryInTree(categoryTree, categoryId);
              console.log('Found target category:', targetCategory);
              
              if (targetCategory) {
                const keyToSelect = targetCategory.key || targetCategory.id;
                console.log('Setting selected key:', keyToSelect);
                setSelectedKeys([keyToSelect]);
                
                // 展开父级分类
                const expandParents = (tree, targetId, parents = []) => {
                  for (const node of tree) {
                    const currentPath = [...parents, node.key || node.id];
                    if (node.id === targetId || node.key === targetId) {
                      return parents;
                    }
                    if (node.children && node.children.length > 0) {
                      const found = expandParents(node.children, targetId, currentPath);
                      if (found) return found;
                    }
                  }
                  return null;
                };
                
                const parentKeys = expandParents(categoryTree, categoryId);
                console.log('Parent keys to expand:', parentKeys);
                
                if (parentKeys && parentKeys.length > 0) {
                  setOpenKeys(prev => [...new Set([...prev, ...parentKeys])]);
                }
              } else {
                console.log('Target category not found in tree');
              }
            } else {
              console.log('No categoryId found in knowledge data');
            }
          }
        } catch (error) {
          console.error('获取知识详情失败:', error);
        }
      };
      
      fetchKnowledgeAndSetCategory();
    }
  }, [selectedKnowledgeId, categoryTree.length]);

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
    
    // 从URL中获取parent参数
    const urlParams = new URLSearchParams(window.location.search);
    const urlCategoryId = urlParams.get('parent');
    
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
          
              navigate(`/knowledge?parent=${category.id}`);
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
    
        navigate(`/knowledge?parent=${selectedItem.id}`);
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
          // 点击的是顶级分类，跳转到知识库页面并传递分类ID
          navigate(`/knowledge?parent=${selectedItem.id}`);
        }
      }
    }
  };

  return (
    <Sider
      className="common-sidebar"
      width={width}
      collapsed={collapsed}
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
            <p>暂无知识节点</p>
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