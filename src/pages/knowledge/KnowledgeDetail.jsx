import React, { useState, useEffect } from 'react';
import { Layout, Tabs, Button, Avatar, Space, List, Card, Input, message, Spin, Select, Tooltip } from 'antd';
import {
  HeartOutlined, HeartFilled, HistoryOutlined, TranslationOutlined, FilePdfOutlined, FileExcelOutlined,
  CloseOutlined, ArrowLeftOutlined, LeftOutlined, RightOutlined, SearchOutlined, TagOutlined,
  SendOutlined, ArrowRightOutlined, UserOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import CommonSidebar from '../../components/CommonSidebar';
import PdfPreview from '../../components/PdfPreview';
import FeedbackMailButton from '../../components/FeedbackMailButton';
import KnowledgeTable from '../../components/KnowledgeTable';
import { knowledgeAPI } from '../../api/knowledge';
import { feedbackAPI } from '../../api/feedback';
import { engagementAPI } from '../../api/engagement';
import { useKnowledgeStore, useAuthStore } from '../../stores';
import { useFeedbackTypes } from '../../hooks/useFeedbackTypes';
import './KnowledgeDetail.scss';

// HTML标签清理函数
const stripHtmlTags = (htmlString) => {
  if (!htmlString || typeof htmlString !== 'string') {
    return htmlString || '';
  }
  
  // 如果内容不包含HTML标签，直接返回
  if (!htmlString.includes('<')) {
    return htmlString;
  }
  
  try {
    // 创建临时DOM元素来解析HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    
    // 获取纯文本内容
    const textContent = tempDiv.textContent || tempDiv.innerText || htmlString;
    
    // 清理临时元素
    tempDiv.remove();
    
    return textContent;
  } catch (error) {
    console.warn('HTML标签清理失败:', error);
    // 如果解析失败，使用正则表达式移除标签
    return htmlString.replace(/<[^>]*>/g, '');
  }
};

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
  
  // 收藏相关状态
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteStatusLoading, setFavoriteStatusLoading] = useState(true);
  
  // 获取knowledgeStore和authStore
  const knowledgeStore = useKnowledgeStore();
  const authStore = useAuthStore();
  const currentUserId = authStore.user?.id || authStore.user?.userId;
  
  // 获取反馈类型
  const { feedbackTypes, loading: feedbackTypesLoading } = useFeedbackTypes();

  // Feedback状态
  const [selectedFeedbackType, setSelectedFeedbackType] = useState('');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

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

  // 检查收藏状态
  const checkFavoriteStatus = async (knowledgeId) => {
    if (!knowledgeId) return;
    
    setFavoriteStatusLoading(true);
    try { 
      const response = await engagementAPI.getFavoriteStatus(knowledgeId); 
      
      if (response.code === 200) {
        const favoriteStatus = response.data?.isFavorited || false;
       
        
        setIsFavorited(favoriteStatus);
      } else {
        console.error('获取收藏状态失败:', response.message);
      }
    } catch (error) {
      console.error('检查收藏状态失败:', error);
    } finally {
      setFavoriteStatusLoading(false);
    }
  };

  // 处理收藏/取消收藏
  const handleFavorite = async () => {
    if (!id || favoriteLoading) return;
    
    // 检查用户是否已登录
    if (!currentUserId) {
      message.error('请先登录');
      return;
    }
    
    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        // 取消收藏 
        const response = await engagementAPI.removeFavorite(id, currentUserId); 
        
        if (response.code === 200) {
          message.success('已取消收藏'); 
          
          // 取消收藏后，延迟一段时间再获取状态，以防后端状态同步需要时间
          setTimeout(async () => { 
            await checkFavoriteStatus(id);
          }, 500); // 延迟500ms
          
        } else {
          message.error(response.message || '取消收藏失败');
        }
      } else {
        // 添加收藏 
        const response = await engagementAPI.addFavorite(id, currentUserId); 
        
        if (response.code === 200) {
          message.success('已添加到收藏'); 
          // 操作成功后重新获取状态，确保按钮显示正确
          await checkFavoriteStatus(id);
        } else {
          message.error(response.message || '收藏失败');
        }
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      message.error('操作失败，请重试');
    } finally {
      setFavoriteLoading(false);
    }
  };

  // 处理feedback提交
  const handleSubmitFeedback = async () => {
    if (!knowledgeDetail?.id) {
      message.error('知识详情不存在');
      return;
    }

    if (!selectedFeedbackType) {
      message.warning('请选择反馈类型');
      return;
    }

    if (!feedbackContent.trim()) {
      message.warning('请输入反馈内容');
      return;
    }

    if (!currentUserId) {
      message.error('请先登录');
      return;
    }

    setFeedbackSubmitting(true);
    try {
      const response = await feedbackAPI.submitFeedback(
        knowledgeDetail.id,
        feedbackContent.trim(),
        selectedFeedbackType,
        currentUserId
      );

      if (response.code === 200) {
        message.success('反馈提交成功');
        // 清空表单
        setSelectedFeedbackType('');
        setFeedbackContent('');
      } else {
        message.error(response.message || '提交失败，请重试');
      }
    } catch (error) {
      console.error('提交反馈失败:', error);
      message.error('提交失败，请重试');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // 组件挂载时获取知识详情
  useEffect(() => {
    if (id) {
      fetchKnowledgeDetail(id);
    }
  }, [id]);

  // 当知识详情加载完成后，检查收藏状态
  useEffect(() => {
    if (knowledgeDetail?.id) {
      checkFavoriteStatus(knowledgeDetail.id);
    }
  }, [knowledgeDetail?.id]);

  // 模拟文档数据（作为备用）
  const documentData = {
    id: id,
    title: 'IWS产品方案',
    author: 'Felicity He',
    date: '2025-07-05 12:00',
    tags: ['QDII', 'QDUT'],
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
    description: item.description || '暂无描述',
    type: "pdf",
  }));
 

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
          attachments: [],
          effectiveDate: '加载中...',
        }
    };

    // 使用函数式更新确保获取最新的tabs状态
    setTabs(prevTabs => { 
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
      // 调用API获取知识详情
      const response = await knowledgeAPI.getKnowledgeDetail(searchItem.id); 
      if (response.code === 200) {
        // 使用函数式更新确保获取最新的tabs状态
        setTabs(prevTabs => { 
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
                    <div className="result-description" 
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: '1.4',
                        maxHeight: '2.8em',
                        fontSize: '16px'
                      }}
                    >
                      {stripHtmlTags(item.description)}
                    </div>
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
                            <Tooltip title={isFavorited ? "取消收藏" : "收藏"} placement="top">
                              <Button 
                                type="text" 
                                icon={isFavorited ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                                onClick={handleFavorite}
                                loading={favoriteLoading || favoriteStatusLoading}
                                size="large"
                                style={{ 
                                  marginLeft: '16px', 
                                  fontSize: '16px',
                                  color: isFavorited ? '#ff4d4f' : 'inherit',
                                  transition: 'all 0.3s ease'
                                }}
                              />
                            </Tooltip>
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
                       
                      </div>

                      <div className="document-content">
                        {/* 数据表格区域 */}
                        {tab.content?.tableData && (
                          <div className="content-section">
                            <KnowledgeTable tableData={tab.content.tableData} />
                          </div>
                        )}

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
                                <div className="attachment-header">
                                  <span className="attachment-icon">
                                    {attachment.fileType === 'pdf' ? <FilePdfOutlined /> : <FileExcelOutlined />}
                                  </span>
                                  <span className="attachment-name">{attachment.fileName || attachment.name}</span>
                                  
                                </div>
                                

                                
                                {/* PDF预览组件 - 直接嵌入到附件项中 */}
                                {(attachment.fileType === 'pdf' || 
                                  attachment.fileType === 'application/pdf' ||
                                  (attachment.fileName && attachment.fileName.toLowerCase().endsWith('.pdf')) ||
                                  (attachment.name && attachment.name.toLowerCase().endsWith('.pdf'))) && (
                                  <div className="pdf-preview-embedded">
                                    <h4>PDF预览 - {attachment.fileName || attachment.name}</h4>
                                    <PdfPreview 
                                      fileUrl={attachment.filePath || attachment.fileUrl || attachment.url} 
                                      pageNum={1}
                                      bboxes={[]}
                                    />
                                  </div>
                                )}
                                
                                {/* 如果没有PDF预览，显示原因 */}
                                {!(attachment.fileType === 'pdf' || 
                                   attachment.fileType === 'application/pdf' ||
                                   (attachment.fileName && attachment.fileName.toLowerCase().endsWith('.pdf')) ||
                                   (attachment.name && attachment.name.toLowerCase().endsWith('.pdf'))) && (
                                  <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                                    非PDF文件，无法预览
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="content-section">
                          <div className="effective-date">
                            <span>生效时间: {tab.content?.effectiveStartTime || tab.content?.effectiveDate || '未知'}</span>
                          </div>
                        </div>

                        <div className="feedback-section">
                          <div className="feedback-header">
                            <h3>Feedback</h3>
                            <div className="feedback-controls">
                              <Select
                                placeholder="选择反馈..."
                                style={{ width: 120 }}
                                options={feedbackTypes}
                                loading={feedbackTypesLoading}
                                value={selectedFeedbackType}
                                onChange={setSelectedFeedbackType}
                              />
                              <Input
                                placeholder="请输入反馈内容"
                                style={{ width: 300 }}
                                value={feedbackContent}
                                onChange={(e) => setFeedbackContent(e.target.value)}
                                onPressEnter={handleSubmitFeedback}
                              />
                              <Button 
                                type="text" 
                                icon={<SendOutlined />} 
                                onClick={handleSubmitFeedback}
                                loading={feedbackSubmitting}
                                disabled={!selectedFeedbackType || !feedbackContent.trim() || !currentUserId}
                              >
                               
                              </Button>

                              
                              <FeedbackMailButton knowledgeDetail={tab.content} />
                            </div>
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