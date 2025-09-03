import React from 'react';
import TagsPopup from './TagsPopup';
import TimePopup from './TimePopup';
import AttachmentPopup from './AttachmentPopup';
import VisibilityPopup from './VisibilityPopup';

const PopupContainer = ({
  activePopup,
  popupPosition,
  onClosePopup,
  formData,
  setFormData,
  tagInput,
  setTagInput,
  tagError,
  onAddTag,
  onRemoveTag,
  handlePrivateToChange
}) => {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'fixed', top: popupPosition.top, left: popupPosition.left }}>
        <TagsPopup
          visible={activePopup === 'tags'}
          onClose={onClosePopup}
          formData={formData}
          tagInput={tagInput}
          setTagInput={setTagInput}
          tagError={tagError}
          onAddTag={onAddTag}
          onRemoveTag={onRemoveTag}
        />
        
        <TimePopup
          visible={activePopup === 'time'}
          onClose={onClosePopup}
          formData={formData}
          setFormData={setFormData}
        />
        
        <AttachmentPopup
          visible={activePopup === 'attachment'}
          onClose={onClosePopup}
          formData={formData}
          setFormData={setFormData}
        />
        
        <VisibilityPopup
          visible={activePopup === 'visibility'}
          onClose={onClosePopup}
          formData={formData}
          handlePrivateToChange={handlePrivateToChange}
        />
      </div>
    </div>
  );
};

export default PopupContainer;
