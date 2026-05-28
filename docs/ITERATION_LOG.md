# AI2tab Iteration Log

## 2026-05-28 v3.2.1 修复 Gemini/contenteditable 状态损坏问题

- **修复 contenteditable 暴力清除 Bug**：在 `utils.js` 中的 `clearInput` 函数里，移除了对非 input/textarea 元素的无条件 `element.textContent = ''` 强行清空。此粗暴操作会毁灭富文本编辑器（如 Quill）的内部 DOM 节点与数据绑定，从而导致 Gemini 输入框即使成功填充文本，在发送时也可能退回输入框、发送按钮失效，甚至导致手动输入时网页发生内部状态损坏报错。
- **优化 Gemini 兜底输入逻辑**：在 `setInputGeminiEditable` 中作为最后防线直接赋值时，不再销毁并重建所有子节点，而是优先更新已存在的 `<p>` 标签，进一步避免了与 Quill 的 Virtual DOM 结构冲突。
- **完善静默唤醒文档**：在相关文档中细化了状态损坏机制及对应的优雅降级策略。

## 2026-05-27 v3.2.0 规范化解耦与进度反馈

- **技术解耦重构**：将 `content.js` 中所有对豆包（Doubao）特有逻辑（约 500 行代码）剥离并迁移至 `ai-sites.js` 中的 `customRunAction` 声明式 Hook 中，彻底实现内容脚本通用化。
- **并发控制优化**：在 `background.js` 中实现了一个最大并发数为 2 的异步 Worker 任务队列调度器，防止过多标签同时 Reload/准备会话造成卡顿。
- **实时进度反馈通道**：在 Popup 中新增 `.site-status-badge` 状态徽标，接收 `background.js` 的 `ai2tabProgressUpdate` 消息推送，实时显示每个站点的加载、写入、成功/失败进度。
- **版本规范化**：各模块版本统一升为 `3.2.0`，并在 `content.js` 中直接动态调用 `chrome.runtime.getManifest` 获取版本号。

## 2026-05-19 v3.0.2 稳定性修复

- 修复同一站点打开多个标签时会重复发送同一条提示词的问题。后台现在会按站点去重，每个站点只保留一个目标标签。
- 目标标签选择优先级为：当前激活标签、未休眠标签、最近访问标签。
- 修复休眠或未加载完成标签偶发找不到输入框的问题。后台发送前会优先在后台 reload/等待目标标签，不主动切换浏览器焦点。
- 对“未找到输入框”和消息通道断开增加一次后台 reload 重试。
- 如果后台 reload 后仍失败，会进入前台兜底：保存当前活动标签，短暂激活目标标签执行一次发送，然后恢复原来的活动标签。
- 发送流程从并行改为逐站点顺序执行，减少多个目标标签同时唤醒导致的不稳定。
- 设计取舍：默认保持非 UI 打扰；只有后台静默路径失败时才短暂前台兜底，兜底失败后记录失败原因。

## 2026-05-15 v3.0.1 视觉更新

- Popup 主视觉从蓝色玻璃风格调整为暖灰 + 浅金色拟物风格。
- 按钮、页签选中态、下拉框、站点设置行、历史和日志卡片统一改为外投影凸起质感。
- 去除主要控件上的渐变，避免按钮显得偏现代扁平或色彩过重。
- 重新生成 `AI2` 图标，使用浅金底色、暖灰边框和深色文字。
- 本次更新只涉及视觉层和图标文件，不改动发送逻辑。

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
