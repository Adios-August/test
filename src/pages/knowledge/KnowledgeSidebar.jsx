import React, { useState } from 'react';
import { Layout, Menu, Button } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import './KnowledgeSidebar.scss';

const { Sider } = Layout;
const { SubMenu } = Menu;

const KnowledgeSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [openKeys, setOpenKeys] = useState([
    "product-info", 
    "deposit", 
    "loan-services", 
    "investment-products", 
    "digital-banking"
  ]);

  const menuItems = [
    {
      key: "iws",
      label: "IWS",
    },
    {
      key: "product-info",
      label: "Product Information",
      children: [
        { key: "fund", label: "Fund" },
        { key: "investment", label: "Investment" },
        { key: "insurance", label: "Insurance" },
        { key: "credit", label: "Credit" },
      ],
    },
    {
      key: "retail-banking",
      label: "Retail Banking",
    },
    {
      key: "deposit",
      label: "Deposit",
      children: [
        { key: "deposit-july", label: "7月存款礼包" },
        { key: "fixed-deposit", label: "定期存款" },
        { key: "current-deposit", label: "活期存款" },
        { key: "notice-deposit", label: "通知存款" },
      ],
    },
    {
      key: "loan-services",
      label: "Loan Services",
      children: [
        { key: "personal-loan", label: "个人贷款" },
        { key: "mortgage", label: "房贷" },
        { key: "car-loan", label: "车贷" },
        { key: "business-loan", label: "企业贷款" },
      ],
    },
    {
      key: "investment-products",
      label: "Investment Products",
      children: [
        { key: "funds", label: "基金产品" },
        { key: "wealth-management", label: "理财产品" },
        { key: "stock-investment", label: "股票投资" },
        { key: "bond-investment", label: "债券投资" },
      ],
    },
    {
      key: "digital-banking",
      label: "Digital Banking",
      children: [
        { key: "mobile-banking", label: "移动银行" },
        { key: "online-banking", label: "网上银行" },
        { key: "e-payment", label: "电子支付" },
      ],
    },
  ];

  const handleMenuSelect = ({ key, keyPath }) => {

    setSelectedKeys([key]);
  };

  const handleMenuOpenChange = (keys) => {

    setOpenKeys(keys);
  };

  return (
   <div className="knowledge-sidebar-container">
     <Sider
      className="knowledge-sidebar"
      width={300}
      collapsed={collapsed}
      collapsible
      trigger={null}
    >
   

      <div className="sidebar-content">
        <Menu
          className="category-tree"
          mode="inline"
          openKeys={openKeys}
          selectedKeys={selectedKeys}
          onOpenChange={handleMenuOpenChange}
          onSelect={handleMenuSelect}
          style={{ borderRight: 'none' }}
        >
          {menuItems.map((item) => {
            if (item.children) {
              return (
                <SubMenu key={item.key} title={item.label}>
                  {item.children.map((subItem) => (
                    <Menu.Item key={subItem.key}>
                      {subItem.label}
                    </Menu.Item>
                  ))}
                </SubMenu>
              );
            } else {
              return (
                <Menu.Item key={item.key}>
                  {item.label}
                </Menu.Item>
              );
            }
          })}
        </Menu>
      </div>
    </Sider>
    <div className="sidebar-toggle">
        <Button
          type="text"
          icon={collapsed ? <RightOutlined /> : <LeftOutlined />}
          onClick={() => setCollapsed(!collapsed)}
        />
        {collapsed && <div className="filter-text">Filter</div>}
      </div>   
   </div>
  );
};

export default KnowledgeSidebar; 