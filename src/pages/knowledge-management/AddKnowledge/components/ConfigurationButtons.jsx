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
  // Check if creating a 一级菜单 (first-level menu)
  const isCreatingRootFolder = () => {
    const params = new URLSearchParams(window.location.search);
    const parentId = params.get('parentId');
    const nodeTypeParam = params.get('nodeType');
    return (parentId === '0' || parentId === 0) && nodeTypeParam === 'folder';
  };
  // Check if required fields are filled
  const hasTags = formData.tags && formData.tags.length > 0;
  const hasVisibility = formData.privateToRoles && formData.privateToRoles.length > 0;
  const hasTime = formData.effectiveTime && formData.effectiveTime[0] && formData.effectiveTime[1];

  // Content display functions (without colons for separate line)
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
    
    // Handle different data types (string, Date, Moment)
    const formatDate = (date) => {
      if (!date) return '';
      if (typeof date === 'string') {
        return date.split(' ')[0]; // Get only date part from string
      }
      if (date.format) {
        return date.format('YYYY-MM-DD'); // Moment object
      }
      if (date instanceof Date) {
        return date.toISOString().split('T')[0]; // Date object
      }
      return String(date);
    };
    
    const startDate = formatDate(formData.effectiveTime[0]);
    const endDate = formatDate(formData.effectiveTime[1]);
    return `${startDate} - ${endDate}`;
  };

  // If creating a 一级菜单, hide all configuration buttons
  if (isCreatingRootFolder()) {
    return null;
  }
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
