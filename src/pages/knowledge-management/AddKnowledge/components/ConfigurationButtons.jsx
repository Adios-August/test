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

  // Time display function (returns simple string)
  const getTimeText = () => {
    if (!hasTime) return '';
    return `${formData.effectiveTime[0]} - ${formData.effectiveTime[1]}`;
  };

  return (
    <div className="config-buttons">
      <button
        ref={tagsButtonRef}
        className={`config-link-button ${hasTags ? 'has-content' : 'required-field'}`}
        onClick={() => onPopupToggle('tags', tagsButtonRef)}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
      >
        <div>
          <TagsOutlined style={{ marginRight: 4 }} />
          标签管理
          {!hasTags && <span className="required-indicator">*</span>}
        </div>
        {hasTags && (
          <div style={{ marginTop: '4px' }}>
            {renderTagsDisplay(formData.tags)}
          </div>
        )}
      </button>
      
      <button
        ref={visibilityButtonRef}
        className={`config-link-button ${hasVisibility ? 'has-content' : 'required-field'}`}
        onClick={() => onPopupToggle('visibility', visibilityButtonRef)}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
      >
        <div>
          <EyeOutlined style={{ marginRight: 4 }} />
          可见范围
          {!hasVisibility && <span className="required-indicator">*</span>}
        </div>
        {hasVisibility && (
          <div style={{ marginTop: '4px' }}>
            {renderVisibilityDisplay(formData.privateToRoles)}
          </div>
        )}
      </button>
      
      <button
        ref={timeButtonRef}
        className={`config-link-button ${hasTime ? 'has-time-config' : 'required-field'}`}
        onClick={() => onPopupToggle('time', timeButtonRef)}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
      >
        <div>
          <CalendarOutlined style={{ marginRight: 4 }} />
          有效时间
          {!hasTime && <span className="required-indicator">*</span>}
        </div>
        {hasTime && (
          <div style={{ marginTop: '4px' }}>
            <span className="content-display">
              : <span className="content-items">{getTimeText()}</span>
            </span>
          </div>
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
