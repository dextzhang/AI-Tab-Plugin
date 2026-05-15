importScripts('ai-sites.js');

const SEND_LOGS_KEY = 'sendLogs';
const MAX_SEND_LOGS = 10;
const SITE = globalThis.AI2TAB_SITE_CONFIG;

function getSite(tab) {
  return SITE.getSiteByUrl(tab.url || '');
}

function getSiteName(tab) {
  return getSite(tab)?.name || 'Unknown';
}

function isTargetTab(tab) {
  return Boolean(tab.url && SITE.isTextSite(tab.url));
}

function isImageTab(tab) {
  return Boolean(tab.url && SITE.isImageSite(tab.url));
}

function getFreshUrl(site, rawUrl) {
  const parsed = SITE.parseUrl(rawUrl);
  if (!parsed) return site.freshUrls?.[0] || rawUrl;
  return site.freshUrls?.find(url => SITE.matchesSite(site, url)) || `${parsed.origin}/`;
}

function isAlreadyFreshUrl(site, rawUrl) {
  const parsed = SITE.parseUrl(rawUrl);
  if (!parsed) return false;
  return (site.freshUrls || []).some(freshUrl => {
    const fresh = SITE.parseUrl(freshUrl);
    if (!fresh || fresh.origin !== parsed.origin) return false;
    return parsed.pathname === fresh.pathname && parsed.hash === fresh.hash;
  });
}

function navigateTabAndWait(tabId, url, timeoutMs = 18000) {
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
      finish(reject, new Error('新对话页面加载超时'));
    }, timeoutMs);

    chrome.tabs.update(tabId, { url }, tab => {
      if (chrome.runtime.lastError) {
        finish(reject, new Error(chrome.runtime.lastError.message));
        return;
      }

      if (tab?.status === 'complete') {
        finish(resolve, tab);
      }
    });
  });
}

async function prepareTabForSend(tab, mode) {
  const site = getSite(tab);
  if (!site || mode === 'Image') return tab;

  const parsed = SITE.parseUrl(tab.url || '');
  if (site.forceFreshChatForText && !isAlreadyFreshUrl(site, tab.url)) {
    const freshUrl = getFreshUrl(site, tab.url);
    const updatedTab = await navigateTabAndWait(tab.id, freshUrl);
    return { ...tab, ...updatedTab, url: freshUrl };
  }

  if (site.requireFreshChat && parsed && site.isExistingConversation?.(parsed)) {
    const freshUrl = getFreshUrl(site, tab.url);
    const updatedTab = await navigateTabAndWait(tab.id, freshUrl);
    return { ...tab, ...updatedTab, url: freshUrl };
  }

  return tab;
}

function permissionHint(errorMessage, tab) {
  if (!/Cannot access contents|permission|host/i.test(errorMessage || '')) {
    return errorMessage;
  }

  const site = getSiteName(tab);
  const host = SITE.parseUrl(tab.url || '')?.hostname || tab.url || '当前页面';
  return `${errorMessage}。请确认 manifest 已覆盖 ${site} 当前域名：${host}，重新加载扩展后刷新页面。`;
}

function isMessageChannelClosed(errorMessage) {
  return /message channel closed|asynchronous response|Receiving end does not exist|Could not establish connection/i.test(errorMessage || '');
}

function waitForTabComplete(tabId, timeoutMs = 12000) {
  return new Promise(resolve => {
    let settled = false;
    let timerId = null;

    const cleanup = () => {
      if (timerId) clearTimeout(timerId);
      chrome.tabs.onUpdated.removeListener(onUpdated);
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    const onUpdated = (updatedTabId, changeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        finish();
      }
    };

    chrome.tabs.onUpdated.addListener(onUpdated);
    timerId = setTimeout(finish, timeoutMs);
    chrome.tabs.get(tabId, tab => {
      if (chrome.runtime.lastError || tab?.status === 'complete') {
        finish();
      }
    });
  });
}

function injectAndSendMessageOnce(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['ai-sites.js', 'utils.js', 'content.js'],
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
      }, 350);
    });
  });
}

async function injectAndSendMessage(tabId, message) {
  try {
    return await injectAndSendMessageOnce(tabId, message);
  } catch (error) {
    if (!isMessageChannelClosed(error.message)) {
      throw error;
    }

    await waitForTabComplete(tabId);
    await new Promise(resolve => setTimeout(resolve, 1200));
    return injectAndSendMessageOnce(tabId, message);
  }
}

function injectAndDiagnoseModes(tabId) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['ai-sites.js', 'utils.js', 'content.js'],
    }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, { action: 'diagnoseModes' }, response => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (response?.success) {
            resolve(response.diagnosis);
          } else {
            reject(new Error(response?.error || '页面没有返回模式诊断结果'));
          }
        });
      }, 350);
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

async function runForTabs(targetTabs, payload, mode) {
  const details = [];

  await Promise.all(targetTabs.map(async tab => {
    const siteName = getSiteName(tab);
    const site = getSite(tab);
    const sitePreference = site ? payload.preferences?.sites?.[site.id] : null;

    if (sitePreference?.enabled === false) {
      details.push({ site: siteName, ok: true, skipped: true, error: '已在发送设置中关闭', url: tab.url });
      return;
    }

    try {
      const preparedTab = await prepareTabForSend(tab, mode);
      await injectAndSendMessage(preparedTab.id, payload);
      details.push({ site: siteName, ok: true, url: preparedTab.url || tab.url });
    } catch (error) {
      details.push({
        site: siteName,
        ok: false,
        error: permissionHint(error.message, tab),
        url: tab.url,
      });
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
  const mode = message.mode === 'Image' ? 'Image' : 'Text';
  const preferences = message.preferences || {};
  const targetTabs = (mode === 'Image' ? tabs.filter(isImageTab) : tabs.filter(isTargetTab))
    .filter(tab => {
      const site = getSite(tab);
      return !site || preferences.sites?.[site.id]?.enabled !== false;
    });
  const preview = mode === 'Image'
    ? `${String(message.prompt || '').slice(0, 140)} (${message.size || '1024x1024'})`
    : String(message.content || '').slice(0, 160);

  if (targetTabs.length === 0) {
    return saveSendLog({
      createdAt: Date.now(),
      mode,
      preview,
      targetCount: 0,
      successCount: 0,
      details: [{ site: '全部', ok: false, error: '没有找到已打开且已启用的支持页面。' }],
    });
  }

  const payload = mode === 'Image'
    ? { action: 'generateImage', prompt: message.prompt, size: message.size, preferences }
    : { action: 'sendMessage', content: message.content, preferences };

  const { successCount, details } = await runForTabs(targetTabs, payload, mode);
  return saveSendLog({
    createdAt: Date.now(),
    mode,
    preview,
    targetCount: targetTabs.length,
    successCount,
    details,
  });
}

function formatDiagnosis(diagnosis) {
  if (!diagnosis) return '无诊断结果';
  if (!diagnosis.candidates?.length) {
    return `${diagnosis.platform}: 未发现明显的模型/模式控件`;
  }

  const lines = [`${diagnosis.platform}: ${diagnosis.count} 个候选控件`];
  diagnosis.candidates.slice(0, 12).forEach((item, index) => {
    const label = item.text || item.aria || item.title || item.testId || item.signal || item.tag;
    const meta = [
      item.tag,
      item.role && `role=${item.role}`,
      item.testId && `testid=${item.testId}`,
      item.box && `box=${item.box}`,
    ].filter(Boolean).join(' ');
    lines.push(`${index + 1}. ${label} (${meta})`);
  });
  return lines.join('\n');
}

async function runModeDiagnosis() {
  const tabs = await chrome.tabs.query({});
  const targetTabs = tabs.filter(isTargetTab);
  const details = [];

  await Promise.all(targetTabs.map(async tab => {
    const siteName = getSiteName(tab);
    try {
      const diagnosis = await injectAndDiagnoseModes(tab.id);
      details.push({
        site: siteName,
        ok: true,
        url: tab.url,
        note: formatDiagnosis(diagnosis),
      });
    } catch (error) {
      details.push({
        site: siteName,
        ok: false,
        error: permissionHint(error.message, tab),
        url: tab.url,
      });
    }
  }));

  details.sort((a, b) => a.site.localeCompare(b.site));
  return saveSendLog({
    createdAt: Date.now(),
    mode: 'Mode Diagnose',
    preview: '模型/模式控件诊断',
    targetCount: targetTabs.length,
    successCount: details.filter(item => item.ok).length,
    details,
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'diagnoseAI2tabModes') {
    runModeDiagnosis()
      .then(log => sendResponse({ success: true, log }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.action !== 'runAI2tabSend') {
    return false;
  }

  runPopupSend(message)
    .then(log => sendResponse({ success: true, log }))
    .catch(error => sendResponse({ success: false, error: error.message }));

  return true;
});
