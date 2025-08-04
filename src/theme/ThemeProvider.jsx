import React from 'react';
import { ConfigProvider } from 'antd';
import theme from './index';

/**
 * 主题提供者组件
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件
 */
const ThemeProvider = ({ children }) => {
  // 应用主题到 Ant Design ConfigProvider
             const antdTheme = {
             token: {
               colorPrimary: '#db0011',
               colorPrimaryHover: '#ff1a1a',
               colorPrimaryActive: '#b30000',
               colorSuccess: '#52c41a',
               colorWarning: '#faad14',
               colorError: '#ff4d4f',
               colorInfo: '#db0011',
               borderRadius: 6,
               fontSize: 24, // 1.5rem = 24px (16px * 1.5)
               fontWeight: 500,
             },
                 components: {
               Button: {
                 borderRadius: 6,
                 controlHeight: 32,
                 fontSize: 24,
                 fontWeight: 500,
                 primaryColor: '#db0011',
               },
               Input: {
                 borderRadius: 6,
                 controlHeight: 32,
                 fontSize: 24,
                 fontWeight: 500,
               },
               Select: {
                 borderRadius: 6,
                 controlHeight: 32,
                 fontSize: 24,
                 fontWeight: 500,
               },
      Table: {
        borderRadius: 6,
        headerBg: '#fafafa',
      },
      Card: {
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    },
  };

  return (
    <ConfigProvider theme={antdTheme}>
      {children}
    </ConfigProvider>
  );
};

export default ThemeProvider; 