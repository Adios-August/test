import React from 'react';
import { 
  Select, 
  Typography,
  Card
} from 'antd';

const { Text } = Typography;

const VisibilityPopup = ({ 
  visible,
  onClose,
  formData,
  handlePrivateToChange,
  anchorEl
}) => {
  if (!visible) return null;

  return (
    <>
      {/* Overlay to close popup when clicking outside */}
      <div 
        className="popup-overlay" 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999
        }}
      />
      
      {/* Popup content */}
      <Card
        className="knowledge-popup"
        title="可见范围"
        size="small"
        style={{
          position: 'absolute',
          width: 390,
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          borderRadius: '6px'
        }}
      >
        <div>
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="选择可见范围"
            value={formData.privateToRoles}
            onChange={handlePrivateToChange}
            options={[
              { label: 'All', value: 'ALL' },
              { label: 'WPB', value: 'WPB' },
              { label: 'GPB', value: 'GPB' },
              { label: 'CCSS', value: 'CCSS' }
            ]}
          />
        </div>
      </Card>
    </>
  );
};

export default VisibilityPopup;
