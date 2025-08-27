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
          data.effective_from ? dayjs(data.effective_from) : null,
          data.effective_to ? dayjs(data.effective_to) : null
        ];
        
        // Check if table data exists and has columns
        const hasTableData = data.tableData && data.tableData.columns && data.tableData.columns.length > 0;
        
        // Set form data
        setFormData({
          title: data.title || '',
          category: data.category_id || null,
          privateToRoles: data.audience_roles || ['ALL'],
          tags: data.tags || [],
          effectiveTime: effectiveTime,
          attachments: data.attachments || [],
          tableData: data.tableData || createEmptyTable(),
          disclaimer: true, // Auto-check for edit mode
          enableTable: hasTableData // 如果有表格数据则启用表格
        });
        
        // Set content
        setContentHtml(data.content_html || '');
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
        tableData: formData.tableData,
        disclaimer_checked: formData.disclaimer,
        node_type: nodeType
      };
      
      // Call appropriate API based on mode
      let response;
      if (isEditMode) {
        response = await knowledgeAPI.updateKnowledge(id, submitData);
      } else {
        response = await knowledgeAPI.createKnowledge(submitData);
      }
      
      if (response.code === 200) {
        message.success(isEditMode ? '知识更新成功' : '知识发布成功');
        // Navigate to knowledge detail or list page
        navigate('/knowledge-admin/category-management');
      } else {
        throw new Error(response.message || (isEditMode ? '更新失败' : '发布失败'));
      }
    } catch (error) {
      console.error(isEditMode ? '更新失败:' : '发布失败:', error);
      message.error(error.message || (isEditMode ? '更新失败，请重试' : '发布失败，请重试'));
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
