import React, { useState, useEffect } from 'react';
import { Layout, Tabs, Button, Avatar, Space, List, Card, Input, message, Spin, Select, Tooltip } from 'antd';
import {
  HeartOutlined, HeartFilled, HistoryOutlined, TranslationOutlined, FilePdfOutlined, FileExcelOutlined,
  CloseOutlined, ArrowLeftOutlined, LeftOutlined, RightOutlined, SearchOutlined, TagOutlined,
  SendOutlined, ArrowRightOutlined, UserOutlined, DownloadOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import CommonSidebar from '../../components/CommonSidebar';
import PdfPreview from '../../components/PdfPreview';
import FeedbackMailButton from '../../components/FeedbackMailButton';
import KnowledgeTable from '../../components/KnowledgeTable';
import KnowledgeHistory from '../../components/KnowledgeHistory';
import KnowledgeDiff from '../../components/KnowledgeDiff';
import { knowledgeAPI } from '../../api/knowledge';
import { feedbackAPI } from '../../api/feedback';
import { engagementAPI } from '../../api/engagement';
import { useKnowledgeStore, useAuthStore } from '../../stores';
import { useFeedbackTypes } from '../../hooks/useFeedbackTypes';
import { addSearchHistory } from '../../utils/searchHistoryAPI';
import { authenticatedFetch } from '../../utils/request';
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
  const backQuery = searchParams.get('query');
  const [activeTab, setActiveTab] = useState('1');
  const [searchCollapsed, setSearchCollapsed] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [activeTabKey, setActiveTabKey] = useState('1');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // 知识详情数据状态
  const [knowledgeDetail, setKnowledgeDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // 收藏相关状态
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteStatusLoading, setFavoriteStatusLoading] = useState(true);

  // 附件下载（右侧按钮）
  const handleAttachmentDownload = async (attachment) => {
    try {
        let downloadUrl = attachment.filePath || attachment.fileUrl || attachment.url;
      // 当为相对路径时，使用环境变量前缀拼接为完整URL
      if (downloadUrl && typeof downloadUrl === 'string' && downloadUrl.startsWith('/')) {
        const base = (import.meta.env.VITE_API_FILE_URL || '').replace(/\/+$/, '');
        downloadUrl = `${base}${downloadUrl}`;
      }
      if (!downloadUrl) {
        message.error('下载链接不存在');
        return;
      }
      const response = await authenticatedFetch(downloadUrl, { method: 'GET' });
      if (!response.ok) {
        message.error('下载失败，请稍后重试');
        return;
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = attachment.fileName || attachment.name || 'attachment.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download error:', err);
      message.error('下载失败，请稍后重试');
    }
  };

  // 历史视图相关状态
  const [showHistory, setShowHistory] = useState(false);
  const [historyVersions, setHistoryVersions] = useState([]);
  const [showDiff, setShowDiff] = useState(false);
  const [diffData, setDiffData] = useState({ fromVersion: '', toVersion: '', fromContent: '', toContent: '' });
  const [diffLoading, setDiffLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  
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

  // 当feedbackTypes加载完成后，自动选中第一条
  useEffect(() => {
    if (feedbackTypes && feedbackTypes.length > 0 && !selectedFeedbackType) {
      setSelectedFeedbackType(feedbackTypes[0].value);
    }
  }, [feedbackTypes, selectedFeedbackType]);

  // 获取知识详情
  const fetchKnowledgeDetail = async (knowledgeId) => {
    if (!knowledgeId) return;
    
    setLoading(true);
    try {
      const response = await knowledgeAPI.getKnowledgeDetail(knowledgeId);
      if (response.code === 200) {
        setKnowledgeDetail(response.data);
        
        // 调试：打印返回的数据结构
        console.log('Knowledge detail data:', response.data);
        
        // 如果有知识详情，自动创建第一个标签页
        if (response.data && tabs.length === 0) {
          // 尝试多个可能的标题字段
          const title = response.data.name || response.data.title || response.data.knowledgeName || response.data.knowledge_name || '知识详情';
          console.log('Tab title will be:', title);
          
          const firstTab = {
            key: `knowledge-${knowledgeId}`,
            label: title,
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

  // 打开历史记录（占位实现）
  const handleOpenHistory = (content) => {
    const knowledgeId = content?.id || knowledgeDetail?.id || id;
    if (!knowledgeId) {
      message.info('暂无可用历史记录');
      return;
    }

    // 从后端拉取版本列表（兼容多种返回结构）
    knowledgeAPI.getKnowledgeVersions(knowledgeId)
      .then((response) => {
        let list = [];
        if (Array.isArray(response)) {
          list = response;
        } else if (Array.isArray(response?.versions)) {
          list = response.versions;
        } else if (Array.isArray(response?.data?.versions)) {
          list = response.data.versions;
        } else if (Array.isArray(response?.data)) {
          list = response.data;
        } else if (Array.isArray(response?.records)) {
          list = response.records;
        } else if (response?.code === 200 && Array.isArray(response?.data)) {
          list = response.data;
        }

        // 如果列表为空，直接显示“无历史记录”
        if (!list || list.length === 0) {
          setHistoryVersions([]);
          setShowHistory(true);
          return;
        }

        const mapped = list.map((item, idx) => ({
          version: item.version ?? item.versionNo ?? item.version_no ?? item.no ?? (list.length - idx),
          editor: item.editor ?? item.updatedBy ?? item.lastEditor ?? content?.createdBy ?? '未知',
          date: item.date ?? item.updatedTime ?? item.updatedAt ?? item.createdTime ?? '',
          content: item.content ?? item.description ?? '',
        }));
        setHistoryVersions(mapped);
        setShowHistory(true);
      })
      .catch((err) => {
        console.error('获取版本列表失败:', err);
        message.error('获取版本列表失败');
      });
  };

  const handleCloseHistory = () => {
    setShowHistory(false);
    setShowDiff(false);
  };

  const handleCompareVersions = (fromVersion, toVersion) => {
    const knowledgeId = knowledgeDetail?.id || tabs.find(t => t.key === activeTabKey)?.content?.id || id;
    if (!knowledgeId) {
      message.warning('缺少知识ID，无法获取差异');
      return;
    }

    // 预填本地内容并立即显示差异视图
    const from = historyVersions.find(v => String(v.version) === String(fromVersion));
    const to = historyVersions.find(v => String(v.version) === String(toVersion));
    setDiffData({
      fromVersion,
      toVersion,
      fromContent: from?.content || '',
      toContent: to?.content || '',
      htmlDiff: '',
      summary: '',
    });
    setShowDiff(true);

    // 并发：HTML差异（较快）
    setDiffLoading(true);
    knowledgeAPI.getKnowledgeDiffHtml(knowledgeId, String(toVersion), String( fromVersion ))
      .then((resp) => {
        const data = resp?.data || resp;
        const htmlDiff = typeof data === 'string' ? data : (data?.htmlDiff || data?.html_diff || data?.html || '');
        setDiffData(prev => ({ ...prev, htmlDiff }));
      })
      .catch((err) => {
        console.error('获取HTML差异失败:', err);
        message.error('获取HTML差异失败');
      })
      .finally(() => {
        setDiffLoading(false);
      });

    // 并发：AI摘要（可能较慢）
    setSummaryLoading(true);
    knowledgeAPI.getKnowledgeDiffSummary(knowledgeId, String(fromVersion), String(toVersion))
      .then((resp) => {
        const data = resp?.data || resp;
        const summary = typeof data === 'string' ? data : (data?.summary || data?.text || '');
        setDiffData(prev => ({ ...prev, summary }));
      })
      .catch((err) => {
        console.error('获取AI摘要失败:', err);
        // 摘要失败不阻断HTML差异展示
      })
      .finally(() => {
        setSummaryLoading(false);
      });
  };

  const handleCloseDiff = () => {
    setShowDiff(false);
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

  // 从搜索结果中获取搜索列表数据
  const searchResultsData = searchResults.length > 0 ? searchResults : knowledgeStore.knowledgeList;
  const displayResults = searchResultsData.map(item => ({
    id: item.id,
    title: item.name || item.title || '无标题',
    date: item.createdTime || item.date || '未知日期',
    description: item.description || '暂无描述',
    type: "pdf",
  }));
 

  const handleBack = () => {
    const params = new URLSearchParams();
    if (categoryId) params.set('parent', categoryId); // Knowledge页识别parent参数
    if (backQuery && backQuery.trim()) params.set('query', backQuery.trim());
    const qs = params.toString();
    navigate(`/knowledge${qs ? `?${qs}` : ''}`);
  };

  const handleTabClose = (targetKey) => {
    const newTabs = tabs.filter(tab => tab.key !== targetKey);
    setTabs(newTabs);
    
    // 如果关闭的是当前活跃的标签页，需要切换到其他标签页
    if (activeTabKey === targetKey) {
      if (newTabs.length > 0) {
        // 切换到最后一个标签页
        setActiveTabKey(newTabs[newTabs.length - 1].key);
      } else {
        // 如果没有标签页了，清空活跃标签页
        setActiveTabKey('');
      }
    }
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      message.warning("请输入搜索关键词");
      return;
    }
    
    setSearchLoading(true);
    try {
      // 添加搜索历史
      addSearchHistory(searchValue.trim());
      
      // 调用搜索API
      const response = await knowledgeAPI.searchKnowledgeByQuery({
        query: searchValue.trim(),
        page: 1,
        size: 20,
        userId: currentUserId
      });
      
      if (response.code === 200) {
        // 处理搜索结果，如果name为空则使用description的前50个字符作为标题
        const processedResults = (response.data.esResults || []).map(item => ({
          ...item,
          name: item.name || item.description?.substring(0, 50) + '...' || '无标题',
          displayName: item.name || item.description?.substring(0, 50) + '...' || '无标题'
        }));
        
        setSearchResults(processedResults);
        // 更新knowledgeStore中的数据
        knowledgeStore.setKnowledgeList(processedResults);
      } else {
        message.error(response.message || '搜索失败');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('搜索失败:', error);
      message.error('搜索失败，请稍后重试');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
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
                  placeholder="input..."
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
                      Search
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
            
            
            
            <div className="search-results">
              {searchLoading ? (
                <div className="loading-container">
                  <Spin size="small" />
                  <span>搜索中...</span>
                </div>
              ) : displayResults.length > 0 ? (
                displayResults.map((item, index) => {
                  // 检查当前项是否为活跃标签页 - 需要同时检查知识详情标签页和搜索标签页
                  const isActiveKnowledge = activeTabKey === `knowledge-${item.id}`;
                  const isActiveSearch = activeTabKey === `search-${item.id}`;
                  const isActive = isActiveKnowledge || isActiveSearch;
                  
                  return (
                    <div
                      key={item.id || index}
                      className={`result-item ${isActive ? 'active' : ''}`}
                      onClick={() => addTabFromSearch(item)}
                    >
                      <div className="result-header">
                        <div className="result-title">{item.title}</div>
                    
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
                  );
                })
              ) : (
                <div className="no-results">
                   
                  {searchValue.trim() ? 'No results found! Please change the search term and try again!' : 'Please enter keywords to search'}
                </div>
              )}
            </div>
          </div>
          
          <div className="search-toggle">
            <Button
            className="icon-bold"
              type="text"
               style={{
                fontSize: "24px",
              }}
              icon={searchCollapsed ? <RightOutlined /> : <LeftOutlined />}
              onClick={handleSearchToggle}
            />
            
          </div>
        </div>

        {/* 右侧内容区域 */}
        <div className="detail-content">
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
              <p>加载中...</p>
            </div>
          ) : tabs.length === 0 ? (
            <div className="empty-tabs-container">
              <div className="empty-tabs-content">
                <div className="empty-icon">📄</div>
                <h3>暂无打开的文档</h3>
                <p>请从左侧搜索结果中选择文档查看</p>
              </div>
            </div>
          ) : (
            <div className="detail-tabs">
              {!showHistory ? (
                <Tabs
              hideAdd
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
                        <div className="header-right">
                          <Tooltip title="历史记录">
                            <Button
                              type="default"
                              icon={<HistoryOutlined />}
                              size="large"
                              onClick={() => handleOpenHistory(tab.content)}
                              style={{ fontSize: '16px' }}
                            >
                              History
                            </Button>
                          </Tooltip>
                        </div>
                        
                      </div>

                      <div className="document-content">
                        {/* 数据表格区域 - 只有当tableData存在且包含有效数据时才显示 */}
                        {tab.content?.tableData && tab.content.tableData.columns && tab.content.tableData.rows && tab.content.tableData.rows.length > 0 && (
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
                                  <Button
                                    type="link"
                                    icon={<DownloadOutlined />}
                                    onClick={() => handleAttachmentDownload(attachment)}
                                  >
                                    下载
                                  </Button>
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
                                      bboxes={tab.content?.bbox_union || tab.content?.bboxUnion ? [tab.content.bbox_union || tab.content.bboxUnion] : []}
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
                            <span>生效时间: {tab.content?.effectiveStartTime || ''} - {tab.content?.effectiveEndTime || ''}</span>
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
              ) : (
                !showDiff ? (
                  <KnowledgeHistory
                    documentTitle={knowledgeDetail?.name || knowledgeDetail?.title || tabs.find(t => t.key === activeTabKey)?.label || tabs[0]?.label}
                    versions={historyVersions}
                    currentVersion={historyVersions[0]?.version}
                    onCompare={handleCompareVersions}
                    onClose={handleCloseHistory}
                    loading={diffLoading}
                  />
                ) : (
                  <KnowledgeDiff
                    documentTitle={knowledgeDetail?.name || knowledgeDetail?.title}
                    fromVersion={diffData.fromVersion}
                    toVersion={diffData.toVersion}
                    fromContent={diffData.fromContent}
                    toContent={diffData.toContent}
                    htmlDiff={diffData.htmlDiff}
                    summary={diffData.summary}
                    summaryLoading={summaryLoading}
                    attachments={tabs.find(t => t.key === activeTabKey)?.content?.attachments || knowledgeDetail?.attachments || []}
                    onClose={handleCloseDiff}
                  />
                )
              )}
            </div>
          )}
        </div>
      </Layout>
    </Layout>
  );
};

export default KnowledgeDetail;