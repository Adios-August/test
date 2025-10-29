import React from 'react';
import { 
  TagsOutlined,
  CalendarOutlined,
  FileTextOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { renderTagsDisplay, renderVisibilityDisplay } from '../utils/displayUtils';

// Helper functions to render content without colons (for footer display)
const renderTagsContent = (tags) => {
  if (!tags || !Array.isArray(tags) || tags.length === 0) return null;
  
  if (tags.length <= 3) {
    return <span className="content-items">{tags.join(', ')}</span>;
  } else {
    return <span className="content-items">{tags.length}个标签</span>;
  }
};

const renderVisibilityContent = (privateToRoles) => {
  if (!privateToRoles || !Array.isArray(privateToRoles) || privateToRoles.length === 0) return null;
  
  if (privateToRoles.includes('ALL')) {
    return <span className="content-items">ALL</span>;
  }
  
  if (privateToRoles.length <= 3) {
    return <span className="content-items">{privateToRoles.join(', ')}</span>;
  } else {
    return <span className="content-items">{privateToRoles.length}个角色</span>;
  }
};

const renderTimeContent = (effectiveTime) => {
  if (!effectiveTime || !Array.isArray(effectiveTime) || !effectiveTime[0] || !effectiveTime[1]) return null;
  
  const startTime = effectiveTime[0];
  const endTime = effectiveTime[1];
  
  return <span className="content-items">{startTime} - {endTime}</span>;
};

const ConfigurationButtons = ({ 
  formData, 
  tagsButtonRef, 
  visibilityButtonRef, 
  timeButtonRef, 
  attachmentButtonRef,
  onPopupToggle 
}) => {
  // Check if required fields are filled
  const hasTags = formData.tags && Array.isArray(formData.tags) && formData.tags.length > 0;
  const hasVisibility = formData.privateToRoles && Array.isArray(formData.privateToRoles) && formData.privateToRoles.length > 0;
  const hasTime = formData.effectiveTime && Array.isArray(formData.effectiveTime) && formData.effectiveTime[0] && formData.effectiveTime[1];

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
            {!hasTags && <span className="required-indicator">*</span>}
            {hasTags && <span className="colon">:</span>}
          </div>
          {hasTags && (
            <div className="button-footer">
              {renderTagsContent(formData.tags)}
            </div>
          )}
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
            {!hasVisibility && <span className="required-indicator">*</span>}
            {hasVisibility && <span className="colon">:</span>}
          </div>
          {hasVisibility && (
            <div className="button-footer">
              {renderVisibilityContent(formData.privateToRoles)}
            </div>
          )}
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
            {!hasTime && <span className="required-indicator">*</span>}
            {hasTime && <span className="colon">:</span>}
          </div>
          {hasTime && (
            <div className="button-footer">
              {renderTimeContent(formData.effectiveTime)}
            </div>
          )}
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
