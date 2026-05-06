const SEND_LOGS_KEY = 'sendLogs';
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

function getSite(tab) {
  return AI_SITES.find(item => item.match(tab.url || '')) || null;
}

function getSiteName(tab) {
  const site = getSite(tab);
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

function isKimiConversationUrl(rawUrl) {
  const parsed = parseUrl(rawUrl);
  if (!parsed || !hostMatches(parsed.hostname, ['kimi.moonshot.cn', 'kimi.com'])) return false;
  const route = `${parsed.pathname || ''}${parsed.hash || ''}`;
  return /(^|[#/])(chat|c)\/[^/?#]+/.test(route);
}

function getFreshKimiUrl(rawUrl) {
  const parsed = parseUrl(rawUrl);
  return parsed ? `${parsed.origin}/` : 'https://www.kimi.com/';
}

function navigateTabAndWait(tabId, url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timerId = null;

    const cleanup = () => {
      if (timerId) clearTimeout(timerId);
      chrome.tabs.onUpdated.removeListener(onUpdated);
    };

    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback(value);
    };

    const onUpdated = (updatedTabId, changeInfo, updatedTab) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        finish(resolve, updatedTab);
      }
    };

    chrome.tabs.onUpdated.addListener(onUpdated);
    timerId = setTimeout(() => {
      finish(reject, new Error('Kimi new chat page did not finish loading in time.'));
    }, timeoutMs);

    chrome.tabs.update(tabId, { url }, tab => {
      if (chrome.runtime.lastError) {
        finish(reject, new Error(chrome.runtime.lastError.message));
        return;
      }

      if (tab?.status === 'complete' && tab.url === url) {
        finish(resolve, tab);
      }
    });
  });
}

async function prepareTabForSend(tab) {
  const site = getSite(tab);
  if (site?.id !== 'kimi' || !isKimiConversationUrl(tab.url)) {
    return tab;
  }

  const freshUrl = getFreshKimiUrl(tab.url);
  await navigateTabAndWait(tab.id, freshUrl);
  return {
    ...tab,
    url: freshUrl,
  };
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

async function saveSendLog(log) {
  const data = await chrome.storage.local.get(SEND_LOGS_KEY);
  const logs = data[SEND_LOGS_KEY] || [];
  logs.unshift(log);
  await chrome.storage.local.set({ [SEND_LOGS_KEY]: logs.slice(0, MAX_SEND_LOGS) });
  return log;
}

async function runForTabs(targetTabs, payload) {
  const details = [];

  await Promise.all(targetTabs.map(async tab => {
    const siteName = getSiteName(tab);
    try {
      const preparedTab = await prepareTabForSend(tab);
      await injectAndSendMessage(preparedTab.id, payload);
      details.push({ site: siteName, ok: true, url: preparedTab.url });
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

async function runPopupSend(message) {
  const tabs = await chrome.tabs.query({});
  const targetTabs = message.mode === 'Image' ? tabs.filter(isImageTab) : tabs.filter(isTargetTab);
  const preview = message.mode === 'Image'
    ? `${String(message.prompt || '').slice(0, 140)} (${message.size || '1024x1024'})`
    : String(message.content || '').slice(0, 160);

  if (targetTabs.length === 0) {
    return saveSendLog({
      createdAt: Date.now(),
      mode: message.mode,
      preview,
      targetCount: 0,
      successCount: 0,
      details: [{ site: '全部', ok: false, error: '没有找到已打开的支持页面。' }],
    });
  }

  const payload = message.mode === 'Image'
    ? { action: 'generateImage', prompt: message.prompt, size: message.size }
    : { action: 'sendMessage', content: message.content };

  const { successCount, details } = await runForTabs(targetTabs, payload);
  return saveSendLog({
    createdAt: Date.now(),
    mode: message.mode,
    preview,
    targetCount: targetTabs.length,
    successCount,
    details,
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action !== 'runAI2tabSend') {
    return false;
  }

  runPopupSend(message)
    .then(log => sendResponse({ success: true, log }))
    .catch(error => sendResponse({ success: false, error: error.message }));

  return true;
});
