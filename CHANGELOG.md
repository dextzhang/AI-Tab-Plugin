# AI2tab 更新日志

## v2.0.0 (2026-05-05)

- 将文本同步流程标记为稳定里程碑。
- ChatGPT、Gemini、Grok、通义千问 / Qwen、豆包、Kimi 的文本同步发送流程已基本可用。
- Kimi 发送前会优先进入新对话，避免把新提示词接到旧会话后面。
- 通义千问 / Qwen 和 Kimi 的输入流程改为单次写入，减少重复粘贴、重复插入和提交前二次写入问题。
- 后台 service worker 负责跨标签页发送和持久化日志，弹窗关闭后仍能记录结果。
- 后续重点转向图片生成模式、更多站点适配和 UI 体验。

## v1.6.2 (2026-05-05)

- 修复 Kimi 旧会话页发送前没有真正进入新对话的问题。
- 收紧 Kimi 新建对话选择器，移除容易点到历史会话的宽泛 `/chat` 链接匹配。
- 如果 Kimi 仍停留在旧会话 URL，会停止发送，避免追加到旧对话。
- 修复通义千问 / Qwen 和 Kimi 文本重复写入问题。

## v1.6.1 (2026-05-05)

- 增加“提交前清空并只写入一次”的站点专用流程。
- 该流程只应用于通义千问 / Qwen 和 Kimi，避免影响已稳定的 ChatGPT、Gemini、Grok。
- 新增 `clearInput` 工具函数，支持 `textarea`、`input` 和 `contenteditable`。

## v1.6.0 (2026-05-04)

- 形成阶段性稳定版本：弹窗中文恢复、后台发送、持久化日志和多站点适配完成整合。
- 文本模式支持 ChatGPT、Gemini、Grok、通义千问 / Qwen、豆包、Kimi。
- 图片模式支持 ChatGPT、Gemini、Grok Imagine、通义千问 / Qwen、豆包、Kimi。
- 后台 service worker 执行发送任务，降低 popup 失焦关闭导致任务中断的概率。
- 增强发送日志，记录目标数、成功数和每个站点失败原因。
- 增加 Shadow DOM 查询、Kimi / Qwen / 豆包 / Grok 的关键选择器。

## v1.5.x (2026-05-04)

- 重建 popup UI，修复中文标签和按钮 ID 损坏。
- 修复 content script 重复注入和旧处理器无法热更新的问题。
- 注入顺序固定为先 `utils.js` 后 `content.js`。
- 扩展 Grok、Qwen / 通义千问、豆包、Kimi 的 URL 匹配和权限。
- 增加持久化发送日志。
- 将真实发送流程从 `popup.js` 移到 `background.js`。
- 多次修复 Qwen、Kimi、豆包输入重复、按钮触发和错误可见性问题。

## v1.4.x and earlier

- 初始多 AI 同步发送原型。
- 新增 `utils.js`。
- 增加文本和图片请求流程。
