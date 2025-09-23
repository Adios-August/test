import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  Select,
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
  LikeFilled,
  DislikeOutlined,
  DislikeFilled,
  DownOutlined,
  SendOutlined,
  CalendarOutlined,
  InboxOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
  ExportOutlined,
  HeartOutlined,
  HeartFilled,
} from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import CommonSidebar from "../../components/CommonSidebar";
import KnowledgeDetailModal from "../../components/KnowledgeDetailModal";
import KnowledgeDetailContent from "../../components/KnowledgeDetailContent";
import SourceExpandedDetail from "../../components/SourceExpandedDetail";
import { knowledgeAPI } from "../../api/knowledge";
import { engagementAPI } from "../../api/engagement";
import { chatAPI } from "../../api/chat";
import { feedbackAPI } from "../../api/feedback";
import { homeAPI } from "../../api/home";
import { useKnowledgeStore, useAuthStore } from "../../stores";
import { addSearchHistory } from "../../utils/searchHistoryAPI";

import "./Knowledge.scss";

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


const { Sider, Content } = Layout;
const { Search } = Input;

const Knowledge = observer(() => {


  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const knowledgeStore = useKnowledgeStore();
  const authStore = useAuthStore();
  const categoryId = searchParams.get('parent');

  // 获取当前用户ID
  const currentUserId = authStore.user?.id || authStore.user?.userId;




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

  // 收藏相关状态
  const [favoriteStates, setFavoriteStates] = useState({});
  const [favoriteLoading, setFavoriteLoading] = useState({});

  // 反馈相关状态
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState("");

  // 选中知识项详情相关状态
  const [selectedKnowledgeDetail, setSelectedKnowledgeDetail] = useState(null);
  const [selectedKnowledgeLoading, setSelectedKnowledgeLoading] = useState(false);

  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackPosition, setFeedbackPosition] = useState({ x: 0, y: 0 });

  // Sources弹窗相关状态
  const [sourcesModalVisible, setSourcesModalVisible] = useState(false);
  const [sourcesModalData, setSourcesModalData] = useState(null);
  const [sourcesModalLoading, setSourcesModalLoading] = useState(false);

  // Sources展开状态管理
  const [expandedSources, setExpandedSources] = useState({});
  const [expandedSourceData, setExpandedSourceData] = useState({});
  const [expandedSourceLoading, setExpandedSourceLoading] = useState({});

  // 防止重复搜索的ref
  const hasSearchedFromHome = useRef(false);
  // 防止AI模块被重复隐藏的ref
  const shouldKeepAIModule = useRef(false);

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
        userId: currentUserId, // 从用户状态获取
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
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` // 从localStorage获取token
      },
      body: JSON.stringify(requestData)
    });

    if (response.ok) { 
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
          } else if (line.startsWith('data: ')) {
            currentData = line.slice(6);

            // 尝试解析JSON，如果失败则等待更多数据
            try {
              const parsed = JSON.parse(currentData);

              // 根据事件类型处理数据
              if (currentEvent === 'start') { 
              } else if (currentEvent === 'message') {
                if (parsed.content) {
                  answer += parsed.content; 
                  setAiAnswer({
                    answer: answer,
                    references: references,
                    recommendedQuestions: [],
                    isLiked: false,
                    isDisliked: false
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
                setReferences(formattedReferences);
              } else if (currentEvent === 'end') { 
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
      // 跳转到问答页面，使用URL参数而不是state
      const encodedQuestion = encodeURIComponent(questionInput.trim());
      navigate(`/knowledge-qa/${encodedQuestion}/knowledge`, { replace: true });
    }, 500); // 显示500ms的loading效果
  };

  // 处理推荐问题点击
  const handleRecommendedQuestionClick = (question) => {
    // 显示loading效果
    setAiLoading(true);

    // 延迟跳转，让用户看到loading效果
    setTimeout(() => {
      // 跳转到问答页面，使用params参数传递问题内容
      const encodedQuestion = encodeURIComponent(question);
      navigate(`/knowledge-qa/${encodedQuestion}/knowledge`);
    }, 500); // 显示500ms的loading效果
  };

  // 处理AI回答的反馈（点赞/点踩）
  const handleAIFeedback = async (type, event) => {
    if (!aiAnswer) return;

    if (type === "dislike") {
      // 如果已经点踩，则取消点踩
      if (aiAnswer.isDisliked) {
        try {
          const response = await engagementAPI.undislikeAnswer(
            aiAnswer.sessionId,
            aiAnswer.messageId,
            currentUserId
          );
          
          if (response.code === 200) {
            message.success('已取消点踩');
            // 立即更新UI状态，让点踩图标变暗
            setAiAnswer(prev => ({
              ...prev,
              isDisliked: false
            }));
          } else {
            message.error(response.message || '取消点踩失败');
          }
        } catch (error) {
          console.error('取消点踩失败:', error);
          message.error('操作失败，请重试');
        }
        return;
      }

      // 点踩时需要打开反馈弹窗
      // 获取点踩按钮的位置
      const button = event?.target?.closest('.ant-btn');
      if (button) {
        const rect = button.getBoundingClientRect();
        const modalWidth = 500;
        const modalHeight = 300;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // 计算弹窗位置，确保不超出屏幕边界
        let x = rect.left;
        let y = rect.bottom + 10;

        // 如果弹窗会超出右边界，则向左调整
        if (x + modalWidth > windowWidth) {
          x = windowWidth - modalWidth - 20;
        }

        // 如果弹窗会超出下边界，则向上调整
        if (y + modalHeight > windowHeight) {
          y = rect.top - modalHeight - 10;
        }

        // 确保不超出左边界和上边界
        x = Math.max(20, x);
        y = Math.max(20, y);

        setFeedbackPosition({ x, y });
      }

      setFeedbackModalVisible(true);
      return;
    }

    // 点赞/取消点赞逻辑
    try {
      let response;
      if (aiAnswer.isLiked) {
        // 如果已经点赞，则取消点赞
        response = await engagementAPI.unlikeAnswer(
          aiAnswer.sessionId,
          aiAnswer.messageId,
          currentUserId
        );
        
        if (response.code === 200) {
          message.success('已取消点赞');
          // 立即更新UI状态，让点赞图标变暗
          setAiAnswer(prev => ({
            ...prev,
            isLiked: false
          }));
        } else {
          message.error(response.message || '取消点赞失败');
        }
      } else {
        // 如果未点赞，则点赞
        response = await engagementAPI.likeAnswer(
          aiAnswer.sessionId,
          aiAnswer.messageId,
          currentUserId
        );
        
        if (response.code === 200) {
          message.success('已点赞该回答');
          // 立即更新UI状态，让点赞图标变亮
          setAiAnswer(prev => ({
            ...prev,
            isLiked: true
          }));
        } else {
          message.error(response.message || '点赞失败');
        }
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
      message.error('操作失败，请重试');
    }
  };

  // 提交反馈弹窗中的反馈
  const handleSubmitFeedback = async () => {
    if (!currentUserId) {
      message.error('请先登录');
      return;
    }

    try {
      // 点击确定：带着消息提交点踩
      const response = await engagementAPI.dislikeAnswer(
        aiAnswer.sessionId,
        aiAnswer.messageId,
        feedbackContent.trim(), // 带着反馈内容
        currentUserId
      );

      if (response.code === 200) {
        message.success("点踩提交成功");
        setFeedbackModalVisible(false);
        setFeedbackContent("");
        // 立即更新UI状态，让点踩图标变亮
        setAiAnswer(prev => ({
          ...prev,
          isDisliked: true
        }));
      } else {
        message.error(response.message || "提交失败，请重试");
      }
    } catch (error) {
      console.error('点踩失败:', error);
      message.error("提交失败，请重试");
    }
  };

  // 取消反馈弹窗
  const handleCancelFeedback = async () => {
    if (!currentUserId) {
      message.error('请先登录');
      return;
    }

    try {
      // 点击取消：直接提交点踩（不带消息）
      const response = await engagementAPI.dislikeAnswer(
        aiAnswer.sessionId,
        aiAnswer.messageId,
        "", // 空内容
        currentUserId
      );

      if (response.code === 200) {
        message.success("点踩提交成功");
        setFeedbackModalVisible(false);
        setFeedbackContent("");
        // 立即更新UI状态，让点踩图标变亮
        setAiAnswer(prev => ({
          ...prev,
          isDisliked: true
        }));
      } else {
        message.error(response.message || "提交失败，请重试");
      }
    } catch (error) {
      console.error('点踩失败:', error);
      message.error("提交失败，请重试");
    }
  };

  // 获取分类知识列表
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

        // 注释：不再自动选择第一个知识项，因为在handleCategoryClick中已经获取分类详情

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
  }, []); // 移除所有依赖项，避免无限循环

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
        page: page,
        size: size,
        userId: currentUserId
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
              messageId: ragResult.messageId,
              isLiked: false,
              isDisliked: false
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
              sourceFile: ref.sourceFile || ref.attachments?.[0] || '未知文件',
              bbox_union: ref.bbox_union,
              bboxUnion: ref.bboxUnion
            }));
            setReferences(formattedReferences); 
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
  }, []); // 移除所有依赖项，避免无限循环

  // 处理搜索
  const handleSearch = (value) => { 

    setSearchValue(value);
    // 清空之前的搜索结果
    setSearchResults([]);

    if (value.trim()) {
      // 添加搜索历史
      addSearchHistory(value.trim());

      setCurrentCategoryId(1);
      setIsCategorySearchMode(true); // 进入搜索模式
      fetchSearchResults(value.trim(), 1, 10);
      // 搜索时显示AI和source模块 
      setShowAISourceModules(true);
      shouldKeepAIModule.current = true; // 设置为true，表示需要保持AI模块显示
    } else {
      // 如果搜索框为空，隐藏AI和source模块 
      setShowAISourceModules(false);
      setIsCategorySearchMode(false);
      setSearchResults([]);
      shouldKeepAIModule.current = false; // 设置为false，表示不需要保持AI模块显示
    }
  };



  // 处理搜索分页
  const handleSearchPaginationChange = (page, pageSize) => {
    // 使用当前搜索关键词
    if (searchValue.trim()) {
      fetchSearchResults(searchValue.trim(), page, pageSize);
    }
  };



  // 当categoryId变化时获取分类知识列表和详情
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
      fetchCategoryKnowledge(categoryId, 1, 10); // 从第一页开始加载
      // 获取分类详情
      fetchSelectedKnowledgeDetail(categoryId);
      // 隐藏AI和sourceModules
      setShowAISourceModules(false);
      shouldKeepAIModule.current = false; // 切换分类时，确保AI模块不保持显示
    }
    // 移除else分支，避免在categoryId为null时执行不必要的逻辑
  }, [categoryId]); // 移除fetchCategoryKnowledge依赖，避免无限循环

  // 组件初始化时清空搜索结果并获取默认内容
  useEffect(() => {
    
    setSearchResults([]);
    setSearchValue('');
    setCurrentCategoryId(null);
    
    if (!location.state?.searchKeyword && !shouldKeepAIModule.current) { 
      setShowAISourceModules(false);
    }
    
    // 如果没有分类ID且没有搜索关键词，获取默认的知识详情
    if (!categoryId && !location.state?.searchKeyword) {
      fetchDefaultKnowledgeDetail();
    }
  }, [location.state?.searchKeyword]);
  
  // 获取默认知识详情和列表（模拟侧边栏分类点击的行为）
  const fetchDefaultKnowledgeDetail = async () => {
    try {
      // 获取最新知识列表
      const response = await homeAPI.getLatestKnowledge(10); // 获取10条最新知识作为列表
      
      if (response.code === 200 && response.data && response.data.length > 0) {
        // 设置知识列表到分类知识状态中，模拟分类点击后的列表显示
        setCategoryKnowledge(response.data);
        setIsCategorySearchMode(true); // 进入分类搜索模式以显示列表
        
        // 获取第一个知识的详情
        const latestKnowledge = response.data[0];
        fetchSelectedKnowledgeDetail(latestKnowledge.id);
      }
    } catch (error) {
      console.error('获取默认知识详情失败:', error);
    }
  };

  // 处理侧边栏分类点击（不依赖URL参数变化）
  const handleCategoryClick = (category, isTopLevel) => {
    // 清空之前的搜索结果
    setSearchResults([]);
    // 使用分类ID获取知识列表（进入分类搜索模式）
    setIsCategorySearchMode(true);
    setCurrentCategoryId(category.id);
    // 不更新搜索框内容，保持用户输入的内容
    // 使用分类知识接口获取该分类下的知识
    fetchCategoryKnowledge(category.id, 1, 10); // 从第一页开始加载
    // 获取当前点击分类的详情
    fetchSelectedKnowledgeDetail(category.id);
    // 隐藏AI和source模块
    setShowAISourceModules(false);
    shouldKeepAIModule.current = false; // 切换分类时，确保AI模块不保持显示
  };

  // 处理从首页传递的搜索关键词
  useEffect(() => {
    
    
    if (location.state?.searchKeyword && !hasSearchedFromHome.current) {
      const keyword = location.state.searchKeyword; 
      hasSearchedFromHome.current = true;
      setSearchValue(keyword);
      // 自动触发搜索（handleSearch现在会自动设置showAISourceModules为true）
      handleSearch(keyword);
      // 清空location.state，避免重复触发
      navigate(location.pathname + location.search, { replace: true });
    }
  }, [location.state?.searchKeyword]); // 只依赖searchKeyword，不依赖整个location.state对象

  // 处理知识卡片点击
  const handleResultClick = (item) => {
    // 跳转到知识详情页面
    const knowledgeId = item.id || item.knowledgeId;
    if (knowledgeId) {
      navigate(`/knowledge/${knowledgeId}`);
    } else {
      message.error('知识ID不存在');
    }
  };

  // 处理知识项点击（跳转到知识详情页面）
  const handleKnowledgeDetailClick = (item) => {
    console.log('点击的知识卡片:', item);
    const knowledgeId = item.id || item._id || item.knowledgeId;
    console.log('知识ID:', knowledgeId);
    
    if (knowledgeId) {
      // 跳转到带搜索列表的知识详情页面
      const categoryParam = categoryId ? `?category=${categoryId}` : '';
      navigate(`/knowledge/${knowledgeId}${categoryParam}`);
    } else {
      console.error('无法获取知识ID，知识项数据:', item);
      message.error('知识ID不存在');
    }
  };

  // 在新页面打开知识详情
  const handleOpenInNewPage = (item) => {
    const knowledgeId = item.id || item._id || item.knowledgeId;
    if (knowledgeId) {
      const categoryParam = categoryId ? `?category=${categoryId}` : '';
      window.open(`/knowledge-detail/${knowledgeId}${categoryParam}`, '_blank');
    } else {
      message.error('知识ID不存在');
    }
  };

  // 切换AI和source模块显示状态
  const toggleAISourceModules = () => {
    setShowAISourceModules(!showAISourceModules);
  };



  // 处理收藏/取消收藏
  const handleFavorite = async (knowledgeId, event) => {
    event?.stopPropagation();
    if (!knowledgeId || favoriteLoading[knowledgeId]) return;

    setFavoriteLoading(prev => ({ ...prev, [knowledgeId]: true }));
    try {
      const isCurrentlyFavorited = favoriteStates[knowledgeId];

      if (isCurrentlyFavorited) {
        // 取消收藏
        const response = await knowledgeAPI.unfavoriteKnowledge(knowledgeId);
        if (response.code === 200) {
          setFavoriteStates(prev => ({ ...prev, [knowledgeId]: false }));
          message.success('已取消收藏');
        } else {
          message.error(response.message || '取消收藏失败');
        }
      } else {
        // 添加收藏
        const response = await knowledgeAPI.favoriteKnowledge(knowledgeId);
        if (response.code === 200) {
          setFavoriteStates(prev => ({ ...prev, [knowledgeId]: true }));
          message.success('已添加到收藏');
        } else {
          message.error(response.message || '收藏失败');
        }
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      message.error('操作失败，请重试');
    } finally {
      setFavoriteLoading(prev => ({ ...prev, [knowledgeId]: false }));
    }
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

  // 获取选中知识项的详情
  const fetchSelectedKnowledgeDetail = async (knowledgeId) => {
   
    
    if (!knowledgeId) return;

    setSelectedKnowledgeLoading(true);
    try {
      const response = await knowledgeAPI.getKnowledgeDetail(knowledgeId);
 

      if (response.code === 200) {
        setSelectedKnowledgeDetail(response.data);
      } else {
        message.error(response.message || '获取知识详情失败');
        setSelectedKnowledgeDetail(null);
      }
    } catch (error) {
      console.error('获取知识详情失败:', error);
      message.error('获取知识详情失败');
      setSelectedKnowledgeDetail(null);
    } finally {
      setSelectedKnowledgeLoading(false);
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
    // 使用正确的知识详情页面路由
    const categoryParam = categoryId ? `?category=${categoryId}` : '';
    const knowledgeId = item.id || item.knowledgeId;
    if (knowledgeId) {
      navigate(`/knowledge-detail/${knowledgeId}${categoryParam}`);
    } else {
      message.error('知识ID不存在');
    }
  };



  // 切换Sources展开状态
  const handleToggleSourceExpansion = async (reference) => {
    const knowledgeId = reference.knowledgeId;
    const isCurrentlyExpanded = expandedSources[knowledgeId];

    if (isCurrentlyExpanded) {
      // 收起
      setExpandedSources(prev => ({ ...prev, [knowledgeId]: false }));
      setExpandedSourceData(prev => {
        const newData = { ...prev };
        delete newData[knowledgeId];
        return newData;
      });
      setExpandedSourceLoading(prev => {
        const newLoading = { ...prev };
        delete newLoading[knowledgeId];
        return newLoading;
      });
    } else {
      // 展开
      setExpandedSources(prev => ({ ...prev, [knowledgeId]: true }));
      setExpandedSourceLoading(prev => ({ ...prev, [knowledgeId]: true }));

      try {
        const response = await knowledgeAPI.getKnowledgeDetail(knowledgeId);
        if (response.code === 200) {
          setExpandedSourceData(prev => ({ ...prev, [knowledgeId]: response.data }));
        } else {
          message.error(response.message || '获取知识详情失败');
        }
      } catch (error) {
        console.error('获取知识详情失败:', error);
        message.error('获取知识详情失败，请稍后重试');
      } finally {
        setExpandedSourceLoading(prev => ({ ...prev, [knowledgeId]: false }));
      }
    }
  };

  // 打开Sources弹窗（保留原有功能，以防其他地方需要）
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
                    <div className="message-actions">
                      <span style={{color:'#db0011'}}>Learn More</span>
                      {aiAnswer.references && aiAnswer.references.length > 0 && (
                        <Button type="link" size="small" icon={<FilePdfOutlined />}>
                          {aiAnswer.references[0].sourceFile}
                        </Button>
                      )}
                      <Tooltip title={aiAnswer?.isLiked ? "取消点赞" : "点赞回答"}>
                        <Button
                          type="text"
                          size="small"
                          icon={aiAnswer?.isLiked ? <LikeFilled style={{ color: 'var(--ant-color-primary)' }} /> : <LikeOutlined />}
                          onClick={() => handleAIFeedback("like")}
                        />
                      </Tooltip>
                      <Tooltip title={aiAnswer?.isDisliked ? "取消点踩" : "点踩回答（需要填写反馈）"}>
                        <Button
                          type="text"
                          size="small"
                          icon={aiAnswer?.isDisliked ? <DislikeFilled style={{ color: 'var(--ant-color-primary)' }} /> : <DislikeOutlined />}
                          onClick={(e) => handleAIFeedback("dislike", e)}
                        />
                      </Tooltip>
                    </div>
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
            {/* 选中知识项详情展示 - 只在没有AI模块时显示 */}
            {selectedKnowledgeDetail && !showAISourceModules && (
              <div className="selected-knowledge-detail" style={{ marginBottom: '24px' }}>
                <KnowledgeDetailContent
                  knowledgeDetail={selectedKnowledgeDetail}
                  loading={selectedKnowledgeLoading}
                  showBackButton={false}
                  showEmailButton={false}
                />
              </div>
            )}
            
            {showAISourceModules && (
              <div className="results-header">
                <span className="results-count">共找到{searchResults.length}个结果</span>
                 
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
                          onClick={() => handleKnowledgeDetailClick(item)}
                          style={{ cursor: 'pointer', marginBottom: '16px' }}
                        >
                          <div className="card-header">
                            <div className="card-title">
                              <FileTextOutlined className="file-icon" style={{ color: '#1890ff', marginRight: '8px' }} />
                              <span className="title-text">{item.name}</span>
                            </div>
                            <div className="card-actions">

                              <span className="date-text">2025-01-15</span>
                              <Tooltip title="在当前页面打开">
                                <GlobalOutlined
                                  style={{ color: '#666', marginLeft: '4px', cursor: 'pointer' }}
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
                            <p>{stripHtmlTags(item.description)}</p>
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
                          onClick={() => handleKnowledgeDetailClick(item)}
                          style={{ cursor: 'pointer', marginBottom: '16px' }}
                        >
                          <div className="card-header">
                            <div className="card-title">
                              <FileTextOutlined className="file-icon" style={{ color: '#1890ff', marginRight: '8px' }} />
                              <span className="title-text">{item.name}</span>
                            </div>

                            <div className="card-actions">
                          
                              <span className="date-text">2025-01-15</span>

                           
                              <Tooltip title="在当前页面打开">
                                <GlobalOutlined
                                  style={{ color: '#666', marginLeft: '4px', cursor: 'pointer' }}
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
                            <p>{stripHtmlTags(item.description)}</p>
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
                          onClick={() => handleKnowledgeDetailClick(item)}
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
                            <p>{stripHtmlTags(item.description)}</p>
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
                    <h3>{showAISourceModules ? '暂无知识内容' : '暂无搜索结果'}</h3>
                    <p>{showAISourceModules ? '当前分类下暂无知识内容，请稍后再试' : `未找到与"${searchValue}"相关的知识内容，请尝试其他关键词`}</p>
                  </div>
                ) : showAISourceModules ? (
                  // 有AI模块时，显示搜索相关的空状态
                  <div className="search-empty">
                    <InboxOutlined className="empty-icon" />
                    <h3>暂无知识内容</h3>
                    <p>当前分类下暂无知识内容，请稍后再试</p>
                  </div>
                ) : categoryKnowledge.length > 0 ? (
                  // 没有搜索时，显示分类知识
                  <div className="category-content">
                    <div className="results-grid">
                      {categoryKnowledge.map((item) => (
                        <Card
                          key={item.id}
                          className="result-card"
                          onClick={() => handleKnowledgeDetailClick(item)}
                          style={{ cursor: 'pointer', marginBottom: '16px' }}
                        >
                          <div className="card-header">
                            <div className="card-title">
                              <FileTextOutlined className="file-icon" style={{ color: '#1890ff', marginRight: '8px' }} />
                              <span className="title-text">{item.name}</span>
                            </div>
                            <div className="card-actions">
                              <span className="date-text">2025-01-15</span>
                              <Tooltip title="在当前页面打开">
                                <GlobalOutlined
                                  style={{ color: '#666', marginLeft: '4px', cursor: 'pointer' }}
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
                            <p>{stripHtmlTags(item.description)}</p>
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
                  </div>
                ) : (
                  <div className="search-placeholder">
                    <FolderOpenOutlined className="empty-icon" />
                    <h3>欢迎使用 SMART SEARCH</h3>
                    <p>请在搜索框中输入关键词，或点击左侧分类查看相关知识内容</p>
                  </div>
                )}
              </React.Fragment>
            )}
          </div>
        </Content>

        {/* 右侧Sources侧边栏 - 只在显示source模块时显示 */}
        {showAISourceModules && (
          <Sider className="sources-sider" width={650}>
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
                  <div key={reference.knowledgeId || index}>
                    <Card
                      className="source-card"
                      size="small"
                      style={{ cursor: 'pointer', marginBottom: '12px' }}
                      onClick={() => handleToggleSourceExpansion(reference)}
                    >
                      <div className="source-knowledge">
                        <FileTextOutlined className="file-icon" style={{ color: '#1890ff', marginRight: '8px' }} />
                        <div className="knowledge-info">
                          <div className="knowledge-name">{reference.knowledgeName}</div>
                        </div>
                        <div className="source-actions">
                          <Tooltip title="在当前页面打开">
                            <GlobalOutlined
                              style={{ color: '#666', marginLeft: '4px', cursor: 'pointer' }}
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

                    {/* 展开的知识详情 */}
                    {expandedSources[reference.knowledgeId] && (
                      <Card
                        className="expanded-source-detail"
                        size="small"
                        style={{ marginBottom: '12px' }}
                      >
                        {/* 展开详情的头部，包含收起按钮 */}
                        <div className="expanded-detail-header" style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                            {reference.knowledgeName}
                          </span>
                          <Button
                            type="text"
                            size="small"
                            icon={<CloseOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSourceExpansion(reference);
                            }}
                            style={{
                              color: '#999',
                              padding: '4px 8px',
                              height: 'auto'
                            }}
                          >
                            收起
                          </Button>
                        </div>

                        <div className="expanded-detail-content">
                          {expandedSourceLoading[reference.knowledgeId] ? (
                            <div style={{ padding: '16px', textAlign: 'center' }}>
                              <Spin size="small" />
                              <p style={{ margin: '8px 0 0 0', color: '#999' }}>加载中...</p>
                            </div>
                          ) : expandedSourceData[reference.knowledgeId] ? (
                            <SourceExpandedDetail
                              knowledgeDetail={{
                                ...expandedSourceData[reference.knowledgeId],
                                bbox_union: reference.bbox_union,
                                bboxUnion: reference.bboxUnion
                              }}
                              loading={false}
                            />
                          ) : (
                            <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
                              加载失败，请重试
                            </div>
                          )}
                        </div>
                      </Card>
                    )}
                  </div>
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

        {/* 反馈弹窗 */}
        <Modal
          title="请提供反馈"
          open={feedbackModalVisible}
          onOk={handleSubmitFeedback}
          onCancel={handleCancelFeedback}
          okText="提交反馈"
          cancelText="取消"
          width={500}
          className="feedback-modal"
          style={{
            position: 'fixed',
            top: feedbackPosition.y,
            left: feedbackPosition.x,
            transform: 'none',
            margin: 0
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <p style={{ marginBottom: 8, color: '#666' }}>
              请告诉我们您对这次回答不满意的地方，帮助我们改进：
            </p>
            <div style={{ marginBottom: 16 }}>
              <Input.TextArea
                value={feedbackContent}
                onChange={(e) => setFeedbackContent(e.target.value)}
                placeholder="请输入您的反馈意见..."
                rows={4}
                maxLength={500}
                showCount
                className="feedback-textarea"
              />
            </div>
          </div>
        </Modal>
      </Layout>
    </Layout>
  );
});

export default Knowledge;
