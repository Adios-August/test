import React, { useState, useEffect } from 'react';
import { Layout, Menu, Spin, message } from 'antd';
import { homeAPI } from '../../api';

import './HomeSidebar.scss';

const { Sider } = Layout;
const { SubMenu } = Menu;

const HomeSidebar = () => {
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
        setCategoryTree(response.data || []);
        // 默认展开第一级分类
        const firstLevelKeys = response.data?.map(item => item.id.toString()) || [];
        setOpenKeys(firstLevelKeys);
      } else {
        message.error(response.message || '获取分类树失败');
      }
    } catch (error) {
      console.error('获取分类树失败:', error);
      message.error('获取分类树失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 静态测试数据 - 8层嵌套树
  const staticCategoryTree = [
    {
      id: 1,
      name: "企业技术文档管理系统",
      children: [
        {
          id: 11,
          name: "前端开发技术栈与最佳实践",
          children: [
            {
              id: 111,
              name: "JavaScript高级编程与ES6+新特性",
              children: [
                {
                  id: 1111,
                  name: "ES6+语法糖与现代化编程模式",
                  children: [
                    {
                      id: 11111,
                      name: "箭头函数语法详解与使用场景分析",
                      children: [
                        {
                          id: 111111,
                          name: "箭头函数语法规则与注意事项详解",
                          children: [
                            {
                              id: 1111111,
                              name: "箭头函数参数处理机制与最佳实践",
                              children: [
                                {
                                  id: 11111111,
                                  name: "箭头函数默认参数设置与参数验证"
                                },
                                {
                                  id: 11111112,
                                  name: "箭头函数剩余参数与扩展运算符使用技巧"
                                }
                              ]
                            },
                            {
                              id: 1111112,
                              name: "箭头函数返回值处理与隐式返回机制"
                            }
                          ]
                        },
                        {
                          id: 111112,
                          name: "箭头函数在实际项目中的使用场景与案例分析"
                        }
                      ]
                    },
                    {
                      id: 11112,
                      name: "解构赋值语法详解与对象数组解构技巧"
                    }
                  ]
                },
                {
                  id: 1112,
                  name: "DOM操作与事件处理机制详解"
                }
              ]
            },
            {
              id: 112,
              name: "React框架开发与组件化架构设计",
              children: [
                {
                  id: 1121,
                  name: "React Hooks状态管理与副作用处理",
                  children: [
                    {
                      id: 11211,
                      name: "useState状态管理机制与性能优化",
                      children: [
                        {
                          id: 112111,
                          name: "React状态管理架构设计与最佳实践",
                          children: [
                            {
                              id: 1121111,
                              name: "useState基本用法与状态更新机制详解",
                              children: [
                                {
                                  id: 11211111,
                                  name: "React计数器组件开发与状态管理示例"
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 12,
          name: "后端开发架构设计与API开发",
          children: [
            {
              id: 121,
              name: "Node.js服务器端开发与性能优化",
              children: [
                {
                  id: 1211,
                  name: "Express框架路由配置与中间件开发",
                  children: [
                    {
                      id: 12111,
                      name: "Express路由配置与API接口设计规范",
                      children: [
                        {
                          id: 121111,
                          name: "Express中间件开发与请求处理流程",
                          children: [
                            {
                              id: 1211111,
                              name: "用户认证中间件开发与安全机制实现",
                              children: [
                                {
                                  id: 12111111,
                                  name: "JWT令牌验证与用户身份认证机制"
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 2,
      name: "产品设计规范与用户体验设计",
      children: [
        {
          id: 21,
          name: "UI设计系统与组件库开发",
          children: [
            {
              id: 211,
              name: "企业级设计系统架构与组件规范",
              children: [
                {
                  id: 2111,
                  name: "可复用组件库开发与维护管理",
                  children: [
                    {
                      id: 21111,
                      name: "按钮组件设计与交互状态管理",
                      children: [
                        {
                          id: 211111,
                          name: "按钮样式变体与主题定制系统",
                          children: [
                            {
                              id: 2111111,
                              name: "颜色主题系统与品牌色彩管理",
                              children: [
                                {
                                  id: 21111111,
                                  name: "主色调配置与色彩搭配规范"
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ];

  // 组件挂载时获取分类树
  useEffect(() => {
    // 暂时注释掉API调用，使用静态数据
    // fetchCategoryTree();
    
    // 使用静态数据
    setCategoryTree(staticCategoryTree);
    // 默认展开第一级分类
    const firstLevelKeys = staticCategoryTree.map(item => item.id.toString());
    setOpenKeys(firstLevelKeys);
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
    >
      <div className="sidebar-content">
        <div className="sidebar-title">全部分类</div>

        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
            <p>加载中...</p>
          </div>
        ) : (
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
        )}
      </div>
    </Sider>
  );
};

export default HomeSidebar; 