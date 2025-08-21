import React, { useState, useEffect } from 'react';
import { Layout, Menu, Spin, message, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { homeAPI } from '../../api/home';
import './KnowledgeManagement.scss';

const { Sider, Content } = Layout;
const { SubMenu } = Menu;

const AddKnowledge = () => {
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [openKeys, setOpenKeys] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(false);

  // 获取分类树数据
  const fetchCategoryTree = async () => {
    setLoading(true);
    try {
      const response = await homeAPI.getCategoryTree();
      if (response.code === 200) {
        const data = response.data || [];
        setCategoryTree(data);
        // 默认展开第一级分类
        const firstLevelKeys = data.map(item => item.id.toString());
        setOpenKeys(firstLevelKeys);
      } else {
        message.error(response.message || '获取分类树失败');
        setCategoryTree([]);
      }
    } catch (error) {
      console.error('获取分类树失败:', error);
      message.error('获取分类树失败，请稍后重试');
      setCategoryTree([]);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取分类树
  useEffect(() => {
    fetchCategoryTree();
  }, []);

  // 将API数据转换为菜单项格式
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
    <Layout className="knowledge-management-layout">
      {/* 左侧边栏 */}
      <Sider
        className="knowledge-sidebar"
        width={300}
        theme="light"
      >
        <div className="sidebar-content">
          <div className="sidebar-title">新增知识存放目录</div>

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
              <p>暂无分类数据</p>
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

      {/* 右侧主内容区 */}
      <Content className="knowledge-content">
       富文本区域
      </Content>
    </Layout>
  );
};

export default AddKnowledge; 