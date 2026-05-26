importScripts('ai-sites.js');

const SEND_LOGS_KEY = 'sendLogs';
const MAX_SEND_LOGS = 10;
const SITE = globalThis.AI2TAB_SITE_CONFIG;

const TAB_RANK = {
  ACTIVE_BONUS: 1e12,
  NOT_DISCARDED_BONUS: 1e9,
};

const TIMING = {
  AFTER_INJECT: 350,
  AFTER_RELOAD: 1200,
  AFTER_ACTIVATE: 900,
  TAB_COMPLETE_DEFAULT: 12000,
  TAB_COMPLETE_SEND: 18000,
  TAB_COMPLETE_DISCARDED: 22000,
  TAB_COMPLETE_FOREGROUND: 14000,
  NAV_TIMEOUT: 18000,
  DISCARDED_SETTLE: 1500,
  NORMAL_SETTLE: 700,
  MAX_TOTAL_RUN: 180000,
};

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

function getSiteId(tab) {
  return getSite(tab)?.id || `unknown:${tab.id}`;
}

function tabRank(tab) {
  let score = 0;
  if (tab.active) score += TAB_RANK.ACTIVE_BONUS;
  if (!tab.discarded) score += TAB_RANK.NOT_DISCARDED_BONUS;
  score += Number(tab.lastAccessed || 0);
  return score;
}

function dedupeTabsBySite(tabs) {
  const bySite = new Map();

  tabs.forEach(tab => {
    const siteId = getSiteId(tab);
    const current = bySite.get(siteId);
    if (!current || tabRank(tab) > tabRank(current)) {
      bySite.set(siteId, tab);
    }
  });

  return Array.from(bySite.values());
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

function navigateTabAndWait(tabId, url, timeoutMs = TIMING.NAV_TIMEOUT) {
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

function waitForTabComplete(tabId, timeoutMs = TIMING.TAB_COMPLETE_DEFAULT) {
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

function reloadTab(tabId) {
  return new Promise(resolve => {
    chrome.tabs.reload(tabId, {}, () => {
      resolve(!chrome.runtime.lastError);
    });
  });
}

function getTab(tabId, fallbackTab) {
  return new Promise(resolve => {
    chrome.tabs.get(tabId, refreshedTab => {
      resolve(chrome.runtime.lastError ? fallbackTab : refreshedTab);
    });
  });
}

function getActiveTabsByWindow() {
  return new Promise(resolve => {
    chrome.tabs.query({ active: true }, tabs => {
      if (chrome.runtime.lastError) {
        resolve(new Map());
        return;
      }

      resolve(new Map(tabs.map(tab => [tab.windowId, tab.id])));
    });
  });
}

function activateTab(tab) {
  return new Promise(resolve => {
    if (!tab?.id) {
      resolve(tab);
      return;
    }

    chrome.windows.update(tab.windowId, { focused: true }, () => {
      chrome.tabs.update(tab.id, { active: true }, updatedTab => {
        resolve(chrome.runtime.lastError ? tab : { ...tab, ...updatedTab });
      });
    });
  });
}

async function restoreActiveTabs(activeTabsByWindow) {
  for (const [windowId, tabId] of activeTabsByWindow.entries()) {
    await new Promise(resolve => {
      chrome.tabs.update(tabId, { active: true }, () => resolve());
    });
  }
}

async function ensureTabReadyQuietly(tab) {
  let currentTab = tab;
  if (tab.discarded || tab.status !== 'complete') {
    await reloadTab(tab.id);
    await waitForTabComplete(tab.id, tab.discarded ? TIMING.TAB_COMPLETE_DISCARDED : TIMING.TAB_COMPLETE_FOREGROUND);
    await new Promise(resolve => setTimeout(resolve, tab.discarded ? TIMING.DISCARDED_SETTLE : TIMING.NORMAL_SETTLE));
    currentTab = await getTab(tab.id, tab);
  }

  return currentTab;
}

function shouldQuietRetry(errorMessage) {
  return isMessageChannelClosed(errorMessage) || /未找到输入框|input|textbox/i.test(errorMessage || '');
}

async function injectAndSendWithQuietRetry(tab, payload) {
  try {
    return await injectAndSendMessage(tab.id, payload);
  } catch (error) {
    if (!shouldQuietRetry(error.message)) {
      throw error;
    }

    await reloadTab(tab.id);
    await waitForTabComplete(tab.id, TIMING.TAB_COMPLETE_SEND);
    await new Promise(resolve => setTimeout(resolve, TIMING.AFTER_RELOAD));
    return injectAndSendMessage(tab.id, payload);
  }
}

async function injectAndSendWithForegroundFallback(tab, payload) {
  try {
    return await injectAndSendWithQuietRetry(tab, payload);
  } catch (quietError) {
    if (!shouldQuietRetry(quietError.message)) {
      throw quietError;
    }

    const originalActiveTabs = await getActiveTabsByWindow();
    try {
      const activeTab = await activateTab(tab);
      await waitForTabComplete(activeTab.id, TIMING.TAB_COMPLETE_FOREGROUND);
      await new Promise(resolve => setTimeout(resolve, TIMING.AFTER_ACTIVATE));
      return await injectAndSendMessage(activeTab.id, payload);
    } catch (foregroundError) {
      foregroundError.message = `后台重试失败：${quietError.message}；前台兜底也失败：${foregroundError.message}`;
      throw foregroundError;
    } finally {
      await restoreActiveTabs(originalActiveTabs);
    }
  }
}

function sendTabMessage(tabId, message) {
  return new Promise((resolve, reject) => {
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
  });
}

function injectScripts(tabId) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['ai-sites.js', 'utils.js', 'content.js'],
    }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
}

async function injectAndSendMessageOnce(tabId, message) {
  // Always refresh the injected adapter first. AI sites keep old content-script
  // handlers alive across extension reloads, and sending to a stale handler can
  // reintroduce old DOM/selection bugs.
  await injectScripts(tabId);
  await new Promise(resolve => setTimeout(resolve, TIMING.AFTER_INJECT));
  return sendTabMessage(tabId, message);
}

async function injectAndSendMessage(tabId, message) {
  try {
    return await injectAndSendMessageOnce(tabId, message);
  } catch (error) {
    if (!isMessageChannelClosed(error.message)) {
      throw error;
    }

    await waitForTabComplete(tabId);
    await new Promise(resolve => setTimeout(resolve, TIMING.AFTER_RELOAD));
    return injectAndSendMessageOnce(tabId, message);
  }
}

async function injectAndDiagnoseModes(tabId) {
  const message = { action: 'diagnoseModes' };

  try {
    const response = await sendTabMessage(tabId, message);
    return response.diagnosis;
  } catch (pingError) {
    if (!isMessageChannelClosed(pingError.message)) {
      throw pingError;
    }
  }

  await injectScripts(tabId);
  await new Promise(resolve => setTimeout(resolve, TIMING.AFTER_INJECT));
  const response = await sendTabMessage(tabId, message);
  return response.diagnosis;
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
  const limit = 2;
  const queue = [...targetTabs];

  // Helper to push progress updates to Popup if open
  const reportProgress = (siteId, status, extra = {}) => {
    try {
      chrome.runtime.sendMessage({
        action: 'ai2tabProgressUpdate',
        siteId,
        status, // 'waiting', 'preparing', 'sending', 'success', 'error', 'skipped'
        ...extra
      });
    } catch (_) {
      // Ignored if popup is closed
    }
  };

  // Pre-initialize status for all target tabs
  targetTabs.forEach(tab => {
    const site = getSite(tab);
    if (site) {
      const sitePreference = payload.preferences?.sites?.[site.id];
      if (sitePreference?.enabled !== false) {
        reportProgress(site.id, 'waiting');
      }
    }
  });

  const worker = async () => {
    while (queue.length > 0) {
      const tab = queue.shift();
      const siteName = getSiteName(tab);
      const site = getSite(tab);
      if (!site) continue;
      const siteId = site.id;
      const sitePreference = payload.preferences?.sites?.[siteId];

      if (sitePreference?.enabled === false) {
        details.push({ site: siteName, ok: true, skipped: true, error: '已在发送设置中关闭', url: tab.url });
        reportProgress(siteId, 'skipped', { error: '已关闭' });
        continue;
      }

      try {
        reportProgress(siteId, 'preparing', { detail: '重载并确认就绪...' });
        const readyTab = await ensureTabReadyQuietly(tab);

        reportProgress(siteId, 'preparing', { detail: '跳转或准备对话...' });
        const preparedTab = await prepareTabForSend(readyTab, mode);
        const finalTab = await ensureTabReadyQuietly(preparedTab);

        reportProgress(siteId, 'sending', { detail: '注入脚本并写入...' });
        await injectAndSendWithQuietRetry(finalTab, payload);

        details.push({ site: siteName, ok: true, url: finalTab.url || preparedTab.url || tab.url });
        reportProgress(siteId, 'success', { detail: '已成功发送' });
      } catch (error) {
        const errorMsg = permissionHint(error.message, tab);
        details.push({
          site: siteName,
          ok: false,
          error: errorMsg,
          url: tab.url,
        });
        reportProgress(siteId, 'error', { error: errorMsg });
      }
    }
  };

  const workers = [];
  for (let i = 0; i < Math.min(limit, targetTabs.length); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);

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
  const targetTabs = dedupeTabsBySite(mode === 'Image' ? tabs.filter(isImageTab) : tabs.filter(isTargetTab))
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
    ? { action: 'generateImageV2', prompt: message.prompt, size: message.size, preferences }
    : { action: 'sendMessageV2', content: message.content, preferences };

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
        diagnosis,
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

  if (message.action === 'saveErrorLog') {
    saveSendLog(message.log)
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
