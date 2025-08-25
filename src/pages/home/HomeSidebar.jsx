import React, { useState, useEffect } from 'react';
import { Layout, Menu, Spin, message, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { homeAPI } from '../../api/home';

import './HomeSidebar.scss';

const { Sider } = Layout;
const { SubMenu } = Menu;

const HomeSidebar = () => {
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [openKeys, setOpenKeys] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(false);

  // 获取知识树数据（根层）
  const fetchCategoryTree = async () => {
    setLoading(true);
    try {
      const response = await homeAPI.getKnowledgeFullTree();
      if (response.code === 200) {
        const records = response.data || [];
        const mapTree = (nodes) => (nodes || []).map(n => ({
          id: n.id,
          name: n.name,
          children: mapTree(n.children)
        }));
        const data = mapTree(records);
        setCategoryTree(data);
        // 默认展开第一级
        const firstLevelKeys = data.map(item => item.id?.toString()).filter(Boolean);
        setOpenKeys(firstLevelKeys);
      } else {
        message.error(response.message || '获取知识树失败');
        // 如果API失败，设置空数组避免显示错误
        setCategoryTree([]);
      }
    } catch (error) {
      console.error('获取知识树失败:', error);
      message.error('获取知识树失败，请稍后重试');
      // 如果API失败，设置空数组避免显示错误
      setCategoryTree([]);
    } finally {
      setLoading(false);
    }
  };



  // 组件挂载时获取分类树
  useEffect(() => {
    fetchCategoryTree();
  }, []);

  // 将API数据转换为菜单项格式（仅展示名称）
  const convertToMenuItems = (categories) => {
    return categories.map(category => ({
      key: category.id.toString(),
      label: category.name,
      children: category.children && category.children.length > 0 
        ? convertToMenuItems(category.children) 
        : undefined
    }));
  };

  const menuItems = convertToMenuItems(categoryTree);

  const handleMenuSelect = ({ key, keyPath }) => {

    setSelectedKeys([key]);
  };

  const handleMenuOpenChange = (keys) => {

    setOpenKeys(keys);
  };

  return (
    <Sider
      className="home-sidebar"
       width={300}
    >
      <div className="sidebar-content">
        <div className="sidebar-title">全部知识</div>

        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
            <p>加载中...</p>
          </div>
        ) : categoryTree.length > 0 ? (
          <Menu
            className="category-tree"
            mode="inline"
            openKeys={openKeys}
            selectedKeys={selectedKeys}
            onOpenChange={handleMenuOpenChange}
            onSelect={handleMenuSelect}
            style={{ borderRight: 'none' }}
            items={menuItems}
          />
        ) : (
          <div className="empty-container">
            <p>暂无知识节点</p>
            <Button 
              type="link" 
              icon={<ReloadOutlined />} 
              onClick={fetchCategoryTree}
              style={{ marginTop: 8 }}
            >
              重新加载
            </Button>
          </div>
        )}
      </div>
    </Sider>
  );
};

export default HomeSidebar; 