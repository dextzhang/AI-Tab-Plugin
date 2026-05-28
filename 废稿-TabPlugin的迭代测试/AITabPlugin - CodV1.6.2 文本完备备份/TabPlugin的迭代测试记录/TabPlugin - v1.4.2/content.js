(function() {
  if (window._tabPluginContentLoaded) {
    return;
  }
  window._tabPluginContentLoaded = true;

  const AI_PLATFORMS = {
    CHATGPT: {
      name: 'ChatGPT',
      patterns: ['chatgpt.com', 'chat.openai.com'],
      selectors: {
        newChat: [
          'a[data-testid="create-new-chat-button"]',
          'button[data-testid="create-new-chat-button"]',
          'nav a[href="/"]',
          'a[href="/"]'
        ],
        input: [
          '#prompt-textarea',
          'div[contenteditable="true"][id="prompt-textarea"]',
          'textarea[placeholder*="Message"]',
          'textarea'
        ],
        send: [
          'button[data-testid="send-button"]',
          'button[aria-label*="Send"]',
          'button[aria-label*="发送"]'
        ]
      },
      newChatText: ['New chat', '新对话', '新聊天'],
      delayAfterNewChat: 2000
    },
    DOUBAN: {
      name: '豆包',
      patterns: ['doubao.com', 'www.doubao.com'],
      selectors: {
        newChat: [
          'div[data-testid="new_chat_button"]',
          'button[data-testid="new_chat_button"]'
        ],
        modelTrigger: [
          'div[data-testid="model_selector"]',
          'div[data-testid="bot-selector"]'
        ],
        input: [
          'textarea[data-testid="chat_input_input"]',
          'textarea[placeholder*="输入"]',
          'textarea[placeholder*="发送"]',
          'div[contenteditable="true"]',
          'textarea'
        ],
        send: [
          'button[data-testid="chat_input_send_button"]',
          'button[aria-label="发送"]',
          'div[data-testid="chat_input_send_button"]'
        ]
      },
      newChatText: ['新建对话', '新对话', '开启新对话'],
      modelText: ['模型', '豆包', '选择模型'],
      expertText: ['专家模型', '专家'],
      delayAfterNewChat: 2500,
      needSelectModel: true
    },
    TONGYI: {
      name: '通义千问',
      patterns: ['tongyi.aliyun.com'],
      selectors: {
        newChat: [
          'button[data-testid="new-chat"]',
          'div[data-testid="new-chat"]'
        ],
        deepThink: ['div[data-testid="deep-think"]'],
        input: [
          'textarea[data-testid="chat-input"]',
          'textarea[placeholder*="输入"]',
          'div[contenteditable="true"]',
          'textarea'
        ],
        send: [
          'button[data-testid="chat-send"]',
          'button[aria-label="发送"]'
        ]
      },
      newChatText: ['新建对话', '新对话', '开启新对话', '新建'],
      thinkText: ['深度思考'],
      delayAfterNewChat: 2500,
      needDeepThink: true
    },
    KIMI: {
      name: 'Kimi',
      patterns: ['kimi.moonshot.cn'],
      selectors: {
        newChat: [
          'button[data-testid="new-chat"]',
          'a[href="/chat"]'
        ],
        modelTrigger: [
          'div[data-testid="model-selector"]',
          'button[data-testid="model-selector"]'
        ],
        input: [
          '[data-testid="chat-input"] [contenteditable="true"]',
          'div[contenteditable="true"][class*="editor"]',
          'div[contenteditable="true"]',
          'textarea'
        ],
        send: [
          'button[data-testid="send-button"]',
          'button[aria-label="发送"]'
        ]
      },
      newChatText: ['发起新对话', '新建对话', '新对话'],
      modelText: ['模型', 'Kimi', 'K1', 'k1'],
      thinkText: ['思考', 'K1'],
      delayAfterNewChat: 2500,
      needSelectModel: true
    },
    GEMINI: {
      name: 'Gemini',
      patterns: ['gemini.google.com'],
      selectors: {
        newChat: [
          'a[data-test-id="new-chat"]',
          'button[data-test-id="new-chat"]',
          'a[href="/app"]'
        ],
        modelTrigger: [
          'button[data-test-id="model-selector"]',
          'mat-select[data-test-id="model-selector"]'
        ],
        input: [
          '.ql-editor[contenteditable="true"]',
          'div[contenteditable="true"][aria-label*="prompt"]',
          'div[contenteditable="true"][role="textbox"]',
          'div[contenteditable="true"]',
          'textarea'
        ],
        send: [
          'button[aria-label="Send message"]',
          'button[aria-label*="Send"]',
          'button[data-test-id="send-button"]'
        ]
      },
      newChatText: ['New chat', '新聊天'],
      modelText: ['Gemini', 'Flash', 'model', '模型'],
      proText: ['Pro'],
      delayAfterNewChat: 2500,
      needSelectModel: true,
      useCtrlEnter: true
    },
    GROK: {
      name: 'Grok',
      patterns: ['x.ai', 'grok.com'],
      selectors: {
        newChat: [
          'a[href="/chat"]',
          'button[data-testid="new-chat"]'
        ],
        expertBtn: [],
        input: [
          'textarea[placeholder*="Ask"]',
          'textarea[placeholder*="Message"]',
          'div[contenteditable="true"]',
          'textarea'
        ],
        send: [
          'button[aria-label="Send"]',
          'button[aria-label*="Send"]',
          'button[data-testid="send-button"]'
        ]
      },
      newChatText: ['New chat', 'New conversation', '新对话'],
      expertText: ['Expert', 'Think', 'DeepSearch'],
      delayAfterNewChat: 2500,
      needSelectExpert: true
    }
  };

  function detectPlatform() {
    const url = window.location.href;
    for (const key in AI_PLATFORMS) {
      const platform = AI_PLATFORMS[key];
      if (platform.patterns.some(p => url.includes(p))) {
        console.log('[TabPlugin] Detected platform:', platform.name, 'URL:', url);
        return platform;
      }
    }
    console.log('[TabPlugin] Unknown platform, URL:', url);
    return null;
  }

  async function createNewChat(platform) {
    const { selectors, newChatText, delayAfterNewChat } = platform;
    let btn = TabPluginUtils.find(selectors.newChat) || 
              TabPluginUtils.findByText('a,button', newChatText);
    
    if (btn) {
      TabPluginUtils.clickEl(btn);
      console.log(`[TabPlugin] Clicked new chat button for ${platform.name}`);
      await TabPluginUtils.delay(delayAfterNewChat);
      return true;
    }
    console.log(`[TabPlugin] No new chat button found for ${platform.name}, may already be in new chat`);
    await TabPluginUtils.delay(1000);
    return true;
  }

  async function selectModel(platform) {
    if (!platform.needSelectModel) return true;

    const { selectors, modelText, expertText, thinkText, proText } = platform;
    
    if (platform.name === '豆包') {
      let modelTrigger = TabPluginUtils.find(selectors.modelTrigger) || 
                         TabPluginUtils.findVisibleByText('button,div[role="button"],div[class*="model"],div[class*="selector"],span[class*="model"]', modelText);
      if (modelTrigger) {
        TabPluginUtils.clickEl(modelTrigger);
        await TabPluginUtils.delay(1000);
        const expertOpt = TabPluginUtils.findByText('div,li,button,span,p', expertText);
        if (expertOpt) {
          TabPluginUtils.clickEl(expertOpt);
          await TabPluginUtils.delay(1000);
          console.log('[TabPlugin] Selected 专家模型');
          return true;
        }
      }
      const directExpert = TabPluginUtils.findVisibleByText('div[role="tab"],button,div[role="button"],span', expertText);
      if (directExpert) {
        TabPluginUtils.clickEl(directExpert);
        await TabPluginUtils.delay(800);
        console.log('[TabPlugin] Selected 专家 model (direct)');
        return true;
      }
    }

    if (platform.name === 'Kimi') {
      let modelTrigger = TabPluginUtils.find(selectors.modelTrigger) || 
                         TabPluginUtils.findVisibleByText('button,div[role="button"],div[class*="model"],span[class*="model"]', modelText);
      if (modelTrigger) {
        TabPluginUtils.clickEl(modelTrigger);
        await TabPluginUtils.delay(1000);
        const thinkOpt = TabPluginUtils.findByText('div,li,button,span,p', thinkText);
        if (thinkOpt) {
          TabPluginUtils.clickEl(thinkOpt);
          await TabPluginUtils.delay(1000);
          console.log('[TabPlugin] Selected Kimi 思考模式');
          return true;
        }
      }
      const directThink = TabPluginUtils.findVisibleByText('button,div[role="button"],div[role="tab"],span', thinkText);
      if (directThink) {
        TabPluginUtils.clickEl(directThink);
        await TabPluginUtils.delay(800);
        console.log('[TabPlugin] Selected Kimi 思考模式 (direct)');
        return true;
      }
    }

    if (platform.name === 'Gemini') {
      let modelTrigger = TabPluginUtils.find(selectors.modelTrigger) || 
                         TabPluginUtils.findVisibleByText('button,div[role="button"],div[role="listbox"],mat-select,span[class*="model"]', modelText);
      if (modelTrigger) {
        TabPluginUtils.clickEl(modelTrigger);
        await TabPluginUtils.delay(1000);
        const proOpt = TabPluginUtils.findByText('mat-option,li,div[role="option"],button,span', proText);
        if (proOpt) {
          TabPluginUtils.clickEl(proOpt);
          await TabPluginUtils.delay(1000);
          console.log('[TabPlugin] Selected Gemini Pro');
          return true;
        }
      }
    }

    return true;
  }

  async function enableDeepThink(platform) {
    if (!platform.needDeepThink) return true;

    const { selectors, thinkText } = platform;
    const toggle = TabPluginUtils.find(selectors.deepThink) || 
                   TabPluginUtils.findVisibleByText('button,div[role="button"],div[role="switch"],span,label,div[class*="think"],div[class*="mode"]', thinkText);
    
    if (toggle) {
      const isActive = toggle.classList.contains('active') ||
                       toggle.getAttribute('aria-checked') === 'true' ||
                       toggle.getAttribute('aria-pressed') === 'true' ||
                       toggle.closest('[class*="active"]');
      if (!isActive) {
        TabPluginUtils.clickEl(toggle);
        await TabPluginUtils.delay(1000);
        console.log('[TabPlugin] Enabled 深度思考');
        return true;
      }
    }
    return true;
  }

  async function selectExpert(platform) {
    if (!platform.needSelectExpert) return true;

    const { expertText } = platform;
    const expertBtn = TabPluginUtils.findVisibleByText('button,div[role="tab"],div[role="button"],a,span', expertText);
    if (expertBtn) {
      TabPluginUtils.clickEl(expertBtn);
      await TabPluginUtils.delay(1000);
      console.log('[TabPlugin] Selected Expert mode');
      return true;
    }
    return true;
  }

  async function fillAndSend(platform, content, mode) {
    const { selectors, useCtrlEnter } = platform;
    
    const input = await TabPluginUtils.waitFor(() => TabPluginUtils.find(selectors.input), 5000);
    if (!input) {
      console.error('[TabPlugin] Input element not found');
      return false;
    }

    if (mode === 'image') {
      content = `请生成一张图片：${content}`;
      console.log('[TabPlugin] Image generation mode');
    }

    TabPluginUtils.setInput(input, content);
    await TabPluginUtils.delay(600);

    const sendBtn = TabPluginUtils.find(selectors.send) || 
                    TabPluginUtils.findVisibleByText('button,div[role="button"]', ['发送']);
    
    if (sendBtn && !sendBtn.disabled) {
      TabPluginUtils.clickEl(sendBtn);
    } else if (useCtrlEnter) {
      TabPluginUtils.pressCtrlEnter(input);
    } else {
      TabPluginUtils.pressEnter(input);
    }

    await TabPluginUtils.delay(500);
    console.log(`[TabPlugin] Message sent to ${platform.name}`);
    return true;
  }

  async function handlePlatformAction(content, mode, platform) {
    try {
      console.log(`[TabPlugin] Starting action for ${platform.name}, mode: ${mode}, content: ${content.substring(0, 50)}...`);
      
      await createNewChat(platform);
      
      if (platform.needSelectModel) {
        await selectModel(platform);
      }
      
      if (platform.needDeepThink) {
        await enableDeepThink(platform);
      }
      
      if (platform.needSelectExpert) {
        await selectExpert(platform);
      }
      
      const success = await fillAndSend(platform, content, mode);
      console.log(`[TabPlugin] Action completed for ${platform.name}, success: ${success}`);
      return success;
    } catch (e) {
      console.error(`[TabPlugin] Action failed for ${platform.name}:`, e);
      return false;
    }
  }

  function handleMessage(message, sender, sendResponse) {
    console.log('[TabPlugin] Received message:', message.action);
    
    if (message.action === 'sendMessage') {
      const platform = detectPlatform();
      if (!platform) {
        console.error('[TabPlugin] Unknown platform');
        sendResponse({ success: false, error: 'Unknown platform' });
        return true;
      }
      handlePlatformAction(message.content, 'text', platform)
        .then(ok => sendResponse({ success: ok }))
        .catch(e => {
          console.error('[TabPlugin] Exception:', e);
          sendResponse({ success: false, error: e.message });
        });
      return true;
    }
    
    if (message.action === 'generateImage') {
      const platform = detectPlatform();
      if (!platform) {
        console.error('[TabPlugin] Unknown platform for image generation');
        sendResponse({ success: false, error: 'Unknown platform' });
        return true;
      }
      const imgContent = `${message.prompt}，尺寸：${message.size}`;
      handlePlatformAction(imgContent, 'image', platform)
        .then(ok => sendResponse({ success: ok }))
        .catch(e => {
          console.error('[TabPlugin] Image generation exception:', e);
          sendResponse({ success: false, error: e.message });
        });
      return true;
    }

    if (message.action === 'ping') {
      sendResponse({ success: true, platform: detectPlatform()?.name });
      return true;
    }
  }

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener(handleMessage);
    console.log('[TabPlugin] Content script loaded, waiting for messages...');
  } else {
    console.error('[TabPlugin] Chrome runtime not available');
  }
})();
