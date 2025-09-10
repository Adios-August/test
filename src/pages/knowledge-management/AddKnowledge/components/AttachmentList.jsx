import React from 'react';
import { Button, List, Typography, message } from 'antd';
import { DeleteOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import { authenticatedFetch } from '../../../../utils/request';

const { Text } = Typography;

const AttachmentList = ({ attachments, onRemoveAttachment, setFormData }) => {
  // Handle size display safely with appropriate units
  const formatSize = (size) => {
    if (!size || isNaN(size)) return '未知大小';
    
    // Convert bytes to appropriate unit
    if (size >= 1024 * 1024 * 1024) {
      // GB
      return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
    } else if (size >= 1024 * 1024) {
      // MB
      return `${(size / 1024 / 1024).toFixed(2)} MB`;
    } else if (size >= 1024) {
      // KB
      return `${(size / 1024).toFixed(2)} KB`;
    } else {
      // Bytes
      return `${size} B`;
    }
  };

  const handleDownload = async (attachment) => {
    const downloadUrl = attachment.url || attachment.filePath || attachment.fileUrl;
    
    if (!downloadUrl) {
      message.error('下载链接不存在');
      return;
    }

    try {
      // Use authenticatedFetch for download
      const response = await authenticatedFetch(downloadUrl, {
        method: 'GET',
      });
      
      if (response.ok) {
        // Get the blob data
        const blob = await response.blob();
        
        // Create a temporary URL for the blob
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create a temporary link to download the file
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = attachment.name || 'attachment';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        window.URL.revokeObjectURL(blobUrl);
      } else {
        message.error('下载失败，请稍后重试');
      }
    } catch (error) {
      console.error('Download error:', error);
      message.error('下载失败，请稍后重试');
    }
  };

  const handleRemove = (attachment) => {
    onRemoveAttachment(
      attachment.uid || attachment.id || attachment.name, 
      setFormData
    );
  };

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="attachments-display">
      <Text strong>附件列表：</Text>
      <List
        size="small"
        style={{ marginTop: 8 }}
        dataSource={attachments}
        rowKey={(item) => item.uid || item.id || item.name}
        renderItem={(attachment) => {
          const downloadUrl = attachment.url || attachment.filePath || attachment.fileUrl;
          
          return (
            <List.Item
              key={attachment.uid || attachment.id || attachment.name}
              actions={[
                // Add download button if URL exists
                downloadUrl && (
                  <Button
                    key="download"
                    type="link"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(attachment)}
                  >
                    下载
                  </Button>
                ),
                <Button
                  key="delete"
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemove(attachment)}
                >
                  删除
                </Button>
              ].filter(Boolean)} // Remove null/undefined buttons
            >
              <List.Item.Meta
                avatar={<FileTextOutlined />}
                title={attachment.name || attachment.fileName || '未知文件'}
                description={`大小: ${formatSize(attachment.size)}`}
              />
            </List.Item>
          );
        }}
      />
    </div>
  );
};

export default AttachmentList;
