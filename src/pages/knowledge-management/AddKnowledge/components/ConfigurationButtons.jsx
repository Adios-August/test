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

  // Helper function to render time display (like the original display functions)
  const renderTimeDisplay = (effectiveTime) => {
    if (!effectiveTime || !effectiveTime[0] || !effectiveTime[1]) return null;
    
    const startTime = effectiveTime[0];
    const endTime = effectiveTime[1];
    
    return (
      <span className="content-display">
        : <span className="content-items">{startTime} - {endTime}</span>
      </span>
    );
  };

  return (
    <div className="config-buttons">
      <button
        ref={tagsButtonRef}
        className={`config-link-button ${hasTags ? 'has-content' : 'required-field'}`}
        onClick={() => onPopupToggle('tags', tagsButtonRef)}
      >
        <div>
          <div>
            <TagsOutlined style={{ marginRight: 4 }} />
            标签管理
            {!hasTags && <span className="required-indicator">*</span>}
            {hasTags && renderTagsDisplay(formData.tags)}
          </div>
          {hasTags && (
            <div style={{ marginTop: '4px' }}>
              {renderTagsDisplay(formData.tags)}
            </div>
          )}
        </div>
      </button>
      
      <button
        ref={visibilityButtonRef}
        className={`config-link-button ${hasVisibility ? 'has-content' : 'required-field'}`}
        onClick={() => onPopupToggle('visibility', visibilityButtonRef)}
      >
        <div>
          <div>
            <EyeOutlined style={{ marginRight: 4 }} />
            可见范围
            {!hasVisibility && <span className="required-indicator">*</span>}
            {hasVisibility && renderVisibilityDisplay(formData.privateToRoles)}
          </div>
          {hasVisibility && (
            <div style={{ marginTop: '4px' }}>
              {renderVisibilityDisplay(formData.privateToRoles)}
            </div>
          )}
        </div>
      </button>
      
      <button
        ref={timeButtonRef}
        className={`config-link-button ${hasTime ? 'has-time-config' : 'required-field'}`}
        onClick={() => onPopupToggle('time', timeButtonRef)}
      >
        <div>
          <div>
            <CalendarOutlined style={{ marginRight: 4 }} />
            有效时间
            {!hasTime && <span className="required-indicator">*</span>}
            {hasTime && (
              <span className="status-indicator">●</span>
            )}
          </div>
          {hasTime && (
            <div style={{ marginTop: '4px' }}>
              {renderTimeDisplay(formData.effectiveTime)}
            </div>
          )}
        </div>
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
