import React, { useState, useRef } from 'react';
import { 
  Input, 
  Checkbox, 
  Button, 
  Space,
  List,
  Typography,
  message
} from 'antd';
import { 
  DeleteOutlined,
  TagsOutlined,
  CalendarOutlined,
  FileTextOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useKnowledgeForm } from './hooks/useKnowledgeForm';
import { useFileUpload } from './hooks/useFileUpload';
import CategorySidebar from './components/CategorySidebar';
import KnowledgeEditor from './components/KnowledgeEditor';
import TagsPopup from './components/TagsPopup';
import TimePopup from './components/TimePopup';
import AttachmentPopup from './components/AttachmentPopup';
import VisibilityPopup from './components/VisibilityPopup';
import './AddKnowledge.scss';

const { Text, Title } = Typography;

const AddKnowledge = () => {
  // Popup state management
  const [activePopup, setActivePopup] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  
  // Refs for anchor positioning
  const tagsButtonRef = useRef(null);
  const timeButtonRef = useRef(null);
  const attachmentButtonRef = useRef(null);
  const visibilityButtonRef = useRef(null);
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

  // Handle popup show/hide
  const handlePopupToggle = (popupType, buttonRef) => {
    if (activePopup === popupType) {
      setActivePopup(null);
      return;
    }

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      
      // Different popup widths
      const popupWidths = {
        tags: 390,
        time: 416,
        attachment: 390,
        visibility: 390
      };
      
      const popupWidth = popupWidths[popupType] || 390;
      const windowWidth = window.innerWidth;
      const contentPadding = 60; // Padding from container edges
      
      // Calculate left position, ensuring popup stays within bounds
      let leftPosition = rect.left;
      if (leftPosition + popupWidth > windowWidth - contentPadding) {
        leftPosition = windowWidth - popupWidth - contentPadding;
      }
      
      // Ensure popup doesn't go off left edge either
      if (leftPosition < contentPadding) {
        leftPosition = contentPadding;
      }
      
      setPopupPosition({
        top: rect.bottom + 8,
        left: leftPosition
      });
      setActivePopup(popupType);
    }
  };

  const handleClosePopup = () => {
    setActivePopup(null);
  };

  // Render tags display with hybrid approach
  const renderTagsDisplay = () => {
    if (formData.tags.length === 0) return null;
    
    if (formData.tags.length <= 3) {
      // Show actual tags for 3 or fewer
      return (
        <span className="content-display">
          : <span className="content-items">{formData.tags.join(', ')}</span>
        </span>
      );
    } else {
      // Show count for more than 3
      return (
        <span className="content-display">
          : <span className="content-items">{formData.tags.length}个标签</span>
        </span>
      );
    }
  };

  // Render visibility display with hybrid approach  
  const renderVisibilityDisplay = () => {
    if (formData.privateToRoles.length === 0) return null;
    
    if (formData.privateToRoles.length <= 3) {
      // Show actual roles for 3 or fewer
      return (
        <span className="content-display">
          : <span className="content-items">{formData.privateToRoles.join(', ')}</span>
        </span>
      );
    } else {
      // Show count for more than 3
      return (
        <span className="content-display">
          : <span className="content-items">{formData.privateToRoles.length}个角色</span>
        </span>
      );
    }
  };

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
            <div className="header-content">
              <Title level={3} style={{ margin: 0 }}>新增知识</Title>
              
              {/* Configuration buttons */}
              <div className="config-buttons">
                <button
                  ref={tagsButtonRef}
                  className={`config-link-button ${formData.tags.length > 0 ? 'has-content' : ''}`}
                  onClick={() => handlePopupToggle('tags', tagsButtonRef)}
                >
                  <TagsOutlined style={{ marginRight: 4 }} />
                  标签管理
                  {renderTagsDisplay()}
                </button>
                
                <button
                  ref={visibilityButtonRef}
                  className={`config-link-button ${formData.privateToRoles.length > 0 ? 'has-content' : ''}`}
                  onClick={() => handlePopupToggle('visibility', visibilityButtonRef)}
                >
                  <EyeOutlined style={{ marginRight: 4 }} />
                  可见范围
                  {renderVisibilityDisplay()}
                </button>
                
                <button
                  ref={timeButtonRef}
                  className={`config-link-button ${formData.effectiveTime && formData.effectiveTime[0] ? 'has-time-config' : ''}`}
                  onClick={() => handlePopupToggle('time', timeButtonRef)}
                >
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  有效时间
                  {formData.effectiveTime && formData.effectiveTime[0] && (
                    <span className="status-indicator">●</span>
                  )}
                </button>
                
                <button
                  ref={attachmentButtonRef}
                  className="config-link-button"
                  onClick={() => handlePopupToggle('attachment', attachmentButtonRef)}
                >
                  <FileTextOutlined style={{ marginRight: 4 }} />
                  附件上传
                </button>
              </div>
            </div>
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
          </div>
        </div>
      </div>

      {/* Configuration popups */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'fixed', top: popupPosition.top, left: popupPosition.left }}>
          <TagsPopup
            visible={activePopup === 'tags'}
            onClose={handleClosePopup}
            formData={formData}
            tagInput={tagInput}
            setTagInput={setTagInput}
            tagError={tagError}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
          />
          
          <TimePopup
            visible={activePopup === 'time'}
            onClose={handleClosePopup}
            formData={formData}
            setFormData={setFormData}
          />
          
          <AttachmentPopup
            visible={activePopup === 'attachment'}
            onClose={handleClosePopup}
            formData={formData}
            setFormData={setFormData}
          />
          
          <VisibilityPopup
            visible={activePopup === 'visibility'}
            onClose={handleClosePopup}
            formData={formData}
            handlePrivateToChange={handlePrivateToChange}
          />
        </div>
      </div>
    </div>
  );
};

export default AddKnowledge;
