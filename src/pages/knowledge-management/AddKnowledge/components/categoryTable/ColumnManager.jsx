import React, { useState } from 'react';
import { 
  Drawer, 
  Form, 
  Input, 
  Select, 
  Switch, 
  Button, 
  Space, 
  List, 
  Typography, 
  Popconfirm,
  message,
  Divider
} from 'antd';
import { 
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  FileOutlined,
  LinkOutlined,
  AlignLeftOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

const ColumnManager = ({ visible, onClose, columns, onColumnsChange }) => {
  const [form] = Form.useForm();
  const [editingColumn, setEditingColumn] = useState(null);

  // Column types
  const columnTypes = [
    { value: 'text', label: '文本', icon: <EditOutlined /> },
    { value: 'longtext', label: '长文本', icon: <AlignLeftOutlined /> },
    { value: 'link', label: '链接', icon: <LinkOutlined /> },
    { value: 'file', label: '文件', icon: <FileOutlined /> }
  ];

  // Add new column
  const handleAddColumn = (values) => {
    const newColumn = {
      id: `col_${Date.now()}`,
      name: values.name.trim(),
      type: values.type,
      required: values.required || false
    };

    const updatedColumns = [...columns, newColumn];
    onColumnsChange(updatedColumns);
    
    form.resetFields();
    message.success(`已添加列 "${newColumn.name}"`);
  };

  // Update existing column
  const handleUpdateColumn = (values) => {
    const updatedColumns = columns.map(col => 
      col.id === editingColumn.id 
        ? { ...col, name: values.name.trim(), type: values.type, required: values.required || false }
        : col
    );

    onColumnsChange(updatedColumns);
    
    form.resetFields();
    setEditingColumn(null);
    message.success('列已更新');
  };

  // Delete column
  const handleDeleteColumn = (columnId) => {
    const columnName = columns.find(col => col.id === columnId)?.name;
    const updatedColumns = columns.filter(col => col.id !== columnId);
    
    onColumnsChange(updatedColumns);
    message.success(`列 "${columnName}" 已删除`);
  };

  // Start editing
  const startEdit = (column) => {
    setEditingColumn(column);
    form.setFieldsValue({
      name: column.name,
      type: column.type,
      required: column.required
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingColumn(null);
    form.resetFields();
  };

  // Form submission
  const handleSubmit = (values) => {
    if (editingColumn) {
      handleUpdateColumn(values);
    } else {
      handleAddColumn(values);
    }
  };

  return (
    <Drawer
      title="管理表格列"
      width={400}
      onClose={onClose}
      open={visible}
    >
      {/* Add/Edit Form */}
      <Title level={5}>
        {editingColumn ? '编辑列' : '添加新列'}
      </Title>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ marginBottom: 24 }}
      >
        <Form.Item
          name="name"
          label="列名"
          rules={[
            { required: true, message: '请输入列名' },
            { max: 20, message: '列名不能超过20个字符' }
          ]}
        >
          <Input placeholder="例如：文档名称、负责人" />
        </Form.Item>

        <Form.Item
          name="type"
          label="数据类型"
          rules={[{ required: true, message: '请选择数据类型' }]}
          initialValue="text"
        >
          <Select>
            {columnTypes.map(type => (
              <Select.Option key={type.value} value={type.value}>
                <Space>
                  {type.icon}
                  {type.label}
                </Space>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="required"
          label="必填项"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              {editingColumn ? '更新' : '添加'}
            </Button>
            {editingColumn && (
              <Button onClick={cancelEdit}>取消</Button>
            )}
          </Space>
        </Form.Item>
      </Form>

      <Divider />

      {/* Existing Columns */}
      <Title level={5}>现有列 ({columns.length})</Title>
      
      {columns.length === 0 ? (
        <Text type="secondary">暂无列</Text>
      ) : (
        <List
          size="small"
          dataSource={columns}
          renderItem={(column) => (
            <List.Item
              actions={[
                <Button
                  key="edit"
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => startEdit(column)}
                />,
                <Popconfirm
                  key="delete"
                  title={
                    <div>
                      <div>确定删除列 "{column.name}" 吗？</div>
                      <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: 4 }}>
                        这将删除该列的所有数据，无法恢复
                      </div>
                    </div>
                  }
                  onConfirm={() => handleDeleteColumn(column.id)}
                  okText="确定删除"
                  cancelText="取消"
                  okType="danger"
                >
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                avatar={columnTypes.find(t => t.value === column.type)?.icon}
                title={
                  <Space>
                    {column.name}
                    {column.required && <Text type="danger">*</Text>}
                  </Space>
                }
                description={columnTypes.find(t => t.value === column.type)?.label}
              />
            </List.Item>
          )}
        />
      )}
    </Drawer>
  );
};

export default ColumnManager;
