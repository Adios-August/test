import React, { useState, useEffect } from 'react';
import { Layout, Table, Button, message, Modal, Space } from 'antd';
import {
  EyeOutlined, DeleteOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import CommonSidebar from '../../components/CommonSidebar';
import { knowledgeAPI } from '../../api/knowledge';
import { engagementAPI } from '../../api/engagement';
import { useAuthStore } from '../../stores';
import './Favorites.scss';

const { Content } = Layout;

const Favorites = () => {
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const currentUserId = authStore.user?.id || authStore.user?.userId;
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
    if (!currentUserId) {
      message.error('请先登录');
      return;
    }

    // 显示确认对话框
    Modal.confirm({
      title: '确认取消收藏',
      content: `确定要取消收藏"${record.knowledgeName}"吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          // 调用取消收藏API 
          const response = await engagementAPI.removeFavorite(record.knowledgeId, currentUserId); 
          
          if (response.code === 200) {
            message.success('已取消收藏');
            // 重新获取收藏列表
            fetchFavorites(pagination.current, pagination.pageSize);
          } else {
            message.error(response.message || '取消收藏失败');
          }
        } catch (error) {
          console.error('取消收藏失败:', error);
          message.error('取消收藏失败，请重试');
        }
      }
    });
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
      title: '知识标题',
      dataIndex: 'knowledgeName',
      key: 'knowledgeName',
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
      title: '知识描述',
      dataIndex: 'knowledgeDescription',
      key: 'knowledgeDescription',
      ellipsis: true,
      render: (text) => (
        <div style={{ 
          maxWidth: '300px', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap'
        }}>
          {text || '-'}
        </div>
      )
    },
    {
      title: '创建者',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 100
    },
    {
      title: '收藏日期',
      dataIndex: 'favoriteTime',
      key: 'favoriteTime',
      width: 150,
      render: (text) => {
        if (!text) return '-';
        return new Date(text).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      align: 'center',
      render: (_, record) => (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '8px'
        }}>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            className="view-button"
            style={{ 
              color: '#1890ff',
              padding: '4px 8px',
              height: 'auto',
              fontSize: '12px',
              border: 'none',
              background: 'transparent',
              transition: 'all 0.3s ease'
            }}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            className="delete-button"
            style={{ 
              color: '#ff4d4f',
              padding: '4px 8px',
              height: 'auto',
              fontSize: '12px',
              border: 'none',
              background: 'transparent',
              transition: 'all 0.3s ease'
            }}
          >
            删除
          </Button>
        </div>
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