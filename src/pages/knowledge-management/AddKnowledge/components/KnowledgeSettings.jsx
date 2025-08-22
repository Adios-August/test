import React from 'react';
import { 
  Input, 
  Button, 
  Tag, 
  Upload, 
  Drawer,
  Divider,
  Typography,
  DatePicker
} from 'antd';
import { 
  PlusOutlined, 
  UploadOutlined
} from '@ant-design/icons';
import { useFileUpload } from '../hooks/useFileUpload';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const KnowledgeSettings = ({ 
  open,
  onClose,
  formData,
  setFormData,
  tagInput,
  setTagInput,
  tagError,
  onAddTag,
  onRemoveTag
}) => {
  const { getAttachmentUploadProps } = useFileUpload();

  // Get attachment upload configuration
  const attachmentUploadProps = getAttachmentUploadProps(formData, setFormData);

  return (
    <Drawer
      title="知识配置"
      placement="right"
      width={400}
      onClose={onClose}
      open={open}
    >
      {/* Tag management */}
      <div className="config-item" style={{ marginBottom: 24 }}>
        <Text strong>标签</Text>
        <div style={{ marginTop: 8 }}>
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
          <div style={{ marginTop: 12 }}>
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
      </div>

      <Divider />

      {/* Effective time */}
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

      {/* Attachment upload */}
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
  );
};

export default KnowledgeSettings;
