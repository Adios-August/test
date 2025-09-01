import React, { useState } from 'react';
import { Button, Dropdown, message } from 'antd';
import { MailOutlined } from '@ant-design/icons';

const FeedbackMailButton = ({ knowledgeDetail, style = {} }) => {
  const [loading, setLoading] = useState(false);

  // 处理邮件按钮点击
  const handleMailClick = (mailClient = 'default') => {
    if (!knowledgeDetail) {
      message.warning('没有可用的知识内容');
      return;
    }

    setLoading(true);
    
    try {
      const subject = encodeURIComponent(`反馈: ${knowledgeDetail?.title || '知识内容'}`);
      const body = encodeURIComponent(`您好，\n\n我想对以下知识内容提供反馈：\n\n标题：${knowledgeDetail?.title || '未知'}\n内容：${knowledgeDetail?.description || '未知'}\n\n我的反馈：\n\n谢谢！`);
      
      let mailtoLink;
      
      switch (mailClient) {
        case 'outlook':
          // 尝试直接打开Outlook应用
          mailtoLink = `mailto:?subject=${subject}&body=${body}`;
          break;
        case 'gmail':
          // 打开Gmail网页版
          const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=&su=${subject}&body=${body}`;
          window.open(gmailUrl, '_blank');
          return;
        case 'default':
        default:
          // 使用系统默认邮件客户端
          mailtoLink = `mailto:?subject=${subject}&body=${body}`;
          break;
      }
      
      if (mailtoLink) {
        window.open(mailtoLink);
      }
      
      message.success('正在打开邮件客户端...');
    } catch (error) {
      console.error('打开邮件客户端失败:', error);
      message.error('打开邮件客户端失败，请手动打开邮件应用');
    } finally {
      setLoading(false);
    }
  };

  // 邮件客户端选项
  const mailClientOptions = [
    {
      key: 'default',
      label: '系统默认邮件客户端',
      onClick: () => handleMailClick('default')
    },
    {
      key: 'outlook',
      label: 'Outlook',
      onClick: () => handleMailClick('outlook')
    },
    {
      key: 'gmail',
      label: 'Gmail网页版',
      onClick: () => handleMailClick('gmail')
    }
  ];

  return (
    <Dropdown
      menu={{ items: mailClientOptions }}
      placement="bottomRight"
      trigger={['click']}
    >
      <Button 
        type="text" 
        icon={<MailOutlined />} 
        loading={loading}
        title="点击选择邮件客户端发送反馈"
        style={style}
      />
    </Dropdown>
  );
};

export default FeedbackMailButton; 