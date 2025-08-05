import React, { useState } from 'react';
import { Layout, Menu } from 'antd';

import './HomeSidebar.scss';

const { Sider } = Layout;
const { SubMenu } = Menu;

const HomeSidebar = () => {
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [openKeys, setOpenKeys] = useState(["iws", "product-solution"]);

  const menuItems = [
    {
      key: "iws",
      label: "IWS",
      children: [
        {
          key: "product-solution",
          label: "Product Solution",
          children: [
            { key: "fund", label: "Fund" },
            { key: "wmp", label: "WMP" },
            { key: "alts", label: "ALTs" },
            { key: "fx-dci-eyi", label: "FX/DCI/EYI" },
            { key: "family-trust", label: "Family Trust" },
            { key: "product-info", label: "Product Information" },
            { key: "sales-process", label: "Sales Process and Platforms" },
            { key: "insurance", label: "Insurance" },
          ],
        },
        { key: "wealth-insight", label: "Wealth Insight" },
        { key: "distribution", label: "Distribution" },
        { key: "proposition", label: "Proposition" },
      ],
    },
  ];

  const handleMenuSelect = ({ key, keyPath }) => {
    console.log("选择菜单项:", key, keyPath);
    setSelectedKeys([key]);
  };

  const handleMenuOpenChange = (keys) => {
    console.log('展开/折叠状态变化:', keys);
    setOpenKeys(keys);
  };

  return (
    <Sider
      className="home-sidebar"
      width={300}
    >
      <div className="sidebar-content">
        <div className="sidebar-title">全部分类</div>

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
                  {item.children.map((subItem) => {
                    if (subItem.children) {
                      return (
                        <SubMenu key={subItem.key} title={subItem.label}>
                          {subItem.children.map((subSubItem) => (
                            <Menu.Item key={subSubItem.key}>
                              {subSubItem.label}
                            </Menu.Item>
                          ))}
                        </SubMenu>
                      );
                    } else {
                      return (
                        <Menu.Item key={subItem.key}>
                          {subItem.label}
                        </Menu.Item>
                      );
                    }
                  })}
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
  );
};

export default HomeSidebar; 