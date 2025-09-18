import React, { useState, useEffect } from "react";
import { Layout, Input, Button, Card, Row, Col, List, Tag, message, Spin, Dropdown } from "antd";
import { useNavigate } from "react-router-dom";
import {
  HeartOutlined,
  ClockCircleOutlined,
  FireOutlined,
  EyeOutlined,
  TagOutlined,
  ExportOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import CommonSidebar from "../../components/CommonSidebar";
import { homeAPI } from "../../api/home";
import { http } from "../../utils/request";
import { addSearchHistory } from "../../utils/searchHistoryAPI";
import homeBanner from "../../assets/image/home_banner.png";
import "./Home.scss";

const { Content } = Layout;

const Home = observer(() => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showAllRecommended, setShowAllRecommended] = useState(false);
  const [popularKnowledge, setPopularKnowledge] = useState([]);
  const [latestKnowledgeData, setLatestKnowledgeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [latestLoading, setLatestLoading] = useState(false);
  const [hotDownloadsLoading, setHotDownloadsLoading] = useState(false);
  const [recommendedQuestions, setRecommendedQuestions] = useState([]);
  const [recommendedLoading, setRecommendedLoading] = useState(false);
  const [historyQuestions, setHistoryQuestions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const hotTags = [
    { name: "热门标签" },
    { name: "新上产品" },
    { name: "国际账户问题" },
    { name: "大会员问题" },
    { name: "信用卡问题" },
  ];

  // 最热资料
  const [hotDownloads, setHotDownloads] = useState([]);

  // 在当前页面打开知识详情
  const handleOpenInCurrentPage = (knowledgeId) => {
    navigate(`/knowledge-detail/${knowledgeId}`);
  };

  // 在新页面打开知识详情
  const handleOpenInNewPage = (knowledgeId) => {
    window.open(`/knowledge-detail/${knowledgeId}`, '_blank');
  };

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

  // 获取最热资料
  const fetchHotDownloads = async () => {
    setHotDownloadsLoading(true);
    try {
      const resp = await homeAPI.getHotDownloads(10);
      if (resp.code === 200) {
        setHotDownloads(resp.data || []);
      } else {
        message.error(resp.message || '获取最热资料失败');
        setHotDownloads([]);
      }
    } catch (e) {
      console.error('获取最热资料失败:', e);
      message.error('获取最热资料失败，请稍后重试');
      setHotDownloads([]);
    } finally {
      setHotDownloadsLoading(false);
    }
  };

  // 获取推荐问题
  const fetchRecommendedQuestions = async () => {
    setRecommendedLoading(true);
    try {
      const response = await homeAPI.getRecommendedQuestions(10);
      if (response.code === 200) {
        setRecommendedQuestions(response.data || []);
      } else {
        message.error(response.message || '获取推荐问题失败');
        setRecommendedQuestions([]);
      }
    } catch (error) {
      console.error('获取推荐问题失败:', error);
      message.error('获取推荐问题失败，请稍后重试');
      setRecommendedQuestions([]);
    } finally {
      setRecommendedLoading(false);
    }
  };

  // 获取历史问题
  const fetchHistoryQuestions = async () => {
    console.log('=== fetchHistoryQuestions 开始执行 ===');
    setHistoryLoading(true);
    try {
      // 从localStorage获取用户信息（使用authStore的存储key）
      const authStoreStr = localStorage.getItem('authStore');
      console.log('localStorage authStore:', authStoreStr);
      
      const authStore = JSON.parse(authStoreStr || '{}');
      console.log('解析后的 authStore:', authStore);
      
      const userId = authStore.user?.id;
      console.log('提取的 userId:', userId);
      
      if (!userId) {
        console.log('userId 为空，设置空数组');
        setHistoryQuestions([]);
        return;
      }
      
      console.log('准备调用 homeAPI.getHistoryQuestions，userId:', userId);
      const response = await homeAPI.getHistoryQuestions(userId);
      console.log('API 响应:', response);
      
      if (response.code === 200) {
        console.log('API 调用成功，数据:', response.data);
        // 将字符串数组转换为对象数组，以适配渲染逻辑
        const formattedData = (response.data || []).map((query, index) => ({
          id: index,
          query: query
        }));
        console.log('格式化后的数据:', formattedData);
        setHistoryQuestions(formattedData);
      } else {
        console.log('API 调用失败，错误信息:', response.message);
        message.error(response.message || '获取历史问题失败');
        setHistoryQuestions([]);
      }
    } catch (error) {
      console.error('获取历史问题异常:', error);
      setHistoryQuestions([]);
    } finally {
      console.log('=== fetchHistoryQuestions 执行结束 ===');
      setHistoryLoading(false);
    }
  };

  // 处理搜索
  const handleSearch = () => {
    if (!searchValue.trim()) {
      message.warning("请输入搜索关键词");
      return;
    }
    
    // 添加搜索历史
    addSearchHistory(searchValue.trim());
    
    // 跳转到知识库页面，并传递搜索关键词
    navigate("/knowledge", { 
      state: { 
        searchKeyword: searchValue.trim()
      } 
    });
  };

  // 处理回车搜索
  const handleSearchEnter = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 处理历史问题点击
  const handleHistoryQuestionClick = (question) => {
    setSearchValue(question);
    // 添加搜索历史
    addSearchHistory(question);
    // 自动跳转到知识库页面
    navigate("/knowledge", { 
      state: { 
        searchKeyword: question
      } 
    });
  };

  // 处理推荐问题点击
  const handleRecommendedQuestionClick = (question) => {
    // 如果question是对象，提取问题文本
    const questionText = typeof question === 'string' ? question : question.text || question.title || question;
    setSearchValue(questionText);
    // 添加搜索历史
    addSearchHistory(questionText);
    // 自动跳转到知识库页面
    navigate("/knowledge", { 
      state: { 
        searchKeyword: questionText
      } 
    });
  };

  // 重置搜索建议状态
  const resetSearchSuggestions = () => {
    setShowAllHistory(false);
    setShowAllRecommended(false);
  };

  // 处理标签点击
  const handleTagClick = (tag) => {
    setSearchValue(tag.name);
    // 自动跳转到知识库页面
    navigate("/knowledge", { 
      state: { 
        searchKeyword: tag.name
      } 
    });
  };



  // 组件挂载时获取数据
  useEffect(() => {
    fetchPopularKnowledge();
    fetchLatestKnowledge();
    fetchHotDownloads();
    fetchRecommendedQuestions(); // 添加获取推荐问题的调用
    fetchHistoryQuestions(); // 添加获取历史问题的调用
  }, []);



  return (
    <Layout className="home-layout">
      <CommonSidebar marginTop="24px" enableNavigation={true} />
      <Content className="home-content">
        <div className="home-page">
          <div className="search-section">
            <div className="search-container">
              <div className="search-content">
                {/* 搜索输入框容器 - 相对定位 */}
                <div className="search-input-container">
                  <Input
                    placeholder="请输入关键字"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onPressEnter={handleSearchEnter}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => {
                      setTimeout(() => {
                        setSearchFocused(false);
                        resetSearchSuggestions();
                      }, 300);
                    }}
                    suffix={
                      <Button
                        type="text"
                        size="small"
                        onClick={handleSearch}
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

                  {/* 搜索建议区域 */}
                  {searchFocused && (
                    <div 
                      className="search-suggestions"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div className="suggestions-content">
                        <div className="history-questions">
                          <div className="section-title">历史问题</div>
                          {historyLoading ? (
                            <div className="loading-questions">
                              <Spin size="small" />
                              <span>加载中...</span>
                            </div>
                          ) : historyQuestions.length > 0 ? (
                            <>
                              {(showAllHistory ? historyQuestions : historyQuestions.slice(0, 2)).map((historyItem) => (
                                <div 
                                  key={historyItem.id} 
                                  className="question-item"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleHistoryQuestionClick(historyItem.query);
                                  }}
                                >
                                  {historyItem.query}
                                </div>
                              ))}
                              {historyQuestions.length > 2 && (
                                <div 
                                  className="show-more-btn"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAllHistory(!showAllHistory);
                                  }}
                                >
                                  {showAllHistory ? '收起' : `查看更多 (${historyQuestions.length - 2})`}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="no-history">
                              <p>暂无搜索历史</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="recommended-questions">
                          <div className="section-title">推荐问题</div>
                          {recommendedLoading ? (
                            <div className="loading-questions">
                              <Spin size="small" />
                              <span>加载中...</span>
                            </div>
                          ) : recommendedQuestions.length > 0 ? (
                            <>
                              {(showAllRecommended ? recommendedQuestions : recommendedQuestions.slice(0, 2)).map((question, index) => (
                                <div 
                                  key={index} 
                                  className="question-item"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRecommendedQuestionClick(question);
                                  }}
                                >
                                  {question}
                                </div>
                              ))}
                              {recommendedQuestions.length > 2 && (
                                <div 
                                  className="show-more-btn"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAllRecommended(!showAllRecommended);
                                  }}
                                >
                                  {showAllRecommended ? '收起' : `查看更多 (${recommendedQuestions.length - 2})`}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="no-recommendations">
                              <p>暂无推荐问题</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

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
                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: 'current',
                              label: '在当前页面打开',
                              icon: <GlobalOutlined />,
                              onClick: () => handleOpenInCurrentPage(item.id),
                            },
                            {
                              key: 'new',
                              label: '在新页面打开',
                              icon: <ExportOutlined />,
                              onClick: () => handleOpenInNewPage(item.id),
                            },
                          ],
                        }}
                        trigger={['contextMenu']}
                      >
                        <List.Item 
                          className="panel-item"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleOpenInCurrentPage(item.id)}
                        >
                          <div className="item-content">
                            <span className="item-number">{index + 1}</span>
                            <span className="item-title">{item.name}</span>
                            <span className="item-meta">
                              <EyeOutlined /> {item.searchCount || 0}
                            </span>
                          </div>
                          
                        </List.Item>
                      </Dropdown>
                    )}
                  />
                )}

                 
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
                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: 'current',
                              label: '在当前页面打开',
                              icon: <GlobalOutlined />,
                              onClick: () => handleOpenInCurrentPage(item.id),
                            },
                            {
                              key: 'new',
                              label: '在新页面打开',
                              icon: <ExportOutlined />,
                              onClick: () => handleOpenInNewPage(item.id),
                            },
                          ],
                        }}
                        trigger={['contextMenu']}
                      >
                        <List.Item 
                          className="panel-item"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleOpenInCurrentPage(item.id)}
                        >
                          <div className="item-content">
                            <span className="item-number">{index + 1}</span>
                            <span className="item-title">{item.name}</span>
                            <span className="item-meta">
                              <ClockCircleOutlined /> {new Date(item.createdTime).toLocaleDateString()}
                            </span>
                          </div>
                         
                        </List.Item>
                      </Dropdown>
                    )}
                  />
                )}

                 
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card className="panel-card">
                <div className="panel-header">
                  <div className="panel-title">
                    <FireOutlined className="panel-icon"  />
                    <span>最热资料</span>
                  </div>
                </div>

                {hotDownloadsLoading ? (
                  <div className="loading-container">
                    <Spin size="large" />
                    <p>加载中...</p>
                  </div>
                ) : (
                  <List
                    className="panel-list"
                    dataSource={hotDownloads}
                    renderItem={(item, index) => (
                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: 'current',
                              label: '在当前页面打开',
                              icon: <GlobalOutlined />,
                              onClick: () => handleOpenInCurrentPage(item.id),
                            },
                            {
                              key: 'new',
                              label: '在新页面打开',
                              icon: <ExportOutlined />,
                              onClick: () => handleOpenInNewPage(item.id),
                            },
                          ],
                        }}
                        trigger={['contextMenu']}
                      >
                        <List.Item 
                          className="panel-item"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleOpenInCurrentPage(item.id)}
                        >
                          <div className="item-content">
                            <span className="item-number">{index + 1}</span>
                            <span className="item-title">{item.name}</span>
                            <span className="item-meta">
                              <FireOutlined /> {item.searchCount || 0}
                            </span>
                          </div>
                        </List.Item>
                      </Dropdown>
                    )}
                  />
                )}
                 
              </Card>
            </Col>

          </Row>
        </div>
      </Content>
    </Layout>
  );
});

export default Home;
