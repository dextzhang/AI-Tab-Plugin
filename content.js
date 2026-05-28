(function() {
  const U = window.TabPluginUtils;
  const SITE = window.AI2TAB_SITE_CONFIG;
  const CONTENT_VERSION = (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) ? chrome.runtime.getManifest().version : '3.1.6';

  if (!U || !SITE) {
    console.error('[AI2tab] ai-sites.js and utils.js are required before content.js');
    return;
  }

  if (window.__AI2TAB_CONTENT_VERSION__ === CONTENT_VERSION && window.__AI2TAB_PROXY_LISTENER_INSTALLED__) {
    U.log(`Content script ${CONTENT_VERSION} already active.`);
    return;
  }

  window.__AI2TAB_CONTENT_VERSION__ = CONTENT_VERSION;

  // ── Timing constants ──
  const TIMING = {
    AFTER_CLEAR: 120,
    AFTER_SET: 550,
    AFTER_SUBMIT: 700,
    AFTER_FRESH_NAV: 900,
    AFTER_TOGGLE: 500,
    AFTER_MENU_CLICK: 550,
    AFTER_MODE_SELECT: 700,
  };

  function detectPlatform() {
    return SITE.getSiteByUrl(window.location.href);
  }

  function getVisibleByText(selector, texts) {
    return U.findVisibleByText(selector, texts || []);
  }

  function getSitePreference(message, platform) {
    return message.preferences?.sites?.[platform.id] || {};
  }

  function isDisabled(element) {
    return !element ||
      element.disabled ||
      element.getAttribute('aria-disabled') === 'true' ||
      /\b(disabled)\b/i.test(element.className || '');
  }

  function readInputValue(input) {
    return (input?.value || input?.textContent || '').trim();
  }

  function dispatchShortcut(shortcut) {
    if (!shortcut) return false;
    const view = window;
    const eventOptions = {
      key: shortcut.key,
      code: shortcut.code || `Key${String(shortcut.key || '').toUpperCase()}`,
      keyCode: shortcut.keyCode || String(shortcut.key || '').toUpperCase().charCodeAt(0),
      which: shortcut.which || String(shortcut.key || '').toUpperCase().charCodeAt(0),
      bubbles: true,
      cancelable: true,
      composed: true,
      ctrlKey: Boolean(shortcut.ctrlKey),
      shiftKey: Boolean(shortcut.shiftKey),
      altKey: Boolean(shortcut.altKey),
      metaKey: Boolean(shortcut.metaKey),
    };
    document.dispatchEvent(new view.KeyboardEvent('keydown', eventOptions));
    document.dispatchEvent(new view.KeyboardEvent('keyup', eventOptions));
    return true;
  }

  function samePageFreshUrl(platform) {
    return platform.freshUrls?.find(url => SITE.matchesSite(platform, url)) || null;
  }

  async function maybeNavigateToFreshUrl(platform) {
    if (!platform.allowContentNavigation) return false;

    const freshUrl = samePageFreshUrl(platform);
    if (!freshUrl) return false;

    const current = SITE.parseUrl(window.location.href);
    const target = SITE.parseUrl(freshUrl);
    if (!current || !target || current.origin !== target.origin) return false;

    const currentRoute = `${current.pathname || '/'}${current.hash || ''}`;
    const targetRoute = `${target.pathname || '/'}${target.hash || ''}`;
    if (currentRoute === targetRoute && !platform.isExistingConversation?.(current)) return false;

    window.location.href = freshUrl;
    await U.delay(platform.delayAfterFreshChat + TIMING.AFTER_FRESH_NAV);
    return true;
  }

  function isStillExistingConversation(platform) {
    const parsed = SITE.parseUrl(window.location.href);
    return Boolean(parsed && platform.isExistingConversation?.(parsed));
  }

  async function startFreshChat(platform, mode) {
    if (mode === 'image' && platform.skipFreshChatForImage) return true;

    const startedOnExisting = isStillExistingConversation(platform);

    if (await maybeNavigateToFreshUrl(platform)) {
      if (platform.requireFreshChat && isStillExistingConversation(platform)) {
        throw new Error(`${platform.name} 未能通过 URL 进入新对话，已停止以避免追加到旧会话。`);
      }
      return true;
    }

    const button = U.findVisible(platform.selectors.newChat) ||
      getVisibleByText('a,button,div[role="button"]', platform.newChatText);

    if (button && !isDisabled(button)) {
      U.clickEl(button);
      await U.delay(platform.delayAfterFreshChat || 1200);
      if (platform.requireFreshChat && startedOnExisting && isStillExistingConversation(platform)) {
        throw new Error(`${platform.name} 新建对话按钮未生效，已停止以避免追加到旧会话。`);
      }
      return true;
    }

    if (dispatchShortcut(platform.newChatShortcut)) {
      await U.delay(platform.delayAfterFreshChat || 1200);
      if (platform.requireFreshChat && startedOnExisting && isStillExistingConversation(platform)) {
        throw new Error(`${platform.name} 新建对话快捷键未生效，已停止以避免追加到旧会话。`);
      }
      return true;
    }

    if (platform.requireFreshChat && startedOnExisting) {
      throw new Error(`${platform.name} 未找到可靠的新建对话入口，已停止以避免追加到旧会话。`);
    }

    U.log(`${platform.name}: no fresh-chat control found, continuing on current page.`);
    return true;
  }

  function scoreSendButton(button, input, platform) {
    let score = 0;
    const text = `${button.textContent || ''} ${button.getAttribute('aria-label') || ''} ${button.title || ''}`;
    const rect = button.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    const sendText = platform.sendText || ['Send', '发送'];

    if (sendText.some(item => text.includes(item))) score += 10;
    if (/send|submit|arrow|paper|发送/i.test(button.outerHTML)) score += 6;
    if (rect.left >= inputRect.left - 120 && rect.top >= inputRect.top - 120) score += 3;
    if (!isDisabled(button)) score += 2;
    return score;
  }

  function findBestSendButton(platform, input) {
    const directButton = U.findVisible(platform.selectors.send);
    if (directButton && !isDisabled(directButton)) return directButton;

    const textButton = getVisibleByText('button,div[role="button"]', platform.sendText || ['Send', '发送']);
    if (textButton && !isDisabled(textButton)) return textButton;

    const container = input.closest('form') ||
      input.closest('[role="form"]') ||
      input.closest('[class*="input"]') ||
      input.closest('[class*="composer"]') ||
      input.parentElement;

    const candidates = Array.from(U.deepQuerySelectorAll(
      'button,div[role="button"],[data-testid*="send"],[class*="send"],[aria-label*="Send"],[aria-label*="发送"]',
      container || document
    )).filter(button => U.isVisible(button) && !isDisabled(button));

    return candidates
      .map(button => ({ button, score: scoreSendButton(button, input, platform) }))
      .sort((a, b) => b.score - a.score)[0]?.button || null;
  }

  async function findInput(platform) {
    const input = await U.waitForVisible(() => U.findVisible(platform.selectors.input), 20000, 500);
    if (!input) {
      throw new Error('未找到输入框');
    }
    return input;
  }

  async function writePrompt(platform, input, content) {
    const strategy = platform.inputStrategy || 'default';

    if (platform.clearBeforeSubmit) {
      U.clearInput(input);
      await U.delay(TIMING.AFTER_CLEAR);
    }
    U.setInput(input, content, strategy);
    await U.delay(TIMING.AFTER_SET);

    const current = readInputValue(input);
    if (!current || !current.includes(content.slice(0, Math.min(content.length, 40)))) {
      U.clearInput(input);
      await U.delay(TIMING.AFTER_CLEAR);
      U.setInput(input, content, strategy);
      await U.delay(TIMING.AFTER_SET);
    }
  }

  async function waitForSendEffect(input, timeout = 2800) {
    return U.waitFor(() => {
      const value = readInputValue(input);
      const busy = document.querySelector('[aria-busy="true"],[data-loading="true"],.loading,[class*="generating"],[class*="pending"]');
      return value.length === 0 || busy ? true : null;
    }, timeout, 200);
  }

  function pressKey(input, keySpec = { key: 'Enter' }) {
    input.focus();
    const view = input.ownerDocument?.defaultView || window;
    const eventOptions = {
      key: keySpec.key || 'Enter',
      code: keySpec.code || keySpec.key || 'Enter',
      keyCode: keySpec.keyCode || 13,
      which: keySpec.which || 13,
      bubbles: true,
      cancelable: true,
      composed: true,
      ctrlKey: Boolean(keySpec.ctrlKey),
      shiftKey: Boolean(keySpec.shiftKey),
      altKey: Boolean(keySpec.altKey),
      metaKey: Boolean(keySpec.metaKey),
    };
    input.dispatchEvent(new view.KeyboardEvent('keydown', eventOptions));
    input.dispatchEvent(new view.KeyboardEvent('keypress', eventOptions));
    input.dispatchEvent(new view.KeyboardEvent('keyup', eventOptions));
  }

  async function submit(platform, input, mode) {
    const needsVerify = platform.requireSendEffect || (mode === 'image' && platform.verifySendEffectForImage);
    const submitKeys = platform.submitKeys || [{ key: 'Enter' }];

    if (platform.preferEnter) {
      pressKey(input, submitKeys[0]);
      await U.delay(TIMING.AFTER_SUBMIT);
      if (!needsVerify || await waitForSendEffect(input)) return true;
    }

    const button = await U.waitFor(() => findBestSendButton(platform, input), 3500, 200);
    if (button && !isDisabled(button)) {
      U.clickEl(button);
      await U.delay(TIMING.AFTER_SUBMIT);
      if (!needsVerify || await waitForSendEffect(input)) return true;
    }

    for (const keySpec of submitKeys) {
      pressKey(input, keySpec);
      await U.delay(TIMING.AFTER_SUBMIT);
      if (!needsVerify || await waitForSendEffect(input)) return true;
    }

    throw new Error('输入已填入，但未检测到发送成功；可能发送按钮或键盘提交被页面拦截。');
  }

  function getSelectedMode(platform, preference) {
    const selected = preference.mode || platform.defaultMode || platform.modeOptions?.[0]?.value;
    if (!selected || selected === 'current') {
      return { value: 'current', label: '当前页面模型', skipSelection: true };
    }
    const options = [
      ...(platform.modeOptions || []),
      ...(Array.isArray(preference.customModeOptions) ? preference.customModeOptions : []),
    ];
    return options.find(option => option.value === selected) || null;
  }

  function compactText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 90);
  }

  function describeElement(element) {
    const rect = element.getBoundingClientRect();
    const text = compactText(element.textContent || element.value);
    const aria = compactText(element.getAttribute('aria-label'));
    const title = compactText(element.getAttribute('title'));
    const testId = compactText(element.getAttribute('data-testid') || element.getAttribute('data-test-id'));
    const role = compactText(element.getAttribute('role'));
    const classes = compactText(element.className);
    const signal = [text, aria, title, testId, role, classes].join(' ');

    return {
      tag: element.tagName.toLowerCase(),
      text,
      aria,
      title,
      testId,
      role,
      classes: classes.slice(0, 80),
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      box: `${Math.round(rect.left)},${Math.round(rect.top)} ${Math.round(rect.width)}x${Math.round(rect.height)}`,
      signal: compactText(signal),
    };
  }

  function isLikelyModeControl(item, options = {}) {
    const role = String(item.role || '').toLowerCase();
    const testId = String(item.testId || '').toLowerCase();
    const classes = String(item.classes || '').toLowerCase();
    const text = String(item.text || '').trim();

    if (role === 'textbox' || item.tag === 'section') return false;
    if (/conversation|history|profile|account|side-nav|nav|sidebar/.test(testId)) return false;
    if (/conversation|history|profile|account|side-nav|nav|sidebar/.test(classes)) return false;
    if (!options.allowAnyPosition && item.left < 260) return false;
    if (item.width > 420 || item.height > 90) return false;
    if (text.length > 48) return false;

    return ['button', 'select', 'option'].includes(item.tag) ||
      ['button', 'tab', 'switch', 'checkbox', 'combobox', 'menuitem', 'option'].includes(role) ||
      Boolean(item.aria || item.title || item.testId);
  }

  function findModeCandidate(texts, selector, options = {}) {
    const wanted = (texts || []).filter(Boolean).map(item => String(item).toLowerCase());
    return Array.from(U.deepQuerySelectorAll(selector))
      .filter(element => U.isVisible(element))
      .map(element => ({ element, info: describeElement(element) }))
      .filter(item => isLikelyModeControl(item.info, options))
      .find(item => wanted.some(text => item.info.signal.toLowerCase().includes(text)))?.element || null;
  }

  function isUnavailableModeItem(element) {
    if (!element || isDisabled(element)) return true;
    const signal = [
      element.textContent,
      element.getAttribute('aria-label'),
      element.getAttribute('title'),
      element.getAttribute('data-testid'),
      element.getAttribute('data-test-id'),
      element.className,
    ].join(' ').toLowerCase();

    return /upgrade|subscribe|subscription|premium|plan|locked|lock|unavailable|disabled|limit|权限|升级|订阅|会员|解锁|不可用|限额|无权/.test(signal);
  }

  function getFallbackModeOption(platform, failedOption) {
    const fallbackValue = platform.defaultMode || platform.modeOptions?.[0]?.value;
    if (!fallbackValue || fallbackValue === failedOption?.value) return null;
    return platform.modeOptions?.find(option => option.value === fallbackValue) || null;
  }

  function isActiveControl(element) {
    if (!element) return false;
    if (['aria-checked', 'aria-pressed', 'aria-selected'].some(name => element.getAttribute(name) === 'true')) {
      return true;
    }
    if (/\b(active|selected|checked|is-active)\b/i.test(String(element.className || ''))) {
      return true;
    }

    const style = window.getComputedStyle(element);
    const color = style.color.match(/\d+/g)?.map(Number) || [];
    if (color.length >= 3 && color[2] > color[0] + 40 && color[2] > color[1] + 20) {
      return true;
    }

    return Boolean(element.closest('[aria-checked="true"],[aria-pressed="true"],[aria-selected="true"],[class*="active"],[class*="selected"]'));
  }

  function diagnoseModeControls(platform) {
    const keywords = [
      'model', 'mode', 'reason', 'think', 'thinking', 'pro', 'flash', 'expert', 'beta', 'heavy', 'auto',
      '模型', '模式', '思考', '推理', '专家', '快速', '普通', '高级', '深度', '测试', '联网', '自动',
      ...(platform.modeOptions || []).flatMap(option => [option.label, ...(option.texts || [])]),
    ].filter(Boolean);

    const selector = [
      'button',
      'select',
      'option',
      '[role="button"]',
      '[role="tab"]',
      '[role="switch"]',
      '[role="checkbox"]',
      '[role="combobox"]',
      '[role="menuitem"]',
      '[aria-haspopup]',
      '[aria-label]',
      '[title]',
      '[data-testid]',
      '[data-test-id]',
    ].join(',');

    const elements = Array.from(U.deepQuerySelectorAll(selector))
      .filter(element => U.isVisible(element))
      .map(describeElement)
      .filter(isLikelyModeControl)
      .filter(item => !/已思考|复制|切换模型|重新生成|重新回答|\d+s$/.test(item.text.trim()))
      .filter(item => keywords.some(keyword => item.signal.toLowerCase().includes(String(keyword).toLowerCase())))
      .slice(0, 40);

    return {
      platform: platform.name,
      url: window.location.href,
      count: elements.length,
      candidates: elements,
    };
  }

  async function applyModePreference(platform, preference, fallbackAllowed = true) {
    const option = getSelectedMode(platform, preference);
    if (!option) return true;
    if (option.skipSelection) {
      U.log(`${platform.name}: using current page model; mode switching skipped.`);
      return true;
    }

    const targets = option.texts || [option.label];
    const controlSelector = 'button,select,option,div[role="button"],div[role="tab"],div[role="switch"],div[role="combobox"],[aria-label],[title],[data-testid],[data-test-id]';

    async function fallbackToDefault(reason) {
      const fallback = fallbackAllowed ? getFallbackModeOption(platform, option) : null;
      if (!fallback) {
        U.log(`${platform.name}: mode ${option.label} ${reason}; continuing with current mode.`);
        return false;
      }

      U.log(`${platform.name}: mode ${option.label} ${reason}; falling back to ${fallback.label}.`);
      return applyModePreference(platform, { ...preference, mode: fallback.value }, false);
    }

    if (platform.modeStrategy === 'toggle') {
      const toggle = findModeCandidate(targets, controlSelector) ||
        findModeCandidate(platform.modeTriggerTexts || targets, controlSelector);
      if (!toggle) {
        U.log(`${platform.name}: toggle mode ${option.label} was not found; keeping current mode.`);
        return false;
      }
      if (isUnavailableModeItem(toggle)) {
        return fallbackToDefault('was not available');
      }

      const desiredActive = option.desiredActive !== false;
      if (isActiveControl(toggle) !== desiredActive) {
        U.clickEl(toggle);
        await U.delay(TIMING.AFTER_TOGGLE);
      }
      U.log(`${platform.name}: ensured toggle mode ${option.label}.`);
      return true;
    }

    const alreadySelected = findModeCandidate(targets, controlSelector);
    if (alreadySelected && !isUnavailableModeItem(alreadySelected)) {
      U.log(`${platform.name}: mode ${option.label} appears to be current or directly available; mode switch skipped.`);
      return true;
    }

    const menu = findModeCandidate(platform.modeTriggerTexts || targets, controlSelector) || U.findVisible([
      'button[aria-label*="model"]',
      'button[aria-label*="Model"]',
      'button[aria-label*="模型"]',
      'button[aria-label*="模式"]',
      'button[data-testid*="model"]',
      'button[class*="model"]',
      'div[role="button"][aria-label*="模型"]',
      'div[role="button"][aria-label*="模式"]',
      'div[role="combobox"]',
      '[aria-haspopup="listbox"]',
      '[aria-haspopup="menu"]',
    ]);

    if (menu && !isDisabled(menu)) {
      U.clickEl(menu);
      await U.delay(TIMING.AFTER_MENU_CLICK);
      const item = findModeCandidate(
        targets,
        'button,div[role="button"],div[role="option"],li,[role="menuitem"],span,[aria-label],[title],[data-testid],[data-test-id]',
        { allowAnyPosition: true }
      );
      if (item && isUnavailableModeItem(item)) {
        return fallbackToDefault('was not available');
      }
      if (item) {
        U.clickEl(item);
        await U.delay(TIMING.AFTER_MODE_SELECT);
        U.log(`${platform.name}: selected mode ${option.label} from menu.`);
        return true;
      }
    }

    U.log(`${platform.name}: mode ${option.label} was not found; keeping current mode.`);
    return false;
  }

  async function runPlatformAction(content, mode, platform, preference = {}) {
    if (typeof platform.customRunAction === 'function') {
      return platform.customRunAction(content, mode, platform, preference, U);
    }

    U.log(`${platform.name}: start ${mode} action.`);
    await startFreshChat(platform, mode);
    await applyModePreference(platform, preference);

    const input = await findInput(platform);
    const finalContent = mode === 'image'
      ? `请生成图片：${content}`
      : content;

    await writePrompt(platform, input, finalContent);
    await submit(platform, input, mode);
    U.log(`${platform.name}: message dispatched.`);
    return true;
  }

  function handleMessage(message, sender, sendResponse) {
    const platform = detectPlatform();
    if (!platform) {
      sendResponse({ success: false, error: '当前页面不是已支持的 AI 站点' });
      return true;
    }

    if (message.action === 'sendMessage' || message.action === 'sendMessageV2') {
      runPlatformAction(message.content || '', 'text', platform, getSitePreference(message, platform))
        .then(() => sendResponse({ success: true, platform: platform.name }))
        .catch(error => {
          U.error(`${platform.name}: send failed`, error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }

    if (message.action === 'generateImage' || message.action === 'generateImageV2') {
      const content = `${message.prompt || ''}，尺寸：${message.size || '1024x1024'}`;
      runPlatformAction(content, 'image', platform, getSitePreference(message, platform))
        .then(() => sendResponse({ success: true, platform: platform.name }))
        .catch(error => {
          U.error(`${platform.name}: image request failed`, error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }

    if (message.action === 'ping') {
      sendResponse({ success: true, platform: platform.name, version: CONTENT_VERSION });
      return true;
    }

    if (message.action === 'diagnoseModes') {
      try {
        sendResponse({ success: true, diagnosis: diagnoseModeControls(platform) });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }

    // Unknown action
    sendResponse({ success: false, error: `Unknown action: ${message.action}` });
    return true;
  }

  window.__AI2TAB_HANDLE_MESSAGE__ = handleMessage;

  if (!window.__AI2TAB_PROXY_LISTENER_INSTALLED__) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (typeof window.__AI2TAB_HANDLE_MESSAGE__ !== 'function') {
        sendResponse({ success: false, error: 'AI2tab handler is not ready' });
        return false;
      }
      return window.__AI2TAB_HANDLE_MESSAGE__(message, sender, sendResponse);
    });
    window.__AI2TAB_PROXY_LISTENER_INSTALLED__ = true;
  }

  U.log(`Content script ${CONTENT_VERSION} loaded for`, detectPlatform()?.name || window.location.href);
})();
