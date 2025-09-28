import React, { useState, useMemo, useEffect } from "react";
import { Layout, Menu, Button, Avatar, Space, Dropdown, message, Tooltip, Spin } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { UserOutlined, MessageOutlined, StarOutlined, LogoutOutlined, SettingOutlined } from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import { useAuthStore } from "../stores";
import rootStore from "../stores/rootStore";
import "./Layout.scss";

const { Header, Content } = Layout;
import Logo from "../assets/image/logo.png";

const headerMenuItems = [
  { key: "/", label: "首页" },
  { key: "/knowledge", label: "知识库" },
  { key: "/knowledge-admin", label: "知识库管理" },
  // { key: "/stats", label: "数据统计" }, // 暂时隐藏数据统计模块
];

const LayoutComponent = observer(() => {
  const [headerSelectedKey, setHeaderSelectedKey] = useState("/");
  const navigate = useNavigate();
  const location = useLocation();
  const authStore = useAuthStore();

  // 根据当前路径同步header选中状态
  useEffect(() => {
    const pathname = location.pathname;
    
    // 特殊处理知识库管理页面的子路由
    if (pathname.startsWith('/knowledge-admin')) {
      setHeaderSelectedKey('/knowledge-admin');
    } else {
      setHeaderSelectedKey(pathname);
    }
  }, [location.pathname]);

  const handleHeaderMenuClick = ({ key }) => {
    setHeaderSelectedKey(key);
    navigate(key);
  };

  // 处理用户退出
  const handleLogout = () => {
    authStore.logout();
    message.success('已成功退出登录');
    navigate('/login');
  };

  // 用户菜单项
  const userMenuItems = [
  
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className="layout-container">
      {/* 全局加载指示器 */}
      {rootStore.appLoading && (
        <div className="global-loading-mask">
          <Spin size="large" tip="正在加载数据..." />
        </div>
      )}

      <Header className="header">
        <div className="header-content">
          <div className="header-title">
            <img src={Logo} alt="Logo" className="header-logo" />
            <div className="logo">SMART SEARCH</div>
          </div>
          <div className="header-menu">
            <Menu
              mode="horizontal"
              selectedKeys={[headerSelectedKey]}
              items={headerMenuItems}
              onClick={handleHeaderMenuClick}
              theme="dark"
            />
          </div>
          <div className="header-user">
            <Space>
              <Tooltip title="收藏夹" placement="bottom">
                <Button 
                  type="text" 
                  icon={<StarOutlined />} 
                  onClick={() => navigate('/favorites')}
                />
              </Tooltip>
              <Dropdown
                menu={{
                  items: authStore.user?.workspace?.split(',').map(w => ({
                    key: w,
                    label: w,
                    onClick: () => {
                          // 设置当前工作区
                          authStore.setCurrentWorkspace(w);
                          message.success(`已切换到工作区：${w}`);
                        }
                  })) || []
                }}
                placement="bottomRight"
                trigger={['click']}
              >
                <div className="wpd-button" style={{ cursor: 'pointer' }}>
                  {authStore.currentWorkspace || authStore.user?.workspace?.split(',')[0] || '未设置workspace'}
                </div>
              </Dropdown>
               <span className="wpd-button">{authStore.user?.displayName ||   ''}</span>
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                trigger={['click']}
              >
                <Space className="user-info" style={{ cursor: 'pointer' }}>
                  <Avatar icon={<UserOutlined />} />
                 
                </Space>
              </Dropdown>
            </Space>
          </div>
        </div>
      </Header>

      <Layout className="main-layout">
        <Layout className="content-layout">
          <Content className="content">
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
});

export default LayoutComponent;
