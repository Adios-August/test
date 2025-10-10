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
          setOptions(dynamicOptions);
        }
      } catch (e) {
        console.error('获取工作空间列表失败:', e);
        message.warning('获取工作空间失败，使用默认选项');
        const fallback = ['WPB', 'GPB', 'IWS', 'FCCS', 'CCSS'];
        if (mounted) {
          setOptions(fallback.map((n) => ({ label: n, value: n })));
        }
      }
    };
    fetchWorkspaces();
    return () => { mounted = false; };
  }, []);

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
            onChange={handlePrivateToChange}
            options={options}
          />
        </div>
      </Card>
    </>
  );
};

export default VisibilityPopup;
