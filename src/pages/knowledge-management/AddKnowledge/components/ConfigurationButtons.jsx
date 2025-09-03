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
  return (
    <div className="config-buttons">
      <button
        ref={tagsButtonRef}
        className={`config-link-button ${formData.tags.length > 0 ? 'has-content' : ''}`}
        onClick={() => onPopupToggle('tags', tagsButtonRef)}
      >
        <TagsOutlined style={{ marginRight: 4 }} />
        标签管理
        {renderTagsDisplay(formData.tags)}
      </button>
      
      <button
        ref={visibilityButtonRef}
        className={`config-link-button ${formData.privateToRoles.length > 0 ? 'has-content' : ''}`}
        onClick={() => onPopupToggle('visibility', visibilityButtonRef)}
      >
        <EyeOutlined style={{ marginRight: 4 }} />
        可见范围
        {renderVisibilityDisplay(formData.privateToRoles)}
      </button>
      
      <button
        ref={timeButtonRef}
        className={`config-link-button ${formData.effectiveTime && formData.effectiveTime[0] ? 'has-time-config' : ''}`}
        onClick={() => onPopupToggle('time', timeButtonRef)}
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
        onClick={() => onPopupToggle('attachment', attachmentButtonRef)}
      >
        <FileTextOutlined style={{ marginRight: 4 }} />
        附件上传
      </button>
    </div>
  );
};

export default ConfigurationButtons;
