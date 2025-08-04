import React, { useState } from 'react';
import { Layout, Tree } from 'antd';
import {
  StarOutlined,
  ShopOutlined,
  FileOutlined,
  DollarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import './HomeSidebar.scss';

const { Sider } = Layout;

const HomeSidebar = () => {
  const [expandedKeys, setExpandedKeys] = useState(["iws", "product-solution"]);

  const treeData = [
    {
      title: "IWS",
      key: "iws",
      icon: <StarOutlined style={{ color: "#faad14" }} />,
      children: [
        {
          title: "Product Solution",
          key: "product-solution",
          icon: <ShopOutlined style={{ color: "#52c41a" }} />,
          children: [
            { title: "Fund", key: "fund", icon: <FileOutlined /> },
            { title: "WMP", key: "wmp", icon: <FileOutlined /> },
            { title: "ALTs", key: "alts", icon: <FileOutlined /> },
            { title: "FX/DCI/EYI", key: "fx-dci-eyi", icon: <FileOutlined /> },
            { title: "Family Trust", key: "family-trust", icon: <FileOutlined /> },
            { title: "Product Information", key: "product-info", icon: <FileOutlined /> },
            { title: "Sales Process and Platforms", key: "sales-process", icon: <FileOutlined /> },
            { title: "Insurance", key: "insurance", icon: <FileOutlined /> },
          ],
        },
        { title: "Wealth Insight", key: "wealth-insight", icon: <DollarOutlined style={{ color: "#1890ff" }} /> },
        { title: "Distribution", key: "distribution", icon: <ShopOutlined style={{ color: "#1890ff" }} /> },
        { title: "Proposition", key: "proposition", icon: <UserOutlined style={{ color: "#52c41a" }} /> },
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
      className="home-sidebar"
      width={300}
    >
      <div className="sidebar-content">
        <div className="sidebar-title">全部分类</div>

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

export default HomeSidebar; 