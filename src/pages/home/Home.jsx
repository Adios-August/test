import React, { useState, useEffect } from "react";
import { Layout, Card, Row, Col, Input, Button, Tag, List, Spin, message } from "antd";
import {
  EyeOutlined,
  TagOutlined,
  DownloadOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  HeartOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import HomeSidebar from "./HomeSidebar";
import homeBanner from "../../assets/image/home_banner.png";
import { homeAPI } from "../../api";
import "./Home.scss";

const { Content } = Layout;

const Home = () => {
  const [popularKnowledge, setPopularKnowledge] = useState([]);
  const [latestKnowledgeData, setLatestKnowledgeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [latestLoading, setLatestLoading] = useState(false);

  const hotTags = [
    { name: "热门标签" },
    { name: "新上产品" },
    { name: "国际账户问题" },
    { name: "大会员问题" },
    { name: "信用卡问题" },
  ];

  const hottestResources = [
    { title: "每日基金价格.xlsx", downloads: 205, icon: <DownloadOutlined  /> },
    { title: "产品推介.PDF", downloads: 200, icon: <DownloadOutlined /> },
    { title: "投资策略报告.docx", downloads: 180, icon: <DownloadOutlined /> },
    { title: "市场分析数据.xlsx", downloads: 165, icon: <DownloadOutlined /> },
    { title: "产品手册.PDF", downloads: 150, icon: <DownloadOutlined  /> },
  ];





  // 获取热门知识列表
  const fetchPopularKnowledge = async () => {
    setLoading(true);
    try {
      const response = await homeAPI.getPopularKnowledge(10);
      if (response.code === 200) {
        setPopularKnowledge(response.data || []);
      } else {
        message.error(response.message || '获取热门知识失败');
      }
    } catch (error) {
      console.error('获取热门知识失败:', error);
      message.error('获取热门知识失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取最新知识列表
  const fetchLatestKnowledge = async () => {
    setLatestLoading(true);
    try {
      const response = await homeAPI.getLatestKnowledge(10);
      if (response.code === 200) {
        setLatestKnowledgeData(response.data || []);
      } else {
        message.error(response.message || '获取最新知识失败');
      }
    } catch (error) {
      console.error('获取最新知识失败:', error);
      message.error('获取最新知识失败，请稍后重试');
    } finally {
      setLatestLoading(false);
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchPopularKnowledge();
    fetchLatestKnowledge();
  }, []);



  return (
    <Layout className="home-layout">
      <HomeSidebar />
      <Content className="home-content">
        <div className="home-page">
          <div className="search-section">
            <div className="search-container">
              <div className="search-content">
                <Input
                  placeholder="请输入关键字"
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

                <div className="hot-tags-section">
                  <div className="hot-tags-header">
                    <span className="hot-tags-title">
                    <TagOutlined />
                      热门标签</span>
                    {hotTags.map((tag, index) => (
                      <Tag key={index} className="hot-tag" onClick={() => handleTagClick(tag)}>
                        {tag.name}
                      </Tag>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* 左下角图片 */}
              <div className="search-banner">
                <img src={homeBanner} alt="首页横幅" />
              </div>
            </div>
          </div>

          <Row gutter={[16, 16]} className="content-panels">
            <Col xs={24} lg={8}>
              <Card className="panel-card">
                <div className="panel-header">
                  <div className="panel-title">
                    <HeartOutlined className="panel-icon" />
                    <span>知识推荐</span>
                  </div>
                </div>

                {loading ? (
                  <div className="loading-container">
                    <Spin size="large" />
                    <p>加载中...</p>
                  </div>
                ) : (
                  <List
                    className="panel-list"
                    dataSource={popularKnowledge}
                    renderItem={(item, index) => (
                      <List.Item className="panel-item">
                        <div className="item-content">
                          <span className="item-number">{index + 1}</span>
                          <span className="item-title">{item.name}</span>
                          <span className="item-meta">
                            <EyeOutlined /> {item.searchCount || 0}
                          </span>
                        </div>
                        {item.tags && item.tags.length > 0 && (
                          <div className="item-tags">
                            {item.tags.slice(0, 2).map((tag, tagIndex) => (
                              <Tag key={tagIndex} size="small" color="blue">
                                {tag}
                              </Tag>
                            ))}
                          </div>
                        )}
                      </List.Item>
                    )}
                  />
                )}

                <div className="panel-footer">
                  <Button type="link" icon={<MoreOutlined />}>
                    更多
                  </Button>
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card className="panel-card">
                <div className="panel-header">
                  <div className="panel-title">
                    <ClockCircleOutlined className="panel-icon"  />
                    <span>最新知识</span>
                  </div>
                </div>

                {latestLoading ? (
                  <div className="loading-container">
                    <Spin size="large" />
                    <p>加载中...</p>
                  </div>
                ) : (
                  <List
                    className="panel-list"
                    dataSource={latestKnowledgeData}
                    renderItem={(item, index) => (
                      <List.Item className="panel-item">
                        <div className="item-content">
                          <span className="item-number">{index + 1}</span>
                          <span className="item-title">{item.name}</span>
                          <span className="item-meta">
                            <ClockCircleOutlined /> {new Date(item.createdTime).toLocaleDateString()}
                          </span>
                        </div>
                        {item.tags && item.tags.length > 0 && (
                          <div className="item-tags">
                            {item.tags.slice(0, 2).map((tag, tagIndex) => (
                              <Tag key={tagIndex} size="small" color="green">
                                {tag}
                              </Tag>
                            ))}
                          </div>
                        )}
                      </List.Item>
                    )}
                  />
                )}

                <div className="panel-footer">
                  <Button type="link" icon={<MoreOutlined />}>
                    更多
                  </Button>
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card className="panel-card">
                <div className="panel-header">
                  <div className="panel-title">
                    <DownloadOutlined className="panel-icon"  />
                    <span>最热资料</span>
                  </div>
                </div>

                <List
                  className="panel-list"
                  dataSource={hottestResources}
                  renderItem={(item, index) => (
                    <List.Item className="panel-item">
                      <div className="item-content">
                        <span className="item-number">{index + 1}</span>
                        <span className="item-title">{item.title}</span>
                        {item.downloads && (
                          <span className="item-meta">
                            {item.icon} {item.downloads}
                          </span>
                        )}
                      </div>
                    </List.Item>
                  )}
                />

                <div className="panel-footer">
                  <Button type="link" icon={<MoreOutlined />}>
                    更多
                  </Button>
                </div>
              </Card>
            </Col>

          </Row>
        </div>
      </Content>
    </Layout>
  );
};

export default Home;
