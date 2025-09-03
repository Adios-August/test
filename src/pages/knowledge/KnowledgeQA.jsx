import React, { useState, useEffect, useRef } from "react";
import {
  Layout,
  Input,
  Button,
  Card,
  Avatar,
  Space,
  List,
  Badge,
  message,
  Spin,
  Tooltip,
  Typography,
  Divider,
  Empty,
  Modal,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  SendOutlined,
  CopyOutlined,
  ReloadOutlined,
  LikeOutlined,
  LikeFilled,
  DislikeOutlined,
  DislikeFilled,
  FilePdfOutlined,
  FileTextOutlined,
  ArrowLeftOutlined,
  RobotOutlined,
  UserOutlined,
  LoadingOutlined,
  StopOutlined,
  HistoryOutlined,
  SettingOutlined,
  BulbOutlined,
  GlobalOutlined,
  ExportOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import StreamingMarkdownRenderer from "../../components/StreamingMarkdownRenderer";
import SourceExpandedDetail from "../../components/SourceExpandedDetail";
import { chatAPI } from "../../api/chat";
import { feedbackAPI } from "../../api/feedback";
import { knowledgeAPI } from "../../api/knowledge";
import { engagementAPI } from "../../api/engagement";
import { useAuthStore } from "../../stores";
import "./KnowledgeQA.scss";

const { Sider, Content } = Layout;
const { TextArea } = Input;
const { Title } = Typography;

const KnowledgeQA = () => {
  console.log('🔄 KnowledgeQA 组件重新渲染');
  
  const navigate = useNavigate();
  const location = useLocation();
  const authStore = useAuthStore();
  
  // 获取当前用户ID
  const currentUserId = authStore.user?.id || authStore.user?.userId;

  // 调试信息：显示用户状态
  console.log('KnowledgeQA - 用户状态:', {
    authStore: authStore,
    user: authStore.user,
    currentUserId: currentUserId,
    hasUser: !!authStore.user,
    userId: authStore.user?.id,
    userIdAlt: authStore.user?.userId
  });

  // 从路由状态获取传递的问题
  const initialQuestion = location.state?.question || null;

  const [inputValue, setInputValue] = useState("");
  const [conversations, setConversations] = useState([]); // 初始为空数组，等待API加载
  const [currentConversation, setCurrentConversation] = useState(null); // 初始为null
  
  // 调试：监控conversations状态变化
  useEffect(() => {
    console.log('📝 conversations状态变化:', {
      length: conversations.length,
      conversations: conversations,
      currentConversation: currentConversation
    });
  }, [conversations, currentConversation]);

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

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 监听用户状态变化
  useEffect(() => {
    console.log('KnowledgeQA - currentUserId变化:', currentUserId);
    console.log('KnowledgeQA - authStore状态:', {
      token: authStore.token,
      user: authStore.user,
      isAuthenticated: authStore.isAuthenticated
    });
  }, [currentUserId, authStore.token, authStore.user, authStore.isAuthenticated]);

  // 监听输入值变化
  useEffect(() => {
    console.log('KnowledgeQA - inputValue变化:', {
      inputValue: inputValue,
      inputValueLength: inputValue.length,
      inputValueTrimmed: inputValue.trim(),
      inputValueTrimmedLength: inputValue.trim().length
    });
  }, [inputValue]);

  // 组件挂载时检查用户状态
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const isAuthValid = await authStore.checkAuth();
        console.log('KnowledgeQA - 用户认证检查结果:', isAuthValid);
        console.log('KnowledgeQA - 当前用户状态:', {
          token: authStore.token,
          user: authStore.user,
          isAuthenticated: authStore.isAuthenticated
        });
      } catch (error) {
        console.error('KnowledgeQA - 用户认证检查失败:', error);
      }
    };
    
    checkUserStatus();
  }, [authStore]);

  // 切换RelatedText展开状态
  const handleToggleRelatedTextExpansion = async (reference) => {
    const knowledgeId = reference.knowledgeId;
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
    if (reference.knowledgeId) {
      navigate(`/knowledge-detail/${reference.knowledgeId}`);
    } else {
      message.error('知识ID不存在');
    }
  };

  // 在新页面打开知识详情
  const handleOpenInNewPage = (reference) => {
    if (reference.knowledgeId) {
      window.open(`/knowledge-detail/${reference.knowledgeId}`, '_blank');
    } else {
      message.error('知识ID不存在');
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

    // 页面加载时自动调用AI接口回答传递的问题
  useEffect(() => {
    console.log('useEffect - 页面初始化开始:', {
      currentUserId: currentUserId,
      initialQuestion: initialQuestion,
      conversationsLength: conversations.length,
      currentConversation: currentConversation
    });

    // 安全检查：确保用户已登录
    if (!currentUserId) {
      console.log('useEffect: 用户未登录，跳过初始化操作');
      return;
    }

    // 初始化加载历史会话
    (async () => {
      try {
        console.log('开始加载历史会话...');
        const res = await chatAPI.getSessions(currentUserId);
        console.log('历史会话API响应:', res);
        console.log('API响应类型:', typeof res);
        console.log('API响应数据结构:', {
          hasCode: 'code' in res,
          hasData: 'data' in res,
          codeType: typeof res?.code,
          dataType: typeof res?.data,
          isDataArray: Array.isArray(res?.data),
          dataLength: res?.data?.length
        });
        
        if (res?.code === 200 && Array.isArray(res.data)) {
          console.log('原始会话数据:', res.data);
          
          // 过滤掉无效的原始数据
          const validSessions = res.data.filter(s => {
            // 检查是否有有效的sessionId
            if (!s.sessionId || typeof s.sessionId !== 'string') {
              console.warn('过滤掉无效的原始会话数据 - 无sessionId:', s);
              return false;
            }
            
            // 过滤掉临时生成的sessionId
            if (s.sessionId.startsWith('session_') && s.sessionId.includes('_')) {
              const parts = s.sessionId.split('_');
              if (parts.length >= 3 && !isNaN(parseInt(parts[1]))) {
                console.warn('过滤掉临时生成的原始会话数据:', s);
                return false;
              }
            }
            
            return true;
          });
          
          console.log('过滤后的有效会话数据:', validSessions);
          
          const list = validSessions.map((s, idx) => ({
            id: s.sessionId,
            title: s.sessionName || `会话${idx + 1}`, // 不使用sessionId作为标题
            isActive: idx === 0,
          }));
          console.log('处理后的会话列表:', list);
          
          // 只有在有数据时才设置会话列表，避免重复添加默认会话
          if (list.length > 0) {
            // 检查是否有重复的会话ID和无效的会话数据
            const uniqueIds = new Set();
            const filteredList = list.filter(session => {
              // 检查会话ID是否有效
              if (!session.id || typeof session.id !== 'string' && typeof session.id !== 'number') {
                console.warn('发现无效的会话ID:', session.id);
                return false;
              }
              
              // 过滤掉临时生成的会话ID（以session_开头且包含时间戳的）
              if (typeof session.id === 'string' && session.id.startsWith('session_') && session.id.includes('_')) {
                const parts = session.id.split('_');
                if (parts.length >= 3 && !isNaN(parseInt(parts[1]))) {
                  console.warn('过滤掉临时生成的会话ID:', session.id);
                  return false;
                }
              }
              
              // 检查会话ID是否重复
              if (uniqueIds.has(session.id)) {
                console.warn('发现重复的会话ID:', session.id);
                return false;
              }
              
              // 检查会话标题是否有效
              if (!session.title || typeof session.title !== 'string') {
                console.warn('发现无效的会话标题:', session.title);
                return false;
              }
              
              uniqueIds.add(session.id);
              return true;
            });
            
            if (filteredList.length !== list.length) {
              console.warn('过滤掉无效/重复会话后的数量:', filteredList.length, '原始数量:', list.length);
            }
            
            if (filteredList.length > 0) {
              setConversations(filteredList);
              setCurrentConversation(filteredList[0].id);
              console.log('成功加载历史会话:', filteredList.length, '个会话，当前会话ID:', filteredList[0].id);
            } else {
              console.log('过滤后没有有效的会话数据');
            }
          } else {
            console.log('没有历史会话数据');
          }
        } else {
          console.log('API响应格式不正确:', res);
        }
      } catch (error) {
        console.error('加载历史会话失败:', error);
        // 加载失败时不设置会话列表，保持初始状态
      }
    })();

    if (initialQuestion) {
      // 延迟一下，确保页面完全加载
      const timer = setTimeout(() => {
        handleStreamAIRequest(initialQuestion);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [initialQuestion, currentUserId]);



  // 流式AI请求处理
  const handleStreamAIRequest = async (userQuestion, customSessionId = null) => {
    // 调试信息
    console.log('handleStreamAIRequest - 调用信息:', {
      userQuestion: userQuestion,
      userQuestionType: typeof userQuestion,
      userQuestionLength: userQuestion.length,
      userQuestionTrimmed: userQuestion.trim(),
      userQuestionTrimmedLength: userQuestion.trim().length,
      currentUserId: currentUserId
    });

    // 安全检查：确保用户已登录（优先检查）
    if (!currentUserId) {
      console.error('handleStreamAIRequest: 用户未登录，currentUserId:', currentUserId);
      message.error('请先登录后再发送消息');
      return;
    }

    // 安全检查：确保userQuestion是字符串类型且不为空
    if (!userQuestion || typeof userQuestion !== 'string') {
      console.error('handleStreamAIRequest: userQuestion类型错误:', typeof userQuestion, userQuestion);
      message.error('问题内容类型错误，请重新输入');
      return;
    }
    
    if (!userQuestion.trim()) {
      console.error('handleStreamAIRequest: userQuestion为空:', userQuestion);
      message.error('问题内容为空，请重新输入');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    // 添加用户消息
    const newUserMessage = {
      id: Date.now() + Math.random(),
      type: "user",
      content: userQuestion.trim(), // 确保content是trim后的字符串
      timestamp: new Date(),
    };

    // 生成sessionId（如果没有传入customSessionId）
    const generatedSessionId = customSessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 检查是否有正在重新生成的消息，如果有则替换它
    const existingRegeneratingMessage = messages.find(m => m.isRegenerating);
    
    if (existingRegeneratingMessage) {
      // 替换正在重新生成的消息
      setMessages((prev) => {
        const newMessages = prev.map(m => 
          m.isRegenerating 
            ? {
                ...m,
                content: "", // 确保content是空字符串
                references: [],
                sessionId: generatedSessionId,
                messageId: "",
                isLiked: false,
                isDisliked: false,
                isRegenerating: false
              }
            : m
        );
        console.log('替换重新生成消息后的状态:', newMessages);
        return newMessages;
      });
    } else {
      // 添加新的AI回复消息
      const newAIMessage = {
        id: Date.now() + Math.random() + 1,
        type: "ai",
        content: "", // 确保content是空字符串
        timestamp: new Date(),
        references: [],
        sessionId: generatedSessionId, // 确保总是有sessionId
        messageId: "", // 将在流式响应中设置
        isLiked: false, // 点赞状态
        isDisliked: false, // 点踩状态
        isRegenerating: false, // 重新生成状态
      };

      // 安全检查：确保新消息对象有效
      if (typeof newUserMessage.content !== 'string' || typeof newAIMessage.content !== 'string') {
        console.error('新消息content类型错误:', {
          userMessage: typeof newUserMessage.content,
          aiMessage: typeof newAIMessage.content
        });
        message.error('创建消息失败，请重试');
        setIsLoading(false);
        return;
      }

      setMessages((prev) => {
        const newMessages = [...prev, newUserMessage, newAIMessage];
        console.log('创建新消息后的状态:', newMessages);
        console.log('新AI消息的sessionId:', newAIMessage.sessionId);
        return newMessages;
      });
    }

    // 更新当前会话的标题
    console.log('handleStreamAIRequest - 会话状态检查:', {
      currentConversation: currentConversation,
      conversationsLength: conversations.length,
      conversations: conversations
    });
    
    if (currentConversation) {
      console.log('更新现有会话标题:', currentConversation);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConversation
            ? { ...conv, title: userQuestion.length > 20 ? userQuestion.substring(0, 20) + "..." : userQuestion }
            : conv
        )
      );
    } else {
      // 如果没有当前会话，检查是否有历史会话
      if (conversations.length > 0) {
        // 如果有历史会话，选择第一个会话
        console.log('选择第一个历史会话作为当前会话:', conversations[0].id);
        setCurrentConversation(conversations[0].id);
      } else {
        // 只有在没有历史会话且没有当前会话时，才创建新会话
        console.log('创建新会话，因为没有历史会话');
        const newConversation = {
          id: Date.now() + Math.random(),
          title: userQuestion.length > 20 ? userQuestion.substring(0, 20) + "..." : userQuestion,
          isActive: true,
        };
        console.log('新创建的会话对象:', newConversation);
        setConversations([newConversation]);
        setCurrentConversation(newConversation.id);
      }
    }

    // 创建AbortController用于取消请求
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // 准备请求数据
      const requestData = {
        question: userQuestion,
        userId: currentUserId, // 从用户状态获取
        sessionId: customSessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        knowledgeIds: [], // 这里可以从store获取知识ID列表
        stream: true,
      };

      // 调用新的RAG流式对话接口
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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
            console.log("[SSE]", eventName, parsed);

            if (eventName === "start") {
              // 保存会话ID（后端会在end事件里补充messageId）
              if (parsed.sessionId) {
                sessionIdRef.current = parsed.sessionId;
                window.__ragSessionId = parsed.sessionId;
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
                      isDisliked: aiMsg.isDisliked || false
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
              references = arr.map((ref) => ({
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
              // 自动加载首条引用到右侧预览
              if (references.length && references[0].downloadUrl) {
                try {
                  fetch(references[0].downloadUrl)
                    .then((r) => r.blob())
                    .then((b) => {
                      const url = URL.createObjectURL(b);
                      setPreviewFileUrl(url);
                      setPreviewPage(references[0].pageNum || 1);
                      setPreviewBboxes(references[0].bboxUnion ? [references[0].bboxUnion] : []);
                    });
                } catch {}
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
    
    // 调试信息
    console.log('handleSend - 调用信息:', {
      question: question,
      customQuestion: customQuestion,
      inputValue: inputValue,
      inputValueLength: inputValue.length,
      questionLength: question.length,
      questionTrimmed: question.trim(),
      questionTrimmedLength: question.trim().length,
      currentUserId: currentUserId,
      authStore: authStore,
      user: authStore.user
    });
    
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
    
    await handleStreamAIRequest(question, customSessionId);
  };

  const handleNewConversation = () => {
    // 调试信息
    console.log('handleNewConversation - 调用信息:', {
      currentUserId: currentUserId,
      authStore: authStore,
      user: authStore.user
    });

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
      
      console.log('新建会话成功:', newId);
    } catch (error) {
      console.error('新建会话失败:', error);
      message.error('新建会话失败，请重试');
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
    console.log('处理反馈，消息:', targetMessage); // 调试信息
    
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

    // 点赞直接提交
    try {
      const response = await engagementAPI.likeAnswer(
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
    } catch (error) {
      console.error('点赞失败:', error);
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
              
              <div className="search-section">
                <Input 
                  placeholder={currentUserId ? "搜索会话问题..." : "请先登录后再搜索"} 
                  prefix={<SearchOutlined />} 
                  className="conversation-search" 
                  disabled={!currentUserId}
                />
              </div>

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
                                    fetch(ref.downloadUrl)
                                      .then((r) => r.blob())
                                      .then((b) => {
                                        const url = URL.createObjectURL(b);
                                        setPreviewFileUrl(url);
                                        setPreviewPage(ref.pageNum || 1);
                                        setPreviewBboxes(ref.bboxUnion ? [ref.bboxUnion] : []);
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
                        ) : message.isRegenerating ? (
                          <div className="thinking-indicator">
                            <Spin size="small" />
                            <span>正在重新生成...</span>
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
                                onClick={() => {
                                  if (ref.downloadUrl) {
                                    fetch(ref.downloadUrl)
                                      .then((r) => r.blob())
                                      .then((b) => {
                                        const url = URL.createObjectURL(b);
                                        setPreviewFileUrl(url);
                                        setPreviewPage(ref.pageNum || 1);
                                        setPreviewBboxes(ref.bboxUnion ? [ref.bboxUnion] : []);
                                      });
                                  }
                                }}
                              >
                                <FilePdfOutlined className="pdf-icon" />
                                <span style={{ cursor: "pointer" }}>
                                  {ref.sourceFile || ref.knowledgeName || "引用文档"}（第{ref.pageNum}页）
                                </span>
                                {ref.downloadUrl && (
                                  <a
                                    href={ref.downloadUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ marginLeft: 8 }}
                                  >
                                    下载
                                  </a>
                                )}
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
                          <Tooltip title="点赞回答">
                            <Button
                              type="text"
                              size="small"
                              icon={message.isLiked ? <LikeFilled style={{ color: 'var(--ant-color-primary)' }} /> : <LikeOutlined />}
                              onClick={() => handleFeedback(message.id, "like")}
                            />
                          </Tooltip>
                          <Tooltip title="点踩回答（需要填写反馈）">
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
              
              {/* 停止按钮 */}
              {isLoading && (
                <div className="stop-section" style={{ marginBottom: '12px', textAlign: 'center' }}>
                  <Button type="default" icon={<StopOutlined />} onClick={handleCancelRequest} className="stop-button">
                    停止回答
                  </Button>
                </div>
              )}

              <div className="input-container">
                <TextArea
                  value={inputValue}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log('TextArea onChange:', {
                      oldValue: inputValue,
                      newValue: newValue,
                      oldValueLength: inputValue.length,
                      newValueLength: newValue.length,
                      oldValueTrimmed: inputValue.trim(),
                      newValueTrimmed: newValue.trim()
                    });
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
                    console.log('发送按钮点击:', {
                      inputValue: inputValue,
                      inputValueLength: inputValue.length,
                      inputValueTrimmed: inputValue.trim(),
                      inputValueTrimmedLength: inputValue.trim().length,
                      currentUserId: currentUserId,
                      isLoading: isLoading
                    });
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
            // 获取最新的AI回答消息
            const latestAIMessage = messages
              .filter(msg => msg.type === 'ai' && msg.references && msg.references.length > 0)
              .pop();
            
            // 如果没有最新的AI回答或有引用，则不显示侧边栏
            if (!latestAIMessage || !latestAIMessage.references || latestAIMessage.references.length === 0) {
              return null;
            }
            
            return (
              <div className="related-text-sider">
                <div className="related-text-header">
                  <h3>RelatedText</h3>
                  
                </div>
                <div className="related-text-content">
                  {latestAIMessage.references.map((reference, index) => (
                    <div key={`${latestAIMessage.id}-${index}`}>
                      <Card 
                        className="related-text-card" 
                        size="small"
                        style={{ cursor: 'pointer', marginBottom: '12px' }}
                        onClick={() => handleToggleRelatedTextExpansion(reference)}
                      >
                        <div className="related-text-knowledge">
                          <FileTextOutlined className="file-icon" style={{ color: '#1890ff', marginRight: '8px' }} />
                          <div className="knowledge-info">
                            <div className="knowledge-name">{reference.knowledgeName || reference.sourceFile || "引用文档"}</div>
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
                      {expandedRelatedText[reference.knowledgeId] && (
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
                              {reference.knowledgeName || reference.sourceFile || "引用文档"}
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
                            {expandedRelatedTextLoading[reference.knowledgeId] ? (
                              <div style={{ padding: '16px', textAlign: 'center' }}>
                                <Spin size="small" />
                                <p style={{ margin: '8px 0 0 0', color: '#999' }}>加载中...</p>
                              </div>
                            ) : expandedRelatedTextData[reference.knowledgeId] ? (
                              <SourceExpandedDetail 
                                knowledgeDetail={expandedRelatedTextData[reference.knowledgeId]} 
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
