import React from 'react';
import { Spin } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

const HistoryQuestions = ({ 
  questions, 
  loading, 
  showAll, 
  onShowAllToggle, 
  onQuestionClick,
  onDelete
}) => {
  const displayQuestions = showAll ? questions : questions.slice(0, 2);

  return (
    <div className="history-questions">
      <div className="section-title">History</div>
      {loading ? (
        <div className="loading-questions">
          <Spin size="small" />
          <span>Loading...</span>
        </div>
      ) : questions.length > 0 ? (
        <>
          {displayQuestions.map((historyItem) => {
            const text = typeof historyItem?.query === 'string'
              ? historyItem.query
              : (historyItem?.query?.text || historyItem?.query?.title || '');
            const canDelete = historyItem && typeof historyItem.id !== 'undefined' && String(historyItem.id).indexOf('history-') !== 0;
            return (
              <div 
                key={historyItem.id} 
                className="question-item"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  onQuestionClick(text);
                }}
              >
                <span className="question-text">{text}</span>
                {canDelete && (
                  <span
                    className="delete-icon"
                    style={{ marginLeft: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(historyItem.id);
                    }}
                    title="删除这条历史记录"
                  >
                    <DeleteOutlined />
                  </span>
                )}
              </div>
            );
          })}
          {questions.length > 2 && (
            <div 
              className="show-more-btn"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                onShowAllToggle();
              }}
            >
              {showAll ? 'Fold Up' : `More (${questions.length - 2})`}
            </div>
          )}
        </>
      ) : (
        <div className="no-history">
          <p>No search history available at the moment</p>
        </div>
      )}
    </div>
  );
};

export default HistoryQuestions;