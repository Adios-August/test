import React from 'react';
import { Modal, Card, Tag, Spin, message } from 'antd';
import { FileTextOutlined, CloseOutlined } from '@ant-design/icons';
import './KnowledgeDetailModal.scss';

const KnowledgeDetailModal = ({ 
  visible, 
  knowledge, 
  onClose, 
  loading = false 
}) => {
  if (!knowledge) return null;

  return (
    <Modal
      title={
        <div className="modal-header">
          <FileTextOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
          <span>知识详情</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      className="knowledge-detail-modal"
      destroyOnClose
    >
      {loading ? (
        <div className="loading-container">
          <Spin size="large" />
          <p>正在加载知识详情...</p>
        </div>
      ) : (
        <div className="knowledge-content">
          <Card className="knowledge-card">
            <div className="knowledge-header">
              <h3 className="knowledge-title">{knowledge.knowledgeName}</h3>
              {knowledge.tags && knowledge.tags.length > 0 && (
                <div className="knowledge-tags">
                  {knowledge.tags.map((tag, index) => (
                    <Tag key={index} color="blue" size="small">
                      {tag}
                    </Tag>
                  ))}
                </div>
              )}
            </div>
            
            {knowledge.description && (
              <div className="knowledge-description">
                <h4>描述</h4>
                <p>{knowledge.description}</p>
              </div>
            )}
            
            {knowledge.content && (
              <div className="knowledge-content-section">
                <h4>内容</h4>
                <div className="content-text">
                  {knowledge.content}
                </div>
              </div>
            )}
            
            <div className="knowledge-meta">
              <div className="meta-item">
                <span className="meta-label">知识ID:</span>
                <span className="meta-value">{knowledge.knowledgeId}</span>
              </div>
              {knowledge.createTime && (
                <div className="meta-item">
                  <span className="meta-label">创建时间:</span>
                  <span className="meta-value">{knowledge.createTime}</span>
                </div>
              )}
              {knowledge.updateTime && (
                <div className="meta-item">
                  <span className="meta-label">更新时间:</span>
                  <span className="meta-value">{knowledge.updateTime}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </Modal>
  );
};

export default KnowledgeDetailModal; 