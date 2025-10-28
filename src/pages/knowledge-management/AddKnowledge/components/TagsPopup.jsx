import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  Typography,
  Card,
  Select,
  Spin
} from 'antd';
import { tagsAPI } from '../../../../api/tags';

const { Text } = Typography;

const TagsPopup = ({ 
  visible,
  onClose,
  formData,
  setFormData
}) => {
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(false);

  // 获取所有标签
  useEffect(() => {
    if (visible) {
      fetchAllTags();
    }
  }, [visible]);

  const fetchAllTags = async () => {
    try {
      setLoading(true);
      const response = await tagsAPI.getAllTags();
      if (response && response.data) {
        setAvailableTags(response.data);
      }
    } catch (error) {
      console.error('获取标签列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理标签变化
  const handleTagsChange = (values) => {
    setFormData(prev => ({
      ...prev,
      tags: values || []
    }));
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
          <Text strong style={{ display: 'block', marginBottom: 8 }}>选择标签：</Text>
          <Select
            mode="tags"
            style={{ width: '100%' }}
            placeholder="输入或选择标签"
            value={formData.tags || []}
            onChange={handleTagsChange}
            notFoundContent={loading ? <Spin size="small" /> : '暂无标签'}
            options={availableTags.map(tag => ({
              label: tag,
              value: tag
            }))}
            filterOption={(input, option) =>
              option?.label?.toLowerCase().includes(input.toLowerCase())
            }
            showSearch
            allowClear
          />
        </div>
      </Card>
    </>
  );
};

export default TagsPopup;
