import React, { useEffect, useState } from 'react';
import { Table, Space, Input, Button, Popconfirm, message, Tag } from 'antd';
import { http } from '../../utils/request';
import { getKnowledgeFeedbackOptions } from '../../constants/feedbackTypes';
 
import '../knowledge-management/KnowledgeManagement.scss';

const FeedbackManagement = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [keyword, setKeyword] = useState('');

  const fetchData = async (p = page, s = size) => {
    setLoading(true);
    try {
      const res = await http.get('/engagement/feedbacks', {
        page: p,
        size: s,
      });
      const records = res?.data?.records || res?.records || [];
      setData(records);
      setTotal(res?.data?.total || res?.total || records.length);
      setPage(p); setSize(s);
    } catch (e) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(1, size); }, []);

  const handleDelete = async (id) => {
    try {
      await http.delete(`/engagement/feedback/${id}`);
      message.success('已删除');
      fetchData(1, size);
    } catch (e) {
      message.error('删除失败');
    }
  };

  const feedbackOptions = getKnowledgeFeedbackOptions();
  
  const getFeedbackTypeLabel = (type) => {
    const option = feedbackOptions.find(opt => opt.value === type);
    return option ? option.label : type;
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '用户ID', dataIndex: 'userId', width: 120 },
    { title: '内容', dataIndex: 'content' },
    { 
      title: '反馈类型', 
      dataIndex: 'feedbackType', 
      width: 120,
      render: (type) => (
        <Tag 
          style={{ 
            background: 'linear-gradient(135deg, var(--ant-primary-color), #ff4757)',
            borderColor: 'var(--ant-primary-color)',
            color: '#fff',
            fontWeight: '500',
            borderRadius: '16px',
            padding: '4px 12px',
            border: 'none',
            boxShadow: '0 2px 8px rgba(219, 0, 17, 0.2)',
            fontSize: '12px',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            cursor: 'default'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 12px rgba(219, 0, 17, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 8px rgba(219, 0, 17, 0.2)';
          }}
        >
          {getFeedbackTypeLabel(type)}
        </Tag>
      )
    },
    { title: '时间', dataIndex: 'createdTime', width: 200 },
    {
      title: '操作', width: 120, render: (_, r) => (
        <Space>
          <Popconfirm title="确定删除该反馈吗？" onConfirm={() => handleDelete(r.id)}>
            <Button 
              type="link" 
              danger 
              size="small"
              style={{ 
                color: 'var(--ant-primary-color)',
                padding: '0',
                height: 'auto'
              }}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="management-content">
      <div className="content-header">
        <h2>Feedback管理</h2>
        <div style={{ marginLeft: 'auto' }}>
          <Space>
            <Input.Search allowClear placeholder="搜索（ID/内容）" onSearch={() => fetchData(1, size)} />
            <Button onClick={() => fetchData(1, size)}>刷新</Button>
          </Space>
        </div>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        pagination={{ current: page, pageSize: size, total, onChange: (p, s) => fetchData(p, s) }}
      />
    </div>
  );
};

export default FeedbackManagement;