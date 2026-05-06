// ==UserScript==
// @name         Multi-AI Assistant
// @name:zh-CN   多模型AI助手
// @name:en      AI Chat Assistant
// @version      3.3-dev
// @description  在任意已支持的 AI 聊天页面提问后，自动将同一问题同步到其他已打开且选中的 AI 标签页，实现多模型并行提问与效果对比。
// @description:en  After you send a prompt on any supported AI chat site, the script automatically syncs it to other open and selected AI tabs for parallel multi-model comparison.
// @author       GPT-5.3-Codex & Ryanli
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0IiBmaWxsPSJub25lIj4KICA8Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIyMiIgc3Ryb2tlPSIjNTlCOUU2IiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1kYXNoYXJyYXk9IjEyIDgiLz4KICA8Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIxNiIgc3Ryb2tlPSIjRjRDNTQyIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1kYXNoYXJyYXk9IjEwIDgiLz4KICA8cGF0aCBkPSJNMzAgMjhhNCA0IDAgMSAxIDUgMy44VjM1IiBzdHJva2U9IiMxMTEiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CiAgPGNpcmNsZSBjeD0iMzQiIGN5PSIzOSIgcj0iMiIgZmlsbD0iIzExMSIvPgogIDxwYXRoIGQ9Ik04IDEwaDEyYTMgMyAwIDAgMSAzIDN2NWEzIDMgMCAwIDEtMyAzaC00bC0zIDN2LTNoLTVhMyAzIDAgMCAxLTMtM3YtNWEzIDMgMCAwIDEgMy0zeiIgZmlsbD0iI0Y0QzU0MiIgc3Ryb2tlPSIjMTExIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8cGF0aCBkPSJNNDkgMjdoOWEzIDMgMCAwIDEgMyAzdjVhMyAzIDAgMCAxLTMgM2gtNWwtMyAzdi0zaC0xYTMgMyAwIDAgMS0zLTN2LTVhMyAzIDAgMCAxIDMtM3oiIGZpbGw9IiM1OUI5RTYiIHN0cm9rZT0iIzExMSIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPg==
// @match        https://doubao.com/chat/*
// @match        https://www.doubao.com/chat/*
// @match        https://chat.qwen.ai/*
// @match        https://qianwen.com/*
// @match        https://www.qianwen.com/*
// @match        https://aistudio.google.com/*
// @match        https://gemini.google.com/*
// @match        https://chatgpt.com/*
// @match        https://yuanbao.tencent.com/*
// @match        https://chat.deepseek.com/*
// @match        https://kimi.com/*
// @match        https://www.kimi.com/*
// @match        https://claude.ai/*
// @match        https://grok.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addValueChangeListener
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_addStyle
// @grant        unsafeWindow
// @run-at       document-start
// @license      MIT
// @namespace https://greasyfork.org/users/1375382
// @downloadURL https://update.greasyfork.org/scripts/571526/Multi-AI%20Assistant.user.js
// @updateURL https://update.greasyfork.org/scripts/571526/Multi-AI%20Assistant.meta.js
// ==/UserScript==

/*
 * =================================================================================================
 * --- v3.3-dev 功能简介与使用说明 ---
 *
 * 【说明】
 * 本代码基于“多AI同步提问助手.js”与“多模型同时回答 & 目录导航.js”融合重构，
 * 在保留多模型同步提问能力的基础上，新增并强化了以下功能。
 *
 * 【功能核验（继承 + 本版新增）】
 * 1. 文本同步分发：原两份脚本均已具备（继承能力）。
 * 2. 图片/文件同步（当前 drop-only）：用于验证拖拽通道跨站兼容性（测试能力）。
 * 3. 网络拦截提问 + 本地事件兜底：分别来自两份原脚本，当前版本做了融合（继承能力）。
 * 4. 选择状态同步、常用模型可见性、动画样式切换：来自“AI 对话助手(一键同步多模型).js”（继承能力）。
 * 5. 本版扩展一：在“图片同步”基础上扩展为“图片 + 通用文件同步”（当前兼容性验证阶段收敛为 drop-only）。
 * 6. 本版扩展二：新增独立资产通道与状态隔离（SHARED_ASSET、资产过期控制、远端注入流程）。
 *
 * 【v3.1 更新日志】
 * 1. 修复“粘贴图片偶发重复同步/重复注入”问题：新增本地资产事件指纹去重窗口。
 * 2. 修复多标签并发消费 SHARED_ASSET 的竞争问题：改为基于 assetMessageId 的幂等消费，不再在接收端回写 targetIds。
 * 3. 增强远端回灌抑制：远端注入资产后增加本地资产监听抑制窗口，避免站点延迟触发 change 导致二次广播。
 *
 * 【v3.2 更新日志】
 * 1. 资产去重升级为“内容指纹去重”：基于 dataUrl 生成指纹，不再依赖文件元数据（name/lastModified），降低部分站点二次触发漏拦截概率。
 * 2. 抑制策略调整为“短抑制窗口”：REMOTE_ASSET_SUPPRESS_WINDOW 调整为 2500ms，减少对连续操作的影响。
 * 3. 资产去重窗口调整为 3000ms，覆盖常见站点拖拽触发链路。
 *
 * 【v3.2-dev 调试增强】
 * 1. 新增“资产链路调试日志”独立开关（菜单可切换，默认关闭）。
 * 2. 覆盖 drop/去重命中/广播/接收/注入关键链路打点，便于定位少数站点异常双触发。
 * 3. 资产注入策略当前统一为 drop 通道，用于验证跨站点兼容性。
 *
 * 【v3.3-dev 注入策略重构（方案B）】
 * 1. 资产注入统一为 drop-only，聚焦拖拽通道兼容性验证。
 * 2. 注入后取消 verify delay，直接执行 DOM/网络联合校验。
 * 3. 移除多通道回退分支，降低链路复杂度并提升定位效率。
 *
 * 【最简使用】
 * 1. 点击右下角悬浮球，勾选目标模型。
 * 2. 在任一已支持页面正常提问/发送（或拖拽上传图片/文件）。
 * 3. 脚本自动同步到其他已选中的目标标签页。
 * =================================================================================================
 */

(function () {
    'use strict';

    const AITabSync = {
        // --- 1. State Management ---
        state: {
            thisSite: null,
            visibleTargets: [],
            selectedTargets: new Set(),
            isLoggingEnabled: false,
            isAssetTraceEnabled: false,
            isSubmitting: false,
            isProcessingQueryTask: false,
            isProcessingAssetTask: false,
            isApplyingRemoteAsset: false,
            suppressLocalAssetCaptureUntil: 0,
            suppressNextLocalSendCaptureUntil: 0,
            recentAssetFingerprints: new Map(),
            processedAssetMessageIds: new Map(),
            lastOutboundAssetSignalAt: 0,
            lastOutboundAssetSignalMeta: null,
            menuCommandId: null,
            assetTraceMenuCommandId: null,
            tooltipTimeoutId: null,
            animationStyle: 'spin',
            isSelectionSynced: true,
            assetSiteInjectionStrategies: {},
            isStrictModeEnabled: false,
            strictModeMenuCommandId: null,
        },

        // --- 2. Configuration ---
        config: {
            SCRIPT_VERSION: '3.3-dev',
            FALLBACK_ICON_DATA_URL: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0IiBmaWxsPSJub25lIj4KICA8Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIyMiIgc3Ryb2tlPSIjNTlCOUU2IiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1kYXNoYXJyYXk9IjEyIDgiLz4KICA8Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIxNiIgc3Ryb2tlPSIjRjRDNTQyIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1kYXNoYXJyYXk9IjEwIDgiLz4KICA8cGF0aCBkPSJNMzAgMjhhNCA0IDAgMSAxIDUgMy44VjM1IiBzdHJva2U9IiMxMTEiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CiAgPGNpcmNsZSBjeD0iMzQiIGN5PSIzOSIgcj0iMiIgZmlsbD0iIzExMSIvPgogIDxwYXRoIGQ9Ik04IDEwaDEyYTMgMyAwIDAgMSAzIDN2NWEzIDMgMCAwIDEtMyAzaC00bC0zIDN2LTNoLTVhMyAzIDAgMCAxLTMtM3YtNWEzIDMgMCAwIDEgMy0zeiIgZmlsbD0iI0Y0QzU0MiIgc3Ryb2tlPSIjMTExIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8cGF0aCBkPSJNNDkgMjdoOWEzIDMgMCAwIDEgMyAzdjVhMyAzIDAgMCAxLTMgM2gtNWwtMyAzdi0zaC0xYTMgMyAwIDAgMS0zLTN2LTVhMyAzIDAgMCAxIDMtM3oiIGZpbGw9IiM1OUI5RTYiIHN0cm9rZT0iIzExMSIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPg==',
            KEYS: {
                SHARED_QUERY: 'multi_sync_query_v1.0',
                SHARED_ASSET: 'multi_sync_asset_v1.0',
                ACTIVE_TABS: 'multi_sync_active_tabs_v1.0',
                LOGGING_ENABLED: 'multi_sync_logging_v1.0',
                ASSET_TRACE_ENABLED: 'multi_sync_asset_trace_v1.0',
                VISIBLE_TARGETS: 'multi_sync_visible_targets_v1.0',
                ANIMATION_STYLE: 'multi_sync_animation_style_v1.0',
                SELECTION_SYNC_ENABLED: 'multi_sync_selection_sync_v1.0',
                SHARED_SELECTION: 'multi_sync_shared_selection_v1.0',
                ASSET_SITE_INJECTION_STRATEGIES: 'multi_sync_asset_site_injection_strategies_v1.0',
                STRICT_MODE_ENABLED: 'multi_sync_strict_mode_v1.0',
            },
            TIMINGS: {
                HEARTBEAT_INTERVAL: 5000,
                STALE_THRESHOLD: 15000,
                CLEANUP_INTERVAL: 10000,
                SUBMIT_TIMEOUT: 20000,
                HUMAN_LIKE_DELAY: 500,
                FRESHNESS_THRESHOLD: 5000,
                ASSET_FRESHNESS_THRESHOLD: 20000,
                ASSET_DEDUP_WINDOW: 3000,
                REMOTE_ASSET_SUPPRESS_WINDOW: 2500,
                ASSET_PROCESSED_ID_TTL: 60000,
                ASSET_NETWORK_VERIFY_WINDOW: 2800,
                TOOLTIP_DELAY: 300,
            },
            DISPLAY_ORDER: ['AI_STUDIO', 'GEMINI', 'TONGYI', 'QWEN', 'YUANBAO', 'CHATGPT', 'CLAUDE', 'DOUBAO', 'DEEPSEEK', 'KIMI', 'GROK'],
            ASSET_SITE_STRATEGY_RECOMMENDED: {
                QWEN: 'drop',
            },
            SITES: {
                GROK: {
                    id: 'GROK',
                    name: 'Grok',
                    host: 'grok.com',
                    url: 'https://grok.com/',
                    apiPaths: ['/rest/app-chat/conversations/'],
                    inputSelectors: ['div.tiptap.ProseMirror'],
                    queryExtractor: (body) => {
                        try {
                            return JSON.parse(body)?.message || '';
                        } catch (e) {
                            return '';
                        }
                    },
                },
                CLAUDE: {
                    id: 'CLAUDE',
                    name: 'Claude',
                    host: 'claude.ai',
                    url: 'https://claude.ai/new',
                    apiPaths: ['/api/organizations/', '/completion'],
                    inputSelectors: ['div[contenteditable="true"][role="textbox"]'],
                    queryExtractor: (body) => {
                        try {
                            return JSON.parse(body)?.prompt || '';
                        } catch (e) {
                            return '';
                        }
                    },
                },
                KIMI: {
                    id: 'KIMI',
                    name: 'Kimi',
                    host: 'kimi.com',
                    url: 'https://www.kimi.com/',
                    apiPaths: ['/apiv2/kimi.gateway.chat.v1.ChatService/Chat'],
                    inputSelectors: ['[data-lexical-editor="true"]'],
                    queryExtractor: (body) => {
                        try {
                            const first = body.indexOf('{'),
                                last = body.lastIndexOf('}');
                            if (first === -1 || last < first) return '';
                            return JSON.parse(body.substring(first, last + 1))?.message?.blocks?.[0]?.text?.content || '';
                        } catch (e) {
                            return '';
                        }
                    },
                },
                GEMINI: {
                    id: 'GEMINI',
                    name: 'Gemini',
                    host: 'gemini.google.com',
                    url: 'https://gemini.google.com/app',
                    apiPaths: ['/StreamGenerate'],
                    inputSelectors: ['div.ql-editor[contenteditable="true"]'],
                    queryExtractor: (body) => {
                        try {
                            const p = new URLSearchParams(body);
                            const f = p.get('f.req');
                            if (!f) return '';
                            return JSON.parse(JSON.parse(f)?.[1])?.[0]?.[0] || '';
                        } catch (e) {
                            return '';
                        }
                    },
                },
                YUANBAO: {
                    id: 'YUANBAO',
                    name: '元宝',
                    host: 'yuanbao.tencent.com',
                    url: 'https://yuanbao.tencent.com/',
                    apiPaths: ['/api/chat/'],
                    inputSelectors: ['.ql-editor[contenteditable="true"]'],
                    queryExtractor: (body) => {
                        try {
                            return JSON.parse(body)?.prompt || '';
                        } catch (e) {
                            return '';
                        }
                    },
                },
                DEEPSEEK: {
                    id: 'DEEPSEEK',
                    name: 'DeepSeek',
                    host: 'chat.deepseek.com',
                    url: 'https://chat.deepseek.com/',
                    apiPaths: ['/api/v0/chat/completion'],
                    inputSelectors: ['textarea[placeholder="给 DeepSeek 发送消息 "]'],
                    queryExtractor: (body) => {
                        try {
                            return JSON.parse(body)?.prompt || '';
                        } catch (e) {
                            return '';
                        }
                    },
                },
                DOUBAO: {
                    id: 'DOUBAO',
                    name: '豆包',
                    host: 'doubao.com',
                    url: 'https://www.doubao.com/chat/',
                    apiPaths: ['/chat/completion', '/samantha/chat/completion'],
                    inputSelectors: ['textarea[data-testid="chat_input_input"]', 'textarea'],
                    queryExtractor: (body) => {
                        try {
                            const json = JSON.parse(body);
                            const msgs = json.messages;
                            if (!msgs || msgs.length === 0) return '';
                            const lastMsg = msgs[msgs.length - 1];
                            if (lastMsg.content_block && Array.isArray(lastMsg.content_block)) {
                                for (const block of lastMsg.content_block) {
                                    if (block.content && block.content.text_block && block.content.text_block.text) {
                                        return block.content.text_block.text;
                                    }
                                }
                            }
                            if (lastMsg.content) {
                                if (typeof lastMsg.content === 'string') {
                                    try {
                                        const inner = JSON.parse(lastMsg.content);
                                        if (inner.text) return inner.text;
                                    } catch (e) { }
                                    return lastMsg.content;
                                }
                            }
                            return '';
                        } catch (e) {
                            return '';
                        }
                    },
                },
                QWEN: {
                    id: 'QWEN',
                    name: 'Qwen',
                    host: 'chat.qwen.ai',
                    url: 'https://chat.qwen.ai/',
                    apiPaths: ['/api/v2/chat/completions'],
                    inputSelectors: ['textarea.message-input-textarea'],
                    queryExtractor: (body) => {
                        try {
                            return JSON.parse(body)?.messages?.slice(-1)?.[0]?.content || '';
                        } catch (e) {
                            return '';
                        }
                    },
                },
                TONGYI: {
                    id: 'TONGYI',
                    name: '千问',
                    host: 'qianwen.com',
                    url: 'https://www.qianwen.com/',
                    apiPaths: ['/api/v2/chat'],
                    inputSelectors: ['div[role="textbox"][contenteditable="true"]'],
                    queryExtractor: (body) => {
                        try {
                            return JSON.parse(body)?.messages?.slice(-1)?.[0]?.content || '';
                        } catch (e) {
                            return '';
                        }
                    },
                },
                AI_STUDIO: {
                    id: 'AI_STUDIO',
                    name: 'AI Studio',
                    host: 'aistudio.google.com',
                    url: 'https://aistudio.google.com/prompts/new_chat',
                    apiPaths: ['/GenerateContent'],
                    inputSelectors: [
                        'ms-autosize-textarea textarea',
                        'textarea[aria-label="Enter a prompt"]',
                        'textarea[aria-label="Type something or tab to choose an example prompt"]',
                        'textarea[placeholder="Start typing a prompt"]',
                        'textarea[placeholder*="Start typing a prompt"]',
                        'textarea.textarea'
                    ],
                    queryExtractor: (body) => {
                        try {
                            const j = JSON.parse(body);
                            const m = j?.[1];
                            if (Array.isArray(m)) {
                                for (let i = m.length - 1; i >= 0; i--) {
                                    if (Array.isArray(m[i]) && m[i][1] === 'user') return m[i][0]?.[0]?.[1] || '';
                                }
                            }
                            return '';
                        } catch (e) {
                            return '';
                        }
                    },
                },
                CHATGPT: {
                    id: 'CHATGPT',
                    name: 'ChatGPT',
                    host: 'chatgpt.com',
                    url: 'https://chatgpt.com/',
                    apiPaths: ['/backend-api/conversation', '/backend-api/f/conversation'],
                    inputSelectors: ['#prompt-textarea'],
                    queryExtractor: (body) => {
                        try {
                            return JSON.parse(body)?.messages?.slice(-1)?.[0]?.content?.parts?.[0] || '';
                        } catch (e) {
                            return '';
                        }
                    },
                },
            },
        },

        // --- 3. Cached Elements ---
        elements: {
            container: null,
            fab: null,
            chipsContainer: null,
            settingsModal: null,
            tooltip: null,
        },

        // --- 4. Utility Methods ---
        utils: {
            log(message, ...optionalParams) {
                if (!AITabSync.state.isLoggingEnabled || typeof console === 'undefined') return;
                console.log(`%c[AI Sync v${AITabSync.config.SCRIPT_VERSION}] ${message}`, 'color: #1976D2; font-weight: bold;', ...optionalParams);
            },
            assetTrace(message, ...optionalParams) {
                if (!AITabSync.state.isAssetTraceEnabled || typeof console === 'undefined') return;
                console.log(`%c[AI Asset Trace v${AITabSync.config.SCRIPT_VERSION}] ${message}`, 'color: #8E24AA; font-weight: bold;', ...optionalParams);
            },
            getBodyType(body) {
                if (body === null || body === undefined) return 'empty';
                if (typeof body === 'string') return 'string';
                if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) return 'URLSearchParams';
                if (typeof FormData !== 'undefined' && body instanceof FormData) return 'FormData';
                if (typeof Blob !== 'undefined' && body instanceof Blob) return `Blob(${body.type || 'unknown'})`;
                if (typeof Request !== 'undefined' && body instanceof Request) return 'Request';
                if (body instanceof ArrayBuffer) return 'ArrayBuffer';
                if (ArrayBuffer.isView(body)) return body.constructor?.name || 'TypedArray';
                return body?.constructor?.name || typeof body;
            },
            async bodyToText(body) {
                if (body === null || body === undefined) return '';
                if (typeof body === 'string') return body;
                if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) return body.toString();
                if (typeof Request !== 'undefined' && body instanceof Request) {
                    try {
                        return await body.text();
                    } catch (e) {
                        return '';
                    }
                }
                if (typeof Blob !== 'undefined' && body instanceof Blob) {
                    try {
                        return await body.text();
                    } catch (e) {
                        return '';
                    }
                }
                if (body instanceof ArrayBuffer) {
                    try {
                        return new TextDecoder().decode(new Uint8Array(body));
                    } catch (e) {
                        return '';
                    }
                }
                if (ArrayBuffer.isView(body)) {
                    try {
                        return new TextDecoder().decode(body);
                    } catch (e) {
                        return '';
                    }
                }
                return '';
            },
            getElementDescriptor(element) {
                if (!element) return '(null)';
                const tag = element.tagName?.toLowerCase() || 'unknown';
                const id = element.id ? `#${element.id}` : '';
                const classes = typeof element.className === 'string'
                    ? element.className.trim().split(/\s+/).filter(Boolean).slice(0, 3).join('.')
                    : '';
                return `${tag}${id}${classes ? `.${classes}` : ''}`;
            },
            getHeaderValue(headers, name) {
                if (!headers || !name) return '';
                const lowerName = String(name).toLowerCase();
                try {
                    if (typeof Headers !== 'undefined' && headers instanceof Headers) {
                        return headers.get(name) || headers.get(lowerName) || '';
                    }
                } catch (e) { }
                if (Array.isArray(headers)) {
                    const entry = headers.find(([key]) => String(key).toLowerCase() === lowerName);
                    return entry?.[1] || '';
                }
                if (typeof headers === 'object') {
                    const key = Object.keys(headers).find((k) => String(k).toLowerCase() === lowerName);
                    return key ? headers[key] : '';
                }
                return '';
            },
            isLikelyAssetPayload(body, contentType = '') {
                const bodyType = this.getBodyType(body);
                const ct = String(contentType || '').toLowerCase();
                if (ct.includes('multipart/form-data') || ct.includes('application/octet-stream')) return true;
                if (typeof FormData !== 'undefined' && body instanceof FormData) {
                    try {
                        for (const value of body.values()) {
                            if ((typeof File !== 'undefined' && value instanceof File)
                                || (typeof Blob !== 'undefined' && value instanceof Blob)) {
                                return true;
                            }
                        }
                    } catch (e) {
                        return true;
                    }
                }
                if (typeof Blob !== 'undefined' && body instanceof Blob) return true;
                if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) return true;
                if (typeof body === 'string') {
                    return body.includes('filename=') || body.includes('data:image/') || body.includes('data:application/');
                }
                if (bodyType === 'Request') return ct.includes('multipart/form-data');
                return false;
            },
            markOutboundAssetSignal(meta = {}) {
                AITabSync.state.lastOutboundAssetSignalAt = Date.now();
                AITabSync.state.lastOutboundAssetSignalMeta = meta;
                this.assetTrace('捕获到上传网络信号', {
                    at: AITabSync.state.lastOutboundAssetSignalAt,
                    ...meta,
                });
            },
            hasRecentOutboundAssetSignal(sinceTs = 0, maxAge = 5000) {
                const signalAt = AITabSync.state.lastOutboundAssetSignalAt || 0;
                if (!signalAt) return false;
                if (signalAt < sinceTs) return false;
                return Date.now() - signalAt <= maxAge;
            },
            async waitForOutboundAssetSignal(sinceTs = 0, timeout = 2800) {
                if (this.hasRecentOutboundAssetSignal(sinceTs, timeout + 300)) return true;
                const startedAt = Date.now();
                while (Date.now() - startedAt < timeout) {
                    await new Promise((resolve) => setTimeout(resolve, 120));
                    if (this.hasRecentOutboundAssetSignal(sinceTs, timeout + 300)) return true;
                }
                return false;
            },
            waitFor(conditionFn, timeout, description) {
                return new Promise((resolve, reject) => {
                    let result = conditionFn();
                    if (result) return resolve(result);
                    let timeoutId = null;
                    const observer = new MutationObserver(() => {
                        result = conditionFn();
                        if (result) {
                            if (timeoutId) clearTimeout(timeoutId);
                            observer.disconnect();
                            resolve(result);
                        }
                    });
                    observer.observe(document.documentElement, {
                        childList: true,
                        subtree: true,
                        attributes: true,
                    });
                    timeoutId = setTimeout(() => {
                        observer.disconnect();
                        const lastResult = conditionFn();
                        lastResult ? resolve(lastResult) : reject(new Error(`waitFor timed out after ${timeout}ms for: ${description}`));
                    }, timeout);
                });
            },
            deepQuerySelector(selector, root = document) {
                try {
                    const el = root.querySelector(selector);
                    if (el) return el;
                } catch (e) { }
                for (const host of root.querySelectorAll('*')) {
                    if (host.shadowRoot) {
                        const found = AITabSync.utils.deepQuerySelector(selector, host.shadowRoot);
                        if (found) return found;
                    }
                }
                return null;
            },
            deepQuerySelectorAll(selector, root = document, results = []) {
                try {
                    results.push(...root.querySelectorAll(selector));
                } catch (e) { }
                for (const host of root.querySelectorAll('*')) {
                    if (host.shadowRoot) {
                        AITabSync.utils.deepQuerySelectorAll(selector, host.shadowRoot, results);
                    }
                }
                return results;
            },
            isElementVisible(el) {
                if (!el) return false;
                const rect = el.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            },
            scoreInputCandidate(el) {
                if (!el) return -Infinity;
                let score = 0;
                const isActive = el === document.activeElement;
                if (isActive) score += 120;
                if (this.isElementVisible(el)) score += 60;

                const rect = el.getBoundingClientRect();
                const inViewport = rect.width > 0
                    && rect.height > 0
                    && rect.bottom > 0
                    && rect.right > 0
                    && rect.top < window.innerHeight
                    && rect.left < window.innerWidth;
                if (inViewport) score += 35;

                const role = String(el.getAttribute('role') || '').toLowerCase();
                const contenteditable = String(el.getAttribute('contenteditable') || '').toLowerCase();
                if (el.tagName === 'TEXTAREA') score += 12;
                if (contenteditable === 'true' || el.isContentEditable) score += 10;
                if (role === 'textbox') score += 10;

                const container = el.closest('form,[role="form"],footer,main,section,[class*="composer"],[class*="input"],[class*="chat"]');
                if (container) {
                    score += 8;
                    const sendButton = container.querySelector('button[aria-label*="发送"],button[aria-label*="Send"],[data-testid*="send"],button[type="submit"]');
                    const uploadButton = container.querySelector('button[aria-label*="上传"],button[aria-label*="Upload"],button[aria-label*="附件"],button[aria-label*="Attach"],input[type="file"]');
                    if (sendButton) score += 15;
                    if (uploadButton) score += 10;
                }
                return score;
            },
            findBestInputArea(site) {
                const candidates = site.inputSelectors
                    .flatMap((selector) => AITabSync.utils.deepQuerySelectorAll(selector))
                    .filter((el) => !el.disabled && !el.readOnly);
                const uniqueCandidates = [...new Set(candidates)];
                if (uniqueCandidates.length === 0) return null;
                const scored = uniqueCandidates
                    .map((el) => ({ el, score: this.scoreInputCandidate(el) }))
                    .sort((a, b) => b.score - a.score);
                return scored[0]?.el || null;
            },
            getCurrentSiteInfo() {
                const { SITES } = AITabSync.config;
                const currentHost = window.location.hostname;
                if (currentHost.includes('chatgpt.com')) return SITES.CHATGPT;
                for (const siteKey in SITES) {
                    if (Object.prototype.hasOwnProperty.call(SITES, siteKey) && currentHost.includes(SITES[siteKey].host)) return SITES[siteKey];
                }
                return null;
            },
            getScriptIconDataUrl() {
                const iconFromGMInfo = typeof GM_info !== 'undefined'
                    ? GM_info?.script?.icon
                    : null;
                if (typeof iconFromGMInfo === 'string' && iconFromGMInfo.startsWith('data:image/')) {
                    return iconFromGMInfo;
                }
                return AITabSync.config.FALLBACK_ICON_DATA_URL;
            },
            simulateInput(element, value) {
                element.focus();
                const siteId = AITabSync.state.thisSite?.id;
                if (siteId === 'QWEN' && element.tagName === 'TEXTAREA') {
                    const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                    valueSetter.call(element, '');
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    let inserted = false;
                    try {
                        inserted = !!document.execCommand && document.execCommand('insertText', false, value);
                    } catch (e) { }
                    if (!inserted) {
                        try {
                            const dt = new DataTransfer();
                            dt.setData('text/plain', value);
                            element.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
                            inserted = true;
                        } catch (e) { }
                    }
                    if (!inserted) {
                        valueSetter.call(element, value);
                        element.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: value }));
                    }
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                } else if (siteId === 'GROK') {
                    const dt = new DataTransfer();
                    dt.setData('text/plain', value);
                    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
                } else if (siteId === 'KIMI') {
                    element.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, composed: true, inputType: 'insertText', data: value }));
                } else if (element.isContentEditable || element.contentEditable === 'true') {
                    if (siteId === 'TONGYI') {
                        element.innerHTML = '';
                        element.focus();
                        const selection = window.getSelection();
                        const range = document.createRange();
                        range.selectNodeContents(element);
                        selection.removeAllRanges();
                        selection.addRange(range);
                        const dt = new DataTransfer();
                        dt.setData('text/plain', value);
                        element.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
                    } else if (siteId === 'CLAUDE') {
                        element.innerHTML = '';
                        const p = document.createElement('p');
                        p.textContent = value;
                        element.appendChild(p);
                    } else {
                        element.textContent = value;
                    }
                    element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                } else if (element.tagName === 'TEXTAREA') {
                    const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                    valueSetter.call(element, value);
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                }
            },
            async fileToDataUrl(file) {
                return await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => reject(reader.error || new Error('读取文件失败'));
                    reader.readAsDataURL(file);
                });
            },
            dataUrlToBlob(dataUrl) {
                const parts = String(dataUrl || '').split(',');
                if (parts.length < 2) throw new Error('非法 DataURL');
                const mimeMatch = parts[0].match(/data:(.*?);base64/);
                const mimeType = mimeMatch?.[1] || 'application/octet-stream';
                const byteChars = atob(parts[1]);
                const byteNumbers = new Array(byteChars.length);
                for (let i = 0; i < byteChars.length; i++) {
                    byteNumbers[i] = byteChars.charCodeAt(i);
                }
                return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
            },
            createFileFromAsset(asset) {
                const blob = this.dataUrlToBlob(asset.dataUrl);
                const fileName = asset.name || `sync-file-${Date.now()}`;
                return new File([blob], fileName, {
                    type: asset.mimeType || blob.type || 'application/octet-stream',
                    lastModified: Date.now()
                });
            },
            makeDataUrlFingerprint(dataUrl) {
                const content = String(dataUrl || '');
                if (!content) return '';
                const length = content.length;
                const head = content.slice(0, 2048);
                const tail = length > 2048 ? content.slice(-2048) : '';
                const sample = `${length}|${head}|${tail}`;
                let hash = 5381;
                for (let index = 0; index < sample.length; index++) {
                    hash = ((hash << 5) + hash) ^ sample.charCodeAt(index);
                }
                return `${length}:${(hash >>> 0).toString(16)}`;
            },
            gcMapByAge(map, ttl) {
                if (!(map instanceof Map) || map.size === 0) return;
                const now = Date.now();
                for (const [key, ts] of map.entries()) {
                    if (now - ts > ttl) map.delete(key);
                }
            },
            takeAssetDomSnapshot(anchor = null) {
                const root = anchor?.closest('form,[role="form"],main,section') || document;
                const attachmentSelectors = [
                    'img[src^="blob:"]',
                    'img[src^="data:"]',
                    '[data-testid*="attachment"]',
                    '[data-testid*="upload"]',
                    '[class*="attachment"]',
                    '[class*="upload"]',
                    'a[href^="blob:"]',
                ];
                const attachmentCount = attachmentSelectors.reduce((count, selector) => {
                    return count + this.deepQuerySelectorAll(selector, root).length;
                }, 0);
                const fileInputFilledCount = this.deepQuerySelectorAll('input[type="file"]', root)
                    .filter((input) => input?.files && input.files.length > 0).length;
                return {
                    attachmentCount,
                    fileInputFilledCount,
                };
            },
            isAssetLikelyAttached(beforeSnapshot, afterSnapshot) {
                if (!afterSnapshot) return false;
                const beforeAttachmentCount = beforeSnapshot?.attachmentCount || 0;
                const beforeFileInputFilledCount = beforeSnapshot?.fileInputFilledCount || 0;
                return afterSnapshot.attachmentCount > beforeAttachmentCount
                    || afterSnapshot.fileInputFilledCount > beforeFileInputFilledCount;
            },
            dispatchDropWithFile(target, file) {
                const dt = new DataTransfer();
                dt.items.add(file);
                let dropEvent = null;
                try {
                    dropEvent = new DragEvent('drop', {
                        dataTransfer: dt,
                        bubbles: true,
                        cancelable: true,
                    });
                } catch (error) {
                    dropEvent = new Event('drop', { bubbles: true, cancelable: true });
                    Object.defineProperty(dropEvent, 'dataTransfer', {
                        value: dt,
                        configurable: true,
                    });
                }
                target.dispatchEvent(dropEvent);
            },
            dispatchPasteWithFile(target, file) {
                const dt = new DataTransfer();
                dt.items.add(file);
                let pasteEvent = null;
                try {
                    pasteEvent = new ClipboardEvent('paste', {
                        clipboardData: dt,
                        bubbles: true,
                        cancelable: true,
                    });
                } catch (error) {
                    pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
                    Object.defineProperty(pasteEvent, 'clipboardData', {
                        value: dt,
                        configurable: true,
                    });
                }
                target.dispatchEvent(pasteEvent);
            },
            getRecommendedAssetSiteStrategies() {
                const { config } = AITabSync;
                const strategies = config.DISPLAY_ORDER.reduce((acc, siteId) => {
                    acc[siteId] = 'paste';
                    return acc;
                }, {});

                const recommended = config.ASSET_SITE_STRATEGY_RECOMMENDED || {};
                Object.keys(recommended).forEach((siteId) => {
                    const strategy = recommended[siteId];
                    if ((strategy === 'drop' || strategy === 'paste') && Object.prototype.hasOwnProperty.call(strategies, siteId)) {
                        strategies[siteId] = strategy;
                    }
                });

                return strategies;
            },
        },

        // --- 5. UI Module (CSP Safe) ---
        ui: {
            injectStyle() {
                GM_addStyle(`
                    :root {
                        --ai-g-blue: #1a73e8;
                        --ai-g-red: #ea4335;
                        --ai-g-yellow: #fbbc04;
                        --ai-g-green: #34a853;
                    }
                    @keyframes ae-fg {
                        0% { opacity: 0; }
                        30% { opacity: 1; }
                        50% { opacity: 1; }
                        100% { opacity: 0; }
                    }
                    @keyframes ae-rg {
                        from { transform: translate(-50%, -50%) rotate(0deg); }
                        to { transform: translate(-50%, -50%) rotate(180deg); }
                    }
                    @keyframes ai-breathe {
                        0%, 100% { opacity: 0.35; }
                        50% { opacity: 0.6; }
                    }
                    @keyframes ai-spin-sending {
                        from { transform: translate(-50%, -50%) rotate(0deg); }
                        to { transform: translate(-50%, -50%) rotate(360deg); }
                    }
                    @property --ai-border-angle {
                        syntax: '<angle>';
                        initial-value: 0deg;
                        inherits: false;
                    }
                    @keyframes ai-border-rotate-once {
                        0% { --ai-border-angle: 0deg; opacity: 1; }
                        85% { opacity: 1; }
                        100% { --ai-border-angle: 360deg; opacity: 0; }
                    }
                    @keyframes ae-zoom-in {
                        from { transform: scale(0.92); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }
                    @keyframes ai-spin-slow-infinite {
                        from { transform: translate(-50%, -50%) rotate(0deg); }
                        to { transform: translate(-50%, -50%) rotate(360deg); }
                    }
                    #ai-sync-container {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        z-index: 99998;
                        display: flex;
                        align-items: flex-end;
                        gap: 12px;
                        pointer-events: none;
                        font-family: sans-serif;
                    }
                    #ai-sync-container.expanded {
                        pointer-events: auto;
                    }
                    #ai-sync-toggle-fab {
                        position: relative;
                        width: 44px;
                        height: 44px;
                        border-radius: 50%;
                        background: transparent;
                        border: none;
                        cursor: pointer;
                        padding: 0;
                        pointer-events: auto;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
                        transition: transform 0.2s, box-shadow 0.2s;
                        overflow: visible;
                        --mouse-angle: 180deg;
                    }
                    #ai-sync-toggle-fab:hover {
                        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
                        transform: scale(1.08);
                    }
                    .ai-visual-clipper {
                        position: absolute;
                        inset: 0;
                        border-radius: 50%;
                        overflow: hidden;
                        z-index: 0;
                    }
                    .ai-gradient-layer {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        width: 200%;
                        height: 200%;
                        background: conic-gradient(#3186ff00 0deg, #34a853 43deg, #ffd314 65deg, #ff4641 105deg, #3186ff 144deg, #3186ff 180deg, #3186ff00 324deg);
                        transform: translate(-50%, -50%) rotate(var(--mouse-angle));
                        opacity: 0;
                        pointer-events: none;
                        transition: opacity 400ms linear, transform 0.1s linear;
                    }
                    .ai-layer-blur {
                        filter: blur(2px);
                        opacity: 0;
                    }
                    .ai-layer-sharp {
                        filter: blur(0px);
                        opacity: 0;
                    }
                    #ai-sync-toggle-fab.intro-playing.animation-aurora .ai-gradient-layer {
                        animation: ae-fg 2000ms linear backwards, ae-rg 2000ms cubic-bezier(0.20, 0.00, 0.00, 1.00) backwards;
                    }
                    #ai-sync-toggle-fab.intro-playing.animation-spin .ai-gradient-layer {
                        opacity: 0.5;
                        animation: ai-spin-slow-infinite 8s linear infinite;
                    }
                    #ai-sync-toggle-fab:not(.intro-playing):hover .ai-layer-blur {
                        opacity: 0.35;
                        animation: ai-breathe 3s infinite alternate;
                    }
                    #ai-sync-toggle-fab:not(.intro-playing):hover .ai-layer-sharp {
                        opacity: 1;
                    }
                    #ai-sync-toggle-fab.sending .ai-gradient-layer,
                    #ai-sync-toggle-fab.sending:hover .ai-gradient-layer {
                        opacity: 1 !important;
                        animation: ai-spin-sending 1s linear infinite !important;
                        transition: opacity 0.2s;
                    }
                    .ai-inner-mask {
                        position: absolute;
                        inset: 2px;
                        background: #fff;
                        border-radius: 50%;
                        z-index: 1;
                        transition: filter 1s cubic-bezier(0,0,0,1);
                    }
                    .ai-inner-mask::after {
                        content: '';
                        position: absolute;
                        inset: -1px;
                        border-radius: 50%;
                        border: 1px solid #dadce0;
                        transition: opacity 0.2s;
                    }
                    #ai-sync-toggle-fab:hover .ai-inner-mask::after,
                    #ai-sync-toggle-fab.sending .ai-inner-mask::after {
                        opacity: 0;
                    }
                    .ai-icon-wrapper {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        z-index: 2;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 24px;
                        height: 24px;
                    }
                    .ai-icon-wrapper svg {
                        width: 100%;
                        height: 100%;
                        color: #5f6368;
                        transition: color 0.3s;
                    }
                    #ai-sync-toggle-fab:hover svg,
                    #ai-sync-toggle-fab.sending svg {
                        color: var(--ai-g-blue);
                    }
                    .ai-sync-fab-badge {
                        all: initial;
                        position: absolute;
                        top: -4px;
                        right: -4px;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        box-sizing: border-box;
                        background: linear-gradient(135deg, #00c6ff, #0072ff);
                        color: #fff;
                        border-radius: 999px;
                        padding: 0 5px;
                        height: 16px;
                        min-width: 16px;
                        line-height: 1;
                        font: 700 10px/1 sans-serif;
                        font-variant-numeric: tabular-nums;
                        letter-spacing: 0;
                        text-align: center;
                        white-space: nowrap;
                        user-select: none;
                        z-index: 10;
                        border: 2px solid #fff;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.25);
                    }
                    .ai-sync-fab-badge.single-digit {
                        width: 18px;
                        min-width: 18px;
                        height: 18px;
                        padding: 0;
                        border-radius: 50%;
                    }
                    #ai-sync-content-panel {
                        display: inline-block;
                        background: rgba(255,255,255,0.98);
                        backdrop-filter: blur(12px);
                        border: 1px solid #dadce0;
                        border-radius: 16px;
                        padding: 12px 16px;
                        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
                        opacity: 0;
                        transform: translateX(15px);
                        visibility: hidden;
                        margin-bottom: 4px;
                        transition: all 0.2s;
                        position: relative;
                        z-index: 1;
                    }
                    #ai-sync-container.expanded #ai-sync-content-panel {
                        opacity: 1;
                        transform: translateX(0);
                        visibility: visible;
                        border-color: transparent;
                    }
                    #ai-sync-container.expanded #ai-sync-content-panel::before {
                        content: "";
                        position: absolute;
                        inset: 0;
                        border-radius: 16px;
                        padding: 2px;
                        background: conic-gradient(from var(--ai-border-angle), transparent 0%, transparent 60%, var(--ai-g-blue) 80%, var(--ai-g-red) 86%, var(--ai-g-yellow) 92%, var(--ai-g-green) 98%, transparent 100%);
                        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                        -webkit-mask-composite: xor;
                        mask-composite: exclude;
                        animation: ai-border-rotate-once 0.8s linear forwards;
                        pointer-events: none;
                        z-index: 10;
                    }
                    #ai-sync-panel-title-wrapper {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 12px;
                        padding-bottom: 8px;
                        border-bottom: 1px solid #f1f3f4;
                    }
                    #ai-sync-panel-title {
                        font-weight: 600;
                        font-size: 15px;
                        color: #202124;
                        flex-grow: 1;
                    }
                    #ai-sync-select-all-btn,
                    #ai-sync-settings-btn {
                        all: unset;
                        cursor: pointer;
                        color: #5f6368;
                        padding: 4px;
                        border-radius: 50%;
                        transition: background 0.2s, color 0.2s;
                        display: flex;
                        flex-shrink: 0;
                    }
                    #ai-sync-select-all-btn:hover,
                    #ai-sync-settings-btn:hover {
                        color: #202124;
                        background-color: #f1f3f4;
                    }
                    #ai-sync-chips-container {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                        max-width: 260px;
                    }
                    #ai-sync-chips-container > i {
                        flex-grow: 1;
                    }
                    .ai-sync-chip {
                        all: unset;
                        box-sizing: border-box;
                        cursor: pointer;
                        padding: 6px 12px;
                        border-radius: 8px;
                        font-size: 13px;
                        font-weight: 500;
                        border: 1px solid #dadce0;
                        color: #5f6368;
                        background-color: #fff;
                        transition: all 0.2s ease;
                        flex-grow: 1;
                        text-align: center;
                    }
                    .ai-sync-chip:hover {
                        background-color: #f8f9fa;
                        border-color: #dadce0;
                        color: #202124;
                    }
                    .ai-sync-chip.online {
                        border-color: var(--ai-g-blue);
                        color: var(--ai-g-blue);
                        background: #f1f8ff;
                    }
                    .ai-sync-chip.selected {
                        background-color: var(--ai-g-blue);
                        border-color: var(--ai-g-blue);
                        color: white;
                        box-shadow: 0 1px 2px rgba(26,115,232,0.3);
                    }
                    #ai-sync-settings-overlay {
                        display: none;
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100vw;
                        height: 100vh;
                        background: rgba(0,0,0,0.5);
                        backdrop-filter: blur(4px);
                        z-index: 99999;
                        justify-content: center;
                        align-items: center;
                    }
                    #ai-sync-settings-panel {
                        background: #fff;
                        border-radius: 16px;
                        width: min(92vw, 680px);
                        max-height: min(88vh, 760px);
                        display: flex;
                        flex-direction: column;
                        box-shadow: 0 12px 40px rgba(0,0,0,0.2);
                        overflow: hidden;
                        animation: ae-zoom-in 0.2s ease-out;
                    }
                    .ai-sync-settings-header {
                        padding: 16px 20px;
                        border-bottom: 1px solid #f1f3f4;
                        background: #fff;
                        flex-shrink: 0;
                    }
                    .ai-sync-settings-title {
                        margin: 0;
                        font-size: 18px;
                        font-weight: 600;
                        color: #202124;
                    }
                    .ai-sync-settings-list {
                        display: grid;
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        gap: 8px;
                        padding: 14px 16px;
                        background: #fff;
                        max-height: min(30vh, 250px);
                        overflow-y: auto;
                    }
                    .ai-sync-settings-item label {
                        display: flex;
                        align-items: center;
                        cursor: pointer;
                        font-size: 14px;
                        color: #3c4043;
                        padding: 8px 10px;
                        border-radius: 8px;
                        background-color: #f8f9fa;
                        transition: background 0.2s;
                        user-select: none;
                    }
                    .ai-sync-settings-item label:hover {
                        background-color: #e8f0fe;
                        color: #1967d2;
                    }
                    .ai-sync-settings-item input[type="checkbox"] {
                        appearance: none;
                        -webkit-appearance: none;
                        width: 20px;
                        height: 20px;
                        border: 2px solid #5f6368;
                        border-radius: 4px;
                        margin-right: 12px;
                        position: relative;
                        flex-shrink: 0;
                        transition: all 0.2s;
                        background: #fff;
                        cursor: pointer;
                    }
                    .ai-sync-settings-item input[type="checkbox"]:checked {
                        background-color: var(--ai-g-blue);
                        border-color: var(--ai-g-blue);
                    }
                    .ai-sync-settings-item input[type="checkbox"]:checked::after {
                        content: '';
                        position: absolute;
                        left: 6px;
                        top: 2px;
                        width: 5px;
                        height: 10px;
                        border: solid white;
                        border-width: 0 2px 2px 0;
                        transform: rotate(45deg);
                        display: block;
                    }
                    .ai-sync-settings-divider {
                        border: none;
                        height: 1px;
                        background-color: #f1f3f4;
                        margin: 0 20px;
                    }
                    .ai-sync-settings-uigroup {
                        padding: 10px 16px;
                        background: #fff;
                        flex-shrink: 0;
                    }
                    .ai-sync-settings-strategy-section {
                        padding: 12px 16px 16px;
                        background: #fff;
                        border-top: 1px solid #f1f3f4;
                        display: flex;
                        flex-direction: column;
                        min-height: 0;
                    }
                    .ai-sync-settings-strategy-title {
                        font-size: 13px;
                        font-weight: 600;
                        color: #3c4043;
                        margin-bottom: 10px;
                    }
                    .ai-sync-settings-strategy-actions {
                        display: flex;
                        justify-content: flex-end;
                        margin-bottom: 10px;
                    }
                    #ai-sync-apply-recommended-strategy-btn {
                        all: unset;
                        cursor: pointer;
                        font-size: 12px;
                        color: var(--ai-g-blue);
                        border: 1px solid #dadce0;
                        border-radius: 999px;
                        padding: 4px 10px;
                        background: #fff;
                        transition: background 0.2s, border-color 0.2s;
                    }
                    #ai-sync-apply-recommended-strategy-btn:hover {
                        background: #e8f0fe;
                        border-color: #c6dafc;
                    }
                    .ai-sync-settings-strategy-list {
                        display: grid;
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        gap: 10px;
                        max-height: min(34vh, 320px);
                        overflow-y: auto;
                        padding-right: 2px;
                    }
                    .ai-sync-settings-strategy-row {
                        display: flex;
                        flex-direction: column;
                        align-items: stretch;
                        gap: 6px;
                        background: #f8f9fa;
                        border-radius: 8px;
                        padding: 10px;
                        border: 1px solid #eceff1;
                    }
                    .ai-sync-settings-strategy-row span {
                        font-size: 13px;
                        font-weight: 500;
                        color: #3c4043;
                    }
                    .ai-sync-site-injection-select {
                        border: 1px solid #dadce0;
                        border-radius: 6px;
                        padding: 4px 8px;
                        font-size: 12px;
                        color: #202124;
                        background: #fff;
                        width: 100%;
                    }
                    @media (max-width: 620px) {
                        #ai-sync-settings-panel {
                            width: min(96vw, 460px);
                        }
                        .ai-sync-settings-list,
                        .ai-sync-settings-strategy-list {
                            grid-template-columns: 1fr;
                        }
                    }
                    @media (max-height: 760px) {
                        #ai-sync-settings-panel {
                            max-height: 92vh;
                        }
                        .ai-sync-settings-list {
                            max-height: min(28vh, 220px);
                        }
                        .ai-sync-settings-strategy-list {
                            max-height: min(32vh, 280px);
                        }
                    }
                    .ai-sync-settings-toggle {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .ai-sync-settings-toggle > span {
                        font-size: 14px;
                        color: #3c4043;
                        cursor: default;
                    }
                    .toggle-switch {
                        position: relative;
                        display: inline-block;
                        width: 38px;
                        height: 22px;
                    }
                    .toggle-switch input {
                        opacity: 0;
                        width: 0;
                        height: 0;
                    }
                    .toggle-switch-track {
                        position: absolute;
                        cursor: pointer;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: #ccc;
                        transition: .4s;
                        border-radius: 22px;
                    }
                    .toggle-switch-thumb {
                        position: absolute;
                        content: '';
                        height: 18px;
                        width: 18px;
                        left: 2px;
                        bottom: 2px;
                        background-color: white;
                        transition: .4s;
                        border-radius: 50%;
                    }
                    input:checked + .toggle-switch-track {
                        background-color: var(--ai-g-blue);
                    }
                    input:checked + .toggle-switch-track .toggle-switch-thumb {
                        transform: translateX(16px);
                    }
                    #ai-sync-custom-tooltip {
                        display: none;
                        position: fixed;
                        background: rgba(32,33,36,0.9);
                        color: #fff;
                        padding: 6px 10px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: 500;
                        z-index: 100000;
                        pointer-events: none;
                        transform: translate(-50%, -100%);
                        margin-top: -8px;
                        white-space: nowrap;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
                    }
                `);
            },
            createMainPanel() {
                if (document.getElementById('ai-sync-container')) return;
                const { elements } = AITabSync;
                const svgNS = 'http://www.w3.org/2000/svg';
                elements.container = document.createElement('div');
                elements.container.id = 'ai-sync-container';
                const panel = document.createElement('div');
                panel.id = 'ai-sync-content-panel';
                const titleWrapper = document.createElement('div');
                titleWrapper.id = 'ai-sync-panel-title-wrapper';
                const title = document.createElement('span');
                title.id = 'ai-sync-panel-title';
                title.textContent = '发送给:';
                titleWrapper.appendChild(title);
                const selectAllBtn = document.createElement('button');
                selectAllBtn.id = 'ai-sync-select-all-btn';
                selectAllBtn.title = '全选';
                const saSvg = document.createElementNS(svgNS, 'svg');
                saSvg.setAttribute('width', '20');
                saSvg.setAttribute('height', '20');
                saSvg.setAttribute('viewBox', '0 0 24 24');
                saSvg.setAttribute('fill', 'currentColor');
                const saPath = document.createElementNS(svgNS, 'path');
                saPath.setAttribute('d', 'M3 14h4v-4H3v4zm0 5h4v-4H3v4zM3 9h4V5H3v4zm5-4v4h13V5H8zm0 5h13v-4H8v4zm0 5h13v-4H8v4z');
                saSvg.appendChild(saPath);
                selectAllBtn.appendChild(saSvg);
                titleWrapper.appendChild(selectAllBtn);
                const settingsBtn = document.createElement('button');
                settingsBtn.id = 'ai-sync-settings-btn';
                settingsBtn.title = '自定义常用模型';
                const setSvg = document.createElementNS(svgNS, 'svg');
                setSvg.setAttribute('width', '20');
                setSvg.setAttribute('height', '20');
                setSvg.setAttribute('viewBox', '0 0 24 24');
                setSvg.setAttribute('fill', 'currentColor');
                const setPath = document.createElementNS(svgNS, 'path');
                setPath.setAttribute('d', 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.58 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z');
                setSvg.appendChild(setPath);
                settingsBtn.appendChild(setSvg);
                titleWrapper.appendChild(settingsBtn);
                panel.appendChild(titleWrapper);
                elements.chipsContainer = this.buildChipsContainer();
                panel.appendChild(elements.chipsContainer);
                elements.fab = document.createElement('button');
                elements.fab.id = 'ai-sync-toggle-fab';
                elements.fab.title = 'AI 对话助手';
                elements.fab.classList.add('intro-playing');
                const clipper = document.createElement('div');
                clipper.className = 'ai-visual-clipper';
                const blurLayer = document.createElement('div');
                blurLayer.className = 'ai-gradient-layer ai-layer-blur';
                const sharpLayer = document.createElement('div');
                sharpLayer.className = 'ai-gradient-layer ai-layer-sharp';
                const innerMask = document.createElement('div');
                innerMask.className = 'ai-inner-mask';
                const iconWrapper = document.createElement('div');
                iconWrapper.className = 'ai-icon-wrapper';
                const fabIcon = document.createElement('img');
                fabIcon.src = AITabSync.utils.getScriptIconDataUrl();
                fabIcon.alt = 'AI Sync';
                fabIcon.width = 22;
                fabIcon.height = 22;
                fabIcon.decoding = 'async';
                fabIcon.style.display = 'block';
                fabIcon.style.width = '22px';
                fabIcon.style.height = '22px';
                fabIcon.style.borderRadius = '4px';
                fabIcon.addEventListener('error', () => {
                    if (fabIcon.src !== AITabSync.config.FALLBACK_ICON_DATA_URL) {
                        fabIcon.src = AITabSync.config.FALLBACK_ICON_DATA_URL;
                    }
                }, { once: true });
                iconWrapper.appendChild(fabIcon);
                clipper.appendChild(blurLayer);
                clipper.appendChild(sharpLayer);
                clipper.appendChild(innerMask);
                clipper.appendChild(iconWrapper);
                elements.fab.appendChild(clipper);
                const updateAngle = (e) => {
                    const rect = elements.fab.getBoundingClientRect();
                    const angle = Math.atan2(e.clientY - (rect.top + rect.height / 2), e.clientX - (rect.left + rect.width / 2)) * (180 / Math.PI) + 180;
                    elements.fab.style.setProperty('--mouse-angle', `${angle}deg`);
                };
                elements.fab.addEventListener('mousemove', updateAngle);
                elements.fab.addEventListener('mouseenter', (e) => {
                    elements.fab.classList.remove('intro-playing');
                    updateAngle(e);
                });
                elements.fab.addEventListener('mouseleave', () => {
                    if (AITabSync.state.animationStyle === 'spin') {
                        AITabSync.elements.fab.classList.add('intro-playing');
                    }
                });
                elements.container.appendChild(panel);
                elements.container.appendChild(elements.fab);
                document.body.appendChild(elements.container);
            },
            createSettingsModal() {
                if (document.getElementById('ai-sync-settings-overlay')) return;
                const { config, state } = AITabSync;
                const overlay = document.createElement('div');
                overlay.id = 'ai-sync-settings-overlay';
                const panel = document.createElement('div');
                panel.id = 'ai-sync-settings-panel';
                const header = document.createElement('div');
                header.className = 'ai-sync-settings-header';
                const title = document.createElement('h2');
                title.className = 'ai-sync-settings-title';
                title.textContent = '自定义常用模型';
                header.appendChild(title);
                panel.appendChild(header);
                const list = document.createElement('div');
                list.className = 'ai-sync-settings-list';
                config.DISPLAY_ORDER.forEach((siteId) => {
                    const site = config.SITES[siteId];
                    if (!site) return;
                    const item = document.createElement('div');
                    item.className = 'ai-sync-settings-item';
                    const label = document.createElement('label');
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.value = siteId;
                    checkbox.checked = state.visibleTargets.includes(siteId);
                    label.appendChild(checkbox);
                    label.appendChild(document.createTextNode(site.name));
                    item.appendChild(label);
                    list.appendChild(item);
                });
                panel.appendChild(list);
                const divider = document.createElement('hr');
                divider.className = 'ai-sync-settings-divider';
                panel.appendChild(divider);
                const uiGroup = document.createElement('div');
                uiGroup.className = 'ai-sync-settings-uigroup';
                const toggleContainer = document.createElement('div');
                toggleContainer.className = 'ai-sync-settings-toggle';
                const animLabel = document.createElement('span');
                animLabel.textContent = '启用持续旋转动画';
                toggleContainer.appendChild(animLabel);
                const switchLabel = document.createElement('label');
                switchLabel.className = 'toggle-switch';
                const switchInput = document.createElement('input');
                switchInput.type = 'checkbox';
                switchInput.id = 'ai-sync-animation-toggle';
                switchInput.checked = state.animationStyle === 'spin';
                const switchTrack = document.createElement('div');
                switchTrack.className = 'toggle-switch-track';
                const switchThumb = document.createElement('div');
                switchThumb.className = 'toggle-switch-thumb';
                switchTrack.appendChild(switchThumb);
                switchLabel.appendChild(switchInput);
                switchLabel.appendChild(switchTrack);
                toggleContainer.appendChild(switchLabel);
                uiGroup.appendChild(toggleContainer);
                panel.appendChild(uiGroup);
                const uiGroupSync = document.createElement('div');
                uiGroupSync.className = 'ai-sync-settings-uigroup';
                const toggleContainerSync = document.createElement('div');
                toggleContainerSync.className = 'ai-sync-settings-toggle';
                const syncLabel = document.createElement('span');
                syncLabel.textContent = '同步选择状态';
                toggleContainerSync.appendChild(syncLabel);
                const switchLabelSync = document.createElement('label');
                switchLabelSync.className = 'toggle-switch';
                const switchInputSync = document.createElement('input');
                switchInputSync.type = 'checkbox';
                switchInputSync.id = 'ai-sync-selection-sync-toggle';
                switchInputSync.checked = state.isSelectionSynced;
                const switchTrackSync = document.createElement('div');
                switchTrackSync.className = 'toggle-switch-track';
                const switchThumbSync = document.createElement('div');
                switchThumbSync.className = 'toggle-switch-thumb';
                switchTrackSync.appendChild(switchThumbSync);
                switchLabelSync.appendChild(switchInputSync);
                switchLabelSync.appendChild(switchTrackSync);
                toggleContainerSync.appendChild(switchLabelSync);
                uiGroupSync.appendChild(toggleContainerSync);
                panel.appendChild(uiGroupSync);

                const strategySection = document.createElement('div');
                strategySection.className = 'ai-sync-settings-strategy-section';
                const strategyTitle = document.createElement('div');
                strategyTitle.className = 'ai-sync-settings-strategy-title';
                strategyTitle.textContent = '站点注入策略（资产）';
                strategySection.appendChild(strategyTitle);

                const strategyActions = document.createElement('div');
                strategyActions.className = 'ai-sync-settings-strategy-actions';
                const applyRecommendedBtn = document.createElement('button');
                applyRecommendedBtn.id = 'ai-sync-apply-recommended-strategy-btn';
                applyRecommendedBtn.type = 'button';
                applyRecommendedBtn.textContent = '应用推荐注入策略';
                strategyActions.appendChild(applyRecommendedBtn);
                strategySection.appendChild(strategyActions);

                const strategyList = document.createElement('div');
                strategyList.className = 'ai-sync-settings-strategy-list';
                config.DISPLAY_ORDER.forEach((siteId) => {
                    const site = config.SITES[siteId];
                    if (!site) return;
                    const row = document.createElement('div');
                    row.className = 'ai-sync-settings-strategy-row';
                    const siteName = document.createElement('span');
                    siteName.textContent = site.name;
                    const select = document.createElement('select');
                    select.className = 'ai-sync-site-injection-select';
                    select.dataset.siteId = siteId;
                    const strategy = state.assetSiteInjectionStrategies?.[siteId] === 'paste' ? 'paste' : 'drop';

                    const optionDrop = document.createElement('option');
                    optionDrop.value = 'drop';
                    optionDrop.textContent = '拖拽 (drop)';
                    const optionPaste = document.createElement('option');
                    optionPaste.value = 'paste';
                    optionPaste.textContent = '粘贴 (paste)';
                    select.appendChild(optionDrop);
                    select.appendChild(optionPaste);
                    select.value = strategy;

                    row.appendChild(siteName);
                    row.appendChild(select);
                    strategyList.appendChild(row);
                });
                strategySection.appendChild(strategyList);
                panel.appendChild(strategySection);

                overlay.appendChild(panel);
                document.body.appendChild(overlay);
                AITabSync.elements.settingsModal = overlay;
            },
            createTooltip() {
                if (document.getElementById('ai-sync-custom-tooltip')) return;
                AITabSync.elements.tooltip = document.createElement('div');
                AITabSync.elements.tooltip.id = 'ai-sync-custom-tooltip';
                document.body.appendChild(AITabSync.elements.tooltip);
            },
            buildChipsContainer() {
                const { config, state } = AITabSync;
                const container = document.createElement('div');
                container.id = 'ai-sync-chips-container';
                config.DISPLAY_ORDER.filter((id) => state.visibleTargets.includes(id) && id !== state.thisSite.id).forEach((siteId) => {
                    const site = config.SITES[siteId];
                    if (!site) return;
                    const chip = document.createElement('button');
                    chip.className = 'ai-sync-chip';
                    chip.dataset.siteId = site.id;
                    chip.textContent = site.name;
                    container.appendChild(chip);
                });
                container.appendChild(document.createElement('i'));
                container.appendChild(document.createElement('i'));
                return container;
            },
            async rebuildChipsUI() {
                const { elements } = AITabSync;
                const oldContainer = elements.chipsContainer || document.getElementById('ai-sync-chips-container');
                if (oldContainer && oldContainer.parentElement) {
                    const newContainer = this.buildChipsContainer();
                    oldContainer.parentElement.replaceChild(newContainer, oldContainer);
                    elements.chipsContainer = newContainer;
                    await this.updatePanelState();
                    this.updateSelectAllButtonState();
                }
            },
            async updatePanelState() {
                const activeTabs = JSON.parse(await GM_getValue(AITabSync.config.KEYS.ACTIVE_TABS, '{}'));
                document.querySelectorAll('.ai-sync-chip').forEach((chip) => {
                    const siteId = chip.dataset.siteId;
                    chip.classList.toggle('online', !!activeTabs[siteId]);
                    chip.classList.toggle('selected', AITabSync.state.selectedTargets.has(siteId));
                });
                this.updateFabBadge();
            },
            updateFabBadge() {
                const { fab } = AITabSync.elements;
                if (!fab) return;
                const targetsWithoutSelf = Array.from(AITabSync.state.selectedTargets).filter(id => id !== AITabSync.state.thisSite.id);
                const count = targetsWithoutSelf.length;
                let badge = fab.querySelector('.ai-sync-fab-badge');
                if (count > 0) {
                    if (!badge) {
                        badge = document.createElement('span');
                        badge.className = 'ai-sync-fab-badge';
                        fab.appendChild(badge);
                    }
                    badge.textContent = count;
                    badge.classList.toggle('single-digit', count < 10);
                } else {
                    badge?.remove();
                }
            },
            updateSelectAllButtonState() {
                const { state, config } = AITabSync;
                const btn = document.getElementById('ai-sync-select-all-btn');
                if (!btn) return;
                const visibleTargets = config.DISPLAY_ORDER.filter(id => state.visibleTargets.includes(id) && id !== state.thisSite.id);
                const allSelected = visibleTargets.length > 0 && visibleTargets.every(id => state.selectedTargets.has(id));
                btn.title = allSelected ? '全部取消' : '全选';
                btn.style.color = allSelected ? 'var(--ai-g-blue)' : '#5f6368';
            },
            syncSettingsModalState() {
                const { elements, state } = AITabSync;
                const modal = elements.settingsModal;
                if (!modal) return;

                modal.querySelectorAll('.ai-sync-settings-list input[type="checkbox"]').forEach((checkbox) => {
                    checkbox.checked = state.visibleTargets.includes(checkbox.value);
                });

                const animationToggle = modal.querySelector('#ai-sync-animation-toggle');
                if (animationToggle) {
                    animationToggle.checked = state.animationStyle === 'spin';
                }

                const selectionSyncToggle = modal.querySelector('#ai-sync-selection-sync-toggle');
                if (selectionSyncToggle) {
                    selectionSyncToggle.checked = !!state.isSelectionSynced;
                }

                modal.querySelectorAll('.ai-sync-site-injection-select').forEach((selectEl) => {
                    const siteId = selectEl?.dataset?.siteId;
                    if (!siteId) return;
                    selectEl.value = state.assetSiteInjectionStrategies?.[siteId] === 'paste' ? 'paste' : 'drop';
                });
            },
            togglePanelVisibility() {
                const { container } = AITabSync.elements;
                if (!container) return;
                container.classList.toggle('expanded');
                if (container.classList.contains('expanded')) {
                    this.updatePanelState();
                    this.updateSelectAllButtonState();
                    document.addEventListener('click', AITabSync.events.onClickOutside, true);
                } else {
                    document.removeEventListener('click', AITabSync.events.onClickOutside, true);
                }
            },
            updateMenuCommand() {
                const { state } = AITabSync;
                if (state.menuCommandId) GM_unregisterMenuCommand(state.menuCommandId);
                if (state.assetTraceMenuCommandId) GM_unregisterMenuCommand(state.assetTraceMenuCommandId);
                if (state.strictModeMenuCommandId) GM_unregisterMenuCommand(state.strictModeMenuCommandId);
                const label = state.isLoggingEnabled ? '停用调试日志' : '启用调试日志';
                state.menuCommandId = GM_registerMenuCommand(label, AITabSync.events.onToggleLogging);
                const assetLabel = state.isAssetTraceEnabled ? '停用资产链路日志' : '启用资产链路日志';
                state.assetTraceMenuCommandId = GM_registerMenuCommand(assetLabel, AITabSync.events.onToggleAssetTrace);
                const strictLabel = state.isStrictModeEnabled ? '停用严格模式' : '启用严格模式';
                state.strictModeMenuCommandId = GM_registerMenuCommand(strictLabel, AITabSync.events.onToggleStrictMode);
            },
        },

        // --- 6. Settings Sync ---
        settingsSync: {
            async applyVisibleTargets(targets, options) { return SettingsSyncModule.applyVisibleTargets(targets, options); },
            async applyAnimationStyle(style, options) { return SettingsSyncModule.applyAnimationStyle(style, options); },
            async applySelectionSyncEnabled(enabled, options) { return SettingsSyncModule.applySelectionSyncEnabled(enabled, options); },
            async applyAssetSiteInjectionStrategies(strategies, options) { return SettingsSyncModule.applyAssetSiteInjectionStrategies(strategies, options); },
            async applyRecommendedAssetSiteInjectionStrategies(options) { return SettingsSyncModule.applyRecommendedAssetSiteInjectionStrategies(options); },
            async applyLoggingEnabled(enabled, options) { return SettingsSyncModule.applyLoggingEnabled(enabled, options); },
            async applyAssetTraceEnabled(enabled, options) { return SettingsSyncModule.applyAssetTraceEnabled(enabled, options); },
            async applyStrictModeEnabled(enabled, options) { return SettingsSyncModule.applyStrictModeEnabled(enabled, options); },
        },

        // --- 7. Event Handlers ---
        events: {
            register() { return EventsModule.register(); },
            async onChipClick(event) { return EventsModule.onChipClick(event); },
            async onSelectAllClick() { return EventsModule.onSelectAllClick(); },
            async onSettingsChange(event) { return EventsModule.onSettingsChange(event); },
            async onAnimationToggleChange(event) { return EventsModule.onAnimationToggleChange(event); },
            async onSelectionSyncToggleChange(event) { return EventsModule.onSelectionSyncToggleChange(event); },
            async onSiteInjectionStrategyChange(event) { return EventsModule.onSiteInjectionStrategyChange(event); },
            async onApplyRecommendedSiteStrategies() { return EventsModule.onApplyRecommendedSiteStrategies(); },
            onClickOutside(event) { return EventsModule.onClickOutside(event); },
            onChipMouseOver(event) { return EventsModule.onChipMouseOver(event); },
            onChipMouseOut(event) { return EventsModule.onChipMouseOut(event); },
            async onToggleLogging() { return EventsModule.onToggleLogging(); },
            async onToggleAssetTrace() { return EventsModule.onToggleAssetTrace(); },
            async onToggleStrictMode() { return EventsModule.onToggleStrictMode(); },
        },

        // --- 8. Lifecycle & Background Tasks ---
        lifecycle: {
            ensureWindowName() { return LifecycleModule.ensureWindowName(); },
            deployHistoryInterceptor() { return LifecycleModule.deployHistoryInterceptor(); },
            async registerTabAsActive() { return LifecycleModule.registerTabAsActive(); },
            async unregisterTabAsInactive() { return LifecycleModule.unregisterTabAsInactive(); },
            async cleanupStaleTabs() { return LifecycleModule.cleanupStaleTabs(); },
        },

        // --- 9. Communication Module (IIFE 装配层) ---
        comms: {
            deployNetworkInterceptor() { return QuerySyncModule.deployNetworkInterceptor(); },
            deployLocalSendFallback() { return QuerySyncModule.deployLocalSendFallback(); },
            deployAssetSyncListeners() { return AssetSyncModule.deployAssetSyncListeners(); },
            async handleAssetFound(assets, sourceSite, targets) { return AssetSyncModule.handleAssetFound(assets, sourceSite, targets); },
            async processSharedAsset(value) { return AssetSyncModule.processSharedAsset(value); },
            async processAssetSubmission(site, asset) { return AssetSyncModule.processAssetSubmission(site, asset); },
            async handleQueryFound(query, sourceSite) { return QuerySyncModule.handleQueryFound(query, sourceSite); },
            async processSharedQuery(value) { return QuerySyncModule.processSharedQuery(value); },
            async processSubmission(site, query) { return QuerySyncModule.processSubmission(site, query); },
            async initReceiver() {
                // 关键顺序：先挂 Query 再挂 Asset，确保文本链路优先可用。
                await QuerySyncModule.initReceiver();
                await AssetSyncModule.initReceiver();
            },
        },

        // --- 10. Main Application Logic ---
        main: {
            async loadInitialState() { return MainModule.loadInitialState(); },
            registerGMListeners() { return MainModule.registerGMListeners(); },
            startBackgroundTasks() { return MainModule.startBackgroundTasks(); },
            initEarly() { return MainModule.initEarly(); },
            async initDOMReady() { return MainModule.initDOMReady(); },
        },
    };

    // =========================
    // 单文件 IIFE 伪模块化层（方案B）
    // =========================
    // 模块关系：Core(状态/配置) -> Infra(外部能力) -> SettingsSync/Lifecycle/Query/Asset/Main(业务域) -> App(启动入口)
    // 公共 API 清单：
    // - Stability: runStartupSanityChecks
    // - Lifecycle: ensureWindowName / deployHistoryInterceptor / registerTabAsActive / unregisterTabAsInactive / cleanupStaleTabs
    // - SettingsSync: applyVisibleTargets / applyAnimationStyle / applySelectionSyncEnabled / applyAssetSiteInjectionStrategies / applyLoggingEnabled / applyAssetTraceEnabled / applyStrictModeEnabled
    // - Events: register / onChipClick / onSelectAllClick / onSettingsChange / onAnimationToggleChange / onSelectionSyncToggleChange
    // - QuerySync: deployNetworkInterceptor / deployLocalSendFallback / handleQueryFound / processSharedQuery / processSubmission / initReceiver
    // - AssetSync: deployAssetSyncListeners / handleAssetFound / processSharedAsset / processAssetSubmission / initReceiver
    // - Main: loadInitialState / registerGMListeners / startBackgroundTasks / initEarly / initDOMReady

    // 关键注释：Core 只暴露状态与配置访问，不承载业务副作用。
    const CoreModule = (() => ({
        get state() { return AITabSync.state; },
        get config() { return AITabSync.config; },
        get elements() { return AITabSync.elements; },
        get utils() { return AITabSync.utils; },
    }))();

    // 关键注释：Infra 统一包装外部能力（GM API + 日志），业务模块避免直接触碰全局 API。
    const InfraModule = ((core) => ({
        storage: {
            get: (key, fallback) => GM_getValue(key, fallback),
            set: (key, value) => GM_setValue(key, value),
            del: (key) => GM_deleteValue(key),
            listen: (key, callback) => GM_addValueChangeListener(key, callback),
        },
        log: (...args) => core.utils.log(...args),
        assetTrace: (...args) => core.utils.assetTrace(...args),
    }))(CoreModule);

    // 关键注释：Stability 仅做“轻量启动自检”，不参与业务链路。
    const StabilityModule = ((core, infra) => {
        const requiredConfigPaths = [
            ['KEYS', 'SHARED_QUERY'],
            ['KEYS', 'SHARED_ASSET'],
            ['KEYS', 'ACTIVE_TABS'],
            ['TIMINGS', 'SUBMIT_TIMEOUT'],
            ['TIMINGS', 'HEARTBEAT_INTERVAL'],
            ['SITES'],
        ];

        const requiredUtils = [
            'getCurrentSiteInfo',
            'waitFor',
            'findBestInputArea',
            'simulateInput',
            'fileToDataUrl',
            'createFileFromAsset',
        ];

        const hasPath = (obj, path) => {
            let current = obj;
            for (const key of path) {
                if (!current || !(key in current)) return false;
                current = current[key];
            }
            return true;
        };

        const collectIssues = () => {
            const issues = [];

            if (!core?.state || !core?.config || !core?.utils || !core?.elements) {
                issues.push('CoreModule 暴露对象不完整');
            }

            if (!infra?.storage || typeof infra.storage.get !== 'function' || typeof infra.storage.set !== 'function') {
                issues.push('InfraModule.storage 不可用');
            }

            for (const path of requiredConfigPaths) {
                if (!hasPath(core.config, path)) {
                    issues.push(`缺失配置项: config.${path.join('.')}`);
                }
            }

            for (const methodName of requiredUtils) {
                if (typeof core.utils?.[methodName] !== 'function') {
                    issues.push(`缺失工具函数: utils.${methodName}`);
                }
            }

            return issues;
        };

        const runStartupSanityChecks = (stage = 'startup', options = {}) => {
            const strictMode = options.strictMode === true;
            const issues = collectIssues();
            if (issues.length === 0) {
                infra.log(`[Stability] ${stage} 自检通过`);
                return true;
            }

            const summary = `[AI Sync][Stability] ${stage} 自检失败，共 ${issues.length} 项`;
            if (typeof console !== 'undefined') {
                console.warn(summary, issues);
                if (strictMode) {
                    console.error('[AI Sync][StrictMode] 详细自检错误', {
                        stage,
                        issues,
                        state: {
                            thisSite: core.state?.thisSite?.id || null,
                            isStrictModeEnabled: core.state?.isStrictModeEnabled,
                        },
                    });
                }
            }
            infra.log(summary, issues);

            if (strictMode) {
                throw new Error(`[AI Sync][StrictMode] ${stage} 自检失败，请查看控制台详细错误`);
            }
            return false;
        };

        return {
            runStartupSanityChecks,
        };
    })(CoreModule, InfraModule);

    // 关键注释：Lifecycle 负责“标签生命周期与心跳”，不处理业务协议。
    const LifecycleModule = ((core, infra) => {
        const ensureWindowName = () => {
            const { thisSite } = core.state;
            if (!thisSite) return;
            const expectedName = `ai_sync_window_for_${thisSite.id}`;
            if (window.name !== expectedName) window.name = expectedName;
        };

        const registerTabAsActive = async () => {
            const { thisSite } = core.state;
            if (!thisSite) return;
            try {
                const activeTabs = JSON.parse(await infra.storage.get(core.config.KEYS.ACTIVE_TABS, '{}'));
                activeTabs[thisSite.id] = { url: window.location.href, timestamp: Date.now() };
                await infra.storage.set(core.config.KEYS.ACTIVE_TABS, JSON.stringify(activeTabs));
            } catch (e) {
                infra.log('心跳注册失败:', e);
            }
        };

        const unregisterTabAsInactive = async () => {
            const { thisSite } = core.state;
            if (!thisSite) return;
            try {
                const key = core.config.KEYS.ACTIVE_TABS;
                const activeTabs = JSON.parse(await infra.storage.get(key, '{}'));
                if (activeTabs[thisSite.id]) {
                    delete activeTabs[thisSite.id];
                    await infra.storage.set(key, JSON.stringify(activeTabs));
                }
            } catch (e) { }
        };

        const cleanupStaleTabs = async () => {
            try {
                const activeTabs = JSON.parse(await infra.storage.get(core.config.KEYS.ACTIVE_TABS, '{}'));
                const now = Date.now();
                let hasChanged = false;
                for (const siteId in activeTabs) {
                    if (Object.prototype.hasOwnProperty.call(activeTabs, siteId)) {
                        const tabInfo = activeTabs[siteId];
                        if (typeof tabInfo !== 'object' || tabInfo === null || now - tabInfo.timestamp > core.config.TIMINGS.STALE_THRESHOLD) {
                            delete activeTabs[siteId];
                            hasChanged = true;
                        }
                    }
                }
                if (hasChanged) await infra.storage.set(core.config.KEYS.ACTIVE_TABS, JSON.stringify(activeTabs));
            } catch (e) { }
        };

        const deployHistoryInterceptor = () => {
            const { thisSite } = core.state;
            if (!thisSite) return;
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;
            let lastUrl = location.href;
            const handleUrlChange = () => {
                setTimeout(() => {
                    if (location.href !== lastUrl) {
                        lastUrl = location.href;
                        ensureWindowName();
                        registerTabAsActive();
                    }
                }, 100);
            };
            history.pushState = function (...args) {
                originalPushState.apply(this, args);
                handleUrlChange();
            };
            history.replaceState = function (...args) {
                originalReplaceState.apply(this, args);
                handleUrlChange();
            };
            window.addEventListener('popstate', handleUrlChange);
        };

        return {
            ensureWindowName,
            deployHistoryInterceptor,
            registerTabAsActive,
            unregisterTabAsInactive,
            cleanupStaleTabs,
        };
    })(CoreModule, InfraModule);

    // 关键注释：SettingsSync 统一管理“配置落库 + 状态回写 + 界面刷新”，避免重复实现。
    const SettingsSyncModule = ((core, infra) => {
        const normalizeAnimationStyle = (style) => (style === 'aurora' ? 'aurora' : 'spin');
        const normalizeBoolean = (value) => !!value;

        /**
         * @typedef {Object} BaseSettingOptions
         * @property {boolean} [persist=false] 是否写回存储
         * @property {boolean} [syncUI=true] 是否同步设置弹窗 UI
         */

        /**
         * @typedef {BaseSettingOptions & {
         *   rebuildPanel?: boolean
         * }} VisibleTargetsOptions
         */

        /**
         * @typedef {BaseSettingOptions & {
         *   clearSharedSelectionOnDisable?: boolean
         * }} SelectionSyncOptions
         */

        /**
         * @typedef {BaseSettingOptions & {
         *   mergeStrategies?: boolean
         * }} SiteStrategiesOptions
         */

        /**
         * @typedef {BaseSettingOptions & {
         *   refreshMenuCommand?: boolean
         * }} MenuSettingOptions
         */

        const normalizeVisibleTargets = (targets) => {
            if (!Array.isArray(targets)) return [...core.config.DISPLAY_ORDER];
            return core.config.DISPLAY_ORDER.filter((id) => targets.includes(id));
        };

        const resolveStrategySeed = (mergeStrategies) => {
            const currentStrategies = core.state.assetSiteInjectionStrategies;
            if (mergeStrategies && currentStrategies && typeof currentStrategies === 'object' && Object.keys(currentStrategies).length > 0) {
                return { ...currentStrategies };
            }
            return core.utils.getRecommendedAssetSiteStrategies();
        };

        const normalizeSiteStrategies = (strategies, mergeStrategies = true) => {
            const seed = resolveStrategySeed(mergeStrategies);
            if (!strategies || typeof strategies !== 'object') return seed;
            Object.keys(seed).forEach((siteId) => {
                const strategy = strategies[siteId];
                if (strategy === 'drop' || strategy === 'paste') {
                    seed[siteId] = strategy;
                }
            });
            return seed;
        };

        const applyFabAnimationClass = (style) => {
            const fab = core.elements.fab;
            if (!fab) return;
            fab.classList.remove('animation-aurora', 'animation-spin', 'intro-playing');
            fab.classList.add(style === 'spin' ? 'animation-spin' : 'animation-aurora');
            if (style === 'spin') fab.classList.add('intro-playing');
        };

        const commitSetting = async (key, value, options = {}) => {
            const {
                persist = false,
                applyState,
                afterApply,
                syncUI = true,
            } = options;
            if (persist) await infra.storage.set(key, value);
            if (typeof applyState === 'function') applyState(value);
            if (typeof afterApply === 'function') await afterApply(value);
            if (syncUI) AITabSync.ui.syncSettingsModalState();
            return value;
        };

        /** @param {string[]} targets @param {VisibleTargetsOptions} [options] */
        const applyVisibleTargets = async (targets, options = {}) => {
            const normalized = normalizeVisibleTargets(targets);
            return commitSetting(core.config.KEYS.VISIBLE_TARGETS, normalized, {
                persist: options.persist === true,
                applyState: (nextTargets) => {
                    core.state.visibleTargets = nextTargets;
                    core.config.DISPLAY_ORDER.forEach((id) => {
                        if (!nextTargets.includes(id) && core.state.selectedTargets.has(id)) {
                            core.state.selectedTargets.delete(id);
                        }
                    });
                },
                afterApply: async () => {
                    if (options.rebuildPanel !== false) {
                        await AITabSync.ui.rebuildChipsUI();
                    }
                },
                syncUI: options.syncUI !== false,
            });
        };

        /** @param {'spin'|'aurora'|string} style @param {BaseSettingOptions} [options] */
        const applyAnimationStyle = async (style, options = {}) => {
            const normalized = normalizeAnimationStyle(style);
            return commitSetting(core.config.KEYS.ANIMATION_STYLE, normalized, {
                persist: options.persist === true,
                applyState: (nextStyle) => {
                    core.state.animationStyle = nextStyle;
                    applyFabAnimationClass(nextStyle);
                },
                syncUI: options.syncUI !== false,
            });
        };

        /** @param {boolean} enabled @param {SelectionSyncOptions} [options] */
        const applySelectionSyncEnabled = async (enabled, options = {}) => {
            const normalized = !!enabled;
            await commitSetting(core.config.KEYS.SELECTION_SYNC_ENABLED, normalized, {
                persist: options.persist === true,
                applyState: (nextEnabled) => {
                    core.state.isSelectionSynced = nextEnabled;
                },
                syncUI: options.syncUI !== false,
            });

            if (!normalized && options.clearSharedSelectionOnDisable === true) {
                await infra.storage.del(core.config.KEYS.SHARED_SELECTION);
            }
            return normalized;
        };

        /** @param {Record<string, 'drop'|'paste'>|Object} strategies @param {SiteStrategiesOptions} [options] */
        const applyAssetSiteInjectionStrategies = async (strategies, options = {}) => {
            const normalized = normalizeSiteStrategies(strategies, options.mergeStrategies !== false);
            return commitSetting(core.config.KEYS.ASSET_SITE_INJECTION_STRATEGIES, normalized, {
                persist: options.persist === true,
                applyState: (nextStrategies) => {
                    core.state.assetSiteInjectionStrategies = nextStrategies;
                },
                syncUI: options.syncUI !== false,
            });
        };

        /** @param {SiteStrategiesOptions} [options] */
        const applyRecommendedAssetSiteInjectionStrategies = async (options = {}) => {
            const recommended = core.utils.getRecommendedAssetSiteStrategies();
            return applyAssetSiteInjectionStrategies(recommended, {
                ...options,
                mergeStrategies: false,
            });
        };

        /** @param {boolean} enabled @param {MenuSettingOptions} [options] */
        const applyLoggingEnabled = async (enabled, options = {}) => {
            const normalized = normalizeBoolean(enabled);
            return commitSetting(core.config.KEYS.LOGGING_ENABLED, normalized, {
                persist: options.persist === true,
                applyState: (nextValue) => {
                    core.state.isLoggingEnabled = nextValue;
                },
                afterApply: () => {
                    if (options.refreshMenuCommand !== false) AITabSync.ui.updateMenuCommand();
                },
                syncUI: false,
            });
        };

        /** @param {boolean} enabled @param {MenuSettingOptions} [options] */
        const applyAssetTraceEnabled = async (enabled, options = {}) => {
            const normalized = normalizeBoolean(enabled);
            return commitSetting(core.config.KEYS.ASSET_TRACE_ENABLED, normalized, {
                persist: options.persist === true,
                applyState: (nextValue) => {
                    core.state.isAssetTraceEnabled = nextValue;
                },
                afterApply: () => {
                    if (options.refreshMenuCommand !== false) AITabSync.ui.updateMenuCommand();
                },
                syncUI: false,
            });
        };

        /** @param {boolean} enabled @param {MenuSettingOptions} [options] */
        const applyStrictModeEnabled = async (enabled, options = {}) => {
            const normalized = normalizeBoolean(enabled);
            return commitSetting(core.config.KEYS.STRICT_MODE_ENABLED, normalized, {
                persist: options.persist === true,
                applyState: (nextValue) => {
                    core.state.isStrictModeEnabled = nextValue;
                },
                afterApply: () => {
                    if (options.refreshMenuCommand !== false) AITabSync.ui.updateMenuCommand();
                },
                syncUI: false,
            });
        };

        return {
            applyVisibleTargets,
            applyAnimationStyle,
            applySelectionSyncEnabled,
            applyAssetSiteInjectionStrategies,
            applyRecommendedAssetSiteInjectionStrategies,
            applyLoggingEnabled,
            applyAssetTraceEnabled,
            applyStrictModeEnabled,
        };
    })(CoreModule, InfraModule);

    // 关键注释：Main 只做启动编排；协议细节下沉到 Query/Asset/Lifecycle 模块。
    const MainModule = ((core, infra) => {
        const loadInitialState = async () => {
            const { state, config, settingsSync } = AITabSync;

            const loggingEnabled = await infra.storage.get(config.KEYS.LOGGING_ENABLED, false);
            await settingsSync.applyLoggingEnabled(loggingEnabled, {
                persist: false,
                refreshMenuCommand: false,
            });

            const assetTraceEnabled = await infra.storage.get(config.KEYS.ASSET_TRACE_ENABLED, false);
            await settingsSync.applyAssetTraceEnabled(assetTraceEnabled, {
                persist: false,
                refreshMenuCommand: false,
            });

            const storedVisibleTargets = await infra.storage.get(config.KEYS.VISIBLE_TARGETS, null);
            const resolvedVisibleTargets = storedVisibleTargets === null
                ? [...config.DISPLAY_ORDER]
                : storedVisibleTargets;
            await settingsSync.applyVisibleTargets(resolvedVisibleTargets, {
                persist: storedVisibleTargets === null,
                rebuildPanel: false,
                syncUI: false,
            });

            const animationStyle = await infra.storage.get(config.KEYS.ANIMATION_STYLE, 'spin');
            await settingsSync.applyAnimationStyle(animationStyle, {
                persist: false,
                syncUI: false,
            });

            const selectionSyncEnabled = await infra.storage.get(config.KEYS.SELECTION_SYNC_ENABLED, true);
            await settingsSync.applySelectionSyncEnabled(selectionSyncEnabled, {
                persist: false,
                syncUI: false,
            });

            const savedSiteStrategies = await infra.storage.get(config.KEYS.ASSET_SITE_INJECTION_STRATEGIES, null);
            if (savedSiteStrategies && typeof savedSiteStrategies === 'object') {
                await settingsSync.applyAssetSiteInjectionStrategies(savedSiteStrategies, {
                    persist: false,
                    mergeStrategies: false,
                    syncUI: false,
                });
            } else {
                await settingsSync.applyRecommendedAssetSiteInjectionStrategies({
                    persist: true,
                    syncUI: false,
                });
            }

            const strictModeEnabled = await infra.storage.get(config.KEYS.STRICT_MODE_ENABLED, false);
            await settingsSync.applyStrictModeEnabled(strictModeEnabled, {
                persist: false,
                refreshMenuCommand: false,
            });

            if (state.isSelectionSynced) {
                const sharedSelection = await infra.storage.get(config.KEYS.SHARED_SELECTION, '[]');
                try {
                    state.selectedTargets = new Set(JSON.parse(sharedSelection || '[]'));
                } catch (error) {
                    state.selectedTargets = new Set();
                }
            }
        };

        const registerGMListeners = () => {
            const { config, ui, state, utils, settingsSync } = AITabSync;
            infra.storage.listen(config.KEYS.LOGGING_ENABLED, async (name, ov, nv) => {
                await settingsSync.applyLoggingEnabled(nv, { persist: false });
            });
            infra.storage.listen(config.KEYS.ASSET_TRACE_ENABLED, async (name, ov, nv) => {
                await settingsSync.applyAssetTraceEnabled(nv, { persist: false });
            });
            infra.storage.listen(config.KEYS.ACTIVE_TABS, (name, ov, nv, remote) => {
                if (remote) ui.updatePanelState();
            });
            infra.storage.listen(config.KEYS.VISIBLE_TARGETS, async (name, ov, nv) => {
                let newTargets = [];
                try {
                    newTargets = JSON.parse(nv || '[]');
                } catch (error) {
                    newTargets = [];
                }
                await settingsSync.applyVisibleTargets(newTargets, { persist: false });
            });
            infra.storage.listen(config.KEYS.ANIMATION_STYLE, async (name, ov, nv) => {
                await settingsSync.applyAnimationStyle(nv, { persist: false });
            });
            infra.storage.listen(config.KEYS.SELECTION_SYNC_ENABLED, async (name, ov, nv) => {
                await settingsSync.applySelectionSyncEnabled(nv, { persist: false });
            });
            infra.storage.listen(config.KEYS.SHARED_SELECTION, (name, ov, nv, remote) => {
                if (remote && state.isSelectionSynced) {
                    utils.log('接收到同步的选择状态:', nv);
                    state.selectedTargets = new Set(JSON.parse(nv || '[]'));
                    ui.updatePanelState();
                    ui.updateSelectAllButtonState();
                }
            });
            infra.storage.listen(config.KEYS.ASSET_SITE_INJECTION_STRATEGIES, async (name, ov, nv) => {
                await settingsSync.applyAssetSiteInjectionStrategies(nv, {
                    persist: false,
                    mergeStrategies: true,
                });
            });
            infra.storage.listen(config.KEYS.STRICT_MODE_ENABLED, async (name, ov, nv) => {
                await settingsSync.applyStrictModeEnabled(nv, { persist: false });
            });
        };

        const startBackgroundTasks = () => {
            const { config, ui } = AITabSync;
            LifecycleModule.registerTabAsActive();
            LifecycleModule.cleanupStaleTabs();
            setInterval(() => LifecycleModule.registerTabAsActive(), config.TIMINGS.HEARTBEAT_INTERVAL);
            setInterval(() => LifecycleModule.cleanupStaleTabs(), config.TIMINGS.CLEANUP_INTERVAL);
            setInterval(() => {
                if (document.body && !document.getElementById('ai-sync-container')) ui.createMainPanel();
            }, 2000);
        };

        const initEarly = () => {
            core.state.thisSite = core.utils.getCurrentSiteInfo();
            if (!core.state.thisSite) return false;
            AITabSync.comms.deployNetworkInterceptor();
            AITabSync.comms.deployLocalSendFallback();
            AITabSync.comms.deployAssetSyncListeners();
            return true;
        };

        const initDOMReady = async () => {
            const { state, ui, utils, comms, elements } = AITabSync;
            if (!state.thisSite) return;
            try {
                await utils.waitFor(() => document.body, 10000, 'document.body to be ready');
                await loadInitialState();
                // 关键注释：加载完用户偏好后再执行严格模式断言，确保开关即时生效。
                if (!StabilityModule.runStartupSanityChecks('post-load', { strictMode: state.isStrictModeEnabled })) return;
                utils.log(`脚本 v${AITabSync.config.SCRIPT_VERSION} 在 ${state.thisSite.name} 启动。`);
                ui.injectStyle();
                ui.createMainPanel();
                ui.createSettingsModal();
                ui.createTooltip();
                elements.fab.classList.add(state.animationStyle === 'spin' ? 'animation-spin' : 'animation-aurora');
                if (state.animationStyle === 'spin') {
                    elements.fab.classList.add('intro-playing');
                }
                AITabSync.events.register();
                registerGMListeners();
                startBackgroundTasks();
                LifecycleModule.ensureWindowName();
                LifecycleModule.deployHistoryInterceptor();
                comms.initReceiver();
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible') LifecycleModule.registerTabAsActive();
                });
                window.addEventListener('beforeunload', () => LifecycleModule.unregisterTabAsInactive());
                if (window.self === window.top) ui.updateMenuCommand();
            } catch (error) {
                utils.log('初始化错误', error);
            }
        };

        return {
            loadInitialState,
            registerGMListeners,
            startBackgroundTasks,
            initEarly,
            initDOMReady,
        };
    })(CoreModule, InfraModule);

    // 关键注释：Events 统一管理 UI 交互事件，避免事件逻辑散落在 ui/main 中。
    const EventsModule = ((core, infra) => {
        const register = () => {
            const { elements, ui } = AITabSync;
            elements.fab.addEventListener('click', (e) => {
                e.stopPropagation();
                ui.togglePanelVisibility();
            });
            elements.container.addEventListener('click', onChipClick);
            elements.container.querySelector('#ai-sync-select-all-btn').addEventListener('click', onSelectAllClick);
            elements.container.querySelector('#ai-sync-settings-btn').addEventListener('click', () => {
                if (elements.settingsModal) {
                    ui.syncSettingsModalState();
                    elements.settingsModal.style.display = 'flex';
                }
            });
            elements.settingsModal.addEventListener('click', (e) => {
                if (e.target === elements.settingsModal) elements.settingsModal.style.display = 'none';
            });
            elements.settingsModal.querySelector('.ai-sync-settings-list').addEventListener('change', onSettingsChange);
            elements.settingsModal.querySelector('#ai-sync-animation-toggle').addEventListener('change', onAnimationToggleChange);
            elements.settingsModal.querySelector('#ai-sync-selection-sync-toggle').addEventListener('change', onSelectionSyncToggleChange);
            elements.settingsModal.querySelectorAll('.ai-sync-site-injection-select').forEach((selectEl) => {
                selectEl.addEventListener('change', onSiteInjectionStrategyChange);
            });
            elements.settingsModal.querySelector('#ai-sync-apply-recommended-strategy-btn')
                ?.addEventListener('click', onApplyRecommendedSiteStrategies);
            elements.container.addEventListener('mouseover', onChipMouseOver, true);
            elements.container.addEventListener('mouseout', onChipMouseOut, true);
        };

        const onChipClick = async (event) => {
            if (event.target.matches('.ai-sync-chip')) {
                const { config, state, ui, utils } = AITabSync;
                const chip = event.target;
                const siteId = chip.dataset.siteId;
                const siteInfo = config.SITES[siteId];
                if (!siteInfo) return;
                if (state.selectedTargets.has(siteId)) {
                    state.selectedTargets.delete(siteId);
                    if (state.isSelectionSynced && state.selectedTargets.size === 1 && state.selectedTargets.has(state.thisSite.id)) {
                        state.selectedTargets.clear();
                    }
                } else {
                    state.selectedTargets.add(siteId);
                    if (state.isSelectionSynced) {
                        state.selectedTargets.add(state.thisSite.id);
                    }
                    const activeTabs = JSON.parse(await infra.storage.get(config.KEYS.ACTIVE_TABS, '{}'));
                    if (!activeTabs[siteId]) {
                        utils.log(`打开新标签页: ${siteId}`);
                        window.open(siteInfo.url, `ai_sync_window_for_${siteId}`);
                    }
                }
                ui.updatePanelState();
                ui.updateSelectAllButtonState();
                if (state.isSelectionSynced) {
                    await infra.storage.set(config.KEYS.SHARED_SELECTION, JSON.stringify(Array.from(state.selectedTargets)));
                }
            } else if (event.target === AITabSync.elements.container) {
                AITabSync.ui.togglePanelVisibility();
            }
        };

        const onSelectAllClick = async () => {
            const { config, state, ui, utils } = AITabSync;
            const visibleTargets = config.DISPLAY_ORDER.filter(id => state.visibleTargets.includes(id) && id !== state.thisSite.id);
            const allSelected = visibleTargets.length > 0 && visibleTargets.every(id => state.selectedTargets.has(id));
            if (allSelected) {
                state.selectedTargets.clear();
            } else {
                const activeTabs = JSON.parse(await infra.storage.get(config.KEYS.ACTIVE_TABS, '{}'));
                visibleTargets.forEach(siteId => {
                    state.selectedTargets.add(siteId);
                    const siteInfo = config.SITES[siteId];
                    if (!activeTabs[siteId] && siteInfo) {
                        utils.log(`(全选) 打开新标签页: ${siteId}`);
                        window.open(siteInfo.url, `ai_sync_window_for_${siteId}`);
                    }
                });
                if (state.isSelectionSynced) {
                    state.selectedTargets.add(state.thisSite.id);
                }
            }
            ui.updatePanelState();
            ui.updateSelectAllButtonState();
            if (state.isSelectionSynced) {
                await infra.storage.set(config.KEYS.SHARED_SELECTION, JSON.stringify(Array.from(state.selectedTargets)));
            }
        };

        const onSettingsChange = async (event) => {
            if (event.target.type !== 'checkbox') return;
            const { settingsSync } = AITabSync;
            const list = event.currentTarget;
            const checkboxes = list.querySelectorAll('input[type="checkbox"]:checked');
            const newVisibleTargets = Array.from(checkboxes).map((cb) => cb.value);
            await settingsSync.applyVisibleTargets(newVisibleTargets, { persist: true });
        };

        const onAnimationToggleChange = async (event) => {
            const { state, settingsSync, utils } = AITabSync;
            const isSpinEnabled = event.target.checked;
            const newStyle = isSpinEnabled ? 'spin' : 'aurora';
            if (state.animationStyle === newStyle) return;
            await settingsSync.applyAnimationStyle(newStyle, { persist: true });
            utils.log(`动画样式已切换为: ${newStyle}`);
        };

        const onSelectionSyncToggleChange = async (event) => {
            const { settingsSync, utils } = AITabSync;
            const isEnabled = event.target.checked;
            await settingsSync.applySelectionSyncEnabled(isEnabled, {
                persist: true,
                clearSharedSelectionOnDisable: true,
            });
            utils.log(`选择状态同步已 ${isEnabled ? '开启' : '关闭'}.`);
        };

        const onSiteInjectionStrategyChange = async (event) => {
            const { settingsSync, utils } = AITabSync;
            const target = event.target;
            const siteId = target?.dataset?.siteId;
            const strategy = target?.value;
            if (!siteId || (strategy !== 'drop' && strategy !== 'paste')) return;

            await settingsSync.applyAssetSiteInjectionStrategies({
                [siteId]: strategy,
            }, {
                persist: true,
                mergeStrategies: true,
            });
            utils.log('站点资产注入策略已更新', { siteId, strategy });
        };

        const onApplyRecommendedSiteStrategies = async () => {
            const { settingsSync, utils } = AITabSync;
            const nextStrategies = await settingsSync.applyRecommendedAssetSiteInjectionStrategies({
                persist: true,
            });
            utils.log('已应用推荐站点资产注入策略', nextStrategies);
        };

        const onClickOutside = (event) => {
            const { container } = AITabSync.elements;
            if (container && !container.contains(event.target) && container.classList.contains('expanded')) {
                AITabSync.ui.togglePanelVisibility();
            }
        };

        const onChipMouseOver = (event) => {
            if (!event.target.matches('.ai-sync-chip')) return;
            const { state, config, elements } = AITabSync;
            const chip = event.target;
            const siteId = chip.dataset.siteId;
            const tooltipText = state.selectedTargets.has(siteId) ? '已选中 (点击取消)' : (chip.classList.contains('online') ? '待发送 (点击选中)' : '点击启动');
            state.tooltipTimeoutId = setTimeout(() => {
                elements.tooltip.textContent = tooltipText;
                const chipRect = chip.getBoundingClientRect();
                elements.tooltip.style.left = `${chipRect.left + chipRect.width / 2}px`;
                elements.tooltip.style.top = `${chipRect.top}px`;
                elements.tooltip.style.display = 'block';
            }, config.TIMINGS.TOOLTIP_DELAY);
        };

        const onChipMouseOut = (event) => {
            if (!event.target.matches('.ai-sync-chip')) return;
            clearTimeout(AITabSync.state.tooltipTimeoutId);
            AITabSync.elements.tooltip.style.display = 'none';
        };

        const onToggleLogging = async () => {
            const { state, settingsSync } = AITabSync;
            const nextEnabled = await settingsSync.applyLoggingEnabled(!state.isLoggingEnabled, { persist: true });
            alert(`[AI Sync] 调试日志 ${nextEnabled ? '已开启' : '已关闭'}。`);
        };

        const onToggleAssetTrace = async () => {
            const { state, settingsSync } = AITabSync;
            const nextEnabled = await settingsSync.applyAssetTraceEnabled(!state.isAssetTraceEnabled, { persist: true });
            alert(`[AI Sync] 资产链路日志 ${nextEnabled ? '已开启' : '已关闭'}。`);
        };

        const onToggleStrictMode = async () => {
            const { state, settingsSync } = AITabSync;
            const nextEnabled = await settingsSync.applyStrictModeEnabled(!state.isStrictModeEnabled, { persist: true });
            alert(`[AI Sync] 严格模式 ${nextEnabled ? '已开启' : '已关闭'}。`);
        };

        return {
            register,
            onChipClick,
            onSelectAllClick,
            onSettingsChange,
            onAnimationToggleChange,
            onSelectionSyncToggleChange,
            onSiteInjectionStrategyChange,
            onApplyRecommendedSiteStrategies,
            onClickOutside,
            onChipMouseOver,
            onChipMouseOut,
            onToggleLogging,
            onToggleAssetTrace,
            onToggleStrictMode,
        };
    })(CoreModule, InfraModule);

    const QuerySyncModule = ((core, infra) => {
        const deployNetworkInterceptor = () => {
            const { thisSite } = core.state;
            if (!thisSite?.queryExtractor) return;
            const { send } = unsafeWindow.XMLHttpRequest.prototype;
            if (!send._isHooked) {
                const { open } = unsafeWindow.XMLHttpRequest.prototype;
                unsafeWindow.XMLHttpRequest.prototype.open = function (method, url, ...args) {
                    this._method = String(method || 'GET').toUpperCase();
                    this._url = url;
                    return open.apply(this, [method, url, ...args]);
                };
                unsafeWindow.XMLHttpRequest.prototype.send = function (body) {
                    const site = core.utils.getCurrentSiteInfo();
                    const method = this._method || 'GET';
                    if (method === 'POST' && core.utils.isLikelyAssetPayload(body)) {
                        core.utils.markOutboundAssetSignal({
                            siteId: site?.id || 'UNKNOWN',
                            transport: 'xhr',
                            method,
                            url: this._url,
                            bodyType: core.utils.getBodyType(body),
                        });
                    }
                    if (site?.apiPaths.some((p) => this._url?.includes(p)) && body && !core.state.isSubmitting) {
                        try {
                            const bodyType = core.utils.getBodyType(body);
                            const bodyText = typeof body === 'string'
                                ? body
                                : (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams ? body.toString() : '');
                            infra.log(`拦截到 ${site.id} XHR 请求`, {
                                url: this._url,
                                bodyType,
                                preview: bodyText.slice(0, 200)
                            });
                            if (bodyText) {
                                const query = site.queryExtractor(bodyText);
                                if (query) {
                                    infra.log(`从 ${site.id} XHR 请求提取到问题`, query);
                                    handleQueryFound(query, site);
                                } else {
                                    infra.log(`命中 ${site.id} XHR 请求，但未提取到问题`, {
                                        url: this._url,
                                        bodyType,
                                        preview: bodyText.slice(0, 200)
                                    });
                                }
                            } else {
                                infra.log(`命中 ${site.id} XHR 请求，但请求体类型暂不支持读取`, {
                                    url: this._url,
                                    bodyType
                                });
                            }
                        } catch (e) {
                            infra.log(`解析 ${site.id} XHR 请求失败`, e);
                        }
                    }
                    return send.apply(this, arguments);
                };
                unsafeWindow.XMLHttpRequest.prototype.send._isHooked = true;
            }
            const { fetch } = unsafeWindow;
            if (!fetch._isHooked) {
                unsafeWindow.fetch = async function (...args) {
                    const site = core.utils.getCurrentSiteInfo();
                    const request = args[0] instanceof Request ? args[0] : null;
                    const url = request ? request.url : String(args[0] || '');
                    const config = args[1] || {};
                    const method = (config.method || request?.method || 'GET').toUpperCase();
                    const bodySource = config.body !== undefined
                        ? config.body
                        : (request ? request.clone() : null);
                    const headersSource = config.headers !== undefined
                        ? config.headers
                        : request?.headers;
                    const contentType = core.utils.getHeaderValue(headersSource, 'content-type');
                    if (method === 'POST' && core.utils.isLikelyAssetPayload(bodySource, contentType)) {
                        core.utils.markOutboundAssetSignal({
                            siteId: site?.id || 'UNKNOWN',
                            transport: 'fetch',
                            method,
                            url,
                            bodyType: core.utils.getBodyType(bodySource),
                            contentType,
                        });
                    }
                    if (site?.apiPaths.some((p) => url.includes(p)) && method === 'POST' && !core.state.isSubmitting) {
                        try {
                            const bodyType = core.utils.getBodyType(bodySource);
                            const bodyText = await core.utils.bodyToText(bodySource);
                            infra.log(`拦截到 ${site.id} fetch 请求`, {
                                url,
                                method,
                                bodyType,
                                preview: bodyText.slice(0, 200)
                            });
                            if (bodyText) {
                                const query = site.queryExtractor(bodyText);
                                if (query) {
                                    infra.log(`从 ${site.id} fetch 请求提取到问题`, query);
                                    handleQueryFound(query, site);
                                } else {
                                    infra.log(`命中 ${site.id} fetch 请求，但未提取到问题`, {
                                        url,
                                        method,
                                        bodyType,
                                        preview: bodyText.slice(0, 200)
                                    });
                                }
                            } else {
                                infra.log(`命中 ${site.id} fetch 请求，但请求体为空或无法读取`, {
                                    url,
                                    method,
                                    bodyType
                                });
                            }
                        } catch (e) {
                            infra.log(`解析 ${site?.id || 'UNKNOWN'} fetch 请求失败`, e);
                        }
                    }
                    return fetch.apply(this, args);
                };
                unsafeWindow.fetch._isHooked = true;
            }
        };

        const deployLocalSendFallback = () => {
            const { utils, state } = AITabSync;
            const shouldSkipBecauseSuppressed = () => Date.now() < state.suppressNextLocalSendCaptureUntil;

            const readInputContent = (inputArea) => {
                if (!inputArea) return '';
                if (inputArea.tagName === 'TEXTAREA') return (inputArea.value || '').trim();
                return (inputArea.textContent || '').trim();
            };

            const canTreatAsInputArea = (element) => {
                if (!element) return false;
                if (element.tagName === 'TEXTAREA') return true;
                if (element.isContentEditable || element.getAttribute('contenteditable') === 'true') return true;
                return false;
            };

            const broadcastIfValid = (query) => {
                const q = String(query || '').trim();
                if (!q || shouldSkipBecauseSuppressed()) return;
                handleQueryFound(q, state.thisSite);
            };

            document.addEventListener('keydown', (event) => {
                if (!event.isTrusted || state.isSubmitting || shouldSkipBecauseSuppressed()) return;
                const target = event.target;
                if (!(target instanceof Element) || !canTreatAsInputArea(target)) return;
                const isEnter = event.key === 'Enter';
                if (!isEnter || event.shiftKey || event.altKey) return;

                const isModifierSend = event.ctrlKey || event.metaKey;
                const siteId = state.thisSite?.id;
                const isStudio = siteId === 'AI_STUDIO';
                if (isStudio && !isModifierSend) return;

                const query = readInputContent(target);
                if (!query) return;
                setTimeout(() => broadcastIfValid(query), 0);
            }, true);

            document.addEventListener('click', (event) => {
                if (!event.isTrusted || state.isSubmitting || shouldSkipBecauseSuppressed()) return;
                const target = event.target;
                if (!(target instanceof Element)) return;
                const clickable = target.closest('button,[role="button"],[aria-label*="发送"],[aria-label*="Send"],[data-testid*="send"],.send-button');
                if (!clickable) return;

                const inputArea = utils.findBestInputArea(state.thisSite);
                const query = readInputContent(inputArea);
                if (!query) return;

                setTimeout(() => {
                    const latestInput = utils.findBestInputArea(state.thisSite);
                    const latestContent = readInputContent(latestInput);
                    if (!latestContent) broadcastIfValid(query);
                }, 120);
            }, true);
        };

        const handleQueryFound = async (query, sourceSite) => {
            const { utils, state, config, elements } = AITabSync;
            const targets = Array.from(state.selectedTargets);
            if (targets.length === 0) return;
            utils.log(`准备从 ${sourceSite.id} 广播问题`, {
                targets,
                preview: query.slice(0, 120)
            });
            if (elements.fab) {
                elements.fab.classList.add('sending');
                setTimeout(() => elements.fab?.classList.remove('sending'), 2000);
            }
            await infra.storage.set(config.KEYS.SHARED_QUERY, JSON.stringify({
                query,
                timestamp: Date.now(),
                sourceId: sourceSite.id,
                targetIds: targets
            }));
        };

        const processSubmission = async (site, query) => {
            const { utils, config, state } = AITabSync;
            const inputArea = await utils.waitFor(() => utils.findBestInputArea(site), config.TIMINGS.SUBMIT_TIMEOUT, '输入框');
            utils.log(`开始向 ${site.id} 注入问题`, {
                input: utils.getElementDescriptor(inputArea),
                preview: query.slice(0, 120)
            });
            utils.simulateInput(inputArea, query);
            // 关键注释：抑制窗口用于阻断“远端注入后被本地再次捕获”导致的回环广播。
            state.suppressNextLocalSendCaptureUntil = Date.now() + 3000;
            await new Promise((resolve) => setTimeout(resolve, config.TIMINGS.HUMAN_LIKE_DELAY));
            try {
                state.isSubmitting = true;
                if (site.id === 'QWEN') {
                    const sendButton = document.querySelector('div.omni-button-content button.ant-btn-primary')
                        || document.querySelector('div.omni-button-content button');
                    if (sendButton && !sendButton.disabled && !sendButton.classList.contains('disabled')) {
                        sendButton.click();
                        setTimeout(() => (state.isSubmitting = false), 2000);
                        return;
                    }
                }
                if (site.id === 'AI_STUDIO') {
                    const sendButton = utils.deepQuerySelector('run-button button[aria-label="Run"]')
                        || utils.deepQuerySelector('button[aria-label="Run"]')
                        || utils.deepQuerySelector('button[aria-label="Submit"]');
                    if (sendButton && !sendButton.disabled) {
                        sendButton.click();
                        setTimeout(() => (state.isSubmitting = false), 2000);
                        return;
                    }
                }
                const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
                const useModifierKey = site.id === 'AI_STUDIO';
                inputArea.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true,
                    cancelable: true,
                    ctrlKey: useModifierKey && !isMac,
                    metaKey: useModifierKey && isMac
                }));
                setTimeout(() => (state.isSubmitting = false), 2000);
            } catch (error) {
                state.isSubmitting = false;
            }
        };

        const processSharedQuery = async (value) => {
            const { state, utils, config } = AITabSync;
            if (state.isProcessingQueryTask || !value) return;
            state.isProcessingQueryTask = true;
            try {
                const data = JSON.parse(value);
                utils.log(`收到共享问题，当前站点 ${state.thisSite.id}`, {
                    sourceId: data.sourceId,
                    targetIds: data.targetIds,
                    ageMs: Date.now() - data.timestamp,
                    preview: String(data.query || '').slice(0, 120)
                });
                if (!data.targetIds?.includes(state.thisSite.id) || Date.now() - data.timestamp >= config.TIMINGS.FRESHNESS_THRESHOLD) {
                    utils.log(`跳过共享问题，当前站点 ${state.thisSite.id} 不在目标列表或消息已过期`);
                    return;
                }
                const remainingTargets = data.targetIds.filter((id) => id !== state.thisSite.id);
                if (remainingTargets.length > 0) {
                    await infra.storage.set(config.KEYS.SHARED_QUERY, JSON.stringify({ ...data, targetIds: remainingTargets }));
                } else {
                    await infra.storage.del(config.KEYS.SHARED_QUERY);
                }
                await processSubmission(state.thisSite, data.query);
            } catch (e) {
                await infra.storage.del(config.KEYS.SHARED_QUERY);
            } finally {
                state.isProcessingQueryTask = false;
            }
        };

        const initReceiver = async () => {
            const { utils, config } = AITabSync;
            try {
                await utils.waitFor(() => utils.findBestInputArea(AITabSync.state.thisSite), config.TIMINGS.SUBMIT_TIMEOUT, 'UI就绪');
                const value = await infra.storage.get(config.KEYS.SHARED_QUERY);
                if (value) processSharedQuery(value);
            } catch (error) { }

            infra.storage.listen(config.KEYS.SHARED_QUERY, (name, old_value, new_value, remote) => {
                if (remote && new_value) {
                    try {
                        if (JSON.parse(new_value).sourceId !== AITabSync.state.thisSite.id) processSharedQuery(new_value);
                    } catch (e) { }
                }
            });
        };

        return {
            deployNetworkInterceptor,
            deployLocalSendFallback,
            handleQueryFound,
            processSharedQuery,
            processSubmission,
            initReceiver,
        };
    })(CoreModule, InfraModule);

    const AssetSyncModule = ((core, infra) => {
        const deployAssetSyncListeners = () => {
            const { utils, state } = AITabSync;
            const isSuppressed = () => Date.now() < state.suppressLocalAssetCaptureUntil;

            const broadcastFiles = async (files, origin) => {
                const sourceSite = state.thisSite;
                const targets = Array.from(state.selectedTargets);
                if (!sourceSite || targets.length === 0 || !files?.length || isSuppressed()) return;

                const fileList = Array.from(files).filter(Boolean);
                if (fileList.length === 0) return;

                utils.assetTrace('捕获本地资产事件', {
                    origin,
                    site: sourceSite.id,
                    targets,
                    fileCount: fileList.length,
                    files: fileList.slice(0, 5).map((file) => ({
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        lastModified: file.lastModified,
                    })),
                });

                try {
                    const assetsToBroadcast = [];
                    for (const file of fileList) {
                        const dataUrl = await utils.fileToDataUrl(file);
                        utils.gcMapByAge(state.recentAssetFingerprints, AITabSync.config.TIMINGS.ASSET_DEDUP_WINDOW);
                        const fingerprint = utils.makeDataUrlFingerprint(dataUrl);
                        const lastSeen = state.recentAssetFingerprints.get(fingerprint) || 0;
                        // 关键注释：内容指纹窗口去重，防止同一资产在 drop 链路重复广播。
                        if (Date.now() - lastSeen < AITabSync.config.TIMINGS.ASSET_DEDUP_WINDOW) {
                            utils.log('跳过重复资产广播（命中内容去重窗口）', { origin, fingerprint, name: file.name });
                            utils.assetTrace('命中内容去重，跳过广播', {
                                origin,
                                fingerprint,
                                name: file.name,
                                ageMs: Date.now() - lastSeen
                            });
                            continue;
                        }
                        state.recentAssetFingerprints.set(fingerprint, Date.now());
                        assetsToBroadcast.push({
                            name: file.name,
                            mimeType: file.type || 'application/octet-stream',
                            size: file.size || 0,
                            dataUrl,
                            origin,
                        });
                    }

                    if (assetsToBroadcast.length === 0) return;

                    utils.assetTrace('通过内容去重检查，准备广播', {
                        origin,
                        count: assetsToBroadcast.length,
                    });

                    await handleAssetFound(assetsToBroadcast, sourceSite, targets);
                } catch (error) {
                    utils.log('资产同步读取失败', error);
                }
            };

            document.addEventListener('drop', (event) => {
                if (!event.isTrusted || state.isApplyingRemoteAsset || isSuppressed()) return;
                utils.assetTrace('监听到 drop 事件');
                const files = Array.from(event.dataTransfer?.files || []);
                if (files.length > 0) broadcastFiles(files, 'drop');
            }, true);

            document.addEventListener('paste', (event) => {
                if (!event.isTrusted || state.isApplyingRemoteAsset || isSuppressed()) return;
                const items = event.clipboardData?.items;
                if (!items?.length) return;

                const files = [];
                for (let index = 0; index < items.length; index++) {
                    const item = items[index];
                    if (item?.kind !== 'file') continue;
                    const file = item.getAsFile();
                    if (file) files.push(file);
                }

                if (files.length === 0) return;
                utils.assetTrace('监听到 paste 事件（文件/图片）', { fileCount: files.length });
                broadcastFiles(files, 'paste');
            }, true);
        };

        const handleAssetFound = async (assets, sourceSite, targets) => {
            const { utils, config, elements } = AITabSync;
            if (!sourceSite || !targets?.length) return;

            const normalizedAssets = (Array.isArray(assets) ? assets : [assets]).filter((asset) => !!asset?.dataUrl);
            if (normalizedAssets.length === 0) return;

            const assetMessageId = `${sourceSite.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

            utils.log(`准备从 ${sourceSite.id} 广播资产`, {
                targets,
                count: normalizedAssets.length,
                assets: normalizedAssets.slice(0, 5).map((asset) => ({
                    name: asset.name,
                    mimeType: asset.mimeType,
                    size: asset.size,
                    origin: asset.origin,
                })),
            });
            utils.assetTrace('写入共享资产消息', {
                assetMessageId,
                sourceId: sourceSite.id,
                targets,
                count: normalizedAssets.length,
            });

            if (elements.fab) {
                elements.fab.classList.add('sending');
                setTimeout(() => elements.fab?.classList.remove('sending'), 2000);
            }

            await infra.storage.set(config.KEYS.SHARED_ASSET, JSON.stringify({
                assetMessageId,
                timestamp: Date.now(),
                sourceId: sourceSite.id,
                targetIds: targets,
                assetCount: normalizedAssets.length,
                assets: normalizedAssets,
                asset: normalizedAssets[0]
            }));
        };

        const processAssetSubmission = async (site, asset) => {
            const { utils, state, config } = AITabSync;
            if (!asset?.dataUrl) return;

            state.isApplyingRemoteAsset = true;
            try {
                const file = utils.createFileFromAsset(asset);
                utils.assetTrace('开始远端资产注入', {
                    site: site.id,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                });
                const strategy = state.assetSiteInjectionStrategies?.[site.id] === 'paste' ? 'paste' : 'drop';

                const inputArea = await utils.waitFor(() => utils.findBestInputArea(site), config.TIMINGS.SUBMIT_TIMEOUT, '输入框');
                inputArea.focus();
                const beforeSnapshot = utils.takeAssetDomSnapshot(inputArea);
                const startedAt = Date.now();
                if (strategy === 'paste') {
                    utils.dispatchPasteWithFile(inputArea, file);
                } else {
                    utils.dispatchDropWithFile(inputArea, file);
                }
                const afterSnapshot = utils.takeAssetDomSnapshot(inputArea);
                const verifiedByDom = utils.isAssetLikelyAttached(beforeSnapshot, afterSnapshot);
                const verifiedByNetwork = verifiedByDom
                    ? false
                    : await utils.waitForOutboundAssetSignal(startedAt, config.TIMINGS.ASSET_NETWORK_VERIFY_WINDOW);
                const verified = verifiedByDom || verifiedByNetwork;
                utils.assetTrace(`${strategy} 注入后校验结果`, {
                    site: site.id,
                    strategy,
                    verified,
                    verifiedByDom,
                    verifiedByNetwork,
                    beforeSnapshot,
                    afterSnapshot,
                });

                if (verified) {
                    utils.assetTrace(`${strategy} 注入已生效，结束流程`, { site: site.id });
                    return;
                }

                utils.assetTrace('资产注入未通过策略校验', {
                    site: site.id,
                    strategy,
                    fileName: file.name,
                });
            } catch (error) {
                utils.log('应用远端资产失败', error);
                utils.assetTrace('远端资产注入异常', error);
            } finally {
                // 关键注释：远端注入后短抑制，避免站点回填触发本地监听再次广播。
                state.suppressLocalAssetCaptureUntil = Date.now() + config.TIMINGS.REMOTE_ASSET_SUPPRESS_WINDOW;
                utils.assetTrace('设置本地资产捕获抑制窗口', {
                    site: site.id,
                    suppressMs: config.TIMINGS.REMOTE_ASSET_SUPPRESS_WINDOW,
                });
                setTimeout(() => {
                    state.isApplyingRemoteAsset = false;
                }, config.TIMINGS.REMOTE_ASSET_SUPPRESS_WINDOW);
            }
        };

        const processSharedAsset = async (value) => {
            const { state, utils, config } = AITabSync;
            if (state.isProcessingAssetTask || !value) return;
            state.isProcessingAssetTask = true;

            try {
                const data = JSON.parse(value);
                utils.assetTrace('收到共享资产消息', {
                    sourceId: data.sourceId,
                    targetIds: data.targetIds,
                    assetMessageId: data.assetMessageId,
                    ageMs: Date.now() - data.timestamp,
                    currentSite: state.thisSite.id,
                });
                const isExpired = Date.now() - data.timestamp >= config.TIMINGS.ASSET_FRESHNESS_THRESHOLD;
                if (isExpired) {
                    utils.assetTrace('共享资产过期，删除消息', { assetMessageId: data.assetMessageId });
                    await infra.storage.del(config.KEYS.SHARED_ASSET);
                    return;
                }
                if (!data.targetIds?.includes(state.thisSite.id)) return;

                utils.gcMapByAge(state.processedAssetMessageIds, config.TIMINGS.ASSET_PROCESSED_ID_TTL);
                const messageId = data.assetMessageId || `${data.sourceId || 'unknown'}:${data.timestamp || 0}`;
                // 关键注释：messageId 幂等消费，避免多标签并发重复处理同一资产消息。
                if (state.processedAssetMessageIds.has(messageId)) {
                    utils.log('跳过已处理资产消息', { messageId, site: state.thisSite.id });
                    utils.assetTrace('命中接收端幂等去重，跳过注入', { messageId, site: state.thisSite.id });
                    return;
                }
                state.processedAssetMessageIds.set(messageId, Date.now());
                utils.assetTrace('通过接收端幂等检查，开始注入', { messageId, site: state.thisSite.id });

                const incomingAssets = Array.isArray(data.assets) && data.assets.length > 0
                    ? data.assets
                    : (data.asset ? [data.asset] : []);
                if (incomingAssets.length === 0) {
                    utils.assetTrace('共享资产消息未包含有效资产数据，跳过', { messageId });
                    return;
                }

                for (const asset of incomingAssets) {
                    await processAssetSubmission(state.thisSite, asset);
                }
            } catch (error) {
                utils.log('处理共享资产失败', error);
                utils.assetTrace('处理共享资产异常', error);
            } finally {
                state.isProcessingAssetTask = false;
            }
        };

        const initReceiver = async () => {
            const { utils, config } = AITabSync;
            try {
                await utils.waitFor(() => utils.findBestInputArea(AITabSync.state.thisSite), config.TIMINGS.SUBMIT_TIMEOUT, 'UI就绪');
                const assetValue = await infra.storage.get(config.KEYS.SHARED_ASSET);
                if (assetValue) processSharedAsset(assetValue);
            } catch (error) { }

            infra.storage.listen(config.KEYS.SHARED_ASSET, (name, old_value, new_value, remote) => {
                if (remote && new_value) {
                    try {
                        if (JSON.parse(new_value).sourceId !== AITabSync.state.thisSite.id) processSharedAsset(new_value);
                    } catch (e) { }
                }
            });
        };

        return {
            deployAssetSyncListeners,
            handleAssetFound,
            processSharedAsset,
            processAssetSubmission,
            initReceiver,
        };
    })(CoreModule, InfraModule);

    // 关键注释：App 模块只负责启动编排，不放业务逻辑，保持入口单一。
    const AppModule = (() => ({
        start() {
            // 关键注释：先执行启动自检，失败即停止初始化，避免带病运行。
            if (!StabilityModule.runStartupSanityChecks('pre-init', { strictMode: false })) return;

            if (MainModule.initEarly()) {
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => MainModule.initDOMReady());
                } else {
                    MainModule.initDOMReady();
                }
            }
        },
    }))();

    AppModule.start();
})();
