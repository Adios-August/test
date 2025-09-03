import React, { useState, useEffect } from 'react';
import { Button, message, Tooltip, Badge } from 'antd';
import { HeartOutlined, HeartFilled, StarOutlined, StarFilled } from '@ant-design/icons';
import { engagementAPI } from '../api/engagement';
import { useAuthStore } from '../stores';

/**
 * 收藏按钮组件
 * 
 * 状态同步机制：
 * 1. 组件挂载时自动获取收藏状态
 * 2. 收藏/取消收藏操作完成后，重新调用状态接口
 * 3. 根据最新状态显示正确的按钮样式
 * 4. 支持状态变化回调，便于父组件同步状态
 * 
 * API响应结构：
 * {
 *   "code": 200,
 *   "message": "操作成功",
 *   "data": {
 *     "knowledgeId": 8,
 *     "userId": 1,
 *     "isFavorited": true,
 *     "favoriteTime": "2025-09-01T11:23:05",
 *     "favoriteId": 1
 *   },
 *   "timestamp": 1756716994804
 * }
 */
const FavoriteButton = ({ 
  knowledgeId, 
  style = {}, 
  size = 'large',
  showText = false,
  showCount = false,
  variant = 'heart', // 'heart' 或 'star'
  onStatusChange,
  className = ''
}) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [favoriteCount, setFavoriteCount] = useState(0);
  
  // 获取当前用户信息
  const authStore = useAuthStore();
  const currentUserId = authStore.user?.id || authStore.user?.userId;

  /**
   * 获取收藏状态
   * 调用 /api/engagement/favorite/status/{knowledgeId} 接口
   * 
   * 根据实际API响应结构：
   * - isFavorited: 收藏状态（true/false）
   * - favoriteTime: 收藏时间
   * - favoriteId: 收藏记录ID
   * 
   * 注意：API响应中没有favoriteCount字段，收藏数量基于isFavorited状态计算
   */
  const fetchFavoriteStatus = async () => {
    if (!knowledgeId) return;
    
    setStatusLoading(true);
    try {
     
      const response = await engagementAPI.getFavoriteStatus(knowledgeId);
      
      
      if (response.code === 200) {
        // 根据实际API响应结构获取数据
        const favoriteStatus = response.data?.isFavorited || false;
        // 注意：API响应中没有favoriteCount字段，这里设置为1或0
        const count = response.data?.isFavorited ? 1 : 0;
        
     
        
        setIsFavorited(favoriteStatus);
        setFavoriteCount(count);
        onStatusChange && onStatusChange(favoriteStatus, count);
      } else {
        console.error('获取收藏状态失败:', response.message);
      }
    } catch (error) {
      console.error('获取收藏状态失败:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  /**
   * 处理收藏/取消收藏
   * 操作完成后自动重新获取状态，确保按钮显示正确
   */
  const handleFavorite = async () => {
    if (!knowledgeId || loading) return;
    
    // 检查用户是否已登录
    if (!currentUserId) {
      message.error('请先登录');
      return;
    }
    
    setLoading(true);
    try {
      if (isFavorited) {
        // 取消收藏
        
        const response = await engagementAPI.removeFavorite(knowledgeId, currentUserId);
      
        
        if (response.code === 200) {
          message.success('已取消收藏');
         
          
          // 取消收藏后，延迟一段时间再获取状态，以防后端状态同步需要时间
          setTimeout(async () => { 
            await fetchFavoriteStatus();
          }, 500); // 延迟500ms
          
        } else {
          message.error(response.message || '取消收藏失败');
        }
      } else {
        // 添加收藏 
        const response = await engagementAPI.addFavorite(knowledgeId, currentUserId); 
        
        if (response.code === 200) {
          message.success('已添加到收藏'); 
          // 操作成功后重新获取状态，确保按钮显示正确
          await fetchFavoriteStatus();
        } else {
          message.error(response.message || '收藏失败');
        }
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      message.error('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取收藏状态
  useEffect(() => {
    fetchFavoriteStatus();
  }, [knowledgeId]);

  // 根据变体选择图标
  const getIcon = () => {
    if (variant === 'star') {
      return isFavorited ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />;
    }
    return isFavorited ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />;
  };

  // 获取按钮颜色
  const getButtonColor = () => {
    if (variant === 'star') {
      return isFavorited ? '#faad14' : 'inherit';
    }
    return isFavorited ? '#ff4d4f' : 'inherit';
  };

  // 获取提示文本
  const getTooltipText = () => {
    if (variant === 'star') {
      return isFavorited ? "取消收藏" : "收藏";
    }
    return isFavorited ? "取消收藏" : "收藏";
  };

  // 如果正在加载状态，显示加载中的按钮
  if (statusLoading) {
    return (
      <Button
        type="text"
        icon={variant === 'star' ? <StarOutlined /> : <HeartOutlined />}
        loading={true}
        size={size}
        style={style}
        className={className}
        title="加载中..."
      />
    );
  }

  const buttonContent = (
    <Button 
      type="text" 
      icon={getIcon()}
      onClick={handleFavorite}
      loading={loading}
      size={size}
      className={className}
      style={{ 
        ...style,
        color: getButtonColor(),
        transition: 'all 0.3s ease'
      }}
    >
      {showText && (isFavorited ? '已收藏' : '收藏')}
    </Button>
  );

  // 如果需要显示数量，使用Badge包装
  if (showCount && favoriteCount > 0) {
    return (
      <Tooltip title={getTooltipText()} placement="top">
        <Badge count={favoriteCount} size="small">
          {buttonContent}
        </Badge>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={getTooltipText()} placement="top">
      {buttonContent}
    </Tooltip>
  );
};

export default FavoriteButton; 