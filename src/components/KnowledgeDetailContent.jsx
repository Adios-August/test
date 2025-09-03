import React, { useState, useEffect } from 'react';
import { Button, Avatar, Select, Input, message, Tooltip } from 'antd';
import {
  FilePdfOutlined, FileExcelOutlined, TagOutlined,
  SendOutlined, UserOutlined, ArrowLeftOutlined,
} from '@ant-design/icons';
import { knowledgeAPI } from '../api/knowledge';
import { useFeedbackTypes } from '../hooks/useFeedbackTypes';
import { feedbackAPI } from '../api/feedback';
import FeedbackMailButton from './FeedbackMailButton';
import FavoriteButton from './FavoriteButton';
import { useAuthStore } from '../stores';
import { sanitizeHtmlLinks } from '../utils/htmlUtils';

import PdfPreview from './PdfPreview';
import './KnowledgeDetailContent.scss';

const KnowledgeDetailContent = ({ knowledgeDetail, loading = false }) => {
  const { feedbackTypes, loading: feedbackTypesLoading } = useFeedbackTypes();
  const authStore = useAuthStore();
  const currentUserId = authStore.user?.id || authStore.user?.userId;
  
  // Feedback状态
  const [selectedFeedbackType, setSelectedFeedbackType] = useState('');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // 处理收藏状态变化
  const handleFavoriteStatusChange = (isFavorited) => {
    // 可以在这里处理收藏状态变化的回调
    console.log('收藏状态变化:', isFavorited);
  };

  // 处理feedback提交
  const handleSubmitFeedback = async () => {
    if (!knowledgeDetail?.id) {
      message.error('知识详情不存在');
      return;
    }

    if (!selectedFeedbackType) {
      message.warning('请选择反馈类型');
      return;
    }

    if (!feedbackContent.trim()) {
      message.warning('请输入反馈内容');
      return;
    }

    if (!currentUserId) {
      message.error('请先登录');
      return;
    }

    setFeedbackSubmitting(true);
    try {
      const response = await feedbackAPI.submitFeedback(
        knowledgeDetail.id,
        feedbackContent.trim(),
        selectedFeedbackType,
        currentUserId
      );

      if (response.code === 200) {
        message.success('反馈提交成功');
        // 清空表单
        setSelectedFeedbackType('');
        setFeedbackContent('');
      } else {
        message.error(response.message || '提交失败，请重试');
      }
    } catch (error) {
      console.error('提交反馈失败:', error);
      message.error('提交失败，请重试');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

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
              <FavoriteButton 
                knowledgeId={knowledgeDetail.id}
                onStatusChange={handleFavoriteStatusChange}
                style={{ marginLeft: '16px', fontSize: '16px' }}
              />
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
            <Button 
              type="primary" 
              icon={<ArrowLeftOutlined />} 
              size="large"
              onClick={() => window.history.back()}
              style={{ fontSize: '16px' }}
            >
              返回
            </Button>
          </div>
        </div>

        <div className="document-content">
          <div className="content-section">
            <div 
              dangerouslySetInnerHTML={{ 
                __html: sanitizeHtmlLinks(knowledgeDetail.description) || '暂无内容' 
              }} 
            />
          </div>

          <div className="content-section">
            <h3>Attachments</h3>
            <div className="attachment-list">
              {(knowledgeDetail.attachments || []).map((attachment, index) => (
                <div key={index} className="attachment-item">
                  <div className="attachment-header">
                    <span className="attachment-icon">
                      {attachment.fileType === 'pdf' ? <FilePdfOutlined /> : <FileExcelOutlined />}
                    </span>
                    <span className="attachment-name">{attachment.fileName || attachment.name}</span>
                    <span className="attachment-size">{attachment.fileSize}</span>
                    <span className="attachment-downloads">下载 {attachment.downloadCount || 0}</span>
                    <Button type="text" size="small">下载</Button>
                  </div>
                  
                  {/* PDF预览组件 - 直接嵌入到附件项中 */}
                  {(attachment.fileType === 'pdf' || 
                    attachment.fileType === 'application/pdf' ||
                    (attachment.fileName && attachment.fileName.toLowerCase().endsWith('.pdf')) ||
                    (attachment.name && attachment.name.toLowerCase().endsWith('.pdf'))) && (
                    <div className="pdf-preview-embedded">
                      
                      <PdfPreview 
                        fileUrl={attachment.filePath || attachment.fileUrl || attachment.url} 
                        pageNum={1}
                        bboxes={[]}
                      />
                    </div>
                  )}
                  
                  {/* 如果没有PDF预览，显示原因 */}
                  {!(attachment.fileType === 'pdf' || 
                     attachment.fileType === 'application/pdf' ||
                     (attachment.fileName && attachment.fileName.toLowerCase().endsWith('.pdf')) ||
                     (attachment.name && attachment.name.toLowerCase().endsWith('.pdf'))) && (
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                      非PDF文件，无法预览
                    </div>
                  )}
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
                options={feedbackTypes}
                loading={feedbackTypesLoading}
                value={selectedFeedbackType}
                onChange={setSelectedFeedbackType}
              />
              <Input
                placeholder="请输入反馈内容"
                style={{ width: 300 }}
                value={feedbackContent}
                onChange={(e) => setFeedbackContent(e.target.value)}
                onPressEnter={handleSubmitFeedback}
              />
              <Button 
                type="text" 
                icon={<SendOutlined />} 
                onClick={handleSubmitFeedback}
                loading={feedbackSubmitting}
                disabled={!selectedFeedbackType || !feedbackContent.trim()}
              />
              <FeedbackMailButton knowledgeDetail={knowledgeDetail} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeDetailContent; 