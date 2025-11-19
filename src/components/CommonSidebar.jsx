import React, { useState, useEffect, useRef } from 'react';
import { Layout, Menu, Spin, message, Button } from 'antd';
import { ReloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { homeAPI } from '../api/home';
import { knowledgeAPI } from '../api/knowledge';
import { useAuthStore } from '../stores';
import './CommonSidebar.scss';

const { Sider } = Layout;

const CommonSidebar = ({ 
  showBackButton = false, 
  onBackClick, 
  width = 300,
  height = "calc(100vh - 132px)",
  marginRight = "16px",
  enableNavigation = false,
  filterCategoryId = null,
  onCategoryClick = null,
  collapsed = false,
  selectedKnowledgeId = null
}) => {
 
  const navigate = useNavigate();
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [openKeys, setOpenKeys] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(false);
  // 加载状态：防止重复调用子节点接口
  const [loadingChildNodes, setLoadingChildNodes] = useState(new Set());
  const [ancestorId, setAncestorId] = useState([]);
  // 维护最新的分类树引用，便于在异步懒加载后进行递归搜索
  const categoryTreeRef = useRef([]);
  const hasInitialized = useRef(false);
  const lastWorkspaceRef = useRef(null);
  const initRunRef = useRef(false);
  const authStore = useAuthStore();
  const currentWorkspace = authStore.currentWorkspace;

 

 
  // 获取顶层目录数据
  const fetchCategoryTree = async () => {
  
    setLoading(true);
    try {
     
      
      // 添加超时处理
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API call timeout after 10 seconds')), 10000);
      });
      
      // 使用新的API调用：分页拉取全部顶层目录（folder类型）以避免遗漏
      const pageSize = 200;
      let page = 1;
      let allRecords = [];
      while (true) {
        const apiPromise = knowledgeAPI.getKnowledgeList({ page, size: pageSize, nodeType: 'folder' });
        const response = await Promise.race([apiPromise, timeoutPromise]);
        if (response.code !== 200) {
          message.error(response.message || '获取知识树失败');
          allRecords = [];
          break;
        }
        const batch = response.data?.records || response.data || [];
        allRecords = allRecords.concat(batch);
        if (!Array.isArray(batch) || batch.length < pageSize) {
          break;
        }
        page += 1;
        
        if (page > 10) {
          break;
        }
      }
      
      if (allRecords.length > 0) {
        // 转换为树形结构，标记为可能有子节点但尚未加载
        const topLevelNodes = allRecords.map(item => ({
          id: item.id,
          name: item.name,
          nodeType: item.nodeType,
          isLeaf: item.nodeType !== 'folder', // 如果不是文件夹，则为叶子节点
          children: item.nodeType === 'folder' ? [] : undefined, // 文件夹可能有子节点，初始为空数组
          childrenLoaded: false // 标记子节点尚未加载
        }));
        
        setCategoryTree(topLevelNodes);
      } else {
        message.error(response.message || '获取知识树失败');
        setCategoryTree([]);
      }
    } catch (error) {
      message.error('获取知识树失败，请稍后重试');
      setCategoryTree([]);
    } finally {
      setLoading(false);
    }
  };
  
  // 按需加载子节点
  const loadChildNodes = async (parentId) => {
    // 防止同一节点重复加载
    const parentIdStr = String(parentId);
    if (loadingChildNodes.has(parentIdStr)) {
      return;
    }

    try {
      // 保存当前展开状态
      const currentOpenKeys = [...openKeys];
      
      // 标记节点正在加载
      setLoadingChildNodes(prev => new Set(prev).add(parentIdStr));
      
      // 调用API获取子节点
      const response = await knowledgeAPI.getChildren(parentId, { page: 1, size: 100 });
      
      if (response.code === 200) {
        const childNodes = response.data?.records || [];
        
        // 转换为树节点格式
        const mappedChildren = childNodes.map(item => ({
          id: item.id,
          name: item.name,
          nodeType: item.nodeType,
          isLeaf: item.nodeType !== 'folder',
          children: item.nodeType === 'folder' ? [] : undefined,
          childrenLoaded: false
        }));
        
        // 更新树状态：添加子节点并标记为已加载
        setCategoryTree(prevTree => {
          const updateTreeNodes = (nodes) => {
            return nodes.map(node => {
              // 使用字符串比较确保ID类型一致性
              if (String(node.id) === parentIdStr) {
                return {
                  ...node,
                  children: mappedChildren.length > 0 ? mappedChildren : undefined,
                  childrenLoaded: true
                };
              } else if (node.children && node.children.length > 0) {
                return {
                  ...node,
                  children: updateTreeNodes(node.children)
                };
              }
              return node;
            });
          };
          return updateTreeNodes(prevTree);
        });
        
        // 数据加载完成后，确保展开状态不变，并添加新展开的节点
        setTimeout(() => {
          // 确保当前点击的节点保持展开
          if (!currentOpenKeys.includes(parentIdStr)) {
            setOpenKeys([...currentOpenKeys, parentIdStr]);
          } else {
            setOpenKeys(currentOpenKeys);
          }
        }, 100);
        
        return true;
      } else {
        message.error('加载子节点失败');
        // 失败时仍然保持原来的展开状态
        setOpenKeys(currentOpenKeys);
        // 更新节点为已加载状态并移除空数组
        setCategoryTree(prevTree => {
          const updateTreeNodes = (nodes) => {
            return nodes.map(node => {
              if (String(node.id) === parentIdStr) {
                return {
                  ...node,
                  children: undefined,
                  childrenLoaded: true
                };
              } else if (node.children && node.children.length > 0) {
                return {
                  ...node,
                  children: updateTreeNodes(node.children)
                };
              }
              return node;
            });
          };
          return updateTreeNodes(prevTree);
        });
        return false;
      }
    } catch (error) {
      message.error('加载子节点失败，请稍后重试');
      return false;
    } finally {
      // 移除加载标记
      setLoadingChildNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(parentIdStr);
        return newSet;
      });
    }
  };

  // 组件挂载与工作区变化均触发，但加入工作区维度的去重，避免 StrictMode 或双触发导致重复请求
  useEffect(() => {
    const workspaceKey = currentWorkspace || 'default';
    if (lastWorkspaceRef.current === workspaceKey && initRunRef.current) {
      return;
    }
    lastWorkspaceRef.current = workspaceKey;
    initRunRef.current = true;
    fetchCategoryTree();
  }, [currentWorkspace]); // 当工作区变化时重新获取分类数据

  // 同步最新的分类树到 ref（用于异步懒加载后的递归查找）
  useEffect(() => {
    categoryTreeRef.current = categoryTree;
  }, [categoryTree]);

  // 记录选中状态变化
  useEffect(() => {
    console.log('[CommonSidebar] selectedKeys updated to', selectedKeys);
  }, [selectedKeys]);

  // 处理默认展开状态（默认不展开任何分类）
  useEffect(() => {
  
    if (categoryTree.length === 0) return;
    
    // 检查是否有特定的目标分类
    const hasSpecificTarget = filterCategoryId || new URLSearchParams(window.location.search).get('parent');
    
    if (!hasSpecificTarget) {
      // 默认不展开任何分类，保持折叠状态
      setOpenKeys([]);
    }
  }, [categoryTree, filterCategoryId]);

 

  useEffect(() => {
    if (selectedKnowledgeId && categoryTree?.length > 0) {
      // 通过API获取知识详情来获取分类信息
      const fetchKnowledgeAndSetCategory = async () => {
        try {
          const response = await knowledgeAPI.getKnowledgeDetail(selectedKnowledgeId);
          
          if (response.code === 200 && response.data) {
            const knowledgeData = response.data;
            const knowledgeIdStr = String(knowledgeData.id || selectedKnowledgeId);
            
            // 尝试从知识数据中获取分类ID；若无则回退到父分类ID
            const categoryId = (
              knowledgeData.categoryId ||
              knowledgeData.category_id ||
              knowledgeData.category?.id ||
              knowledgeData.parentId ||
              knowledgeData.parent_id ||
              knowledgeData.parent?.id
            );
            
            // 提取知识的所有父节点ID（API新增字段，直接获取无需递归计算）
            const fetchedAncestorId = knowledgeData.ancestorId || [];
            setAncestorId(fetchedAncestorId);
            // 将父节点ID转换为字符串格式
            const parentKeysFromAncestor = fetchedAncestorId.map(id => String(id));
            
            if (categoryId) {
              // 使用ancestorId直接构建完整的父键路径
              let parentKeys = [...parentKeysFromAncestor];
              const categoryIdStr = String(categoryId);
              
              // 确保当前分类ID也在父键路径中
              if (!parentKeys.includes(categoryIdStr)) {
                parentKeys.push(categoryIdStr);
              }
              
              // 设置展开的键
              setOpenKeys(parentKeys);
              
              // 使用categoryId直接构建选中键
              const keyToSelect = categoryIdStr;
              // 先高亮选中分类
              console.log('[CommonSidebar] setSelectedKeys -> category', keyToSelect);
              setSelectedKeys([keyToSelect]);
              
              // 尝试找到叶子节点
              setTimeout(() => {
                // 简化：直接使用categoryTreeRef查找叶子节点
                const findNode = (tree, targetId) => {
                  for (const node of tree) {
                    if (String(node.id) === String(targetId) || String(node.key) === String(targetId)) {
                      return node;
                    }
                    if (node.children && node.children.length > 0) {
                      const found = findNode(node.children, targetId);
                      if (found) return found;
                    }
                  }
                  return null;
                };
                
                // 查找叶子节点
                const leaf = findNode(categoryTreeRef.current, knowledgeIdStr);
                if (leaf) {
                  console.log('[CommonSidebar] select leaf knowledge', knowledgeIdStr);
                  setSelectedKeys([String(knowledgeIdStr)]);
                } else {
                  // 如果未找到叶子节点，则回退到分类高亮
                  console.log('[CommonSidebar] leaf not found, fallback category', keyToSelect);
                  setSelectedKeys([keyToSelect]);
                }
              }, 120);
          
            }
          }
        } catch (error) {
          // 静默处理错误
        }
      };
      
      fetchKnowledgeAndSetCategory();
    }
  }, [selectedKnowledgeId, categoryTree]);

  // 根据ancestorId自动展开节点层级
  useEffect(() => {
    if (ancestorId.length > 0 && categoryTree.length > 0) {
      const ancestorKeys = ancestorId.map(id => String(id));
      setOpenKeys(ancestorKeys);
    }
  }, [ancestorId, categoryTree]);

  // 当openKeys变化时，自动加载所有展开的文件夹节点的子节点
  useEffect(() => {
    const loadOpenFolders = async () => {
      // 遍历所有展开的键
      for (const key of openKeys) {
        // 查找对应的节点
        const findNode = (nodes, targetKey) => {
          for (const node of nodes) {
            if (node.id.toString() === targetKey) {
              return node;
            }
            if (node.children?.length > 0 || node.nodeType === 'folder') {
              const found = findNode(node.children || [], targetKey);
              if (found) return found;
            }
          }
          return null;
        };

        const node = findNode(categoryTree, key);
        if (node) {
          // 如果是文件夹节点且未加载子节点，则加载
          if (node.nodeType === 'folder' && !node.childrenLoaded) {
            await loadChildNodes(node.id);
          }
        }
      }
    };

    loadOpenFolders();
  }, [openKeys, categoryTree]);

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

  // 将API数据转换为菜单项格式，支持懒加载
  const convertToMenuItems = (categories, isTopLevel = true) => {
    return categories.map(category => ({
      key: category.id.toString(),
      label: (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            // 主动设置选中高亮
            console.log('[CommonSidebar] category clicked, setting selectedKeys to', category.id.toString());
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
      // 修复：确保文件夹节点始终显示展开图标（即使无孩子节点）
        children: category.nodeType === 'folder' ? 
          (category.childrenLoaded ? 
            (category.children && category.children.length > 0 ? convertToMenuItems(category.children, false) : undefined) 
            : 
            (loadingChildNodes.has(String(category.id)) ? 
              [{ key: `loading-${category.id}`, label: '加载中...', disabled: true }] 
              : 
              [])) // 设置为空数组以确保展开图标显示
            : (category.children ? convertToMenuItems(category.children, false) : undefined),
      // 当展开时，如果子节点未加载，则触发加载
      onTitleClick: ({ key }) => {
        if (!category.childrenLoaded) {
          loadChildNodes(category.id);
        }
      }
    }));
  };

  // 使用过滤后的分类树生成菜单项
  const menuItems = convertToMenuItems(getFilteredCategoryTree());

  const handleMenuSelect = ({ key, keyPath }) => {
    console.log('[CommonSidebar] menu select event, setting selectedKeys to', key);
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
    // 不是直接替换，而是保留已展开的类目
    // 检查是否有新增的key
    const addedKeys = keys.filter(key => !openKeys.includes(key));
    // 检查是否有移除的key
    const removedKeys = openKeys.filter(key => !keys.includes(key));
    
    // 如果是展开操作，直接添加新的key
    if (addedKeys.length > 0) {
      setOpenKeys(keys);
    } 
    // 如果是收缩操作，只收缩当前点击的key，保留其他已展开的key
    else if (removedKeys.length > 0) {
      // 只收缩当前点击的key
      const currentKey = removedKeys[0];
      // 找到当前key的所有子key，也需要一起收缩
      const findChildKeys = (tree, parentKey, result = []) => {
        for (const node of tree) {
          if (node.id.toString() === parentKey) {
            if (node.children) {
              for (const child of node.children) {
                result.push(child.id.toString());
                if (child.children) {
                  findChildKeys([child], child.id.toString(), result);
                }
              }
            }
            break;
          }
          if (node.children) {
            findChildKeys(node.children, parentKey, result);
          }
        }
        return result;
      };
      
      const childKeys = findChildKeys(categoryTree, currentKey);
      // 移除当前key和所有子key
      const newOpenKeys = openKeys.filter(key => key !== currentKey && !childKeys.includes(key));
      setOpenKeys(newOpenKeys);
    }
  };

  const handleSubMenuTitleClick = ({ key, domEvent }) => {
    // 检查点击事件的目标是否是展开图标或其子元素，如果是，则不执行导航
    if (domEvent) {
      const target = domEvent.target;
      // 展开图标通常是带有 .ant-menu-submenu-expand-icon 类的元素
      if (target.closest('.ant-menu-submenu-expand-icon')) {
        return; // 点击的是展开图标，不执行导航
      }
    }

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
      style={{ height: height, marginRight: marginRight }}
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