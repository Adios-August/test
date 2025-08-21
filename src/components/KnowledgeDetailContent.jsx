import React from 'react';
import { Button, Avatar, Select, Input } from 'antd';
import {
  HeartOutlined, FilePdfOutlined, FileExcelOutlined, TagOutlined,
  SendOutlined, MailOutlined, UserOutlined,
} from '@ant-design/icons';
import './KnowledgeDetailContent.scss';

const KnowledgeDetailContent = ({ knowledgeDetail, loading = false }) => {
  if (loading) {
    return (
      <div className="knowledge-detail-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!knowledgeDetail) {
    return (
      <div className="knowledge-detail-content">
        <div className="empty-state">
          <h3>暂无知识详情</h3>
          <p>请稍后重试</p>
        </div>
      </div>
    );
  }

  return (
    <div className="knowledge-detail-content">
      <div className="document-detail">
        <div className="document-header">
          <div className="header-left">
            <div className="author-info">
              <Avatar size="small" icon={<UserOutlined />} />
              <span className="author-name">{knowledgeDetail.createdBy || knowledgeDetail.author || '未知作者'}</span>
              <span className="date">{knowledgeDetail.createdTime || knowledgeDetail.date || '未知日期'}</span>
            </div>
            <div className="tags">
              {(knowledgeDetail.tags || []).map((tag, index) => (
                <div key={index} className="custom-tag">
                  <span className="tag-icon">
                    <TagOutlined />
                  </span>
                  <span className="tag-text">{tag}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="header-right">
            <Button type="text" icon={<HeartOutlined />} />
          </div>
        </div>

        <div className="document-content">
          <div className="content-section">
            <div 
              dangerouslySetInnerHTML={{ 
                __html: knowledgeDetail.description || '暂无内容' 
              }} 
            />
          </div>

          <div className="content-section">
            <h3>Attachments</h3>
            <div className="attachment-list">
              {(knowledgeDetail.attachments || []).map((attachment, index) => (
                <div key={index} className="attachment-item">
                  <span className="attachment-icon">
                    {attachment.fileType === 'pdf' ? <FilePdfOutlined /> : <FileExcelOutlined />}
                  </span>
                  <span className="attachment-name">{attachment.fileName || attachment.name}</span>
                  <span className="attachment-size">{attachment.fileSize}</span>
                  <span className="attachment-downloads">下载 {attachment.downloadCount || 0}</span>
                  <Button type="text" size="small">Summary</Button>
                </div>
              ))}
            </div>
          </div>

          <div className="content-section">
            <div className="effective-date">
              <span>生效时间: {knowledgeDetail.effectiveStartTime || knowledgeDetail.effectiveDate || '未知'}</span>
            </div>
          </div>
        </div>

        <div className="feedback-section">
          <div className="feedback-header">
            <h3>Feedback</h3>
            <div className="feedback-controls">
              <Select
                placeholder="选择反馈..."
                style={{ width: 120 }}
                options={[
                  { value: 'bug', label: 'Bug报告' },
                  { value: 'feature', label: '功能建议' },
                  { value: 'other', label: '其他' }
                ]}
              />
              <Input
                placeholder="请输入反馈内容"
                style={{ width: 300 }}
              />
              <Button type="text" icon={<SendOutlined />} />
              <Button type="text" icon={<MailOutlined />} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeDetailContent; 