import React, { useState, useEffect } from 'react';
import { Button, Avatar, message, Tooltip } from 'antd';
import {
  FilePdfOutlined, FileExcelOutlined, TagOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { knowledgeAPI } from '../api/knowledge';
import FavoriteButton from './FavoriteButton';

import PdfPreview from './PdfPreview';
import KnowledgeTable from './KnowledgeTable';
import './SourceExpandedDetail.scss';

const SourceExpandedDetail = ({ knowledgeDetail, loading = false }) => {
  // 处理收藏状态变化
  const handleFavoriteStatusChange = (isFavorited) => {
    // 可以在这里处理收藏状态变化的回调 
  };

  if (loading) {
    return (
      <div className="source-expanded-detail">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!knowledgeDetail) {
    return (
      <div className="source-expanded-detail">
        <div className="empty-state">
          <h3>暂无知识详情</h3>
          <p>请稍后重试</p>
        </div>
      </div>
    );
  }

  return (
    <div className="source-expanded-detail">
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
          {/* Sources展开详情不需要返回按钮 */}
        </div>

        <div className="document-content">
          {/* 数据表格区域 */}
          {knowledgeDetail.tableData && (
            <div className="content-section">
              <KnowledgeTable tableData={knowledgeDetail.tableData} />
            </div>
          )}

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
                      <h4>PDF预览 - {attachment.fileName || attachment.name}</h4>
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
      </div>
    </div>
  );
};

export default SourceExpandedDetail; 