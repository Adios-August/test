import React, { useEffect, useState } from 'react';
import { Table, Space, Select, message, Input, Button, Modal, Form, Dropdown, Menu } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons';
import { http } from '../../utils/request';
 
import '../knowledge-management/KnowledgeManagement.scss';

const RoleManagement = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [wsFilter, setWsFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editType, setEditType] = useState(''); // 'systemRole' or 'workspace'
  const [newWorkspace, setNewWorkspace] = useState('');
  const [workspaceModalVisible, setWorkspaceModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [workspaceForm] = Form.useForm();

  const fetchDept = async () => {
    try {
      const res = await http.get('/users/departments');
      setDepartments(res);
    } catch {}
  };

  const fetchData = async (p = page, s = size) => {
    setLoading(true);
    try {
      const res = await http.get('/admin/users', { page: p, size: s, keyword, workspace: wsFilter });
      const records = res?.data?.records || res?.records || [];
      setData(records);
      setTotal(res?.data?.total || res?.total || records.length);
    } catch (e) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDept(); fetchData(); }, []);

  const handleRoleChange = async (id, systemRole) => {
    try {
      await http.put(`/admin/users/${id}`, { systemRole });
      message.success('已更新');
      fetchData(page, size);
    } catch (e) {
      message.error('更新失败');
    }
  };

  const handleWorkspaceChange = async (id, workspace) => {
    try {
      await http.put(`/admin/users/${id}`, { workspace });
      message.success('已更新');
      fetchData(page, size);
    } catch (e) {
      message.error('更新失败');
    }
  };

  // 处理编辑弹窗
  const handleEdit = (record, type) => {
    setEditingRecord(record);
    setEditType(type);
    setEditModalVisible(true);
    
    if (type === 'systemRole') {
      form.setFieldsValue({ systemRole: record.systemRole });
    } else if (type === 'workspace') {
      const valueArr = (record.workspace || '').split(',').map(s => s.trim()).filter(Boolean);
      form.setFieldsValue({ workspace: valueArr });
    }
  };

  // 处理弹窗提交
  const handleEditSubmit = async (values) => {
    try {
      const updateData = editType === 'systemRole' 
        ? { systemRole: values.systemRole }
        : { workspace: (values.workspace || []).join(',') };
      
      await http.put(`/admin/users/${editingRecord.id}`, updateData);
      message.success('已更新');
      setEditModalVisible(false);
      fetchData(page, size);
    } catch (e) {
      message.error('更新失败');
    }
  };

  // 处理删除
  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户 "${record.username}" 吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await http.delete(`/admin/users/${record.id}`);
          message.success('删除成功');
          fetchData(page, size);
        } catch (e) {
          message.error('删除失败');
        }
      },
    });
  };

  const workspaceOptions = (Array.isArray(departments) ? departments : []).map(d => ({ value: d, label: d }));

  // 处理添加Workspace
  const handleAddWorkspace = () => {
    workspaceForm.validateFields().then(async (values) => {
      try {
        // 这里可以调用API添加新的workspace
        message.success(`添加Workspace: ${values.workspaceName}`);
        setWorkspaceModalVisible(false);
        workspaceForm.resetFields();
        // 重新获取workspace列表
        fetchDept();
      } catch (e) {
        message.error('添加Workspace失败');
      }
    });
  };

  // 处理取消添加Workspace
  const handleCancelAddWorkspace = () => {
    setWorkspaceModalVisible(false);
    workspaceForm.resetFields();
  };

  const columns = [
    { 
      title: 'Staff ID', 
      dataIndex: 'staffId', 
      width: 120,
      render: (text, record) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {record.children && record.children.length > 0 && (
            <span style={{ color: '#666', fontSize: '12px' }}>
              {record.expanded ? <CaretUpOutlined /> : <CaretDownOutlined />}
            </span>
          )}
          {text}
        </span>
      )
    },
    { title: 'User Name', dataIndex: 'username', width: 180 },
    { title: 'Staff Role', dataIndex: 'staffRole', width: 140 },
    { 
      title: 'System Role', 
      dataIndex: 'systemRole', 
      width: 160, 
      render: (v, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{v}</span>
          <EditOutlined 
            style={{ color: '#1890ff', cursor: 'pointer', fontSize: '14px' }}
            onClick={() => handleEdit(r, 'systemRole')}
          />
        </div>
      )
    },
    { 
      title: 'Workspace', 
      dataIndex: 'workspace', 
      width: 200,
      render: (v, r) => {
        const valueArr = (v || '').split(',').map(s => s.trim()).filter(Boolean);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{valueArr.join(', ')}</span>
            <EditOutlined 
              style={{ color: '#1890ff', cursor: 'pointer', fontSize: '14px' }}
              onClick={() => handleEdit(r, 'workspace')}
            />
          </div>
        );
      }
    },
    {
      title: 'Delete',
      key: 'delete',
      width: 80,
      render: (_, record) => (
        <DeleteOutlined 
          style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: '16px' }}
          onClick={() => handleDelete(record)}
        />
      )
    },
  ];

  return (
    <div className="management-content">
      <div className="content-header">
        <div></div>
        <div style={{ display: 'flex', gap: '12px' }}>
        </div>
      </div>

      <div className="content-header" style={{ marginTop: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: '#333' }}>Workspace</span>
          <Select
            value={wsFilter}
            style={{ width: 160 }}
            placeholder="All"
            showSearch
            allowClear
            options={[{ value: 'ALL', label: 'All' }, { value: 'WPB', label: 'WPB' }, { value: 'GPB', label: 'GPB' }]}
            onChange={(v) => { setWsFilter(v); fetchData(1, size); }}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            style={{ 
              borderRadius: '50%', 
              width: '32px', 
              height: '32px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: '#db0011',
              borderColor: '#db0011'
            }}
            onClick={() => setWorkspaceModalVisible(true)}
          />
       
        </div>
        
      </div>

      <div className="content-body">
        <Table 
          rowKey={(r)=>r.id}
          loading={loading}
          dataSource={data}
          columns={columns}
          pagination={{ 
            current: page, 
            pageSize: size, 
            total, 
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total, range) => `每页${size}条 共${total}条记录`,
            onChange: (p, s) => { setPage(p); setSize(s); fetchData(p, s);} 
          }}
          expandable={{
            defaultExpandAllRows: false,
            indentSize: 20,
            expandIcon: ({ expanded, onExpand, record }) => {
              if (record.children && record.children.length > 0) {
                return (
                  <span 
                    onClick={(e) => onExpand(record, e)}
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
              return null;
            }
          }}
        />
      </div>

      {/* 编辑弹窗 */}
      <Modal
        title={editType === 'systemRole' ? 'Change Type' : 'Change Workspace'}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSubmit}
        >
          {editType === 'systemRole' ? (
            <Form.Item
              name="systemRole"
              label="System Role"
              rules={[{ required: true, message: '请选择系统角色' }]}
            >
              <Select
                placeholder="请选择系统角色"
                options={[
                  { value: 'ADMIN', label: 'Admin' },
                  { value: 'BLOCKED', label: 'Blocked' },
                  { value: 'REVIEWER', label: 'Reviewer' },
                ]}
              />
            </Form.Item>
          ) : (
            <Form.Item
              name="workspace"
              label="Workspace"
              rules={[{ required: true, message: '请选择工作空间' }]}
            >
              <Select
                mode="multiple"
                allowClear
                placeholder="请选择工作空间"
                options={workspaceOptions.length ? workspaceOptions : [
                  { value: 'WPB', label: 'WPB' },
                  { value: 'GPB', label: 'GPB' },
                  { value: 'IWS', label: 'IWS' },
                  { value: 'FCCS', label: 'FCCS' },
                  { value: 'CCSS', label: 'CCSS' },
                ]}
              />
            </Form.Item>
          )}
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加Workspace弹窗 */}
      <Modal
        title="NEW"
        open={workspaceModalVisible}
        onCancel={handleCancelAddWorkspace}
        footer={null}
        destroyOnClose
        width={400}
      >
        <Form
          form={workspaceForm}
          layout="vertical"
          onFinish={handleAddWorkspace}
        >
          <Form.Item
            name="workspaceName"
            label="新建workspace名称"
            rules={[{ required: true, message: '请输入workspace名称' }]}
          >
            <Input placeholder="请输入workspace名称" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancelAddWorkspace}>
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                style={{
                  backgroundColor: '#1677ff',
                  borderColor: '#1677ff'
                }}
              >
                确定
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoleManagement; 