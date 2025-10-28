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
  setFormData,
  tagInput,
  setTagInput,
  tagError,
  onAddTag,
  onRemoveTag,
  anchorEl
}) => {
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(false);
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
          {/* 输入框 - 支持搜索和手动输入 */}
          <div style={{ marginBottom: 12 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>添加标签：</Text>
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="输入或选择标签"
              value={formData.tags}
              onChange={(values) => {
                setFormData(prev => ({
                  ...prev,
                  tags: values
                }));
              }}
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

          {/* 备选标签列表 */}
          {availableTags.length > 0 && (
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>备选标签：</Text>
              <div style={{ maxHeight: 120, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: '4px', padding: '8px' }}>
                {availableTags.map(tag => (
                  <Tag
                    key={tag}
                    style={{ 
                      margin: '2px', 
                      cursor: 'pointer',
                      opacity: formData.tags.includes(tag) ? 0.3 : 1
                    }}
                    onClick={() => {
                      if (!formData.tags.includes(tag)) {
                        setFormData(prev => ({
                          ...prev,
                          tags: [...prev.tags, tag]
                        }));
                      }
                    }}
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </>
  );
};

export default TagsPopup;
