import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { authStore } from "../../stores";
import { chatAPI } from "../../api/chat";
import { knowledgeAPI } from "../../api/knowledge";
import { engagementAPI } from "../../api/engagement";
import { authenticatedFetch } from "../../utils/request";
import { message, Button, Avatar, Input, Spin, Layout, List, Typography, Space, Card, Tag, Tooltip, Divider, Modal, Empty, Badge } from "antd";
import { 
  SendOutlined, 
  UserOutlined, 
  RobotOutlined, 
  ReloadOutlined, 
  StopOutlined, 
  CopyOutlined, 
  LikeOutlined, 
  DislikeOutlined, 
  LikeFilled, 
  DislikeFilled,
  ArrowLeftOutlined,
  BulbOutlined,
  PlusOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  LoadingOutlined,
  GlobalOutlined,
  ExportOutlined,
  CloseOutlined
} from "@ant-design/icons";
import StreamingMarkdownRenderer from "../../components/StreamingMarkdownRenderer";
import SourceExpandedDetail from "../../components/SourceExpandedDetail";
import "./KnowledgeQA.scss";

const { Content, Sider } = Layout;
const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const KnowledgeQA = () => {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  
  // 获取当前用户ID
  const currentUserId = authStore.user?.id || authStore.user?.userId;

  // 合并同一个文件的引用
  const mergeReferencesByFile = (references) => {
    const mergedMap = new Map();
    
    references.forEach(ref => {
      // 使用knowledgeId和sourceFile作为key，合并同一文件的所有引用
      const key = `${ref.knowledgeId}-${ref.sourceFile}`;
      
      if (mergedMap.has(key)) {
        const existing = mergedMap.get(key);
        
        // 合并bbox信息 - 现在bboxUnion是二维数组
        const existingBboxes = Array.isArray(existing.bboxUnion) ? existing.bboxUnion : [];
        const newBboxes = Array.isArray(ref.bboxUnion) ? ref.bboxUnion : [];
        
        // 合并所有bbox
        const allBboxes = [...existingBboxes, ...newBboxes];
        
        // 选择最小的页码（如果不同页面）
        const minPageNum = Math.min(
          existing.pageNum || 1, 
          ref.pageNum || 1
        );
        
        // 更新合并后的引用
        mergedMap.set(key, {
          ...existing,
          pageNum: minPageNum,
          bboxUnion: allBboxes,
          // 添加引用计数信息
          referenceCount: (existing.referenceCount || 1) + 1,
          allPageNums: [...(existing.allPageNums || [existing.pageNum || 1]), ref.pageNum || 1].sort((a, b) => a - b)
        });
      } else {
        // 首次遇到这个文件
        mergedMap.set(key, {
          ...ref,
          referenceCount: 1,
          allPageNums: [ref.pageNum || 1]
        });
      }
    });
    
    return Array.from(mergedMap.values());
  };

  // 状态变量定义
  const [inputValue, setInputValue] = useState("");
  const [conversations, setConversations] = useState([]); // 初始为空数组，等待API加载
  const [currentConversation, setCurrentConversation] = useState(null); // 初始为null
  const [messages, setMessages] = useState([]);

  // AI请求相关状态
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false); // 会话加载状态
  const [abortController, setAbortController] = useState(null);
  const [previewFileUrl, setPreviewFileUrl] = useState("");
  const [previewPage, setPreviewPage] = useState(1);
  const [previewBboxes, setPreviewBboxes] = useState([]);
  const messagesEndRef = useRef(null);
  const sessionIdRef = useRef("");
  const messageIdRef = useRef("");

  // 反馈相关状态
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState("");
  const [currentMessageId, setCurrentMessageId] = useState(null);
  const [feedbackPosition, setFeedbackPosition] = useState({ x: 0, y: 0 });

  // RelatedText展开状态管理
  const [expandedRelatedText, setExpandedRelatedText] = useState({});
  const [expandedRelatedTextData, setExpandedRelatedTextData] = useState({});
  const [expandedRelatedTextLoading, setExpandedRelatedTextLoading] = useState({});
  // 针对某个 knowledgeId 的页面与高亮覆盖
  const [expandedRelatedTextOverride, setExpandedRelatedTextOverride] = useState({});
  // 针对某个 knowledgeId 记录优先显示的附件（文件名）
  const [expandedRelatedTextPreferredAttachment, setExpandedRelatedTextPreferredAttachment] = useState({});
  // 当前选中的引用消息，用于右侧面板显示
  const [selectedReferenceMessage, setSelectedReferenceMessage] = useState(null);

  // 处理引用点击：展开右侧、设置页码/坐标覆盖并保证详情加载
  const handleReferenceClick = async (ref, message) => {
    console.log('点击引用:', ref);
    console.log('所属消息:', message);
    
    const url = ref.download_url || ref.downloadUrl;
    if (url) setPreviewFileUrl(url);
    const pg = ref.page_num ?? ref.pageNum;
    setPreviewPage(typeof pg === 'number' ? pg : 1);
    const bb = ref.bbox_union || ref.bboxUnion;
    setPreviewBboxes(bb ? [bb] : []);

    const knowledgeId = ref.knowledgeId || ref.knowledge_id;
    console.log('提取的knowledgeId:', knowledgeId);
    
    if (!knowledgeId) {
      console.warn('引用缺少knowledgeId:', ref);
      return;
    }

    // 设置当前选中的引用消息，用于右侧面板显示
    if (message) {
      setSelectedReferenceMessage(message);
    }

    const preferred = ref.sourceFile || ref.source_file || (Array.isArray(ref.attachments) ? ref.attachments[0] : undefined);
    console.log('设置展开状态，knowledgeId:', knowledgeId);
    
    setExpandedRelatedText(prev => ({ ...prev, [knowledgeId]: true }));
    setExpandedRelatedTextOverride(prev => ({
      ...prev,
      [knowledgeId]: { pageNum: typeof pg === 'number' ? pg : 1, bboxes: bb ? [bb] : [] }
    }));
    if (preferred) {
      setExpandedRelatedTextPreferredAttachment(prev => ({ ...prev, [knowledgeId]: preferred }));
    }

    if (!expandedRelatedTextData[knowledgeId] && !expandedRelatedTextLoading[knowledgeId]) {
      console.log('开始加载知识详情，knowledgeId:', knowledgeId);
      try {
        setExpandedRelatedTextLoading(prev => ({ ...prev, [knowledgeId]: true }));
        const response = await knowledgeAPI.getKnowledgeDetail(knowledgeId);
        if (response.code === 200) {
          setExpandedRelatedTextData(prev => ({ ...prev, [knowledgeId]: response.data }));
          console.log('知识详情加载成功');
        } else {
          message.error(response.message || '获取知识详情失败');
        }
      } catch (e) {
        console.error('获取知识详情失败:', e);
        message.error('获取知识详情失败，请稍后重试');
      } finally {
        setExpandedRelatedTextLoading(prev => ({ ...prev, [knowledgeId]: false }));
      }
    } else {
      console.log('知识详情已存在或正在加载中');
    }
  };

  // 调试信息：显示用户状态

  // 获取初始问题（从params或location.state）
  const initialQuestion = params.question ? decodeURIComponent(params.question) : location.state?.question;
  
  // 检查是否从知识库页面跳转过来
  const isFromKnowledgePage = params.fromPage === "knowledge" || location.state?.fromPage === "knowledge";

  // 防止重复搜索的ref
  const hasSearchedFromHome = useRef(false);
  // 防止AI模块被重复隐藏的ref
  const shouldKeepAIModule = useRef(false);
  // 防止重复加载会话历史的ref
  const hasLoadedSessions = useRef(false);
  // 防止重复处理URL参数的ref
  const hasProcessedParams = useRef(false);

  // 生成sessionId

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 监听用户状态变化

  // 监听输入值变化

  // 组件挂载时检查用户状态
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const isAuthValid = await authStore.checkAuth();

      } catch (error) {
        console.error('KnowledgeQA - 用户认证检查失败:', error);
      }
    };
    
    checkUserStatus();
  }, [authStore]);



  // 切换RelatedText展开状态
  const handleToggleRelatedTextExpansion = async (reference) => {
    const knowledgeId = reference.knowledge_id || reference.knowledgeId;
    const isCurrentlyExpanded = expandedRelatedText[knowledgeId];
    
    if (isCurrentlyExpanded) {
      // 收起
      setExpandedRelatedText(prev => ({ ...prev, [knowledgeId]: false }));
      setExpandedRelatedTextData(prev => {
        const newData = { ...prev };
        delete newData[knowledgeId];
        return newData;
      });
      setExpandedRelatedTextLoading(prev => {
        const newLoading = { ...prev };
        delete newLoading[knowledgeId];
        return newLoading;
      });
    } else {
      // 展开
      setExpandedRelatedText(prev => ({ ...prev, [knowledgeId]: true }));
      setExpandedRelatedTextLoading(prev => ({ ...prev, [knowledgeId]: true }));
      
      try {
        const response = await knowledgeAPI.getKnowledgeDetail(knowledgeId);
        if (response.code === 200) {
          setExpandedRelatedTextData(prev => ({ ...prev, [knowledgeId]: response.data }));
        } else {
          message.error(response.message || '获取知识详情失败');
        }
      } catch (error) {
        console.error('获取知识详情失败:', error);
        message.error('获取知识详情失败，请稍后重试');
      } finally {
        setExpandedRelatedTextLoading(prev => ({ ...prev, [knowledgeId]: false }));
      }
    }
  };

  // 在当前页面打开知识详情
  const handleOpenInCurrentPage = (reference) => {
    const knowledgeId = reference.knowledge_id || reference.knowledgeId;
    if (knowledgeId) {
      navigate(`/knowledge-detail/${knowledgeId}`);
    } else {
      message.error('知识ID不存在');
    }
  };

  // 在新页面打开知识详情
  const handleOpenInNewPage = (reference) => {
    const knowledgeId = reference.knowledge_id || reference.knowledgeId;
    if (knowledgeId) {
      window.open(`/knowledge-detail/${knowledgeId}`, '_blank');
    } else {
      message.error('知识ID不存在');
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 处理URL参数的useEffect
  useEffect(() => {
    if (params.question && params.fromPage && !hasProcessedParams.current) {
      hasProcessedParams.current = true;
      
      const question = decodeURIComponent(params.question);
      const fromPage = params.fromPage; 
      
      // 清空URL参数
      navigate('/knowledge-qa', { replace: true });
      
      // 执行有参数的逻辑
      handleWithParams(question, fromPage);
    }
  }, [params.question, params.fromPage, navigate]);

  // 有参数时的处理逻辑
  const handleWithParams = async (question, fromPage) => {
    try {
      // 1. 获取历史记录
      const res = await chatAPI.getSessions(currentUserId);
      let historicalSessions = [];
      
      if (res?.code === 200 && Array.isArray(res.data)) {
        historicalSessions = res.data.map(s => ({
          id: s.sessionId,
          title: s.sessionName || '会话',
          isActive: false
        })); 
        
        // 去重处理 - 基于ID和标题去重
        const uniqueHistoricalSessions = [];
        const seenIds = new Set();
        const seenTitles = new Set();
        
        for (const session of historicalSessions) {
          if (!seenIds.has(session.id) && !seenTitles.has(session.title)) {
            uniqueHistoricalSessions.push(session);
            seenIds.add(session.id);
            seenTitles.add(session.title);
          }  
        }
        
        historicalSessions = uniqueHistoricalSessions; 
      }
      
      // 2. 新增会话
      const newSession = {
        id: `temp_${Date.now()}`,
        title: question.length > 20 ? question.substring(0, 20) + "..." : question,
        isActive: true
      }; 
      // 3. 将新会话和历史会话合并，新会话在前面
      const allSessions = [newSession, ...historicalSessions]; 
      
      setConversations(allSessions);
      setCurrentConversation(newSession.id);
      
      // 4. 调用AI问答接口
      await handleStreamAIRequest(question);
      
      // 5. 渲染数据（AI接口会自动更新messages）
      
    } catch (error) {
      console.error('处理参数时出错:', error);
      message.error('创建会话失败');
    }
  };

  // 无参数时的处理逻辑
  const handleWithoutParams = async () => {
    try {
      // 1. 获取历史记录
      const res = await chatAPI.getSessions(currentUserId);
      
      if (res?.code === 200 && Array.isArray(res.data) && res.data.length > 0) {
        const sessions = res.data.map(s => ({
          id: s.sessionId,
          title: s.sessionName || '会话',
          isActive: false
        }));
        
        // 去重处理
        const uniqueSessions = [];
        const seenTitles = new Set();
        const seenIds = new Set();
        
        for (const session of sessions) {
          if (!seenIds.has(session.id) && !seenTitles.has(session.title)) {
            uniqueSessions.push(session);
            seenIds.add(session.id);
            seenTitles.add(session.title);
          }
        }
         
        setConversations(uniqueSessions);
        
        // 2. 用第一条直接查询详情
        if (uniqueSessions.length > 0) {
          const firstSession = uniqueSessions[0];
          // 设置第一个会话为活跃状态
          const sessionsWithActive = uniqueSessions.map((session, index) => ({
            ...session,
            isActive: index === 0
          }));
          
          setConversations(sessionsWithActive);
          setCurrentConversation(firstSession.id);
          
          // 自动加载第一条会话的消息历史 
          await handleLoadConversationHistory(firstSession.id);
        }
      }
    } catch (error) {
      console.error('加载历史会话时出错:', error);
    }
  };

  // 主要的useEffect - 无参数时加载历史会话
  useEffect(() => {
    // 只有在没有URL参数且没有加载过会话时才执行
    if (!params.question && !params.fromPage && currentUserId && !hasLoadedSessions.current) {
      hasLoadedSessions.current = true;
      handleWithoutParams();
    }
  }, [currentUserId]); // 移除params依赖，避免重复触发

  // 流式AI请求处理
  const handleStreamAIRequest = async (userQuestion, customSessionId = null) => {
    // 安全检查：确保用户已登录
    if (!currentUserId) {
      message.error('请先登录后再发送消息');
      return;
    }

    if (!userQuestion || !userQuestion.trim()) {
      message.error('问题内容为空，请重新输入');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    // 添加用户消息
    const newUserMessage = {
      id: Date.now() + Math.random(),
      type: "user",
      content: userQuestion.trim(),
      timestamp: new Date(),
    };

    // 生成sessionId
    const generatedSessionId = customSessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 添加新的AI回复消息
    const newAIMessage = {
      id: Date.now() + Math.random() + 1,
      type: "ai",
      content: "",
      timestamp: new Date(),
      references: [],
      sessionId: generatedSessionId,
      messageId: "",
      isLiked: false,
      isDisliked: false,
      isRegenerating: false,
    };

    setMessages((prev) => [...prev, newUserMessage, newAIMessage]);

    // 创建AbortController用于取消请求
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // 准备请求数据
      const requestData = {
        question: userQuestion,
        userId: currentUserId, // 从用户状态获取
        sessionId: generatedSessionId,
        knowledgeIds: [], // 这里可以从store获取知识ID列表
        stream: true,
      };

      // 调用新的RAG流式对话接口
      const response = await authenticatedFetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(requestData),
        signal: controller.signal,
      });

      if (response.ok) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let answer = "";
        let references = [];
        let buffer = "";

        // 事件块解析：以空行分隔，一个事件可能包含多条 data:
        const findDelimiter = () => {
          const a = buffer.indexOf("\n\n");
          const b = buffer.indexOf("\r\n\r\n");
          if (a === -1) return b;
          if (b === -1) return a;
          return Math.min(a, b);
        };

        while (true) {
          if (controller.signal?.aborted) {
            reader.cancel();
            break;
          }

          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let sepIdx;
          while ((sepIdx = findDelimiter()) !== -1) {
            const rawEvent = buffer.slice(0, sepIdx);
            // 去掉分隔空行（兼容 \n\n 和 \r\n\r\n）
            buffer = buffer.slice(sepIdx).replace(/^(?:\r?\n){2}/, "");

            const lines = rawEvent.split(/\r?\n/);
            let eventName = "message";
            const dataLines = [];
            for (const line of lines) {
              if (!line) continue;
              if (line.startsWith("event:")) {
                eventName = line.slice(6).trim();
              } else if (line.startsWith("data:")) {
                dataLines.push(line.slice(5).trimStart());
              }
            }
            const dataStr = dataLines.join("\n");
            if (!dataStr) continue;

            let parsed;
            try {
              parsed = JSON.parse(dataStr);
            } catch (e) {
              // 可能半包，放回缓冲等待后续片段
              buffer = dataStr + "\n\n" + buffer;
              break;
            }

            // 调试日志，观察解析到的事件
            // eslint-disable-next-line no-console
    

            if (eventName === "start") {
              // 保存会话ID（后端会在end事件里补充messageId）
              if (parsed.sessionId) {
                sessionIdRef.current = parsed.sessionId;
                window.__ragSessionId = parsed.sessionId;
                
                // 更新会话列表中的临时会话ID为真实的sessionId
                setConversations(prev => {
                  return prev.map(conv => {
                    if (conv.isActive && conv.id && typeof conv.id === 'string' && conv.id.startsWith('temp_')) { 
                      return { ...conv, id: parsed.sessionId };
                    }
                    return conv;
                  });
                });
                
                // 更新当前会话ID
                setCurrentConversation(parsed.sessionId);
                
                // 更新AI消息的sessionId
                setMessages((prev) => {
                  const newMessages = [...prev];
                  // 安全检查：确保有消息且能找到AI消息
                  if (newMessages.length === 0) {
                    console.warn('SSE start事件：消息数组为空，无法更新sessionId');
                    return prev;
                  }
                  const aiIndex = [...newMessages].reverse().findIndex((m) => m?.type === "ai");
                  if (aiIndex !== -1) {
                    const realIndex = newMessages.length - 1 - aiIndex;
                    const aiMsg = newMessages[realIndex];
                    newMessages[realIndex] = { ...aiMsg, sessionId: parsed.sessionId };
                  } else {
                    console.warn('SSE start事件：未找到AI消息，无法更新sessionId');
                  }
                  return newMessages;
                });
              }
            } else if (eventName === "message") {
              const { content } = parsed;
              // 安全检查：确保content是字符串类型
              if (typeof content === "string" && content.length) {
                answer += content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  // 安全检查：确保有消息且能找到AI消息
                  if (newMessages.length === 0) {
                    console.warn('SSE message事件：消息数组为空，无法更新内容');
                    return prev;
                  }
                  const aiIndex = [...newMessages].reverse().findIndex((m) => m?.type === "ai");
                  if (aiIndex !== -1) {
                    const realIndex = newMessages.length - 1 - aiIndex;
                    const aiMsg = newMessages[realIndex];
                    newMessages[realIndex] = { 
                      ...aiMsg, 
                      content: answer, 
                      references: references,
                      // 保持原有的sessionId和messageId
                      sessionId: aiMsg.sessionId || "",
                      messageId: aiMsg.messageId || "",
                      isLiked: aiMsg.isLiked || false,
                      isDisliked: aiMsg.isDisliked || false,
                      isRegenerating: false // 清除重新生成状态
                    };
                  } else {
                    console.warn('SSE message事件：未找到AI消息，无法更新内容');
                  }
                  return newMessages;
                });
              } else {
                console.warn('SSE message事件收到非字符串content:', typeof content, content);
              }
            } else if (eventName === "references") {
              // 仅AI命中的块，后端包含 download_url
              const arr = Array.isArray(parsed) ? parsed : [];
              const formattedReferences = arr.map((ref) => ({
                knowledgeId: ref.knowledge_id,
                knowledgeName: ref.knowledge_name,
                description: ref.description,
                tags: ref.tags,
                effectiveTime: ref.effective_time,
                sourceFile: ref.source_file,
                relevance: ref.relevance,
                pageNum: ref.page_num,
                chunkIndex: ref.chunk_index,
                chunkType: ref.chunk_type,
                bboxUnion: ref.bbox_union,
                charStart: ref.char_start,
                charEnd: ref.char_end,
                downloadUrl: ref.download_url,
              }));
              
              // 合并同一个文件的引用
              references = mergeReferencesByFile(formattedReferences);
              // 自动展开并定位首条引用（无需点击）
              if (references.length) {
                const first = references[0];
                // 中间预览
                if (first.downloadUrl) {
                  try {
                    authenticatedFetch(first.downloadUrl)
                      .then((r) => r.blob())
                      .then((b) => {
                        const url = URL.createObjectURL(b);
                        setPreviewFileUrl(url);
                        setPreviewPage(typeof first.pageNum === 'number' ? first.pageNum : 1);
                        setPreviewBboxes(first.bboxUnion ? [first.bboxUnion] : []);
                      });
                  } catch {}
                }
                // 右侧展开与覆盖
                const kId = first.knowledgeId;
                if (kId) {
                  setExpandedRelatedText((prev) => ({ ...prev, [kId]: true }));
                  setExpandedRelatedTextOverride((prev) => ({
                    ...prev,
                    [kId]: {
                      pageNum: typeof first.pageNum === 'number' ? first.pageNum : 1,
                      bboxes: first.bboxUnion ? [first.bboxUnion] : [],
                    },
                  }));
                  const preferred = first.sourceFile || (Array.isArray(first.attachments) ? first.attachments[0] : undefined);
                  if (preferred) {
                    setExpandedRelatedTextPreferredAttachment((prev) => ({ ...prev, [kId]: preferred }));
                  }
                  if (!expandedRelatedTextData[kId] && !expandedRelatedTextLoading[kId]) {
                    (async () => {
                      try {
                        setExpandedRelatedTextLoading((prev) => ({ ...prev, [kId]: true }));
                        const resp = await knowledgeAPI.getKnowledgeDetail(kId);
                        if (resp.code === 200) {
                          setExpandedRelatedTextData((prev) => ({ ...prev, [kId]: resp.data }));
                        } else {
                          message.error(resp.message || '获取知识详情失败');
                        }
                      } catch (e) {
                        console.error('获取知识详情失败:', e);
                        message.error('获取知识详情失败，请稍后重试');
                      } finally {
                        setExpandedRelatedTextLoading((prev) => ({ ...prev, [kId]: false }));
                      }
                    })();
                  }
                }
              }
              setMessages((prev) => {
                const newMessages = [...prev];
                // 安全检查：确保有消息且能找到AI消息
                if (newMessages.length === 0) {
                  console.warn('SSE references事件：消息数组为空，无法更新引用');
                  return prev;
                }
                const aiIndex = [...newMessages].reverse().findIndex((m) => m?.type === "ai");
                if (aiIndex !== -1) {
                  const realIndex = newMessages.length - 1 - aiIndex;
                  const aiMsg = newMessages[realIndex];
                  newMessages[realIndex] = { 
                    ...aiMsg, 
                    references: references,
                    // 保持原有的sessionId和messageId
                    sessionId: aiMsg.sessionId || "",
                    messageId: aiMsg.messageId || "",
                    isLiked: aiMsg.isLiked || false,
                    isDisliked: aiMsg.isDisliked || false
                  };
                } else {
                  console.warn('SSE references事件：未找到AI消息，无法更新引用');
                }
                return newMessages;
              });
            } else if (eventName === "end") {
              // 兜底同步一次内容与引用并关闭loading
              // 安全检查：确保answer是字符串类型
              if (typeof answer === 'string') {
                setMessages((prev) => {
                  const newMessages = [...prev];
                  // 安全检查：确保有消息且能找到AI消息
                  if (newMessages.length === 0) {
                    console.warn('SSE end事件：消息数组为空，无法更新内容');
                    return prev;
                  }
                  const aiIndex = [...newMessages].reverse().findIndex((m) => m?.type === "ai");
                  if (aiIndex !== -1) {
                    const realIndex = newMessages.length - 1 - aiIndex;
                    const aiMsg = newMessages[realIndex];
                    newMessages[realIndex] = { ...aiMsg, content: answer, references: references };
                  } else {
                    console.warn('SSE end事件：未找到AI消息，无法更新内容');
                  }
                  return newMessages;
                });
              } else {
                console.error('SSE end事件中answer不是字符串类型:', typeof answer, answer);
              }
              if (parsed.sessionId) {
                sessionIdRef.current = parsed.sessionId;
                window.__ragSessionId = parsed.sessionId;
                // 更新AI消息的sessionId
                setMessages((prev) => {
                  const newMessages = [...prev];
                  // 安全检查：确保有消息且能找到AI消息
                  if (newMessages.length === 0) {
                    console.warn('SSE end事件：消息数组为空，无法更新sessionId');
                    return prev;
                  }
                  const aiIndex = [...newMessages].reverse().findIndex((m) => m?.type === "ai");
                  if (aiIndex !== -1) {
                    const realIndex = newMessages.length - 1 - aiIndex;
                    const aiMsg = newMessages[realIndex];
                    newMessages[realIndex] = { ...aiMsg, sessionId: parsed.sessionId };
                  } else {
                    console.warn('SSE end事件：未找到AI消息，无法更新sessionId');
                  }
                  return newMessages;
                });
              }
              if (parsed.messageId) {
                messageIdRef.current = parsed.messageId;
                window.__ragAnswerMessageId = parsed.messageId;
                // 更新AI消息的messageId
                setMessages((prev) => {
                  const newMessages = [...prev];
                  // 安全检查：确保有消息且能找到AI消息
                  if (newMessages.length === 0) {
                    console.warn('SSE end事件：消息数组为空，无法更新messageId');
                    return prev;
                  }
                  const aiIndex = [...newMessages].reverse().findIndex((m) => m?.type === "ai");
                  if (aiIndex !== -1) {
                    const realIndex = newMessages.length - 1 - aiIndex;
                    const aiMsg = newMessages[realIndex];
                    newMessages[realIndex] = { ...aiMsg, messageId: parsed.messageId };
                  } else {
                    console.warn('SSE end事件：未找到AI消息，无法更新messageId');
                  }
                  return newMessages;
                });
              }
              setIsLoading(false);
              return;
            }
          }
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        let errorMessage = "AI回复生成失败，请重试";

        if (error.message.includes("401")) {
          errorMessage = "认证失败，请重新登录";
        } else if (error.message.includes("429")) {
          errorMessage = "请求过于频繁，请稍后再试";
        } else if (error.message.includes("500")) {
          errorMessage = "服务器内部错误，请稍后重试";
        } else if (error.message.includes("timeout")) {
          errorMessage = "请求超时，请检查网络连接";
        }

        message.error(errorMessage);
        console.error("AI请求错误:", error);

        // 如果请求失败，移除空的AI回复消息
        setMessages((prev) => {
          const newMessages = [...prev];
          // 安全检查：确保有消息
          if (newMessages.length === 0) {
            console.warn('错误处理：消息数组为空，无法移除空消息');
            return prev;
          }
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.type === "ai" && lastMessage.content === "") {
            newMessages.pop();
          }
          return newMessages;
        });
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };



  const handleSend = async (customQuestion = null, customSessionId = null) => {
    const question = customQuestion || inputValue.trim();
    
    // 安全检查：确保用户已登录（优先检查）
    if (!currentUserId) {
      console.error('handleSend: 用户未登录，currentUserId:', currentUserId);
      message.error('请先登录后再发送消息');
      return;
    }
    
    // 安全检查：确保问题内容是有效的字符串
    if (!question || typeof question !== 'string') {
      console.error('handleSend: 问题内容类型错误:', typeof question, question);
      message.warning("问题内容类型错误");
      return;
    }
    
    if (!question.trim()) {
      console.error('handleSend: 问题内容为空:', question);
      message.warning("请输入有效的问题");
      return;
    }
    
    if (isLoading) {
      message.warning("AI正在思考中，请稍候...");
      return;
    }
    
    if (!customQuestion) {
      setInputValue("");
    }
    
    // 确定要使用的sessionId
    let sessionIdToUse = customSessionId;
    
    // 如果没有传入customSessionId，但有当前会话，使用当前会话的ID
    if (!sessionIdToUse && currentConversation) {
      sessionIdToUse = currentConversation; 
    }
    
    // 如果还是没有，使用ref中保存的sessionId
    if (!sessionIdToUse && sessionIdRef.current) {
      sessionIdToUse = sessionIdRef.current; 
    }
     
    
    await handleStreamAIRequest(question, sessionIdToUse);
  };

  const handleNewConversation = () => {


    // 安全检查：确保用户已登录
    if (!currentUserId) {
      console.error('handleNewConversation: 用户未登录，currentUserId:', currentUserId);
      message.error('请先登录后再新建会话');
      return;
    }

    const newId = Date.now() + Math.random();
    const newConversation = {
      id: newId,
      title: "新会话问题",
      isActive: true,
    };

    // 安全检查：确保状态正确重置
    try {
      setConversations((prev) => {
        const updatedConversations = prev.map((conv) => ({ ...conv, isActive: false }));
        return [newConversation, ...updatedConversations];
      });
      setCurrentConversation(newId);
      setMessages([]); // 清空消息数组
      setInputValue(""); // 清空输入框
      
      // 重置其他相关状态
      setCurrentMessageId(null);
      setFeedbackModalVisible(false);
      setFeedbackContent("");
      setPreviewFileUrl(null);
      setPreviewPage(1);
      setPreviewBboxes([]);
      setIsLoadingConversation(false); // 重置会话加载状态
      

    } catch (error) {
      console.error('新建会话失败:', error);
      message.error('新建会话失败，请重试');
    }
  };

  // 加载会话历史消息
  const handleLoadConversationHistory = async (sessionId) => {
    if (!sessionId) {
      console.warn('handleLoadConversationHistory: sessionId为空');
      return;
    }

    try {
      setIsLoadingConversation(true);
      
      // 重置RelatedText展开状态，避免显示错误内容
      setExpandedRelatedText({});
      setExpandedRelatedTextData({});
      setExpandedRelatedTextLoading({});

      const response = await chatAPI.getHistory(sessionId, { limit: 20 });
      if (response?.code === 200 && Array.isArray(response.data)) {
        // 正确映射消息类型
        const msgs = response.data.map((m) => ({
          id: m.id || `${Date.now()}_${Math.random()}`,
          type: m.role === "user" ? "user" : "ai",
          content: m.content || "",
          references: m.references || [],
          timestamp: new Date(m.timestamp || Date.now()),
        }));
        setMessages(msgs);
      } else {
        console.warn('获取会话历史失败:', response);
        setMessages([]);
      }
    } catch (error) {
      console.error('获取会话历史时出错:', error);
      setMessages([]);
    } finally {
      setIsLoadingConversation(false);
    }
  };

  const handleConversationSelect = (conversationId) => {
    // 安全检查：确保用户已登录
    if (!currentUserId) {
      console.error('handleConversationSelect: 用户未登录，currentUserId:', currentUserId);
      message.error('请先登录后再选择会话');
      return;
    }

    // 设置loading状态
    setIsLoadingConversation(true);

    setConversations(
      conversations.map((conv) => ({
        ...conv,
        isActive: conv.id === conversationId,
      }))
    );
    setCurrentConversation(conversationId);
    
    // 加载该会话的历史消息（展示最近若干条）
    (async () => {
      try {
        const res = await chatAPI.getHistory(conversationId, { limit: 20 });
        if (res?.code === 200 && Array.isArray(res.data)) {
          const msgs = res.data.map((m) => {
            // 安全检查：确保消息内容有效
            const content = m.content || "";
            if (typeof content !== 'string') {
              console.warn('历史消息content不是字符串类型:', typeof content, content);
              return {
                id: m.id || `${Date.now()}_${Math.random()}`,
                type: m.role === "user" ? "user" : "ai",
                content: "", // 设置为空字符串而不是无效内容
                references: m.references || [],
                timestamp: new Date(m.timestamp || Date.now()),
              };
            }
            return {
              id: m.id || `${Date.now()}_${Math.random()}`,
              type: m.role === "user" ? "user" : "ai",
              content: content,
              references: m.references || [],
              timestamp: new Date(m.timestamp || Date.now()),
            };
          });
          setMessages(msgs);
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error('加载会话历史失败:', error);
        setMessages([]);
        message.error('加载会话历史失败，请重试');
      } finally {
        // 无论成功还是失败，都要关闭loading状态
        setIsLoadingConversation(false);
      }
    })();
  };

  const handleBackToKnowledge = () => {
    navigate("/knowledge");
  };

  const handleCopyMessage = (content) => {
    // 安全检查：确保用户已登录
    if (!currentUserId) {
      console.error('handleCopyMessage: 用户未登录，currentUserId:', currentUserId);
      message.error('请先登录后再复制消息');
      return;
    }

    // 安全检查：确保content是字符串类型
    if (typeof content !== 'string') {
      console.error('handleCopyMessage: content不是字符串类型:', typeof content, content);
      message.error('复制失败：内容格式错误');
      return;
    }
    
    navigator.clipboard.writeText(content);
    message.success("已复制到剪贴板");
  };

  const handleFeedback = async (messageId, type, event) => {
    // 安全检查：确保event参数是有效的事件对象
    if (event && typeof event !== 'object') {
      console.error('handleFeedback: event参数类型错误:', typeof event, event);
      return;
    }

    // 安全检查：确保用户已登录
    if (!currentUserId) {
      console.error('handleFeedback: 用户未登录，currentUserId:', currentUserId);
      message.error('请先登录后再进行反馈');
      return;
    }

    // 安全检查：确保消息数组不为空
    if (messages.length === 0) {
      message.error('消息数组为空，无法处理反馈');
      return;
    }

    // 找到对应的消息
    const targetMessage = messages.find(m => m.id === messageId);
    
    
    if (!targetMessage) {
      message.error('找不到对应的消息');
      return;
    }
    
    if (!targetMessage.sessionId || !targetMessage.messageId) {
      message.error('消息信息不完整，无法操作');
      console.error('消息缺少必要信息:', targetMessage);
      return;
    }

    if (type === "dislike") {
      // 如果已经点踩，则取消点踩
      if (targetMessage.isDisliked) {
        try {
          const response = await engagementAPI.undislikeAnswer(
            targetMessage.sessionId,
            targetMessage.messageId,
            currentUserId
          );
          
          if (response.code === 200) {
            message.success('已取消点踩');
            // 立即更新UI状态，让点踩图标变暗
            setMessages(prev => prev.map(m => 
              m.id === messageId 
                ? { ...m, isDisliked: false }
                : m
            ));
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
      setCurrentMessageId(messageId);

      // 获取点踩按钮的位置
      const button = event?.target?.closest(".ant-btn");
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
      if (targetMessage.isLiked) {
        // 如果已经点赞，则取消点赞
        response = await engagementAPI.unlikeAnswer(
          targetMessage.sessionId,
          targetMessage.messageId,
          currentUserId
        );
        
        if (response.code === 200) {
          message.success('已取消点赞');
          // 立即更新UI状态，让点赞图标变暗
          setMessages(prev => prev.map(m => 
            m.id === messageId 
              ? { ...m, isLiked: false }
              : m
          ));
        } else {
          message.error(response.message || '取消点赞失败');
        }
      } else {
        // 如果未点赞，则点赞
        response = await engagementAPI.likeAnswer(
          targetMessage.sessionId,
          targetMessage.messageId,
          currentUserId
        );
        
        if (response.code === 200) {
          message.success('已点赞该回答');
          // 立即更新UI状态，让点赞图标变亮（不影响点踩状态）
          setMessages(prev => prev.map(m => 
            m.id === messageId 
              ? { ...m, isLiked: true }
              : m
          ));
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
    if (!feedbackContent.trim()) {
      message.warning("请输入反馈内容");
      return;
    }

    if (!currentMessageId) {
      message.error('消息ID不存在');
      return;
    }

    // 安全检查：确保用户已登录
    if (!currentUserId) {
      console.error('handleSubmitFeedback: 用户未登录，currentUserId:', currentUserId);
      message.error('请先登录后再提交反馈');
      return;
    }

    // 安全检查：确保消息数组不为空
    if (messages.length === 0) {
      message.error('消息数组为空，无法提交反馈');
      return;
    }

    // 找到对应的消息
    const targetMessage = messages.find(m => m.id === currentMessageId);
    if (!targetMessage || !targetMessage.sessionId || !targetMessage.messageId) {
      message.error('消息信息不完整，无法操作');
      return;
    }

    try {
      // 点击确定：带着消息提交点踩
      const response = await engagementAPI.dislikeAnswer(
        targetMessage.sessionId,
        targetMessage.messageId,
        feedbackContent.trim(), // 带着反馈内容
        currentUserId
      );

      if (response.code === 200) {
        message.success("点踩提交成功");
        setFeedbackModalVisible(false);
        setFeedbackContent("");
        setCurrentMessageId(null);
        // 立即更新UI状态，让点踩图标变亮
        setMessages(prev => prev.map(m => 
          m.id === currentMessageId 
            ? { ...m, isDisliked: true, isLiked: false }
            : m
        ));
      } else {
        message.error(response.message || "提交失败，请重试");
      }
    } catch (error) {
      console.error('点踩失败:', error);
      message.error("提交失败，请重试");
    }
  };

  // 重新生成AI回答
  const handleRegenerateAnswer = async (messageId) => {
    // 安全检查：确保用户已登录
    if (!currentUserId) {
      console.error('handleRegenerateAnswer: 用户未登录，currentUserId:', currentUserId);
      message.error('请先登录后再重新生成回答');
      return;
    }

    // 安全检查：确保消息数组不为空
    if (messages.length === 0) {
      message.error('消息数组为空，无法重新生成');
      return;
    }

    // 获取用户问题（找到用户消息）
    const userMessageIndex = messages.findIndex(m => m.id === messageId) - 1;
    if (userMessageIndex < 0 || messages[userMessageIndex].type !== 'user') {
      message.error('找不到对应的用户问题');
      return;
    }
    
    const userQuestion = messages[userMessageIndex].content;
    
    // 安全检查：确保用户问题是有效的字符串
    if (typeof userQuestion !== 'string' || !userQuestion.trim()) {
      message.error('用户问题内容无效，无法重新生成');
      return;
    }

    // 标记旧的AI回答为重新生成中，而不是立即删除
    setMessages(prev => prev.map(m => 
      m.id === messageId 
        ? { ...m, content: "", isRegenerating: true }
        : m
    ));

    // 重新生成AI回答（直接重新发送问题，不需要sessionId）
    await handleSend(userQuestion);
  };

  // 取消反馈弹窗
  const handleCancelFeedback = async () => {
    if (!currentMessageId) {
      message.error('消息ID不存在');
      return;
    }

    // 安全检查：确保用户已登录
    if (!currentUserId) {
      console.error('handleCancelFeedback: 用户未登录，currentUserId:', currentUserId);
      message.error('请先登录后再取消反馈');
      return;
    }

    // 安全检查：确保消息数组不为空
    if (messages.length === 0) {
      message.error('消息数组为空，无法取消反馈');
      return;
    }

    // 找到对应的消息
    const targetMessage = messages.find(m => m.id === currentMessageId);
    if (!targetMessage || !targetMessage.sessionId || !targetMessage.messageId) {
      message.error('消息信息不完整，无法操作');
      return;
    }

    try {
      // 点击取消：直接提交点踩（不带消息）
      const response = await engagementAPI.dislikeAnswer(
        targetMessage.sessionId,
        targetMessage.messageId,
        "", // 空内容
        currentUserId
      );
      
      if (response.code === 200) {
        message.success("点踩提交成功");
        setFeedbackModalVisible(false);
        setFeedbackContent("");
        setCurrentMessageId(null);
        // 立即更新UI状态，让点踩图标变亮（不影响点赞状态）
        setMessages(prev => prev.map(m => 
          m.id === currentMessageId 
            ? { ...m, isDisliked: true }
            : m
        ));
      } else {
        message.error(response.message || "提交失败，请重试");
      }
    } catch (error) {
      console.error('点踩失败:', error);
      message.error("提交失败，请重试");
    }
  };

  // 取消AI请求
  const handleCancelRequest = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
      message.info("已停止生成回复");
    }
  };





  return (
    <div className="knowledge-qa">

      
      <div className="qa-layout">
        <div className="qa-main-layout">
          {/* 左侧会话列表 */}
          <div className="conversation-sider">
            <div className="conversation-header">
              <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBackToKnowledge} className="back-button">
                返回知识库
              </Button>
            </div>

            <div className="conversation-content">
              {/* 用户登录状态提示 */}
              {!currentUserId && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '12px', 
                  backgroundColor: '#f6ffed', 
                  border: '1px solid #b7eb8f', 
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '12px'
                }}>
                  <BulbOutlined style={{ color: '#52c41a', marginRight: '6px' }} />
                  <span style={{ color: '#389e0d' }}>
                    请先登录后再使用会话功能
                  </span>
                </div>
              )}
              
              <div className="new-conversation-section">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleNewConversation}
                  className="new-conversation-btn"
                  block
                  disabled={!currentUserId}
                  title={!currentUserId ? "请先登录后再新建会话" : "新建会话问题"}
                >
                  {!currentUserId ? "请先登录" : "新建会话问题"}
                </Button>
              </div>

              <div className="conversation-list">
                {conversations.length > 0 ? (
                  <List
                    dataSource={conversations}
                    renderItem={(item) => (
                      <List.Item
                        key={item.id}
                        className={`conversation-item ${item.isActive ? "active" : ""} ${!currentUserId ? "disabled" : ""}`}
                        onClick={() => currentUserId && handleConversationSelect(item.id)}
                        style={{ 
                          cursor: currentUserId ? "pointer" : "not-allowed",
                          opacity: currentUserId ? 1 : 0.6
                        }}
                      >
                        <div className="conversation-title">{item.title}</div>
                      </List.Item>
                    )}
                  />
                ) : currentUserId ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '20px', 
                    color: '#999',
                    fontSize: '14px'
                  }}>
                    暂无会话记录
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* 中间问答界面 */}
          <div className="qa-content">
            <div className="messages-container">
              {/* 会话加载loading状态 */}
              {isLoadingConversation && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  padding: '40px 20px',
                  flexDirection: 'column'
                }}>
                  <Spin size="large" />
                  <div style={{ marginTop: '16px', color: '#666' }}>
                    正在加载会话历史...
                  </div>
                </div>
              )}
              
              {/* 消息列表 */}
              {!isLoadingConversation && messages.map((message) => (
                <div key={message.id} className={`message ${message.type === "user" ? "user" : "ai"}`}>
                  <div className="message-avatar">
                    {message.type === "user" ? (
                      <Avatar icon={<UserOutlined />} className="user-avatar" />
                    ) : (
                      <Avatar icon={<RobotOutlined />} className="ai-avatar" />
                    )}
                  </div>
                  <div className="message-content">
                    <div className="message-bubble">
                      <div className="message-text">
                        {message.content && typeof message.content === 'string' ? (
                          <StreamingMarkdownRenderer
                            content={message.content}
                            isStreaming={isLoading && message.id === messages[messages.length - 1]?.id}
                            onLinkClick={(href) => {
                              // 若回答中渲染为链接且带有 data-index，可解析并联动
                              try {
                                const m = /#ref-(\d+)/.exec(href || "");
                                if (m) {
                                  const idx = Number(m[1]);
                                  const ref = message.references?.[idx];
                                  if (ref?.downloadUrl) {
                                    authenticatedFetch(ref.downloadUrl)
                                      .then((r) => r.blob())
                                      .then((b) => {
                                        const url = URL.createObjectURL(b);
                                        setPreviewFileUrl(url);
                                        {
                                          const pg = ref.page_num ?? ref.pageNum;
                                          setPreviewPage(typeof pg === 'number' ? pg : 1);
                                        }
                                        setPreviewBboxes(ref.bbox_union || ref.bboxUnion ? [ref.bbox_union || ref.bboxUnion] : []);
                                      });
                                  }
                                }
                              } catch {}
                            }}
                          />
                        ) : isLoading && message.id === messages[messages.length - 1]?.id ? (
                          <div className="thinking-indicator">
                            <Spin size="small" />
                            <span>AI正在思考中...</span>
                          </div>
                        ) : (
                          <span />
                        )}
                      </div>

                      {message.type === "ai" && message.references && message.references.length > 0 && (
                        <div className="message-references">
                          <div className="learn-more">
                            <span>Learn More</span>
                            {message.references.map((ref, index) => (
                              <div
                                key={`${message.id}-ref-${index}`}
                                className="reference-item"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('引用点击事件触发');
                                  handleReferenceClick(ref, message);
                                }}
                              >
                                <FilePdfOutlined className="pdf-icon" />
                                <span style={{ cursor: "pointer" }}>
                                  {ref.knowledge_name || ref.knowledgeName || ref.sourceFile || ref.sourceFile || "引用文档"}
                                  {ref.referenceCount > 1 && (
                                    <span style={{ 
                                      marginLeft: '8px', 
                                      fontSize: '12px', 
                                      color: '#666',
                                      backgroundColor: '#f0f0f0',
                                      padding: '2px 6px',
                                      borderRadius: '10px'
                                    }}>
                                      {ref.referenceCount}个引用
                                    </span>
                                  )}
                                  {ref.allPageNums && ref.allPageNums.length > 1 ? (
                                    <span style={{ color: '#999', marginLeft: '4px' }}>
                                      （第{ref.allPageNums.join('、')}页）
                                    </span>
                                  ) : (
                                    <span style={{ color: '#999', marginLeft: '4px' }}>
                                      （第{ref.page_num || ref.pageNum || 1}页）
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {message.type === "ai" && (
                        <div className="message-actions">
                          <Tooltip title="复制回答">
                            <Button
                              type="text"
                              size="small"
                              icon={<CopyOutlined />}
                              onClick={() => handleCopyMessage(message.content)}
                            />
                          </Tooltip>
                          <Tooltip title="重新生成">
                            <Button 
                              type="text" 
                              size="small" 
                              icon={<ReloadOutlined />}
                              onClick={() => handleRegenerateAnswer(message.id)}
                            />
                          </Tooltip>
                          <Tooltip title={message.isLiked ? "取消点赞" : "点赞回答"}>
                            <Button
                              type="text"
                              size="small"
                              icon={message.isLiked ? <LikeFilled style={{ color: 'var(--ant-color-primary)' }} /> : <LikeOutlined />}
                              onClick={() => handleFeedback(message.id, "like")}
                            />
                          </Tooltip>
                          <Tooltip title={message.isDisliked ? "取消点踩" : "点踩回答（需要填写反馈）"}>
                            <Button
                              type="text"
                              size="small"
                              icon={message.isDisliked ? <DislikeFilled style={{ color: 'var(--ant-color-primary)' }} /> : <DislikeOutlined />}
                              onClick={(e) => handleFeedback(message.id, "dislike", e)}
                            />
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>


             {/* 停止按钮 */}
              {isLoading && (
                <div className="stop-section" style={{ marginBottom: '12px', textAlign: 'center' }}>
                  <Button type="default" icon={<StopOutlined />} onClick={handleCancelRequest} className="stop-button">
                    停止回答
                  </Button>
                </div>
              )}

            <div className="input-section">
              {/* 用户登录状态提示 */}
              {!currentUserId && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '16px', 
                  backgroundColor: '#fff7e6', 
                  border: '1px solid #ffd591', 
                  borderRadius: '6px',
                  marginBottom: '16px'
                }}>
                  <BulbOutlined style={{ color: '#fa8c16', marginRight: '8px' }} />
                  <span style={{ color: '#d46b08' }}>
                    请先登录后再发送消息
                  </span>
                </div>
              )}
              
             

              <div className="input-container">
                <TextArea
                  value={inputValue}
                  onChange={(e) => {
                    const newValue = e.target.value;

                    setInputValue(newValue);
                  }}
                  placeholder={currentUserId ? "请在这里继续输入问题" : "请先登录后再输入问题"}
                  rows={2}
                  className="question-input"
                  disabled={isLoading || !currentUserId}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button
                  type="primary"
                  icon={isLoading ? <LoadingOutlined /> : <SendOutlined />}
                  onClick={() => {

                    handleSend();
                  }}
                  className="send-button"
                  disabled={isLoading || !inputValue.trim() || !currentUserId}
                >
                  {isLoading ? "思考中..." : "发送"}
                </Button>
              </div>
            </div>
          </div>

          {/* 右侧RelatedText侧边栏 */}
          {(() => {
            // 根据当前会话ID获取对应的AI回答消息
            let targetMessage = null;
            
            // 优先使用选中的引用消息，否则使用最新消息
            if (selectedReferenceMessage) {
              targetMessage = selectedReferenceMessage;
            } else if (currentConversation) {
              // 如果有当前会话，查找该会话中最新且有引用的AI消息
              targetMessage = messages
                .filter(msg => msg.type === 'ai' && msg.references && msg.references.length > 0)
                .pop();
            }
            
            // 如果正在加载会话，显示loading状态
            if (isLoadingConversation) {
              return (
                <div className="related-text-sider">
                  <div className="related-text-header">
                    <h3>RelatedText</h3>
                  </div>
                  <div className="related-text-content" style={{ padding: '16px', textAlign: 'center' }}>
                    <Spin size="small" />
                    <p style={{ margin: '8px 0 0 0', color: '#999' }}>加载中...</p>
                  </div>
                </div>
              );
            }
            
           
          
            
            // 如果没有找到目标消息，则不显示侧边栏
            if (!targetMessage || !targetMessage.references || targetMessage.references.length === 0) {
              
              return null;
            }
            
            return (
              <div className="related-text-sider">
                <div className="related-text-header">
                  <h3>RelatedText</h3>
                  
                </div>
                <div className="related-text-content">
                  {targetMessage.references.map((reference, index) => (
                    <div key={`${targetMessage.id}-${index}`}>
                      <Card 
                        className="related-text-card" 
                        size="small"
                        style={{ cursor: 'pointer', marginBottom: '12px' }}
                        onClick={() => handleToggleRelatedTextExpansion(reference)}
                      >
                        <div className="related-text-knowledge">
                          <FileTextOutlined className="file-icon" style={{ color: '#1890ff', marginRight: '8px' }} />
                          <div className="knowledge-info">
                            <div className="knowledge-name">
                              {reference.knowledge_name || reference.knowledgeName || reference.sourceFile || "引用文档"}
                              {reference.referenceCount > 1 && (
                                <span style={{ 
                                  marginLeft: '8px', 
                                  fontSize: '12px', 
                                  color: '#666',
                                  backgroundColor: '#f0f0f0',
                                  padding: '2px 6px',
                                  borderRadius: '10px'
                                }}>
                                  {reference.referenceCount}个引用
                                </span>
                              )}
                            </div>
                            <div className="page-info" style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                              {reference.allPageNums && reference.allPageNums.length > 1 ? (
                                `第${reference.allPageNums.join('、')}页`
                              ) : (
                                `第${reference.page_num || reference.pageNum || 1}页`
                              )}
                            </div>
                          </div>
                          <div className="related-text-actions">
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
                      {expandedRelatedText[reference.knowledge_id || reference.knowledgeId] && (
                        <Card 
                          className="expanded-related-text-detail" 
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
                              {reference.knowledge_name || reference.knowledgeName || reference.sourceFile || "引用文档"}
                            </span>
                            <Button 
                              type="text" 
                              size="small"
                              icon={<CloseOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleRelatedTextExpansion(reference);
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
                            {expandedRelatedTextLoading[reference.knowledge_id || reference.knowledgeId] ? (
                              <div style={{ padding: '16px', textAlign: 'center' }}>
                                <Spin size="small" />
                                <p style={{ margin: '8px 0 0 0', color: '#999' }}>加载中...</p>
                              </div>
                            ) : expandedRelatedTextData[reference.knowledge_id || reference.knowledgeId] ? (
                              <SourceExpandedDetail 
                                knowledgeDetail={expandedRelatedTextData[reference.knowledge_id || reference.knowledgeId]} 
                                loading={false} 
                                preferredAttachmentName={expandedRelatedTextPreferredAttachment[reference.knowledge_id || reference.knowledgeId]}
                                bboxes={(() => {
                                  const knowledgeId = reference.knowledge_id || reference.knowledgeId;
                                  const override = expandedRelatedTextOverride[knowledgeId] || {};
                                  return Array.isArray(override.bboxes) && override.bboxes.length > 0
                                    ? override.bboxes
                                    : (reference.bbox_union || reference.bboxUnion ? [reference.bbox_union || reference.bboxUnion] : []);
                                })()}
                                pageNum={(() => {
                                  const knowledgeId = reference.knowledge_id || reference.knowledgeId;
                                  const override = expandedRelatedTextOverride[knowledgeId] || {};
                                  return (typeof override.pageNum === 'number')
                                    ? override.pageNum
                                    : (typeof (reference.page_num ?? reference.pageNum) === 'number' ? (reference.page_num ?? reference.pageNum) : 1);
                                })()}
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
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

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
          position: "fixed",
          top: feedbackPosition.y,
          left: feedbackPosition.x,
          transform: "none",
          margin: 0,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ marginBottom: 8, color: "#666" }}>请告诉我们您对这次回答不满意的地方，帮助我们改进：</p>
          <TextArea
            value={feedbackContent}
            onChange={(e) => setFeedbackContent(e.target.value)}
            placeholder="请输入您的反馈意见..."
            rows={4}
            maxLength={500}
            showCount
            className="feedback-textarea"
          />
        </div>
      </Modal>
    </div>
  );
};

export default KnowledgeQA;
