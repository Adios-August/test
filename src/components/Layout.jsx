import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, Avatar, Space } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  UserOutlined,
  BellOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import "./Layout.scss";

const { Header, Content } = Layout;

const headerMenuItems = [
  { key: "/", label: "首页" },
  { key: "/knowledge", label: "知识库" },
  { key: "/knowledge-admin", label: "知识库管理" },
  { key: "/stats", label: "数据统计" },
];

const LayoutComponent = () => {
  const [headerSelectedKey, setHeaderSelectedKey] = useState("/");
  const navigate = useNavigate();
  const location = useLocation();

  // 根据当前路径同步header选中状态
  useEffect(() => {
    setHeaderSelectedKey(location.pathname);
  }, [location.pathname]);

  const handleHeaderMenuClick = ({ key }) => {
    setHeaderSelectedKey(key);
    navigate(key);
  };

  return (
    <Layout className="layout-container">
      <Header className="header">
        <div className="header-content">
          <div className="header-title">
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
              <Button type="text" icon={<SearchOutlined />} />
              <Button type="text" icon={<BellOutlined />} />
              <Space className="user-info">
                <span>站内信</span>
                <span>收藏夹</span>
                <span>WPB</span>
                <Avatar icon={<UserOutlined />} />
              </Space>
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
};

export default LayoutComponent;
