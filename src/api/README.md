# API 使用说明

## 目录结构

```
src/api/
├── request.js          # Axios 请求配置和拦截器
├── index.js           # API 统一导出
├── example.js         # API 使用示例
├── README.md          # 使用说明文档
├── home/              # 首页相关 API
│   └── index.js
├── knowledge/         # 知识库相关 API
│   └── index.js
└── stats/             # 统计相关 API
    └── index.js
```

## 环境配置

项目使用环境变量进行配置，在根目录下创建以下文件：

### 开发环境 (.env.development)

```bash
VITE_API_BASE_URL=/api
VITE_APP_TITLE=Smart Search
VITE_APP_VERSION=1.0.0
VITE_DEV_MODE=true
VITE_DEBUG_MODE=true
```

### 生产环境 (.env.production)

```bash
VITE_API_BASE_URL=http://172.16.143.17:8080/api
VITE_APP_TITLE=Smart Search
VITE_APP_VERSION=1.0.0
VITE_DEV_MODE=false
VITE_DEBUG_MODE=false
```

### 使用环境变量

```javascript
// 直接使用环境变量
console.log(import.meta.env.VITE_API_BASE_URL);
```

## 使用方法

### 1. 导入 API

```javascript
// 导入特定页面的 API
import { homeAPI } from "@/api/home";
import { knowledgeAPI } from "@/api/knowledge";
import { statsAPI } from "@/api/stats";

// 或者统一导入
import { homeAPI, knowledgeAPI, statsAPI } from "@/api";
```

### 2. 在组件中使用

```javascript
import React, { useState, useEffect } from "react";
import { knowledgeAPI } from "@/api";

const KnowledgeList = () => {
  const [knowledgeList, setKnowledgeList] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchKnowledgeList = async () => {
    setLoading(true);
    try {
      const result = await knowledgeAPI.getKnowledgeList();
      setKnowledgeList(result.data || []);
    } catch (error) {
      console.error("获取知识库列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledgeList();
  }, []);

  return <div>{/* 组件内容 */}</div>;
};
```

### 3. 错误处理

```javascript
const handleApiCall = async () => {
  try {
    const result = await knowledgeAPI.getKnowledgeList();
    console.log("API调用成功:", result);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log("用户未登录，跳转到登录页");
    } else if (error.response?.status === 500) {
      console.log("服务器错误，请稍后重试");
    }
  }
};
```

## API 列表

### 首页 API (homeAPI)

- `getBanners()` - 获取首页轮播图

### 知识库 API (knowledgeAPI)

- `getKnowledgeList(params)` - 获取知识库列表

### 统计 API (statsAPI)

- `getVisitStats(params)` - 获取访问统计

## 请求拦截器功能

1. **自动添加 Token**: 从 localStorage 获取 token 并添加到请求头
2. **防止缓存**: GET 请求自动添加时间戳参数
3. **开发环境日志**: 在开发环境下打印请求和响应信息
4. **统一错误处理**: 根据状态码显示相应的错误提示

## 响应拦截器功能

1. **自动处理响应**: 成功响应直接返回 data 字段
2. **错误状态码处理**: 401 自动跳转登录页，其他状态码显示错误提示
3. **网络错误处理**: 区分网络错误和配置错误

## 注意事项

1. 所有 API 都返回 Promise，需要使用 async/await 或 .then() 处理
2. 错误会被自动处理并显示提示，也可以在 catch 中自定义处理
3. 开发环境下会打印详细的请求和响应日志
4. 文件上传等特殊请求需要额外的配置参数
