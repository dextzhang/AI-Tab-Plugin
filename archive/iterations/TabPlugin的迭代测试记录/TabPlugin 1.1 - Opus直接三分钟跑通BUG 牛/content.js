chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'sendMessage') {
    sendResponse({ success: handleSendMessage(message.content) });
  } else if (message.action === 'generateImage') {
    sendResponse({ success: handleGenerateImage(message.prompt, message.size) });
  }
});

function findElement(selectors) {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

function setInput(textarea, value) {
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype, 'value'
  ).set;
  nativeSetter.call(textarea, value);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));
}

function pressEnter(el) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
  el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
}

function getSiteConfig() {
  const url = window.location.href;
  if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) {
    return {
      id: 'chatgpt',
      inputSelectors: ['#prompt-textarea', "textarea[placeholder*='Message']", "textarea[data-id='root']", 'textarea'],
      buttonSelectors: ["button[data-testid='send-button']", "button[aria-label*='Send']", "button[type='submit']"],
    };
  }
  if (url.includes('doubao.com')) {
    return {
      id: 'doubao',
      inputSelectors: ["textarea[placeholder*='输入']", "textarea[placeholder*='发送']", 'textarea'],
      buttonSelectors: ["button[aria-label='发送']", "button[data-testid*='send']", "button[type='submit']"],
    };
  }
  if (url.includes('gemini.google.com')) {
    return {
      id: 'gemini',
      inputSelectors: [".ql-editor[contenteditable='true']", "textarea[placeholder*='Message']", 'textarea'],
      buttonSelectors: ["button[aria-label='Send message']", "button[aria-label*='Send']", "button[type='submit']"],
    };
  }
  if (url.includes('x.ai') || url.includes('grok.com')) {
    return {
      id: 'grok',
      inputSelectors: ["textarea[placeholder*='Ask']", "textarea[placeholder*='Message']", 'textarea'],
      buttonSelectors: ["button[aria-label='Send']", "button[aria-label*='Send']", "button[type='submit']"],
    };
  }
  if (url.includes('tongyi.aliyun.com')) {
    return {
      id: 'tongyi',
      inputSelectors: ["textarea[placeholder*='输入']", "textarea[data-testid]", 'textarea'],
      buttonSelectors: ["button[aria-label='发送']", "button[data-testid*='send']", "button[type='submit']"],
    };
  }
  if (url.includes('kimi.moonshot.cn')) {
    return {
      id: 'kimi',
      inputSelectors: ["[contenteditable='true']", "textarea[placeholder*='输入']", 'textarea'],
      buttonSelectors: ["button[aria-label='发送']", "button[data-testid*='send']", "button[type='submit']"],
    };
  }
  return null;
}

function fillAndSend(config, text) {
  const input = findElement(config.inputSelectors);
  if (!input) return false;

  if (input.tagName === 'TEXTAREA') {
    setInput(input, text);
  } else {
    input.focus();
    input.textContent = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  pressEnter(input);

  setTimeout(() => {
    const button = findElement(config.buttonSelectors);
    if (button) {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }
  }, 300);

  return true;
}

function handleSendMessage(content) {
  const config = getSiteConfig();
  if (!config) return false;
  return fillAndSend(config, content);
}

function handleGenerateImage(prompt, size) {
  const config = getSiteConfig();
  if (!config) return false;

  const supportedIds = ['chatgpt', 'gemini', 'kimi'];
  if (!supportedIds.includes(config.id)) return false;

  const localizedPrompt = config.id === 'kimi'
    ? `请生成一张图片，描述：${prompt}，尺寸：${size}`
    : `Generate an image: ${prompt}, size: ${size}`;

  return fillAndSend(config, localizedPrompt);
}
