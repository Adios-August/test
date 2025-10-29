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
        <TagsOutlined style={{ marginRight: 4 }} />
        标签管理
        {!hasTags && <span className="required-indicator">*</span>}
        {renderTagsDisplay(formData.tags)}
      </button>
      
      <button
        ref={visibilityButtonRef}
        className={`config-link-button ${hasVisibility ? 'has-content' : 'required-field'}`}
        onClick={() => onPopupToggle('visibility', visibilityButtonRef)}
      >
        <EyeOutlined style={{ marginRight: 4 }} />
        可见范围
        {!hasVisibility && <span className="required-indicator">*</span>}
        {renderVisibilityDisplay(formData.privateToRoles)}
      </button>
      
      <button
        ref={timeButtonRef}
        className={`config-link-button ${hasTime ? 'has-time-config' : 'required-field'}`}
        onClick={() => onPopupToggle('time', timeButtonRef)}
      >
        <CalendarOutlined style={{ marginRight: 4 }} />
        有效时间
        {!hasTime && <span className="required-indicator">*</span>}
        {hasTime && (
          <span className="status-indicator">●</span>
        )}
      </button>
      
      <button
        ref={attachmentButtonRef}
        className="config-link-button"
        onClick={() => onPopupToggle('attachment', attachmentButtonRef)}
      >
        <FileTextOutlined style={{ marginRight: 4 }} />
        附件上传
      </button>
    </div>
  );
};

export default ConfigurationButtons;
