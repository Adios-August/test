import { useState } from 'react';

export const usePopupManager = () => {
  const [activePopup, setActivePopup] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

  const handlePopupToggle = (popupType, buttonRef) => {
    if (activePopup === popupType) {
      setActivePopup(null);
      return;
    }

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      
      // Different popup widths
      const popupWidths = {
        tags: 390,
        time: 416,
        attachment: 390,
        visibility: 390
      };
      
      const popupWidth = popupWidths[popupType] || 390;
      const windowWidth = window.innerWidth;
      const contentPadding = 60; // Padding from container edges
      
      // Calculate left position, ensuring popup stays within bounds
      let leftPosition = rect.left;
      if (leftPosition + popupWidth > windowWidth - contentPadding) {
        leftPosition = windowWidth - popupWidth - contentPadding;
      }
      
      // Ensure popup doesn't go off left edge either
      if (leftPosition < contentPadding) {
        leftPosition = contentPadding;
      }
      
      setPopupPosition({
        top: rect.bottom + 8,
        left: leftPosition
      });
      setActivePopup(popupType);
    }
  };

  const handleClosePopup = () => {
    setActivePopup(null);
  };

  return {
    activePopup,
    popupPosition,
    handlePopupToggle,
    handleClosePopup
  };
};
