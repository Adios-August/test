import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import ManagementSidebar from '../../components/ManagementSidebar';
import './KnowledgeManagement.scss';

const { Content } = Layout;

const KnowledgeManagement = () => {
  return (
    <Layout className="knowledge-management-layout">
      <ManagementSidebar marginTop="24px" />
      <Content className="knowledge-management-content">
        <Outlet />
      </Content>
    </Layout>
  );
};

export default KnowledgeManagement; 