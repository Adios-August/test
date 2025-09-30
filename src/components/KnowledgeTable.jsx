import React from 'react';
import { Table, Tag, Tooltip } from 'antd';
import { LinkOutlined, FileOutlined } from '@ant-design/icons';
import './KnowledgeTable.scss';

const KnowledgeTable = ({ tableData }) => {
  // 只有当表格数据存在且有行数据时才渲染表格
  if (!tableData || !tableData.columns || !tableData.rows  ) {
    return null;
  }

  // 处理文件类型的列渲染
  const renderFileCell = (files) => {
    if (!files || !Array.isArray(files)) return '-';
    
    return (
      <div className="file-cell">
        {files.map((file, index) => (
          <div key={index} className="file-item">
            <FileOutlined className="file-icon" />
            <span 
              className="file-name clickable"
              onClick={() => {
                const link = document.createElement('a');
                link.href = file.url;
                link.download = file.name;
                link.click();
              }}
              title="点击下载文件"
            >
              {file.name}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // 处理链接类型的列渲染
  const renderLinkCell = (url) => {
    if (!url) return '-';
    
    return (
      <div className="link-cell">
        <LinkOutlined style={{ marginRight: '4px', color: '#db0011' }} />
        <a href={url} target="_blank" rel="noopener noreferrer">
          {url}
        </a>
      </div>
    );
  };

  // 处理长文本类型的列渲染
  const renderLongTextCell = (text) => {
    if (!text) return '-';
    
    return (
      <div className="longtext-cell">
        <Tooltip title={text}>
          <span className="text-content">
            {text.length > 50 ? `${text.substring(0, 50)}...` : text}
          </span>
        </Tooltip>
      </div>
    );
  };

  // 根据列类型渲染单元格内容
  const renderCell = (value, column) => {
    switch (column.type) {
      case 'file':
        return renderFileCell(value);
      case 'link':
        return renderLinkCell(value);
      case 'longtext':
        return renderLongTextCell(value);
      default:
        return value || '-';
    }
  };

  // 构建表格列配置
  const columns = tableData.columns.map(col => ({
    title: col.name,
    dataIndex: col.id,
    key: col.id,
    width: col.type === 'file' ? 200 : col.type === 'longtext' ? 180 : 150,
    render: (value) => renderCell(value, col),
    ellipsis: col.type !== 'file' && col.type !== 'longtext',
  }));

  // 构建表格数据
  const dataSource = tableData.rows.map((row, index) => {
    const rowData = { key: row.id || index };
    tableData.columns.forEach(col => {
      // 增加防御性编程，防止访问undefined的属性
      rowData[col.id] = row && row.data && row.data[col.id] !== undefined ? row.data[col.id] : '-';
    });
    return rowData;
  });

  return (
    <div className="knowledge-table-container">
      <div className="table-wrapper">
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          size="middle"
          scroll={{ x: 'max-content' }}
          className="knowledge-table"
        />
      </div>
    </div>
  );
};

export default KnowledgeTable;