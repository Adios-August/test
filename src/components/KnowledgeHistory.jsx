import React, { useMemo, useState, useEffect } from 'react';
import { Button, Select, Table, Space } from 'antd';

/**
 * KnowledgeHistory - 版本历史视图组件
 * Props:
 * - documentTitle: 文档标题字符串
 * - versions: [{ version: number|string, editor: string, date: string }] 版本列表（按降序排列，最新版在最上）
 * - currentVersion: 当前版本号（可选，默认取 versions[0].version）
 * - onCompare: (fromVersion, toVersion) => void 比较回调
 * - onClose: () => void 关闭历史视图并返回详情tabs
 * - onViewVersion: (versionNumber) => void 点击查看该版本内容
 */
const KnowledgeHistory = ({ documentTitle, versions = [], currentVersion, onCompare, onClose, loading = false, onViewVersion }) => {
  const latestVersion = useMemo(() => currentVersion ?? (versions[0]?.version ?? ''), [currentVersion, versions]);
const filteredVersions = useMemo(() => {
  return Array.isArray(versions)
    ? versions.filter(v => String(v.version) !== String(latestVersion))
    : [];
}, [versions, latestVersion]);
const [targetVersion, setTargetVersion] = useState(() => {
  // 默认选择第一个非当前版本
  return filteredVersions[0]?.version ?? '';
});

// 当版本列表或当前版本变化时，若当前选择无效则重置
useEffect(() => {
  const valid = filteredVersions.some(v => String(v.version) === String(targetVersion));
  if (!valid) {
    setTargetVersion(filteredVersions[0]?.version ?? '');
  }
}, [filteredVersions]);
  const hasVersions = Array.isArray(versions) && versions.length > 0;

  const columns = [
    { title: '版本', dataIndex: 'version', key: 'version', width: 100 },
    { title: '上次编辑者', dataIndex: 'editor', key: 'editor', render: (text) => (
      <a href="#" onClick={(e) => e.preventDefault()}>{text}</a>
    ) },
    { title: '发布日期', dataIndex: 'date', key: 'date', width: 160 },
    { title: '操作', key: 'actions', width: 120, render: (_, row) => (
      <Space>
        <Button size="small" onClick={() => onViewVersion?.(row.version)}>查看</Button>
      </Space>
    ) },
  ];

  const handleShowDiff = () => {
    if (!latestVersion || !targetVersion || latestVersion === targetVersion) return;
    onCompare?.(latestVersion, targetVersion);
  };

  return (
    <div className="knowledge-history" style={{ background: 'white', borderRadius: 12, padding: 24,   boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <div className="history-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>版本历史记录</div>
          {documentTitle && (
            <div style={{ fontSize: 13, color: '#666' }}>文档：{documentTitle}</div>
          )}
        </div>
        <Button type="default" onClick={onClose}>返回</Button>
      </div>

      {versions.length >= 2 && (
        <div className="diff-toolbar" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span>差异选择</span>
          <span>比较版本</span>
          <span style={{ fontWeight: 600 }}>{latestVersion || '-'}</span>
          <span>至版本：</span>
          <Select
            style={{ width: 120 }}
            value={targetVersion}
            options={filteredVersions.map(v => ({ label: String(v.version), value: v.version }))}
            onChange={setTargetVersion}
          />
          <Button type="primary" onClick={handleShowDiff} disabled={!latestVersion || !targetVersion || latestVersion === targetVersion} loading={loading}>显示</Button>
        </div>
      )}

      <Table
        size="small"
        rowKey={(row) => String(row.version)}
        columns={columns}
        dataSource={versions}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default KnowledgeHistory;