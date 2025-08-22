import React, { useState } from 'react';
import { 
  Input, 
  Select, 
  Checkbox, 
  Button, 
  Space,
  Dropdown,
  List,
  Typography,
  message
} from 'antd';
import { 
  DeleteOutlined,
  SettingOutlined,
  TagsOutlined,
  CalendarOutlined,
  FileTextOutlined,
  DownOutlined
} from '@ant-design/icons';
import { useKnowledgeForm } from './hooks/useKnowledgeForm';
import { useFileUpload } from './hooks/useFileUpload';
import CategorySidebar from './components/CategorySidebar';
import KnowledgeEditor from './components/KnowledgeEditor';
import KnowledgeSettings from './components/KnowledgeSettings';
import './AddKnowledge.scss';

const { Text, Title } = Typography;

const AddKnowledge = () => {
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const {
    formData,
    setFormData,
    contentHtml,
    setContentHtml,
    loading,
    tagInput,
    setTagInput,
    tagError,
    handlePrivateToChange,
    handleAddTag,
    handleRemoveTag,
    handlePublish,
    handleCancel
  } = useKnowledgeForm();
  const { createImageUploadHandler, handleRemoveAttachment, isUploading } = useFileUpload();
  // Create image upload handler
  const handleImageUpload = createImageUploadHandler();

  // Check if publish button should be disabled
  const isPublishDisabled = isUploading() || loading;

  // Settings button dropdown menu
  const settingsMenuItems = [
    {
      key: 'tags',
      icon: <TagsOutlined />,
      label: '标签管理',
      onClick: () => setSettingsDrawerOpen(true)
    },
    {
      key: 'time',
      icon: <CalendarOutlined />,
      label: '有效时间',
      onClick: () => setSettingsDrawerOpen(true)
    },
    {
      key: 'attachment',
      icon: <FileTextOutlined />,
      label: '附件上传',
      onClick: () => setSettingsDrawerOpen(true)
    }
  ];

  // Handle category selection
  const handleCategoryChange = (value) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  return (
    <div className="knowledge-management-layout">
      {/* Left category tree */}
      <CategorySidebar 
        selectedCategory={formData.category}
        onCategoryChange={handleCategoryChange}
      />

      {/* Main content area */}
      <div className="knowledge-management-content">
        <div className="management-content">
          {/* Page header area */}
          <div className="content-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <Title level={3} style={{ margin: 0 }}>新增知识</Title>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Text strong>可见范围：</Text>
                <Select
                  mode="multiple"
                  style={{ width: 300 }}
                  placeholder="选择可见范围"
                  value={formData.privateToRoles}
                  onChange={handlePrivateToChange}
                  options={[
                    { label: 'All', value: 'ALL' },
                    { label: 'WPB', value: 'WPB' },
                    { label: 'GPB', value: 'GPB' },
                    { label: 'CCSS', value: 'CCSS' }
                  ]}
                />
              </div>
            </div>
            <Space>
              <Dropdown 
                menu={{ items: settingsMenuItems }}
                placement="bottomRight"
              >
                <Button icon={<SettingOutlined />}>
                  配置 <DownOutlined />
                </Button>
              </Dropdown>
            </Space>
          </div>

          {/* Main content body */}
          <div className="content-body">
            {/* Title input */}
            <div className="title-section">
              <Input
                className="title-input"
                placeholder="请输入标题"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                maxLength={200}
              />
            </div>

            {/* Rich text editor */}
            <KnowledgeEditor 
              contentHtml={contentHtml}
              onContentChange={setContentHtml}
              onImageUpload={handleImageUpload}
            />

            {/* Action buttons */}
            <div style={{ textAlign: 'center', marginTop: 24, marginBottom: 16 }}>
              <Space size="large">
                <Button 
                  type="primary" 
                  size="large"
                  onClick={() => handlePublish(isUploading)}
                  disabled={isPublishDisabled}
                  loading={loading}
                  style={{ 
                    backgroundColor: '#ff4d4f',
                    borderColor: '#ff4d4f'
                  }}
                  onMouseEnter={(e) => {
                    if (!isPublishDisabled && !loading) {
                      e.target.style.backgroundColor = '#ff7875';
                      e.target.style.borderColor = '#ff7875';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isPublishDisabled && !loading) {
                      e.target.style.backgroundColor = '#ff4d4f';
                      e.target.style.borderColor = '#ff4d4f';
                    }
                  }}
                >
                  发布
                </Button>
                <Button size="large" onClick={handleCancel}>
                  取消
                </Button>
              </Space>
            </div>

            {/* Attachment display area */}
            {formData.attachments.length > 0 && (
              <div className="attachments-display">
                <Text strong>已上传附件：</Text>
                <List
                  size="small"
                  style={{ marginTop: 8 }}
                  dataSource={formData.attachments}
                  renderItem={(attachment) => (
                    <List.Item
                      actions={[
                        <Button
                          key="delete"
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveAttachment(attachment.uid, setFormData)}
                        >
                          删除
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<FileTextOutlined />}
                        title={attachment.name}
                        description={`大小: ${(attachment.size / 1024 / 1024).toFixed(2)} MB`}
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

            {/* Data disclaimer */}
            <div className="footer-section">
              <div className="checkbox-item">
                <Checkbox
                  checked={formData.disclaimer}
                  onChange={(e) => setFormData(prev => ({ ...prev, disclaimer: e.target.checked }))}
                >
                  我已知晓Jarvis平台不适用于上传任何restricted data及个人信息（包含但不限于客户及员工信息）
                </Checkbox>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings drawer */}
      <KnowledgeSettings
        open={settingsDrawerOpen}
        onClose={() => setSettingsDrawerOpen(false)}
        formData={formData}
        setFormData={setFormData}
        tagInput={tagInput}
        setTagInput={setTagInput}
        tagError={tagError}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
      />
    </div>
  );
};

export default AddKnowledge;
