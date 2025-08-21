import React, { useState, useEffect, useRef } from "react";
import {
  Layout,
  Input,
  Button,
  Card,
  Avatar,
  Space,
  List,
  Collapse,
  Badge,
  Tabs,
  message,
  Spin,
  Tooltip,
  Typography,
  Divider,
  Empty,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  SendOutlined,
  CopyOutlined,
  ReloadOutlined,
  LikeOutlined,
  DislikeOutlined,
  FilePdfOutlined,
  ArrowLeftOutlined,
  RobotOutlined,
  UserOutlined,
  LoadingOutlined,
  StopOutlined,
  HistoryOutlined,
  SettingOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import StreamingMarkdownRenderer from "../../components/StreamingMarkdownRenderer";
import { chatAPI } from "../../api/chat";
import "./KnowledgeQA.scss";

const { Sider, Content } = Layout;
const { TextArea } = Input;
const { Panel } = Collapse;
const { TabPane } = Tabs;
const { Title } = Typography;

const KnowledgeQA = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 从路由状态获取传递的问题
  const initialQuestion = location.state?.question || "易方达增强回报基金选择理由";
  
  const [inputValue, setInputValue] = useState("");
  const [conversations, setConversations] = useState([
    {
      id: 1,
      title: initialQuestion.length > 20 ? initialQuestion.substring(0, 20) + "..." : initialQuestion,
      isActive: true,
    },
  ]);
  const [currentConversation, setCurrentConversation] = useState(1);
  
  const [messages, setMessages] = useState([
    
  ]);

  // AI请求相关状态
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const messagesEndRef = useRef(null);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 页面加载时自动调用AI接口回答传递的问题
  useEffect(() => {
    if (initialQuestion && initialQuestion !== "易方达增强回报基金选择理由") {
      // 延迟一下，确保页面完全加载
      const timer = setTimeout(() => {
        handleStreamAIRequest(initialQuestion);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [initialQuestion]);

  // 参考资料数据
  const referenceData = [
    {
      key: "1",
      label: "Reference Text",
      children: (
        <div className="reference-content">
          <Collapse defaultActiveKey={["1", "2", "3"]} ghost>
            <Panel
              header="产品培训合集_易方达增强回报"
              key="1"
              className="reference-panel"
            >
              <p>
                包含信息如下: 【Page 26】产品近期表现不佳的原因?
                近年来资本市场的变化错综复杂。
              </p>
            </Panel>
            <Panel
              header="【LUT】产品回顾及展望-易方达专场"
              key="2"
              className="reference-panel"
            >
              <p>
                时值年末,特邀易方达业务团队就今年热卖的存量产品为大家做一下表现回顾与归因分析,回答大家关心的问题,并分享2024市场观点。
              </p>
            </Panel>
            <Panel
              header="财富来源回顾培训2025Jul.pdf"
              key="3"
              className="reference-panel"
            >
              <div className="pdf-reference">
                <FilePdfOutlined className="pdf-icon" />
                <span>点击查看PDF文档</span>
              </div>
            </Panel>
          </Collapse>
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <span>
          Related Text
          
        </span>
      ),
      children: <div className="related-content">相关文本内容</div>,
    },
  ];

  // 流式AI请求处理
  const handleStreamAIRequest = async (userQuestion) => {
    if (isLoading) return;
    
    setIsLoading(true);

    // 添加用户消息
    const newUserMessage = {
      id: messages.length + 1,
      type: "user",
      content: userQuestion,
      timestamp: new Date(),
    };

    // 添加空的AI回复消息
    const newAIMessage = {
      id: messages.length + 2,
      type: "ai",
      content: "",
      timestamp: new Date(),
      references: [],
    };

    setMessages(prev => [...prev, newUserMessage, newAIMessage]);
    
    // 更新当前会话的标题
    if (currentConversation) {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === currentConversation 
            ? { ...conv, title: userQuestion.length > 20 ? userQuestion.substring(0, 20) + "..." : userQuestion }
            : conv
        )
      );
    }

    // 创建AbortController用于取消请求
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // 准备请求数据
      const requestData = {
        question: userQuestion,
        userId: "user123", // 这里应该从用户状态获取
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        knowledgeIds: [], // 这里可以从store获取知识ID列表
        stream: true
      };

      // 调用新的RAG流式对话接口
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData),
        signal: controller.signal
      });

      if (response.ok) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let answer = '';
        let references = [];
        let buffer = '';
        let currentEvent = '';
        let currentData = '';

        while (true) {
          if (controller.signal?.aborted) {
            reader.cancel();
            break;
          }

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
                  console.log('RAG对话开始:', parsed.message);
                } else if (currentEvent === 'message') {
                  if (parsed.content) {
                    answer += parsed.content;
                    setMessages(prev => {
                      const newMessages = [...prev];
                      const lastMessage = newMessages[newMessages.length - 1];
                      if (lastMessage.type === "ai") {
                        lastMessage.content = answer;
                        lastMessage.references = references;
                      }
                      return newMessages;
                    });
                  }
                } else if (currentEvent === 'references') {
                  references = parsed;
                } else if (currentEvent === 'end') {
                  console.log('RAG对话完成:', parsed.message);
                  setIsLoading(false);
                  return;
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
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.type === "ai" && lastMessage.content === "") {
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



  const handleSend = () => {
    if (!inputValue.trim()) {
      message.warning("请输入问题");
      return;
    }

    if (isLoading) {
      message.warning("AI正在思考中，请稍候...");
      return;
    }

    const question = inputValue.trim();
    setInputValue("");
    handleStreamAIRequest(question);
  };

  const handleNewConversation = () => {
    const newId = conversations.length + 1;
    const newConversation = {
      id: newId,
      title: "新会话问题",
      isActive: true,
    };

    setConversations(
      conversations.map((conv) => ({ ...conv, isActive: false }))
    );
    setConversations([...conversations, newConversation]);
    setCurrentConversation(newId);
    setMessages([]);
    setInputValue(""); // 清空输入框
  };

  const handleConversationSelect = (conversationId) => {
    setConversations(
      conversations.map((conv) => ({
        ...conv,
        isActive: conv.id === conversationId,
      }))
    );
    setCurrentConversation(conversationId);
  };

  const handleBackToKnowledge = () => {
    navigate("/knowledge");
  };

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content);
    message.success("已复制到剪贴板");
  };

  const handleFeedback = (messageId, type) => {
    message.success(`已${type === "like" ? "点赞" : "点踩"}该回答`);
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
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={handleBackToKnowledge}
                className="back-button"
              >
                返回知识库
              </Button>
            </div>

            <div className="conversation-content">
              <div className="search-section">
                <Input
                  placeholder="搜索会话问题..."
                  prefix={<SearchOutlined />}
                  className="conversation-search"
                />
              </div>

              <div className="new-conversation-section">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleNewConversation}
                  className="new-conversation-btn"
                  block
                >
                  新建会话问题
                </Button>
              </div>

              <div className="conversation-list">
                <List
                  dataSource={conversations}
                  renderItem={(item) => (
                    <List.Item
                      className={`conversation-item ${
                        item.isActive ? "active" : ""
                      }`}
                      onClick={() => handleConversationSelect(item.id)}
                    >
                      <div className="conversation-title">{item.title}</div>
                    </List.Item>
                  )}
                />
              </div>
            </div>
          </div>

          {/* 中间问答界面 */}
          <div className="qa-content">
            

            <div className="messages-container">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.type === "user" ? "user" : "ai"}`}
                >
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
                        {message.content ? (
                          <StreamingMarkdownRenderer 
                            content={message.content} 
                            isStreaming={isLoading && message.id === messages.length}
                          />
                        ) : (
                          <div className="thinking-indicator">
                            <Spin size="small" />
                            <span>AI正在思考中...</span>
                          </div>
                        )}
                      </div>
                      
                      {message.type === "ai" && message.references && message.references.length > 0 && (
                        <div className="message-references">
                          <div className="learn-more">
                            <span>Learn More</span>
                            {message.references.map((ref, index) => (
                              <div key={index} className="reference-item">
                                <FilePdfOutlined className="pdf-icon" />
                                <span>{ref.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {message.type === "ai" && (
                        <div className="message-actions">
                          <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => handleCopyMessage(message.content)}
                          />
                          <Button
                            type="text"
                            size="small"
                            icon={<ReloadOutlined />}
                          />
                          <Button
                            type="text"
                            size="small"
                            icon={<LikeOutlined />}
                            onClick={() => handleFeedback(message.id, "like")}
                          />
                          <Button
                            type="text"
                            size="small"
                            icon={<DislikeOutlined />}
                            onClick={() => handleFeedback(message.id, "dislike")}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-section">
              <div className="input-container">
                <TextArea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="请在这里继续输入问题"
                  rows={2}
                  className="question-input"
                  disabled={isLoading}
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
                  onClick={handleSend}
                  className="send-button"
                  disabled={isLoading || !inputValue.trim()}
                >
                  {isLoading ? "思考中..." : "发送"}
                </Button>
              </div>
              
              {/* 停止按钮 */}
              {isLoading && (
                <div className="stop-section">
                  <Button
                    type="default"
                    icon={<StopOutlined />}
                    onClick={handleCancelRequest}
                    className="stop-button"
                  >
                    停止回答
                  </Button>
                </div>
              )}

              
            </div>
          </div>

          {/* 右侧参考资料 */}
          <div className="reference-sider">
            <div className="reference-header">
              <Tabs
                defaultActiveKey="1"
                items={referenceData}
                className="reference-tabs"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeQA; 