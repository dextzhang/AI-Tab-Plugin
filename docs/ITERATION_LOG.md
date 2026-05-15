# AI2tab Iteration Log

## 2026-05-15 v3.0.0 重构记录

本轮重构从“继续修补单个站点选择器”改为“共享站点配置 + 后台发送管线 + 页面端适配策略”的结构，目标是降低多 AI 网页同步发送的失败率，并让后续站点适配更可维护。

### 背景

早期版本把大量站点逻辑塞在 `content.js` 中，popup、background 和 content script 各自维护域名判断或站点信息，容易出现检测、权限和页面适配不一致的问题。实际测试中也出现过：

- manifest 权限未覆盖当前真实域名，导致 `Cannot access contents of the page`。
- 页面 fresh chat 跳转后，content script 消息通道关闭。
- Qwen 实际发送成功但因为验证条件太严格而误报失败。
- 豆包和 Grok 在旧会话中继续追加消息。
- 模式切换控件在不同站点呈现为菜单、胶囊按钮或 toggle，不能依赖通用文字搜索。

### 架构调整

- 新增 `ai-sites.js`，集中维护站点定义：
  - 域名匹配
  - fresh chat URL
  - 新对话按钮文本
  - 输入框和发送按钮选择器
  - 站点模式配置
  - 模式切换策略
- `background.js` 负责：
  - 枚举已打开标签页
  - 按用户配置过滤目标站点
  - 对 Kimi、豆包、Grok 等执行 fresh chat 准备
  - 注入 `ai-sites.js`、`utils.js`、`content.js`
  - 处理 message channel closed 后的重试
  - 写入持久化发送日志
- `content.js` 负责：
  - 识别当前站点
  - 尝试切换模式
  - 查找输入框
  - 写入提示词
  - 触发发送
  - 按站点要求验证发送效果
- `popup.js` 负责：
  - 提示词输入
  - 站点启用/禁用
  - 模式偏好保存
  - 历史提示词和发送日志展示

### UI 调整

- Popup 改为淡灰白毛玻璃风格。
- 新增“发送目标与模式”区域。
- 每个站点有独立开关和模式选择。
- 新增 `AI2` 文字图标，写入 `manifest.json` 的 `icons` 和 `action.default_icon`。
- 发送日志保留最近 10 条。
- 最近提示词保留最近 5 条。

### 模式策略

根据用户截图和诊断结果，模式切换分为两类：

- 菜单型：豆包、Gemini、Kimi、ChatGPT、Grok。先点击当前模式胶囊，再在菜单中选择目标项。
- Toggle 型：通义千问 / Qwen。根据用户选择点亮或熄灭“思考”开关。

当前配置：

- ChatGPT: 普通 / 进阶
- Gemini: 快速 / 思考 / Pro
- Grok: Auto / Fast / Expert / Grok 4.3
- 通义千问 / Qwen: 普通 / 思考
- 豆包: 快速 / 思考 / 专家
- Kimi: K2.6 快速 / K2.6 思考

模式切换失败不会阻断发送，会继续按当前页面模式发送。

### 诊断工具

新增“诊断模式控件”按钮。它会扫描已打开 AI 页面中的可见按钮、菜单、下拉框、`aria-label`、`data-testid` 等，并把候选控件写入发送日志。该能力用于后续根据真实页面控件继续适配。

### 已执行检查

```text
node --check ai-sites.js
node --check background.js
node --check content.js
node --check popup.js
node --check utils.js
JSON.parse(manifest.json)
```

### 后续维护建议

- 每次站点 UI 变化后，先跑“诊断模式控件”，再更新 `ai-sites.js` 中对应站点策略。
- 新增站点时优先补充共享配置，不要在 popup、background、content 中重复写站点信息。
- 对会话追加风险高的站点，优先使用 background 中的 fresh URL 准备流程。
