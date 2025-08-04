# 主题系统

这个目录包含了 Ant Design 的静态主题配置，使用红色 `#db0011` 作为主色调。

## 目录结构

```
src/theme/
├── index.js              # 主题配置主文件
├── ThemeProvider.jsx     # 主题提供者组件
├── theme.scss            # 主题样式文件
└── README.md             # 本文档
```

## 功能特性

### 🎨 主题配置

- 统一的红色主题色 `#db0011`
- 完整的 Ant Design 组件主题定制
- 响应式设计支持
- 组件级别的样式配置

### 🔧 配置灵活

- 统一的主题配置
- 组件级别的主题定制
- 响应式主题支持

### 📱 组件集成

- Ant Design 深度集成
- 主题提供者组件

## 使用方法

### 1. 基本使用

```jsx
import { ThemeProvider } from "./theme/ThemeProvider";

// 在应用根组件中包装
function App() {
  return (
    <ThemeProvider>
      <YourApp />
    </ThemeProvider>
  );
}
```

### 2. 主题配置

主题配置在 `index.js` 中定义：

```javascript
export const theme = {
  token: {
    colorPrimary: "#db0011",
    colorPrimaryHover: "#ff1a1a",
    colorPrimaryActive: "#b30000",
    // ... 其他配置
  },
  components: {
    // 组件特定配置
  },
};
```

## 配置选项

### 主题色配置

```javascript
token: {
  colorPrimary: '#db0011',        // 主色调
  colorPrimaryHover: '#ff1a1a',   // 悬停色
  colorPrimaryActive: '#b30000',  // 激活色
  colorSuccess: '#52c41a',        // 成功色
  colorWarning: '#faad14',        // 警告色
  colorError: '#ff4d4f',          // 错误色
  colorInfo: '#db0011',           // 信息色
}
```

### 组件配置

```javascript
components: {
  Button: {
    borderRadius: 6,
    controlHeight: 32,
    fontSize: 14,
  },
  Input: {
    borderRadius: 6,
    controlHeight: 32,
    fontSize: 14,
  },
  // ... 其他组件
}
```

## 样式定制

### CSS 变量

主题系统使用 CSS 变量来管理颜色：

```css
:root {
  --ant-primary-color: #db0011;
  --ant-primary-color-hover: #ff1a1a;
  --ant-primary-color-active: #b30000;
  --ant-primary-color-outline: rgba(219, 0, 17, 0.2);
}
```

### 组件样式覆盖

在 `theme.scss` 中定义了所有 Ant Design 组件的主题覆盖样式。

## 扩展主题

### 修改主题色

要修改主题色，编辑 `index.js` 文件中的 `colorPrimary` 值：

```javascript
token: {
  colorPrimary: '#your-new-color',
  // 同时更新相关的悬停和激活色
  colorPrimaryHover: '#your-hover-color',
  colorPrimaryActive: '#your-active-color',
}
```

### 自定义组件主题

在 `index.js` 的 `components` 配置中添加组件特定主题：

```javascript
components: {
  YourComponent: {
    borderRadius: 8,
    fontSize: 16,
  },
}
```

## 最佳实践

1. **统一主题配置**: 所有主题相关配置都在 `index.js` 中
2. **组件化设计**: 使用 `ThemeProvider` 包装应用
3. **响应式设计**: 考虑不同屏幕尺寸下的主题表现
4. **可访问性**: 确保主题色符合可访问性标准

## 故障排除

### 主题不生效

- 检查 `ThemeProvider` 是否正确包装应用
- 确认 CSS 变量是否正确设置
- 检查浏览器缓存

### 样式冲突

- 检查 CSS 优先级
- 确认样式文件加载顺序
- 使用 `!important` 确保覆盖

## 更新日志

- **v1.0.0**: 初始版本，静态红色主题配置
