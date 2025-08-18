import React, { useState, useEffect } from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UserOutlined,
  FolderOutlined,
  SearchOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import './ManagementSidebar.scss';

const { Sider } = Layout;

const ManagementSidebar = ({ 
  width = 250,
  height = "calc(100vh - 152px)",
  marginTop = "0px"
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedKeys, setSelectedKeys] = useState(['role-management']);

  // 管理菜单项
  const menuItems = [
    {
      key: 'role-management',
      icon: <UserOutlined />,
      label: '角色管理',
    },
    {
      key: 'category-management',
      icon: <FolderOutlined />,
      label: '栏目管理',
    },
    {
      key: 'queries',
      icon: <SearchOutlined />,
      label: 'Queries',
    },
    {
      key: 'feedback',
      icon: <MessageOutlined />,
      label: 'Feedback',
    },
  ];

  // 根据当前路径设置选中状态
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/role-management')) {
      setSelectedKeys(['role-management']);
    } else if (path.includes('/category-management')) {
      setSelectedKeys(['category-management']);
    } else if (path.includes('/queries')) {
      setSelectedKeys(['queries']);
    } else if (path.includes('/feedback')) {
      setSelectedKeys(['feedback']);
    } else {
      setSelectedKeys(['role-management']);
    }
  }, [location.pathname]);

  const handleMenuClick = ({ key }) => {
    setSelectedKeys([key]);
    navigate(`/knowledge-admin/${key}`);
  };

  return (
    <Sider
      className="management-sidebar"
      width={width}
      style={{
        height: height,
        marginTop: marginTop,
      }}
    >
      <div className="sidebar-content">
        <div className="management-menu">
          <Menu
            mode="inline"
            selectedKeys={selectedKeys}
            items={menuItems}
            onClick={handleMenuClick}
            className="management-menu"
          />
        </div>
      </div>
    </Sider>
  );
};

export default ManagementSidebar; 