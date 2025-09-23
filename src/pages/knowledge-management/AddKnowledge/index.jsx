import React, { useState, useRef } from 'react';
import { 
  Button, 
  Space,
  Typography,
  Spin
} from 'antd';
import { useKnowledgeForm } from './hooks/useKnowledgeForm';
import { useFileUpload } from './hooks/useFileUpload';
import { usePopupManager } from './hooks/usePopupManager';
import CategorySidebar from './components/CategorySidebar';
import ConfigurationButtons from './components/ConfigurationButtons';
import FormContent from './components/FormContent';
import PopupContainer from './components/PopupContainer';
import './AddKnowledge.scss';

const { Text, Title } = Typography;

const AddKnowledge = ({ mode = 'add' }) => {
  // State management
  const [isCurrentCategoryLeafNode, setIsCurrentCategoryLeafNode] = useState(false);
  const [nodeTypeToCreate, setNodeTypeToCreate] = useState('doc'); // default to document
  const [isCurrentCategoryFolderNode, setIsCurrentCategoryFolderNode] = useState(false);
  
  // Refs for anchor positioning
  const tagsButtonRef = useRef(null);
  const timeButtonRef = useRef(null);
  const attachmentButtonRef = useRef(null);
  const visibilityButtonRef = useRef(null);

  // Custom hooks
  const { activePopup, popupPosition, handlePopupToggle, handleClosePopup } = usePopupManager();
  const {
    formData,
    setFormData,
    contentHtml,
    setContentHtml,
    loading,
    dataLoading,
    tagInput,
    setTagInput,
    tagError,
    isEditMode,
    handlePrivateToChange,
    handleAddTag,
    handleRemoveTag,
    handlePublish,
    handleCancel
  } = useKnowledgeForm(mode);
  const { createImageUploadHandler, handleRemoveAttachment, isUploading } = useFileUpload();

  // Create image upload handler
  const handleImageUpload = createImageUploadHandler();

  // Check if publish button should be disabled
  const isPublishDisabled = isUploading() || loading;

  // Handle category selection
  const handleCategoryChange = (value) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  // 当从“一级菜单”入口进入（parentId=0 且 nodeType=folder）时，初始化为根目录并隐藏类目选择
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const parentId = params.get('parentId');
    const nodeTypeParam = params.get('nodeType');
    const isRootFolderCreation = (parentId === '0') && (nodeTypeParam === 'folder');
    if (isRootFolderCreation) {
      setNodeTypeToCreate('folder');
      setFormData(prev => ({ ...prev, category: 0 }));
    }
  }, []);

  // Handle publish with node type
  const handlePublishWithNodeType = (isUploading) => {
    handlePublish(isUploading, nodeTypeToCreate);
  };

  // Handle table change
  const handleTableChange = (tableData) => {
    setFormData(prev => {
      const updatedFormData = { ...prev, tableData };
      
      // In edit mode, if table becomes empty (no columns and no rows), 
      // user can now disable the table checkbox
      if (isEditMode && 
          (!tableData.columns || tableData.columns.length === 0) && 
          (!tableData.rows || tableData.rows.length === 0)) {
        // Table is now empty, checkbox will be re-enabled automatically
        // by the isTableCheckboxDisabled function
      }
      
      return updatedFormData;
    });
  };

  // Check if table has data (columns or rows)
  const hasTableData = () => {
    const { tableData } = formData;
    return (
      (tableData.columns && tableData.columns.length > 0) ||
      (tableData.rows && tableData.rows.length > 0)
    );
  };

  // Check if checkbox should be disabled in edit mode
  const isTableCheckboxDisabled = () => {
    return isEditMode && formData.enableTable && hasTableData();
  };

  // Show loading spinner while data is being loaded in edit mode
  if (dataLoading) {
    return (
      <div className="knowledge-management-layout">
        <div className="knowledge-management-content" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px' 
        }}>
          <Spin size="large" />
          <div style={{ marginLeft: 16 }}>正在加载知识详情...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="knowledge-management-layout">
      {/* Left category tree - 创建一级类目时隐藏 */}
      {(() => {
        const params = new URLSearchParams(window.location.search);
        const parentId = params.get('parentId');
        const nodeTypeParam = params.get('nodeType');
        const hideSidebar = parentId === '0' && nodeTypeParam === 'folder';
        if (hideSidebar) return null;
        return (
          <CategorySidebar 
            selectedCategory={formData.category}
            onCategoryChange={handleCategoryChange}
            onLeafNodeCheck={setIsCurrentCategoryLeafNode}
            onFolderNodeCheck={setIsCurrentCategoryFolderNode}
          />
        );
      })()}

      {/* Main content area */}
      <div className="knowledge-management-content">
        <div className="management-content">
          {/* Page header area */}
          <div className="content-header">
            <div className="header-content">
              <Title level={3} style={{ margin: 0 }}>{isEditMode ? '修改知识' : '新增知识'}</Title>
              
              {/* Configuration buttons */}
              <ConfigurationButtons
                formData={formData}
                tagsButtonRef={tagsButtonRef}
                visibilityButtonRef={visibilityButtonRef}
                timeButtonRef={timeButtonRef}
                attachmentButtonRef={attachmentButtonRef}
                onPopupToggle={handlePopupToggle}
              />
            </div>
          </div>

          {/* Main content body */}
          <FormContent
            formData={formData}
            setFormData={setFormData}
            contentHtml={contentHtml}
            setContentHtml={setContentHtml}
            nodeTypeToCreate={nodeTypeToCreate}
            setNodeTypeToCreate={setNodeTypeToCreate}
            handleImageUpload={handleImageUpload}
            handleRemoveAttachment={handleRemoveAttachment}
            isEditMode={isEditMode}
            hasTableData={hasTableData}
            isTableCheckboxDisabled={isTableCheckboxDisabled}
            handleTableChange={handleTableChange}
          />
            
          {/* Action buttons */}
          <div style={{ textAlign: 'center', marginTop: 24, marginBottom: 16 }}>
            <Space size="large">
              <Button 
                type="primary" 
                size="large"
                onClick={() => handlePublishWithNodeType(isUploading)}
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
                {isEditMode ? '保存' : '发布'}
              </Button>
              <Button size="large" onClick={handleCancel}>
                取消
              </Button>
            </Space>
          </div>
        </div>
      </div>

      {/* Configuration popups */}
      <PopupContainer
        activePopup={activePopup}
        popupPosition={popupPosition}
        onClosePopup={handleClosePopup}
        formData={formData}
        setFormData={setFormData}
        tagInput={tagInput}
        setTagInput={setTagInput}
        tagError={tagError}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
        handlePrivateToChange={handlePrivateToChange}
      />
    </div>
  );
};

export default AddKnowledge;
