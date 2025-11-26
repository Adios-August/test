import React, { useState, useEffect } from 'react';
import { Table, Button, Space, message, Modal, Form, Input, Select } from 'antd';
import { PlusOutlined,CloseOutlined, EditOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined, CaretUpOutlined, CaretDownOutlined, LoadingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { homeAPI } from '../../api/home';
import { knowledgeAPI } from '../../api/knowledge';
import { useAuthStore } from '../../stores';
import { useHasWorkspace } from '../../hooks/useHasWorkspace';
import RoleProtectedComponent from '../../components/RoleProtectedComponent';
import '../knowledge-management/KnowledgeManagement.scss';

const { Option } = Select;

const CategoryManagement = () => {
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const [originalDataSource, setOriginalDataSource] = useState([]);
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [loadingKeys, setLoadingKeys] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearchResult, setIsSearchResult] = useState(false); // 标记是否为搜索结果
  const [expandedRowKeys, setExpandedRowKeys] = useState([]); // 控制展开的行
  const [form] = Form.useForm();
  const hasWorkspace = useHasWorkspace();

  // 获取知识树数据（只获取顶层目录）
  const fetchCategoryTree = async () => {
    setLoading(true);
    try {
      // 使用knowledgeAPI获取顶层目录，只获取folder类型
      const response = await knowledgeAPI.getKnowledgeList({ page: 1, size: 100, nodeType: 'folder' });
      if (response.code === 200) {
        const data = response.data?.records || [];
        // 转换数据格式以适应Table组件
        const tableData = transformToTableData(data);
        setOriginalDataSource(tableData);
        // 如果有搜索关键词，则过滤显示
        if (searchKeyword.trim()) {
          filterCategories(searchKeyword);
        } else {
          setDataSource(tableData);
        }
      } else {
        message.error(response.message || '获取知识树失败');
        setOriginalDataSource([]);
        setDataSource([]);
      }
    } catch (error) {
      console.error('获取知识树失败:', error);
      message.error('获取知识树失败，请稍后重试');
      setOriginalDataSource([]);
      setDataSource([]);
    } finally {
      setLoading(false);
    }
  };

  // 转换数据格式以适应Table组件（带层级缩进）
  const transformToTableData = (categories, parentKey = null, currentLevel = 0) => {
    return (categories || []).map((category, index) => {
      const key = parentKey ? `${parentKey}-${index}` : index.toString();
      
      // 创建节点，包含fullPath信息
      const node = {
        key,
        id: category.id,
        name: category.name,
        description: category.description || '',
        parentId: category.parentId ?? null,
        level: currentLevel,
        updateStaff: category.updateStaff || '-',
        updateTime: category.updateTime || '-',
        effectiveStartTime: category.effectiveStartTime || '-',
        effectiveEndTime: category.effectiveEndTime || '-',
        nodeType: category.nodeType || 'folder',
        isLeaf: category.nodeType === 'doc', // doc类型为叶子节点
        hasChildren: category.nodeType === 'folder', // folder类型默认可以展开，支持延迟加载
        fullPath: category.fullPath || [], // 保存完整路径信息
      };
      
      // 如果有子节点数据，则转换
      if (category.children && category.children.length > 0) {
        node.children = transformToTableData(category.children, key, currentLevel + 1);
        // 确保有子节点时hasChildren为true
        node.hasChildren = true;
      }
      return node;
    });
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchCategoryTree();
  }, []);

  // 监听工作区变化，重新加载数据
  useEffect(() => {
    if (authStore.currentWorkspace) {
      fetchCategoryTree();
    }
  }, [authStore.currentWorkspace]);

  // 加载子节点
  const loadChildNodes = async (parentId, key) => {
    if (!hasWorkspace) {
      return;
    }
    setLoadingKeys(prev => [...prev, key]);
    try {
      const response = await knowledgeAPI.getChildren(parentId, {});
      if (response.code === 200) {
        const children = response.data?.records || [];
        const childrenData = transformToTableData(children, key, 0);
        
       // 更新原始数据源
       setOriginalDataSource(prevData => {
        const updateTreeData = (data, key, children) => {
          return data.map(node => {
            if (node.key === key) {
              return {
                ...node,
                children,
              };
            }
            if (node.children) {
              return {
                ...node,
                children: updateTreeData(node.children, key, children),
              };
            }
            return node;
          });
        };
        return updateTreeData(prevData, key, childrenData);
      });
      
      // 同时更新显示的数据源（考虑搜索过滤）
        setDataSource(prevData => {
          const updateTreeData = (data, key, children) => {
            return data.map(node => {
              if (node.key === key) {
                return {
                  ...node,
                  children,
                };
              }
              if (node.children) {
                return {
                  ...node,
                  children: updateTreeData(node.children, key, children),
                };
              }
              return node;
            });
          };
          return updateTreeData(prevData, key, childrenData);
        });
      }
    } catch (error) {
      console.error('加载子节点失败:', error);
      message.error('加载子节点失败');
    } finally {
      setLoadingKeys(prev => prev.filter(k => k !== key));
    }
  };

  // 表格列定义
  const columns = [
    {
      title: 'Category',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => {
        
        
        
        return (
          <span style={{ 
            fontWeight: record.children && record.children.length > 0 ? 'bold' : 'normal'
          }}>
            {text}
          </span>
        );
      },
    },
    {
      title: 'Effective Start Time',
      dataIndex: 'effectiveStartTime',
      key: 'effectiveStartTime',
      render: (text) => text || '-',
    },
    {
      title: 'Effective End Time',
      dataIndex: 'effectiveEndTime',
      key: 'effectiveEndTime',
      render: (text) => text || '-',
    },
    {
      title: 'Update Time',
      dataIndex: 'updateTime',
      key: 'updateTime',
      render: (text) => text || '-',
    },
    {
      title: '',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<PlusOutlined />}
            onClick={() => handleAddKnowledge(record, null)}
            size="small"
          />
          <Button 
            type="link" 
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteCategory(record)}
            size="small"
            danger
          />
          {/* <Button 
            type="link" 
            icon={<ArrowUpOutlined />}
            onClick={() => handleMoveUp(record)}
            size="small"
          />
          <Button 
            type="link" 
            icon={<ArrowDownOutlined />}
            onClick={() => handleMoveDown(record)}
            size="small"
          /> */}
        </Space>
      ),
    },
  ];

  // 处理新增知识操作
  const handleAddKnowledge = async (record = null, nodeType = null) => {
    const parentId = record?.id || 0;
    navigate(`/add-knowledge?parentId=${parentId}&nodeType=${nodeType}`);
  };

  // 处理双击编辑操作
  const handleRowDoubleClick = (record) => {
    // 导航到编辑知识页面
    navigate(`/edit-knowledge/${record.id}`);
  };

  // 处理编辑操作
  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description
    });
    setModalVisible(true);
  };


  // 处理删除分类操作（非常谨慎的删除流程）
  const handleDeleteCategory = async (record) => {
    try {
      // 第一步：检查该分类下是否有子项
      // 使用 size: 1 来快速检查是否有子项，同时获取 total 来显示准确数量
      const childrenResponse = await knowledgeAPI.getChildren(record.id, { page: 1, size: 1 });
      
      if (childrenResponse.code === 200) {
        const children = childrenResponse.data?.records || [];
        const totalCount = childrenResponse.data?.total ?? children.length;
        
        // 如果有子项，阻止删除并提示用户
        if (totalCount > 0 || children.length > 0) {
          Modal.warning({
            title: '无法删除分类',
            width: 500,
            content: (
              <div>
                <p style={{ marginBottom: '12px', fontWeight: 'bold', color: '#ff4d4f' }}>
                  该分类下存在 {totalCount > 0 ? totalCount : children.length} 个子项，无法删除。
                </p>
                <p style={{ marginBottom: '8px' }}>
                  为了确保数据安全，请先手动删除该分类下的所有子项（包括子分类和文档），然后再删除此分类。
                </p>
                <p style={{ color: '#666', fontSize: '12px' }}>
                  删除操作不可恢复，请谨慎操作。
                </p>
              </div>
            ),
            okText: '我知道了',
            okButtonProps: { type: 'primary' },
          });
          return;
        }
      }
      
      // 如果没有子项，显示严格的确认对话框
      Modal.confirm({
        title: (
          <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
            ⚠️ 危险操作：删除分类
          </span>
        ),
        width: 550,
        icon: null,
        content: (
          <div>
            <p style={{ marginBottom: '12px', fontWeight: 'bold', fontSize: '14px' }}>
              您即将删除分类：<span style={{ color: '#ff4d4f' }}>"{record.name}"</span>
            </p>
            <div style={{ 
              background: '#fff7e6', 
              border: '1px solid #ffd591', 
              borderRadius: '4px', 
              padding: '12px', 
              marginBottom: '12px' 
            }}>
              <p style={{ marginBottom: '8px', fontWeight: 'bold', color: '#d46b08' }}>
                ⚠️ 警告：此操作具有以下风险：
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#d46b08' }}>
                <li>删除后无法恢复</li>
                <li>所有关联数据将永久丢失</li>
                <li>可能影响系统其他功能</li>
              </ul>
            </div>
            <p style={{ marginBottom: 0, color: '#666', fontSize: '12px' }}>
              请确认您已充分了解风险，并确定要执行此操作。
            </p>
          </div>
        ),
        okText: '确认删除',
        cancelText: '取消',
        okButtonProps: { 
          danger: true,
          type: 'primary'
        },
        cancelButtonProps: {
          type: 'default'
        },
        onOk: async () => {
          try {
            const res = await knowledgeAPI.deleteKnowledge(record.id);
            if (res.code === 200) {
              message.success('分类删除成功');
              fetchCategoryTree(); // 重新加载数据
            } else {
              message.error(res.message || '删除失败');
            }
          } catch (error) {
            console.error('删除分类失败:', error);
            message.error('删除失败，请稍后重试');
          }
        },
      });
    } catch (error) {
      console.error('检查子项失败:', error);
      message.error('检查分类子项失败，无法执行删除操作');
    }
  };

  // 处理上移操作
  const handleMoveUp = (record) => {
    message.info(`上移栏目: ${record.name}`);
    // 这里可以添加实际的排序逻辑
  };

  // 处理下移操作
  const handleMoveDown = (record) => {
    message.info(`下移栏目: ${record.name}`);
    // 这里可以添加实际的排序逻辑
  };

  // 递归收集第一个分支的所有节点key
  const collectFirstBranchKeys = (node, keys = []) => {
    if (node) {
      keys.push(node.key);
      // 如果有子节点，继续收集第一个子节点的所有key
      if (node.children && node.children.length > 0) {
        collectFirstBranchKeys(node.children[0], keys);
      }
    }
    return keys;
  };

  // 递归加载并展开第一个分支的所有子节点
  const expandFirstBranch = async (data) => {
    if (!data || data.length === 0) return [];
    
    const firstNode = data[0];
    const expandedKeys = [];
    
    // 先将第一个节点加入展开列表
    expandedKeys.push(firstNode.key);
    
    // 加载第一个节点的子节点
    if (firstNode.hasChildren && (!firstNode.children || firstNode.children.length === 0)) {
      await loadChildNodes(firstNode.id, firstNode.key);
    }
    
    // 等待子节点加载完成后，再次获取数据并递归处理
    const currentDataSource = dataSource || [];
    const updatedFirstNode = findNodeByKey(currentDataSource, firstNode.key);
    
    if (updatedFirstNode && updatedFirstNode.children && updatedFirstNode.children.length > 0) {
      // 递归处理第一个子节点
      const childKeys = await expandFirstBranch(updatedFirstNode.children);
      expandedKeys.push(...childKeys);
    }
    
    return expandedKeys;
  };

  // 根据key查找节点
  const findNodeByKey = (nodes, key) => {
    for (const node of nodes) {
      if (node.key === key) return node;
      if (node.children) {
        const found = findNodeByKey(node.children, key);
        if (found) return found;
      }
    }
    return null;
  };

  // 处理搜索
  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      // 如果关键词为空，显示所有数据
      setDataSource(originalDataSource);
      setIsSearchResult(false); // 重置搜索结果标记
      setExpandedRowKeys([]); // 重置展开行
      return;
    }
    
    setLoading(true);
    try {
      // 使用新的搜索分类树API
      const response = await knowledgeAPI.searchCategoryTree(searchKeyword.trim());
      setIsSearchResult(true);
      if (response.code === 200) {
        // 直接使用response.data，不需要访问records属性
        // 构建树状结构
        const treeData = buildTreeStructure(response.data);
        
        // 转换数据格式以适应Table组件
        const filteredData = transformToTableData(treeData);
        setDataSource(filteredData);
        
        // 重置展开行
        setExpandedRowKeys([]);
        
        // 搜索结果时，展开第一个完整分支（整个路径）
        if (filteredData.length > 0) {
          // 首先从内存中的treeData收集第一个分支的所有节点key
          const firstBranchKeys = collectFirstBranchKeys(filteredData[0]);
          
          // 对于需要加载的节点，先加载其子节点
          if (filteredData[0].hasChildren) {
            // 先加载第一个节点的子节点
            if (!filteredData[0].children || filteredData[0].children.length === 0) {
              await loadChildNodes(filteredData[0].id, filteredData[0].key);
            }
            
            // 由于loadChildNodes会异步更新数据源，我们需要等待更新后再设置展开行
            // 为了确保UI响应迅速，我们先设置第一个节点的展开状态
            setExpandedRowKeys(firstBranchKeys);
          } else {
            // 如果第一个节点没有子节点，直接设置为展开状态
            setExpandedRowKeys([filteredData[0].key]);
          }
        }
        
        if (filteredData.length === 0) {
          message.info('没有找到匹配的分类');
        }
      } else {
        message.error(response.message || '搜索分类失败');
        
        // 搜索失败时显示所有数据
        setDataSource(originalDataSource);
        setIsSearchResult(false); // 重置搜索结果标记
        setExpandedRowKeys([]); // 重置展开行
      }
    } catch (error) {
      console.error('搜索分类失败:', error);
      message.error('搜索分类失败，请稍后重试');
      // 异常时显示所有数据
      setDataSource(originalDataSource);
      setIsSearchResult(false); // 重置搜索结果标记
      setExpandedRowKeys([]); // 重置展开行
    } finally {
      setLoading(false);
    }
  };

   // 根据fullPath构建树状结构
   const buildTreeStructure = (data) => {
    // 创建节点映射，用于存储所有节点
    const nodeMap = {};
    // 存储所有路径节点
    const allPathNodes = new Set();
    const rootNodes = [];
    
    // 首先处理所有数据节点，创建它们的映射
    data.forEach(node => {
      // 创建处理后的节点
      const processedNode = {
        ...node,
        children: [],
        hasChildren: node.nodeType === 'folder',
        isLeaf: node.nodeType === 'doc',
        // 保留原始fullPath信息
        fullPath: node.fullPath || []
      };
      
      // 保存节点到映射中
      nodeMap[node.id] = processedNode;
      
      // 标记这个节点已经存在
      allPathNodes.add(node.id);
    });
    
    // 基于fullPath构建完整的树状结构
    data.forEach(node => {
      const currentNode = nodeMap[node.id];
      
      // 如果有fullPath信息，使用它来构建层级关系
      if (node.fullPath && Array.isArray(node.fullPath) && node.fullPath.length > 0) {
        // 遍历路径节点，创建必要的中间节点并建立层级关系
        let parentNode = null;
        let lastValidNode = null;
        
        for (let i = 0; i < node.fullPath.length; i++) {
          const pathItem = node.fullPath[i];
          const isCurrentNode = i === node.fullPath.length - 1;
          
          // 跳过root节点（通常是第一个节点）
          if (pathItem.name && pathItem.name.toLowerCase() === 'root') {
            // root节点作为顶层节点
            if (!rootNodes.find(n => n.name === 'root')) {
              const rootNode = {
                id: pathItem.id,
                name: pathItem.name,
                nodeType: pathItem.nodeType,
                children: [],
                hasChildren: true,
                isLeaf: false,
                fullPath: [pathItem]
              };
              rootNodes.push(rootNode);
              nodeMap[pathItem.id] = rootNode;
            }
            parentNode = nodeMap[pathItem.id];
            lastValidNode = parentNode;
            continue;
          }
          
          // 处理当前路径节点
          if (pathItem.id) {
            // 检查是否已经创建了这个节点
            if (!nodeMap[pathItem.id]) {
              // 创建中间路径节点
              const pathNode = {
                id: pathItem.id,
                name: pathItem.name,
                nodeType: pathItem.nodeType,
                children: [],
                hasChildren: true,
                isLeaf: false,
                fullPath: node.fullPath.slice(0, i + 1)
              };
              nodeMap[pathItem.id] = pathNode;
              allPathNodes.add(pathItem.id);
            }
            
            const currentPathNode = nodeMap[pathItem.id];
            
            // 如果是最后一个节点，并且是我们的数据节点，则使用原始节点
            if (isCurrentNode && currentNode.id === pathItem.id) {
              currentPathNode.children = currentNode.children;
            }
            
            // 建立父子关系
            if (parentNode && parentNode !== currentPathNode) {
              // 避免重复添加子节点
              if (!parentNode.children.find(n => n.id === currentPathNode.id)) {
                parentNode.children.push(currentPathNode);
              }
            } else if (!parentNode && !isCurrentNode) {
              // 如果没有父节点且不是当前节点，将其添加到根节点
              if (!rootNodes.find(n => n.id === currentPathNode.id)) {
                rootNodes.push(currentPathNode);
              }
            }
            
            parentNode = currentPathNode;
            lastValidNode = parentNode;
          }
        }
      } else if (!rootNodes.find(n => n.id === currentNode.id)) {
        // 如果没有fullPath信息，则作为根节点
        rootNodes.push(currentNode);
      }
    });
    
    // 确保每个节点都被包含在树中
    Object.values(nodeMap).forEach(node => {
      // 检查节点是否已经在树中
      const isInTree = (nodes) => {
        for (const n of nodes) {
          if (n.id === node.id) return true;
          if (n.children && isInTree(n.children)) return true;
        }
        return false;
      };
      
      // 如果节点不在树中，尝试通过parentId找到父节点
      if (!isInTree(rootNodes) && node.parentId && node.parentId !== 0 && nodeMap[node.parentId]) {
        const parentNode = nodeMap[node.parentId];
        if (!parentNode.children.find(n => n.id === node.id)) {
          parentNode.children.push(node);
        }
      }
    });
    console.log(rootNodes)
    // 返回构建好的树状结构的根节点列表
    return rootNodes;
  };

  // 处理关键词变化（支持按Enter搜索）
  const handleKeywordChange = (e) => {
    const keyword = e.target.value;
    setSearchKeyword(keyword);
    
    if (!keyword.trim()) {
      // 如果关键词清空，显示所有数据
      setDataSource(originalDataSource);
    }
  };

  // 处理表单提交
  const handleSubmit = async (values) => {
    try {
      if (editingRecord) {
        // 编辑操作
        // 这里调用编辑API
        message.success('编辑成功');
      } else {
        // 添加操作
        // 这里调用添加API
        message.success('添加成功');
      }
      setModalVisible(false);
      fetchCategoryTree(); // 重新加载数据
    } catch (error) {
      message.error(editingRecord ? '编辑失败' : '添加失败');
    }
  };

  return (
    
    <div className="management-content">
      <div className="content-header">
      <div style={{ flex: 1, maxWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Input.Search
                placeholder="搜索分类名称或描述"
                value={searchKeyword}
                onChange={handleKeywordChange}
                onSearch={handleSearch}
                onPressEnter={handleSearch}
                suffix={
                   
                    <CloseOutlined
                      type="close-circle"
                      onClick={(e) => {
                       
                        setSearchKeyword('');
                        setDataSource(originalDataSource);
                        setIsSearchResult(false); // 重置搜索结果标记
                      }}
                      style={{ cursor: 'pointer', color: '#999' }}
                    />
                  
                }
                style={{ width: 'calc(100% - 80px)' }}
              />
              
            </div>
          </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <RoleProtectedComponent permission="canManageCategories">
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => handleAddKnowledge(null, 'folder')}
            >
              Primary Menu
            </Button>
          </RoleProtectedComponent>
        </div>
      </div>

      <div className="content-body">
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          pagination={false}
          onRow={(record) => ({
            onDoubleClick: () => handleRowDoubleClick(record),
            style: { cursor: 'pointer' }
          })}
          expandable={{
            expandedRowKeys: expandedRowKeys, // 控制展开的行
            indentSize: 20,
            expandIcon: ({ expanded, onExpand, record }) => {
              // 如果是叶子节点，不显示展开图标
              if (record.isLeaf) return null;
              
              // 如果正在加载中，显示加载图标
              if (loadingKeys.includes(record.key)) {
                return <LoadingOutlined style={{ fontSize: '12px', color: '#1890ff' }} />;
              }
              
              // 如果有子节点或者是folder类型
              return (
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    // 如果还没加载过子节点且没有子节点数据，则加载
                    if (!expanded && (!record.children || record.children.length === 0)) {
                      loadChildNodes(record.id, record.key);
                    }
                    
                    // 手动更新expandedRowKeys状态
                    if (expanded) {
                      // 收起时从展开列表中移除
                      setExpandedRowKeys(prev => prev.filter(key => key !== record.key));
                    } else {
                      // 展开时添加到展开列表
                      setExpandedRowKeys(prev => {
                        if (!prev.includes(record.key)) {
                          return [...prev, record.key];
                        }
                        return prev;
                      });
                    }
                    
                    onExpand(record, e);
                  }}
                  style={{ 
                    cursor: 'pointer',
                    color: '#666',
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s',
                    width: '16px',
                    height: '16px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = '#1890ff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = '#666';
                  }}
                >
                  {expanded ? <CaretUpOutlined /> : <CaretDownOutlined />}
                </span>
              );
            }
          }}
          rowKey="key"
          className="category-table"
        />
      </div>
     

      {/* 添加/编辑弹窗 */}
      <Modal
        title={editingRecord ? '编辑栏目' : '新增栏目'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {!editingRecord && (
            <>
              <Form.Item
                label="父级栏目"
                name="parentName"
              >
                <Input disabled />
              </Form.Item>
              <Form.Item
                name="parentId"
                hidden
              >
                <Input />
              </Form.Item>
            </>
          )}
          
          <Form.Item
            label="栏目名称"
            name="name"
            rules={[{ required: true, message: '请输入栏目名称' }]}
          >
            <Input placeholder="请输入栏目名称" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <Input.TextArea 
              placeholder="请输入栏目描述" 
              rows={3}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingRecord ? '保存' : '添加'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryManagement;