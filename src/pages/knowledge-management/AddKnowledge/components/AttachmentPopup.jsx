import React from 'react';
import { 
  Button, 
  Upload, 
  Typography,
  Card
} from 'antd';
import { 
  UploadOutlined
} from '@ant-design/icons';
import { useFileUpload } from '../hooks/useFileUpload';

const { Text } = Typography;

const AttachmentPopup = ({ 
  visible,
  onClose,
  formData,
  setFormData,
  anchorEl
}) => {
  const { getAttachmentUploadProps } = useFileUpload();
  
  if (!visible) return null;

  // Get attachment upload configuration
  const attachmentUploadProps = getAttachmentUploadProps(formData, setFormData);

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
        title="附件上传"
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
          <Upload {...attachmentUploadProps} showUploadList={false}>
            <Button 
              icon={<UploadOutlined />} 
              style={{ width: '100%' }}
              size="large"
            >
              上传附件
            </Button>
          </Upload>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 8 }}>
            支持：txt, doc, docx, xls, xlsx, ppt, pptx, pdf, zip, rar, jpg, jpeg, png, mp3, mp4
          </Text>
        </div>
      </Card>
    </>
  );
};

export default AttachmentPopup;
