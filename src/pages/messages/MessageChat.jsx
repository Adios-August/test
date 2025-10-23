import React, { useEffect, useMemo, useState } from 'react';
import { Layout, List, Input, Button, Avatar, Space } from 'antd';
import { UserOutlined, SendOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import './MessageChat.scss';

const STORAGE_PREFIX = 'site_conversations_';

const MessageChat = () => {
  const { userId: peerIdParam } = useParams();
  const peerId = Number(peerIdParam);
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const currentUserId = authStore.user?.id || authStore.user?.userId;
  const currentUserName = authStore.user?.displayName || '我';

  const storageKey = useMemo(() => `${STORAGE_PREFIX}${currentUserId || 'guest'}`, [currentUserId]);

  const [conversations, setConversations] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const loadConversations = () => {
    setLoading(true);
    try {
      const raw = localStorage.getItem(storageKey);
      let data = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(data)) data = [];
      setConversations(data);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const persistConversations = (data) => {
    localStorage.setItem(storageKey, JSON.stringify(data));
  };

  const getConversation = () => conversations.find(c => c.userId === peerId);

  const handleSend = () => {
    if (!currentUserId) return;
    if (!peerId) return;
    if (!input.trim()) return;
    const newMsg = {
      from: currentUserId,
      to: peerId,
      content: input.trim(),
      time: new Date().toLocaleString(),
    };
    const next = conversations.map(c => c.userId === peerId ? { ...c, messages: [...c.messages, newMsg] } : c);
    setConversations(next);
    persistConversations(next);
    setInput('');
  };

  useEffect(() => {
    loadConversations();
    
  }, [storageKey]);

  const conv = getConversation();

  return (
    <Layout className="message-chat-layout">
      <div className="message-chat-content">
        <div className="chat-header">
          <Space>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/messages')}>返回列表</Button>
            <Avatar icon={<UserOutlined />} />
            <div>
              <div className="chat-peer">{conv?.displayName || '未知用户'}</div>
              <div className="chat-meta">与 {currentUserName} 的会话</div>
            </div>
          </Space>
        </div>
        <div className="chat-messages">
          <List
            dataSource={conv?.messages || []}
            loading={loading}
            locale={{ emptyText: null }}
            renderItem={(msg) => (
              <List.Item key={msg.id || msg.time} className={`msg-item ${msg.from === currentUserId ? 'mine' : 'other'}`}>
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
            />
            <Button
              className="send-btn-inbox"
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              disabled={!input.trim()}
            >
              发送
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MessageChat;