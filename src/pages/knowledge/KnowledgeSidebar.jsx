import React, { useState } from 'react';
import { Layout, Tree, Button } from 'antd';
import {
  StarOutlined,
  ShopOutlined,
  FileOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import './KnowledgeSidebar.scss';

const { Sider } = Layout;

const KnowledgeSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState([
    "product-info", 
    "deposit", 
    "loan-services", 
    "investment-products", 
    "digital-banking"
  ]);

  const treeData = [
    {
      title: "IWS",
      key: "iws",
      icon: <StarOutlined style={{ color: "#faad14" }} />,
    },
    {
      title: "Product Information",
      key: "product-info",
      children: [
        { title: "Fund", key: "fund", icon: <FileOutlined /> },
        { title: "Investment", key: "investment", icon: <FileOutlined /> },
        { title: "Insurance", key: "insurance", icon: <FileOutlined /> },
        { title: "Credit", key: "credit", icon: <FileOutlined /> },
      ],
    },
    {
      title: "Retail Banking",
      key: "retail-banking",
      icon: <ShopOutlined style={{ color: "#1890ff" }} />,
    },
    {
      title: "Deposit",
      key: "deposit",
      children: [
        { title: "7月存款礼包", key: "deposit-july", icon: <FileOutlined /> },
        { title: "定期存款", key: "fixed-deposit", icon: <FileOutlined /> },
        { title: "活期存款", key: "current-deposit", icon: <FileOutlined /> },
        { title: "通知存款", key: "notice-deposit", icon: <FileOutlined /> },
      ],
    },
    {
      title: "Loan Services",
      key: "loan-services",
      children: [
        { title: "个人贷款", key: "personal-loan", icon: <FileOutlined /> },
        { title: "房贷", key: "mortgage", icon: <FileOutlined /> },
        { title: "车贷", key: "car-loan", icon: <FileOutlined /> },
        { title: "企业贷款", key: "business-loan", icon: <FileOutlined /> },
      ],
    },
    {
      title: "Investment Products",
      key: "investment-products",
      children: [
        { title: "基金产品", key: "funds", icon: <FileOutlined /> },
        { title: "理财产品", key: "wealth-management", icon: <FileOutlined /> },
        { title: "股票投资", key: "stock-investment", icon: <FileOutlined /> },
        { title: "债券投资", key: "bond-investment", icon: <FileOutlined /> },
      ],
    },
    {
      title: "Digital Banking",
      key: "digital-banking",
      children: [
        { title: "移动银行", key: "mobile-banking", icon: <FileOutlined /> },
        { title: "网上银行", key: "online-banking", icon: <FileOutlined /> },
        { title: "电子支付", key: "e-payment", icon: <FileOutlined /> },
      ],
    },
  ];

  const handleTreeSelect = (selectedKeys, info) => {
    console.log("选择分类:", selectedKeys, info);
  };

  const handleTreeExpand = (expandedKeys) => {
    console.log('展开/折叠状态变化:', expandedKeys);
    setExpandedKeys(expandedKeys);
  };

  return (
    <Sider
      className="knowledge-sidebar"
      width={300}
      collapsed={collapsed}
      collapsible
      trigger={null}
    >
      <div className="sidebar-toggle">
        <Button
          type="text"
          icon={collapsed ? <RightOutlined /> : <LeftOutlined />}
          onClick={() => setCollapsed(!collapsed)}
        />
      </div>

      <div className="sidebar-content">
        <Tree
          className="category-tree"
          treeData={treeData}
          expandedKeys={expandedKeys}
          onExpand={handleTreeExpand}
          onSelect={handleTreeSelect}
          showIcon
          blockNode
        />
      </div>
    </Sider>
  );
};

export default KnowledgeSidebar; 