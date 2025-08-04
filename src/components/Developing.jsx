import React from 'react';
import { Result, Button } from 'antd';
import { ToolOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const Developing = ({ title = "功能开发中" }) => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100%',
      minHeight: '400px'
    }}>
      <Result
        icon={<ToolOutlined style={{ color: '#1890ff' }} />}
        title={title}
        subTitle="该功能正在开发中，敬请期待..."
        extra={[
          <Button 
            type="primary" 
            key="home"
            onClick={() => navigate('/')}
          >
            返回首页
          </Button>
        ]}
      />
    </div>
  );
};

export default Developing; 