# AI2tab

AI2tab 是一个 Manifest V3 Chrome 扩展，用来把同一条文本提示词或图片生成提示词，从弹窗同步发送到多个已经打开并登录的 AI 网页。

当前版本：`3.0.0`

## 支持站点

- ChatGPT: `chat.openai.com`, `chatgpt.com`
- Gemini: `gemini.google.com`
- Grok: `grok.com`, `x.ai`, `x.com/i/grok`
- 通义千问 / Qwen: `tongyi.aliyun.com`, `qianwen.aliyun.com`, `qianwen.com`, `qwen.ai`
- 豆包: `doubao.com` 及其子域名
- Kimi: `kimi.moonshot.cn`, `kimi.com`

## v3 重构重点

- 新增共享站点配置 `ai-sites.js`，统一管理域名、选择器、新对话策略、模式配置和图片站点范围。
- 发送流程改为后台枚举标签页、准备 fresh chat、注入页面脚本、执行站点适配器、持久化日志。
- Popup 增加发送目标开关和模式选择，支持按站点启用/关闭。
- 模式切换采用容灾策略：切换失败时继续按当前页面模式发送。
- Popup UI 改为淡灰白毛玻璃风格，并新增 `AI2` 文字图标。
- 发送日志仅保留最近 10 条，提示词历史仅保留最近 5 条。

## 模式偏好

当前模式配置以真实网页交互为基础：

- ChatGPT: 普通 / 进阶
- Gemini: 快速 / 思考 / Pro
- Grok: Auto / Fast / Expert / Grok 4.3
- 通义千问 / Qwen: 普通 / 思考
- 豆包: 快速 / 思考 / 专家
- Kimi: K2.6 快速 / K2.6 思考

其中豆包、Gemini、Kimi、ChatGPT、Grok 会先打开当前模式菜单再选择目标项；千问/Qwen 使用“思考”开关点亮或熄灭。

## 安装

1. 打开 `chrome://extensions/`。
2. 开启“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择当前项目目录。

修改 `manifest.json`、权限或核心脚本后，需要在扩展管理页重新加载扩展，并刷新目标 AI 页面。

## 使用

1. 打开要发送到的 AI 页面，并确认已经登录。
2. 打开 AI2tab 扩展弹窗。
3. 在“文本”页签输入提示词。
4. 在“发送目标与模式”里选择要发送的站点和模式。
5. 点击“发送文本”。
6. 重新打开弹窗，在“发送日志”中查看每个站点的结果。

图片页签仍保留图片提示词入口。图片模式会尽量复用相同目标站点配置，但图片生成入口仍受各站点页面结构影响。

## 项目结构

```text
manifest.json        Chrome 扩展配置
ai-sites.js          站点域名、模式、选择器和策略配置
popup.html           弹窗界面
popup.js             弹窗交互、偏好设置、历史和日志展示
background.js        后台发送任务、标签页枚举、fresh chat 和日志写入
content.js           注入 AI 页面的网站适配逻辑
utils.js             DOM、输入、点击、等待和 Shadow DOM 工具
icons/               AI2 扩展图标
CHANGELOG.md         版本更新记录
docs/                维护文档和检查报告
```

## 排错

- 修改扩展文件后，先重新加载扩展，再刷新目标 AI 页面。
- 发送失败时查看“发送日志”里的站点级错误。
- 模式切换不准时，点击“诊断模式控件”，把 `Mode Diagnose` 日志用于继续适配。
- 在目标 AI 页面打开开发者工具，搜索 `[AI2tab]` 查看页面端日志。

## 维护记录

- [CHANGELOG.md](CHANGELOG.md): 面向版本的更新摘要。
- [docs/ITERATION_LOG.md](docs/ITERATION_LOG.md): 详细迭代过程。
- [docs/PROJECT_AUDIT.md](docs/PROJECT_AUDIT.md): 当前项目整理和基础检查结果。
