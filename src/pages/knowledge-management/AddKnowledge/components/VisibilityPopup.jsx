import React, { useEffect, useState } from 'react';
import { 
  Select, 
  Typography,
  Card
} from 'antd';
import { message } from 'antd';
import { workspaceAPI } from '../../../../api/workspace';

const { Text } = Typography;

const VisibilityPopup = ({ 
  visible,
  onClose,
  formData,
  handlePrivateToChange,
  anchorEl
}) => {
  if (!visible) return null;

  const [options, setOptions] = useState([]);
  const [allOptions, setAllOptions] = useState([]);

  useEffect(() => {
    let mounted = true;
    const fetchWorkspaces = async () => {
      try {
        const res = await workspaceAPI.getWorkspaces();
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        const wsNames = list.map((ws) => ws?.name ?? ws?.code ?? (typeof ws === 'string' ? ws : ''))
                            .filter(Boolean);
        const dynamicOptions = wsNames.map((name) => ({ label: name, value: name }));
        if (mounted) {
          setAllOptions(dynamicOptions);
          // 添加 ALL 选项到最前面
          setOptions([
            { label: 'ALL', value: 'ALL' },
            ...dynamicOptions
          ]);
        }
      } catch (e) {
        console.error('获取工作空间列表失败:', e);
        message.warning('获取工作空间失败，使用默认选项');
        const fallback = ['WPB', 'GPB', 'IWS', 'FCCS', 'CCSS'];
        const fallbackOptions = fallback.map((n) => ({ label: n, value: n }));
        if (mounted) {
          setAllOptions(fallbackOptions);
          setOptions([
            { label: 'ALL', value: 'ALL' },
            ...fallbackOptions
          ]);
        }
      }
    };
    fetchWorkspaces();
    return () => { mounted = false; };
  }, []);

  // 处理选择变化
  const handleChange = (selectedValues) => {
    const allValues = allOptions.map(opt => opt.value);
    const previousValues = formData.privateToRoles || [];
    
    // 如果选择了 ALL
    if (selectedValues.includes('ALL')) {
      // 如果之前没有选择 ALL，说明是刚选择 ALL，选择所有选项
      if (!previousValues.includes('ALL')) {
        handlePrivateToChange(['ALL', ...allValues]);
      } else {
        // 如果之前已经选择了 ALL，检查是否取消了其他选项
        const nonAllValues = selectedValues.filter(val => val !== 'ALL');
        if (nonAllValues.length < allValues.length) {
          // 取消了一些选项，只保留 ALL
          handlePrivateToChange(['ALL']);
        } else {
          // 没有取消任何选项，保持原样
          handlePrivateToChange(selectedValues);
        }
      }
    } else {
      // 没有选择 ALL
      // 如果之前选择了 ALL，现在取消 ALL，选择所有其他选项
      if (previousValues.includes('ALL')) {
        handlePrivateToChange(allValues);
      } else {
        // 正常的多选逻辑
        handlePrivateToChange(selectedValues);
      }
    }
  };

  return (
    <>
      {/* Overlay to close popup when clicking outside */}
      <div 
        className="popup-overlay" 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999
        }}
      />
      
      {/* Popup content */}
      <Card
        className="knowledge-popup"
        title="可见范围"
        size="small"
        style={{
          position: 'absolute',
          width: 390,
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          borderRadius: '6px'
        }}
      >
        <div>
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="选择可见范围"
            value={formData.privateToRoles}
            onChange={handleChange}
            options={options}
          />
        </div>
      </Card>
    </>
  );
};

export default VisibilityPopup;
