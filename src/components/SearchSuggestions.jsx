import React, { useState, useEffect } from 'react';
import { Spin, message } from 'antd';
import { homeAPI } from '../api/home';
import { useAuthStore } from '../stores';
import HistoryQuestions from './HistoryQuestions';
import RecommendedQuestions from './RecommendedQuestions';
import './SearchSuggestions.scss';
import { deleteSearchHistory } from '../utils/searchHistoryAPI';

const SearchSuggestions = ({ 
  visible, 
  onQuestionClick, 
  onMouseDown,
  onClose
}) => {
  const [historyQuestions, setHistoryQuestions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [recommendedQuestions, setRecommendedQuestions] = useState([]);
  const [recommendedLoading, setRecommendedLoading] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showAllRecommended, setShowAllRecommended] = useState(false);
  
  const authStore = useAuthStore();

  // 获取推荐问题
  const fetchRecommendedQuestions = async () => {
    setRecommendedLoading(true);
    try {
      const response = await homeAPI.getRecommendedQuestions(10);
      if (response.code === 200) {
        setRecommendedQuestions(response.data || []);
      } else {
        setRecommendedQuestions([]);
      }
    } catch (error) {
      console.error('获取推荐问题失败:', error);
      setRecommendedQuestions([]);
    } finally {
      setRecommendedLoading(false);
    }
  };

  // 获取历史问题
  const fetchHistoryQuestions = async () => {
    setHistoryLoading(true);
    try {
      const userId = authStore.user?.id || authStore.user?.userId;
      const response = await homeAPI.getHistoryQuestions(userId);
      if (response.code === 200) {
        const raw = response.data || [];
        const normalized = Array.isArray(raw) ? raw.map((item, idx) => {
          if (typeof item === 'string') {
            return { id: `history-${idx}`, query: item };
          }
          if (item && typeof item === 'object') {
            const query = item.query ?? item.text ?? item.title ?? '';
            return { id: item.id ?? `history-${idx}`, query: String(query || '') };
          }
          return { id: `history-${idx}`, query: '' };
        }) : [];
        setHistoryQuestions(normalized);
      } else {
        setHistoryQuestions([]);
      }
    } catch (error) {
      console.error('获取历史问题失败:', error);
      setHistoryQuestions([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 处理历史问题点击
  const handleHistoryQuestionClick = (question) => {
    onQuestionClick(question);
    if (typeof onClose === 'function') onClose();
  };

  // 删除历史问题
  const handleDeleteHistory = async (id) => {
    try {
      await deleteSearchHistory(id);
      setHistoryQuestions(prev => prev.filter(item => item.id !== id));
      message.success('已删除该历史记录');
    } catch (err) {
      console.error('删除历史记录失败:', err);
      message.error('删除失败，请稍后重试');
    }
  };

  // 处理推荐问题点击
  const handleRecommendedQuestionClick = (question) => {
    // 如果question是对象，提取问题文本
    const questionText = typeof question === 'string' ? question : question.text || question.title || question;
    onQuestionClick(questionText);
    if (typeof onClose === 'function') onClose();
  };

  // 组件挂载时加载数据
  useEffect(() => {
    if (visible) {
      fetchRecommendedQuestions();
      fetchHistoryQuestions();
    }
  }, [visible]);

  // 监听工作区变化，重新加载数据
  useEffect(() => {
    if (visible) {
      fetchRecommendedQuestions();
      fetchHistoryQuestions();
    }
  }, [authStore.currentWorkspace, visible]);

  if (!visible) {
    return null;
  }

  return (
    <div 
      className="search-suggestions"
      onMouseDown={onMouseDown}
    >
      <div className="suggestions-content">
        <HistoryQuestions
          questions={historyQuestions}
          loading={historyLoading}
          showAll={showAllHistory}
          onShowAllToggle={() => setShowAllHistory(!showAllHistory)}
          onQuestionClick={handleHistoryQuestionClick}
          onDelete={handleDeleteHistory}
        />
        
        <RecommendedQuestions
          questions={recommendedQuestions}
          loading={recommendedLoading}
          showAll={showAllRecommended}
          onShowAllToggle={() => setShowAllRecommended(!showAllRecommended)}
          onQuestionClick={handleRecommendedQuestionClick}
        />
      </div>
    </div>
  );
};

export default SearchSuggestions;