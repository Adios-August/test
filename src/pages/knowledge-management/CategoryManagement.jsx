import React, { useState, useEffect } from 'react';
import { Table, Button, Space, message, Spin, Modal, Form, Input, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, ArrowUpOutlined, ArrowDownOutlined, CaretUpOutlined, CaretDownOutlined, LoadingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { homeAPI } from '../../api/home';
import { knowledgeAPI } from '../../api/knowledge';
import '../knowledge-management/KnowledgeManagement.scss';

const { Option } = Select;

const CategoryManagement = () => {
  const navigate = useNavigate();
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [loadingKeys, setLoadingKeys] = useState([]);
  const [form] = Form.useForm();

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
        setDataSource(tableData);
      } else {
        message.error(response.message || '获取知识树失败');
        setDataSource([]);
      }
    } catch (error) {
      console.error('获取知识树失败:', error);
      message.error('获取知识树失败，请稍后重试');
      setDataSource([]);
    } finally {
      setLoading(false);
    }
  };

  // 转换数据格式以适应Table组件（带层级缩进）
  const transformToTableData = (categories, parentKey = null, currentLevel = 0) => {
    return (categories || []).map((category, index) => {
      const key = parentKey ? `${parentKey}-${index}` : index.toString();
      const node = {
        key,
        id: category.id,
        name: category.name,
        description: category.description || '',
        parentId: category.parentId ?? null,
        level: currentLevel,
        updateStaff: category.updateStaff || '-',
        updateTime: category.updateTime || '-',
        nodeType: category.nodeType || 'folder',
        isLeaf: category.nodeType === 'doc', // doc类型为叶子节点
        hasChildren: true, // 默认假设有子节点，延迟加载
      };
      // 如果有子节点数据，则转换
      if (category.children && category.children.length > 0) {
        node.children = transformToTableData(category.children, key, currentLevel + 1);
      }
      return node;
    });
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchCategoryTree();
  }, []);

  // 加载子节点
  const loadChildNodes = async (parentId, key) => {
    setLoadingKeys(prev => [...prev, key]);
    try {
      const response = await knowledgeAPI.getChildren(parentId, { nodeType: 'folder' });
      if (response.code === 200) {
        const children = response.data?.records || [];
        const childrenData = transformToTableData(children, key, 0);
        
        // 更新数据源，将子节点添加到对应的父节点下
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
      render: (text, record) => (
        <span style={{ 
          fontWeight: record.children && record.children.length > 0 ? 'bold' : 'normal'
        }}>
          {text}
        </span>
      ),
    },
    {
      title: 'Item Name',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || '-',
    },
    {
      title: 'Update staff',
      dataIndex: 'updateStaff',
      key: 'updateStaff',
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
            icon={<ArrowUpOutlined />}
            onClick={() => handleMoveUp(record)}
            size="small"
          />
          <Button 
            type="link" 
            icon={<ArrowDownOutlined />}
            onClick={() => handleMoveDown(record)}
            size="small"
          />
        </Space>
      ),
    },
  ];

  // 处理新增知识操作
  const handleAddKnowledge = async (record = null, nodeType = null) => {
    const parentId = record?.id || 0;
    navigate(`/add-knowledge?parentId=${parentId}&nodeType=${nodeType}`);
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

  // 处理删除操作
  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除知识节点"${record.name}"吗？删除后不可恢复。`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await knowledgeAPI.deleteKnowledge(record.id);
          if (res.code === 200) {
            message.success('删除成功');
          }
          fetchCategoryTree(); // 重新加载数据
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
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
          <div></div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => handleAddKnowledge(null, 'folder')}
          >
            一级菜单
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => handleAddKnowledge(null, 'doc')}
          >
            新增知识
          </Button>
        </div>
      </div>

      <div className="content-body">
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          pagination={false}
          expandable={{
            defaultExpandAllRows: false,
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
                    // 如果还没加载过子节点且没有子节点数据，则加载
                    if (!expanded && (!record.children || record.children.length === 0)) {
                      e.stopPropagation();
                      loadChildNodes(record.id, record.key);
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