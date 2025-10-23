import React, { useMemo } from 'react';
import { Button, Spin } from 'antd';
import { FilePdfOutlined, FileExcelOutlined } from '@ant-design/icons';

// 简单词级别Diff算法（LCS），用于高亮新增/删除的差异
const computeWordDiff = (oldText = '', newText = '') => {
  const a = (oldText || '').split(/\s+/);
  const b = (newText || '').split(/\s+/);
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const oldSegments = [];
  const newSegments = [];
  let i = m, j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      const word = a[i - 1];
      oldSegments.push({ text: word, type: 'same' });
      newSegments.push({ text: word, type: 'same' });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      const word = b[j - 1];
      newSegments.push({ text: word, type: 'added' });
      j--;
    } else if (i > 0) {
      const word = a[i - 1];
      oldSegments.push({ text: word, type: 'removed' });
      i--;
    }
  }

  oldSegments.reverse();
  newSegments.reverse();
  return { oldSegments, newSegments };
};

const SegmentsView = ({ segments, mode }) => {
  return (
    <div style={{ lineHeight: 1.8, fontSize: 14 }}>
      {segments.map((seg, idx) => {
        const isAdded = seg.type === 'added';
        const isRemoved = seg.type === 'removed';
        const isSame = seg.type === 'same';
        const show = (mode === 'old' && (isRemoved || isSame)) || (mode === 'new' && (isAdded || isSame));
        if (!show) return null;
        const style = isSame
          ? { background: 'transparent' }
          : mode === 'old'
            ? { background: 'rgba(255, 92, 87, 0.18)', color: '#a8071a' }
            : { background: 'rgba(82, 196, 26, 0.18)', color: '#135200' };
        return (
          <span key={idx} style={{ ...style, padding: '1px 2px', borderRadius: 3, marginRight: 2 }}>{seg.text}</span>
        );
      })}
    </div>
  );
};

/**
 * KnowledgeDiff - 版本差异对比组件
 * Props:
 * - documentTitle: 文档标题
 * - fromVersion: 源版本号
 * - toVersion: 目标版本号
 * - fromContent: 源版本内容
 * - toContent: 目标版本内容
 * - onClose: 关闭回到历史列表
 */
const KnowledgeDiff = ({ documentTitle, fromVersion, toVersion, fromContent, toContent, htmlDiff, summary, summaryLoading = false, attachments = [], onClose }) => {
  const { oldSegments, newSegments } = useMemo(() => computeWordDiff(fromContent, toContent), [fromContent, toContent]);

  return (
    <div className="document-detail" style={{ background: 'white',margin:0, borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <div className="document-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="header-left">
          <div style={{ fontSize: 16, fontWeight: 600 }}>版本差异</div>
          {documentTitle && (
            <div style={{ fontSize: 13, color: '#666' }}>文档：{documentTitle}</div>
          )}
          <div style={{ marginTop: 8, fontSize: 13, color: '#444' }}>比较版本 {String(fromVersion || '-')} 至版本 {String(toVersion || '-')}</div>
        </div>
        <div className="header-right">
          <Button type="default" onClick={onClose}>返回历史</Button>
        </div>
      </div>

      <div className="document-content">
        <div className="content-section">
          <div style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>变更摘要</div>
            {summaryLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Spin size="small" />
                <span style={{ fontSize: 14, color: '#666' }}>AI 摘要生成中...</span>
              </div>
            ) : (
              <div style={{ fontSize: 14, color: '#444' }}>{summary || '暂无摘要'}</div>
            )}
          </div>

          <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>绿色为新增，红色为删除。</div>
          <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, minHeight: 160 }}>
            {htmlDiff ? (
              <div dangerouslySetInnerHTML={{ __html: htmlDiff }} />
            ) : toContent || fromContent ? (
              <>
                <SegmentsView segments={newSegments} mode="new" />
                {oldSegments.some(s => s.type === 'removed') && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>已删除内容：</div>
                    <SegmentsView segments={oldSegments} mode="old" />
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: '#999' }}>暂无差异内容</div>
            )}
          </div>
        </div>

        {attachments && attachments.length > 0 && (
          <div className="content-section">
            <h3>Attachments</h3>
            <div className="attachment-list">
              {attachments.map((attachment, index) => (
                <div key={index} className="attachment-item">
                  <div className="attachment-header">
                    <span className="attachment-icon">
                      {attachment.fileType === 'pdf' ? <FilePdfOutlined /> : <FileExcelOutlined />}
                    </span>
                    <span className="attachment-name">{attachment.fileName || attachment.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeDiff;