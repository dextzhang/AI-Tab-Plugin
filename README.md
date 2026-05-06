# AI2tab

AI2tab 是一个 Manifest V3 Chrome 扩展，用来把同一条文本提示词或图片生成提示词，从弹窗同步发送到多个已经打开并登录的 AI 网页。

当前版本：`2.0.0`

## 支持站点

- ChatGPT: `chat.openai.com`, `chatgpt.com`
- Gemini: `gemini.google.com`
- Grok: `grok.com`, `x.ai`, `x.com/i/grok`
- Grok Imagine: `grok.com/imagine`
- 通义千问 / Qwen: `tongyi.aliyun.com`, `qianwen.aliyun.com`, `qianwen.com`, `qwen.ai`
- 豆包: `doubao.com` 及其子域名
- Kimi: `kimi.moonshot.cn`, `kimi.com`

图片请求会发送到 ChatGPT、Gemini、Grok Imagine、通义千问 / Qwen、豆包和 Kimi。通义千问 / Qwen、豆包会先尝试进入图片生成入口，再发送图片提示词。

## 安装

1. 打开 `chrome://extensions/`。
2. 开启“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择当前项目目录。

修改 `manifest.json`、权限或核心脚本后，需要在扩展管理页重新加载扩展，并刷新目标 AI 页面。

## 使用

1. 打开要发送到的 AI 页面，并确认已经登录。
2. 打开 AI2tab 扩展弹窗。
3. 在“文本”或“图片”页签中输入提示词。
4. 点击发送按钮。
5. 重新打开弹窗，在“发送日志”中查看每个站点的结果。

Chrome 扩展弹窗失焦后会自动关闭，这是浏览器机制。AI2tab 会把发送任务交给后台 service worker，并把结果保存到 `chrome.storage.local`。

## 项目结构

```text
manifest.json        Chrome 扩展配置
popup.html           弹窗界面
popup.js             弹窗交互、历史记录和发送日志展示
background.js        后台发送任务、标签页枚举和日志写入
content.js           注入 AI 页面的网站适配逻辑
utils.js             DOM、输入、点击、等待和 Shadow DOM 工具
CHANGELOG.md         版本更新记录
docs/                维护文档和检查报告
archive/iterations/  历史迭代备份
references/          外部参考代码或资料
```

## 排错

- 重新加载扩展后，刷新目标 AI 页面。
- 重新打开弹窗，查看“发送日志”中哪些站点成功或失败。
- 在目标 AI 页面打开开发者工具，搜索 `[AI2tab]` 查看控制台日志。
- 如果某个站点仍失败，复制页面 URL 和发送日志里的失败原因，再针对该站点适配器排查。

## 维护记录

- [CHANGELOG.md](CHANGELOG.md): 面向版本的更新摘要。
- [docs/ITERATION_LOG.md](docs/ITERATION_LOG.md): 详细迭代过程。
- [docs/PROJECT_AUDIT.md](docs/PROJECT_AUDIT.md): 当前项目整理和基础检查结果。
