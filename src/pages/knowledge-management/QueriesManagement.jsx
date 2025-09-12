import React, { useEffect, useState } from 'react';
import { Table, Space, Input, Button, Popconfirm, message, DatePicker } from 'antd';
import { http } from '../../utils/request';
import { useAuthStore } from '../../stores';
import '../knowledge-management/KnowledgeManagement.scss';

const { RangePicker } = DatePicker;

const QueriesManagement = () => {
  const authStore = useAuthStore();
  const currentUserId = authStore.user?.id || authStore.user?.userId;
  
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);

  const [dateRange, setDateRange] = useState([]);

  const fetchData = async (p = page, s = size, startTime = null, endTime = null) => {
    setLoading(true);
    try {
      const params = {
        page: p,
        size: s,
        userId: currentUserId
      };
      
      if (startTime) {
        params.startTime = startTime;
      }
      
      if (endTime) {
        params.endTime = endTime;
      }
      
      const res = await http.get('/search/history', params);
      const records = res?.data?.records || res?.records || [];
      setData(records);
      setTotal(res?.data?.total || res?.total || records.length);
      setPage(p);
      setSize(s);
    } catch (e) {
      console.error('加载查询历史失败:', e);
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchData(1, size);
    }
  }, [currentUserId]);

  const handleDelete = async (id) => {
    try {
      await http.delete(`/search/history/${id}`);
      message.success('已删除');
      fetchData(1, size);
    } catch (e) {
      console.error('删除查询历史失败:', e);
      message.error('删除失败');
    }
  };



  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '用户ID', dataIndex: 'userId', width: 120 },
    { title: '搜索关键词', dataIndex: 'query', ellipsis: true },
    { title: '搜索时间', dataIndex: 'searchTime', width: 200 },
    { title: '结果数量', dataIndex: 'resultCount', width: 100 },
    {
      title: '操作',
      width: 120,
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="确定删除该查询记录吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <a>删除</a>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="management-content">
      <div className="content-header">
        <h2>Queries管理</h2>
        <div style={{ marginLeft: 'auto' }}>
          <Space>

            <RangePicker
              showTime
              placeholder={['开始时间', '结束时间']}
              value={dateRange}
              onChange={setDateRange}
              style={{ width: 300 }}
            />
            
          </Space>
        </div>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        pagination={{
          current: page,
          pageSize: size,
          total,
          onChange: (p, s) => fetchData(p, s, 
            dateRange && dateRange.length === 2 ? dateRange[0].format('YYYY-MM-DD HH:mm:ss') : null,
            dateRange && dateRange.length === 2 ? dateRange[1].format('YYYY-MM-DD HH:mm:ss') : null
          )
        }}
      />
    </div>
  );
};

export default QueriesManagement;