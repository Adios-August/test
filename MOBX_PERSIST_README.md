# MobX 持久化功能说明

## 概述

本项目使用 `mobx-persist-store` 库实现了 MobX 状态的自动持久化，确保用户刷新页面后状态不会丢失。

## 功能特性

### 1. 自动持久化

- 用户登录状态自动保存到 localStorage
- 页面刷新后自动恢复状态
- 无需手动管理 localStorage

### 2. 选择性持久化

- 只持久化必要的状态字段
- 避免存储敏感或临时数据
- 支持自定义存储键名

### 3. 兼容性

- 完全兼容 MobX 6
- 支持 React 18+
- 无装饰器兼容性问题

## 实现方式

### AuthStore 持久化

```jsx
class AuthStore {
  constructor() {
    makeAutoObservable(this);

    // 配置持久化
    makePersistable(this, {
      name: "authStore",
      properties: ["token", "user", "isAuthenticated"],
      storage: window.localStorage,
    });
  }
}
```

### RootStore 持久化

```jsx
class RootStore {
  constructor() {
    makeAutoObservable(this);

    // 配置持久化
    makePersistable(this, {
      name: "rootStore",
      properties: ["appLoading", "currentRoute"],
      storage: window.localStorage,
    });
  }
}
```

## 持久化字段

### AuthStore

- `token`: JWT 认证令牌
- `user`: 用户信息对象
- `isAuthenticated`: 登录状态标志

### RootStore

- `appLoading`: 应用加载状态
- `currentRoute`: 当前路由信息

## 存储结构

持久化数据存储在 localStorage 中，键名格式：

```
mobx-persist:authStore
mobx-persist:rootStore
```

## 使用方法

### 1. 添加新的持久化字段

在 store 的构造函数中添加：

```jsx
makePersistable(this, {
  name: "storeName",
  properties: ["field1", "field2"],
  storage: window.localStorage,
});
```

### 2. 避免持久化的字段

不在 `properties` 数组中列出的字段不会被持久化，如：

- `loading`: 临时状态
- `error`: 错误信息
- `tempData`: 临时数据

### 3. 自定义存储

可以指定不同的存储方式：

```jsx
// 使用 sessionStorage
storage: window.sessionStorage;

// 使用自定义存储
storage: customStorage;
```

## 注意事项

1. **性能考虑**: 只持久化必要的状态，避免存储大量数据
2. **安全性**: 敏感信息（如密码）不会被持久化
3. **兼容性**: 确保浏览器支持 localStorage
4. **清理**: 登出时会自动清理持久化数据

## 扩展功能

### 1. 多存储支持

可以配置多个存储源，实现数据同步

### 2. 数据迁移

支持旧版本数据的自动迁移和升级

### 3. 压缩存储

对于大量数据，可以实现压缩存储

## 故障排除

### 常见问题

1. **状态未恢复**: 检查 `properties` 数组是否包含相应字段
2. **存储失败**: 检查浏览器是否支持 localStorage
3. **数据损坏**: 清除 localStorage 重新登录

### 调试方法

在浏览器控制台中查看：

```jsx
// 查看持久化数据
localStorage.getItem("mobx-persist:authStore");

// 清除所有持久化数据
Object.keys(localStorage).forEach((key) => {
  if (key.startsWith("mobx-persist")) {
    localStorage.removeItem(key);
  }
});
```
