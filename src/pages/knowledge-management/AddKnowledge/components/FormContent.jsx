import React from 'react';
import { Input, Checkbox, Radio, Typography } from 'antd';
import KnowledgeEditor from './KnowledgeEditor';
import SimpleTable from './categoryTable/SimpleTable';
import AttachmentList from './AttachmentList';

const { Text } = Typography;

const FormContent = ({
  formData,
  setFormData,
  contentHtml,
  setContentHtml,
  nodeTypeToCreate,
  setNodeTypeToCreate,
  handleImageUpload,
  handleRemoveAttachment,
  isEditMode,
  hasTableData,
  isTableCheckboxDisabled,
  handleTableChange
}) => {
  return (
    <div className="content-body">
      {/* Node type selector - always show when category is selected (including root) */}
      {(formData.category !== null && formData.category !== undefined) && (
        <div className="node-type-selector">
          <div className="selector-label">创建类型：</div>
          <Radio.Group 
            value={nodeTypeToCreate} 
            onChange={(e) => setNodeTypeToCreate(e.target.value)}
            size="small"
          >
            <Radio value="doc">📄 Item</Radio>
            <Radio value="folder">📁 Category</Radio>
          </Radio.Group>
        </div>
      )}

      {/* Title input */}
      <div className="title-section">
        <Input
          className="title-input"
          placeholder={nodeTypeToCreate === 'folder' ? "请输入Category名称" : "请输入标题"}
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          maxLength={200}
        />
      </div>

      {/* Rich text editor - always show */}
      <KnowledgeEditor 
        contentHtml={contentHtml}
        onContentChange={setContentHtml}
        onImageUpload={handleImageUpload}
      />

      {/* Table toggle checkbox - only show for folder type creation */}
      {nodeTypeToCreate === 'folder' && (
        <>
          <div style={{ marginTop: '24px', marginBottom: '16px' }}>
            <Checkbox
              checked={formData.enableTable}
              disabled={isTableCheckboxDisabled()}
              onChange={(e) => setFormData(prev => ({ ...prev, enableTable: e.target.checked }))}
            >
              启用表格
            </Checkbox>
            {formData.enableTable && !isTableCheckboxDisabled() && (
              <Text type="secondary" style={{ marginLeft: '8px' }}>
                为此分类添加结构化表格数据
              </Text>
            )}
            {isTableCheckboxDisabled() && (
              <Text type="warning" style={{ marginLeft: '8px' }}>
                表格包含数据，无法取消启用。请先清空表格内容。
              </Text>
            )}
          </div>

          {/* Simple Table - only show when enabled */}
          {formData.enableTable && (
            <SimpleTable 
              tableData={formData.tableData}
              onChange={handleTableChange}
            />
          )}
        </>
      )}

      {/* Data disclaimer */}
      <div className="footer-section">
        <div className="checkbox-item">
          <Checkbox
            checked={formData.disclaimer}
            onChange={(e) => setFormData(prev => ({ ...prev, disclaimer: e.target.checked }))}
          >
            我已知晓 SMART SEARCH 平台不适用于上传任何restricted data及个人信息（包含但不限于客户及员工信息）
          </Checkbox>
        </div>
      </div>

      {/* Attachment display area */}
      <AttachmentList 
        attachments={formData.attachments}
        onRemoveAttachment={handleRemoveAttachment}
        setFormData={setFormData}
      />
    </div>
  );
};

export default FormContent;
