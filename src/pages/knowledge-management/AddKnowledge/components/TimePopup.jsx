import React from 'react';
import { 
  Typography,
  DatePicker,
  Card
} from 'antd';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const TimePopup = ({ 
  visible,
  onClose,
  formData,
  setFormData,
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
        title="有效时间"
        size="small"
        style={{
          position: 'absolute',
          width: 416,
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          borderRadius: '6px'
        }}
      >
        <div>
          <RangePicker
            style={{ width: '100%' }}
            value={formData.effectiveTime}
            onChange={(dates) => setFormData(prev => ({ ...prev, effectiveTime: dates || [null, null] }))}
            showTime
          />
        </div>
      </Card>
    </>
  );
};

export default TimePopup;
