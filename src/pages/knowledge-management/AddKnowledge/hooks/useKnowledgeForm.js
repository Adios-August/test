import { useState } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { knowledgeAPI } from '../../../../api/knowledge';
import { validateTag, normalizeTag, validateKnowledgeForm } from '../utils/knowledgeUtils';

export const useKnowledgeForm = () => {
  const navigate = useNavigate();
  // Form data state
  const [formData, setFormData] = useState({
    title: '',
    category: null,
    privateToRoles: ['ALL'],
    tags: [],
    effectiveTime: [null, null],
    attachments: [],
    disclaimer: false
  });
  // Content and UI state
  const [contentHtml, setContentHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tagError, setTagError] = useState('');

  // Handle visibility scope selection
  const handlePrivateToChange = (value) => {
    if (value.includes('ALL')) {
      // Select ALL, clear other options
      setFormData(prev => ({ ...prev, privateToRoles: ['ALL'] }));
    } else if (formData.privateToRoles.includes('ALL')) {
      // Deselect ALL, keep current selection only
      setFormData(prev => ({ ...prev, privateToRoles: value.filter(v => v !== 'ALL') }));
    } else {
      // Normal multi-select
      setFormData(prev => ({ ...prev, privateToRoles: value }));
    }
  };

  // Add tag
  const handleAddTag = () => {
    if (!tagInput.trim()) {
      setTagError('');
      return;
    }
    const validation = validateTag(tagInput);
    if (!validation.valid) {
      setTagError(validation.message);
      return;
    }
    // Check for duplicates
    const normalizedNew = normalizeTag(validation.tag);
    const isDuplicate = formData.tags.some(tag => normalizeTag(tag) === normalizedNew);
    if (isDuplicate) {
      setTagError(`标签'${validation.tag}'已存在`);
      return;
    }
    // Check limit
    if (formData.tags.length >= 8) {
      setTagError('最多只能添加 8 个标签');
      return;
    }
    setFormData(prev => ({ ...prev, tags: [...prev.tags, validation.tag] }));
    setTagInput('');
    setTagError('');
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle publish
  const handlePublish = async (isUploading) => {
    const errors = validateKnowledgeForm(formData, contentHtml);
    if (errors.length > 0) {
      // Show first error and scroll to corresponding field
      message.error(errors[0].message);
      // TODO: implement scroll to error field
      return;
    }
    // Check if files are uploading
    if (isUploading()) {
      message.warning('请等待文件上传完成');
      return;
    }
    try {
      setLoading(true);
      // Assemble submit data
      const submitData = {
        title: formData.title.trim(),
        content_html: contentHtml,
        category_id: formData.category,
        audience_roles: formData.privateToRoles,
        tags: formData.tags,
        effective_from: formData.effectiveTime[0]?.toISOString() || null,
        effective_to: formData.effectiveTime[1]?.toISOString() || null,
        attachments: formData.attachments.map(att => ({
          name: att.name,
          url: att.url,
          size: att.size
        })),
        disclaimer_checked: formData.disclaimer
      };
      // Call publish API
      const response = await knowledgeAPI.createKnowledge(submitData);
      if (response.code === 200) {
        message.success('知识发布成功');
        // Navigate to knowledge detail or list page
        navigate('/knowledge-admin/category-management');
      } else {
        throw new Error(response.message || '发布失败');
      }
    } catch (error) {
      console.error('发布失败:', error);
      message.error(error.message || '发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/knowledge-admin/category-management');
  };

  return {
    formData,
    setFormData,
    contentHtml,
    setContentHtml,
    loading,
    tagInput,
    setTagInput,
    tagError,
    setTagError,
    handlePrivateToChange,
    handleAddTag,
    handleRemoveTag,
    handlePublish,
    handleCancel
  };
};
