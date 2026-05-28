# AI2tab 更新日志

## v1.4.1 (2026-04-22)

### 🐛 Bug 修复

- **修复国产AI模型（豆包、通义千问、Kimi）无反应问题**
  - 使用 Promise 封装脚本注入和消息发送，确保时序正确
  - 脚本注入后添加 500ms 延迟等待初始化完成
  - 改进错误处理，使用 async/await 替代回调嵌套

- **增强调试日志**
  - 添加详细的控制台日志，记录每个平台的检测和执行过程
  - 在各关键步骤添加日志输出，便于排查问题

### 🔧 问题根因

- 之前使用 `chrome.scripting.executeScript` 后立即发送消息，但部分页面脚本加载较慢
- 国产AI网站可能有特殊的页面加载机制，需要更长的初始化时间

---

## v1.4 (2026-04-22)

### 🛠️ 重构与优化

- **新增共享工具库 utils.js**
  - 提取所有通用辅助函数：find, findByText, findVisibleByText, setInput, pressEnter, pressCtrlEnter, clickEl, waitFor 等
  - 添加日志系统 TabPluginUtils.log/error，支持调试模式
  - 实现重试机制 TabPluginUtils.retry
  - 实现可见性检测 TabPluginUtils.isVisible

- **重构 content.js**
  - 使用 IIFE 封装，避免全局变量污染
  - 引入 AI_PLATFORMS 配置对象，统一管理各平台的选择器、URL 匹配规则和配置
  - 模块化处理流程：createNewChat → selectModel → enableDeepThink → selectExpert → fillAndSend
  - 完善错误处理和日志记录
  - 优化图片生成逻辑

- **重构 popup.js**
  - 移除重复的辅助函数，引用 utils.js
  - 完善状态反馈机制，显示详细的成功/失败信息
  - 每个AI网站独立显示成功或失败原因
  - 新增 getSiteName 函数用于标识各平台

### 🐛 Bug 修复

- 修复图片生成功能，现在正确传递 prompt 和 size 参数
- 修复异步执行结果处理，完善错误信息传递
- 修复豆包模型选择逻辑漏洞
- 修复 ChatGPT 新建对话按钮选择器

### ⚡ 性能优化

- 使用动态等待替代固定延迟
- 添加重试机制提高稳定性

---

## v1.1 (历史版本)

### 初始版本

- 支持多AI模型消息同步发送
- 支持 ChatGPT、Gemini、Grok、通义千问、豆包、Kimi
- 支持图片生成（仅 ChatGPT、Gemini、Kimi）
- 消息历史记录功能
- 弹窗界面多标签切换
