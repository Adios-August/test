import React, { useEffect, useState } from 'react';
import { Table, Space, Select, message, Input } from 'antd';
import { http } from '../../utils/request';
 
import '../knowledge-management/KnowledgeManagement.scss';

const RoleManagement = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [wsFilter, setWsFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');

  const fetchDept = async () => {
    try {
      const res = await http.get('/users/departments');
      setDepartments(res);
    } catch {}
  };

  const fetchData = async (p = page, s = size) => {
    setLoading(true);
    try {
      const res = await http.get('/admin/users', { page: p, size: s, keyword, workspace: wsFilter });
      const records = res?.data?.records || res?.records || [];
      setData(records);
      setTotal(res?.data?.total || res?.total || records.length);
    } catch (e) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDept(); fetchData(); }, []);

  const handleRoleChange = async (id, systemRole) => {
    try {
      await http.put(`/admin/users/${id}`, { systemRole });
      message.success('已更新');
      fetchData(page, size);
    } catch (e) {
      message.error('更新失败');
    }
  };

  const handleWorkspaceChange = async (id, workspace) => {
    try {
      await http.put(`/admin/users/${id}`, { workspace });
      message.success('已更新');
      fetchData(page, size);
    } catch (e) {
      message.error('更新失败');
    }
  };

  const workspaceOptions = (Array.isArray(departments) ? departments : []).map(d => ({ value: d, label: d }));

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: 'Username', dataIndex: 'username', width: 180 },
    { title: 'StaffId', dataIndex: 'staffId', width: 140 },
    { title: 'StaffRole', dataIndex: 'staffRole', width: 140 },
    { title: 'SystemRole', dataIndex: 'systemRole', width: 160, render: (v, r) => (
      <Select
        value={v}
        style={{ width: 160 }}
        onChange={(val) => handleRoleChange(r.id, val)}
        options={[
          { value: 'ADMIN', label: 'ADMIN' },
          { value: 'DEPT_ADMIN', label: 'DEPT_ADMIN' },
          { value: 'USER', label: 'USER' },
        ]}
      />
    ) },
    { title: 'Workspace', dataIndex: 'workspace', render: (v, r) => {
      const valueArr = (v || '').split(',').map(s => s.trim()).filter(Boolean);
      return (
        <Select
          mode="multiple"
          allowClear
          style={{ minWidth: 220 }}
          value={valueArr}
          options={workspaceOptions.length ? workspaceOptions : [
            { value: 'WPB', label: 'WPB' },
            { value: 'GPB', label: 'GPB' },
          ]}
          onChange={(vals) => handleWorkspaceChange(r.id, (vals || []).join(','))}
        />
      );
    } },
  ];

  return (
    <div className="management-content">
      <div className="content-header">
        <h2>角色管理</h2>
      </div>

      <div className="content-header" style={{ marginTop: 8, display: 'flex', gap: 12 }}>
        <Select
          value={wsFilter}
          style={{ width: 160 }}
          options={[{ value: 'ALL', label: 'ALL' }, { value: 'WPB', label: 'WPB' }, { value: 'GPB', label: 'GPB' }]}
          onChange={(v) => { setWsFilter(v); fetchData(1, size); }}
        />
        <Input.Search allowClear placeholder="搜索(用户名/工号/邮箱)" onSearch={() => fetchData(1, size)} onChange={(e)=> setKeyword(e.target.value)} />
      </div>

      <Table rowKey={(r)=>r.id}
        loading={loading}
        dataSource={data}
        columns={columns}
        pagination={{ current: page, pageSize: size, total, onChange: (p, s) => { setPage(p); setSize(s); fetchData(p, s);} }}
      />
    </div>
  );
};

export default RoleManagement; 