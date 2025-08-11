# 路由前置守卫使用说明

## 概述

本项目实现了基于 MobX 的路由前置守卫，用于保护需要登录才能访问的路由。

## 功能特性

### 1. 自动认证检查

- 应用启动时自动检查用户登录状态
- 验证 JWT token 的有效性
- 自动清除过期的认证信息

### 2. 路由保护

- 未登录用户访问受保护路由时自动重定向到登录页
- 已登录用户访问登录页时自动重定向到首页
- 支持记住用户原来要访问的页面

### 3. 用户体验优化

- 认证检查期间显示加载状态
- 登录成功后智能跳转
- 友好的错误提示

## 路由结构

```
/login          - 登录页面（无需认证）
/               - 受保护的路由
├── /           - 首页
├── /knowledge  - 知识库
├── /knowledge/:id - 知识详情
├── /knowledge-admin - 知识库管理
└── /stats      - 数据统计
/*              - 404页面（无需认证）
```

## 核心组件

### RouteGuard.jsx

主要的路由守卫组件，负责：

- 检查用户认证状态
- 验证 token 有效性
- 控制路由访问权限
- 处理重定向逻辑

### AuthStore

MobX 状态管理，负责：

- 管理用户认证状态
- 处理登录/登出逻辑
- 存储 token 和用户信息
- 验证 token 有效性

## 使用方法

### 1. 添加新的受保护路由

在 `src/router/index.jsx` 中添加新路由：

```jsx
{
  path: '/new-route',
  element: <NewComponent />,
}
```

### 2. 添加新的公开路由

在路由配置中添加：

```jsx
{
  path: '/public-route',
  element: <PublicComponent />,
}
```

### 3. 在组件中使用认证状态

```jsx
import { useAuthStore } from "../stores";

const MyComponent = observer(() => {
  const authStore = useAuthStore();

  if (!authStore.isAuthenticated) {
    return <div>请先登录</div>;
  }

  return <div>欢迎，{authStore.user?.username}</div>;
});
```

## API 接口

### 登录接口

- **URL**: `/api/auth/login`
- **方法**: `POST`
- **请求体**: `{ username, password }`
- **响应**: `{ code: 200, message: "登录成功", data: { token, user, expiresIn } }`

### Token 验证接口

- **URL**: `/api/auth/verify`
- **方法**: `GET`
- **请求头**: `Authorization: Bearer {token}`
- **响应**: `{ code: 200, data: { user } }`

## 配置说明

### 环境变量

- 确保后端 API 地址配置正确
- 根据需要调整 token 过期时间

### 自定义配置

可以在 `RouteGuard.jsx` 中调整：

- 加载状态的显示样式
- 重定向的默认路径
- 错误提示的文本内容

## 注意事项

1. **Token 存储**: 使用 localStorage 存储 token，确保页面刷新后状态不丢失
2. **网络错误处理**: 网络错误时保持登录状态，避免频繁登出
3. **路由嵌套**: 确保受保护的路由都在 RouteGuard 的 children 中
4. **状态同步**: 使用 MobX 确保状态变化时组件自动更新

## 扩展功能

### 1. 角色权限控制

可以在 RouteGuard 中添加角色检查：

```jsx
if (authStore.user?.role !== "ADMIN" && location.pathname.startsWith("/admin")) {
  return <Navigate to="/unauthorized" replace />;
}
```

### 2. 记住登录状态

可以添加"记住我"功能，延长 token 有效期

### 3. 多租户支持

可以扩展 AuthStore 支持多租户认证
