import React, { useState, useEffect, useRef } from 'react';
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
  // 用于在 StrictMode 下防止重复触发请求，以及按工作区和可见性控制加载
  const lastWorkspaceRef = useRef(authStore.currentWorkspace);
  const hasFetchedRef = useRef(false);

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

  // 根据工作区与可见性加载数据，并在开发环境 StrictMode 下避免重复执行
  useEffect(() => {
    // 如果不可见，重置拉取标记，等待下次显示时再拉取
    if (!visible) {
      hasFetchedRef.current = false;
      return;
    }

    // 如果工作区发生变化，允许下一次拉取
    if (lastWorkspaceRef.current !== authStore.currentWorkspace) {
      lastWorkspaceRef.current = authStore.currentWorkspace;
      hasFetchedRef.current = false;
    }

    // 已经为当前工作区拉取过，则跳过，避免重复请求（处理 StrictMode 双触发）
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    fetchRecommendedQuestions();
    fetchHistoryQuestions();
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