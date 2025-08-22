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
  Modal,
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
import KnowledgeDetailContent from "../../components/KnowledgeDetailContent";
import { knowledgeAPI } from "../../api/knowledge";
import { engagementAPI } from "../../api/engagement";
import { chatAPI } from "../../api/chat";
import { useSearchHistoryStore, useKnowledgeStore } from "../../stores";
 
import "./Knowledge.scss";

const { Sider, Content } = Layout;
const { Search } = Input;

const Knowledge = observer(() => {

  
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const searchHistoryStore = useSearchHistoryStore();
  const knowledgeStore = useKnowledgeStore();
  const categoryId = searchParams.get('parent');
  

  
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
  const [sourcesLoading, setSourcesLoading] = useState(false); // Sources模块loading状态

  // 知识详情弹窗相关状态
  const [knowledgeDetailVisible, setKnowledgeDetailVisible] = useState(false);
  const [currentKnowledge, setCurrentKnowledge] = useState(null);
  const [knowledgeDetailLoading, setKnowledgeDetailLoading] = useState(false);
  
  // Sources弹窗相关状态
  const [sourcesModalVisible, setSourcesModalVisible] = useState(false);
  const [sourcesModalData, setSourcesModalData] = useState(null);
  const [sourcesModalLoading, setSourcesModalLoading] = useState(false);
  
  // 生成sessionId
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // 获取AI回答（用于搜索时）
  const fetchAIAnswer = async (question) => {
    setAiLoading(true);
    setAiAnswer(null);
    setReferences([]); // 清空之前的引用数据
    
    try {
      // 准备请求数据
      const requestData = {
        question: question,
        userId: "user123", // 这里应该从用户状态获取
        sessionId: generateSessionId(),
        knowledgeIds: [], // 搜索时不限制特定知识ID
        stream: true
      };
      
      await handleStreamResponse(requestData);
    } catch (error) {
      console.error('获取AI回答失败:', error);
      message.error('获取AI回答失败，请稍后重试');
    } finally {
      setAiLoading(false);
    }
  };

  // 处理流式AI响应
  const handleStreamResponse = async (requestData) => {
    console.log('开始流式请求:', requestData);
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` // 从localStorage获取token
      },
      body: JSON.stringify(requestData)
    });
    
    if (response.ok) {
      console.log('流式响应开始');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = '';
      let references = [];
      let buffer = '';
      let currentEvent = '';
      let currentData = '';
      let aiMessageId = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // 保留最后一行，因为它可能不完整
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7);
            currentData = ''; // 重置数据
            console.log('收到事件:', currentEvent);
          } else if (line.startsWith('data: ')) {
            currentData = line.slice(6);
            
            // 尝试解析JSON，如果失败则等待更多数据
            try {
              const parsed = JSON.parse(currentData);
              
              // 根据事件类型处理数据
              if (currentEvent === 'start') {
                console.log('RAG对话开始:', parsed.message);
              } else if (currentEvent === 'message') {
                if (parsed.content) {
                  answer += parsed.content;
                  console.log('收到AI回答内容:', parsed.content);
                  setAiAnswer({
                    answer: answer,
                    references: references,
                    recommendedQuestions: []
                  });
                  // 清除loading状态，显示内容
                  setAiLoading(false);
                }
              } else if (currentEvent === 'references') {
                // 转换数据格式以匹配Sources模块期望的格式，包含所有可用字段
                const formattedReferences = parsed.map(ref => ({
                  knowledgeId: ref.knowledge_id,
                  knowledgeName: ref.knowledge_name,
                  description: ref.description,
                  tags: ref.tags,
                  effectiveTime: ref.effective_time,
                  attachments: ref.attachments,
                  sourceFile: ref.source_file || ref.attachments?.[0] || '未知文件',
                  relevance: ref.relevance,
                  pageNum: ref.page_num,
                  chunkIndex: ref.chunk_index,
                  chunkType: ref.chunk_type,
                  bboxUnion: ref.bbox_union,
                  charStart: ref.char_start,
                  charEnd: ref.char_end
                }));
                references = formattedReferences;
                console.log('收到引用:', formattedReferences.length, '个');
                setReferences(formattedReferences);
              } else if (currentEvent === 'end') {
                console.log('RAG对话完成:', parsed.message);
                if (parsed.sessionId) {
                  window.__ragSessionId = parsed.sessionId;
                }
                if (parsed.messageId) {
                  aiMessageId = parsed.messageId;
                  window.__ragAnswerMessageId = parsed.messageId;
                }
                setAiLoading(false);
                return true;
              }
            } catch (e) {
              // 如果是JSON解析错误，可能是数据不完整，继续等待
              // 只有在数据看起来完整时才记录错误
              if (currentData.length > 10 && !currentData.includes('"')) {
                console.log('解析SSE数据失败，跳过此数据块:', e.message);
              }
            }
          }
        }
      }
      
      return true;
    } else {
      console.error('流式响应失败:', response.status);
      message.error('AI回答失败');
      return false;
    }
  };

  // 处理问题提交
  const handleQuestionSubmit = () => {
    if (!questionInput.trim()) {
      message.warning("请输入问题");
      return;
    }
    
    // 显示loading效果
    setAiLoading(true);
    
    // 延迟跳转，让用户看到loading效果
    setTimeout(() => {
      // 跳转到问答页面，并传递问题内容
      navigate("/knowledge-qa", { 
        state: { 
          question: questionInput.trim(),
          fromPage: "knowledge"
        } 
      });
    }, 500); // 显示500ms的loading效果
  };

  // 处理推荐问题点击
  const handleRecommendedQuestionClick = (question) => {
    // 显示loading效果
    setAiLoading(true);
    
    // 延迟跳转，让用户看到loading效果
    setTimeout(() => {
      // 跳转到问答页面，并传递问题内容
      navigate("/knowledge-qa", { 
        state: { 
          question: question,
          fromPage: "knowledge"
        } 
      });
    }, 500); // 显示500ms的loading效果
  };

  // 获取父知识下的子知识列表
  const fetchCategoryKnowledge = useCallback(async (categoryId, page = 1, size = 10) => {
    if (!categoryId) return;
    

    setCategoryLoading(true);
    try {
      const response = await knowledgeAPI.getChildren(categoryId, {
        page,
        size
      });
      

      
      if (response.code === 200) {
        const knowledgeList = response.data.records || [];
        
        // 将知识列表存储到store中
        knowledgeStore.setKnowledgeList(knowledgeList);
        
        // 根据实际API返回的数据结构进行调整
        setCategoryKnowledge(knowledgeList);
        setCategoryPagination(prev => ({
          ...prev,
          current: response.data.current || page,
          total: response.data.total || 0,
          pageSize: response.data.size || size
        }));

      } else {
        message.error(response.message || '获取子知识列表失败');
        console.error('子知识API错误:', response.message);
      }
    } catch (error) {
      console.error('获取分类知识列表失败:', error);
      message.error('获取分类知识列表失败');
    } finally {
      setCategoryLoading(false);
    }
  }, [knowledgeStore]);

  // 处理分类知识列表分页
  const handleCategoryPaginationChange = (page, pageSize) => {
    fetchCategoryKnowledge(categoryId, page, pageSize);
  };

  // 获取搜索结果
  const fetchSearchResults = useCallback(async (query, page = 1, size = 10) => {
    if (!query || !query.trim()) return;
    

    setSearchLoading(true);
    // 搜索时也显示AI模块和Sources模块的loading效果
    setAiLoading(true);
    setSourcesLoading(true);
    try {
      const response = await knowledgeAPI.searchKnowledgeByQuery({
        query: query.trim(),
        page: page , 
        size: size
      });
      

      
      if (response.code === 200) {

        // 处理搜索结果，如果name为空则使用description的前50个字符作为标题
        const processedResults = (response.data.esResults || []).map(item => ({
          ...item,
          name: item.name || item.description?.substring(0, 50) + '...' || '无标题',
          displayName: item.name || item.description?.substring(0, 50) + '...' || '无标题'
        }));
        
        // 将搜索结果存储到store中
        knowledgeStore.setKnowledgeList(processedResults);
        
        setSearchResults(processedResults);
        setSearchPagination(prev => ({
          ...prev,
          current: page,
          total: response.data.total || 0,
          pageSize: size
        }));
        
        // 处理RAG结果（AI回答和引用）
        if (response.data.ragResults && response.data.ragResults.length > 0) {
          const ragResult = response.data.ragResults[0];
          
          // 设置AI回答
          if (ragResult.answer) {
            setAiAnswer({
              answer: ragResult.answer,
              references: ragResult.references || [],
              recommendedQuestions: ragResult.recommendedQuestions || [],
              sessionId: ragResult.sessionId,
              messageId: ragResult.messageId
            });
            // 设置AI回答后立即清除loading状态
            setAiLoading(false);
          }
          
          // 设置引用数据
          if (ragResult.references && Array.isArray(ragResult.references)) {
            // 转换数据格式以匹配Sources模块期望的格式
            const formattedReferences = ragResult.references.map(ref => ({
              knowledgeId: ref.knowledgeId,
              knowledgeName: ref.knowledgeName,
              description: ref.description,
              tags: ref.tags,
              effectiveTime: ref.effectiveTime,
              attachments: ref.attachments,
              sourceFile: ref.sourceFile || ref.attachments?.[0] || '未知文件'
            }));
            setReferences(formattedReferences);
            console.log('从搜索API设置引用:', formattedReferences.length, '个');
            // 设置引用数据后立即清除Sources loading状态
            setSourcesLoading(false);
          }
          // 无论是否有引用，均保存会话与回答ID（用于点赞/点踩）
          if (ragResult.sessionId) { window.__ragSessionId = ragResult.sessionId; }
          if (ragResult.messageId) { window.__ragAnswerMessageId = ragResult.messageId; }
        } else {
          // 如果没有RAG结果，也要清除loading状态
          setAiLoading(false);
          setSourcesLoading(false);
        }
        
        console.log('搜索API响应:', response.data);

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
      // 如果没有RAG结果，在这里清除AI和Sources模块的loading状态
      // 如果有RAG结果，loading状态已经在上面清除了
    }
  }, [knowledgeStore]);

  // 处理搜索
  const handleSearch = (value) => {

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
    // 监控状态变化
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

  // 在当前页面打开知识详情
  const handleOpenInCurrentPage = (item) => {
    // 使用新的知识详情页面路由
    const categoryParam = categoryId ? `?category=${categoryId}` : '';
    navigate(`/knowledge-detail/${item.id}${categoryParam}`);
  };

  // 在新页面打开知识详情
  const handleOpenInNewPage = (item) => {
    const categoryParam = categoryId ? `?category=${categoryId}` : '';
    const url = `/knowledge-detail/${item.id}${categoryParam}`;
    window.open(url, '_blank');
  };

  // 打开Sources弹窗
  const handleOpenSourcesModal = async (reference) => {
    setSourcesModalVisible(true);
    setSourcesModalLoading(true);
    setSourcesModalData(null);
    
    try {
      const response = await knowledgeAPI.getKnowledgeDetail(reference.knowledgeId);
      if (response.code === 200) {
        setSourcesModalData(response.data);
      } else {
        message.error(response.message || '获取知识详情失败');
      }
    } catch (error) {
      console.error('获取知识详情失败:', error);
      message.error('获取知识详情失败，请稍后重试');
    } finally {
      setSourcesModalLoading(false);
    }
  };

  // 关闭Sources弹窗
  const handleCloseSourcesModal = () => {
    setSourcesModalVisible(false);
    setSourcesModalData(null);
    setSourcesModalLoading(false);
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
                      <Space size="small" style={{ marginLeft: 8 }}>
                        <Tooltip title="点赞此回答">
                          <Button
                            type="text"
                            icon={<LikeOutlined />}
                            onClick={async () => {
                              try {
                                if (window.__ragSessionId && window.__ragAnswerMessageId) {
                                  await engagementAPI.likeAnswer(window.__ragSessionId, window.__ragAnswerMessageId);
                                } else {
                                  await engagementAPI.like(aiAnswer.references[0]?.knowledgeId || 0);
                                }
                                message.success("已点赞");
                              } catch (e) { message.error("点赞失败"); }
                            }}
                          />
                        </Tooltip>
                        <Tooltip title="点踩（可选填写原因）">
                          <Button
                            type="text"
                            icon={<DislikeOutlined />}
                            onClick={() => {
                              Modal.confirm({
                                title: "点踩原因",
                                content: (
                                  <Input.TextArea id="ai-dislike-reason" rows={3} placeholder="请填写不满意原因，如不准确/不完整/参考不相关等" />
                                ),
                                okText: "提交",
                                cancelText: "取消",
                                onOk: async () => {
                                  const reason = document.getElementById("ai-dislike-reason")?.value || "";
                                  try {
                                    if (window.__ragSessionId && window.__ragAnswerMessageId) {
                                      await engagementAPI.dislikeAnswer(window.__ragSessionId, window.__ragAnswerMessageId, reason);
                                    } else {
                                      await engagementAPI.feedback(aiAnswer.references[0]?.knowledgeId || 0, reason);
                                    }
                                    message.success("已提交反馈");
                                  } catch (e) { message.error("提交失败"); }
                                },
                                onCancel: async () => {
                                  try {
                                    // 取消也记录一次点踩（空原因）
                                    if (window.__ragSessionId && window.__ragAnswerMessageId) {
                                      await engagementAPI.dislikeAnswer(window.__ragSessionId, window.__ragAnswerMessageId, "");
                                    } else {
                                      await engagementAPI.feedback(aiAnswer.references[0]?.knowledgeId || 0, "");
                                    }
                                    message.success("已记录点踩");
                                  } catch (e) { message.error("记录失败"); }
                                }
                              });
                            }}
                          />
                        </Tooltip>
                      </Space>
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
                      if (!e.shiftKey) {
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
                              <Tooltip title="在当前页面打开">
                                <GlobalOutlined 
                                  style={{ color: '#666', marginLeft: '8px', cursor: 'pointer' }} 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenInCurrentPage(item);
                                  }}
                                />
                              </Tooltip>
                              <Tooltip title="在新页面打开">
                                <ExportOutlined 
                                  style={{ color: '#666', marginLeft: '4px', cursor: 'pointer' }} 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenInNewPage(item);
                                  }}
                                />
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
                              <Tooltip title="在当前页面打开">
                                <GlobalOutlined 
                                  style={{ color: '#666', marginLeft: '8px', cursor: 'pointer' }} 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenInCurrentPage(item);
                                  }}
                                />
                              </Tooltip>
                              <Tooltip title="在新页面打开">
                                <ExportOutlined 
                                  style={{ color: '#666', marginLeft: '4px', cursor: 'pointer' }} 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenInNewPage(item);
                                  }}
                                />
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
            {sourcesLoading ? (
              <div className="sources-loading">
                <Spin size="large" />
                <p style={{ color: '#999', marginTop: '16px' }}>正在查找相关来源...</p>
              </div>
            ) : references.length > 0 ? (
              references.map((reference, index) => (
                <Card 
                  key={reference.knowledgeId || index}
                  className="source-card" 
                  size="small"
                  style={{ cursor: 'pointer', marginBottom: '12px' }}
                  onClick={() => handleOpenSourcesModal(reference)}
                >
                  <div className="source-knowledge">
                    <FileTextOutlined className="file-icon" style={{ color: '#1890ff', marginRight: '8px' }} />
                    <div className="knowledge-info">
                      <div className="knowledge-name">{reference.knowledgeName}</div>
                    </div>
                    <div className="source-actions">
                      <Tooltip title="在当前页面打开">
                        <GlobalOutlined 
                          style={{ color: '#666', marginLeft: '8px', cursor: 'pointer' }} 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenInCurrentPage(reference);
                          }}
                        />
                      </Tooltip>
                      <Tooltip title="在新页面打开">
                        <ExportOutlined 
                          style={{ color: '#666', marginLeft: '4px', cursor: 'pointer' }} 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenInNewPage(reference);
                          }}
                        />
                      </Tooltip>
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

        {/* Sources弹窗 */}
        <Modal
          title="知识详情"
          open={sourcesModalVisible}
          onCancel={handleCloseSourcesModal}
          footer={null}
          width={800}
                              destroyOnHidden
          style={{ top: 20 }}
        >
          <div style={{ height: '70vh', overflow: 'hidden' }}>
            <KnowledgeDetailContent 
              knowledgeDetail={sourcesModalData} 
              loading={sourcesModalLoading} 
            />
          </div>
        </Modal>
      </Layout>
    </Layout>
  );
});

export default Knowledge;
