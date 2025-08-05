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
} from "antd";
import { useNavigate } from "react-router-dom";
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
} from "@ant-design/icons";
import KnowledgeSidebar from "./KnowledgeSidebar";
import SimplePDFViewer from "../../components/SimplePDFViewer";
import pdfFile1 from "../../assets/单士伟的简历.pdf";
import pdfFile2 from "../../assets/财务自由之路.pdf";
import "./Knowledge.scss";

const { Sider, Content } = Layout;
const { Search } = Input;

const Knowledge = () => {
  const navigate = useNavigate();
  const [searchCurrentPage, setSearchCurrentPage] = useState(1); // 搜索结果分页
  const [currentPdf, setCurrentPdf] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1);
  const [isNavigating, setIsNavigating] = useState(false); // 防止导航干扰
  const [previewingFileId, setPreviewingFileId] = useState(null); // 当前预览的文件ID

  // 源文件数据
  const sourceFiles = useMemo(() => [
    {
      id: 1,
      title: "单士伟的简历.pdf",
      type: "pdf",
      path: pdfFile1,
    },
    {
      id: 2,
      title: "财务自由之路.pdf",
      type: "pdf",
      path: pdfFile2,
    },
    {
      id: 3,
      title: "投资策略分析.pdf",
      type: "pdf",
      path: pdfFile1,
    },
    {
      id: 4,
      title: "市场趋势报告.pdf",
      type: "pdf",
      path: pdfFile2,
    },
    {
      id: 5,
      title: "产品推荐指南.pdf",
      type: "pdf",
      path: pdfFile1,
    },
    {
      id: 6,
      title: "客户服务手册.pdf",
      type: "pdf",
      path: pdfFile1,
    },
    {
      id: 7,
      title: "风险管理指南.pdf",
      type: "pdf",
      path: pdfFile2,
    },
  ], []);

  // 无限滚动配置
  const [displayedFiles, setDisplayedFiles] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const pageSize = 5; // 每次加载5个文件

  // 初始化显示的文件
  useEffect(() => {
    setDisplayedFiles(sourceFiles.slice(0, pageSize));
    setHasMore(sourceFiles.length > pageSize);
  }, []); // 只在组件挂载时执行一次

  // 加载更多文件
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    setTimeout(() => {
      const currentLength = displayedFiles.length;
      const newFiles = sourceFiles.slice(currentLength, currentLength + pageSize);
      setDisplayedFiles(prev => [...prev, ...newFiles]);
      setHasMore(currentLength + pageSize < sourceFiles.length);
      setLoading(false);
    }, 500);
  }, [loading, hasMore, displayedFiles.length, sourceFiles, pageSize]);

  // 搜索结果数据
  const searchResults = [
    {
      id: 1,
      title: "IWS 产品方案",
      date: "2025-07-30",
      description: "7月CIO观点及市场趋势分析，包含最新产品推荐和投资策略。",
      type: "pdf",
    },
    {
      id: 2,
      title: "外币精选方案July'25",
      date: "2025-07-25",
      description: "更新了使用方式，同步到Smart Search平台，提供更便捷的服务。",
      type: "pdf",
    },
    {
      id: 3,
      title: "财富来源回顾培训",
      date: "2025-07-08",
      description: "最新培训材料，包含产品知识和销售技巧。",
      type: "pdf",
    },
  ];

  // 自动预览第一个 PDF
  useEffect(() => {
    if (sourceFiles.length > 0 && !currentPdf) {
      handlePdfPreview(sourceFiles[0].path, sourceFiles[0].id);
    }
  }, []);

  // PDF 预览相关函数
  const handlePdfPreview = (pdfPath, fileId) => {
    console.log('=== PDF 预览信息 ===');
    console.log('PDF 文件路径:', pdfPath);
    console.log('PDF 文件ID:', fileId);
    console.log('PDF 完整URL:', window.location.origin + pdfPath);
    console.log('PDF 文件名:', sourceFiles.find(file => file.id === fileId)?.title);
    console.log('==================');
   
    setCurrentPdf(pdfPath);
    setPreviewingFileId(fileId);
    setPdfLoading(true);

    // 模拟加载过程
    setTimeout(() => {
      setPdfLoading(false);
      console.log("PDF 预览准备完成");
    }, 500);
  };

  const handlePdfClose = () => {
    setCurrentPdf(null);
    setPreviewingFileId(null);
    setPdfLoading(false);
  };

  const handleResultClick = (item) => {
    navigate(`/knowledge/${item.id}`);
  };

  return (
    <Layout className="knowledge-layout">
      {/* 顶部搜索栏 */}
      <div className="knowledge-header">
        <div className="search-container">
          <div className="search-input">
            <Input
              placeholder="7月产品推荐"
              prefix={<SearchOutlined />}
              suffix={
                <Button
                  type="text"
                  size="small"
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
        <KnowledgeSidebar />
        <Content className="knowledge-content">
          {/* AI助手聊天区域 */}
          <div className="chat-section">
            <div className="chat-message">
              <div className="message-header">
                <Avatar icon={<RobotOutlined />} className="ai-avatar" />
              </div>
              <div className="message-content">
                <p>根据2025年7月市场动态及机构推荐，以下基金产品值得关注：</p>
                <div className="highlighted-content">
                  <h4>科创债指数基金</h4>
                  <p>该基金在科技创新债券领域表现优异，预计将在7月发行新一期产品。</p>
                </div>
                <div className="message-actions">
                  <Button type="link" size="small">
                    Learn More
                  </Button>
                  <Button type="link" size="small" icon={<FilePdfOutlined />}>
                    财富来源回顾培训2025Jul.pdf
                  </Button>
                  <Space>
                    <Button type="text" size="small" icon={<LikeOutlined />} />
                    <Button type="text" size="small" icon={<DislikeOutlined />} />
                    <Button type="text" size="small" icon={<DownOutlined />} />
                  </Space>
                </div>
              </div>
            </div>

            {/* 继续解答区域 */}
            <div className="continue-section">
              <h4>继续为你解答</h4>
              <div className="suggested-questions">
                <Button type="default" size="small">
                  这些推荐的产品中，哪款性价比最高？
                </Button>
                <Button type="default" size="small">
                  银行主推哪些产品？
                </Button>
              </div>
              <div className="input-section">
                <div className="textarea-container">
                  <Input.TextArea 
                    placeholder="请在这里继续输入问题" 
                    rows={2} 
                    style={{ marginBottom: 0 }} 
                  />
                  <Button 
                    type="primary" 
                    icon={<SendOutlined />}
                    className="send-button"
                  >
                    发送
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 搜索结果区域 */}
          <div className="search-results">
            <div className="results-header">
              <span className="results-count">共找到{searchResults.length}个结果</span>
              <Button type="text" icon={<CalendarOutlined />}>
                更新日期 <DownOutlined />
              </Button>
            </div>

            <List
              className="results-list"
              itemLayout="horizontal"
              dataSource={searchResults.slice((searchCurrentPage - 1) * 3, searchCurrentPage * 3)}
              renderItem={(item) => (
                <List.Item
                  onClick={() => handleResultClick(item)}
                  style={{ cursor: 'pointer' }}
                  actions={[
                    <Button type="text" icon={<EyeOutlined />} size="small" />,
                    <Button type="text" icon={<DownloadOutlined />} size="small" />,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<FileTextOutlined className="file-icon" />}
                    title={
                      <div className="result-title">
                        <span>{item.title}</span>
                        <Tag color="red">{item.date}</Tag>
                      </div>
                    }
                    description={item.description}
                  />
                </List.Item>
              )}
            />

            <div className="pagination-section">
              <Pagination
                current={searchCurrentPage}
                total={searchResults.length}
                pageSize={3}
                onChange={setSearchCurrentPage}
                showSizeChanger={false}
                showQuickJumper={false}
                showPrevNextJumpers={true}
                showLessItems={true}
                prevIcon="上一页"
                nextIcon="下一页"
              />
            </div>
          </div>
        </Content>

        {/* 右侧Sources侧边栏 */}
        <Sider className="sources-sider" width={320}>
          <div className="sources-header">
            <h3>Sources</h3>
          </div>

          <div className="sources-content">
            {displayedFiles.map((file) => (
              <div key={file.id}>
                <Card 
                  className="source-card" 
                  size="small"
                  onClick={() => handlePdfPreview(file.path, file.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="source-file">
                    <FilePdfOutlined className="file-icon" />
                    <span className="file-name">{file.title}</span>
                  </div>
                </Card>

                {/* PDF 预览区域 - 显示在对应文件下方 */}
                {previewingFileId === file.id && currentPdf && (
                  <div className="pdf-preview-area">
                    <div className="pdf-preview-header">
                      <span>PDF 预览</span>
                      <Button type="text" size="small" icon={<CloseOutlined />} onClick={handlePdfClose} />
                    </div>
                    <div className="pdf-preview-container">
                      {pdfLoading ? (
                        <div className="pdf-loading">
                          <Spin size="large" />
                          <p>PDF 加载中...</p>
                        </div>
                      ) : (
                        <SimplePDFViewer pdfUrl={currentPdf} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* 无限滚动加载更多 */}
            {hasMore && (
              <div className="load-more-section">
                <Button 
                  type="text" 
                  onClick={loadMore}
                  loading={loading}
                  style={{ width: '100%', marginTop: '12px' }}
                >
                  {loading ? '加载中...' : '加载更多'}
                </Button>
              </div>
            )}
          </div>
        </Sider>
      </Layout>
    </Layout>
  );
};

export default Knowledge;
