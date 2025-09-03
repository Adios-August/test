import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github.css';

const StreamingMarkdownRenderer = ({ content, isStreaming = false }) => {
  // 安全检查：确保content是字符串类型
  if (typeof content !== 'string') {
    console.error('StreamingMarkdownRenderer: content必须是字符串类型，收到:', typeof content, content);
    return (
      <div className="markdown-renderer error">
        <p style={{ color: 'red' }}>内容格式错误，无法渲染</p>
      </div>
    );
  }

  // 如果content为空或null，显示空内容
  if (!content || content.trim() === '') {
    return (
      <div className="markdown-renderer empty">
        <span />
      </div>
    );
  }
  
  return (
    <div className="markdown-renderer">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // 自定义表格组件以确保正确渲染
          table: ({ children, ...props }) => (
            <div className="table-wrapper">
              <table {...props}>{children}</table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th {...props} style={{ border: '1px solid #d0d7de' }}>{children}</th>
          ),
          td: ({ children, ...props }) => (
            <td {...props} style={{ border: '1px solid #d0d7de' }}>{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default StreamingMarkdownRenderer; 