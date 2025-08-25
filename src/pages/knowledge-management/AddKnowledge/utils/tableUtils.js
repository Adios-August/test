// Table validation and utility functions

/**
 * Create an empty table structure
 * @returns {Object} Empty table object
 */
export const createEmptyTable = () => ({
  columns: [],
  rows: []
});

/**
 * Validate table data
 * @param {Object} tableData - The table data to validate
 * @returns {Array} Array of validation errors
 */
export const validateTableData = (tableData) => {
  const errors = [];

  if (!tableData || typeof tableData !== 'object') {
    errors.push({ type: 'table', message: '无效的表格数据' });
    return errors;
  }

  // Validate columns
  if (!Array.isArray(tableData.columns)) {
    errors.push({ type: 'table', message: '表格列数据格式错误' });
    return errors;
  }

  if (tableData.columns.length === 0) {
    errors.push({ type: 'table', message: '表格至少需要一列' });
    return errors;
  }

  // Validate each column
  tableData.columns.forEach((column, index) => {
    const columnErrors = validateColumn(column, index);
    errors.push(...columnErrors);
  });

  // Validate rows
  if (!Array.isArray(tableData.rows)) {
    errors.push({ type: 'table', message: '表格行数据格式错误' });
    return errors;
  }

  // Validate each row
  tableData.rows.forEach((row, rowIndex) => {
    const rowErrors = validateRow(row, tableData.columns, rowIndex);
    errors.push(...rowErrors);
  });

  return errors;
};

/**
 * Validate a single column
 * @param {Object} column - The column to validate
 * @param {number} columnIndex - The index of the column
 * @returns {Array} Array of validation errors
 */
export const validateColumn = (column, columnIndex) => {
  const errors = [];
  const columnLabel = `第${columnIndex + 1}列`;

  if (!column || typeof column !== 'object') {
    errors.push({ 
      type: 'column', 
      columnIndex, 
      message: `${columnLabel}数据格式错误` 
    });
    return errors;
  }

  // Validate column name
  if (!column.name || !column.name.trim()) {
    errors.push({ 
      type: 'column', 
      columnIndex, 
      field: 'name',
      message: `${columnLabel}缺少名称` 
    });
  }

  // Validate column type
  const validTypes = ['text', 'longtext', 'number', 'date', 'link', 'file'];
  if (!column.type || !validTypes.includes(column.type)) {
    errors.push({ 
      type: 'column', 
      columnIndex, 
      field: 'type',
      message: `${columnLabel}类型无效` 
    });
  }

  return errors;
};

/**
 * Validate a single row
 * @param {Object} row - The row to validate
 * @param {Array} columns - The table columns
 * @param {number} rowIndex - The index of the row
 * @returns {Array} Array of validation errors
 */
export const validateRow = (row, columns, rowIndex) => {
  const errors = [];
  const rowLabel = `第${rowIndex + 1}行`;

  if (!row || typeof row !== 'object') {
    errors.push({ 
      type: 'row', 
      rowIndex, 
      message: `${rowLabel}数据格式错误` 
    });
    return errors;
  }

  if (!row.data || typeof row.data !== 'object') {
    errors.push({ 
      type: 'row', 
      rowIndex, 
      message: `${rowLabel}缺少数据` 
    });
    return errors;
  }

  // Validate required columns
  columns.forEach((column, columnIndex) => {
    if (column.required) {
      const cellValue = row.data[column.id];
      
      if (column.type === 'file') {
        if (!Array.isArray(cellValue) || cellValue.length === 0) {
          errors.push({ 
            type: 'cell', 
            rowIndex, 
            columnIndex,
            columnId: column.id,
            message: `${rowLabel}的"${column.name}"不能为空` 
          });
        }
      } else {
        if (!cellValue || !cellValue.toString().trim()) {
          errors.push({ 
            type: 'cell', 
            rowIndex, 
            columnIndex,
            columnId: column.id,
            message: `${rowLabel}的"${column.name}"不能为空` 
          });
        }
      }
    }

    // Validate specific cell types
    const cellErrors = validateCell(row.data[column.id], column, rowIndex, columnIndex);
    errors.push(...cellErrors);
  });

  return errors;
};

/**
 * Validate a single cell value
 * @param {any} value - The cell value
 * @param {Object} column - The column definition
 * @param {number} rowIndex - The row index
 * @param {number} columnIndex - The column index
 * @returns {Array} Array of validation errors
 */
export const validateCell = (value, column, rowIndex, columnIndex) => {
  const errors = [];
  const cellLabel = `第${rowIndex + 1}行第${columnIndex + 1}列`;

  if (!value && !column.required) {
    return errors; // Empty non-required cells are ok
  }

  switch (column.type) {
    case 'number':
      if (value && isNaN(Number(value))) {
        errors.push({
          type: 'cell',
          rowIndex,
          columnIndex,
          columnId: column.id,
          message: `${cellLabel}"${column.name}"必须是数字`
        });
      }
      break;

    case 'link':
      if (value && !isValidUrl(value)) {
        errors.push({
          type: 'cell',
          rowIndex,
          columnIndex,
          columnId: column.id,
          message: `${cellLabel}"${column.name}"链接格式无效`
        });
      }
      break;

    case 'file':
      if (value && !Array.isArray(value)) {
        errors.push({
          type: 'cell',
          rowIndex,
          columnIndex,
          columnId: column.id,
          message: `${cellLabel}"${column.name}"文件数据格式错误`
        });
      }
      break;

    case 'date':
      if (value && !isValidDate(value)) {
        errors.push({
          type: 'cell',
          rowIndex,
          columnIndex,
          columnId: column.id,
          message: `${cellLabel}"${column.name}"日期格式无效`
        });
      }
      break;
  }

  return errors;
};

/**
 * Check if a URL is valid
 * @param {string} url - The URL to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    // Allow both with and without protocol
    const urlToTest = url.startsWith('http') ? url : `https://${url}`;
    new URL(urlToTest);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if a date is valid
 * @param {string} date - The date to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidDate = (date) => {
  if (!date) return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};

/**
 * Check for duplicate column names
 * @param {Array} columns - The columns to check
 * @returns {Array} Array of duplicate warnings
 */
export const findDuplicateColumns = (columns) => {
  const warnings = [];
  const seen = new Set();
  
  columns.forEach((column, index) => {
    const normalizedName = column.name?.toLowerCase().trim();
    if (normalizedName && seen.has(normalizedName)) {
      warnings.push({
        type: 'duplicate',
        columnIndex: index,
        message: `列名 "${column.name}" 重复`
      });
    } else if (normalizedName) {
      seen.add(normalizedName);
    }
  });

  return warnings;
};

/**
 * Sort table columns by order
 * @param {Object} tableData - The table data to sort
 * @returns {Object} Sorted table data
 */
export const sortTableData = (tableData) => {
  if (!tableData || !Array.isArray(tableData.columns)) {
    return tableData;
  }

  const sortedColumns = [...tableData.columns].sort((a, b) => (a.order || 0) - (b.order || 0));
  const sortedRows = [...(tableData.rows || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  return {
    ...tableData,
    columns: sortedColumns,
    rows: sortedRows
  };
};

/**
 * Convert table data to display format for read-only table
 * @param {Object} tableData - The table data to convert
 * @returns {Object} Display format with columns and dataSource
 */
export const tableToDisplayFormat = (tableData) => {
  if (!tableData || !Array.isArray(tableData.columns)) {
    return { columns: [], dataSource: [] };
  }

  const sortedData = sortTableData(tableData);

  // Build display columns
  const displayColumns = sortedData.columns.map(col => ({
    title: col.name + (col.required ? ' *' : ''),
    dataIndex: col.id,
    key: col.id,
    render: (value) => {
      switch (col.type) {
        case 'file':
          const files = value || [];
          if (files.length > 0) {
            return {
              type: 'files',
              files: files
            };
          }
          return '-';

        case 'link':
          if (value) {
            return {
              type: 'link',
              url: value.startsWith('http') ? value : `https://${value}`,
              text: value
            };
          }
          return '-';

        default:
          return value || '-';
      }
    }
  }));

  // Build data source
  const dataSource = sortedData.rows.map(row => ({
    key: row.id,
    ...row.data
  }));

  return {
    columns: displayColumns,
    dataSource
  };
};

/**
 * Get table statistics
 * @param {Object} tableData - The table data
 * @returns {Object} Statistics object
 */
export const getTableStats = (tableData) => {
  if (!tableData) {
    return { columns: 0, rows: 0, cells: 0, filledCells: 0 };
  }

  const columns = tableData.columns?.length || 0;
  const rows = tableData.rows?.length || 0;
  const totalCells = columns * rows;
  
  let filledCells = 0;
  
  tableData.rows?.forEach(row => {
    tableData.columns?.forEach(col => {
      const value = row.data?.[col.id];
      if (col.type === 'file') {
        if (Array.isArray(value) && value.length > 0) filledCells++;
      } else {
        if (value && value.toString().trim()) filledCells++;
      }
    });
  });

  return {
    columns,
    rows,
    cells: totalCells,
    filledCells,
    fillRate: totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0
  };
};
