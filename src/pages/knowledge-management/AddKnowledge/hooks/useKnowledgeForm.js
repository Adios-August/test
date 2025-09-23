import { useState, useEffect } from 'react';
import { message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { knowledgeAPI } from '../../../../api/knowledge';
import { validateTag, normalizeTag, validateKnowledgeForm } from '../utils/knowledgeUtils';
import { createEmptyTable } from '../utils/tableUtils';

export const useKnowledgeForm = (mode = 'add') => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = mode === 'edit';
  
  // Form data state
  const [formData, setFormData] = useState({
    title: '',
    category: null,
    privateToRoles: ['ALL'],
    tags: [],
    effectiveTime: [null, null],
    attachments: [],
    tableData: createEmptyTable(),
    disclaimer: false,
    enableTable: false  // 默认不启用表格
  });
  // Content and UI state
  const [contentHtml, setContentHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tagError, setTagError] = useState('');

  // Load existing knowledge data for edit mode
  useEffect(() => {
    if (isEditMode && id) {
      loadKnowledgeData(id);
    }
  }, [isEditMode, id]);

  const loadKnowledgeData = async knowledgeId => {
    try {
      setDataLoading(true);
      const response = await knowledgeAPI.getKnowledgeDetail(knowledgeId);
      
      if (response.code === 200) {
        const data = response.data;
        
        // Parse effective time dates
        const effectiveTime = [
          data.effectiveStartTime ? dayjs(data.effectiveStartTime) : null,
          data.effectiveEndTime ? dayjs(data.effectiveEndTime) : null
        ];
        
        // Check if table data exists and has columns
        const hasTableData = data.tableData && data.tableData.columns && data.tableData.columns.length > 0;
        
        // Process attachments to ensure they have required fields
        const processedAttachments = (data.attachments || []).map((attachment, index) => {
          let downloadUrl = attachment.filePath || attachment.url || attachment.fileUrl;
          
          // Convert relative paths to full URLs
          if (downloadUrl && downloadUrl.startsWith('/api/')) {
            downloadUrl = `${window.location.origin}${downloadUrl}`;
          }
          
          return {
            id: attachment.id || attachment.uid || index,
            uid: attachment.uid || attachment.id || index,
            name: attachment.fileName || attachment.name || `attachment_${index + 1}`,
            size: attachment.fileSize || attachment.size || 0,
            url: downloadUrl,
            isLocal: false // Mark as server-side attachment
          };
        });
        
        // Set form data
        setFormData({
          title: data.name || data.title || '',
          category: data.parentId || data.category_id || null,
          privateToRoles: data.workspaces || data.audience_roles || ['ALL'],
          tags: data.tags || [],
          effectiveTime: effectiveTime,
          attachments: processedAttachments,
          tableData: data.tableData || createEmptyTable(),
          disclaimer: true, // Auto-check for edit mode
          enableTable: hasTableData // 如果有表格数据则启用表格
        });
        
        // Set content
        setContentHtml(data.description || data.content_html || '');
      } else {
        message.error(response.message || '获取知识详情失败');
        navigate('/knowledge-admin/category-management');
      }
    } catch (error) {
      console.error('获取知识详情失败:', error);
      message.error('获取知识详情失败');
      navigate('/knowledge-admin/category-management');
    } finally {
      setDataLoading(false);
    }
  };

  // Handle visibility scope selection
  const handlePrivateToChange = (value) => {
    // If user selects ALL, clear other options and keep only ALL
    if (value.includes('ALL') && !formData.privateToRoles.includes('ALL')) {
      setFormData(prev => ({ ...prev, privateToRoles: ['ALL'] }));
    } 
    // If user selects other options while ALL is already selected, remove ALL
    else if (formData.privateToRoles.includes('ALL') && value.length > 1) {
      setFormData(prev => ({ ...prev, privateToRoles: value.filter(v => v !== 'ALL') }));
    }
    // If user deselects ALL manually, keep other selections
    else if (!value.includes('ALL') && formData.privateToRoles.includes('ALL')) {
      setFormData(prev => ({ ...prev, privateToRoles: value }));
    }
    // Normal multi-select for non-ALL options
    else {
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

  // Handle publish/save
  const handlePublish = async (isUploading, nodeType = 'doc') => {
    // URL 中 parentId=0 且 nodeType=folder 视为创建一级类目，允许不选择分类
    const searchParams = new URLSearchParams(window.location.search);
    const parentIdParam = searchParams.get('parentId');
    const nodeTypeParam = searchParams.get('nodeType');
    const isCreatingRootFolder = (parentIdParam === '0' || parentIdParam === 0) && (nodeTypeParam === 'folder' || nodeType === 'folder');

    const errors = validateKnowledgeForm(formData, contentHtml, { allowNoCategory: isCreatingRootFolder });
    if (errors.length > 0) {
      message.error(errors[0].message);
      return;
    }
    if (isUploading()) {
      message.warning('请等待文件上传完成');
      return;
    }
  
    setLoading(true);
  
    if (isEditMode) {
      try {
        const finalAttachments = [];
        const newFilesToUpload = formData.attachments.filter(a => a.isLocal && a.file);
  
        // 1. Upload any NEW files first, since we have the ID.
        await Promise.all(newFilesToUpload.map(async (attachment) => {
          const messageKey = `upload-${attachment.file.uid || attachment.name}`;
          try {
            message.loading({ content: `正在上传 ${attachment.name}...`, key: messageKey });
            // Upload attachment for this specific knowledge
            const response = await knowledgeAPI.uploadKnowledgeAttachment(id, attachment.file);
            message.success({ content: `${attachment.name} 上传成功`, key: messageKey, duration: 2 });
            finalAttachments.push({ name: attachment.name, url: response.url, size: attachment.size });
          } catch (error) {
            message.error({ content: `${attachment.name} 上传失败: ${error.message}`, key: messageKey, duration: 3 });
            throw new Error(`附件上传失败: ${attachment.name}`);
          }
        }));
  
        // Add back the files that already existed and weren't changed.
        const existingAttachments = formData.attachments.filter(a => !a.isLocal);
        const allFinalAttachments = [...existingAttachments, ...finalAttachments];
        
        // 2. Assemble the final data and update the document.
        const submitData = {
          name: formData.title.trim(),
          description: contentHtml,
          parentId: formData.category,
          nodeType: nodeType,
          tags: formData.tags,
          tableData: formData.tableData,
          effectiveStartTime: formData.effectiveTime?.[0]?.toISOString() || null,
          effectiveEndTime: formData.effectiveTime?.[1]?.toISOString() || null,
          changeReason: "Knowledge update",
          workspaces: formData.privateToRoles,
          attachments: allFinalAttachments.map(att => ({
            name: att.name,
            url: att.url,
            size: att.size
          }))
        };
  
        const response = await knowledgeAPI.updateKnowledge(id, submitData);
        if (response.code !== 200) {
          throw new Error(response.message || '更新失败');
        }
  
        message.success('知识更新成功');
  
        // Note: Attachment cleanup removed since we're not tracking original attachments
  
        navigate('/knowledge-admin/category-management');
  
      } catch (error) {
        console.error('更新失败:', error);
        message.error(error.message || '更新失败，请重试');
      } finally {
        setLoading(false);
      }
  
    } else {
      let newKnowledgeId = null;
      try {
        // 1. Create the document WITHOUT attachments first.
        const initialSubmitData = {
          name: formData.title.trim(),
          description: contentHtml,
          parentId: formData.category,
          nodeType: nodeType,
          tags: formData.tags,
          tableData: formData.tableData,
          effectiveStartTime: formData.effectiveTime?.[0]?.toISOString() || null,
          effectiveEndTime: formData.effectiveTime?.[1]?.toISOString() || null,
          changeReason: "Knowledge creation",
          workspaces: formData.privateToRoles,
          attachments: [] // Send an empty array initially
        };
  
        const response = await knowledgeAPI.createKnowledge(initialSubmitData);
        if (response.code !== 200 || !response.data?.id) {
          throw new Error(response.message || '创建知识失败，无法获取ID');
        }
  
        newKnowledgeId = response.data.id;
        const filesToUpload = formData.attachments.filter(a => a.isLocal && a.file);
  
        // 2. If there are attachments, upload them now using the new ID.
        if (filesToUpload.length > 0) {
          message.info('知识已创建，正在上传附件...');
          const uploadPromises = filesToUpload.map(attachment =>
            // Upload attachment using the new knowledge ID
            knowledgeAPI.uploadKnowledgeAttachment(newKnowledgeId, attachment.file)
              .catch(err => ({ name: attachment.name, error: err })) // Catch individual errors
          );
          
          const results = await Promise.all(uploadPromises);
          const failedUploads = results.filter(res => res.error);
  
          if (failedUploads.length > 0) {
            const failedNames = failedUploads.map(f => f.name).join(', ');
            // The document is created, so we show a success message but warn about the failures.
            message.warning(`知识发布成功，但以下附件上传失败: ${failedNames}`, 5);
          } else {
            message.success('知识发布成功，所有附件已上传');
          }
        } else {
          message.success('知识发布成功');
        }
  
        navigate('/knowledge-admin/category-management');
  
      } catch (error) {
        // If the initial creation fails, we just show an error.
        // If uploads fail, the user is already notified, but we log it.
        console.error('发布失败:', error);
        message.error(error.message || '发布失败，请重试');
      } finally {
        setLoading(false);
      }
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
    dataLoading,
    tagInput,
    setTagInput,
    tagError,
    setTagError,
    isEditMode,
    handlePrivateToChange,
    handleAddTag,
    handleRemoveTag,
    handlePublish,
    handleCancel
  };
};
