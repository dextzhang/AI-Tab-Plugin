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
      historyList.innerHTML = '<div style="color: #9ca3af; font-size: 13px; text-align: center; padding: 20px;">暂无历史记录</div>';
      return;
    }

    history.forEach(item => {
      const div = document.createElement('div');
      div.className = 'history-item';

      const contentDiv = document.createElement('div');
      contentDiv.textContent = item.content;
      div.appendChild(contentDiv);

      const timeDiv = document.createElement('div');
      timeDiv.className = 'history-time';
      timeDiv.textContent = item.time;
      div.appendChild(timeDiv);

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
    chrome.storage.local.set({ messageHistory: history }, () => {
      loadHistory();
    });
  });
}

function clearHistory() {
  chrome.storage.local.remove('messageHistory', () => {
    loadHistory();
  });
}

const AI_SITES = [
  { id: 'chatgpt', match: url => url.includes('chat.openai.com') || url.includes('chatgpt.com') },
  { id: 'gemini',  match: url => url.includes('gemini.google.com') },
  { id: 'grok',    match: url => url.includes('x.ai') || url.includes('grok.com') },
  { id: 'tongyi',  match: url => url.includes('tongyi.aliyun.com') },
  { id: 'doubao',  match: url => url.includes('doubao.com') },
  { id: 'kimi',    match: url => url.includes('kimi.moonshot.cn') },
];

const IMAGE_SITES = ['chatgpt', 'gemini', 'kimi'];

function isTargetTab(tab) {
  if (!tab.url) return false;
  return AI_SITES.some(site => site.match(tab.url));
}

function isImageTab(tab) {
  if (!tab.url) return false;
  return AI_SITES.filter(s => IMAGE_SITES.includes(s.id)).some(site => site.match(tab.url));
}

// 注入到目标页面的脚本：设置输入框的值（兼容 React）
function injectedSetInput(textarea, value) {
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype, 'value'
  ).set;
  nativeSetter.call(textarea, value);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));
}

function sendMessage() {
  const message = document.getElementById('message').value;
  const status = document.getElementById('status');

  if (!message.trim()) {
    status.textContent = '请输入消息内容';
    status.style.color = 'red';
    return;
  }

  status.textContent = '正在发送消息...';
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
        func: (content) => {
          const url = window.location.href;

          function setInput(textarea, value) {
            const nativeSetter = Object.getOwnPropertyDescriptor(
              window.HTMLTextAreaElement.prototype, 'value'
            ).set;
            nativeSetter.call(textarea, value);
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
          }

          function findElement(selectors) {
            for (const sel of selectors) {
              const el = document.querySelector(sel);
              if (el) return el;
            }
            return null;
          }

          function pressEnter(el) {
            el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
            el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
          }

          let inputSelectors = [];
          let buttonSelectors = [];

          if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) {
            inputSelectors = [
              '#prompt-textarea',
              "textarea[placeholder*='Message']",
              "textarea[data-id='root']",
              'textarea'
            ];
            buttonSelectors = [
              "button[data-testid='send-button']",
              "button[aria-label*='Send']",
              "button[type='submit']"
            ];
          } else if (url.includes('doubao.com')) {
            inputSelectors = [
              "textarea[placeholder*='输入']",
              "textarea[placeholder*='发送']",
              'textarea'
            ];
            buttonSelectors = [
              "button[aria-label='发送']",
              "button[data-testid*='send']",
              "button[type='submit']"
            ];
          } else if (url.includes('gemini.google.com')) {
            inputSelectors = [
              ".ql-editor[contenteditable='true']",
              "textarea[placeholder*='Message']",
              'textarea'
            ];
            buttonSelectors = [
              "button[aria-label='Send message']",
              "button[aria-label*='Send']",
              "button[type='submit']"
            ];
          } else if (url.includes('x.ai') || url.includes('grok.com')) {
            inputSelectors = [
              "textarea[placeholder*='Ask']",
              "textarea[placeholder*='Message']",
              'textarea'
            ];
            buttonSelectors = [
              "button[aria-label='Send']",
              "button[aria-label*='Send']",
              "button[type='submit']"
            ];
          } else if (url.includes('tongyi.aliyun.com')) {
            inputSelectors = [
              "textarea[placeholder*='输入']",
              "textarea[data-testid]",
              'textarea'
            ];
            buttonSelectors = [
              "button[aria-label='发送']",
              "button[data-testid*='send']",
              "button[type='submit']"
            ];
          } else if (url.includes('kimi.moonshot.cn')) {
            inputSelectors = [
              "[contenteditable='true']",
              "textarea[placeholder*='输入']",
              'textarea'
            ];
            buttonSelectors = [
              "button[aria-label='发送']",
              "button[data-testid*='send']",
              "button[type='submit']"
            ];
          }

          const input = findElement(inputSelectors);
          if (!input) return false;

          if (input.tagName === 'TEXTAREA') {
            setInput(input, content);
          } else {
            input.focus();
            input.textContent = content;
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }

          pressEnter(input);

          setTimeout(() => {
            const button = findElement(buttonSelectors);
            if (button) {
              button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            }
          }, 300);

          return true;
        },
        args: [message]
      }, (results) => {
        if (!chrome.runtime.lastError && results && results[0] && results[0].result) {
          successCount++;
        }
        processedCount++;
        if (processedCount === targetTabs.length) {
          status.textContent = `消息已发送到 ${targetTabs.length} 个AI模型，成功 ${successCount} 个`;
          status.style.color = successCount > 0 ? 'green' : 'red';
          setTimeout(() => { status.textContent = ''; }, 3000);
        }
      });
    });
  });
}

function generateImage() {
  const prompt = document.getElementById('imagePrompt').value;
  const size = document.getElementById('imageSize').value;
  const status = document.getElementById('status');

  if (!prompt.trim()) {
    status.textContent = '请输入图片描述';
    status.style.color = 'red';
    return;
  }

  status.textContent = '正在生成图片...';
  status.style.color = 'blue';

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
        func: (prompt, size) => {
          const url = window.location.href;

          function setInput(textarea, value) {
            const nativeSetter = Object.getOwnPropertyDescriptor(
              window.HTMLTextAreaElement.prototype, 'value'
            ).set;
            nativeSetter.call(textarea, value);
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
          }

          function findElement(selectors) {
            for (const sel of selectors) {
              const el = document.querySelector(sel);
              if (el) return el;
            }
            return null;
          }

          const imagePrompt = `Generate an image: ${prompt}, size: ${size}`;
          let inputSelectors = [];
          let buttonSelectors = [];

          if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) {
            inputSelectors = ['#prompt-textarea', "textarea[placeholder*='Message']", 'textarea'];
            buttonSelectors = ["button[data-testid='send-button']", "button[aria-label*='Send']", "button[type='submit']"];
          } else if (url.includes('gemini.google.com')) {
            inputSelectors = [".ql-editor[contenteditable='true']", "textarea[placeholder*='Message']", 'textarea'];
            buttonSelectors = ["button[aria-label='Send message']", "button[aria-label*='Send']", "button[type='submit']"];
          } else if (url.includes('kimi.moonshot.cn')) {
            inputSelectors = ["[contenteditable='true']", "textarea[placeholder*='输入']", 'textarea'];
            buttonSelectors = ["button[aria-label='发送']", "button[data-testid*='send']", "button[type='submit']"];
          } else {
            return false;
          }

          const input = findElement(inputSelectors);
          if (!input) return false;

          const localizedPrompt = url.includes('kimi.moonshot.cn')
            ? `请生成一张图片，描述：${prompt}，尺寸：${size}`
            : imagePrompt;

          if (input.tagName === 'TEXTAREA') {
            setInput(input, localizedPrompt);
          } else {
            input.focus();
            input.textContent = localizedPrompt;
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }

          setTimeout(() => {
            const button = findElement(buttonSelectors);
            if (button) {
              button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            }
          }, 300);

          return true;
        },
        args: [prompt, size]
      }, (results) => {
        if (!chrome.runtime.lastError && results && results[0] && results[0].result) {
          successCount++;
        }
        processedCount++;
        if (processedCount === targetTabs.length) {
          status.textContent = `图片生成请求已发送到 ${targetTabs.length} 个AI模型，成功 ${successCount} 个`;
          status.style.color = successCount > 0 ? 'green' : 'red';
          setTimeout(() => { status.textContent = ''; }, 3000);
        }
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  loadHistory();
  document.getElementById('sendBtn').addEventListener('click', sendMessage);
  document.getElementById('generateImageBtn').addEventListener('click', generateImage);
  document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
});
