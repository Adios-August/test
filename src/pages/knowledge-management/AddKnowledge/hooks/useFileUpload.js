import { useState } from 'react';
import { message } from 'antd';
import { knowledgeAPI } from '../../../../api/knowledge';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState({
    images: 0,
    attachments: 0
  });

  // Image upload handler factory - returns a function for main component use
  const createImageUploadHandler = () => {
    return async (file, insertFn) => {
      // Frontend validation
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        message.error('仅支持 jpg、jpeg、png、webp 格式的图片');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        message.error('图片大小不能超过 5MB');
        return;
      }
      try {
        setUploading(prev => ({ ...prev, images: prev.images + 1 }));
        const response = await knowledgeAPI.uploadImage(file);
        if (response.url) {
          insertFn(response.url);
        } else {
          throw new Error('上传响应缺少URL');
        }
      } catch (error) {
        console.error('图片上传失败:', error);
        message.error('图片上传失败，请重试');
      } finally {
        setUploading(prev => ({ ...prev, images: prev.images - 1 }));
      }
    };
  };

  // Attachment upload configuration
  const getAttachmentUploadProps = (formData, setFormData) => ({
    name: 'file',
    multiple: true,
    action: '/api/uploads/attachment',
    accept: '.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.zip,.rar,.jpg,.jpeg,.png,.mp3,.mp4',
    beforeUpload: (file) => {
      // Single file size check
      if (file.size > 50 * 1024 * 1024) {
        message.error(`文件 ${file.name} 超过 50MB 限制`);
        return false;
      }
      // Total size check
      const currentTotalSize = formData.attachments.reduce((sum, att) => sum + att.size, 0);
      if (currentTotalSize + file.size > 200 * 1024 * 1024) {
        message.error('附件总大小不能超过 200MB');
        return false;
      }
      return true;
    },
    onChange: (info) => {
      const { status } = info.file;
      if (status === 'uploading') {
        setUploading(prev => ({ ...prev, attachments: prev.attachments + 1 }));
      } else if (status === 'done') {
        setUploading(prev => ({ ...prev, attachments: prev.attachments - 1 }));
        const newAttachment = {
          uid: info.file.uid,
          name: info.file.name,
          size: info.file.size,
          url: info.file.response?.url,
          status: 'done'
        };
        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, newAttachment]
        }));
        message.success(`${info.file.name} 上传成功`);
      } else if (status === 'error') {
        setUploading(prev => ({ ...prev, attachments: prev.attachments - 1 }));
        message.error(`${info.file.name} 上传失败`);
      }
    }
  });

  // Remove attachment
  const handleRemoveAttachment = (uid, setFormData) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(att => att.uid !== uid)
    }));
  };

  // Check if files are uploading
  const isUploading = () => uploading.images > 0 || uploading.attachments > 0;

  return {
    uploading,
    createImageUploadHandler,
    getAttachmentUploadProps,
    handleRemoveAttachment,
    isUploading
  };
};
