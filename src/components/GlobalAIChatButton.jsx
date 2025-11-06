import React from 'react';
import { FloatButton, Tooltip } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

// 全局右下角 AI Chat 按钮
const GlobalAIChatButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 在聊天页面自身不显示按钮
  const isOnChatPage = location.pathname.startsWith('/knowledge-qa');
  if (isOnChatPage) return null;

  return (
    <Tooltip title="AI Chat">
      <FloatButton
        type="primary"
        icon={<RobotOutlined />}
        description="AI Chat"
        onClick={() => navigate('/knowledge-qa')}
        style={{ right: 24, bottom: 24, zIndex: 1000 }}
      />
    </Tooltip>
  );
};

export default GlobalAIChatButton;