(function(root) {
  const SITE_DEFINITIONS = [
    {
      id: 'chatgpt',
      name: 'ChatGPT',
      domains: ['chatgpt.com', 'chat.openai.com'],
      freshUrls: ['https://chatgpt.com/', 'https://chat.openai.com/'],
      newChatShortcut: { key: 'o', ctrlKey: true, shiftKey: true },
      selectors: {
        newChat: [
          'a[data-testid="create-new-chat-button"]',
          'button[data-testid="create-new-chat-button"]',
          'a[aria-label*="New chat"]',
          'button[aria-label*="New chat"]',
          'nav a[href="/"]',
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
      },
      newChatText: ['New chat', '新聊天', '新对话'],
      sendText: ['Send', '发送'],
      inputStrategy: 'default',
      supportsImage: true,
      modeStrategy: 'menu',
      modeTriggerTexts: ['进阶', 'Instant', 'Thinking', '切换模型'],
      modeOptions: [
        { value: 'normal', label: '普通', texts: ['Instant'] },
        { value: 'advanced', label: '进阶', texts: ['Thinking', '进阶'] },
      ],
      defaultMode: 'normal',
      delayAfterFreshChat: 1200,
    },
    {
      id: 'gemini',
      name: 'Gemini',
      domains: ['gemini.google.com'],
      freshUrls: ['https://gemini.google.com/app'],
      selectors: {
        newChat: [
          'a[data-test-id="new-chat"]',
          'button[data-test-id="new-chat"]',
          'a[aria-label*="New chat"]',
          'button[aria-label*="New chat"]',
          'a[href="/app"]',
        ],
        input: [
          'div[contenteditable="true"][aria-label*="Enter a prompt"]',
          'div[contenteditable="true"][aria-label*="输入提示"]',
          'div[contenteditable="true"][aria-label*="Send a prompt"]',
          'div[contenteditable="true"][aria-label*="prompt"]',
          '.ql-editor[contenteditable="true"]',
          'rich-textarea div[contenteditable="true"]',
          'div[role="textbox"][contenteditable="true"]',
          'div[contenteditable="true"][data-placeholder]',
          'div.ql-editor',
          'div[contenteditable="true"]',
          'textarea',
        ],
        send: [
          'button[aria-label="Send message"]',
          'button[aria-label="Send prompt"]',
          'button[aria-label*="Send"]',
          'button[aria-label*="发送"]',
          'button[data-test-id="send-button"]',
          'button.send-button',
          'button[class*="send"]',
        ],
      },
      newChatText: ['New chat', '新聊天', '新对话'],
      sendText: ['Send', '发送'],
      inputStrategy: 'geminiEditable',
      supportsImage: true,
      preferEnter: true,
      submitKeys: [{ key: 'Enter' }, { key: 'Enter', ctrlKey: true }],
      modeStrategy: 'menu',
      modeTriggerTexts: ['快速', '思考', 'Pro', 'Gemini'],
      modeOptions: [
        { value: 'fast', label: '快速', texts: ['快速'] },
        { value: 'thinking', label: '思考', texts: ['思考'] },
        { value: 'pro', label: 'Pro', texts: ['Pro'] },
      ],
      defaultMode: 'fast',
      delayAfterFreshChat: 1500,
    },
    {
      id: 'grok',
      name: 'Grok',
      domains: ['grok.com', 'x.ai'],
      extraMatch: url => hostMatches(url.hostname, ['x.com']) && pathStartsWith(url.pathname, ['/i/grok', '/grok']),
      imageMatch: url => hostMatches(url.hostname, ['grok.com']) && pathStartsWith(url.pathname, ['/imagine']),
      freshUrls: ['https://grok.com/chat', 'https://x.ai/'],
      forceFreshChatForText: true,
      selectors: {
        newChat: [
          'a[href="/chat"]',
          'button[data-testid="new-chat"]',
          'a[aria-label*="New"]',
          'button[aria-label*="New"]',
        ],
        input: [
          'textarea[placeholder*="Ask"]',
          'textarea[placeholder*="Message"]',
          'textarea[placeholder*="Describe"]',
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
      sendText: ['Send'],
      inputStrategy: 'default',
      supportsImage: true,
      modeStrategy: 'menu',
      modeTriggerTexts: ['Grok 4.3', 'Grok 4', 'Auto', 'Fast', 'Expert', 'Heavy'],
      modeOptions: [
        { value: 'auto', label: 'Auto', texts: ['Auto'] },
        { value: 'fast', label: 'Fast', texts: ['Fast'] },
        { value: 'expert', label: 'Expert', texts: ['Expert'] },
        { value: 'beta', label: 'Grok 4.3', texts: ['Grok 4.3', 'Grok 4'] },
      ],
      defaultMode: 'auto',
      skipFreshChatForImage: true,
      verifySendEffectForImage: true,
      delayAfterFreshChat: 1300,
    },
    {
      id: 'qwen',
      name: '千问/Qwen',
      domains: ['tongyi.aliyun.com', 'qianwen.aliyun.com', 'qianwen.com', 'qwen.ai'],
      freshUrls: [
        'https://tongyi.aliyun.com/qianwen/',
        'https://qianwen.com/',
        'https://chat.qwen.ai/',
      ],
      selectors: {
        newChat: [
          'button[data-testid="new-chat"]',
          'div[data-testid="new-chat"]',
          'button[aria-label*="新建"]',
          'button[aria-label*="新对话"]',
        ],
        input: [
          'textarea.message-input-textarea',
          'textarea[data-testid="chat-input"]',
          'textarea[placeholder*="输入"]',
          'textarea[placeholder*="问"]',
          'textarea[placeholder*="帮"]',
          'div[role="textbox"][contenteditable="true"]',
          '[contenteditable="true"][role="textbox"]',
          'div[contenteditable="true"]',
          'textarea',
        ],
        send: [
          'div.omni-button-content button.ant-btn-primary',
          'div.omni-button-content button',
          'button.ant-btn-primary',
          'button[data-testid="chat-send"]',
          'button[aria-label*="发送"]',
          'button[type="submit"]',
        ],
      },
      newChatText: ['新建对话', '新对话', '开启新对话', '新建', 'New chat'],
      sendText: ['发送', 'Send'],
      inputStrategy: 'reactNativeSetter',
      supportsImage: true,
      clearBeforeSubmit: true,
      submitKeys: [{ key: 'Enter', ctrlKey: true }, { key: 'Enter' }],
      requireSendEffect: false,
      modeStrategy: 'toggle',
      modeTriggerTexts: ['思考'],
      modeOptions: [
        { value: 'normal', label: '普通', texts: ['思考'], desiredActive: false },
        { value: 'thinking', label: '思考', texts: ['思考'], desiredActive: true },
      ],
      defaultMode: 'normal',
      delayAfterFreshChat: 1600,
    },
    {
      id: 'doubao',
      name: '豆包',
      domains: ['doubao.com'],
      freshUrls: ['https://www.doubao.com/chat/'],
      forceFreshChatForText: false,
      selectors: {
        newChat: [
          'a[href="/chat/"]',
          'a[href="https://www.doubao.com/chat/"]',
          'a[href*="/chat/"][aria-label*="新"]',
          'button[title*="新对话"]',
          'a[title*="新对话"]',
          'div[data-testid="new_chat_button"]',
          'button[data-testid="new_chat_button"]',
          'button[aria-label*="新建"]',
          'button[aria-label*="新对话"]',
        ],
        input: [
          'textarea[data-testid="chat_input_input"]',
          '[data-testid="chat_input_input"] textarea',
          'textarea[placeholder*="输入"]',
          'textarea[placeholder*="发送"]',
          'textarea[placeholder*="豆包"]',
          'textarea',
        ],
        send: [
          'button[id^="flow-end-msg-send"]',
          '[id^="flow-end-msg-send"] button',
          '[id^="flow-end-msg-send"]',
          'button[data-testid="chat_input_send_button"]',
          'div[data-testid="chat_input_send_button"]',
          '[data-testid="chat_input_send_button"] button',
          'button[aria-label*="发送"]',
          'button[type="submit"]',
        ],
      },
      newChatText: ['新建对话', '新对话', '开启新对话', 'New chat'],
      sendText: ['发送', 'Send'],
      inputStrategy: 'clearThenInput',
      supportsImage: true,
      preferEnter: false,
      requireSendEffect: true,
      modeStrategy: 'menu',
      modeTriggerTexts: ['快速', '思考', '专家'],
      modeOptions: [
        { value: 'fast', label: '快速', texts: ['快速'] },
        { value: 'thinking', label: '思考', texts: ['思考'] },
        { value: 'expert', label: '专家', texts: ['专家'] },
      ],
      defaultMode: 'fast',
      delayAfterFreshChat: 1600,
      customRunAction: function(content, mode, platform, preference) {
        return doubao_runAction(content, mode, platform, preference);
      },
    },
    {
      id: 'kimi',
      name: 'Kimi',
      domains: ['kimi.moonshot.cn', 'kimi.com'],
      freshUrls: ['https://www.kimi.com/', 'https://kimi.moonshot.cn/'],
      isExistingConversation: url => /(^|[#/])(chat|c)\/[^/?#]+/.test(`${url.pathname || ''}${url.hash || ''}`),
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
          'button[aria-label*="Send"]',
        ],
      },
      newChatText: ['发起新对话', '新建对话', '新对话', '新建', 'New chat'],
      sendText: ['发送', 'Send'],
      inputStrategy: 'reactNativeSetter',
      supportsImage: true,
      clearBeforeSubmit: true,
      requireFreshChat: true,
      requireSendEffect: true,
      modeStrategy: 'menu',
      modeTriggerTexts: ['K2.6 快速', 'K2.6 思考', 'K2.6', '快速', '思考'],
      modeOptions: [
        { value: 'fast', label: 'K2.6 快速', texts: ['K2.6 快速', '快速响应'] },
        { value: 'thinking', label: 'K2.6 思考', texts: ['K2.6 思考', '多轮搜索思考'] },
      ],
      defaultMode: 'fast',
      delayAfterFreshChat: 1600,
    },
  ];

  const doubao_TIMING = {
    AFTER_CLEAR: 120,
    AFTER_SET: 550,
    AFTER_SUBMIT: 700,
    AFTER_FRESH_NAV: 900,
    AFTER_TOGGLE: 500,
    AFTER_MENU_CLICK: 550,
    AFTER_MODE_SELECT: 700,
  };

  function doubao_isDisabled(element) {
    return !element ||
      element.disabled ||
      element.getAttribute('aria-disabled') === 'true' ||
      /\b(disabled)\b/i.test(element.className || '');
  }

  function doubao_readInputValue(input) {
    return (input?.value || input?.textContent || '').trim();
  }

  function doubao_compactText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 90);
  }

  function doubao_getSelectedMode(platform, preference) {
    const selected = preference.mode || platform.defaultMode || platform.modeOptions?.[0]?.value;
    if (!selected || selected === 'current') {
      return { value: 'current', label: '当前页面模型', skipSelection: true };
    }
    const options = [
      ...(platform.modeOptions || []),
      ...(Array.isArray(preference.customModeOptions) ? preference.customModeOptions : []),
    ];
    return options.find(option => option.value === selected) || null;
  }

  function doubao_dispatchInputEvents(element, value) {
    const view = element.ownerDocument?.defaultView || window;
    try {
      element.dispatchEvent(new view.InputEvent('input', {
        bubbles: true,
        cancelable: true,
        composed: true,
        inputType: 'insertText',
        data: value,
      }));
    } catch (err) {
      element.dispatchEvent(new view.Event('input', { bubbles: true, composed: true }));
    }
    element.dispatchEvent(new view.Event('change', { bubbles: true, composed: true }));
    element.dispatchEvent(new view.CompositionEvent('compositionend', { bubbles: true, data: value }));
  }

  function doubao_setInputValue(input, value) {
    const view = input.ownerDocument?.defaultView || window;
    input.focus();

    if (input.tagName !== 'TEXTAREA' && input.tagName !== 'INPUT') {
      throw new Error('豆包：未找到真实输入框，已停止以避免污染页面。');
    }

    const proto = input.tagName === 'TEXTAREA' ? view.HTMLTextAreaElement.prototype : view.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(input, '');
    else input.value = '';
    doubao_dispatchInputEvents(input, '');
    if (setter) setter.call(input, value);
    else input.value = value;
    doubao_dispatchInputEvents(input, value);
    return true;
  }

  function doubao_getInput(platform) {
    const U = window.TabPluginUtils;
    const selector = [
      'textarea[data-testid="chat_input_input"]',
      '[data-testid="chat_input_input"] textarea',
      'textarea[placeholder*="输入"]',
      'textarea[placeholder*="发送"]',
      'textarea[placeholder*="豆包"]',
      'textarea',
      'input[type="text"]',
    ].join(',');
    const candidates = Array.from(U.deepQuerySelectorAll(selector))
      .filter(element => U.isVisible(element))
      .filter(element => element.tagName === 'TEXTAREA' || element.tagName === 'INPUT')
      .map(element => {
        const rect = element.getBoundingClientRect();
        let score = 0;
        score += 20;
        if (element.matches?.('[data-testid="chat_input_input"], [data-testid="chat_input_input"] *')) score += 12;
        if (rect.width > 320) score += 8;
        if (rect.top > window.innerHeight * 0.45) score += 6;
        score += Math.max(0, rect.bottom);
        return { element, score };
      })
      .sort((a, b) => b.score - a.score);

    return candidates[0]?.element || null;
  }

  function doubao_getComposer(input) {
    return input.closest('[data-testid*="chat_input"]') ||
      input.closest('form') ||
      input.closest('[class*="input"]') ||
      input.closest('[class*="composer"]') ||
      input.parentElement ||
      document;
  }

  function doubao_modeText(value) {
    const map = {
      fast: '\u5feb\u901f',
      thinking: '\u601d\u8003',
      expert: '\u4e13\u5bb6',
    };
    return map[value] || '';
  }

  function doubao_getClickable(element) {
    return element?.closest?.('button,a,div[role="button"],[data-testid],[id^="flow-end-msg-send"]') || null;
  }

  function doubao_isFreshUrl() {
    const parsed = window.AI2TAB_SITE_CONFIG.parseUrl(window.location.href);
    if (!parsed) return false;
    return /^\/chat\/?$/.test(parsed.pathname || '/');
  }

  function doubao_getConversationSignature(input) {
    const lastUserText = Array.from(document.querySelectorAll('main *, [role="main"] *, [class*="message"] *, [class*="chat"] *'))
      .filter(element => window.TabPluginUtils.isVisible(element))
      .map(element => doubao_compactText(element.textContent))
      .filter(text => text && text.length > 12)
      .slice(-8)
      .join('|');
    return `${window.location.href}::${doubao_readInputValue(input || doubao_getInput({}) || null)}::${lastUserText}`;
  }

  async function doubao_waitForReadyInput({ beforeSignature, beforeInput, strict = false } = {}) {
    const U = window.TabPluginUtils;
    return U.waitFor(() => {
      const input = doubao_getInput({});
      if (!input || !U.isVisible(input)) return null;

      const value = doubao_readInputValue(input);
      if (!value && !strict) return input;

      const signature = doubao_getConversationSignature(input);
      const inputChanged = !beforeInput || input !== beforeInput;
      const urlLooksFresh = doubao_isFreshUrl();
      const signatureChanged = signature !== beforeSignature;

      if (!value && (inputChanged || signatureChanged || urlLooksFresh)) {
        return input;
      }

      return null;
    }, 7000, 200);
  }

  async function doubao_ensureFreshConversation(platform) {
    const U = window.TabPluginUtils;
    const beforeInput = doubao_getInput(platform);
    const beforeSignature = doubao_getConversationSignature(beforeInput);

    const freshButton = U.findVisible(platform.selectors.newChat) ||
      Array.from(U.deepQuerySelectorAll('button,a,div[role="button"],[data-testid],[aria-label],[title]'))
        .filter(element => U.isVisible(element) && !doubao_isDisabled(element))
        .map(element => {
          const signal = doubao_compactText([
            element.textContent,
            element.getAttribute('aria-label'),
            element.getAttribute('title'),
            element.getAttribute('data-testid'),
          ].join(' '));
          const rect = element.getBoundingClientRect();
          let score = 0;
          if (signal.includes('\u65b0\u5bf9\u8bdd') || signal.includes('\u65b0\u804a\u5929') || /new\s*chat/i.test(signal)) score += 40;
          if (rect.left < window.innerWidth * 0.35) score += 8;
          if (rect.top < window.innerHeight * 0.35) score += 4;
          return { element: doubao_getClickable(element), score };
        })
        .filter(item => item.element && item.score >= 35)
        .sort((a, b) => b.score - a.score)[0]?.element;

    if (freshButton) {
      U.clickEl(freshButton);
      await U.delay(platform.delayAfterFreshChat || 1600);
      const freshInput = await doubao_waitForReadyInput({ beforeSignature, beforeInput });
      if (freshInput) {
        U.log('Doubao: new-chat control opened an empty composer.');
        return freshInput;
      }
      U.log('Doubao: new-chat control did not expose a ready composer; trying fresh URL.');
    }

    const freshUrl = platform.freshUrls?.[0] || 'https://www.doubao.com/chat/';
    if (window.location.href !== freshUrl) {
      window.location.href = freshUrl;
      await U.delay((platform.delayAfterFreshChat || 1600) + doubao_TIMING.AFTER_FRESH_NAV);
      const freshInput = await doubao_waitForReadyInput({ beforeSignature, beforeInput });
      if (freshInput) {
        U.log('Doubao: fresh URL exposed an empty composer.');
        return freshInput;
      }
    }

    const fallbackInput = await U.waitForVisible(() => doubao_getInput(platform), 7000, 200);
    if (fallbackInput) {
      U.log('Doubao: new-chat confirmation failed; continuing with the currently available composer to prioritize sending.');
      return fallbackInput;
    }

    throw new Error('Doubao: no usable input box was found.');
  }

  function doubao_getActionableElement(element) {
    return element?.closest?.('button[id^="flow-end-msg-send"],button,div[role="button"],[data-testid*="send"],[aria-label*="发送"],[class*="send"]') || null;
  }

  function doubao_isSendLikeElement(element) {
    if (!element || !window.TabPluginUtils.isVisible(element) || doubao_isDisabled(element)) return false;
    const signal = [
      element.textContent,
      element.getAttribute('aria-label'),
      element.getAttribute('title'),
      element.getAttribute('data-testid'),
      element.className,
      element.innerHTML,
    ].join(' ');
    const text = doubao_compactText(signal);

    if (/快速|思考|专家|图像|PPT|视频|编程|深入研究|更多|\+/.test(text)) return false;
    if (/flow-end-msg-send|chat_input_send/i.test(signal)) return true;
    return /send|submit|arrow|up|paper|chat_input_send|发送|提交|上箭头|svg|path/i.test(signal);
  }

  function doubao_findSendButtonFromPoint(input) {
    const rect = input.getBoundingClientRect();
    const points = [
      [rect.right - 42, rect.bottom - 42],
      [rect.right - 64, rect.bottom - 42],
      [rect.right - 42, rect.bottom - 64],
      [window.innerWidth - 52, rect.bottom - 42],
    ];

    for (const [rawX, rawY] of points) {
      const x = Math.max(1, Math.min(window.innerWidth - 1, rawX));
      const y = Math.max(1, Math.min(window.innerHeight - 1, rawY));
      const element = document.elementsFromPoint(x, y)
        .map(doubao_getActionableElement)
        .find(doubao_isSendLikeElement);
      if (element) return element;
    }

    return null;
  }

  function doubao_removeSemicolonArtifacts(input) {
    const U = window.TabPluginUtils;
    const inputRect = input.getBoundingClientRect();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];

    while (walker.nextNode()) {
      const node = walker.currentNode;
      if ((node.nodeValue || '').trim() !== ';') continue;
      const parent = node.parentElement;
      if (!parent || input.contains(parent) || parent.closest('textarea,input,[contenteditable="true"]')) continue;
      const rect = parent.getBoundingClientRect();
      if (rect.left <= inputRect.left - 120 || rect.bottom >= window.innerHeight - 90 || rect.width <= 30) {
        nodes.push(node);
      }
    }

    nodes.forEach(node => {
      U.log('豆包: removed stray semicolon artifact near page chrome.');
      node.nodeValue = '';
    });
  }

  function doubao_getModeText(option) {
    return option?.texts?.[0] || option?.label || '';
  }

  function doubao_isNearComposer(element, input, extraTop = 260) {
    const rect = element.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    return rect.width > 0 &&
      rect.height > 0 &&
      rect.left >= inputRect.left - 160 &&
      rect.right <= inputRect.right + 180 &&
      rect.top >= inputRect.top - extraTop &&
      rect.bottom <= inputRect.bottom + 140;
  }

  function doubao_findModeTrigger(input) {
    const U = window.TabPluginUtils;
    const modeTexts = ['\u5feb\u901f', '\u601d\u8003', '\u4e13\u5bb6'];
    const selector = 'button,div[role="button"],[aria-haspopup],[data-testid],[class*="mode"]';
    const candidates = Array.from(U.deepQuerySelectorAll(selector))
      .filter(element => U.isVisible(element) && !doubao_isDisabled(element))
      .filter(element => doubao_isNearComposer(element, input, 180))
      .map(element => {
        const text = doubao_compactText(element.textContent || element.getAttribute('aria-label') || element.getAttribute('title'));
        const rect = element.getBoundingClientRect();
        let score = 0;
        if (modeTexts.some(modeText => text.includes(modeText))) score += 20;
        if (text.length <= 12) score += 10;
        if (!/适用于|擅长|研究级|大部分|更难/.test(text)) score += 6;
        score -= Math.abs(rect.top - input.getBoundingClientRect().bottom) / 20;
        return { element, text, score };
      })
      .filter(item => item.score > 10)
      .sort((a, b) => b.score - a.score);

    return candidates[0]?.element || null;
  }

  function doubao_findModeMenuItem(input, targetText) {
    const U = window.TabPluginUtils;
    const selector = 'button,div[role="button"],li,[role="menuitem"],[data-testid],span,div';
    const candidates = Array.from(U.deepQuerySelectorAll(selector))
      .filter(element => U.isVisible(element) && !doubao_isDisabled(element))
      .filter(element => doubao_isNearComposer(element, input, 360))
      .map(element => {
        const text = doubao_compactText(element.textContent || element.getAttribute('aria-label') || element.getAttribute('title'));
        const rect = element.getBoundingClientRect();
        let score = 0;
        if (text === targetText) score += 30;
        if (text.startsWith(targetText)) score += 24;
        if (text.includes(targetText)) score += 14;
        if (/适用于|擅长|研究级/.test(text)) score += 8;
        if (rect.width >= 120 && rect.height >= 32) score += 4;
        return { element, text, score };
      })
      .filter(item => item.score >= 18)
      .sort((a, b) => b.score - a.score);

    const item = candidates[0]?.element || null;
    return item?.closest('button,div[role="button"],li,[role="menuitem"]') || item;
  }

  function doubao_closeModeMenu(input) {
    const view = input.ownerDocument?.defaultView || window;
    document.dispatchEvent(new view.KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      which: 27,
      bubbles: true,
      cancelable: true,
      composed: true,
    }));
    document.dispatchEvent(new view.KeyboardEvent('keyup', {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      which: 27,
      bubbles: true,
      cancelable: true,
      composed: true,
    }));
    input.focus();
  }

  async function doubao_applyModePreference(platform, preference, input) {
    const U = window.TabPluginUtils;
    const option = doubao_getSelectedMode(platform, preference);
    if (!option || option.skipSelection) {
      U.log('Doubao: using current page model; mode switching skipped.');
      return true;
    }

    const targetText = doubao_modeText(option.value) || doubao_getModeText(option);
    if (!targetText) return true;

    const trigger = doubao_findModeTrigger(input);
    const currentText = doubao_compactText(trigger?.textContent || trigger?.getAttribute('aria-label') || '');
    if (currentText.includes(targetText)) {
      U.log(`Doubao: mode ${targetText} already shown in composer.`);
      return true;
    }

    if (!trigger) {
      U.log(`Doubao: mode trigger not found; keeping current mode instead of changing to ${targetText}.`);
      return false;
    }

    U.clickEl(trigger);
    await U.delay(doubao_TIMING.AFTER_MENU_CLICK);

    const item = doubao_findModeMenuItem(input, targetText);
    if (!item) {
      U.log(`Doubao: mode ${targetText} menu item not found; keeping current mode.`);
      doubao_closeModeMenu(input);
      return false;
    }
    const isUnavailable = /upgrade|subscribe|premium|plan|locked|lock|unavailable|disabled|limit|权限|升级|订阅|会员|解锁|不可用|限额/i.test([
      item.textContent,
      item.getAttribute('aria-label'),
      item.getAttribute('title'),
      item.getAttribute('data-testid'),
      item.className,
    ].join(' ').toLowerCase());
    if (isUnavailable) {
      U.log(`Doubao: mode ${targetText} appears unavailable; keeping current mode.`);
      doubao_closeModeMenu(input);
      return false;
    }

    U.clickEl(item);
    await U.delay(doubao_TIMING.AFTER_MODE_SELECT);
    doubao_closeModeMenu(input);
    U.log(`Doubao: selected mode ${targetText}.`);
    return true;
  }

  function doubao_findSendButton(platform, input) {
    const U = window.TabPluginUtils;
    const inputRect = input.getBoundingClientRect();
    const byId = U.findVisible([
      'button[id^="flow-end-msg-send"]',
      '[id^="flow-end-msg-send"] button',
      '[id^="flow-end-msg-send"]',
      'button[data-testid="chat_input_send_button"]',
      '[data-testid="chat_input_send_button"] button',
      '[data-testid="chat_input_send_button"]',
    ]);
    if (byId && !doubao_isDisabled(byId)) return doubao_getActionableElement(byId) || byId;

    const pointButton = doubao_findSendButtonFromPoint(input);
    if (pointButton) return pointButton;

    const direct = U.findVisible(platform.selectors.send);
    if (direct && !doubao_isDisabled(direct)) return direct;

    const candidates = Array.from(U.deepQuerySelectorAll(
      'button,div[role="button"],[data-testid],[aria-label],[title],[class]'
    ))
      .filter(button => U.isVisible(button) && !doubao_isDisabled(button))
      .map(button => {
        const rect = button.getBoundingClientRect();
        const signal = [
          button.textContent,
          button.getAttribute('aria-label'),
          button.getAttribute('title'),
          button.getAttribute('data-testid'),
          button.className,
          button.innerHTML,
        ].join(' ');
        const text = doubao_compactText(signal);
        const nearRight = rect.left >= inputRect.right - 260 && rect.right <= inputRect.right + 90;
        const nearBottom = rect.top >= inputRect.top - 20 && rect.bottom <= inputRect.bottom + 90;
        const compact = rect.width >= 28 && rect.width <= 90 && rect.height >= 28 && rect.height <= 90;
        let score = 0;

        if (nearRight) score += 30;
        if (nearBottom) score += 28;
        if (compact) score += 18;
        if (/flow-end-msg-send|send|submit|arrow|up|paper|chat_input_send|发送|提交|上箭头/i.test(signal)) score += 24;
        if (/svg|path|icon/i.test(signal)) score += 6;
        if (/快速|思考|专家|图像|PPT|视频|编程|深入研究|更多|\+/.test(text)) score -= 45;
        if (rect.left < inputRect.left - 30 || rect.top < inputRect.top - 80) score -= 80;

        return { button, score };
      })
      .filter(item => item.score >= 42)
      .sort((a, b) => b.score - a.score);

    return candidates[0]?.button || null;
  }

  async function doubao_submit(platform, input) {
    const U = window.TabPluginUtils;
    doubao_removeSemicolonArtifacts(input);
    const button = await U.waitFor(() => doubao_findSendButton(platform, input), 3500, 200);
    if (button && !doubao_isDisabled(button)) {
      U.clickEl(button);
      await U.delay(doubao_TIMING.AFTER_SUBMIT);
      doubao_removeSemicolonArtifacts(input);
      const isSent = await U.waitFor(() => {
        const value = doubao_readInputValue(input);
        const busy = document.querySelector('[aria-busy="true"],[data-loading="true"],.loading,[class*="generating"],[class*="pending"]');
        return value.length === 0 || busy ? true : null;
      }, 2800, 200);
      if (isSent) return true;
    }

    throw new Error('豆包输入已填入，但未找到可靠的发送按钮；已停止，避免触发页面快捷键。');
  }

  async function doubao_runAction(content, mode, platform, preference) {
    const U = window.TabPluginUtils;
    U.log(`Doubao: start ${mode} action with human-flow adapter.`);

    const input = await doubao_ensureFreshConversation(platform) ||
      await U.waitForVisible(() => doubao_getInput(platform), 9000, 200);
    if (!input) throw new Error('Doubao: input was not found.');

    const finalContent = mode === 'image'
      ? `请生成图片：${content}`
      : content;

    doubao_setInputValue(input, finalContent);
    await U.delay(doubao_TIMING.AFTER_SET);
    doubao_removeSemicolonArtifacts(input);

    const current = doubao_readInputValue(input);
    if (!current || !current.includes(finalContent.slice(0, Math.min(finalContent.length, 40)))) {
      doubao_setInputValue(input, finalContent);
      await U.delay(doubao_TIMING.AFTER_SET);
      doubao_removeSemicolonArtifacts(input);
    }

    await doubao_applyModePreference(platform, preference, input);
    await U.delay(200);
    await doubao_submit(platform, input);
    U.log('Doubao: message dispatched.');
    return true;
  }

  function parseUrl(rawUrl) {
    try {
      return new URL(rawUrl);
    } catch (error) {
      return null;
    }
  }

  function hostMatches(hostname, domains) {
    return domains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
  }

  function pathStartsWith(pathname, prefixes) {
    return prefixes.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
  }

  function matchesSite(site, rawUrl) {
    const parsed = typeof rawUrl === 'string' ? parseUrl(rawUrl) : rawUrl;
    if (!parsed) return false;
    return hostMatches(parsed.hostname, site.domains) || Boolean(site.extraMatch?.(parsed));
  }

  function getSiteByUrl(rawUrl) {
    return SITE_DEFINITIONS.find(site => matchesSite(site, rawUrl)) || null;
  }

  function isTextSite(rawUrl) {
    return Boolean(getSiteByUrl(rawUrl));
  }

  function isImageSite(rawUrl) {
    const parsed = parseUrl(rawUrl);
    if (!parsed) return false;
    return SITE_DEFINITIONS
      .filter(site => site.supportsImage)
      .some(site => site.imageMatch ? site.imageMatch(parsed) || matchesSite(site, parsed) : matchesSite(site, parsed));
  }

  root.AI2TAB_SITE_CONFIG = {
    sites: SITE_DEFINITIONS,
    parseUrl,
    hostMatches,
    pathStartsWith,
    matchesSite,
    getSiteByUrl,
    isTextSite,
    isImageSite,
  };
})(globalThis);
