const HISTORY_KEY = 'messageHistory';
const SEND_LOGS_KEY = 'sendLogs';
const MAX_HISTORY = 8;
const MAX_SEND_LOGS = 30;

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

const AI_SITES = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    match: url => {
      const parsed = parseUrl(url);
      return Boolean(parsed && hostMatches(parsed.hostname, ['chat.openai.com', 'chatgpt.com']));
    },
  },
  {
    id: 'gemini',
    name: 'Gemini',
    match: url => {
      const parsed = parseUrl(url);
      return Boolean(parsed && hostMatches(parsed.hostname, ['gemini.google.com']));
    },
  },
  {
    id: 'grok',
    name: 'Grok',
    match: url => {
      const parsed = parseUrl(url);
      if (!parsed) return false;
      if (hostMatches(parsed.hostname, ['grok.com', 'x.ai'])) return true;
      return hostMatches(parsed.hostname, ['x.com']) && pathStartsWith(parsed.pathname, ['/i/grok', '/grok']);
    },
    imageMatch: url => {
      const parsed = parseUrl(url);
      return Boolean(parsed && hostMatches(parsed.hostname, ['grok.com']) && pathStartsWith(parsed.pathname, ['/imagine']));
    },
  },
  {
    id: 'tongyi',
    name: '千问/Qwen',
    match: url => {
      const parsed = parseUrl(url);
      return Boolean(parsed && hostMatches(parsed.hostname, [
        'tongyi.aliyun.com',
        'qianwen.aliyun.com',
        'qianwen.com',
        'qwen.ai',
      ]));
    },
  },
  {
    id: 'doubao',
    name: '豆包',
    match: url => {
      const parsed = parseUrl(url);
      return Boolean(parsed && hostMatches(parsed.hostname, ['doubao.com']));
    },
  },
  {
    id: 'kimi',
    name: 'Kimi',
    match: url => {
      const parsed = parseUrl(url);
      return Boolean(parsed && hostMatches(parsed.hostname, ['kimi.moonshot.cn', 'kimi.com']));
    },
  },
];

const IMAGE_SITE_IDS = ['chatgpt', 'gemini', 'grok', 'tongyi', 'doubao', 'kimi'];

function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(item => item.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(item => item.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`${tab.dataset.tab}-tab`)?.classList.add('active');
    });
  });
}

function switchToChatTab() {
  document.querySelector('[data-tab="chat"]')?.click();
}

function storageGet(keys) {
  return chrome.storage.local.get(keys);
}

function storageSet(value) {
  return chrome.storage.local.set(value);
}

function storageRemove(key) {
  return chrome.storage.local.remove(key);
}

function getSiteName(tab) {
  const site = AI_SITES.find(item => item.match(tab.url || ''));
  return site ? site.name : 'Unknown';
}

function isTargetTab(tab) {
  return Boolean(tab.url && AI_SITES.some(site => site.match(tab.url)));
}

function isImageTab(tab) {
  return Boolean(tab.url && AI_SITES
    .filter(site => IMAGE_SITE_IDS.includes(site.id))
    .some(site => (site.imageMatch || site.match)(tab.url)));
}

function updateStatus(message, type = 'info') {
  const status = document.getElementById('status');
  status.textContent = message;
  status.style.color = {
    error: '#dc2626',
    success: '#15803d',
    info: '#2563eb',
  }[type] || '#4b5563';
}

function setBusy(button, busy, label) {
  button.disabled = busy;
  if (busy) {
    button.dataset.originalText = button.textContent;
    button.textContent = label;
  } else if (button.dataset.originalText) {
    button.textContent = button.dataset.originalText;
    delete button.dataset.originalText;
  }
}

function classifyLog(log) {
  if (log.successCount === 0) return 'error';
  if (log.successCount < log.targetCount) return 'partial';
  return 'success';
}

function formatTime(value) {
  return new Date(value).toLocaleString();
}

function createTextEl(className, text) {
  const el = document.createElement('div');
  el.className = className;
  el.textContent = text;
  return el;
}

function normalizeLog(log) {
  return {
    createdAt: log.createdAt || Date.now(),
    mode: log.mode || 'Unknown',
    preview: log.preview || '',
    targetCount: Number.isFinite(log.targetCount) ? log.targetCount : 0,
    successCount: Number.isFinite(log.successCount) ? log.successCount : 0,
    details: Array.isArray(log.details) ? log.details : [{
      site: '未知',
      ok: false,
      error: '旧日志格式不完整',
    }],
  };
}

async function loadHistory() {
  const data = await storageGet(HISTORY_KEY);
  const history = data[HISTORY_KEY] || [];
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = '';

  if (history.length === 0) {
    historyList.innerHTML = '<div class="empty">暂无提示词历史。</div>';
    return;
  }

  history.forEach(item => {
    const wrapper = document.createElement('div');
    wrapper.className = 'history-item';
    wrapper.title = '点击复用这条提示词';
    wrapper.append(
      createTextEl('history-content', item.content),
      createTextEl('muted', item.time)
    );
    wrapper.addEventListener('click', () => {
      document.getElementById('message').value = item.content;
      switchToChatTab();
    });
    historyList.appendChild(wrapper);
  });
}

async function saveToHistory(content) {
  const data = await storageGet(HISTORY_KEY);
  const history = (data[HISTORY_KEY] || []).filter(item => item.content !== content);
  history.unshift({ content, time: formatTime(Date.now()) });
  await storageSet({ [HISTORY_KEY]: history.slice(0, MAX_HISTORY) });
  await loadHistory();
}

async function clearHistory() {
  await storageRemove(HISTORY_KEY);
  await loadHistory();
}

async function loadSendLogs() {
  const data = await storageGet(SEND_LOGS_KEY);
  const logs = data[SEND_LOGS_KEY] || [];
  const logList = document.getElementById('sendLogList');
  logList.innerHTML = '';

  if (logs.length === 0) {
    logList.innerHTML = '<div class="empty">暂无发送日志。弹窗关闭后，结果仍会保存在这里。</div>';
    return;
  }

  logs.map(normalizeLog).forEach(log => {
    const wrapper = document.createElement('div');
    wrapper.className = `log-item ${classifyLog(log)}`;

    const summary = `${log.mode} | 成功 ${log.successCount}/${log.targetCount} | ${formatTime(log.createdAt)}`;
    wrapper.appendChild(createTextEl('log-summary', summary));
    wrapper.appendChild(createTextEl('log-content', log.preview || ''));

    const detailLines = log.details.map(item => {
      if (item.skipped) return `${item.site}: 跳过 - ${item.error}`;
      if (item.ok) return `${item.site}: 成功`;
      return `${item.site}: 失败 - ${item.error}`;
    });
    wrapper.appendChild(createTextEl('log-detail', detailLines.join('\n')));
    logList.appendChild(wrapper);
  });
}

async function saveSendLog(log) {
  const data = await storageGet(SEND_LOGS_KEY);
  const logs = data[SEND_LOGS_KEY] || [];
  logs.unshift(log);
  await storageSet({ [SEND_LOGS_KEY]: logs.slice(0, MAX_SEND_LOGS) });
  await loadSendLogs();
}

async function clearSendLogs() {
  await storageRemove(SEND_LOGS_KEY);
  await loadSendLogs();
}

function injectAndSendMessage(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['utils.js', 'content.js'],
    }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, message, response => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (response?.success) {
            resolve(response);
          } else {
            reject(new Error(response?.error || '页面没有确认发送成功'));
          }
        });
      }, 500);
    });
  });
}

async function runForTabs(targetTabs, payload) {
  const details = [];

  await Promise.all(targetTabs.map(async tab => {
    const siteName = getSiteName(tab);
    try {
      await injectAndSendMessage(tab.id, payload);
      details.push({ site: siteName, ok: true, url: tab.url });
    } catch (error) {
      details.push({ site: siteName, ok: false, error: error.message, url: tab.url });
    }
  }));

  details.sort((a, b) => a.site.localeCompare(b.site));
  return {
    successCount: details.filter(item => item.ok).length,
    details,
  };
}

function buildStatus(mode, targetCount, successCount, details) {
  const failed = details.filter(item => !item.ok);
  const lines = [`${mode}: ${successCount}/${targetCount} 个页面确认成功。`];
  if (failed.length > 0) {
    lines.push('失败详情：');
    failed.forEach(item => lines.push(`${item.site}: ${item.error}`));
  }
  return lines.join('\n');
}

function runBackgroundSend(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'runAI2tabSend', ...message }, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

async function saveLocalErrorLog(mode, preview, errorMessage) {
  await saveSendLog({
    createdAt: Date.now(),
    mode,
    preview: preview.slice(0, 160),
    targetCount: 0,
    successCount: 0,
    details: [{
      site: '扩展后台',
      ok: false,
      error: errorMessage,
    }],
  });
}

async function sendMessage() {
  const button = document.getElementById('sendBtn');
  const message = document.getElementById('message').value.trim();

  if (!message) {
    updateStatus('请输入提示词。', 'error');
    return;
  }

  setBusy(button, true, '发送中...');
  updateStatus('正在查找已打开的 AI 页面...', 'info');

  try {
    await saveToHistory(message);
    updateStatus('任务已交给后台执行。弹窗关闭后，可重新打开查看发送日志。', 'info');

    const response = await runBackgroundSend({
      mode: 'Text',
      content: message,
    });

    await loadSendLogs();

    if (!response?.success) {
      updateStatus(response?.error || '后台发送失败。', 'error');
      return;
    }

    const { targetCount, successCount, details } = response.log;

    updateStatus(
      buildStatus('文本发送', targetCount, successCount, details),
      successCount > 0 ? 'success' : 'error'
    );
  } catch (error) {
    await saveLocalErrorLog('Text', message, error.message);
    updateStatus(`发送任务启动失败：${error.message}\n请重新加载扩展，并刷新目标 AI 页面。`, 'error');
  } finally {
    setBusy(button, false);
  }
}

async function generateImage() {
  const button = document.getElementById('generateImageBtn');
  const prompt = document.getElementById('imagePrompt').value.trim();
  const size = document.getElementById('imageSize').value;

  if (!prompt) {
    updateStatus('请输入图片提示词。', 'error');
    return;
  }

  setBusy(button, true, '发送中...');
  updateStatus('正在查找支持图片生成的 AI 页面...', 'info');

  try {
    updateStatus('任务已交给后台执行。弹窗关闭后，可重新打开查看发送日志。', 'info');

    const response = await runBackgroundSend({
      mode: 'Image',
      prompt,
      size,
    });

    await loadSendLogs();

    if (!response?.success) {
      updateStatus(response?.error || '后台图片请求失败。', 'error');
      return;
    }

    const { targetCount, successCount, details } = response.log;

    updateStatus(
      buildStatus('图片请求', targetCount, successCount, details),
      successCount > 0 ? 'success' : 'error'
    );
  } catch (error) {
    await saveLocalErrorLog('Image', prompt, error.message);
    updateStatus(`图片任务启动失败：${error.message}\n请重新加载扩展，并刷新目标 AI 页面。`, 'error');
  } finally {
    setBusy(button, false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    setupTabs();
    loadHistory().catch(error => updateStatus(`读取历史失败：${error.message}`, 'error'));
    loadSendLogs().catch(error => updateStatus(`读取日志失败：${error.message}`, 'error'));
    document.getElementById('sendBtn')?.addEventListener('click', sendMessage);
    document.getElementById('generateImageBtn')?.addEventListener('click', generateImage);
    document.getElementById('clearHistoryBtn')?.addEventListener('click', clearHistory);
    document.getElementById('clearLogsBtn')?.addEventListener('click', clearSendLogs);
  } catch (error) {
    updateStatus(`弹窗初始化失败：${error.message}`, 'error');
  }
});
