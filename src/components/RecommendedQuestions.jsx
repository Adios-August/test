import React from 'react';
import { Spin } from 'antd';

const RecommendedQuestions = ({ 
  questions, 
  loading, 
  showAll, 
  onShowAllToggle, 
  onQuestionClick 
}) => {
  const displayQuestions = showAll ? questions : questions.slice(0, 2);

  return (
    <div className="recommended-questions">
      <div className="section-title">推荐问题</div>
      {loading ? (
        <div className="loading-questions">
          <Spin size="small" />
          <span>加载中...</span>
        </div>
      ) : questions.length > 0 ? (
        <>
          {displayQuestions.map((question, index) => (
            <div 
              key={index} 
              className="question-item"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                onQuestionClick(question);
              }}
            >
              {question}
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
        <div className="no-recommendations">
          <p>暂无推荐问题</p>
        </div>
      )}
    </div>
  );
};

export default RecommendedQuestions;