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
import { API_CONFIG, getQianwenHeaders, getQianwenRequestData } from "../../config/api";
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
          <Badge count={1} size="small" style={{ marginLeft: 8 }} />
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
      // 调用千问AI API，使用智能流式渲染
      await qianwenStreamRequest(userQuestion, (content, isComplete) => {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.type === "ai") {
            if (isComplete) {
              // 如果是完整的内容，直接更新
              lastMessage.content = content;
            } else {
              // 如果是流式内容，累积更新
              lastMessage.content += content;
            }
          }
          return newMessages;
        });
      }, controller.signal);
    } catch (error) {
      if (error.name !== "AbortError") {
        let errorMessage = "AI回复生成失败，请重试";
        
        if (error.message.includes("401")) {
          errorMessage = "API密钥无效，请检查配置";
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

  // 千问AI流式请求
  const qianwenStreamRequest = async (question, onData, signal) => {
    const url = API_CONFIG.QIANWEN.BASE_URL;
    
    const requestData = getQianwenRequestData([
      {
        role: "user",
        content: question
      }
    ]);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: getQianwenHeaders(),
        body: JSON.stringify(requestData),
        signal: signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedContent = "";
      let lastTableState = null;

      try {
        while (true) {
          if (signal?.aborted) {
            reader.cancel();
            break;
          }

          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const jsonStr = line.substring(6);
                const json = JSON.parse(jsonStr);

                if (json.choices && json.choices.length > 0 && json.choices[0].delta && json.choices[0].delta.content) {
                  const newContent = json.choices[0].delta.content;
                  accumulatedContent += newContent;
                  
                  // 检查是否包含表格结构
                  const tableState = detectTableState(accumulatedContent);
                  
                  if (tableState.isInTable && tableState.isCompleteRow) {
                    // 如果表格行完整，重新渲染整个内容
                    onData(accumulatedContent, false);
                    lastTableState = tableState;
                  } else if (tableState.isInTable && !tableState.isCompleteRow) {
                    // 如果表格行不完整，继续累积
                    onData(accumulatedContent, false);
                  } else {
                    // 如果不是表格或表格行完整，正常流式更新
                    onData(newContent, false);
                  }
                }
              } catch (e) {
                console.error("解析JSON失败:", e);
              }
            }
          }
          
          // 流式请求结束，发送完整内容
          onData(accumulatedContent, true);
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        throw error;
      }
    }
  };

  // 检测表格状态的辅助函数
  const detectTableState = (content) => {
    const lines = content.split('\n');
    let isInTable = false;
    let isCompleteRow = false;
    let tableStartIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 检测表格开始
      if (line.includes('|') && line.split('|').length > 2) {
        if (tableStartIndex === -1) {
          tableStartIndex = i;
          isInTable = true;
        }
      }
      
      // 检测表格行是否完整
      if (isInTable && line.includes('|')) {
        const columns = line.split('|').filter(col => col.trim() !== '');
        if (columns.length >= 2) {
          isCompleteRow = true;
        }
      }
      
      // 检测表格结束（空行或非表格行）
      if (isInTable && line === '' && i > tableStartIndex) {
        isInTable = false;
        break;
      }
    }
    
    return { isInTable, isCompleteRow };
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