import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { Spin, message } from 'antd';
import { useAuthStore } from '../stores';

const RouteGuard = observer(() => {
  const authStore = useAuthStore();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 检查用户是否已认证
        if (authStore.token) {
          // 简单检查token是否存在
          const isValid = await authStore.checkAuth();
          if (!isValid) {
            // token无效，清除认证信息
            authStore.clearAuth();
            message.error('登录已过期，请重新登录');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        authStore.clearAuth();
        message.error('认证检查失败，请重新登录');
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [authStore]);

  // 如果正在检查认证状态，显示加载中
  if (isChecking) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>正在验证登录状态...</p>
      </div>
    );
  }

  // 如果用户未认证且不在登录页面，重定向到登录页面
  if (!authStore.isAuthenticated && location.pathname !== '/login') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 如果用户已认证且访问登录页面，重定向到首页
  if (authStore.isAuthenticated && location.pathname === '/login') {
    return <Navigate to="/" replace />;
  }

  // 认证通过，渲染子路由
  return <Outlet />;
});

export default RouteGuard; 