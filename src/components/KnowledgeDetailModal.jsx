import React, { useState, useEffect } from 'react';
import { Modal, Card, Tag, Spin, message, Button, Tooltip } from 'antd';
import { FileTextOutlined, CloseOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
import { knowledgeAPI } from '../api/knowledge';
import KnowledgeTable from './KnowledgeTable';
import './KnowledgeDetailModal.scss';

const KnowledgeDetailModal = ({ 
  visible, 
  knowledge, 
  onClose, 
  loading = false 
}) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);



  // 处理收藏/取消收藏
  const handleFavorite = async () => {
    if (!knowledge?.id || favoriteLoading) return;
    
    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        // 取消收藏
        const response = await knowledgeAPI.unfavoriteKnowledge(knowledge.id);
        if (response.code === 200) {
          setIsFavorited(false);
          message.success('已取消收藏');
        } else {
          message.error(response.message || '取消收藏失败');
        }
      } else {
        // 添加收藏
        const response = await knowledgeAPI.favoriteKnowledge(knowledge.id);
        if (response.code === 200) {
          setIsFavorited(true);
          message.success('已添加到收藏');
        } else {
          message.error(response.message || '收藏失败');
        }
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      message.error('操作失败，请重试');
    } finally {
      setFavoriteLoading(false);
    }
  };



  if (!knowledge) return null;

  return (
    <Modal
      title={
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <FileTextOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
              <span>知识详情</span>
            </div>
            <Tooltip title={isFavorited ? "取消收藏" : "收藏"} placement="top">
              <Button 
                type="text" 
                icon={isFavorited ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                onClick={handleFavorite}
                loading={favoriteLoading}
                style={{ 
                  color: isFavorited ? '#ff4d4f' : 'inherit',
                  transition: 'all 0.3s ease'
                }}
              />
            </Tooltip>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      className="knowledge-detail-modal"
      destroyOnHidden
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
            
            {/* 数据表格区域 */}
            {knowledge.tableData && knowledge.tableData.rows.length > 0 && knowledge.tableData.columns.length > 0 (
              <div className="knowledge-table-section">
                <h4>数据表格</h4>
                <KnowledgeTable tableData={knowledge.tableData} />
              </div>
            )}
            
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