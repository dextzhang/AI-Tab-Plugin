# AI2tab

AI2tab 是一个 Chrome 扩展，用来把同一条提示词从弹窗发送到多个已打开的 AI 网页。

## 支持站点

- ChatGPT: `chat.openai.com`, `chatgpt.com`
- Gemini: `gemini.google.com`
- Grok: `grok.com`, `x.ai`, `x.com/i/grok`
- Grok Imagine: `grok.com/imagine`
- 千问 / Qwen: `tongyi.aliyun.com`, `qianwen.aliyun.com`, `qianwen.com`, `qwen.ai`
- 豆包: `doubao.com` 及其子域名
- Kimi: `kimi.moonshot.cn`, `kimi.com`

图片请求会发送到 ChatGPT、Gemini、Grok Imagine、千问/Qwen、豆包和 Kimi。千问/Qwen、豆包会先尝试点击“AI 生图 / 图像生成 / 图片生成”入口。

## 安装

1. 打开 `chrome://extensions/`。
2. 开启开发者模式。
3. 点击“加载已解压的扩展程序”。
4. 选择当前项目目录。

修改 `manifest.json`、权限或核心脚本后，需要重新加载扩展。

## 使用

1. 打开要发送的 AI 页面，并确认已经登录。
2. 打开 AI2tab 弹窗。
3. 输入文本提示词或图片提示词。
4. 点击发送按钮。
5. 重新打开弹窗，在“发送日志”里查看结果。

Chrome 扩展弹窗失焦后会自动关闭，这是浏览器机制。AI2tab 会把发送任务交给后台 service worker，并把结果保存到 `chrome.storage.local`。

## 文件

```text
manifest.json       Chrome 扩展配置
popup.html          弹窗界面
popup.js            弹窗逻辑和发送日志展示
background.js       后台发送任务和日志写入
content.js          注入 AI 页面的网站适配逻辑
utils.js            DOM、输入、点击、等待、Shadow DOM 工具
README.md           使用说明
CHANGELOG.md        更新日志
ITERATION_LOG.md    详细迭代记录
```

## 排错

- 重新加载扩展后，刷新目标 AI 页面。
- 重新打开弹窗，查看“发送日志”里哪些站点成功或失败。
- 在目标 AI 页面打开开发者工具，搜索 `[AI2tab]` 查看控制台日志。
- 如果某个站点仍失败，复制页面 URL 和发送日志里的失败原因。

当前版本：`1.6.1`
