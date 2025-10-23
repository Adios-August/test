import React, { useEffect, useMemo, useState } from 'react';
import { Layout, List, Input, Button, Avatar, Space, Spin } from 'antd';
import { ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import './MessageThread.scss';

const STORAGE_PREFIX = 'site_conversations_';

// 日期工具，与列表页保持一致 YYYY/MM/DD
const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const formatDate = (d) => `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;

const MessageThread = () => {
  const { threadId: threadIdParam } = useParams();
  const threadId = Number(threadIdParam);
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const currentUserId = authStore.user?.id || authStore.user?.userId;

  const storageKey = useMemo(() => `${STORAGE_PREFIX}${currentUserId || 'guest'}`, [currentUserId]);

  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [activeParticipantId, setActiveParticipantId] = useState(null);

  const loadThreads = () => {
    setLoading(true);
    try {
      const raw = localStorage.getItem(storageKey);
      let data = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(data)) data = [];
      setThreads(data);
    } catch {
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const persistThreads = (data) => {
    localStorage.setItem(storageKey, JSON.stringify(data));
  };

  useEffect(() => {
    loadThreads();
   
  }, [storageKey]);

  const thread = threads.find(t => t.userId === threadId);

 
  const deriveParticipants = () => {
    if (!thread) return [];
    const explicit = Array.isArray(thread.participants) ? thread.participants : [];
    if (explicit.length > 0) return explicit;
    const set = new Map();
    (thread.messages || []).forEach(msg => {
      [msg.from, msg.to].forEach(uid => {
        if (uid && uid !== currentUserId && !set.has(uid)) {
          set.set(uid, { id: uid, name: `用户${uid}`, avatar: null, unreadCount: 0 });
        }
      });
    });
    const list = Array.from(set.values());
   
    if (list.length === 0) {
      return [{ id: 1, name: '访客', avatar: null, unreadCount: 0 }];
    }
    return list;
  };

  const participants = deriveParticipants();

  useEffect(() => {
    if (participants.length > 0 && activeParticipantId == null) {
      setActiveParticipantId(participants[0].id);
    }
  }, [threadId, participants, activeParticipantId]);

  const filteredMessages = () => {
    if (!thread) return [];
    if (!activeParticipantId) return thread.messages || [];
    return (thread.messages || []).filter(
      (m) => m.from === activeParticipantId || m.to === activeParticipantId || m.participantId === activeParticipantId
    );
  };

  const handleSend = () => {
    if (!currentUserId) return;
    if (!thread) return;
    if (!activeParticipantId) return;
    if (!input.trim()) return;
    const now = new Date();
    const newMsg = {
      id: Date.now(),
      from: currentUserId,
      to: activeParticipantId,
      participantId: activeParticipantId,
      content: input.trim(),
      createdAt: now.toLocaleString(),
      time: now.toLocaleString(),  
    };
    const next = threads.map(t => {
      if (t.userId !== threadId) return t;
      const updatedAt = formatDate(now);
      const nextParticipants = participants.some(p => p.id === activeParticipantId)
        ? participants
        : [...participants, { id: activeParticipantId, name: `用户${activeParticipantId}`, avatar: null, unreadCount: 0 }];
      return { ...t, updatedAt, participants: nextParticipants, messages: [...(t.messages || []), newMsg] };
    });
    setThreads(next);
    persistThreads(next);
    setInput('');
  };

  const handleBack = () => navigate('/messages');

  if (loading && !thread) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin />
      </div>
    );
  }

  return (
    <Layout className="message-thread-layout">
      <div className="thread-content">
        <div className="thread-header">
          <Space>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/messages')}>返回列表</Button>
            <span className="thread-title">{thread?.category || '-'}</span>
            <span className="thread-subtitle">{thread?.title || '未知知识'}</span>
       
          </Space>
        </div>
        <div className="thread-body">
          <div className="thread-sider">
            <List
              dataSource={participants}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  className={`participant-item ${activeParticipantId === item.id ? 'active' : ''}`}
                  onClick={() => setActiveParticipantId(item.id)}
                >
                  <List.Item.Meta
                    avatar={<Avatar>{item.name?.[0] || 'U'}</Avatar>}
                    title={item.name}
                    description={item.email}
                  />
                </List.Item>
              )}
            />
          </div>
          <div className="thread-chat">
            <div className="chat-header">
              <Space>
                <Avatar>{(participants.find((p) => p.id === activeParticipantId)?.name || participants[0]?.name || 'U')?.[0] || 'U'}</Avatar>
                <div className="chat-peer">
                  {participants.find((p) => p.id === activeParticipantId)?.name || participants[0]?.name || '参与者'}
                </div>
              
              </Space>
            </div>
            <div className="chat-messages">
              <List
                dataSource={filteredMessages()}
                loading={loading}
                locale={{ emptyText: null }}
                renderItem={(msg) => (
                  <List.Item key={msg.id || msg.time} className={`msg-item ${(msg.from === (authStore.user?.id || authStore.user?.userId)) || msg.from === 'me' ? 'mine' : 'other'}`}>
                    <div className="msg-bubble">
                      <div className="msg-content">{msg.content}</div>
                      <div className="msg-time">{msg.createdAt || msg.time}</div>
                    </div>
                  </List.Item>
                )}
                              />
                            </div>
            <div className="chat-input">
              <div className="input-with-send">
                <Input.TextArea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="输入消息内容..."
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  disabled={!activeParticipantId}
                />
                <Button
                  className="send-btn-inbox"
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  disabled={!activeParticipantId || !input.trim()}
                >
                  发送
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MessageThread;