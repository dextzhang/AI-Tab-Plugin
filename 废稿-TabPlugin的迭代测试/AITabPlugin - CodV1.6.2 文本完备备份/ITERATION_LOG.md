# AI2tab Iteration Log

This file records the main development decisions made during the Codex-assisted repair and enhancement process.

## 2026-05-04

### v1.6.0 Stage Summary

This version is the first larger stabilization milestone after the 1.5.x repair series.

What changed:

- The project moved from a broken prototype with damaged labels and fragile popup-only execution to a background-driven extension with persistent logs.
- The popup is Chinese again and shows persistent send history.
- The send pipeline now has clear stages:
  1. Popup starts a task.
  2. Background service worker enumerates tabs.
  3. Background injects `utils.js` and `content.js`.
  4. Content script detects the current site adapter.
  5. Adapter finds input, applies content, and triggers submit.
  6. Background records final results in `chrome.storage.local`.
- Multi-AI Assistant was used as a reference for site adapters, Shadow DOM traversal, Kimi/Qwen/Doubao selectors, and the general idea that each AI site needs its own behavior contract.
- Image mode was expanded to include Doubao and Qwen/Tongyi by trying their “AI 生图 / 图像生成 / 图片生成 / 文生图 / 画图” mode before sending.
- Known fragile areas are now observable through Send Logs instead of silent popup failure.

Why this is a major version:

- The architecture changed from popup-driven sending to background-driven sending.
- Logs became a first-class feature.
- The extension now has a documented site-adapter model.
- The supported domain matrix expanded substantially.
- Several site-specific runtime bugs were fixed and documented.

## 2026-05-05

### v1.6.2 Kimi Fresh Chat And Single Write

- User reported Kimi still appending to an old conversation and Qwen/Kimi still sending duplicated text.
- Background now prepares Kimi tabs that are on existing conversation URLs by navigating them back to the same-origin fresh-chat page before injection.
- Kimi content selectors no longer include broad history-link matches such as `a[href*="/chat"]`.
- Kimi now stops before sending if it started on an existing conversation URL and the new-chat transition did not activate.
- Qwen/Kimi no longer write once in `fillAndSend` and then write again in the submit-prep step.
- Qwen/Kimi text setting now uses one value-set path and plain input/change notifications instead of stacked beforeinput/insert paths.

### v1.6.1 Clear-And-Write-Once Before Submit

- User proposed a more reliable strategy for Kimi and Qwen/Tongyi: before the final send step, clear the input box and write the prompt exactly once.
- Implemented `utils.clearInput`.
- Added `clearAndWriteBeforeSubmit` adapter flag.
- Enabled it only for Kimi and Qwen/Tongyi to avoid disturbing currently stable GPT/Gemini/Grok behavior.
- `content.js` now re-finds the input before submit, clears it, writes the final prompt once, and then sends.

### Project Understanding

- The project is a Manifest V3 Chrome extension.
- The intended workflow is: open several AI chat pages, open the extension popup, type one prompt, and send it to all detected AI tabs.
- Core files are `manifest.json`, `popup.html`, `popup.js`, `background.js`, `content.js`, and `utils.js`.

### v1.5.0 Recovery

- Rebuilt the popup after several labels and button IDs were broken.
- Fixed the image button ID mismatch.
- Made `utils.js` reusable across repeated script injections.
- Injected `utils.js` before `content.js`.
- Restored readable platform adapter logic.

### v1.5.1 URL Matching

- Expanded URL recognition for Grok, Qwen/Tongyi, Doubao, and related subdomains.
- Added host permissions so recognized pages could also receive injected scripts.

### v1.5.2 Grok Imagine and Input Fallbacks

- Added Grok image endpoint `https://grok.com/imagine`.
- Limited Grok image mode to Imagine pages.
- Added stronger input events and send button fallback search.

### v1.5.3 Hot Update

- Replaced one-time content script guard with a proxy listener.
- This lets newly injected logic replace old handlers after extension reloads.
- Input detection now prefers visible elements.

### v1.5.4 Multi-AI Assistant Reference

- Read the copied Multi-AI Assistant userscript from `C:\Users\Administrator\Desktop\新建 文本文档.txt`.
- Extracted useful ideas only:
  - Site adapters
  - Shadow DOM traversal
  - Kimi `kimi.com` and `[data-lexical-editor="true"]`
  - Qwen `textarea.message-input-textarea`
  - Qwen send button `div.omni-button-content button`
  - Grok `div.tiptap.ProseMirror`
- Added `kimi.com` and `qianwen.com` permissions.

### v1.5.5 Persistent Logs

- Chrome closes extension popups when focus moves elsewhere. This is normal browser behavior and cannot be reliably disabled.
- Added persistent Send Logs as the practical fix.
- Send Logs are saved to `chrome.storage.local`.
- Reopening the popup now shows recent send results, including:
  - Text or image mode
  - Prompt preview
  - Target count
  - Success count
  - Per-site failure reasons

### v1.5.6 Background Send Worker

- The first persistent-log implementation still had a weakness: if the popup closed while sending, the popup JavaScript context could be destroyed.
- Moved the actual send loop into `background.js`.
- The popup now only starts a background task.
- The background service worker performs tab detection, script injection, per-site send attempts, and final log persistence.
- This makes Send Logs much more reliable when the popup disappears after clicking elsewhere.

### v1.5.7 Doubao and Qwen/Tongyi Submit Tightening

- User reported Doubao and Qwen/Tongyi still did not generate responses.
- Removed broad new-chat anchor selectors that could click unrelated chat links.
- Added strict submit verification for Doubao and Qwen/Tongyi.
- These sites now fail loudly in Send Logs if the input stays filled after click/Enter.
- Added Doubao-specific input event flow using native value setter plus composed `input` and `change` events.

### v1.5.8 Image Mode Clarity and Kimi/Grok Fixes

- Image logs now explicitly show Doubao and Qwen/Tongyi as skipped when their tabs are open.
- This clarifies that image mode only targets ChatGPT, Gemini, Grok Imagine, and Kimi.
- Kimi repeated prompt insertion was addressed by clearing first and using one insertion path.
- Grok Imagine skips the normal new-chat flow and requires send-effect verification.

### v1.5.9 Doubao and Qwen/Tongyi Image Mode

- User clarified that Doubao and Qwen/Tongyi image generation is important.
- Re-added Doubao and Qwen/Tongyi to image targets.
- Added a site step before sending image prompts: click “AI 生图 / 图像生成 / 图片生成 / 文生图 / 画图”.
- Removed skipped-image logging for these sites.

### v1.5.10 Doubao and Qwen/Tongyi Runtime Error Fix

- Send Logs showed `Cannot read properties of undefined (reading 'send')`.
- Root cause: the site-specific submit helpers passed a temporary object without `selectors`.
- Fixed helpers to receive the full platform adapter.

### v1.5.11 Qwen Duplicate Input and Submit Trigger

- User reported Doubao/Qwen inputs receive text but do not send.
- User also reported Qwen text is duplicated many times.
- Qwen textarea input now uses only native setter + input/change events.
- Doubao/Qwen submit now tries native Enter first, then visible send button fallback.

### v1.5.12 Popup Runtime Visibility

- User reported clicking send produced no visible reaction.
- Added defensive popup initialization.
- Wrapped background messaging with callback-style `chrome.runtime.sendMessage` to surface `runtime.lastError`.
- Added local error logs when background task startup fails.
- Normalized old send log entries so malformed legacy logs cannot break popup rendering.

### v1.5.13 Kimi and Qwen Duplicate Text

- User confirmed text sync works but Kimi/Qwen duplicate input.
- Removed stacked insertion paths for Kimi rich text input.
- Simplified Qwen textarea setter flow.
- Added more Kimi new-chat selectors and URL fallback to `https://www.kimi.com/`.

## Current Known Risk

Some AI sites still may not receive messages even when detection works, because their DOM and input frameworks change often. The next debugging step should use Send Logs plus target-page console logs to determine whether failure happens at:

1. URL detection
2. Script injection
3. Input box detection
4. Input value application
5. Send button click / keyboard submission
