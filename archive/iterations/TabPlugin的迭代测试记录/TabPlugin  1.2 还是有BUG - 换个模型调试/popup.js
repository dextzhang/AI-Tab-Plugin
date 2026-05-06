function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', function () {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      const content = document.getElementById(`${this.dataset.tab}-tab`);
      if (content) content.classList.add('active');
    });
  });
}

function loadHistory() {
  chrome.storage.local.get('messageHistory', (data) => {
    const history = data.messageHistory || [];
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    if (history.length === 0) {
      historyList.innerHTML = '<div style="color:#9ca3af;font-size:13px;text-align:center;padding:20px;">暂无历史记录</div>';
      return;
    }
    history.forEach(item => {
      const div = document.createElement('div');
      div.className = 'history-item';
      const c = document.createElement('div');
      c.textContent = item.content;
      div.appendChild(c);
      const t = document.createElement('div');
      t.className = 'history-time';
      t.textContent = item.time;
      div.appendChild(t);
      div.addEventListener('click', () => {
        document.getElementById('message').value = item.content;
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector('[data-tab="chat"]').classList.add('active');
        document.getElementById('chat-tab').classList.add('active');
      });
      historyList.appendChild(div);
    });
  });
}

function saveToHistory(content) {
  chrome.storage.local.get('messageHistory', (data) => {
    const history = data.messageHistory || [];
    history.unshift({ content, time: new Date().toLocaleString() });
    if (history.length > 5) history.pop();
    chrome.storage.local.set({ messageHistory: history }, () => loadHistory());
  });
}

function clearHistory() {
  chrome.storage.local.remove('messageHistory', () => loadHistory());
}

// ============================================================
//  站点匹配
// ============================================================
const AI_SITES = [
  { id: 'chatgpt', match: u => u.includes('chat.openai.com') || u.includes('chatgpt.com') },
  { id: 'gemini',  match: u => u.includes('gemini.google.com') },
  { id: 'grok',    match: u => u.includes('x.ai') || u.includes('grok.com') },
  { id: 'tongyi',  match: u => u.includes('tongyi.aliyun.com') },
  { id: 'doubao',  match: u => u.includes('doubao.com') },
  { id: 'kimi',    match: u => u.includes('kimi.moonshot.cn') },
];
const IMAGE_SITE_IDS = ['chatgpt', 'gemini', 'kimi'];

function isTargetTab(tab) {
  return tab.url && AI_SITES.some(s => s.match(tab.url));
}
function isImageTab(tab) {
  return tab.url && AI_SITES.filter(s => IMAGE_SITE_IDS.includes(s.id)).some(s => s.match(tab.url));
}

// ============================================================
//  注入到目标页面的核心函数（异步，含新建对话 + 选模型 + 输入 + 发送）
//  参数 mode: 'text' | 'image'
// ============================================================
const INJECTED_CORE = async (content, mode) => {
  // ---------- 工具函数 ----------
  const delay = ms => new Promise(r => setTimeout(r, ms));

  function find(selectors) {
    for (const s of selectors) {
      try { const el = document.querySelector(s); if (el) return el; } catch (_) {}
    }
    return null;
  }

  function findByText(tags, texts) {
    const els = document.querySelectorAll(tags);
    for (const el of els) {
      const t = (el.textContent || '').trim();
      if (texts.some(x => t.includes(x))) return el;
    }
    return null;
  }

  // 找到可见的匹配元素（排除 display:none / visibility:hidden）
  function findVisibleByText(tags, texts) {
    const els = document.querySelectorAll(tags);
    for (const el of els) {
      const t = (el.textContent || '').trim();
      if (texts.some(x => t.includes(x))) {
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null) {
          return el;
        }
      }
    }
    return null;
  }

  function setInput(el, value) {
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setter.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      el.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, value);
      if (!(el.textContent || '').includes(value)) {
        el.textContent = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }

  function pressEnter(el) {
    const opts = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
    el.dispatchEvent(new KeyboardEvent('keydown', opts));
    el.dispatchEvent(new KeyboardEvent('keypress', opts));
    el.dispatchEvent(new KeyboardEvent('keyup', opts));
  }

  function pressCtrlEnter(el) {
    const opts = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, ctrlKey: true, bubbles: true, cancelable: true };
    el.dispatchEvent(new KeyboardEvent('keydown', opts));
    el.dispatchEvent(new KeyboardEvent('keypress', opts));
    el.dispatchEvent(new KeyboardEvent('keyup', opts));
  }

  function clickEl(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: 'instant', block: 'center' });
    el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    el.click();
  }

  // 等待元素出现
  async function waitFor(selectorsFn, timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const el = selectorsFn();
      if (el) return el;
      await delay(300);
    }
    return null;
  }

  const url = window.location.href;

  // ================================================================
  //  ChatGPT
  // ================================================================
  if (url.includes('chatgpt.com') || url.includes('chat.openai.com')) {
    // 1. 新建对话
    const newBtn = find([
      'a[data-testid="create-new-chat-button"]',
      'button[data-testid="create-new-chat-button"]',
      'nav a[href="/"]',
    ]) || findByText('a,button', ['New chat', '新对话', '新聊天']);
    clickEl(newBtn);
    await delay(2000);

    // 2. 无特定模型要求，跳过

    // 3. 等待输入框出现并输入
    const input = await waitFor(() => find([
      '#prompt-textarea',
      'div[contenteditable="true"][id="prompt-textarea"]',
      'textarea[placeholder*="Message"]',
      'textarea',
    ]));
    if (!input) return false;
    setInput(input, content);
    await delay(600);

    // 4. 发送
    const sendBtn = find([
      'button[data-testid="send-button"]',
      'button[aria-label*="Send"]',
      'button[aria-label*="发送"]',
    ]);
    if (sendBtn && !sendBtn.disabled) {
      clickEl(sendBtn);
    } else {
      pressEnter(input);
    }
    return true;
  }

  // ================================================================
  //  豆包 — 专家模型
  // ================================================================
  if (url.includes('doubao.com')) {
    // 1. 新建对话
    const newBtn = find([
      'div[data-testid="new_chat_button"]',
      'button[data-testid="new_chat_button"]',
    ]) || findByText('button,a,div[role="button"],div[class*="new"]', ['新建对话', '新对话', '开启新对话']);
    clickEl(newBtn);
    await delay(2500);

    // 2. 选择专家模型
    // 尝试找到模型选择器并点击打开
    const modelTrigger = find([
      'div[data-testid="model_selector"]',
      'div[data-testid="bot-selector"]',
    ]) || findVisibleByText('button,div[role="button"],div[class*="model"],div[class*="selector"],span[class*="model"]', ['模型', '豆包', '选择模型']);
    if (modelTrigger) {
      clickEl(modelTrigger);
      await delay(1000);
      const expertOpt = findByText('div,li,button,span,p', ['专家模型']);
      if (expertOpt) {
        clickEl(expertOpt);
        await delay(1000);
      }
    } else {
      // 如果页面上直接有"专家模型"选项卡
      const directExpert = findVisibleByText('div[role="tab"],button,div[role="button"],span', ['专家']);
      if (directExpert) {
        clickEl(directExpert);
        await delay(800);
      }
    }

    // 3. 输入
    const input = await waitFor(() => find([
      'textarea[data-testid="chat_input_input"]',
      'textarea[placeholder*="输入"]',
      'textarea[placeholder*="发送"]',
      'div[contenteditable="true"]',
      'textarea',
    ]));
    if (!input) return false;
    setInput(input, content);
    await delay(600);

    // 4. 发送
    const sendBtn = find([
      'button[data-testid="chat_input_send_button"]',
      'button[aria-label="发送"]',
      'div[data-testid="chat_input_send_button"]',
    ]) || findVisibleByText('button,div[role="button"]', ['发送']);
    if (sendBtn) {
      clickEl(sendBtn);
    } else {
      pressEnter(input);
    }
    return true;
  }

  // ================================================================
  //  通义千问 — 深度思考
  // ================================================================
  if (url.includes('tongyi.aliyun.com')) {
    // 1. 新建对话
    const newBtn = find([
      'button[data-testid="new-chat"]',
      'div[data-testid="new-chat"]',
    ]) || findByText('button,a,div[role="button"],span', ['新建对话', '新对话', '开启新对话', '新建']);
    clickEl(newBtn);
    await delay(2500);

    // 2. 开启深度思考
    const thinkToggle = find([
      'div[data-testid="deep-think"]',
      'button[data-testid="deep-think"]',
    ]) || findVisibleByText('button,div[role="button"],div[role="switch"],span,label,div[class*="think"],div[class*="mode"]', ['深度思考']);
    if (thinkToggle) {
      // 检查是否已经开启 (aria-checked / class 等)
      const isActive = thinkToggle.classList.contains('active') ||
                       thinkToggle.getAttribute('aria-checked') === 'true' ||
                       thinkToggle.getAttribute('aria-pressed') === 'true' ||
                       thinkToggle.closest('[class*="active"]');
      if (!isActive) {
        clickEl(thinkToggle);
        await delay(1000);
      }
    }

    // 3. 输入
    const input = await waitFor(() => find([
      'textarea[data-testid="chat-input"]',
      'textarea[placeholder*="输入"]',
      'div[contenteditable="true"]',
      'textarea',
    ]));
    if (!input) return false;
    setInput(input, content);
    await delay(600);

    // 4. 发送
    const sendBtn = find([
      'button[data-testid="chat-send"]',
      'button[aria-label="发送"]',
    ]) || findVisibleByText('button,div[role="button"]', ['发送']);
    if (sendBtn) {
      clickEl(sendBtn);
    } else {
      pressEnter(input);
    }
    return true;
  }

  // ================================================================
  //  Kimi — K1.5 / 2.6 思考模式
  // ================================================================
  if (url.includes('kimi.moonshot.cn')) {
    // 1. 新建对话
    const newBtn = find([
      'button[data-testid="new-chat"]',
      'a[href="/chat"]',
    ]) || findByText('button,a,div[role="button"],span', ['发起新对话', '新建对话', '新对话']);
    clickEl(newBtn);
    await delay(2500);

    // 2. 选择 K1.5 思考 / 2.6 思考
    // 先找模型选择触发器
    const modelTrigger = find([
      'div[data-testid="model-selector"]',
      'button[data-testid="model-selector"]',
    ]) || findVisibleByText('button,div[role="button"],div[class*="model"],span[class*="model"]', ['模型', 'Kimi', 'K1', 'k1']);
    if (modelTrigger) {
      clickEl(modelTrigger);
      await delay(1000);
      const thinkOpt = findByText('div,li,button,span,p', ['思考']);
      if (thinkOpt) {
        clickEl(thinkOpt);
        await delay(1000);
      }
    } else {
      // 页面可能有直接的模式切换
      const directThink = findVisibleByText('button,div[role="button"],div[role="tab"],span', ['思考', 'K1']);
      if (directThink) {
        clickEl(directThink);
        await delay(800);
      }
    }

    // 3. 输入
    const input = await waitFor(() => find([
      '[data-testid="chat-input"] [contenteditable="true"]',
      'div[contenteditable="true"][class*="editor"]',
      'div[contenteditable="true"]',
      'textarea',
    ]));
    if (!input) return false;
    setInput(input, content);
    await delay(600);

    // 4. 发送
    const sendBtn = find([
      'button[data-testid="send-button"]',
      'button[aria-label="发送"]',
    ]) || findVisibleByText('button,div[role="button"]', ['发送']);
    if (sendBtn) {
      clickEl(sendBtn);
    } else {
      pressEnter(input);
    }
    return true;
  }

  // ================================================================
  //  Gemini — Pro 模型 + Ctrl+Enter 发送
  // ================================================================
  if (url.includes('gemini.google.com')) {
    // 1. 新建对话
    const newBtn = find([
      'a[data-test-id="new-chat"]',
      'button[data-test-id="new-chat"]',
      'a[href="/app"]',
    ]) || findByText('a,button,div[role="button"]', ['New chat', '新聊天']);
    clickEl(newBtn);
    await delay(2500);

    // 2. 选择 Gemini Pro
    // 找到模型选择下拉
    const modelTrigger = find([
      'button[data-test-id="model-selector"]',
      'mat-select[data-test-id="model-selector"]',
    ]) || findVisibleByText('button,div[role="button"],div[role="listbox"],mat-select,span[class*="model"]', ['Gemini', 'Flash', 'model', '模型']);
    if (modelTrigger) {
      clickEl(modelTrigger);
      await delay(1000);
      // 在下拉选项中找 "Pro"
      const proOpt = findByText('mat-option,li,div[role="option"],button,span', ['Pro']);
      if (proOpt) {
        clickEl(proOpt);
        await delay(1000);
      }
    }

    // 3. 输入 — Gemini 使用 Quill 富文本编辑器
    const input = await waitFor(() => find([
      '.ql-editor[contenteditable="true"]',
      'div[contenteditable="true"][aria-label*="prompt"]',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]',
      'textarea',
    ]));
    if (!input) return false;
    setInput(input, content);
    await delay(600);

    // 4. 用 Ctrl+Enter 发送（用户装了其他插件需要此方式）
    pressCtrlEnter(input);
    await delay(500);
    // 备用：点击发送按钮
    const sendBtn = find([
      'button[aria-label="Send message"]',
      'button[aria-label*="Send"]',
      'button[data-test-id="send-button"]',
    ]);
    if (sendBtn && !sendBtn.disabled) {
      clickEl(sendBtn);
    }
    return true;
  }

  // ================================================================
  //  Grok — Expert 模式
  // ================================================================
  if (url.includes('x.ai') || url.includes('grok.com')) {
    // 1. 新建对话
    const newBtn = find([
      'a[href="/chat"]',
      'button[data-testid="new-chat"]',
    ]) || findByText('a,button,div[role="button"]', ['New chat', 'New conversation', '新对话']);
    clickEl(newBtn);
    await delay(2500);

    // 2. 选择 Expert / DeepSearch 模式
    // Grok 的模式通常是一排按钮或 tabs
    const expertBtn = findVisibleByText('button,div[role="tab"],div[role="button"],a,span', ['Expert', 'Think']);
    if (expertBtn) {
      clickEl(expertBtn);
      await delay(1000);
    }

    // 3. 输入
    const input = await waitFor(() => find([
      'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="Message"]',
      'div[contenteditable="true"]',
      'textarea',
    ]));
    if (!input) return false;
    setInput(input, content);
    await delay(600);

    // 4. 发送
    const sendBtn = find([
      'button[aria-label="Send"]',
      'button[aria-label*="Send"]',
      'button[data-testid="send-button"]',
    ]);
    if (sendBtn && !sendBtn.disabled) {
      clickEl(sendBtn);
    } else {
      pressEnter(input);
    }
    return true;
  }

  return false;
};

// ============================================================
//  发送消息
// ============================================================
function sendMessage() {
  const message = document.getElementById('message').value;
  const status = document.getElementById('status');

  if (!message.trim()) {
    status.textContent = '请输入消息内容';
    status.style.color = 'red';
    return;
  }

  status.textContent = '正在发送消息到各AI模型（新建对话 + 选模型 + 发送）...';
  status.style.color = 'blue';
  saveToHistory(message);

  chrome.tabs.query({}, (tabs) => {
    const targetTabs = tabs.filter(isTargetTab);

    if (targetTabs.length === 0) {
      status.textContent = '未找到已打开的AI模型标签页，请先打开对应网站';
      status.style.color = 'red';
      return;
    }

    let processedCount = 0;
    let successCount = 0;

    targetTabs.forEach(tab => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: INJECTED_CORE,
        args: [message, 'text'],
      }, (results) => {
        if (!chrome.runtime.lastError && results && results[0] && results[0].result) {
          successCount++;
        }
        processedCount++;
        if (processedCount === targetTabs.length) {
          status.textContent = `已向 ${targetTabs.length} 个AI发起新对话，成功 ${successCount} 个`;
          status.style.color = successCount > 0 ? 'green' : 'red';
          setTimeout(() => { status.textContent = ''; }, 4000);
        }
      });
    });
  });
}

// ============================================================
//  生成图片
// ============================================================
function generateImage() {
  const prompt = document.getElementById('imagePrompt').value;
  const size = document.getElementById('imageSize').value;
  const status = document.getElementById('status');

  if (!prompt.trim()) {
    status.textContent = '请输入图片描述';
    status.style.color = 'red';
    return;
  }

  status.textContent = '正在向各AI发起图片生成（新建对话）...';
  status.style.color = 'blue';

  // 构造图片 prompt
  const imgContent = `请生成一张图片。描述：${prompt}，尺寸：${size}`;

  chrome.tabs.query({}, (tabs) => {
    const targetTabs = tabs.filter(isImageTab);

    if (targetTabs.length === 0) {
      status.textContent = '未找到支持图片生成的AI标签页（ChatGPT / Gemini / Kimi）';
      status.style.color = 'red';
      return;
    }

    let processedCount = 0;
    let successCount = 0;

    targetTabs.forEach(tab => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: INJECTED_CORE,
        args: [imgContent, 'image'],
      }, (results) => {
        if (!chrome.runtime.lastError && results && results[0] && results[0].result) {
          successCount++;
        }
        processedCount++;
        if (processedCount === targetTabs.length) {
          status.textContent = `图片生成请求已发送到 ${targetTabs.length} 个AI，成功 ${successCount} 个`;
          status.style.color = successCount > 0 ? 'green' : 'red';
          setTimeout(() => { status.textContent = ''; }, 4000);
        }
      });
    });
  });
}

// ============================================================
//  初始化
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  loadHistory();
  document.getElementById('sendBtn').addEventListener('click', sendMessage);
  document.getElementById('generateImageBtn').addEventListener('click', generateImage);
  document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
});
