# 项目整理与检查报告

检查日期：2026-05-06

## 整理结果

- 当前扩展运行文件保留在项目根目录，方便 Chrome 直接“加载已解压的扩展程序”。
- 历史迭代备份已归档到 `archive/iterations/`。
- 外部参考源码已归档到 `references/`。
- 详细迭代日志移入 `docs/ITERATION_LOG.md`。
- `README.md` 和 `CHANGELOG.md` 已重新整理为可读的维护文档。

## 基础检查

已执行：

```text
node --check popup.js
node --check background.js
node --check content.js
node --check utils.js
JSON.parse(manifest.json)
manifest 引用文件存在性检查
```

结果：

- `popup.js`、`background.js`、`content.js`、`utils.js` 均通过 JavaScript 语法检查。
- `manifest.json` 可被 JSON 解析，且 `background.service_worker`、`action.default_popup` 指向的文件存在。
- 文档和源码本身是 UTF-8；PowerShell 默认输出可能显示乱码，但 Node.js 按 UTF-8 读取正常。

## 当前风险

- AI 网站 DOM 更新频繁，输入框、发送按钮和图片生成入口选择器仍可能失效。
- 图片生成模式依赖各站点入口文案和页面结构，稳定性低于文本同步。
- Kimi、通义千问 / Qwen、豆包的发送成功需要结合弹窗“发送日志”和目标页控制台 `[AI2tab]` 日志继续定位。

## 建议维护流程

1. 修改 `manifest.json`、权限或脚本后，重新加载扩展并刷新目标 AI 页面。
2. 先用文本模式验证 ChatGPT、Gemini、Grok、通义千问 / Qwen、豆包、Kimi。
3. 再验证图片模式，优先记录失败站点的 URL、发送日志和控制台日志。
4. 每次稳定修复后更新 `CHANGELOG.md`，把排查过程补到 `docs/ITERATION_LOG.md`。
