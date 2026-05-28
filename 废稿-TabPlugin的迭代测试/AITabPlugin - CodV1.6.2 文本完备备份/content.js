(function() {
  const U = window.TabPluginUtils;
  const CONTENT_VERSION = '1.6.2';

  if (!U) {
    console.error('[AI2tab] utils.js is required before content.js');
    return;
  }

  if (window.__AI2TAB_CONTENT_VERSION__ === CONTENT_VERSION && window.__AI2TAB_PROXY_LISTENER_INSTALLED__) {
    U.log(`Content script ${CONTENT_VERSION} already active.`);
    return;
  }

  window.__AI2TAB_CONTENT_VERSION__ = CONTENT_VERSION;

  const COMMON_SEND_TEXT = ['发送', 'Send', 'Submit'];

  function hostMatches(hostname, domains) {
    return domains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
  }

  function pathStartsWith(pathname, prefixes) {
    return prefixes.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
  }

  const AI_PLATFORMS = {
    chatgpt: {
      name: 'ChatGPT',
      patterns: ['chatgpt.com', 'chat.openai.com'],
      selectors: {
        newChat: [
          'a[data-testid="create-new-chat-button"]',
          'button[data-testid="create-new-chat-button"]',
          'nav a[href="/"]',
          'a[aria-label*="New chat"]',
        ],
        input: [
          '#prompt-textarea',
          'div[contenteditable="true"][id="prompt-textarea"]',
          'textarea[placeholder*="Message"]',
          'textarea',
        ],
        send: [
          'button[data-testid="send-button"]',
          'button[aria-label*="Send"]',
          'button[aria-label*="发送"]',
        ],
        imageMode: [
          'button[aria-label*="生图"]',
          'button[aria-label*="图像"]',
          'button[aria-label*="图片"]',
          'div[role="button"][aria-label*="生图"]',
          'div[role="button"][aria-label*="图像"]',
          'div[role="button"][aria-label*="图片"]',
        ],
      },
      newChatText: ['New chat', '新聊天', '新对话'],
      delayAfterNewChat: 1400,
    },

    gemini: {
      name: 'Gemini',
      patterns: ['gemini.google.com'],
      selectors: {
        newChat: [
          'a[data-test-id="new-chat"]',
          'button[data-test-id="new-chat"]',
          'a[href="/app"]',
        ],
        input: [
          '.ql-editor[contenteditable="true"]',
          'div[contenteditable="true"][role="textbox"]',
          'div[contenteditable="true"]',
          'textarea',
        ],
        send: [
          'button[aria-label="Send message"]',
          'button[aria-label*="Send"]',
          'button[data-test-id="send-button"]',
        ],
      },
      newChatText: ['New chat', '新聊天'],
      delayAfterNewChat: 1600,
      useCtrlEnter: true,
    },

    grok: {
      name: 'Grok',
      match: location => {
        if (hostMatches(location.hostname, ['grok.com', 'x.ai'])) return true;
        return hostMatches(location.hostname, ['x.com']) && pathStartsWith(location.pathname, ['/i/grok', '/grok']);
      },
      selectors: {
        newChat: [
          'a[href="/chat"]',
          'button[data-testid="new-chat"]',
          'a[aria-label*="New"]',
        ],
        input: [
          'textarea[placeholder*="Ask"]',
          'textarea[placeholder*="Message"]',
          'textarea[placeholder*="Describe"]',
          'div.tiptap.ProseMirror',
          '.ProseMirror[contenteditable="true"]',
          'div[contenteditable="true"]',
          'textarea',
        ],
        send: [
          'button[aria-label="Send"]',
          'button[aria-label*="Send"]',
          'button[data-testid="send-button"]',
        ],
      },
      newChatText: ['New chat', 'New conversation', '新对话'],
      modeText: ['Expert', 'Think', 'DeepSearch'],
      delayAfterNewChat: 1600,
      skipNewChatForImage: true,
      requireVerifyForImage: true,
    },

    tongyi: {
      name: '通义千问',
      patterns: ['tongyi.aliyun.com', 'qianwen.aliyun.com', 'qianwen.com', 'qwen.ai'],
      selectors: {
        newChat: [
          'button[data-testid="new-chat"]',
          'div[data-testid="new-chat"]',
        ],
        input: [
          'textarea.message-input-textarea',
          'textarea[data-testid="chat-input"]',
          'textarea[placeholder*="输入"]',
          'textarea[placeholder*="问"]',
          'textarea[placeholder*="帮"]',
          '[contenteditable="true"][role="textbox"]',
          'div[role="textbox"][contenteditable="true"]',
          'div[contenteditable="true"]',
          'textarea',
        ],
        send: [
          'div.omni-button-content button.ant-btn-primary',
          'div.omni-button-content button',
          'button.ant-btn-primary',
          'button[data-testid="chat-send"]',
          'button[aria-label*="发送"]',
        ],
      },
      newChatText: ['新建对话', '新对话', '开启新对话', '新建'],
      modeText: ['深度思考', '思考'],
      delayAfterNewChat: 1800,
      imageModeText: ['AI生图', 'AI 生图', '图像生成', '图片生成', '生成图片', '文生图', '画图'],
      requireVerifyForImage: true,
      clearAndWriteBeforeSubmit: true,
    },

    doubao: {
      name: '豆包',
      patterns: ['doubao.com', 'www.doubao.com'],
      selectors: {
        newChat: [
          'div[data-testid="new_chat_button"]',
          'button[data-testid="new_chat_button"]',
        ],
        input: [
          'textarea[data-testid="chat_input_input"]',
          '[data-testid="chat_input_input"] textarea',
          '[data-testid="chat_input_input"] [contenteditable="true"]',
          'textarea[placeholder*="输入"]',
          'textarea[placeholder*="发送"]',
          'textarea[placeholder*="豆包"]',
          '[contenteditable="true"][role="textbox"]',
          '.ProseMirror[contenteditable="true"]',
          'div[contenteditable="true"]',
          'textarea',
        ],
        send: [
          'button[data-testid="chat_input_send_button"]',
          'div[data-testid="chat_input_send_button"]',
          '[data-testid="chat_input_send_button"] button',
          'button[class*="send"]',
          'div[class*="send"][role="button"]',
          'button[aria-label*="发送"]',
        ],
        imageMode: [
          'button[aria-label*="生图"]',
          'button[aria-label*="图像"]',
          'button[aria-label*="图片"]',
          'div[role="button"][aria-label*="生图"]',
          'div[role="button"][aria-label*="图像"]',
          'div[role="button"][aria-label*="图片"]',
          '[data-testid*="image"]',
        ],
      },
      newChatText: ['新建对话', '新对话', '开启新对话'],
      modeText: ['专家模型', '专家'],
      delayAfterNewChat: 1800,
      imageModeText: ['AI生图', 'AI 生图', '图像生成', '图片生成', '生成图片', '文生图', '画图'],
      requireVerifyForImage: true,
    },

    kimi: {
      name: 'Kimi',
      patterns: ['kimi.moonshot.cn', 'kimi.com'],
      selectors: {
        newChat: [
          'button[data-testid="new-chat"]',
          'button[data-testid="new_chat"]',
          'button[title*="新建"]',
          'button[title*="新对话"]',
          'button[aria-label*="新建"]',
          'button[aria-label*="新对话"]',
          'button[aria-label*="发起"]',
          'button[aria-label*="New"]',
          'a[title*="新建"]',
          'a[title*="新对话"]',
          'a[aria-label*="新建"]',
          'a[aria-label*="新对话"]',
          'a[aria-label*="New"]',
          'a[href="/chat"]',
        ],
        input: [
          '[data-lexical-editor="true"]',
          '[data-testid="chat-input"] [contenteditable="true"]',
          'div[contenteditable="true"][class*="editor"]',
          'div[contenteditable="true"][role="textbox"]',
          '.ProseMirror[contenteditable="true"]',
          'div[contenteditable="true"]',
          'textarea',
        ],
        send: [
          'button[data-testid="send-button"]',
          'button[aria-label*="发送"]',
        ],
      },
      newChatText: ['发起新对话', '新建对话', '新对话', '新建', 'New chat'],
      modeText: ['思考', 'K1', 'k1'],
      delayAfterNewChat: 1800,
      requireVerifyForImage: true,
      clearAndWriteBeforeSubmit: true,
      requireFreshChat: true,
    },
  };

  function detectPlatform() {
    const url = window.location.href;
    return Object.values(AI_PLATFORMS).find(platform =>
      platform.match ? platform.match(window.location) : platform.patterns.some(pattern => url.includes(pattern))
    ) || null;
  }

  function isExistingKimiConversation() {
    if (!hostMatches(window.location.hostname, ['kimi.moonshot.cn', 'kimi.com'])) return false;
    const route = `${window.location.pathname || ''}${window.location.hash || ''}`;
    return /(^|[#/])(chat|c)\/[^/?#]+/.test(route);
  }

  async function ensureFreshChat(platform, startedOnExistingChat) {
    if (!platform.requireFreshChat || !startedOnExistingChat) return true;
    if (!isExistingKimiConversation()) return true;
    throw new Error('Kimi new chat did not activate; stopped before sending to avoid appending to an old conversation.');
  }

  async function clickNewChat(platform) {
    const startedOnExistingChat = platform.requireFreshChat && isExistingKimiConversation();
    const button = U.find(platform.selectors.newChat) ||
      U.findVisibleByText('a,button,div[role="button"]', platform.newChatText);

    if (!button) {
      if (startedOnExistingChat) {
        throw new Error('Kimi new chat button was not found; stopped before sending to avoid appending to an old conversation.');
      }
      if (platform.newChatUrl && window.location.href !== platform.newChatUrl) {
        U.log(`${platform.name}: no new chat button found, navigating to new chat URL.`);
        window.location.href = platform.newChatUrl;
        await U.delay(platform.delayAfterNewChat + 800);
        await ensureFreshChat(platform, startedOnExistingChat);
        return true;
      }
      U.log(`${platform.name}: no new chat button found, continuing on current page.`);
      await U.delay(600);
      await ensureFreshChat(platform, startedOnExistingChat);
      return true;
    }

    U.clickEl(button);
    U.log(`${platform.name}: clicked new chat.`);
    await U.delay(platform.delayAfterNewChat);
    await ensureFreshChat(platform, startedOnExistingChat);
    return true;
  }

  async function clickOptionalMode(platform) {
    if (!platform.modeText?.length) return true;

    const modeButton = U.findVisibleByText(
      'button,div[role="button"],div[role="tab"],span,label',
      platform.modeText
    );

    if (!modeButton) return true;

    const active = modeButton.getAttribute('aria-checked') === 'true' ||
      modeButton.getAttribute('aria-pressed') === 'true' ||
      /\b(active|selected|checked)\b/i.test(modeButton.className || '');

    if (!active) {
      U.clickEl(modeButton);
      await U.delay(700);
      U.log(`${platform.name}: selected optional mode.`);
    }

    return true;
  }

  async function clickImageMode(platform) {
    const selectors = platform.selectors.imageMode || [];
    const texts = platform.imageModeText || ['AI生图', 'AI 生图', '图像生成', '图片生成', '生成图片', '文生图', '画图'];

    const button = U.findVisible(selectors) ||
      U.findVisibleByText(
        'button,div[role="button"],div[role="tab"],span,a,label',
        texts
      );

    if (!button) {
      throw new Error(`${platform.name} 未找到 AI 生图/图像生成入口`);
    }

    const active = button.getAttribute('aria-selected') === 'true' ||
      button.getAttribute('aria-pressed') === 'true' ||
      /\b(active|selected|checked)\b/i.test(button.className || '') ||
      Boolean(button.closest('[aria-selected="true"],[aria-pressed="true"],[class*="active"],[class*="selected"]'));

    if (!active) {
      U.clickEl(button);
      await U.delay(1000);
    }

    U.log(`${platform.name}: image mode selected.`);
    return true;
  }

  function isDisabled(element) {
    return !element ||
      element.disabled ||
      element.getAttribute('aria-disabled') === 'true' ||
      /\b(disabled)\b/i.test(element.className || '');
  }

  function scoreSendButton(button, input) {
    let score = 0;
    const text = `${button.textContent || ''} ${button.getAttribute('aria-label') || ''} ${button.title || ''}`;
    const rect = button.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();

    if (COMMON_SEND_TEXT.some(item => text.includes(item))) score += 10;
    if (/send|submit|arrow|paper|发送/i.test(button.outerHTML)) score += 6;
    if (rect.left >= inputRect.left - 80 && rect.top >= inputRect.top - 80) score += 3;
    if (!isDisabled(button)) score += 2;
    return score;
  }

  function findBestSendButton(platform, input) {
    const directButton = U.findVisible(platform.selectors.send);
    if (directButton && U.isVisible(directButton)) return directButton;

    const textButton = U.findVisibleByText('button,div[role="button"]', COMMON_SEND_TEXT);
    if (textButton) return textButton;

    const container = input.closest('form') ||
      input.closest('[role="form"]') ||
      input.closest('[class*="input"]') ||
      input.parentElement;

    const candidates = Array.from(U.deepQuerySelectorAll('button,div[role="button"],[data-testid*="send"],[class*="send"]', container || document))
      .filter(button => U.isVisible(button));

    return candidates
      .map(button => ({ button, score: scoreSendButton(button, input) }))
      .sort((a, b) => b.score - a.score)[0]?.button || null;
  }

  async function waitForEnabledSendButton(platform, input) {
    return U.waitFor(() => {
      const button = findBestSendButton(platform, input);
      return button && !isDisabled(button) ? button : null;
    }, 3000, 200);
  }

  function readInputValue(input) {
    return (input.value || input.textContent || '').trim();
  }

  async function clearAndWriteOnce(platform, content) {
    const input = await U.waitForVisible(() => U.findVisible(platform.selectors.input), 8000);
    if (!input) {
      throw new Error('未找到输入框');
    }
    input.dataset.ai2tabSite = platform.name;
    U.clearInput(input);
    await U.delay(120);
    U.setInput(input, content);
    await U.delay(500);
    return input;
  }

  async function waitForSendEffect(input) {
    return U.waitFor(() => {
      const value = readInputValue(input);
      const busy = document.querySelector('[aria-busy="true"],[data-loading="true"],.loading,[class*="generating"]');
      return value.length === 0 || busy ? true : null;
    }, 2500, 200);
  }

  function pressNativeEnter(input, options = {}) {
    input.focus();
    const view = input.ownerDocument?.defaultView || window;
    const eventOptions = {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
      composed: true,
      ...options,
    };
    input.dispatchEvent(new view.KeyboardEvent('keydown', eventOptions));
    input.dispatchEvent(new view.KeyboardEvent('keypress', eventOptions));
    input.dispatchEvent(new view.KeyboardEvent('keyup', eventOptions));
  }

  async function clickOrPressSend(platform, input, explicitButton = null, requireVerify = false, preferEnter = false) {
    if (preferEnter) {
      pressNativeEnter(input);
      await U.delay(700);
      if (await waitForSendEffect(input)) return true;
      U.log(`${platform.name}: Enter did not clear input, trying button fallback.`);
    }

    const button = explicitButton || await waitForEnabledSendButton(platform, input);

    if (button && !isDisabled(button)) {
      U.clickEl(button);
      await U.delay(600);
      if (await waitForSendEffect(input)) return true;
      if (!requireVerify) return true;
      U.log(`${platform.name}: button click did not clear input, trying Enter fallback.`);
    }

    if (platform.useCtrlEnter) {
      U.pressCtrlEnter(input);
    } else {
      pressNativeEnter(input);
    }
    await U.delay(600);
    return requireVerify ? Boolean(await waitForSendEffect(input)) : true;
  }

  async function submitQwen(platform, input) {
    const qwenButton = await U.waitFor(() => {
      const button = U.findVisible([
        'div.omni-button-content button.ant-btn-primary',
        'div.omni-button-content button',
        'button.ant-btn-primary',
        'button[type="submit"]',
      ]);
      return button && !isDisabled(button) ? button : null;
    }, 3500, 200);

    if (await clickOrPressSend(platform, input, qwenButton, true, true)) {
      U.log('通义千问: Qwen submit verified.');
      return true;
    }

    throw new Error('通义/Qwen 输入已填入，但发送后输入框未清空；可能未触发发送按钮');
  }

  async function submitDoubao(platform, input) {
    const doubaoButton = await U.waitFor(() => {
      const button = U.findVisible([
        'button[data-testid="chat_input_send_button"]',
        '[data-testid="chat_input_send_button"] button',
        'div[data-testid="chat_input_send_button"]',
        'button[aria-label*="发送"]',
        'button[type="submit"]',
      ]);
      return button && !isDisabled(button) ? button : null;
    }, 3500, 200);

    if (await clickOrPressSend(platform, input, doubaoButton, true, true)) {
      U.log('豆包: Doubao submit verified.');
      return true;
    }

    throw new Error('豆包输入已填入，但发送后输入框未清空；可能未触发发送按钮');
  }

  async function fillAndSend(platform, content, mode) {
    if (mode === 'image' && platform.imageModeText) {
      await clickImageMode(platform);
    }

    const input = await U.waitForVisible(() => U.findVisible(platform.selectors.input), 8000);
    if (!input) {
      throw new Error('未找到输入框');
    }

    const finalContent = mode === 'image'
      ? `请生成图片：${content}`
      : content;

    let submitInput = input;
    if (platform.clearAndWriteBeforeSubmit) {
      submitInput = await clearAndWriteOnce(platform, finalContent);
    } else {
      input.dataset.ai2tabSite = platform.name;
      U.setInput(input, finalContent);
      await U.delay(700);
    }

    if (platform.name === '通义千问') {
      return submitQwen(platform, submitInput);
    }

    if (platform.name === '豆包') {
      return submitDoubao(platform, submitInput);
    }

    const sent = await clickOrPressSend(platform, submitInput, null, mode === 'image' && platform.requireVerifyForImage);
    if (!sent) {
      throw new Error('输入已填入，但发送后未检测到输入框清空或生成状态');
    }

    U.log(`${platform.name}: message dispatched and verified.`);
    return true;
  }

  async function handlePlatformAction(content, mode, platform) {
    U.log(`${platform.name}: start ${mode} action.`);
    if (!(mode === 'image' && platform.skipNewChatForImage)) {
      await clickNewChat(platform);
    }
    await clickOptionalMode(platform);
    return fillAndSend(platform, content, mode);
  }

  function handleMessage(message, sender, sendResponse) {
    const platform = detectPlatform();
    if (!platform) {
      sendResponse({ success: false, error: '当前页面不是已支持的 AI 站点' });
      return true;
    }

    if (message.action === 'sendMessage') {
      handlePlatformAction(message.content || '', 'text', platform)
        .then(() => sendResponse({ success: true, platform: platform.name }))
        .catch(error => {
          U.error(`${platform.name}: send failed`, error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }

    if (message.action === 'generateImage') {
      const content = `${message.prompt || ''}，尺寸：${message.size || '1024x1024'}`;
      handlePlatformAction(content, 'image', platform)
        .then(() => sendResponse({ success: true, platform: platform.name }))
        .catch(error => {
          U.error(`${platform.name}: image request failed`, error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }

    if (message.action === 'ping') {
      sendResponse({ success: true, platform: platform.name });
      return true;
    }

    return false;
  }

  window.__AI2TAB_HANDLE_MESSAGE__ = handleMessage;

  if (!window.__AI2TAB_PROXY_LISTENER_INSTALLED__) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (typeof window.__AI2TAB_HANDLE_MESSAGE__ !== 'function') {
        sendResponse({ success: false, error: 'AI2tab handler is not ready' });
        return false;
      }
      return window.__AI2TAB_HANDLE_MESSAGE__(message, sender, sendResponse);
    });
    window.__AI2TAB_PROXY_LISTENER_INSTALLED__ = true;
  }

  U.log(`Content script ${CONTENT_VERSION} loaded for`, detectPlatform()?.name || window.location.href);
})();
