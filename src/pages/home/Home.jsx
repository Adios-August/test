import React, { useState } from "react";
import { Layout, Card, Row, Col, Input, Button, Tag, List, Badge, Space } from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  CalendarOutlined,
  DownloadOutlined,
  FireOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  HeartOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  MoreOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import HomeSidebar from "./HomeSidebar";
import homeBanner from "../../assets/image/home_banner.png";
import "./Home.scss";

const { Content } = Layout;

const { Search } = Input;

const Home = () => {
  const [searchValue, setSearchValue] = useState("");

  const hotTags = [
    { name: "热门标签" },
    { name: "新上产品" },
    { name: "国际账户问题" },
    { name: "大会员问题" },
    { name: "信用卡问题" },
  ];

  const knowledgeRecommendations = [
    { title: "QDUT Tools for RM(20250702)", views: 156, icon: <EyeOutlined /> },
    { title: "QDUT每日价格-20250703", views: 150, icon: <EyeOutlined /> },
    { title: "MRF产品资质培训", icon: <FileTextOutlined /> },
    { title: "LUT产品资质培训", icon: <FileTextOutlined /> },
    { title: "Market Tracker", icon: <FileTextOutlined /> },
    { title: "QDII top AUM fund", icon: <FileTextOutlined /> },
    { title: "每周投资晨会", icon: <FileTextOutlined /> },
  ];

  const latestKnowledge = [
    { title: "Wealth Sales 7月视频精讲", date: "2025/7/23", icon: <ArrowUpOutlined style={{ color: "#52c41a" }} /> },
    { title: "产品图谱", date: "2025/3/20", icon: <ArrowUpOutlined style={{ color: "#52c41a" }} /> },
    { title: "QDUT每日价格", icon: <FileTextOutlined /> },
    { title: "MRF产品资质培训", icon: <FileTextOutlined /> },
    { title: "Alts 另类策略产品台账", icon: <FileTextOutlined /> },
    { title: "汇丰晋信基金材料", icon: <FileTextOutlined /> },
    { title: "外贸信托私享", icon: <FileTextOutlined /> },
  ];

  const hottestResources = [
    { title: "每日基金价格.xlsx", downloads: 205, icon: <FileExcelOutlined style={{ color: "#52c41a" }} /> },
    { title: "产品推介.PDF", downloads: 200, icon: <FilePdfOutlined style={{ color: "#ff4d4f" }} /> },
    { title: "", downloads: null, icon: null },
    { title: "", downloads: null, icon: null },
    { title: "", downloads: null, icon: null },
    { title: "", downloads: null, icon: null },
    { title: "", downloads: null, icon: null },
  ];

  const handleSearch = (value) => {
    console.log("搜索:", value);
  };

  const handleTagClick = (tag) => {
    console.log("点击标签:", tag);
  };

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
                    <span className="hot-tags-title">热门标签</span>
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

                <List
                  className="panel-list"
                  dataSource={knowledgeRecommendations}
                  renderItem={(item, index) => (
                    <List.Item className="panel-item">
                      <div className="item-content">
                        <span className="item-number">{index + 1}</span>
                        <span className="item-title">{item.title}</span>
                        {item.views && (
                          <span className="item-meta">
                            {item.icon} {item.views}
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

            <Col xs={24} lg={8}>
              <Card className="panel-card">
                <div className="panel-header">
                  <div className="panel-title">
                    <ClockCircleOutlined className="panel-icon"  />
                    <span>最新知识</span>
                  </div>
                </div>

                <List
                  className="panel-list"
                  dataSource={latestKnowledge}
                  renderItem={(item, index) => (
                    <List.Item className="panel-item">
                      <div className="item-content">
                        <span className="item-number">{index + 1}</span>
                        <span className="item-title">{item.title}</span>
                        {item.date && (
                          <span className="item-meta">
                            {item.icon} {item.date}
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
                  dataSource={hottestResources.filter((item) => item.title)}
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
