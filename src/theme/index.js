// Ant Design 主题配置
export const theme = {
  token: {
    // 主色调
    colorPrimary: "#db0011",
    colorPrimaryHover: "#ff1a1a",
    colorPrimaryActive: "#b30000",

    // 成功色
    colorSuccess: "#52c41a",
    colorSuccessHover: "#73d13d",
    colorSuccessActive: "#389e0d",

    // 警告色
    colorWarning: "#faad14",
    colorWarningHover: "#ffc53d",
    colorWarningActive: "#d48806",

    // 错误色
    colorError: "#ff4d4f",
    colorErrorHover: "#ff7875",
    colorErrorActive: "#d9363e",

    // 信息色
    colorInfo: "#db0011",

    // 字体
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    fontSize: 24, // 1.5rem = 24px
    fontWeight: 500,

    // 圆角
    borderRadius: 6,

    // 阴影
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
    boxShadowSecondary: "0 2px 4px rgba(0, 0, 0, 0.12)",

    // 间距
    padding: 16,
    margin: 16,

    // 动画
    motionDurationFast: "0.1s",
    motionDurationMid: "0.2s",
    motionDurationSlow: "0.3s",
  },

  // 组件特定配置
  components: {
    Button: {
      borderRadius: 6,
      controlHeight: 32,
      fontSize: 24,
      fontWeight: 500,
    },
    Input: {
      borderRadius: 6,
      controlHeight: 32,
      fontSize: 24,
      fontWeight: 500,
    },
    Select: {
      borderRadius: 6,
      controlHeight: 32,
      fontSize: 24,
      fontWeight: 500,
    },
    Table: {
      borderRadius: 6,
      headerBg: "#fafafa",
    },
    Card: {
      borderRadius: 8,
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    },
  },
};

// 默认导出
export default theme;
