import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Button, 
  Space, 
  Typography, 
  Upload,
  message,
  List,
  Popconfirm
} from 'antd';
import { 
  UploadOutlined,
  DeleteOutlined,
  LinkOutlined,
  FileOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

const RowModal = ({ 
  visible, 
  onClose, 
  onSave, 
  columns, 
  editingRow = null 
}) => {
  const [form] = Form.useForm();
  const [files, setFiles] = useState({});

  // Initialize form when modal opens
  useEffect(() => {
    if (visible && columns) {
      if (editingRow && editingRow.data) {
        // Editing existing row
        const formValues = {};
        const fileData = {};
        
        columns.forEach(col => {
          const value = editingRow.data[col.id];
          if (col.type === 'file') {
            fileData[col.id] = Array.isArray(value) ? value : [];
          } else {
            formValues[col.id] = value || '';
          }
        });
        
        form.setFieldsValue(formValues);
        setFiles(fileData);
      } else {
        // Adding new row
        form.resetFields();
        const emptyFiles = {};
        columns.forEach(col => {
          if (col.type === 'file') {
            emptyFiles[col.id] = [];
          }
        });
        setFiles(emptyFiles);
      }
    }
  }, [visible, editingRow, columns, form]);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Combine form values with file data
      const rowData = {};
      columns.forEach(col => {
        if (col.type === 'file') {
          rowData[col.id] = files[col.id] || [];
        } else {
          rowData[col.id] = values[col.id] || '';
        }
      });

      onSave(rowData);
      handleClose();
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  // Handle file upload
  const handleFileUpload = (columnId, file) => {
    const newFile = {
      id: `file_${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file), // For preview, in real app this would be upload URL
      file: file
    };

    setFiles(prev => ({
      ...prev,
      [columnId]: [...(prev[columnId] || []), newFile]
    }));

    message.success(`文件 "${file.name}" 已添加`);
    return false; // Prevent automatic upload
  };

  // Handle file deletion
  const handleFileDelete = (columnId, fileId) => {
    setFiles(prev => ({
      ...prev,
      [columnId]: (prev[columnId] || []).filter(f => f.id !== fileId)
    }));
    message.success('文件已删除');
  };

  // Handle modal close
  const handleClose = () => {
    form.resetFields();
    setFiles({});
    onClose();
  };

  // Validate URL
  const validateUrl = (_, value) => {
    if (!value) return Promise.resolve();
    
    try {
      const url = value.startsWith('http') ? value : `https://${value}`;
      new URL(url);
      return Promise.resolve();
    } catch {
      return Promise.reject(new Error('请输入有效的链接地址'));
    }
  };

  // Render field based on column type
  const renderField = (column) => {
    const rules = column.required ? [{ required: true, message: `请输入${column.name}` }] : [];

    switch (column.type) {
      case 'text':
        return (
          <Form.Item
            key={column.id}
            name={column.id}
            label={column.name}
            rules={rules}
          >
            <Input placeholder={`请输入${column.name}`} />
          </Form.Item>
        );

      case 'longtext':
        return (
          <Form.Item
            key={column.id}
            name={column.id}
            label={column.name}
            rules={rules}
          >
            <TextArea 
              rows={3} 
              placeholder={`请输入${column.name}`} 
              maxLength={1000}
              showCount
            />
          </Form.Item>
        );

      case 'link':
        return (
          <Form.Item
            key={column.id}
            name={column.id}
            label={column.name}
            rules={[
              ...rules,
              { validator: validateUrl }
            ]}
          >
            <Input 
              prefix={<LinkOutlined />}
              placeholder="https://example.com" 
            />
          </Form.Item>
        );

      case 'file':
        const columnFiles = files[column.id] || [];
        
        return (
          <Form.Item
            key={column.id}
            label={column.name}
            required={column.required}
          >
            <div>
              <Upload
                beforeUpload={(file) => handleFileUpload(column.id, file)}
                showUploadList={false}
                accept=".txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.zip,.rar,.jpg,.jpeg,.png,.mp3,.mp4"
              >
                <Button icon={<UploadOutlined />}>
                  选择文件
                </Button>
              </Upload>
              
              {columnFiles.length > 0 && (
                <List
                  size="small"
                  style={{ marginTop: 12 }}
                  dataSource={columnFiles}
                  renderItem={(file) => (
                    <List.Item
                      actions={[
                        <Popconfirm
                          key="delete"
                          title="确定删除这个文件吗？"
                          onConfirm={() => handleFileDelete(column.id, file.id)}
                          okText="删除"
                          cancelText="取消"
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
                        avatar={<FileOutlined style={{ color: '#1890ff' }} />}
                        title={file.name}
                        description={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                      />
                    </List.Item>
                  )}
                />
              )}
              
              {column.required && columnFiles.length === 0 && (
                <Text type="danger" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
                  此字段为必填项，请上传文件
                </Text>
              )}
            </div>
          </Form.Item>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      title={editingRow ? '编辑行数据' : '添加新行'}
      open={visible}
      onCancel={handleClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          {editingRow ? '保存' : '添加'}
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
      >
        {columns.map(column => renderField(column))}
      </Form>
    </Modal>
  );
};

export default RowModal;
