import React from 'react';
import { Spin } from 'antd';

const HistoryQuestions = ({ 
  questions, 
  loading, 
  showAll, 
  onShowAllToggle, 
  onQuestionClick 
}) => {
  const displayQuestions = showAll ? questions : questions.slice(0, 2);

  return (
    <div className="history-questions">
      <div className="section-title">历史问题</div>
      {loading ? (
        <div className="loading-questions">
          <Spin size="small" />
          <span>加载中...</span>
        </div>
      ) : questions.length > 0 ? (
        <>
          {displayQuestions.map((historyItem) => (
            <div 
              key={historyItem.id} 
              className="question-item"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                onQuestionClick(historyItem.query);
              }}
            >
              {historyItem.query}
            </div>
          ))}
          {questions.length > 2 && (
            <div 
              className="show-more-btn"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                onShowAllToggle();
              }}
            >
              {showAll ? '收起' : `查看更多 (${questions.length - 2})`}
            </div>
          )}
        </>
      ) : (
        <div className="no-history">
          <p>暂无搜索历史</p>
        </div>
      )}
    </div>
  );
};

export default HistoryQuestions;