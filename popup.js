const HISTORY_KEY = 'messageHistory';
const SEND_LOGS_KEY = 'sendLogs';
const SEND_PREFS_KEY = 'sendPreferences';
const MAX_HISTORY = 5;
const MAX_SEND_LOGS = 10;
const MAX_INPUT_LENGTH = 30000;
const CURRENT_MODE_VALUE = 'current';
const CUSTOM_MODE_PREFIX = 'detected:';
const SEND_PREFS_VERSION = 2;
const SITE = globalThis.AI2TAB_SITE_CONFIG;

function storageGet(keys) {
  return chrome.storage.local.get(keys);
}

function storageSet(value) {
  return chrome.storage.local.set(value);
}

function storageRemove(key) {
  return chrome.storage.local.remove(key);
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(item => {
        const active = item === tab;
        item.classList.toggle('active', active);
        item.setAttribute('aria-selected', String(active));
      });
      document.querySelectorAll('.tab-content').forEach(item => item.classList.remove('active'));
      document.getElementById(`${tab.dataset.tab}-tab`)?.classList.add('active');
    });
  });
}

function switchToChatTab() {
  document.querySelector('[data-tab="chat"]')?.click();
}

function updateStatus(message, type = 'info') {
  const status = document.getElementById('status');
  status.textContent = message;
  status.dataset.type = type;
}

function setBusy(button, busy, label) {
  if (!button) return;
  button.disabled = busy;
  if (busy) {
    button.dataset.originalText = button.textContent;
    button.textContent = label;
  } else if (button.dataset.originalText) {
    button.textContent = button.dataset.originalText;
    delete button.dataset.originalText;
  }
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

function classifyLog(log) {
  if (log.successCount === 0) return 'error';
  if (log.successCount < log.targetCount) return 'partial';
  return 'success';
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

function defaultPreferences() {
  const sites = {};
  SITE.sites.forEach(site => {
    sites[site.id] = {
      enabled: true,
      mode: CURRENT_MODE_VALUE,
      customModeOptions: [],
    };
  });
  return { version: SEND_PREFS_VERSION, sites };
}

async function loadPreferences() {
  const defaults = defaultPreferences();
  const data = await storageGet(SEND_PREFS_KEY);
  const saved = data[SEND_PREFS_KEY] || {};
  const preferences = {
    ...defaults,
    ...saved,
    sites: {
      ...defaults.sites,
      ...(saved.sites || {}),
    },
  };

  if (saved.version !== SEND_PREFS_VERSION) {
    SITE.sites.forEach(site => {
      preferences.sites[site.id] = {
        ...(preferences.sites[site.id] || {}),
        enabled: preferences.sites[site.id]?.enabled !== false,
        mode: CURRENT_MODE_VALUE,
        customModeOptions: preferences.sites[site.id]?.customModeOptions || [],
      };
    });
    preferences.version = SEND_PREFS_VERSION;
    await savePreferences(preferences);
  }

  return preferences;
}

async function savePreferences(preferences) {
  await storageSet({ [SEND_PREFS_KEY]: preferences });
}

function slugifyModeLabel(label) {
  return String(label || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
    .slice(0, 36);
}

function normalizeModeLabel(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function getCandidateLabel(candidate) {
  return normalizeModeLabel(candidate?.text || candidate?.aria || candidate?.title || candidate?.testId || '');
}

function getModeOptions(site, sitePrefs = {}) {
  const options = [
    { value: CURRENT_MODE_VALUE, label: '使用页面当前模型' },
    ...(site.modeOptions || []),
    ...(Array.isArray(sitePrefs.customModeOptions) ? sitePrefs.customModeOptions : []),
  ];
  const seen = new Set();

  return options.filter(option => {
    if (!option?.value || seen.has(option.value)) return false;
    seen.add(option.value);
    return true;
  });
}

function buildDetectedModeOptions(diagnosis) {
  const seenLabels = new Set();
  return (diagnosis?.candidates || [])
    .map(getCandidateLabel)
    .filter(label => label && label.length <= 40)
    .filter(label => {
      const key = label.toLowerCase();
      if (seenLabels.has(key)) return false;
      seenLabels.add(key);
      return true;
    })
    .slice(0, 8)
    .map(label => ({
      value: `${CUSTOM_MODE_PREFIX}${slugifyModeLabel(label) || Date.now()}`,
      label: `诊断发现：${label}`,
      texts: [label],
      source: 'diagnosis',
    }));
}

function renderSiteSettings(preferences) {
  const container = document.getElementById('siteSettings');
  container.innerHTML = '';

  SITE.sites.forEach(site => {
    const sitePrefs = preferences.sites[site.id] || { enabled: true };
    const row = document.createElement('div');
    row.className = 'site-row';

    const toggleLabel = document.createElement('label');
    toggleLabel.className = 'site-toggle';

    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.checked = sitePrefs.enabled !== false;
    toggle.dataset.siteToggle = site.id;

    const name = document.createElement('span');
    name.textContent = site.name;
    toggleLabel.append(toggle, name);

    const select = document.createElement('select');
    select.className = 'mode-select';
    select.dataset.siteMode = site.id;
    getModeOptions(site, sitePrefs).forEach(option => {
      const item = document.createElement('option');
      item.value = option.value;
      item.textContent = option.label;
      select.appendChild(item);
    });
    const allowedModes = Array.from(select.options).map(option => option.value);
    const preferredMode = sitePrefs.mode || CURRENT_MODE_VALUE;
    select.value = allowedModes.includes(preferredMode) ? preferredMode : CURRENT_MODE_VALUE;
    select.disabled = !toggle.checked;

    async function persist() {
      preferences.sites[site.id] = {
        ...(preferences.sites[site.id] || {}),
        enabled: toggle.checked,
        mode: select.value,
        customModeOptions: sitePrefs.customModeOptions || [],
      };
      select.disabled = !toggle.checked;
      await savePreferences(preferences);
    }

    toggle.addEventListener('change', persist);
    select.addEventListener('change', persist);

    const badge = document.createElement('span');
    badge.className = 'site-status-badge';
    badge.dataset.siteStatus = site.id;
    badge.textContent = '';

    row.append(toggleLabel, select, badge);
    container.appendChild(row);
  });
}

async function getSendPreferences() {
  const preferences = await loadPreferences();
  document.querySelectorAll('[data-site-toggle]').forEach(toggle => {
    const siteId = toggle.dataset.siteToggle;
    const select = document.querySelector(`[data-site-mode="${siteId}"]`);
    preferences.sites[siteId] = {
      ...(preferences.sites[siteId] || {}),
      enabled: toggle.checked,
      mode: select?.value || preferences.sites[siteId]?.mode,
    };
  });
  await savePreferences(preferences);
  return preferences;
}

async function resetPreferences() {
  const preferences = defaultPreferences();
  await savePreferences(preferences);
  renderSiteSettings(preferences);
}

async function saveDetectedModesFromDiagnosis(log) {
  const preferences = await loadPreferences();
  let changedCount = 0;

  (log?.details || []).forEach(detail => {
    if (!detail.ok || !detail.diagnosis?.candidates?.length) return;
    const site = SITE.sites.find(item => item.name === detail.site || item.name === detail.diagnosis.platform);
    if (!site) return;

    const detectedOptions = buildDetectedModeOptions(detail.diagnosis);
    if (detectedOptions.length === 0) return;

    const currentPrefs = preferences.sites[site.id] || { enabled: true, mode: CURRENT_MODE_VALUE };
    const builtInLabels = new Set((site.modeOptions || []).flatMap(option => [
      option.label,
      ...(option.texts || []),
    ]).map(label => String(label).toLowerCase()));
    const existingCustom = Array.isArray(currentPrefs.customModeOptions) ? currentPrefs.customModeOptions : [];
    const existingLabels = new Set(existingCustom.flatMap(option => [
      String(option.label || '').replace(/^诊断发现：/, ''),
      ...(option.texts || []),
    ]).filter(Boolean).map(label => String(label).toLowerCase()));
    const merged = [...existingCustom];

    detectedOptions.forEach(option => {
      const rawLabel = option.texts[0];
      const key = rawLabel.toLowerCase();
      if (builtInLabels.has(key) || existingLabels.has(key)) return;
      merged.push(option);
      existingLabels.add(key);
      changedCount += 1;
    });

    preferences.sites[site.id] = {
      ...currentPrefs,
      customModeOptions: merged.slice(-12),
    };
  });

  if (changedCount > 0) {
    await savePreferences(preferences);
    renderSiteSettings(preferences);
  }

  return changedCount;
}

async function loadHistory() {
  const data = await storageGet(HISTORY_KEY);
  const history = (data[HISTORY_KEY] || []).slice(0, MAX_HISTORY);
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = '';

  if (history.length === 0) {
    historyList.innerHTML = '<div class="empty">暂无提示词历史</div>';
    return;
  }

  history.forEach(item => {
    const wrapper = document.createElement('button');
    wrapper.type = 'button';
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
  const logs = (data[SEND_LOGS_KEY] || []).slice(0, MAX_SEND_LOGS);
  const logList = document.getElementById('sendLogList');
  logList.innerHTML = '';

  if (logs.length === 0) {
    logList.innerHTML = '<div class="empty">暂无发送日志。弹窗关闭后，结果仍会保存在这里。</div>';
    return;
  }

  logs.map(normalizeLog).forEach(log => {
    const wrapper = document.createElement('article');
    wrapper.className = `log-item ${classifyLog(log)}`;

    const summary = `${log.mode} | 成功 ${log.successCount}/${log.targetCount} | ${formatTime(log.createdAt)}`;
    wrapper.appendChild(createTextEl('log-summary', summary));
    wrapper.appendChild(createTextEl('log-content', log.preview || ''));

    const detailLines = log.details.map(item => {
      if (item.skipped) return `${item.site}: 跳过 - ${item.error}`;
      if (item.note) return item.note;
      if (item.ok) return `${item.site}: 成功`;
      return `${item.site}: 失败 - ${item.error}`;
    });
    wrapper.appendChild(createTextEl('log-detail', detailLines.join('\n')));
    logList.appendChild(wrapper);
  });
}

async function clearSendLogs() {
  await storageRemove(SEND_LOGS_KEY);
  await loadSendLogs();
}

function buildStatus(mode, targetCount, successCount, details) {
  const failed = details.filter(item => !item.ok);
  const lines = [`${mode}: ${successCount}/${targetCount} 个页面确认成功。`];
  if (failed.length > 0) {
    lines.push('失败详情:');
    failed.forEach(item => lines.push(`${item.site}: ${item.error}`));
  }
  return lines.join('\n');
}

function sendRuntimeMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

// Delegate error log saving to background to avoid race conditions on storage.
// Falls back to direct storage write if background is unreachable.
async function saveLocalErrorLog(mode, preview, errorMessage) {
  const log = {
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
  };

  try {
    await sendRuntimeMessage({ action: 'saveErrorLog', log });
  } catch (_) {
    // Background unreachable — write directly as last resort
    const data = await storageGet(SEND_LOGS_KEY);
    const logs = data[SEND_LOGS_KEY] || [];
    logs.unshift(log);
    await storageSet({ [SEND_LOGS_KEY]: logs.slice(0, MAX_SEND_LOGS) });
  }
  await loadSendLogs();
}

function clearAllProgressBadges() {
  document.querySelectorAll('.site-status-badge').forEach(badge => {
    badge.textContent = '';
    delete badge.dataset.status;
    badge.removeAttribute('title');
  });
}

// Listen to progress updates from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'ai2tabProgressUpdate') {
    const badge = document.querySelector(`.site-status-badge[data-site-status="${message.siteId}"]`);
    if (badge) {
      badge.dataset.status = message.status;
      if (message.status === 'waiting') {
        badge.textContent = '等待中...';
      } else if (message.status === 'preparing') {
        badge.textContent = message.detail || '准备中...';
      } else if (message.status === 'sending') {
        badge.textContent = message.detail || '发送中...';
      } else if (message.status === 'success') {
        badge.textContent = '✓ 发送成功';
      } else if (message.status === 'error') {
        badge.textContent = '✗ 失败';
        badge.title = message.error || '发送失败';
      } else if (message.status === 'skipped') {
        badge.textContent = '已跳过';
      } else {
        badge.textContent = '';
      }
    }
  }
});

async function sendMessage() {
  const button = document.getElementById('sendBtn');
  const message = document.getElementById('message').value.trim();

  if (!message) {
    updateStatus('请输入提示词。', 'error');
    return;
  }

  if (message.length > MAX_INPUT_LENGTH) {
    updateStatus(`提示词过长（${message.length} 字符），请控制在 ${MAX_INPUT_LENGTH} 字符以内。`, 'error');
    return;
  }

  setBusy(button, true, '发送中...');
  clearAllProgressBadges();
  updateStatus('正在查找已打开且已启用的 AI 页面...', 'info');

  try {
    const preferences = await getSendPreferences();
    await saveToHistory(message);
    updateStatus('任务已交给后台执行。模式切换失败时会自动按当前页面模式继续发送。', 'info');

    const response = await sendRuntimeMessage({
      action: 'runAI2tabSend',
      mode: 'Text',
      content: message,
      preferences,
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

  if (prompt.length > MAX_INPUT_LENGTH) {
    updateStatus(`图片提示词过长（${prompt.length} 字符），请控制在 ${MAX_INPUT_LENGTH} 字符以内。`, 'error');
    return;
  }

  setBusy(button, true, '发送中...');
  clearAllProgressBadges();
  updateStatus('正在查找支持图片生成且已启用的 AI 页面...', 'info');

  try {
    const preferences = await getSendPreferences();
    const response = await sendRuntimeMessage({
      action: 'runAI2tabSend',
      mode: 'Image',
      prompt,
      size,
      preferences,
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

async function diagnoseModes() {
  const button = document.getElementById('diagnoseModesBtn');
  setBusy(button, true, '诊断中...');
  updateStatus('正在扫描已打开 AI 页面上的模型/模式控件...', 'info');

  try {
    const response = await sendRuntimeMessage({ action: 'diagnoseAI2tabModes' });
    await loadSendLogs();

    if (!response?.success) {
      updateStatus(response?.error || '模式控件诊断失败。', 'error');
      return;
    }

    const { targetCount, successCount } = response.log;
    const changedCount = await saveDetectedModesFromDiagnosis(response.log);
    const extra = changedCount > 0 ? ` 已追加 ${changedCount} 个可选模式。` : '';
    updateStatus(`模式控件诊断完成：${successCount}/${targetCount} 个页面返回结果。${extra}`, successCount > 0 ? 'success' : 'error');
  } catch (error) {
    await saveLocalErrorLog('Mode Diagnose', '模型/模式控件诊断', error.message);
    updateStatus(`模式控件诊断失败：${error.message}`, 'error');
  } finally {
    setBusy(button, false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    setupTabs();
    loadPreferences()
      .then(renderSiteSettings)
      .catch(error => updateStatus(`读取发送设置失败：${error.message}`, 'error'));
    loadHistory().catch(error => updateStatus(`读取历史失败：${error.message}`, 'error'));
    loadSendLogs().catch(error => updateStatus(`读取日志失败：${error.message}`, 'error'));
    document.getElementById('sendBtn')?.addEventListener('click', sendMessage);
    document.getElementById('generateImageBtn')?.addEventListener('click', generateImage);
    document.getElementById('diagnoseModesBtn')?.addEventListener('click', diagnoseModes);
    document.getElementById('clearHistoryBtn')?.addEventListener('click', clearHistory);
    document.getElementById('clearLogsBtn')?.addEventListener('click', clearSendLogs);
    document.getElementById('resetPrefsBtn')?.addEventListener('click', resetPreferences);
  } catch (error) {
    updateStatus(`弹窗初始化失败：${error.message}`, 'error');
  }
});
