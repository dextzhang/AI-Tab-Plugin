# AI2tab Project Audit

检查日期：2026-05-15

## 当前状态

- 当前版本为 `3.0.0`。
- 项目是 Manifest V3 Chrome 扩展，无构建步骤，直接加载目录即可运行。
- 核心运行文件位于项目根目录。
- `icons/` 存放扩展图标。
- `docs/` 存放维护文档。

## 核心文件

```text
manifest.json        扩展权限、后台 service worker、popup 和图标配置
ai-sites.js          共享站点配置
background.js        后台任务、标签页扫描、fresh chat、注入、日志
content.js           站点适配、模式切换、输入和发送
utils.js             DOM/Shadow DOM、输入、点击和等待工具
popup.html           Popup UI
popup.js             Popup 交互、偏好、历史、日志
CHANGELOG.md         更新摘要
README.md            使用说明
```

## 基础检查

已执行：

```text
node --check ai-sites.js
node --check background.js
node --check content.js
node --check popup.js
node --check utils.js
JSON.parse(manifest.json)
```

结果：

- JavaScript 文件均通过语法检查。
- `manifest.json` 可被 JSON 解析。
- 新增图标文件存在：`icons/ai2-16.png`、`icons/ai2-32.png`、`icons/ai2-48.png`、`icons/ai2-128.png`。

## 风险

- AI 网页 DOM、文案、模型菜单和权限域名变化频繁，站点适配仍需要持续维护。
- 模式切换是 best-effort 行为。切换失败时会继续发送，避免影响主流程。
- 图片模式入口在不同站点差异较大，稳定性低于文本同步。
- 如果修改 `manifest.json`，必须重新加载扩展并刷新目标 AI 页面。

## 维护原则

- 站点信息统一写入 `ai-sites.js`。
- 后台负责跨标签页和 fresh chat 准备。
- 页面端只处理当前站点 DOM。
- Popup 只负责用户输入、偏好配置和日志展示。
- 发送失败优先看发送日志，再结合页面控制台 `[AI2tab]` 日志定位。
