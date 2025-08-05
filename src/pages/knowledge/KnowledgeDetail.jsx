import React, { useState } from 'react';
import { Layout, Tabs, Button, Avatar, Tag, Space, List, Card, Menu, Input } from 'antd';
import {
  HeartOutlined, HistoryOutlined, TranslationOutlined, FilePdfOutlined, FileExcelOutlined,
  CloseOutlined, ArrowLeftOutlined, LeftOutlined, RightOutlined, SearchOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import './KnowledgeDetail.scss';

const { Sider, Content } = Layout;
const { TabPane } = Tabs;
const { SubMenu } = Menu;

const KnowledgeDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('1');
  const [collapsed, setCollapsed] = useState(false);
  const [searchCollapsed, setSearchCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [openKeys, setOpenKeys] = useState(['iws', 'deposit', 'loan-services', 'investment-products', 'digital-banking']);
  const [searchValue, setSearchValue] = useState('');
  const [activeTabKey, setActiveTabKey] = useState('1');

  // 菜单数据
  const menuItems = [
    {
      key: 'iws',
      label: 'IWS',
      children: [
        {
          key: 'product-solution',
          label: 'Product Solution',
          children: [
            { key: 'fund', label: 'Fund' },
            { key: 'investment', label: 'Investment' },
            { key: 'insurance', label: 'Insurance' },
            { key: 'credit', label: 'Credit' },
            { key: 'retail-banking', label: 'Retail Banking' },
          ],
        },
      ],
    },
    {
      key: 'deposit',
      label: 'Deposit',
      children: [
        { key: 'deposit-july', label: '7月存款礼包' },
        { key: 'fixed-deposit', label: '定期存款' },
        { key: 'current-deposit', label: '活期存款' },
        { key: 'notice-deposit', label: '通知存款' },
      ],
    },
    {
      key: 'loan-services',
      label: 'Loan Services',
      children: [
        { key: 'personal-loan', label: '个人贷款' },
        { key: 'mortgage', label: '房贷' },
        { key: 'car-loan', label: '车贷' },
        { key: 'business-loan', label: '企业贷款' },
      ],
    },
    {
      key: 'investment-products',
      label: 'Investment Products',
      children: [
        { key: 'funds', label: '基金产品' },
        { key: 'wealth-management', label: '理财产品' },
        { key: 'stock-investment', label: '股票投资' },
        { key: 'bond-investment', label: '债券投资' },
      ],
    },
    {
      key: 'digital-banking',
      label: 'Digital Banking',
      children: [
        { key: 'mobile-banking', label: '移动银行' },
        { key: 'online-banking', label: '网上银行' },
        { key: 'e-payment', label: '电子支付' },
      ],
    },
  ];

  // 模拟文档数据
  const documentData = {
    id: id,
    title: 'IWS产品方案',
    author: 'Felicity He',
    date: '2025-07-05 12:00',
    tags: ['QDII', 'QDUT'],
    summary: '这是一个关于IWS产品方案的详细文档...',
    attachments: [
      { name: 'QDII_top_AUM_fund.PDF', type: 'pdf', icon: <FilePdfOutlined /> },
      { name: 'QDUT每日价格.xlsx', type: 'excel', icon: <FileExcelOutlined /> },
    ],
    effectiveDate: '2025-07-01~2025-07-31',
  };

  // 初始化标签页
  const [tabs, setTabs] = useState([
    {
      key: '1',
      label: 'IWS产品方案',
      closable: true,
      content: documentData
    }
  ]);

  // 搜索列表数据
  const searchResults = [
    {
      id: 1,
      title: "IWS产品方案",
      date: "2025-07-04",
      description: "时近7月,年中之际。紧跟最新7月CIO观点及近期市场走势,特附7月产品方案....",
      type: "pdf",
    },
    {
      id: 2,
      title: "外币精选方案",
      date: "2025-07-25",
      description: "首段内容",
      type: "pdf",
    },
    {
      id: 3,
      title: "财富来源回顾培训",
      date: "2025-07-08",
      description: "最新培训材料，包含产品知识和销售技巧。",
      type: "pdf",
    },
  ];

  const handleBack = () => {
    navigate('/knowledge');
  };

  const handleTabClose = (targetKey) => {
    // 处理标签页关闭逻辑
    console.log('关闭标签页:', targetKey);
  };

  const handleMenuSelect = ({ key, keyPath }) => {
    console.log("选择菜单项:", key, keyPath);
    setSelectedKeys([key]);
  };

  const handleMenuOpenChange = (keys) => {
    console.log('展开/折叠状态变化:', keys);
    setOpenKeys(keys);
  };

  const handleSearch = () => {
    console.log('搜索内容:', searchValue);
    // 这里可以添加实际的搜索逻辑
    // 比如调用API、过滤数据等
  };

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleTabChange = (activeKey) => {
    setActiveTabKey(activeKey);
  };

  const handleTabEdit = (targetKey, action) => {
    if (action === 'remove') {
      // 确保至少保留一个标签页
      if (tabs.length <= 1) {
        return;
      }
      
      const newTabs = tabs.filter(tab => tab.key !== targetKey);
      setTabs(newTabs);
      
      // 如果关闭的是当前激活的标签页，切换到第一个标签页
      if (targetKey === activeTabKey && newTabs.length > 0) {
        setActiveTabKey(newTabs[0].key);
      }
    }
  };

  const addTabFromSearch = (searchItem) => {
    // 检查是否已经存在相同的标签页
    const existingTab = tabs.find(tab => tab.key === `search-${searchItem.id}`);
    if (existingTab) {
      // 如果已存在，直接切换到该标签页
      setActiveTabKey(existingTab.key);
      return;
    }

    // 创建新的文档数据
    const newDocumentData = {
      id: searchItem.id,
      title: searchItem.title,
      author: 'System User',
      date: searchItem.date,
      tags: ['搜索结果'],
      summary: searchItem.description,
      attachments: [
        { name: `${searchItem.title}.PDF`, type: 'pdf', icon: <FilePdfOutlined /> },
      ],
      effectiveDate: '2025-07-01~2025-07-31',
    };

    // 添加新标签页
    const newKey = `search-${searchItem.id}`;
    const newTab = {
      key: newKey,
      label: searchItem.title,
      closable: true,
      content: newDocumentData
    };
    
    setTabs([...tabs, newTab]);
    setActiveTabKey(newKey);
  };

  return (
    <Layout className="knowledge-detail-layout">
      <Layout className="knowledge-main-layout">
        {/* 左侧侧边栏 */}
        <div className="detail-sidebar-container">
          <Sider className="detail-sidebar" width={300} collapsed={collapsed} collapsible trigger={null}>
            <div className="sidebar-content">
              <div className="sidebar-title">
                <Button 
                  type="link" 
                  icon={<ArrowLeftOutlined />} 
                  onClick={handleBack}
                  className={collapsed ? 'collapsed' : ''}
                >
                  {!collapsed && '返回搜索'}
                </Button>
              </div>

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
          <div className="sidebar-toggle">
            <Button
              type="text"
              icon={collapsed ? <RightOutlined /> : <LeftOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
          </div>
        </div>

        {/* 中间搜索栏 */}
        <div className='search-section-container'>
             <div className={`search-section ${searchCollapsed ? 'collapsed' : ''}`}>
          <div className="search-container">
            <div className="search-input">
              <Input
                placeholder="7月产品推荐"
                prefix={<SearchOutlined />}
                value={searchValue}
                onChange={handleSearchChange}
                onKeyPress={handleSearchKeyPress}
                suffix={
                  <Button
                    type="text"
                    size="small"
                    onClick={handleSearch}
                    style={{
                      fontSize: "16px",
                      color: "var(--ant-primary-color)",
                      border: "none",
                      padding: "0 8px",
                      height: "auto",
                    }}
                  >
                    搜索
                  </Button>
                }
                style={{
                  fontSize: "16px",
                  height: "48px",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                }}
              />
            </div>
          </div>
          
          {/* 排序选项 */}
          <div className="sort-options">
            <Button type="text" size="small">更新时间 ↓</Button>
            <Button type="text" size="small">点赞量 ↓</Button>
            <Button type="text" size="small">收藏量 ↓</Button>
            <Button type="text" size="small">浏览量 ↓</Button>
          </div>

          {/* 搜索结果列表 */}
          <div className="search-results">
            {searchResults.map((item) => (
              <div key={item.id} className="result-item" onClick={() => addTabFromSearch(item)}>
                <div className="result-header">
                  <span className="result-title">{item.title}</span>
                  <span className="result-date">{item.date}</span>
                  <div className="result-actions">
                    <Button type="text" size="small" icon={<FilePdfOutlined />} onClick={(e) => { e.stopPropagation(); addTabFromSearch(item); }} />
                    <Button type="text" size="small" icon={<ArrowLeftOutlined />} onClick={(e) => e.stopPropagation()} />
                  </div>
                </div>
                <div className="result-description">{item.description}</div>
              </div>
            ))}
            
            {/* 无结果提示 */}
            <div className="no-results">
              <div className="info-icon">ℹ</div>
              <span>未找到结果! 请更换搜索词,重新尝试!</span>
            </div>
          </div>

         
        </div>

         {/* 搜索区域折叠按钮 */}
         <div className="search-toggle">
            <Button
              type="text"
              icon={searchCollapsed ? <RightOutlined /> : <LeftOutlined />}
              onClick={() => setSearchCollapsed(!searchCollapsed)}
            />
          </div>
        </div>
       

        <Content className="detail-content">
          {/* 文档详情内容 */}
          <Tabs
            type="editable-card"
            activeKey={activeTabKey}
            onChange={handleTabChange}
            onEdit={handleTabEdit}
            className="detail-tabs"
            hideAdd={true}
          >
            {tabs.map(tab => (
              <Tabs.TabPane
                key={tab.key}
                tab={tab.label}
                closable={tab.closable}
              >
                <div className="document-detail">
                  {/* 文档头部信息 */}
                  <div className="document-header">
                    <div className="header-left">
                      <div className="author-info">
                        <Avatar size={32} src="https://via.placeholder.com/32" />
                        <span className="author-name">Created by {tab.content.author}</span>
                        <span className="date">{tab.content.date}</span>
                      </div>
                      <div className="tags">
                        {tab.content.tags.map((tag, index) => (
                          <Tag key={index} color="red">{tag}</Tag>
                        ))}
                      </div>
                    </div>
                    <div className="header-right">
                      <Button type="text" icon={<HeartOutlined />} />
                      <Button type="primary" icon={<HistoryOutlined />}>
                        History
                      </Button>
                      <Button type="primary" icon={<TranslationOutlined />}>
                        Translation
                      </Button>
                    </div>
                  </div>

                  {/* 文档内容 */}
                  <div className="document-content">
                    <div className="content-section">
                      <h3>摘要</h3>
                      <p>{tab.content.summary}</p>
                    </div>

                    <div className="content-section">
                      <h3>基本资料</h3>
                      <p>这里是基本资料的详细内容...</p>
                    </div>

                    <div className="content-section">
                      <h3>流程</h3>
                      <p>这里是流程的详细说明...</p>
                    </div>

                    <div className="content-section">
                      <h3>常见问题与答案</h3>
                      <p>这里是常见问题与答案的详细内容...</p>
                    </div>

                    <div className="content-section">
                      <h3>附件</h3>
                      <div className="attachment-list">
                        {tab.content.attachments.map((attachment, index) => (
                          <div key={index} className="attachment-item">
                            <span className="attachment-icon">{attachment.icon}</span>
                            <span className="attachment-name">{attachment.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="content-section">
                      <h3>生效时间</h3>
                      <p>{tab.content.effectiveDate}</p>
                    </div>
                  </div>

                  {/* 文档底部 */}
                  <div className="document-footer">
                    <span>2/M</span>
                  </div>
                </div>
              </Tabs.TabPane>
            ))}
          </Tabs>
        </Content>
      </Layout>
    </Layout>
  );
};

export default KnowledgeDetail; 