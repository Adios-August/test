import React, { useEffect, useMemo, useState } from 'react';
import { Layout, Button, Space, Table } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../stores';
import { useNavigate } from 'react-router-dom';
import './Messages.scss';

const STORAGE_PREFIX = 'site_conversations_';

// 日期格式化工具
const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const formatDate = (d) => `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
const safeParseDate = (str) => {
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
};

// 线程数据（包含栏目、标题、更新日期）
const mockUsers = [
  { userId: 1, category: 'IWS/Fund', title: '[Sharing] 20250707 Weekly Investment Product/Portfolio Idea Briefing', updatedAt: formatDate(new Date()) },
  { userId: 2, category: 'IWS/Fund', title: '[2025年6月 · WPS产品方案] CIO House view & Product Solution - Funds/SP/FX', updatedAt: formatDate(new Date()) },
  { userId: 3, category: 'IWS/Fund', title: '外资银行-私募(BJ)核销价估值表2号产品最新材料及培训视频回放', updatedAt: formatDate(new Date()) },
  { userId: 4, category: 'IWS/Fund', title: '[QDUT每日价格]---2025/7/8', updatedAt: formatDate(new Date()) },
  { userId: 5, category: 'IWS/Fund', title: '[QDII SN资质简讯] 人民币从贬值美元贬息产品细则 - GPB Session', updatedAt: formatDate(new Date()) },
];

const Messages = () => {
  const authStore = useAuthStore();
  const currentUserId = authStore.user?.id || authStore.user?.userId;

  const storageKey = useMemo(() => `${STORAGE_PREFIX}${currentUserId || 'guest'}`, [currentUserId]);

  const [conversations, setConversations] = useState([]); // [{userId, category, title, updatedAt, messages:[{from,to,content,time}]}]
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadConversations = () => {
    setLoading(true);
    try {
      const raw = localStorage.getItem(storageKey);
      let data = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(data)) data = [];
      // 初始化：若没有会话，基于 mockUsers 创建线程（包含栏目与标题、更新日期）
      if (data.length === 0) {
        data = mockUsers.map(u => ({ userId: u.userId, category: u.category, title: u.title, updatedAt: u.updatedAt, messages: [] }));
      } else {
        // 兼容旧数据：补齐 updatedAt 字段，优先使用最后消息时间；若无消息则用今日日期
        data = data.map(c => {
          const lastMsg = c.messages && c.messages.length > 0 ? c.messages[c.messages.length - 1] : null;
          const updated = c.updatedAt || (lastMsg ? formatDate(safeParseDate(lastMsg.time)) : formatDate(new Date()));
          return { ...c, updatedAt: updated };
        });
      }
      setConversations(data);
      // 默认选中第一个
      if (data.length > 0 && selectedUserId == null) {
        setSelectedUserId(data[0].userId);
      }
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const persistConversations = (data) => {
    localStorage.setItem(storageKey, JSON.stringify(data));
  };

  

  const handleRefresh = () => loadConversations();

  useEffect(() => {
    loadConversations();
  
  }, [storageKey]);

  const navigate = useNavigate();

  const handleView = (userId) => navigate(`/messages/thread/${userId}`);
  const handleDelete = (userId) => {
    const next = conversations.filter(c => c.userId !== userId);
    setConversations(next);
    persistConversations(next);
  };

  const columns = [
    { title: 'No.', dataIndex: 'index', width: 80, render: (_, __, idx) => idx + 1 },
    { title: 'Category', dataIndex: 'category', width: 140, render: (text) => text || '-' },
    { title: 'Knowledge Title', dataIndex: 'title', ellipsis: true, render: (text) => text || '-' },
    { title: 'Update Date', dataIndex: 'updatedAt', width: 160, render: (text) => text || '-' },
    { title: 'Operation', dataIndex: 'actions', width: 140, render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleView(record.userId)}>查看</Button>
          <Button type="link" danger size="small" onClick={() => handleDelete(record.userId)}>删除</Button>
        </Space>
      ) },
  ];

  return (
    <Layout className="messages-layout">
      <div className="messages-main">
        <div className="messages-content">
          <div className="content-header">
            <Space>
              <h2>InMails</h2>
              <Button type="text" icon={<ReloadOutlined />} onClick={handleRefresh} />
        
            </Space>
          </div>
          <div className="content-body">
            <div className="messages-table">
              <Table
                rowKey="userId"
                loading={loading}
                dataSource={conversations}
                columns={columns}
                pagination={{ pageSize: 10, showTotal: (total) => `共${total}条记录` }}
                onRow={(record) => ({ onClick: () => handleView(record.userId) })}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Messages;