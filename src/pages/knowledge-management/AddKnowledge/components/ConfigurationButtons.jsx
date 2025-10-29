import React from 'react';
import { 
  TagsOutlined,
  CalendarOutlined,
  FileTextOutlined,
  EyeOutlined
} from '@ant-design/icons';

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

  // Simple content renderers
  const getTagsText = () => {
    if (!hasTags) return '';
    if (formData.tags.length <= 3) {
      return formData.tags.join(', ');
    }
    return `${formData.tags.length}个标签`;
  };

  const getVisibilityText = () => {
    if (!hasVisibility) return '';
    if (formData.privateToRoles.includes('ALL')) {
      return 'ALL';
    }
    if (formData.privateToRoles.length <= 3) {
      return formData.privateToRoles.join(', ');
    }
    return `${formData.privateToRoles.length}个角色`;
  };

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
              <span className="content-items">{getTagsText()}</span>
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
              <span className="content-items">{getVisibilityText()}</span>
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
              <span className="content-items">{getTimeText()}</span>
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
