import React from 'react';
import { 
  Input, 
  Button, 
  Tag, 
  Typography,
  Card
} from 'antd';
import { 
  PlusOutlined
} from '@ant-design/icons';

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
          <div style={{ marginTop: 12, minHeight: 32 }}>
            {formData.tags.map((tag, index) => (
              <Tag
                key={index}
                closable
                onClose={() => onRemoveTag(tag)}
                style={{ marginBottom: 8, marginRight: 8 }}
              >
                {tag}
              </Tag>
            ))}
          </div>
        </div>
      </Card>
    </>
  );
};

export default TagsPopup;
