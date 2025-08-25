import React, { useState } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Typography, 
  Empty,
  Popconfirm,
  message,
  Tooltip,
  Input
} from 'antd';
import { 
  PlusOutlined,
  SettingOutlined,
  DeleteOutlined,
  UpOutlined,
  DownOutlined,
  EditOutlined
} from '@ant-design/icons';
import ColumnManager from './ColumnManager';
import RowModal from './RowModal';

const { Text } = Typography;

const SimpleTable = ({ tableData, onChange }) => {
  const [columnManagerVisible, setColumnManagerVisible] = useState(false);
  const [rowModalVisible, setRowModalVisible] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  // Open modal to add new row
  const handleAddRow = () => {
    setEditingRow(null);
    setRowModalVisible(true);
  };

  // Open modal to edit existing row
  const handleEditRow = (row) => {
    setEditingRow(row);
    setRowModalVisible(true);
  };

  // Save row data from modal
  const handleSaveRow = (rowData) => {
    if (editingRow) {
      // Update existing row
      const updatedRows = tableData.rows.map(row => 
        row.id === editingRow.id 
          ? { ...row, data: rowData }
          : row
      );
      onChange({ ...tableData, rows: updatedRows });
      message.success('行数据已更新');
    } else {
      // Add new row
      const newRow = {
        id: `row_${Date.now()}`,
        order: tableData.rows ? tableData.rows.length : 0,
        data: rowData
      };
      const updatedRows = [...(tableData.rows || []), newRow];
      onChange({ ...tableData, rows: updatedRows });
      message.success('新行已添加');
    }
  };

  // Delete row
  const handleDeleteRow = (rowId) => {
    const updatedRows = tableData.rows
      .filter(row => row.id !== rowId)
      .map((row, index) => ({ ...row, order: index }));
    
    onChange({ ...tableData, rows: updatedRows });
    message.success('已删除行');
  };

  // Move row up/down
  const handleMoveRow = (rowId, direction) => {
    const rows = [...tableData.rows];
    const currentIndex = rows.findIndex(row => row.id === rowId);
    
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= rows.length) return;
    
    // Swap rows
    [rows[currentIndex], rows[newIndex]] = [rows[newIndex], rows[currentIndex]];
    
    // Update order
    rows.forEach((row, index) => {
      row.order = index;
    });
    
    onChange({ ...tableData, rows });
    message.success(`行已${direction === 'up' ? '上移' : '下移'}`);
  };



  // If no columns, show empty state
  if (!tableData || !tableData.columns || tableData.columns.length === 0) {
    return (
      <div style={{ 
        padding: '40px 20px', 
        textAlign: 'center',
        border: '2px dashed #d9d9d9',
        borderRadius: '8px',
        marginTop: '24px'
      }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <Text type="secondary" style={{ fontSize: '16px' }}>暂无表格</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '14px' }}>添加第一个列开始创建表格</Text>
            </div>
          }
        >
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setColumnManagerVisible(true)}
          >
            添加列
          </Button>
        </Empty>

        {/* Column Manager */}
        <ColumnManager
          visible={columnManagerVisible}
          onClose={() => setColumnManagerVisible(false)}
          columns={[]}
          onColumnsChange={(columns) => {
            onChange({ columns, rows: [] });
          }}
        />
      </div>
    );
  }

  // Render cell content based on column type
  const renderCellContent = (value, column) => {
    if (!value) return '-';

    switch (column.type) {
      case 'file':
        const files = Array.isArray(value) ? value : [];
        return files.length > 0 ? (
          <Space wrap>
            {files.map((file, index) => (
              <span key={index} style={{ color: '#1890ff' }}>
                📎 {file.name}
              </span>
            ))}
          </Space>
        ) : '-';

      case 'link':
        return value ? (
          <a href={value.startsWith('http') ? value : `https://${value}`} 
             target="_blank" 
             rel="noopener noreferrer"
             style={{ color: '#1890ff' }}>
            🔗 {value}
          </a>
        ) : '-';

      case 'longtext':
        return value ? (
          <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {value.length > 50 ? `${value.substring(0, 50)}...` : value}
          </div>
        ) : '-';

      default:
        return value || '-';
    }
  };

  // Build table columns for display
  const tableColumns = [
    ...tableData.columns.map(col => ({
      title: col.name + (col.required ? ' *' : ''),
      dataIndex: col.id,
      key: col.id,
      render: (value) => renderCellContent(value, col)
    })),
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record, index) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditRow(record.originalRow)}
            />
          </Tooltip>
          <Tooltip title="上移">
            <Button
              type="text"
              size="small"
              icon={<UpOutlined />}
              disabled={index === 0}
              onClick={() => handleMoveRow(record.originalRow.id, 'up')}
            />
          </Tooltip>
          <Tooltip title="下移">
            <Button
              type="text"
              size="small"
              icon={<DownOutlined />}
              disabled={index === tableData.rows.length - 1}
              onClick={() => handleMoveRow(record.originalRow.id, 'down')}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除这一行吗？"
            onConfirm={() => handleDeleteRow(record.originalRow.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ marginTop: '24px' }}>
      {/* Simple toolbar */}
      <div style={{ 
        marginBottom: '16px', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <Text strong>表格</Text>
          <Text type="secondary" style={{ marginLeft: '8px' }}>
            {tableData.columns.length} 列, {tableData.rows ? tableData.rows.length : 0} 行
          </Text>
        </div>
        <Space>
          <Button 
            icon={<PlusOutlined />}
            onClick={handleAddRow}
          >
            添加行
          </Button>
          <Button 
            icon={<SettingOutlined />}
            onClick={() => setColumnManagerVisible(true)}
          >
            管理列
          </Button>
        </Space>
      </div>

      {/* Table */}
      <Table
        columns={tableColumns}
        dataSource={tableData.rows ? tableData.rows.map(row => ({
          key: row.id,
          id: row.id,
          originalRow: row, // Keep reference to original row structure
          ...row.data
        })) : []}
        pagination={false}
        size="small"
        bordered
        locale={{ emptyText: '暂无数据行，点击"添加行"开始添加数据' }}
      />

      {/* Column Manager */}
      <ColumnManager
        visible={columnManagerVisible}
        onClose={() => setColumnManagerVisible(false)}
        columns={tableData.columns}
        onColumnsChange={(columns) => {
          onChange({ ...tableData, columns });
        }}
      />

      {/* Row Modal */}
      <RowModal
        visible={rowModalVisible}
        onClose={() => setRowModalVisible(false)}
        onSave={handleSaveRow}
        columns={tableData.columns}
        editingRow={editingRow}
      />
    </div>
  );
};

export default SimpleTable;
