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
          '.ql-editor[contenteditable="true"]',
          'rich-textarea div[contenteditable="true"]',
          'div[role="textbox"][contenteditable="true"]',
          'div[contenteditable="true"]',
          'textarea',
        ],
        send: [
          'button[aria-label="Send message"]',
          'button[aria-label*="Send"]',
          'button[aria-label*="发送"]',
          'button[data-test-id="send-button"]',
        ],
      },
      newChatText: ['New chat', '新聊天', '新对话'],
      sendText: ['Send', '发送'],
      submitKeys: [{ key: 'Enter', ctrlKey: true }, { key: 'Enter' }],
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
      forceFreshChatForText: true,
      selectors: {
        newChat: [
          'div[data-testid="new_chat_button"]',
          'button[data-testid="new_chat_button"]',
          'button[aria-label*="新建"]',
          'button[aria-label*="新对话"]',
        ],
        input: [
          'textarea[data-testid="chat_input_input"]',
          '[data-testid="chat_input_input"] textarea',
          '[data-testid="chat_input_input"] [contenteditable="true"]',
          'textarea[placeholder*="输入"]',
          'textarea[placeholder*="发送"]',
          'textarea[placeholder*="豆包"]',
          '.ProseMirror[contenteditable="true"]',
          '[contenteditable="true"][role="textbox"]',
          'div[contenteditable="true"]',
          'textarea',
        ],
        send: [
          'button[data-testid="chat_input_send_button"]',
          'div[data-testid="chat_input_send_button"]',
          '[data-testid="chat_input_send_button"] button',
          'button[aria-label*="发送"]',
          'button[type="submit"]',
        ],
      },
      newChatText: ['新建对话', '新对话', '开启新对话', 'New chat'],
      sendText: ['发送', 'Send'],
      preferEnter: true,
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

  const IMAGE_SITE_IDS = ['chatgpt', 'gemini', 'grok', 'qwen', 'doubao', 'kimi'];

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
      .filter(site => IMAGE_SITE_IDS.includes(site.id))
      .some(site => site.imageMatch ? site.imageMatch(parsed) || matchesSite(site, parsed) : matchesSite(site, parsed));
  }

  root.AI2TAB_SITE_CONFIG = {
    sites: SITE_DEFINITIONS,
    imageSiteIds: IMAGE_SITE_IDS,
    parseUrl,
    hostMatches,
    pathStartsWith,
    matchesSite,
    getSiteByUrl,
    isTextSite,
    isImageSite,
  };
})(globalThis);
