# 千问 AI API 配置说明

## 配置说明

### 1. API 密钥配置

API 密钥已直接配置在代码中，无需额外设置。

**当前配置**：

- API 密钥：`sk-e1bc339dda7744b5ad2635889f0fb770`
- API 地址：`https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
- 模型：`qwen-plus`
- 流式响应：已启用
- 超时时间：30 秒

### 2. 如需更换 API 密钥

如需使用自己的 API 密钥，请修改 `src/config/api.js` 文件中的 `API_KEY` 值。

## 功能特性

### ✅ 已实现

- 流式 AI 回复
- 请求取消机制
- Markdown 渲染支持
- 代码高亮
- 响应式设计
- 会话管理

### 🔧 技术实现

- 使用 `fetch` API 进行流式请求
- `AbortController` 实现请求取消
- `TextDecoder` 解析流式响应
- React Hooks 状态管理
- Ant Design UI 组件

## 注意事项

1. **API 密钥安全**: 当前 API 密钥已硬编码在代码中，请注意安全
2. **请求限制**: 注意 API 的调用频率和配额限制
3. **错误处理**: 已实现基本的错误处理和重试机制
4. **流式解析**: 支持实时显示 AI 回复内容

## 使用方法

1. 在知识库页面输入问题
2. 点击发送按钮
3. 系统自动跳转到问答页面
4. AI 开始流式生成回复
5. 可以随时点击"停止回答"按钮取消请求

## 故障排除

### 常见问题

1. **API 密钥无效**: 检查 `src/config/api.js` 中的 API 密钥
2. **网络超时**: 检查网络连接和超时设置
3. **流式解析失败**: 检查响应格式是否正确

### 调试方法

1. 查看浏览器控制台错误信息
2. 检查网络请求状态
3. 验证 API 密钥权限

## 代码结构

```
src/
├── config/
│   └── api.js              # API配置文件
├── components/
│   └── MarkdownRenderer.jsx # Markdown渲染组件
├── pages/
│   └── knowledge/
│       ├── KnowledgeQA.jsx  # 问答页面主组件
│       └── KnowledgeQA.scss # 问答页面样式
└── router/
    └── index.jsx            # 路由配置
```

## 快速开始

1. 确保项目依赖已安装：`npm install`
2. 启动开发服务器：`npm run dev`
3. 访问知识库页面，输入问题开始测试
4. 系统会自动跳转到问答页面，使用千问 AI 进行回复
