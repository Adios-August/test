import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Layout,
  Input,
  Button,
  Card,
  Row,
  Col,
  List,
  Badge,
  Pagination,
  message,
  Spin,
  Tag,
  Avatar,
  Space,
  Tooltip,
} from "antd";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  SearchOutlined,
  FileTextOutlined,
  EyeOutlined,
  DownloadOutlined,
  CloseOutlined,
  FilePdfOutlined,
  RobotOutlined,
  LikeOutlined,
  DislikeOutlined,
  DownOutlined,
  SendOutlined,
  CalendarOutlined,
  InboxOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import CommonSidebar from "../../components/CommonSidebar";
import KnowledgeDetailModal from "../../components/KnowledgeDetailModal";
import { knowledgeAPI } from "../../api/knowledge";
import { useSearchHistoryStore } from "../../stores";
 
import "./Knowledge.scss";

const { Sider, Content } = Layout;
const { Search } = Input;

const Knowledge = observer(() => {
  console.log('Knowledge组件开始渲染');
  
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const searchHistoryStore = useSearchHistoryStore();
  const categoryId = searchParams.get('category');
  
  console.log('Knowledge组件状态:', { categoryId, location: location.pathname });
  
  const [searchCurrentPage, setSearchCurrentPage] = useState(1); // 搜索结果分页
  const [questionInput, setQuestionInput] = useState(""); // 问题输入框
  const [searchValue, setSearchValue] = useState(""); // 搜索输入值
  const [currentCategoryId, setCurrentCategoryId] = useState(null); // 当前选中的分类ID
  const [isCategorySearchMode, setIsCategorySearchMode] = useState(false); // 是否处于分类搜索模式
  const [showAISourceModules, setShowAISourceModules] = useState(true); // 是否显示AI和source模块

  // 分类知识列表相关状态
  const [categoryKnowledge, setCategoryKnowledge] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryPagination, setCategoryPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 搜索结果相关状态
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPagination, setSearchPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // AI回答相关状态
  const [aiAnswer, setAiAnswer] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [references, setReferences] = useState([]); // 添加references状态

  // 知识详情弹窗相关状态
  const [knowledgeDetailVisible, setKnowledgeDetailVisible] = useState(false);
  const [currentKnowledge, setCurrentKnowledge] = useState(null);
  const [knowledgeDetailLoading, setKnowledgeDetailLoading] = useState(false);

  // 处理问题提交
  const handleQuestionSubmit = () => {
    if (!questionInput.trim()) {
      message.warning("请输入问题");
      return;
    }
    
    // 跳转到问答页面，并传递问题内容
    navigate("/knowledge-qa", { 
      state: { 
        question: questionInput.trim(),
        fromPage: "knowledge"
      } 
    });
  };

  // 处理推荐问题点击
  const handleRecommendedQuestionClick = (question) => {
    // 跳转到问答页面，并传递点击的问题内容
    navigate("/knowledge-qa", { 
      state: { 
        question: question,
        fromPage: "knowledge"
      } 
    });
  };

  // 获取分类知识列表
  const fetchCategoryKnowledge = useCallback(async (categoryId, page = 1, size = 10) => {
    if (!categoryId) return;
    
    console.log('开始获取分类知识列表:', { categoryId, page, size });
    setCategoryLoading(true);
    try {
      const response = await knowledgeAPI.getCategoryKnowledge(categoryId, {
        page,
        size
      });
      
      console.log('分类知识API响应:', response);
      
      if (response.code === 200) {
        // 根据实际API返回的数据结构进行调整
        setCategoryKnowledge(response.data.records || []);
        setCategoryPagination(prev => ({
          ...prev,
          current: response.data.current || page,
          total: response.data.total || 0,
          pageSize: response.data.size || size
        }));
        console.log('分类知识列表设置成功:', response.data.records?.length || 0);
      } else {
        message.error(response.message || '获取分类知识列表失败');
        console.error('分类知识API错误:', response.message);
      }
    } catch (error) {
      console.error('获取分类知识列表失败:', error);
      message.error('获取分类知识列表失败');
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  // 处理分类知识列表分页
  const handleCategoryPaginationChange = (page, pageSize) => {
    fetchCategoryKnowledge(categoryId, page, pageSize);
  };

  // 获取搜索结果
  const fetchSearchResults = useCallback(async (query, page = 1, size = 10) => {
    if (!query || !query.trim()) return;
    
    console.log('开始获取搜索结果:', { query, page, size });
    setSearchLoading(true);
    setAiLoading(true); // 设置AI loading状态
    try {
      const response = await knowledgeAPI.searchKnowledgeByQuery({
        query: query.trim(),
        page: page - 1, // API使用0-based分页
        size: size
      });
      
      console.log('搜索API响应:', response);
      
      if (response.code === 200) {
        console.log('API返回数据:', response.data);
        // 处理搜索结果，如果name为空则使用description的前50个字符作为标题
        const processedResults = (response.data.esResults || []).map(item => ({
          ...item,
          name: item.name || item.description?.substring(0, 50) + '...' || '无标题',
          displayName: item.name || item.description?.substring(0, 50) + '...' || '无标题'
        }));
        
        setSearchResults(processedResults);
        setSearchPagination(prev => ({
          ...prev,
          current: page,
          total: response.data.total || 0,
          pageSize: size
        }));
        
        // 处理AI回答结果
        if (response.data.ragResults && response.data.ragResults.length > 0) {
          setAiAnswer(response.data.ragResults[0]);
          setReferences(response.data.ragResults[0].references || []); // 设置references
        } else {
          setAiAnswer(null);
          setReferences([]); // 清空references
        }
        
        console.log('搜索结果设置成功:', processedResults.length);
      } else {
        message.error(response.message || '获取知识列表失败');
        setSearchResults([]); // 清空搜索结果
        console.error('搜索API错误:', response.message);
      }
    } catch (error) {
      console.error('获取知识列表失败:', error);
      message.error('获取知识列表失败');
      setSearchResults([]); // 清空搜索结果
    } finally {
      setSearchLoading(false);
      setAiLoading(false); // 清除AI loading状态
    }
  }, []);

  // 处理搜索
  const handleSearch = (value) => {
    console.log('处理搜索:', value);
    setSearchValue(value);
    // 清空之前的搜索结果
    setSearchResults([]);
    
    if (value.trim()) {
      // 添加搜索历史
      searchHistoryStore.addSearchHistory(value.trim());
      
      setCurrentCategoryId(1);
      setIsCategorySearchMode(true); // 进入搜索模式
      fetchSearchResults(value.trim(), 1, 10);
      // 搜索时显示AI和source模块
      setShowAISourceModules(true);
    } else {
      // 如果搜索框为空，隐藏AI和source模块
      setShowAISourceModules(false);
      setIsCategorySearchMode(false);
      setSearchResults([]);
    }
  };

  // 处理搜索分页
  const handleSearchPaginationChange = (page, pageSize) => {
    // 使用当前搜索关键词
    if (searchValue.trim()) {
      fetchSearchResults(searchValue.trim(), page, pageSize);
    }
  };

  // 当categoryId变化时获取分类知识列表
  useEffect(() => {
    if (categoryId) {
      console.log('URL参数变化，categoryId:', categoryId);
      // 切换到路由分类时退出分类搜索模式，回到分类展示
      setIsCategorySearchMode(false);
      setSearchResults([]);
      // 只有在没有当前搜索内容时才清空搜索框
      if (!searchValue.trim()) {
        setSearchValue(''); // 清空搜索框
      }
      setCurrentCategoryId(categoryId);
      fetchCategoryKnowledge(categoryId, 1, 10);
      // 隐藏AI和source模块
      setShowAISourceModules(false);
    } else {
      // 如果没有categoryId，清空分类知识列表
      setCategoryKnowledge([]);
      setIsCategorySearchMode(false);
    }
  }, [categoryId, fetchCategoryKnowledge]);

  // 处理侧边栏分类点击（不依赖URL参数变化）
  const handleCategoryClick = (category, isTopLevel) => {
    console.log('侧边栏分类点击:', category.name, category.id, isTopLevel);
    // 清空之前的搜索结果
    setSearchResults([]);
    // 使用分类ID获取知识列表（进入分类搜索模式）
    setIsCategorySearchMode(true);
    setCurrentCategoryId(category.id);
    // 不更新搜索框内容，保持用户输入的内容
    // 使用分类知识接口获取该分类下的知识
    fetchCategoryKnowledge(category.id, 1, 10);
    // 隐藏AI和source模块
    setShowAISourceModules(false);
  };

  // 调试：监控搜索结果状态
  useEffect(() => {
    console.log('搜索结果状态变化:', {
      searchResults: searchResults.length,
      searchValue,
      currentCategoryId,
      searchLoading,
      categoryId,
      isCategorySearchMode,
      categoryKnowledge: categoryKnowledge.length,
      categoryLoading,
      showAISourceModules
    });
  }, [searchResults, searchValue, currentCategoryId, searchLoading, categoryId, isCategorySearchMode, categoryKnowledge, categoryLoading, showAISourceModules]);

  // 组件初始化时清空搜索结果
  useEffect(() => {
    setSearchResults([]);
    setSearchValue('');
    setCurrentCategoryId(null);
    // 从顶部菜单直接进入知识库页面时，隐藏AI和source模块
    setShowAISourceModules(false);
  }, []);

  // 处理从首页传递的搜索关键词
  useEffect(() => {
    if (location.state?.searchKeyword) {
      const keyword = location.state.searchKeyword;
      setSearchValue(keyword);
      // 自动触发搜索（handleSearch现在会自动设置showAISourceModules为true）
      handleSearch(keyword);
      // 清空location.state，避免重复触发
      navigate(location.pathname + location.search, { replace: true });
    }
  }, [location.state]);

  const handleResultClick = (item) => {
    navigate(`/knowledge/${item.id}`);
  };

  // 切换AI和source模块显示状态
  const toggleAISourceModules = () => {
    setShowAISourceModules(!showAISourceModules);
  };

  // 获取知识详情
  const fetchKnowledgeDetail = async (knowledgeId) => {
    if (!knowledgeId) return;
    
    setKnowledgeDetailLoading(true);
    try {
      const response = await knowledgeAPI.getKnowledgeDetail(knowledgeId);
      
      if (response.code === 200) {
        setCurrentKnowledge(response.data);
      } else {
        message.error(response.message || '获取知识详情失败');
      }
    } catch (error) {
      console.error('获取知识详情失败:', error);
      message.error('获取知识详情失败');
    } finally {
      setKnowledgeDetailLoading(false);
    }
  };

  // 处理Sources模块中的知识点击
  const handleSourceKnowledgeClick = (reference) => {
    setCurrentKnowledge(reference); // 先显示基本信息
    setKnowledgeDetailVisible(true);
    
    // 如果有knowledgeId，则获取详细信息
    if (reference.knowledgeId) {
      fetchKnowledgeDetail(reference.knowledgeId);
    }
  };

  // 关闭知识详情弹窗
  const handleCloseKnowledgeDetail = () => {
    setKnowledgeDetailVisible(false);
    setCurrentKnowledge(null);
    setKnowledgeDetailLoading(false);
  };

  return (
    <Layout className="knowledge-layout">
      {/* 顶部搜索栏 */}
      <div className="knowledge-header">
        <div className="search-container">
          <div className="search-input">
            <Input
              placeholder="请输入..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onPressEnter={(e) => handleSearch(e.target.value)}
              prefix={<SearchOutlined />}
              suffix={
                <Button
                  type="text"
                  size="small"
                  onClick={() => handleSearch(searchValue)}
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
      </div>

      <Layout className="knowledge-main-layout">
        <CommonSidebar 
          height="calc(100vh - 196px)" 
          marginTop="16px" 
          enableNavigation={false}
          filterCategoryId={categoryId}
          onCategoryClick={handleCategoryClick}
        />
        <Content className={`knowledge-content ${!showAISourceModules ? 'category-mode' : ''}`}>
          {/* AI助手聊天区域 - 只在显示AI模块时显示 */}
          {showAISourceModules && (
            <div className="chat-section">
            {aiLoading ? (
              <div className="chat-message">
                <div className="message-header">
                  <Avatar icon={<RobotOutlined />} className="ai-avatar" />
                </div>
                <div className="message-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Spin size="small" />
                    <p style={{ margin: 0 }}>AI正在思考中，请稍候...</p>
                  </div>
                </div>
              </div>
            ) : aiAnswer ? (
              <div className="chat-message">
                <div className="message-header">
                  <Avatar icon={<RobotOutlined />} className="ai-avatar" />
                </div>
                <div className="message-content">
                  <p>{aiAnswer.answer}</p>
                  {aiAnswer.references && aiAnswer.references.length > 0 && (
                    <div className="message-actions">
                      <Button type="link" size="small" icon={<FilePdfOutlined />}>
                        {aiAnswer.references[0].sourceFile}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="chat-message">
                <div className="message-header">
                  <Avatar icon={<RobotOutlined />} className="ai-avatar" />
                </div>
                <div className="message-content">
                  <p>请输入您的问题，我将为您提供专业的回答。</p>
                </div>
              </div>
            )}

            {/* 继续解答区域 */}
            <div className="continue-section">
              <h4>继续为你解答</h4>
              {aiAnswer && aiAnswer.recommendedQuestions && aiAnswer.recommendedQuestions.length > 0 ? (
                <div className="suggested-questions">
                  {aiAnswer.recommendedQuestions.map((question, index) => (
                    <Button 
                      key={index} 
                      type="default" 
                      size="small"
                      onClick={() => handleRecommendedQuestionClick(question)}
                      disabled={aiLoading}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="suggested-questions">
                  <Button 
                    type="default" 
                    size="small"
                    onClick={() => handleRecommendedQuestionClick("请告诉我更多相关信息")}
                    disabled={aiLoading}
                  >
                    请告诉我更多相关信息
                  </Button>
                  <Button 
                    type="default" 
                    size="small"
                    onClick={() => handleRecommendedQuestionClick("还有其他问题吗？")}
                    disabled={aiLoading}
                  >
                    还有其他问题吗？
                  </Button>
                </div>
              )}
              <div className="input-section">
                <div className="textarea-container">
                  <Input.TextArea 
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    placeholder="请在这里继续输入问题" 
                    rows={2} 
                    style={{ marginBottom: 0 }}
                    disabled={aiLoading}
                    onPressEnter={(e) => {
                      if (!e.shiftKey && !aiLoading) {
                        e.preventDefault();
                        handleQuestionSubmit();
                      }
                    }}
                  />
                  <Button 
                    type="primary" 
                    icon={aiLoading ? <Spin size="small" /> : <SendOutlined />}
                    className="send-button"
                    onClick={handleQuestionSubmit}
                    loading={aiLoading}
                    disabled={aiLoading}
                  >
                    {aiLoading ? '发送中...' : '发送'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* 搜索结果区域 */}
          <div className="search-results">
            {showAISourceModules && (
              <div className="results-header">
                <span className="results-count">共找到{searchResults.length}个结果</span>
                <Button type="text" icon={<CalendarOutlined />}>
                  更新日期 <DownOutlined />
                </Button>
              </div>
            )}


            {categoryId && !isCategorySearchMode ? (
              <div className="category-content">
                {categoryLoading ? (
                  <div className="category-loading">
                    <Spin size="large" />
                    <p>正在加载知识内容...</p>
                  </div>
                ) : categoryKnowledge.length > 0 ? (
                  <React.Fragment>
                    <div className="results-grid">
                      {categoryKnowledge.map((item) => (
                        <Card
                          key={item.id}
                          className="result-card"
                          onClick={() => handleResultClick(item)}
                          style={{ cursor: 'pointer', marginBottom: '16px' }}
                        >
                          <div className="card-header">
                            <div className="card-title">
                              <FileTextOutlined className="file-icon" style={{ color: '#1890ff', marginRight: '8px' }} />
                              <span className="title-text">{item.name}</span>
                            </div>
                            <div className="card-actions">
                            
                              <span className="date-text">2025-01-15</span>
                              <Tooltip title="在当前标签页中打开">
                                <GlobalOutlined style={{ color: '#666', marginLeft: '8px', cursor: 'pointer' }} />
                              </Tooltip>
                              <Tooltip title="在新标签页中打开">
                                <ExportOutlined style={{ color: '#666', marginLeft: '4px', cursor: 'pointer' }} />
                              </Tooltip>
                            </div>
                          </div>
                          <div className="card-content">
                            <p>{item.description}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                    <div className="pagination-section">
                      <Pagination
                        current={categoryPagination.current}
                        total={categoryPagination.total}
                        pageSize={categoryPagination.pageSize}
                        onChange={handleCategoryPaginationChange}
                        showSizeChanger={false}
                        showQuickJumper={false}
                        showPrevNextJumpers={true}
                        showLessItems={true}
                        prevIcon="上一页"
                        nextIcon="下一页"
                      />
                    </div>
                  </React.Fragment>
                ) : (
                  <div className="category-info">
                    <InboxOutlined className="empty-icon" />
                    <h3>暂无知识内容</h3>
                    <p>当前分类下暂无知识内容，请稍后再试</p>
                  </div>
                )}
              </div>
            ) : isCategorySearchMode && !showAISourceModules ? (
              // 侧边栏点击时的分类知识显示
              <div className="category-content">
                {categoryLoading ? (
                  <div className="category-loading">
                    <Spin size="large" />
                    <p>正在加载知识内容...</p>
                  </div>
                ) : categoryKnowledge.length > 0 ? (
                  <React.Fragment>
                    <div className="results-grid">
                      {categoryKnowledge.map((item) => (
                        <Card
                          key={item.id}
                          className="result-card"
                          onClick={() => handleResultClick(item)}
                          style={{ cursor: 'pointer', marginBottom: '16px' }}
                        >
                          <div className="card-header">
                            <div className="card-title">
                              <FileTextOutlined className="file-icon" style={{ color: '#1890ff', marginRight: '8px' }} />
                              <span className="title-text">{item.name}</span>
                            </div>
                            <div className="card-actions">
                              <DownOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                              <span className="date-text">2025-01-15</span>
                              <Tooltip title="在当前标签页中打开">
                                <GlobalOutlined style={{ color: '#666', marginLeft: '8px', cursor: 'pointer' }} />
                              </Tooltip>
                              <Tooltip title="在新标签页中打开">
                                <ExportOutlined style={{ color: '#666', marginLeft: '4px', cursor: 'pointer' }} />
                              </Tooltip>
                            </div>
                          </div>
                          <div className="card-content">
                            <p>{item.description}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                    <div className="pagination-section">
                      <Pagination
                        current={categoryPagination.current}
                        total={categoryPagination.total}
                        pageSize={categoryPagination.pageSize}
                        onChange={handleCategoryPaginationChange}
                        showSizeChanger={false}
                        showQuickJumper={false}
                        showPrevNextJumpers={true}
                        showLessItems={true}
                        prevIcon="上一页"
                        nextIcon="下一页"
                      />
                    </div>
                  </React.Fragment>
                ) : (
                  <div className="category-info">
                    <InboxOutlined className="empty-icon" />
                    <h3>暂无知识内容</h3>
                    <p>当前分类下暂无知识内容，请稍后再试</p>
                  </div>
                )}
              </div>
            ) : (
              <React.Fragment>
                {searchLoading ? (
                  <div className="search-loading">
                    <Spin size="large" />
                    <p>正在加载知识内容...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <React.Fragment>
                    <div className="results-grid">
                      {searchResults.map((item) => (
                        <Card
                          key={item.id}
                          className="result-card"
                          onClick={() => handleResultClick(item)}
                          style={{ cursor: 'pointer', marginBottom: '16px' }}
                        >
                          <div className="card-header">
                            <div className="card-title">
                              <FileTextOutlined className="file-icon" style={{ color: '#1890ff', marginRight: '8px' }} />
                              <span className="title-text">{item.displayName || item.name}</span>
                            </div>
                            <div className="card-actions">
                             
                              <span className="date-text">2025-01-15</span>
                              <Tooltip title="在当前标签页中打开">
                                <GlobalOutlined style={{ color: '#666', marginLeft: '8px', cursor: 'pointer' }} />
                              </Tooltip>
                              <Tooltip title="在新标签页中打开">
                                <ExportOutlined style={{ color: '#666', marginLeft: '4px', cursor: 'pointer' }} />
                              </Tooltip>
                            </div>
                          </div>
                          <div className="card-content">
                            <p>{item.description}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                    <div className="pagination-section">
                      <Pagination
                        current={searchPagination.current}
                        total={searchPagination.total}
                        pageSize={searchPagination.pageSize}
                        onChange={handleSearchPaginationChange}
                        showSizeChanger={false}
                        showQuickJumper={false}
                        showPrevNextJumpers={true}
                        showLessItems={true}
                        prevIcon="上一页"
                        nextIcon="下一页"
                      />
                    </div>
                  </React.Fragment>
                ) : searchValue ? (
                  <div className="search-empty">
                    <InboxOutlined className="empty-icon" />
                    <h3>暂无知识内容</h3>
                    <p>当前分类下暂无知识内容，请稍后再试</p>
                  </div>
                ) : (
                  <div className="search-placeholder">
                    <FolderOpenOutlined className="empty-icon" />
                    <h3>欢迎使用知识库</h3>
                    <p>请在搜索框中输入关键词，或点击左侧分类查看相关知识内容</p>
                  </div>
                )}
              </React.Fragment>
            )}
          </div>
        </Content>

        {/* 右侧Sources侧边栏 - 只在显示source模块时显示 */}
        {showAISourceModules && (
          <Sider className="sources-sider" width={420}>
          <div className="sources-header">
            <h3>Sources</h3>
          </div>

          <div className="sources-content">
            {references.length > 0 ? (
              references.map((reference, index) => (
                <Card 
                  key={reference.knowledgeId || index}
                  className="source-card" 
                  size="small"
                  onClick={() => handleSourceKnowledgeClick(reference)}
                  style={{ cursor: 'pointer', marginBottom: '12px' }}
                >
                  <div className="source-knowledge">
                    <FileTextOutlined className="file-icon" style={{ color: '#1890ff', marginRight: '8px' }} />
                    <div className="knowledge-info">
                      <div className="knowledge-name">{reference.knowledgeName}</div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="no-sources">
                <InboxOutlined style={{ fontSize: '24px', color: '#ccc', marginBottom: '8px' }} />
                <p style={{ color: '#999', margin: 0 }}>暂无相关来源</p>
              </div>
            )}
          </div>
        </Sider>
        )}

        {/* 知识详情弹窗 */}
        <KnowledgeDetailModal
          visible={knowledgeDetailVisible}
          knowledge={currentKnowledge}
          onClose={handleCloseKnowledgeDetail}
          loading={knowledgeDetailLoading}
        />
      </Layout>
    </Layout>
  );
});

export default Knowledge;
