import React, { useState, useEffect } from 'react';
import { 
  Input, 
  Button, 
  Tag, 
  Typography,
  Card,
  Select,
  Spin
} from 'antd';
import { 
  PlusOutlined
} from '@ant-design/icons';
import { tagsAPI } from '../../../../api/tags';

const { Text } = Typography;

const TagsPopup = ({ 
  visible,
  onClose,
  formData,
  tagInput,
  setTagInput,
  tagError,
  onAddTag,
  onRemoveTag,
  anchorEl
}) => {
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [error, setError] = useState('');

  // 获取所有标签
  useEffect(() => {
    if (visible) {
      fetchAllTags();
    }
  }, [visible]);

  const fetchAllTags = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await tagsAPI.getAllTags();
      if (response && response.data) {
        setAvailableTags(response.data);
      } else {
        setError('获取标签列表失败');
      }
    } catch (error) {
      console.error('获取标签列表失败:', error);
      setError('获取标签列表失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 处理标签选择
  const handleTagSelect = (value) => {
    if (value && !formData.tags.includes(value)) {
      // 直接设置tagInput并调用onAddTag
      setTagInput(value);
      // 使用setTimeout确保setTagInput先执行
      setTimeout(() => {
        onAddTag();
      }, 0);
    }
    setSearchValue('');
  };

  // 处理搜索
  const handleSearch = async (value) => {
    if (!value) {
      // 如果搜索为空，重新加载所有标签
      fetchAllTags();
      return;
    }
    
    try {
      setLoading(true);
      const response = await tagsAPI.searchTags(value, 10);
      if (response && response.data) {
        setAvailableTags(response.data);
      }
    } catch (error) {
      console.error('搜索标签失败:', error);
    } finally {
      setLoading(false);
    }
  };

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
        title="标签管理"
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
          {/* 备选标签选择器 */}
          <div style={{ marginBottom: 12 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>备选标签：</Text>
            <Select
              style={{ width: '100%' }}
              placeholder="搜索或选择标签"
              value={searchValue}
              onChange={handleTagSelect}
              onSearch={handleSearch}
              notFoundContent={loading ? <Spin size="small" /> : (error ? error : '暂无标签')}
              options={availableTags.map(tag => ({
                label: tag,
                value: tag
              }))}
              filterOption={false}
              showSearch
              allowClear
            />
            {error && (
              <Text type="danger" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
                {error}
              </Text>
            )}
          </div>

          {/* 手动输入标签 */}
          <div style={{ marginBottom: 12 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>手动添加：</Text>
            <Input
              placeholder="输入标签后按回车添加"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onPressEnter={onAddTag}
              suffix={
                <Button 
                  type="link" 
                  icon={<PlusOutlined />} 
                  onClick={onAddTag}
                  size="small"
                />
              }
            />
            {tagError && (
              <Text type="danger" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
                {tagError}
              </Text>
            )}
          </div>

          {/* 已选择的标签 */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>已选择标签：</Text>
            <div style={{ minHeight: 32 }}>
              {formData.tags.length === 0 ? (
                <Text type="secondary" style={{ fontSize: '12px' }}>暂无标签</Text>
              ) : (
                formData.tags.map((tag, index) => (
                  <Tag
                    key={index}
                    closable
                    onClose={() => onRemoveTag(tag)}
                    style={{ marginBottom: 8, marginRight: 8 }}
                  >
                    {tag}
                  </Tag>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>
    </>
  );
};

export default TagsPopup;
