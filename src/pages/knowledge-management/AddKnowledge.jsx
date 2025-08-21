import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Input, 
  Select, 
  TreeSelect, 
  Checkbox, 
  DatePicker, 
  Button, 
  Tag, 
  Upload, 
  message, 
  Spin,
  Space,
  Dropdown,
  Divider,
  List,
  Typography,
  Drawer
} from 'antd';
import { 
  PlusOutlined, 
  UploadOutlined, 
  DeleteOutlined,
  CloseOutlined,
  SettingOutlined,
  TagsOutlined,
  CalendarOutlined,
  FileTextOutlined,
  DownOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import '@wangeditor/editor/dist/css/style.css';
import { homeAPI } from '../../api/home';
import { knowledgeAPI } from '../../api/knowledge';
import { http } from '../../utils/request';
import './AddKnowledge.scss';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

// 工具函数：标签校验
const validateTag = (tag) => {
  const trimmedTag = tag.trim();
  
  // 长度校验（按 Unicode 码点计算）
  if (Array.from(trimmedTag).length > 10) {
    return { valid: false, message: `标签'${trimmedTag}'超过 10 个字符` };
  }
  
  // 内容校验（禁止逗号和换行）
  if (trimmedTag.includes(',') || trimmedTag.includes('\n')) {
    return { valid: false, message: '标签不可包含逗号或换行' };
  }
  
  return { valid: true, tag: trimmedTag };
};

// 工具函数：标签去重（NFKC 归一化）
const normalizeTag = (tag) => {
  return tag.normalize('NFKC').toLowerCase();
};

// 工具函数：正文判空
const isContentEmpty = (html) => {
  if (!html) return true;
  
  // 去除所有标签
  const textOnly = html.replace(/<[^>]*>/g, '');
  
  // 将 &nbsp; / &#160; 转空格
  const decoded = textOnly.replace(/&nbsp;|&#160;/g, ' ');
  
  // 移除所有空白
  const cleaned = decoded.replace(/\s/g, '');
  
  return cleaned.length === 0;
};

// 节流函数
const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;
  
  return function (...args) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

const AddKnowledge = () => {
  const navigate = useNavigate();
  
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [categoryTree, setCategoryTree] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    category: null,
    privateToRoles: ['ALL'],
    tags: [],
    effectiveTime: [null, null],
    attachments: [],
    disclaimer: false
  });
  
  // 编辑器相关状态
  const [editor, setEditor] = useState(null);
  const [contentHtml, setContentHtml] = useState('');
  
  // 上传状态
  const [uploading, setUploading] = useState({
    images: 0,
    attachments: 0
  });
  
  // 输入状态
  const [tagInput, setTagInput] = useState('');
  const [tagError, setTagError] = useState('');
  
  // UI 状态
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);

  // 获取分类树数据
  const fetchCategoryTree = useCallback(async () => {
    setLoading(true);
    try {
      const response = await homeAPI.getCategoryTree();
      if (response.code === 200) {
        const data = response.data || [];
        setCategoryTree(data);
      } else {
        message.error(response.message || '获取分类树失败');
        setCategoryTree([]);
      }
    } catch (error) {
      console.error('获取分类树失败:', error);
      message.error('获取分类树失败，请稍后重试');
      setCategoryTree([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 将API数据转换为TreeSelect格式
  const convertToTreeData = useCallback((categories) => {
    return categories.map(category => ({
      title: category.name,
      value: category.id,
      key: category.id,
      children: category.children && category.children.length > 0 
        ? convertToTreeData(category.children) 
        : undefined
    }));
  }, []);

  // 编辑器工具栏配置
  const toolbarConfig = {
    toolbarKeys: [
      'headerSelect',
      'bold',
      'italic', 
      'underline',
      'through',
      'color',
      'bgColor',
      'bulletedList',
      'numberedList',
      'link',
      'blockquote',
      'codeBlock',
      'insertTable',
      'uploadImage',
      'undo',
      'redo'
    ]
  };

  // 编辑器配置
  const editorConfig = {
    placeholder: '请输入正文内容...',
    MENU_CONF: {
      uploadImage: {
        async customUpload(file, insertFn) {
          // 前端校验
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
        }
      }
    }
  };

  // 编辑器内容变化处理（节流）
  const handleEditorChange = useMemo(
    () => throttle((editor) => {
      setContentHtml(editor.getHtml());
    }, 300),
    []
  );

  // 组件挂载时获取分类树
  useEffect(() => {
    fetchCategoryTree();
  }, [fetchCategoryTree]);

  // 及时销毁 editor ，重要！
  useEffect(() => {
    return () => {
      if (editor == null) return;
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);

  // 可见范围选择处理
  const handlePrivateToChange = (value) => {
    if (value.includes('ALL')) {
      // 选中 ALL，清空其它选项
      setFormData(prev => ({ ...prev, privateToRoles: ['ALL'] }));
    } else if (formData.privateToRoles.includes('ALL')) {
      // 取消 ALL，只保留当前选择
      setFormData(prev => ({ ...prev, privateToRoles: value.filter(v => v !== 'ALL') }));
    } else {
      // 正常多选
      setFormData(prev => ({ ...prev, privateToRoles: value }));
    }
  };

  // 添加标签
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

    // 检查重复
    const normalizedNew = normalizeTag(validation.tag);
    const isDuplicate = formData.tags.some(tag => normalizeTag(tag) === normalizedNew);
    
    if (isDuplicate) {
      setTagError(`标签'${validation.tag}'已存在`);
      return;
    }

    // 检查上限
    if (formData.tags.length >= 8) {
      setTagError('最多只能添加 8 个标签');
      return;
    }

    setFormData(prev => ({ ...prev, tags: [...prev.tags, validation.tag] }));
    setTagInput('');
    setTagError('');
  };

  // 删除标签
  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // 附件上传配置
  const attachmentUploadProps = {
    name: 'file',
    multiple: true,
    action: '/api/uploads/attachment',
    accept: '.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.zip,.rar,.jpg,.jpeg,.png,.mp3,.mp4',
    beforeUpload: (file) => {
      // 单文件大小检查
      if (file.size > 50 * 1024 * 1024) {
        message.error(`文件 ${file.name} 超过 50MB 限制`);
        return false;
      }

      // 总大小检查
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
  };

  // 删除附件
  const handleRemoveAttachment = (uid) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(att => att.uid !== uid)
    }));
  };

  // 表单校验
  const validateForm = () => {
    const errors = [];

    // 标题校验
    if (!formData.title.trim()) {
      errors.push({ field: 'title', message: '请输入标题' });
    }

    // 分类校验
    if (!formData.category) {
      errors.push({ field: 'category', message: '请选择分类' });
    }

    // 正文校验
    if (isContentEmpty(contentHtml)) {
      errors.push({ field: 'content', message: '请填写正文内容' });
    }

    // 有效时间校验
    const [startTime, endTime] = formData.effectiveTime;
    if (startTime && endTime && startTime >= endTime) {
      errors.push({ field: 'effectiveTime', message: '结束时间需晚于开始时间' });
    }

    // 数据声明校验
    if (!formData.disclaimer) {
      errors.push({ field: 'disclaimer', message: '请确认内容不包含受限数据' });
    }

    return errors;
  };

  // 发布处理
  const handlePublish = async () => {
    const errors = validateForm();
    
    if (errors.length > 0) {
      // 显示第一个错误并滚动到对应字段
      message.error(errors[0].message);
      // TODO: 实现滚动到错误字段
      return;
    }

    // 检查是否有文件正在上传
    if (uploading.images > 0 || uploading.attachments > 0) {
      message.warning('请等待文件上传完成');
      return;
    }

    try {
      setLoading(true);

      // 组装提交数据
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

      // 调用发布API
      const response = await knowledgeAPI.createKnowledge(submitData);
      
      if (response.code === 200) {
        message.success('知识发布成功');
        // 跳转到知识详情页或列表页
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

  // 取消处理
  const handleCancel = () => {
    navigate('/knowledge-admin/category-management');
  };

  // 检查发布按钮是否应该禁用
  const isPublishDisabled = uploading.images > 0 || uploading.attachments > 0 || loading;

  const treeData = convertToTreeData(categoryTree);

  // 设置按钮下拉菜单
  const settingsMenuItems = [
    {
      key: 'tags',
      icon: <TagsOutlined />,
      label: '标签管理',
      onClick: () => setSettingsDrawerOpen(true)
    },
    {
      key: 'time',
      icon: <CalendarOutlined />,
      label: '有效时间',
      onClick: () => setSettingsDrawerOpen(true)
    },
    {
      key: 'attachment',
      icon: <FileTextOutlined />,
      label: '附件上传',
      onClick: () => setSettingsDrawerOpen(true)
    }
  ];

  return (
    <div className="knowledge-management-layout">
      {/* 左侧分类树 */}
      <div className="knowledge-sidebar">
        <div className="sidebar-content">
          <div className="sidebar-title">新增知识存放目录</div>
          
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
              <p>加载中...</p>
            </div>
          ) : (
            <TreeSelect
              className="category-tree-select"
              style={{ width: '100%' }}
              value={formData.category}
              placeholder="请选择分类"
              treeData={treeData}
              treeDefaultExpandAll
              showSearch
              allowClear
              onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            />
          )}
        </div>
      </div>

      {/* 主内容区 */}
      <div className="knowledge-management-content">
        <div className="management-content">
          {/* 页面标题区域 */}
          <div className="content-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <Title level={3} style={{ margin: 0 }}>新增知识</Title>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Text strong>可见范围：</Text>
                <Select
                  mode="multiple"
                  style={{ width: 300 }}
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
            </div>
            <Space>
              <Dropdown 
                menu={{ items: settingsMenuItems }}
                placement="bottomRight"
              >
                <Button icon={<SettingOutlined />}>
                  配置 <DownOutlined />
                </Button>
              </Dropdown>
            </Space>
          </div>

          {/* 主要内容区 */}
          <div className="content-body">
            {/* 标题输入 */}
            <div className="title-section">
              <Input
                className="title-input"
                placeholder="请输入标题"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                maxLength={200}
              />
            </div>



            {/* 富文本编辑器 */}
            <div className="editor-section">
              <Toolbar
                editor={editor}
                defaultConfig={toolbarConfig}
                mode="default"
                style={{ borderBottom: '1px solid #d9d9d9', borderRadius: '6px 6px 0 0' }}
              />
              <Editor
                defaultConfig={editorConfig}
                value={contentHtml}
                onCreated={setEditor}
                onChange={handleEditorChange}
                mode="default"
                style={{ height: '300px', overflowY: 'hidden', borderRadius: '0 0 6px 6px' }}
              />
            </div>

            {/* 操作按钮 */}
            <div style={{ textAlign: 'center', marginTop: 24, marginBottom: 16 }}>
              <Space size="large">
                <Button 
                  type="primary" 
                  size="large"
                  onClick={handlePublish}
                  disabled={isPublishDisabled}
                  loading={loading}
                  style={{ 
                    backgroundColor: '#ff4d4f',
                    borderColor: '#ff4d4f'
                  }}
                  onMouseEnter={(e) => {
                    if (!isPublishDisabled && !loading) {
                      e.target.style.backgroundColor = '#ff7875';
                      e.target.style.borderColor = '#ff7875';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isPublishDisabled && !loading) {
                      e.target.style.backgroundColor = '#ff4d4f';
                      e.target.style.borderColor = '#ff4d4f';
                    }
                  }}
                >
                  发布
                </Button>
                <Button size="large" onClick={handleCancel}>
                  取消
                </Button>
              </Space>
            </div>

            {/* 附件显示区域 */}
            {formData.attachments.length > 0 && (
              <div className="attachments-display">
                <Text strong>已上传附件：</Text>
                <List
                  size="small"
                  style={{ marginTop: 8 }}
                  dataSource={formData.attachments}
                  renderItem={(attachment) => (
                    <List.Item
                      actions={[
                        <Button
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveAttachment(attachment.uid)}
                        >
                          删除
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<FileTextOutlined />}
                        title={attachment.name}
                        description={`大小: ${(attachment.size / 1024 / 1024).toFixed(2)} MB`}
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

            {/* 数据声明 */}
            <div className="footer-section">
              <div className="checkbox-item">
                <Checkbox
                  checked={formData.disclaimer}
                  onChange={(e) => setFormData(prev => ({ ...prev, disclaimer: e.target.checked }))}
                >
                  我已知晓Jarvis平台不适用于上传任何restricted data及个人信息（包含但不限于客户及员工信息）
                </Checkbox>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 设置抽屉 */}
      <Drawer
        title="知识配置"
        placement="right"
        width={400}
        onClose={() => setSettingsDrawerOpen(false)}
        open={settingsDrawerOpen}
      >
        {/* 标签管理 */}
        <div className="config-item" style={{ marginBottom: 24 }}>
          <Text strong>标签</Text>
          <div style={{ marginTop: 8 }}>
            <Input
              placeholder="输入标签后按回车添加"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onPressEnter={handleAddTag}
              suffix={
                <Button 
                  type="link" 
                  icon={<PlusOutlined />} 
                  onClick={handleAddTag}
                  size="small"
                />
              }
            />
            {tagError && (
              <Text type="danger" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
                {tagError}
              </Text>
            )}
            <div style={{ marginTop: 12 }}>
              {formData.tags.map((tag, index) => (
                <Tag
                  key={index}
                  closable
                  onClose={() => handleRemoveTag(tag)}
                  style={{ marginBottom: 8, marginRight: 8 }}
                >
                  {tag}
                </Tag>
              ))}
            </div>
          </div>
        </div>

        <Divider />

        {/* 有效时间 */}
        <div className="config-item" style={{ marginBottom: 24 }}>
          <Text strong>有效时间</Text>
          <RangePicker
            style={{ width: '100%', marginTop: 8 }}
            value={formData.effectiveTime}
            onChange={(dates) => setFormData(prev => ({ ...prev, effectiveTime: dates || [null, null] }))}
            showTime
          />
        </div>

        <Divider />

        {/* 附件上传 */}
        <div className="config-item">
          <Text strong>附件上传</Text>
          <Upload {...attachmentUploadProps} showUploadList={false}>
            <Button 
              icon={<UploadOutlined />} 
              style={{ width: '100%', marginTop: 8 }}
              size="large"
            >
              上传附件
            </Button>
          </Upload>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
            支持：txt, doc, docx, xls, xlsx, ppt, pptx, pdf, zip, rar, jpg, jpeg, png, mp3, mp4
          </Text>
        </div>
      </Drawer>
    </div>
  );
};

export default AddKnowledge;