import { useState, useEffect } from 'react';
import { message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { knowledgeAPI } from '../../../../api/knowledge';
import { validateTag, normalizeTag, validateKnowledgeForm } from '../utils/knowledgeUtils';
import { createEmptyTable } from '../utils/tableUtils';
import { useKnowledgeStore } from '../../../../stores';

export const useKnowledgeForm = (mode = 'add') => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = mode === 'edit';
  const knowledgeStore = useKnowledgeStore();
  
  // Form data state
  const [formData, setFormData] = useState({
    title: '',
    category: null,
    privateToRoles: [],
    tags: [],
    effectiveTime: [null, null],
    attachments: [],
    tableData: createEmptyTable(),
    disclaimer: false,
    enableTable: false,  // 默认不启用表格
    nodeType: 'doc'  // 节点类型：doc 或 folder
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
          privateToRoles: data.workspace || data.audience_roles || [],
          tags: data.tags || [],
          effectiveTime: effectiveTime,
          attachments: processedAttachments,
          tableData: data.tableData || createEmptyTable(),
          disclaimer: true, // Auto-check for edit mode
          enableTable: hasTableData, // 如果有表格数据则启用表格
          nodeType: data.nodeType || 'doc' // 从后端数据设置节点类型
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
    setFormData(prev => ({ ...prev, privateToRoles: value }));
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
  const handlePublish = async (isUploading, nodeType = null) => {
    // 优先使用传入的 nodeType，如果没有则使用 formData.nodeType
    const finalNodeType = nodeType || formData.nodeType || 'doc';
    
    // URL 中 parentId=0 且 nodeType=folder 视为创建一级类目，允许不选择分类
    // 或者在编辑模式下，如果 parentId 为 0 或 null 且 nodeType 为 folder，也视为根目录
    const searchParams = new URLSearchParams(window.location.search);
    const parentIdParam = searchParams.get('parentId');
    const nodeTypeParam = searchParams.get('nodeType');
    const isCreatingRootFolderFromUrl = (parentIdParam === '0' || parentIdParam === 0) && (nodeTypeParam === 'folder' || finalNodeType === 'folder');
    const isEditingRootFolder = isEditMode && (formData.category === 0 || formData.category === null || formData.category === undefined) && finalNodeType === 'folder';
    const isCreatingRootFolder = isCreatingRootFolderFromUrl || isEditingRootFolder;

    // 处理可见范围：如果包含ALL，需要获取所有实际的角色
    const processPrivateToRoles = (privateToRoles) => {
      if (!privateToRoles || privateToRoles.length === 0) return [];
      
      // 如果包含ALL，需要替换为所有实际的角色
      if (privateToRoles.includes('ALL')) {
        // 当选择ALL时，formData.privateToRoles应该包含['ALL', 'role1', 'role2', ...]
        // 我们需要过滤掉ALL，保留所有实际的角色
        return privateToRoles.filter(role => role !== 'ALL');
      }
      
      return privateToRoles;
    };

    const processedFormData = {
      ...formData,
      privateToRoles: processPrivateToRoles(formData.privateToRoles)
    };

    // 调试信息
    console.log('原始 privateToRoles:', formData.privateToRoles);
    console.log('处理后的 privateToRoles:', processedFormData.privateToRoles);

    // 创建一级类目时，跳过某些字段的验证（这些字段在UI中被隐藏）
    const validationOptions = {
      allowNoCategory: isCreatingRootFolder,
      skipTags: isCreatingRootFolder,
      skipVisibility: isCreatingRootFolder,
      skipEffectiveTime: isCreatingRootFolder,
      skipContent: isCreatingRootFolder,
      skipDisclaimer: isCreatingRootFolder
    };

    const errors = validateKnowledgeForm(processedFormData, contentHtml, validationOptions);
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
          name: processedFormData.title.trim(),
          description: contentHtml,
          parentId: processedFormData.category,
          nodeType: finalNodeType,
          tags: processedFormData.tags,
          tableData: processedFormData.tableData,
          effectiveStartTime: processedFormData.effectiveTime?.[0]?.toISOString() || null,
          effectiveEndTime: processedFormData.effectiveTime?.[1]?.toISOString() || null,
          changeReason: "Knowledge update",
          workspaces: processedFormData.privateToRoles,
          attachments: allFinalAttachments.map(att => ({
            name: att.name,
            url: att.url,
            size: att.size
          }))
        };

        console.log('更新知识提交数据:', submitData);
  
        const response = await knowledgeAPI.updateKnowledge(id, submitData);
        if (response.code !== 200) {
          throw new Error(response.message || '更新失败');
        }

        // Update the knowledge store with the updated data
        if (response.data) {
          knowledgeStore.updateKnowledge(response.data);
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
      try {
        // 1. Upload all local files first to get their URLs
        const filesToUpload = formData.attachments.filter(a => a.isLocal && a.file);
        const uploadedAttachments = [];
        
        if (filesToUpload.length > 0) {
          message.info('正在上传附件...');
          
          const uploadResults = await Promise.all(
            filesToUpload.map(async (attachment) => {
              try {
                const response = await knowledgeAPI.uploadAttachment(attachment.file);
                if (response.url) {
                  return { 
                    name: attachment.name, 
                    url: response.url, 
                    size: attachment.size,
                    success: true
                  };
                }
                throw new Error('上传响应缺少URL');
              } catch (error) {
                return { name: attachment.name, error: error.message, success: false };
              }
            })
          );
          
          const failedUploads = uploadResults.filter(r => !r.success);
          if (failedUploads.length > 0) {
            const failedNames = failedUploads.map(f => f.name).join(', ');
            throw new Error(`附件上传失败: ${failedNames}`);
          }
          
          uploadedAttachments.push(...uploadResults.filter(r => r.success).map(r => ({
            name: r.name,
            url: r.url,
            size: r.size
          })));
        }

        // 2. Create the document WITH attachments
        const submitData = {
          name: processedFormData.title.trim(),
          description: contentHtml,
          parentId: processedFormData.category,
          nodeType: finalNodeType,
          tags: processedFormData.tags,
          tableData: processedFormData.tableData,
          effectiveStartTime: processedFormData.effectiveTime?.[0]?.toISOString() || null,
          effectiveEndTime: processedFormData.effectiveTime?.[1]?.toISOString() || null,
          changeReason: "Knowledge creation",
          workspaces: processedFormData.privateToRoles,
          attachments: uploadedAttachments
        };

        console.log('创建知识提交数据:', submitData);
  
        const response = await knowledgeAPI.createKnowledge(submitData);
        if (response.code !== 200 || !response.data?.id) {
          throw new Error(response.message || '创建知识失败');
        }
        
        // Add the new knowledge to the store
        if (response.data) {
          knowledgeStore.addKnowledge(response.data);
        }

        message.success('知识发布成功');
        navigate('/knowledge-admin/category-management');
  
      } catch (error) {
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
