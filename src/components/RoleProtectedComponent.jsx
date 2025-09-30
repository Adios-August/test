import React from 'react';
import { observer } from 'mobx-react-lite';
import { useAuthStore } from '../stores';
import { hasPermission, getUserRole } from '../constants/roles';

/**
 * 角色保护组件 - 根据用户权限条件性渲染子组件
 * @param {Object} props
 * @param {string} props.permission - 需要检查的权限名称
 * @param {ReactNode} props.children - 子组件
 * @param {ReactNode} props.fallback - 权限不足时显示的替代组件（可选）
 * @param {boolean} props.hide - 权限不足时是否完全隐藏（默认true）
 */
const RoleProtectedComponent = observer(({ 
  permission, 
  children, 
  fallback = null, 
  hide = true 
}) => {
  const authStore = useAuthStore();
  const userRole = getUserRole(authStore.user);
  const hasRequiredPermission = hasPermission(userRole, permission);

  if (hasRequiredPermission) {
    return children;
  }

  if (hide) {
    return null;
  }

  return fallback;
});

export default RoleProtectedComponent;
