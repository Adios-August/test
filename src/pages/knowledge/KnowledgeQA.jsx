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
  Modal,
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
import PdfPreview from "../../components/PdfPreview";
import { chatAPI } from "../../api/chat";
import { feedbackAPI } from "../../api/feedback";
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
  const [previewFileUrl, setPreviewFileUrl] = useState("");
  const [previewPage, setPreviewPage] = useState(1);
  const [previewBboxes, setPreviewBboxes] = useState([]);
  const messagesEndRef = useRef(null);

  // 反馈相关状态
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState("");
  const [currentMessageId, setCurrentMessageId] = useState(null);
  const [feedbackPosition, setFeedbackPosition] = useState({ x: 0, y: 0 });

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
      key: "reference-tab",
      label: "Reference Text",
      children: (
        <div className="reference-content">
          <Collapse defaultActiveKey={["panel-1", "panel-2", "panel-3"]} ghost>
            <Panel
              header="产品培训合集_易方达增强回报"
              key="panel-1"
              className="reference-panel"
            >
              <p>
                包含信息如下: 【Page 26】产品近期表现不佳的原因?
                近年来资本市场的变化错综复杂。
              </p>
            </Panel>
            <Panel
              header="【LUT】产品回顾及展望-易方达专场"
              key="panel-2"
              className="reference-panel"
            >
              <p>
                时值年末,特邀易方达业务团队就今年热卖的存量产品为大家做一下表现回顾与归因分析,回答大家关心的问题,并分享2024市场观点。
              </p>
            </Panel>
            <Panel
              header="财富来源回顾培训2025Jul.pdf"
              key="panel-3"
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
      key: "related-tab",
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
      id: Date.now() + Math.random(),
      type: "user",
      content: userQuestion,
      timestamp: new Date(),
    };

    // 添加空的AI回复消息
    const newAIMessage = {
      id: Date.now() + Math.random() + 1,
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
          'Accept': 'text/event-stream',
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

        // 事件块解析：以空行分隔，一个事件可能包含多条 data:
        const findDelimiter = () => {
          const a = buffer.indexOf('\n\n');
          const b = buffer.indexOf('\r\n\r\n');
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
            buffer = buffer.slice(sepIdx).replace(/^(?:\r?\n){2}/, '');

            const lines = rawEvent.split(/\r?\n/);
            let eventName = 'message';
            const dataLines = [];
            for (const line of lines) {
              if (!line) continue;
              if (line.startsWith('event:')) {
                eventName = line.slice(6).trim();
              } else if (line.startsWith('data:')) {
                dataLines.push(line.slice(5).trimStart());
              }
            }
            const dataStr = dataLines.join('\n');
            if (!dataStr) continue;

            let parsed;
            try {
              parsed = JSON.parse(dataStr);
            } catch (e) {
              // 可能半包，放回缓冲等待后续片段
              buffer = dataStr + '\n\n' + buffer;
              break;
            }

            // 调试日志，观察解析到的事件
            // eslint-disable-next-line no-console
            console.log('[SSE]', eventName, parsed);

            if (eventName === 'start') {
              // 可在此保存后端生成的sessionId
              // if (parsed.sessionId) setSessionId(parsed.sessionId)
            } else if (eventName === 'message') {
              const { content } = parsed;
              if (typeof content === 'string' && content.length) {
                answer += content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  const aiIndex = [...newMessages].reverse().findIndex(m => m?.type === 'ai');
                  if (aiIndex !== -1) {
                    const realIndex = newMessages.length - 1 - aiIndex;
                    const aiMsg = newMessages[realIndex];
                    newMessages[realIndex] = { ...aiMsg, content: answer, references: references };
                  }
                  return newMessages;
                });
              }
            } else if (eventName === 'references') {
              // 仅AI命中的块，后端包含 download_url
              const arr = Array.isArray(parsed) ? parsed : [];
              references = arr.map(ref => ({
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
                    .then(r => r.blob())
                    .then(b => {
                      const url = URL.createObjectURL(b);
                      setPreviewFileUrl(url);
                      setPreviewPage(references[0].pageNum || 1);
                      setPreviewBboxes(references[0].bboxUnion ? [references[0].bboxUnion] : []);
                    });
                } catch {}
              }
              setMessages(prev => {
                const newMessages = [...prev];
                const aiIndex = [...newMessages].reverse().findIndex(m => m?.type === 'ai');
                if (aiIndex !== -1) {
                  const realIndex = newMessages.length - 1 - aiIndex;
                  const aiMsg = newMessages[realIndex];
                  newMessages[realIndex] = { ...aiMsg, references: references };
                }
                return newMessages;
              });
            } else if (eventName === 'end') {
              // 兜底同步一次内容与引用并关闭loading
              setMessages(prev => {
                const newMessages = [...prev];
                const aiIndex = [...newMessages].reverse().findIndex(m => m?.type === 'ai');
                if (aiIndex !== -1) {
                  const realIndex = newMessages.length - 1 - aiIndex;
                  const aiMsg = newMessages[realIndex];
                  newMessages[realIndex] = { ...aiMsg, content: answer, references: references };
                }
                return newMessages;
              });
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
    const newId = Date.now() + Math.random();
    const newConversation = {
      id: newId,
      title: "新会话问题",
      isActive: true,
    };

    setConversations(prev => {
      const updatedConversations = prev.map((conv) => ({ ...conv, isActive: false }));
      return [...updatedConversations, newConversation];
    });
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

  const handleFeedback = async (messageId, type, event) => {
    if (type === "dislike") {
      // 点踩时需要打开反馈弹窗
      setCurrentMessageId(messageId);
      
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

    // 点赞直接提交
    try {
      const feedbackData = {
        messageId: messageId,
        type: type,
        userId: "user123", // 这里应该从用户状态获取
        sessionId: `session_${currentConversation}`,
        timestamp: new Date().toISOString()
      };

      const response = await feedbackAPI.submitFeedback(feedbackData);
      
      if (response.code === 200) {
        message.success(`已${type === "like" ? "点赞" : "点踩"}该回答`);
      } else {
        message.error(response.message || "操作失败，请重试");
      }
    } catch (error) {
      console.error("提交反馈失败:", error);
      message.error("操作失败，请重试");
    }
  };

  // 提交反馈弹窗中的反馈
  const handleSubmitFeedback = async () => {
    if (!feedbackContent.trim()) {
      message.warning("请输入反馈内容");
      return;
    }

    try {
      const feedbackData = {
        messageId: currentMessageId,
        type: "dislike",
        userId: "user123", // 这里应该从用户状态获取
        sessionId: `session_${currentConversation}`,
        timestamp: new Date().toISOString(),
        content: feedbackContent.trim() // 添加反馈内容
      };

      const response = await feedbackAPI.submitFeedback(feedbackData);
      
      if (response.code === 200) {
        message.success("已提交反馈");
        setFeedbackModalVisible(false);
        setFeedbackContent("");
        setCurrentMessageId(null);
      } else {
        message.error(response.message || "提交失败，请重试");
      }
    } catch (error) {
      console.error("提交反馈失败:", error);
      message.error("提交失败，请重试");
    }
  };

  // 取消反馈弹窗
  const handleCancelFeedback = () => {
    setFeedbackModalVisible(false);
    setFeedbackContent("");
    setCurrentMessageId(null);
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
                      key={item.id}
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
                                      .then(r => r.blob())
                                      .then(b => {
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
                        ) : (
                          isLoading && message.id === messages[messages.length - 1]?.id ? (
                            <div className="thinking-indicator">
                              <Spin size="small" />
                              <span>AI正在思考中...</span>
                            </div>
                          ) : (
                            <span />
                          )
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
                                      .then(r => r.blob())
                                      .then(b => {
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
                            />
                          </Tooltip>
                          <Tooltip title="点赞回答">
                            <Button
                              type="text"
                              size="small"
                              icon={<LikeOutlined />}
                              onClick={() => handleFeedback(message.id, "like")}
                            />
                          </Tooltip>
                          <Tooltip title="点踩回答（需要填写反馈）">
                            <Button
                              type="text"
                              size="small"
                              icon={<DislikeOutlined />}
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
                defaultActiveKey="preview-tab"
                items={[
                  {
                    key: "preview-tab",
                    label: "Related Text",
                    children: (
                      previewFileUrl ? (
                        <PdfPreview fileUrl={previewFileUrl} pageNum={previewPage} bboxes={previewBboxes} />
                      ) : (
                        <Empty description="等待引用加载" />
                      )
                    ),
                  },
                  ...referenceData.filter(i => i.key !== "related-tab"),
                ]}
                className="reference-tabs"
              />
            </div>
          </div>
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