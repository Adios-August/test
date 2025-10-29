import React from 'react';
import { 
  TagsOutlined,
  CalendarOutlined,
  FileTextOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { renderTagsDisplay, renderVisibilityDisplay } from '../utils/displayUtils';

const ConfigurationButtons = ({ 
  formData, 
  tagsButtonRef, 
  visibilityButtonRef, 
  timeButtonRef, 
  attachmentButtonRef,
  onPopupToggle 
}) => {
  // Check if required fields are filled
  const hasTags = formData.tags && formData.tags.length > 0;
  const hasVisibility = formData.privateToRoles && formData.privateToRoles.length > 0;
  const hasTime = formData.effectiveTime && formData.effectiveTime[0] && formData.effectiveTime[1];

  return (
    <div className="config-buttons">
      <button
        ref={tagsButtonRef}
        className={`config-link-button ${hasTags ? 'has-content' : 'required-field'}`}
        onClick={() => onPopupToggle('tags', tagsButtonRef)}
      >
        <div className="button-content">
          <div className="button-header">
            <TagsOutlined style={{ marginRight: 4 }} />
            标签管理
          </div>
          <div className="button-footer">
            {!hasTags && <span className="required-indicator">*</span>}
            {renderTagsDisplay(formData.tags)}
          </div>
        </div>
      </button>
      
      <button
        ref={visibilityButtonRef}
        className={`config-link-button ${hasVisibility ? 'has-content' : 'required-field'}`}
        onClick={() => onPopupToggle('visibility', visibilityButtonRef)}
      >
        <div className="button-content">
          <div className="button-header">
            <EyeOutlined style={{ marginRight: 4 }} />
            可见范围
          </div>
          <div className="button-footer">
            {!hasVisibility && <span className="required-indicator">*</span>}
            {renderVisibilityDisplay(formData.privateToRoles)}
          </div>
        </div>
      </button>
      
      <button
        ref={timeButtonRef}
        className={`config-link-button ${hasTime ? 'has-time-config' : 'required-field'}`}
        onClick={() => onPopupToggle('time', timeButtonRef)}
      >
        <div className="button-content">
          <div className="button-header">
            <CalendarOutlined style={{ marginRight: 4 }} />
            有效时间
          </div>
          <div className="button-footer">
            {!hasTime && <span className="required-indicator">*</span>}
            {hasTime && (
              <span className="status-indicator">●</span>
            )}
          </div>
        </div>
      </button>
      
      <button
        ref={attachmentButtonRef}
        className="config-link-button"
        onClick={() => onPopupToggle('attachment', attachmentButtonRef)}
      >
        <div className="button-content">
          <div className="button-header">
            <FileTextOutlined style={{ marginRight: 4 }} />
            附件上传
          </div>
        </div>
      </button>
    </div>
  );
};

export default ConfigurationButtons;
