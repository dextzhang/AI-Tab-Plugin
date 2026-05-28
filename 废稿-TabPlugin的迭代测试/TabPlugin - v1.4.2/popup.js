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

const AI_SITES = [
  { id: 'chatgpt', name: 'ChatGPT', match: u => u.includes('chat.openai.com') || u.includes('chatgpt.com') },
  { id: 'gemini', name: 'Gemini', match: u => u.includes('gemini.google.com') },
  { id: 'grok', name: 'Grok', match: u => u.includes('x.ai') || u.includes('grok.com') },
  { id: 'tongyi', name: '通义千问', match: u => u.includes('tongyi.aliyun.com') },
  { id: 'doubao', name: '豆包', match: u => u.includes('doubao.com') },
  { id: 'kimi', name: 'Kimi', match: u => u.includes('kimi.moonshot.cn') },
];
const IMAGE_SITE_IDS = ['chatgpt', 'gemini', 'kimi'];

function isTargetTab(tab) {
  return tab.url && AI_SITES.some(s => s.match(tab.url));
}
function isImageTab(tab) {
  return tab.url && AI_SITES.filter(s => IMAGE_SITE_IDS.includes(s.id)).some(s => s.match(tab.url));
}
function getSiteName(tab) {
  const site = AI_SITES.find(s => s.match(tab.url));
  return site ? site.name : 'Unknown';
}

function updateStatus(message, isError = false) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.style.color = isError ? 'red' : (message.includes('成功') ? 'green' : 'blue');
  if (!isError && !message.includes('成功')) {
    setTimeout(() => { status.textContent = ''; }, 4000);
  }
}

function injectAndSendMessage(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['utils.js', 'content.js']
    }, (results) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response && response.success) {
            resolve(response);
          } else {
            reject(new Error(response?.error || 'Unknown error'));
          }
        });
      }, 500);
    });
  });
}

async function sendMessage() {
  const message = document.getElementById('message').value;
  if (!message.trim()) {
    updateStatus('请输入消息内容', true);
    return;
  }

  updateStatus('正在发送消息到各AI模型...', false);
  saveToHistory(message);

  const tabs = await chrome.tabs.query({});
  const targetTabs = tabs.filter(isTargetTab);

  if (targetTabs.length === 0) {
    updateStatus('未找到已打开的AI模型标签页，请先打开对应网站', true);
    return;
  }

  const results = [];
  let successCount = 0;
  let failDetails = [];

  const promises = targetTabs.map(async (tab) => {
    const siteName = getSiteName(tab);
    try {
      await injectAndSendMessage(tab.id, { action: 'sendMessage', content: message });
      successCount++;
      results.push(`${siteName}: 成功`);
    } catch (e) {
      failDetails.push(`${siteName}: ${e.message}`);
    }
  });

  await Promise.all(promises);

  let resultMsg = `已向 ${targetTabs.length} 个AI发起新对话，成功 ${successCount} 个`;
  if (failDetails.length > 0) {
    resultMsg += `\n失败: ${failDetails.join('; ')}`;
  }
  updateStatus(resultMsg, successCount === 0);
}

async function generateImage() {
  const prompt = document.getElementById('imagePrompt').value;
  const size = document.getElementById('imageSize').value;
  
  if (!prompt.trim()) {
    updateStatus('请输入图片描述', true);
    return;
  }

  updateStatus('正在向各AI发起图片生成...', false);

  const tabs = await chrome.tabs.query({});
  const targetTabs = tabs.filter(isImageTab);

  if (targetTabs.length === 0) {
    updateStatus('未找到支持图片生成的AI标签页（ChatGPT / Gemini / Kimi）', true);
    return;
  }

  let successCount = 0;
  let failDetails = [];

  const promises = targetTabs.map(async (tab) => {
    const siteName = getSiteName(tab);
    try {
      await injectAndSendMessage(tab.id, { 
        action: 'generateImage', 
        prompt: prompt,
        size: size
      });
      successCount++;
    } catch (e) {
      failDetails.push(`${siteName}: ${e.message}`);
    }
  });

  await Promise.all(promises);

  let resultMsg = `图片生成请求已发送到 ${targetTabs.length} 个AI，成功 ${successCount} 个`;
  if (failDetails.length > 0) {
    resultMsg += `\n失败: ${failDetails.join('; ')}`;
  }
  updateStatus(resultMsg, successCount === 0);
}

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  loadHistory();
  document.getElementById('sendBtn').addEventListener('click', sendMessage);
  document.getElementById('imgGenBtn').addEventListener('click', generateImage);
  document.getElementById('clearHistoryBtn')?.addEventListener('click', clearHistory);
});
