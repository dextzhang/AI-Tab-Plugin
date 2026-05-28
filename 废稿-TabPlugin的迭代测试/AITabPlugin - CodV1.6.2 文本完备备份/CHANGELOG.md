# AI2tab 更新日志

## v1.6.2 (2026-05-05)

- 修复 Kimi 旧会话页发送前没有真正进入新对话的问题：后台会先把 Kimi 历史会话 URL 切回同源首页，再注入发送脚本。
- 收紧 Kimi 新建对话选择器，移除容易点到历史会话的宽泛 `/chat` 链接匹配；如果仍停留在旧会话 URL，会停止发送，避免接在老对话后面。
- 修复千问/Qwen 与 Kimi 文本重复：这两个站点不再先写入一次、提交前再写一次，输入事件也改成单一路径通知，减少前端编辑器重复插入。

## v1.6.1 (2026-05-05)

- 按用户建议增加“提交前清空并只写入一次”的站点专用流程。
- 该流程目前只应用于千问/Qwen 和 Kimi，避免影响已稳定的 ChatGPT、Gemini、Grok。
- 新增 `clearInput` 工具函数，支持 textarea/input 和 contenteditable。
- 千问/Qwen 与 Kimi 会在真正发送前重新定位输入框、清空、写入一次最终提示词，再触发发送。
- 目标是修复 Kimi/千问文字复制多遍，以及新建对话/模式切换后输入框残留导致的重复。

## v1.6.0 (2026-05-04)

### 版本定位

`v1.6.0` 是本轮修复和增强后的阶段性大版本。它把原先容易乱码、容易误报成功、弹窗关闭后看不到结果、国产 AI 页面适配不足的问题，整理成一个更可测试、更可追踪的版本。

### 核心能力

- 文本模式支持向 ChatGPT、Gemini、Grok、千问/Qwen、豆包、Kimi 等已打开页面同步发送提示词。
- 图片模式支持 ChatGPT、Gemini、Grok Imagine、千问/Qwen、豆包、Kimi。
- 千问/Qwen、豆包图片模式会先尝试点击“AI 生图 / 图像生成 / 图片生成 / 文生图 / 画图”入口，再发送图片提示词。
- 发送任务由后台 service worker 执行，降低 popup 失焦关闭导致任务中断的概率。
- 弹窗增加持久化发送日志，记录每次发送的目标数、成功数和失败原因。

### 站点适配

- 参考 Multi-AI Assistant 的核心思路，改为站点适配器式处理。
- 增加 Shadow DOM 穿透查询。
- 增加 `kimi.com`、`qianwen.com`、`qwen.ai`、`doubao.com` 子域名、Grok Imagine 等入口。
- Kimi 增加 `[data-lexical-editor="true"]` 等富文本输入选择器。
- Qwen 增加 `textarea.message-input-textarea` 和 `div.omni-button-content button` 发送选择器。
- Grok 增加 `div.tiptap.ProseMirror` 输入选择器。

### 稳定性修复

- 修复弹窗中文乱码和按钮 ID 损坏问题。
- 修复 content script 重复注入和旧处理器无法热更新的问题。
- 修复豆包/千问专用发送函数传参错误。
- 修复 Kimi、千问输入重复的多路径插入问题。
- 增强后台通信错误可见化，避免点击发送后静默失败。

### 当前注意事项

- AI 网站 DOM 更新频繁，豆包、千问、Kimi、Grok 的发送按钮和输入框仍可能随站点更新失效。
- 如果某站失败，请优先复制“发送日志”中的失败原因，并在目标页面控制台搜索 `[AI2tab]`。

## v1.5.13 (2026-05-04)

- 修复千问/Qwen 与 Kimi 输入重复的二次兜底路径。
- 千问/Qwen textarea 不再先发送空 input 事件，减少前端编辑器重复处理概率。
- Kimi 富文本输入改为直接替换 `textContent`，不再叠加 `beforeinput` 和 `execCommand`。
- Kimi 新建对话增加更多按钮选择器，并增加 `https://www.kimi.com/` URL 兜底。

## v1.5.12 (2026-05-04)

- 增强弹窗错误可见化，避免点击发送后静默失败。
- `chrome.runtime.sendMessage` 改为 callback 包装，兼容更多 Chrome 扩展运行环境。
- 如果后台未响应或扩展未重新加载，会在状态栏和发送日志里写入错误。
- 兼容旧格式发送日志，避免旧日志导致弹窗脚本异常。

## v1.5.11 (2026-05-04)

- 修复千问/Qwen 输入重复：专用 textarea 输入流程改为只使用原生 setter，不再叠加 `execCommand` 和 paste。
- 豆包和千问/Qwen 发送流程改为优先模拟原生 Enter，再尝试按钮点击兜底。
- Enter 事件增加 `composed: true`，更接近真实键盘事件。

## v1.5.10 (2026-05-04)

- 修复豆包和千问/Qwen 专用发送函数传参错误。
- 之前兜底发送按钮查找时拿不到 `selectors.send`，会报 `Cannot read properties of undefined (reading 'send')`。

## v1.5.9 (2026-05-04)

- 重新把豆包和千问/Qwen 加入图片模式目标。
- 图片模式会在豆包和千问/Qwen 页面先尝试点击“AI 生图 / 图像生成 / 图片生成 / 文生图 / 画图”入口。
- 移除图片模式中豆包和千问/Qwen的“跳过”日志逻辑。
- 图片提示词改为更直接的“请生成图片：...”。

## v1.5.8 (2026-05-04)

- 图片模式日志会明确标记豆包和千问/Qwen为“跳过”，避免误以为漏检。
- 修复 Kimi 输入重复问题：Kimi 现在先清空输入框，再只走一条插入路径。
- Grok Imagine 图片模式不再执行“新建聊天”流程。
- Grok/Kimi 图片模式改为需要发送后验证输入框清空或生成状态，否则记录失败。

## v1.5.7 (2026-05-04)

- 为豆包和千问/Qwen 增加更严格的站点专用发送流程。
- 移除过宽的新建对话链接选择器，避免点错聊天链接。
- 豆包和千问/Qwen 只有在检测到输入框清空或生成状态后才记录成功。
- 增加豆包专用 textarea 原生 setter 和 composed input/change 事件。
- 优化发送按钮查找，优先使用可见按钮和输入框附近的发送元素。

## v1.5.6 (2026-05-04)

- 将真正的发送流程从 `popup.js` 移到 `background.js`。
- 即使弹窗失焦关闭，后台也会继续执行发送。
- 弹窗现在只负责启动后台任务并读取发送日志。
- 后台会把最终日志写入 `chrome.storage.local`。

## v1.5.5 (2026-05-04)

- 弹窗增加持久化发送日志。
- 每次发送记录模式、提示词预览、目标数、成功数和各站点成功/失败详情。
- 增加清空日志按钮。
- 记录 Chrome 弹窗失焦自动关闭的限制，并用持久化日志作为解决方案。

## v1.5.4 (2026-05-04)

- Imported useful adapter ideas from Multi-AI Assistant.
- Added `kimi.com` and `qianwen.com` permissions and URL matching.
- Added Shadow DOM traversal helpers.
- Added Kimi `[data-lexical-editor="true"]` selector.
- Added Qwen `textarea.message-input-textarea` input selector and `div.omni-button-content button` send selector.
- Added Grok `div.tiptap.ProseMirror` input selector.
- Added Qwen/Tongyi textarea input fallback: clear, `execCommand("insertText")`, paste event, and native setter.

## v1.5.3 (2026-05-04)

- Changed content script loading to a hot-updatable proxy listener.
- Prefer visible input candidates.
- Use native setters and event constructors from the target page window.

## v1.5.2 (2026-05-04)

- Added Grok Imagine: `https://grok.com/imagine`.
- Limited Grok image requests to Imagine pages.
- Strengthened input and send button fallbacks.

## v1.5.1 (2026-05-04)

- Expanded Grok, Qwen/Tongyi, and Doubao URL matching.
- Added related host permissions.

## v1.5.0 (2026-05-04)

- Rebuilt popup UI and fixed broken labels/buttons.
- Fixed repeated content script injection issues.
- Inject `utils.js` before `content.js`.
- Restored and cleaned platform adapter logic.

## v1.4.x and earlier

- Initial multi-AI send prototype.
- Added `utils.js`.
- Added text and image request flows.
