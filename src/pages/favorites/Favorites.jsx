import React, { useState, useEffect } from 'react';
import { Layout, Table, Button, message, Tooltip, Space } from 'antd';
import {
  EyeOutlined, DeleteOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import CommonSidebar from '../../components/CommonSidebar';
import { knowledgeAPI } from '../../api/knowledge';
import './Favorites.scss';

const { Content } = Layout;

const Favorites = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [favoritesData, setFavoritesData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 获取收藏列表
  const fetchFavorites = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await knowledgeAPI.getFavorites({ 
        page, 
        pageSize
      });
      
      if (response.code === 200) {
        const data = response.data || {};
        setFavoritesData(data.records || []);
        setPagination({
          current: page,
          pageSize,
          total: data.total || 0
        });
      } else {
        message.error(response.message || '获取收藏列表失败');
      }
    } catch (error) {
      console.error('获取收藏列表失败:', error);
      message.error('获取收藏列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理返回
  const handleBack = () => {
    navigate(-1);
  };

  // 处理查看知识详情
  const handleView = (record) => {
    navigate(`/knowledge-detail/${record.knowledgeId}`);
  };

  // 处理删除收藏
  const handleDelete = async (record) => {
    try {
      // 调用取消收藏API
      await knowledgeAPI.unfavoriteKnowledge(record.knowledgeId);
      message.success('已删除收藏');
      fetchFavorites(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('删除收藏失败:', error);
      message.error('删除收藏失败，请重试');
    }
  };

  // 处理分页变化
  const handlePaginationChange = (page, pageSize) => {
    setPagination(prev => ({ ...prev, current: page, pageSize }));
    fetchFavorites(page, pageSize);
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchFavorites();
  }, []);

  // 表格列定义
  const columns = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      render: (text, record, index) => {
        const currentPage = pagination.current;
        const pageSize = pagination.pageSize;
        return (currentPage - 1) * pageSize + index + 1;
      },
      sorter: true
    },
    {
      title: '所在栏目',
      dataIndex: 'category',
      key: 'category',
      width: 150
    },
    {
      title: '知识标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text) => (
        <div style={{ 
          maxWidth: '400px', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          cursor: 'pointer'
        }}>
          {text}
        </div>
      )
    },
    {
      title: '收藏日期',
      dataIndex: 'favoriteDate',
      key: 'favoriteDate',
      width: 120
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
              style={{ color: '#1890ff' }}
            >
              查看
            </Button>
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
              style={{ color: '#ff4d4f' }}
            >
              删除
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <Layout className="favorites-layout">
      <div className="favorites-content">
        <div className="content-header">
          <h2>收藏夹</h2>
        </div>
        
        <div className="content-body">
          <Table
            columns={columns}
            dataSource={favoritesData}
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: false,
              showQuickJumper: true,
              showTotal: (total, range) => `每页${pagination.pageSize}条 共${total}条记录`,
              onChange: handlePaginationChange
            }}
            rowKey="id"
            size="middle"
            className="favorites-table"
          />
        </div>
      </div>
    </Layout>
  );
};

export default Favorites; 