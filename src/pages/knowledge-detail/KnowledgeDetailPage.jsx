import React, { useState, useEffect, useRef } from 'react';
import { Layout, message, Spin } from 'antd';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { knowledgeAPI } from '../../api/knowledge';
import KnowledgeDetailContent from '../../components/KnowledgeDetailContent';
import { useAuthStore } from '../../stores';
import './KnowledgeDetailPage.scss';

const { Content } = Layout;

const KnowledgeDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const authStore = useAuthStore();
  
  // 知识详情数据状态
  const [knowledgeDetail, setKnowledgeDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const lastFetchKeyRef = useRef(null);

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

  // 根据 id 与 workspace 合并触发，并加入去重防护（避免 StrictMode 或双监听导致的重复请求）
  useEffect(() => {
    if (!id) return;
    const workspace = authStore.currentWorkspace || 'default';
    const fetchKey = `${workspace}:${id}`;
    if (lastFetchKeyRef.current === fetchKey) {
      return;
    }
    lastFetchKeyRef.current = fetchKey;
    fetchKnowledgeDetail(id);
  }, [id, authStore.currentWorkspace]);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Layout className="knowledge-detail-page">
      <Content className="detail-content">
        <KnowledgeDetailContent 
          knowledgeDetail={knowledgeDetail} 
          loading={loading}
          showBackButton={searchParams.get('from') !== 'new'}
        />
      </Content>
    </Layout>
  );
};

export default KnowledgeDetailPage;