import React from 'react';

// Render tags display with hybrid approach
export const renderTagsDisplay = (tags) => {
  if (tags.length === 0) return null;
  
  if (tags.length <= 3) {
    // Show actual tags for 3 or fewer
    return (
      <span className="content-display">
        : <span className="content-items">{tags.join(', ')}</span>
      </span>
    );
  } else {
    // Show count for more than 3
    return (
      <span className="content-display">
        : <span className="content-items">{tags.length}个标签</span>
      </span>
    );
  }
};

// Render visibility display with hybrid approach  
export const renderVisibilityDisplay = (privateToRoles) => {
  if (privateToRoles.length === 0) return null;
  
  if (privateToRoles.length <= 3) {
    // Show actual roles for 3 or fewer
    return (
      <span className="content-display">
        : <span className="content-items">{privateToRoles.join(', ')}</span>
      </span>
    );
  } else {
    // Show count for more than 3
    return (
      <span className="content-display">
        : <span className="content-items">{privateToRoles.length}个角色</span>
      </span>
    );
  }
};
