import React, { useState, useEffect } from 'react';
import { Layout, message, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { knowledgeAPI } from '../../api/knowledge';
import KnowledgeDetailContent from '../../components/KnowledgeDetailContent';
import { useAuthStore } from '../../stores';
import './KnowledgeDetailPage.scss';

const { Content } = Layout;

const KnowledgeDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const authStore = useAuthStore();
  
  // 知识详情数据状态
  const [knowledgeDetail, setKnowledgeDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  // 获取知识详情
  const fetchKnowledgeDetail = async (knowledgeId) => {
    if (!knowledgeId) return;
    
    setLoading(true);
    try {
      const response = await knowledgeAPI.getKnowledgeDetail(knowledgeId);
      if (response.code === 200) {
        setKnowledgeDetail(response.data);
      } else {
        message.error(response.message || '获取知识详情失败');
      }
    } catch (error) {
      console.error('获取知识详情失败:', error);
      message.error('获取知识详情失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取知识详情
  useEffect(() => {
    if (id) {
      fetchKnowledgeDetail(id);
    }
  }, [id]);

  // 监听工作区变化，重新加载当前知识详情
  useEffect(() => {
    if (id && authStore.currentWorkspace) {
      fetchKnowledgeDetail(id);
    }
  }, [authStore.currentWorkspace, id]);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Layout className="knowledge-detail-page">
      <Content className="detail-content">
        <KnowledgeDetailContent 
          knowledgeDetail={knowledgeDetail} 
          loading={loading} 
        />
      </Content>
    </Layout>
  );
};

export default KnowledgeDetailPage;