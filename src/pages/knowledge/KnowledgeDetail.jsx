import React, { useState, useEffect } from 'react';
import { Layout, Tabs, Button, Avatar, Space, List, Card, Input, message, Spin, Select } from 'antd';
import {
  HeartOutlined, HistoryOutlined, TranslationOutlined, FilePdfOutlined, FileExcelOutlined,
  CloseOutlined, ArrowLeftOutlined, LeftOutlined, RightOutlined, SearchOutlined, TagOutlined,
  SendOutlined, MailOutlined, ArrowRightOutlined, UserOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import CommonSidebar from '../../components/CommonSidebar';
import { knowledgeAPI } from '../../api/knowledge';
import { useKnowledgeStore } from '../../stores';
import './KnowledgeDetail.scss';

const { Content } = Layout;
const { TabPane } = Tabs;

const KnowledgeDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('category');
  const [activeTab, setActiveTab] = useState('1');
  const [searchCollapsed, setSearchCollapsed] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [activeTabKey, setActiveTabKey] = useState('1');
  
  // 知识详情数据状态
  const [knowledgeDetail, setKnowledgeDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // 获取knowledgeStore
  const knowledgeStore = useKnowledgeStore();

  // 获取知识详情
  const fetchKnowledgeDetail = async (knowledgeId) => {
    if (!knowledgeId) return;
    
    setLoading(true);
    try {
      const response = await knowledgeAPI.getKnowledgeDetail(knowledgeId);
      if (response.code === 200) {
        setKnowledgeDetail(response.data);
        
        // 如果有知识详情，自动创建第一个标签页
        if (response.data && tabs.length === 0) {
          const firstTab = {
            key: `knowledge-${knowledgeId}`,
            label: response.data.title || '知识详情',
            closable: true,
            content: response.data
          };
          setTabs([firstTab]);
          setActiveTabKey(`knowledge-${knowledgeId}`);
        }
      } else {
        message.error(response.message || '获取知识详情失败');
      }
    } catch (error) {
      console.error('获取知识详情失败:', error);
      message.error('获取知识详情失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取知识详情
  useEffect(() => {
    if (id) {
      fetchKnowledgeDetail(id);
    }
  }, [id]);

  // 模拟文档数据（作为备用）
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
  const [tabs, setTabs] = useState([]);

  // 从store中获取搜索列表数据
  const searchResults = knowledgeStore.knowledgeList.map(item => ({
    id: item.id,
    title: item.name || item.title || '无标题',
    date: item.createdTime || item.date || '未知日期',
    description: item.description || item.summary || '暂无描述',
    type: "pdf",
  }));
  
  console.log('searchResults:', searchResults);
  console.log('knowledgeStore.knowledgeList:', knowledgeStore.knowledgeList);

  const handleBack = () => {
    const categoryParam = categoryId ? `?category=${categoryId}` : '';
    navigate(`/knowledge${categoryParam}`);
  };

  const handleTabClose = (targetKey) => {
    // 处理标签页关闭逻辑
  };

  const handleSearch = () => {
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

  const handleSearchToggle = () => {
    setSearchCollapsed(!searchCollapsed);
  };

  const addTabFromSearch = async (searchItem) => {
    console.log('点击搜索结果项:', searchItem);
    
    // 检查是否已经存在相同的标签页
    const existingTab = tabs.find(tab => tab.key === `search-${searchItem.id}`);
    if (existingTab) {
      // 如果已存在，直接切换到该标签页
      setActiveTabKey(existingTab.key);
      return;
    }

    // 先创建一个临时的标签页，显示加载状态
    const newKey = `search-${searchItem.id}`;
    const tempTab = {
      key: newKey,
      label: searchItem.title,
      closable: true,
      content: {
        id: searchItem.id,
        title: searchItem.title,
        author: '加载中...',
        date: searchItem.date,
        tags: ['加载中'],
        summary: '正在获取详细信息...',
        attachments: [],
        effectiveDate: '加载中...',
      }
    };

    // 使用函数式更新确保获取最新的tabs状态
    setTabs(prevTabs => {
      console.log('添加临时标签页, 当前tabs数量:', prevTabs.length);
      if (prevTabs.length === 1 && prevTabs[0].key.startsWith('knowledge-')) {
        // 替换知识详情标签页
        return [tempTab];
      } else {
        // 添加新标签页
        return [...prevTabs, tempTab];
      }
    });
    setActiveTabKey(newKey);

    try {
      console.log('开始调用API获取知识详情, ID:', searchItem.id);
      // 调用API获取知识详情
      const response = await knowledgeAPI.getKnowledgeDetail(searchItem.id);
      console.log('API响应:', response);
      
      if (response.code === 200) {
        // 使用函数式更新确保获取最新的tabs状态
        setTabs(prevTabs => {
          console.log('更新标签页内容, 当前tabs数量:', prevTabs.length);
          return prevTabs.map(tab => {
            if (tab.key === newKey) {
              return {
                ...tab,
                content: response.data
              };
            }
            return tab;
          });
        });
      } else {
        message.error(response.message || '获取知识详情失败');
      }
    } catch (error) {
      console.error('获取知识详情失败:', error);
      message.error('获取知识详情失败，请稍后重试');
    }
  };

  return (
    <Layout className="knowledge-detail-layout">
      <Layout className="knowledge-main-layout">
        {/* 左侧侧边栏 */}
        <CommonSidebar 
          showBackButton={true}
          onBackClick={handleBack}
          height="calc(100vh - 134px)"
          marginTop="16px"
          enableNavigation={false}
          filterCategoryId={categoryId}
        />

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
            
            <div className="sort-options">
              <Button type="text">最新</Button>
              <Button type="text">最热</Button>
              <Button type="text">相关度</Button>
            </div>
            
            <div className="search-results">
              {searchResults.length > 0 ? (
                searchResults.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="result-item"
                    onClick={() => addTabFromSearch(item)}
                  >
                    <div className="result-header">
                      <div className="result-title">{item.title}</div>
                      <div className="result-date">{item.date}</div>
                    </div>
                    <div className="result-description">{item.description}</div>
                  </div>
                ))
              ) : (
                <div className="no-results">
                  <span className="info-icon">!</span>
                  未找到结果! 请更换搜索词,重新尝试!
                </div>
              )}
            </div>
          </div>
          
          <div className="search-toggle">
            <Button
              type="text"
              icon={searchCollapsed ? <RightOutlined /> : <LeftOutlined />}
              onClick={handleSearchToggle}
            />
            <span className="search-text">Search</span>
          </div>
        </div>

        {/* 右侧内容区域 */}
        <div className="detail-content">
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
              <p>加载中...</p>
            </div>
          ) : (
            <div className="detail-tabs">
              <Tabs
                activeKey={activeTabKey}
                onChange={setActiveTabKey}
                type="editable-card"
                onEdit={(targetKey, action) => {
                  if (action === 'remove') {
                    handleTabClose(targetKey);
                  }
                }}
                items={tabs.map(tab => ({
                  key: tab.key,
                  label: tab.label,
                  closable: tab.closable,
                  children: (
                    <div className="document-detail">
                      <div className="document-header">
                        <div className="header-left">
                          <div className="author-info">
                            <Avatar size="small" icon={<UserOutlined />} />
                            <span className="author-name">{tab.content?.createdBy || tab.content?.author || '未知作者'}</span>
                            <span className="date">{tab.content?.createdTime || tab.content?.date || '未知日期'}</span>
                          </div>
                          <div className="tags">
                            {(tab.content?.tags || []).map((tag, index) => (
                              <div key={index} className="custom-tag">
                                <span className="tag-icon">
                                  <TagOutlined />
                                </span>
                                <span className="tag-text">{tag}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="header-right">
                          <Button type="text" icon={<HeartOutlined />} />
                        </div>
                      </div>

                      <div className="document-content">
                        <div className="content-section">
                          <div 
                            dangerouslySetInnerHTML={{ 
                              __html: tab.content?.description || '暂无内容' 
                            }} 
                          />
                        </div>

                        <div className="content-section">
                          <h3>Attachments</h3>
                          <div className="attachment-list">
                            {(tab.content?.attachments || []).map((attachment, index) => (
                              <div key={index} className="attachment-item">
                                <span className="attachment-icon">
                                  {attachment.fileType === 'pdf' ? <FilePdfOutlined /> : <FileExcelOutlined />}
                                </span>
                                <span className="attachment-name">{attachment.fileName || attachment.name}</span>
                                <span className="attachment-size">{attachment.fileSize}</span>
                                <span className="attachment-downloads">下载 {attachment.downloadCount || 0}</span>
                                <Button type="text" size="small">Summary</Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="content-section">
                          <div className="effective-date">
                            <span>生效时间: {tab.content?.effectiveStartTime || tab.content?.effectiveDate || '未知'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="feedback-section">
                        <div className="feedback-header">
                          <h3>Feedback</h3>
                          <div className="feedback-controls">
                            <Select
                              placeholder="选择反馈..."
                              style={{ width: 120 }}
                              options={[
                                { value: 'bug', label: 'Bug报告' },
                                { value: 'feature', label: '功能建议' },
                                { value: 'other', label: '其他' }
                              ]}
                            />
                            <Input
                              placeholder="请输入反馈内容"
                              style={{ width: 300 }}
                            />
                            <Button type="text" icon={<SendOutlined />} />
                            <Button type="text" icon={<MailOutlined />} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }))}
              />
            </div>
          )}
        </div>
      </Layout>
    </Layout>
  );
};

export default KnowledgeDetail; 