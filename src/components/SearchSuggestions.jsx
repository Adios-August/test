import React, { useState, useEffect } from 'react';
import { Spin } from 'antd';
import { homeAPI } from '../api/home';
import { useAuthStore } from '../stores';
import HistoryQuestions from './HistoryQuestions';
import RecommendedQuestions from './RecommendedQuestions';
import './SearchSuggestions.scss';

const SearchSuggestions = ({ 
  visible, 
  onQuestionClick, 
  onMouseDown 
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
      // 从localStorage获取用户信息
      const authStoreStr = localStorage.getItem('authStore');
      const authStore = JSON.parse(authStoreStr || '{}');
      const userId = authStore.user?.id;
      
      if (!userId) {
        setHistoryQuestions([]);
        return;
      }
      
      const response = await homeAPI.getHistoryQuestions(userId);
      
      if (response.code === 200) {
        // 将字符串数组转换为对象数组，以适配渲染逻辑
        const formattedData = (response.data || []).map((query, index) => ({
          id: index,
          query: query
        }));
        
        setHistoryQuestions(formattedData);
      } else {
        setHistoryQuestions([]);
      }
    } catch (error) {
      console.error('获取历史问题异常:', error);
      setHistoryQuestions([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 处理历史问题点击
  const handleHistoryQuestionClick = (question) => {
    onQuestionClick(question);
  };

  // 处理推荐问题点击
  const handleRecommendedQuestionClick = (question) => {
    // 如果question是对象，提取问题文本
    const questionText = typeof question === 'string' ? question : question.text || question.title || question;
    onQuestionClick(questionText);
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