window.TabPluginUtils = (function() {
  const UTILS_VERSION = '3.2.1';
  const MAX_SHADOW_DEPTH = 5;
  const MAX_INPUT_LENGTH = 30000;

  let debugEnabled = true;

  // Allow runtime debug toggle via storage
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get('ai2tab_debug', data => {
        if (data.ai2tab_debug === false) debugEnabled = false;
      });
    }
  } catch (_) { /* not in extension context */ }

  function log(...args) {
    if (debugEnabled) {
      console.log('[AI2tab]', new Date().toISOString(), ...args);
    }
  }

  function error(...args) {
    console.error('[AI2tab Error]', new Date().toISOString(), ...args);
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function normalizeList(value) {
    return Array.isArray(value) ? value : [value];
  }

  function find(selectors) {
    for (const selector of normalizeList(selectors)) {
      try {
        const element = deepQuerySelector(selector);
        if (element) return element;
      } catch (err) {
        log('Invalid selector skipped:', selector);
      }
    }
    return null;
  }

  function findVisible(selectors) {
    for (const selector of normalizeList(selectors)) {
      try {
        const elements = Array.from(deepQuerySelectorAll(selector));
        const element = elements.find(item => isVisible(item));
        if (element) return element;
      } catch (err) {
        log('Invalid selector skipped:', selector);
      }
    }
    return null;
  }

  function findAll(selectors) {
    const result = [];
    for (const selector of normalizeList(selectors)) {
      try {
        result.push(...deepQuerySelectorAll(selector));
      } catch (err) {
        log('Invalid selector skipped:', selector);
      }
    }
    return result;
  }

  function deepQuerySelector(selector, root = document, depth = MAX_SHADOW_DEPTH) {
    try {
      const element = root.querySelector(selector);
      if (element) return element;
    } catch (err) {
      return null;
    }

    if (depth <= 0) return null;

    const allElements = root.querySelectorAll ? root.querySelectorAll('*') : [];
    for (const host of allElements) {
      if (host.shadowRoot) {
        const found = deepQuerySelector(selector, host.shadowRoot, depth - 1);
        if (found) return found;
      }
    }
    return null;
  }

  function deepQuerySelectorAll(selector, root = document, results = [], depth = MAX_SHADOW_DEPTH) {
    try {
      results.push(...root.querySelectorAll(selector));
    } catch (err) {
      return results;
    }

    if (depth <= 0) return results;

    const allElements = root.querySelectorAll ? root.querySelectorAll('*') : [];
    for (const host of allElements) {
      if (host.shadowRoot) {
        deepQuerySelectorAll(selector, host.shadowRoot, results, depth - 1);
      }
    }
    return results;
  }

  function isVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      rect.width > 0 &&
      rect.height > 0;
  }

  function textIncludes(element, texts) {
    const content = (element.textContent || element.value || element.getAttribute('aria-label') || '').trim();
    return normalizeList(texts).some(text => content.includes(text));
  }

  function findByText(selector, texts) {
    return Array.from(deepQuerySelectorAll(selector)).find(element => textIncludes(element, texts)) || null;
  }

  function findVisibleByText(selector, texts) {
    return Array.from(deepQuerySelectorAll(selector))
      .find(element => isVisible(element) && textIncludes(element, texts)) || null;
  }

  function getElementWindow(element) {
    return element.ownerDocument?.defaultView || window;
  }

  function dispatchInputEvents(element, value) {
    const view = getElementWindow(element);
    try {
      element.dispatchEvent(new view.InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: value,
      }));
    } catch (err) {
      element.dispatchEvent(new view.Event('beforeinput', { bubbles: true, cancelable: true }));
    }
    element.dispatchEvent(new view.InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: value,
    }));
    element.dispatchEvent(new view.Event('change', { bubbles: true }));
  }

  function dispatchValueEvents(element) {
    const view = getElementWindow(element);
    try {
      element.dispatchEvent(new view.InputEvent('input', {
        bubbles: true,
        cancelable: true,
        composed: true,
        inputType: 'insertReplacementText',
      }));
    } catch (err) {
      element.dispatchEvent(new view.Event('input', { bubbles: true, composed: true }));
    }
    element.dispatchEvent(new view.Event('change', { bubbles: true, composed: true }));
  }

  function setTextControlValue(element, value) {
    const view = getElementWindow(element);
    const proto = element.tagName === 'TEXTAREA' ? view.HTMLTextAreaElement.prototype : view.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(element, value);
    else element.value = value;
  }

  function pasteIntoEditable(element, value) {
    const view = getElementWindow(element);
    try {
      const data = new view.DataTransfer();
      data.setData('text/plain', value);
      const event = new view.ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: data,
      });
      element.dispatchEvent(event);
      if (event.defaultPrevented) return true;
    } catch (err) {
      log('Clipboard paste fallback skipped:', err.message);
    }
    return false;
  }

  function replaceEditableText(element, value) {
    const view = getElementWindow(element);
    const doc = element.ownerDocument || document;
    element.focus();

    let inserted = false;
    try {
      const selection = view.getSelection();
      const range = doc.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
      inserted = doc.execCommand('insertText', false, value);
    } catch (err) {
      log('Editable insertText fallback skipped:', err.message);
    }

    if (!inserted || (element.textContent || '').trim() !== value.trim()) {
      element.textContent = value;
    }

    dispatchValueEvents(element);
    element.dispatchEvent(new view.CompositionEvent('compositionend', { bubbles: true, data: value }));
    return true;
  }

  // ── Input strategy: reactNativeSetter (Qwen, Kimi) ──
  // Uses native property setter to clear then set value, dispatches value events.
  function setInputReactNativeSetter(element, value) {
    const view = getElementWindow(element);
    element.focus();

    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      setTextControlValue(element, '');
      setTextControlValue(element, value);
      dispatchValueEvents(element);
      return true;
    }

    return replaceEditableText(element, value);
  }

  // ── Input strategy: clearThenInput (Doubao) ──
  // Clears via native setter with input events, then sets with composed input event.
  function setInputClearThenInput(element, value) {
    const view = getElementWindow(element);
    element.focus();

    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      const proto = element.tagName === 'TEXTAREA' ? view.HTMLTextAreaElement.prototype : view.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) setter.call(element, '');
      else element.value = '';
      dispatchInputEvents(element, '');
      if (setter) setter.call(element, value);
      else element.value = value;
      try {
        element.dispatchEvent(new view.InputEvent('input', {
          bubbles: true,
          cancelable: true,
          composed: true,
          inputType: 'insertText',
          data: value,
        }));
      } catch (err) {
        dispatchInputEvents(element, value);
      }
      element.dispatchEvent(new view.Event('change', { bubbles: true, composed: true }));
      return true;
    }

    return replaceEditableText(element, value);
  }

  // ── Input strategy: default (ChatGPT, Gemini, Grok) ──
  function setInputDefault(element, value) {
    const view = getElementWindow(element);
    const doc = element.ownerDocument || document;
    element.focus();

    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      const proto = element.tagName === 'TEXTAREA' ? view.HTMLTextAreaElement.prototype : view.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) setter.call(element, value);
      else element.value = value;
      dispatchInputEvents(element, value);
    } else {
      const selection = view.getSelection();
      const range = doc.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);

      pasteIntoEditable(element, value);
      if ((element.textContent || '').trim() !== value.trim()) {
        element.focus();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
        const inserted = doc.execCommand('insertText', false, value);
        if (!inserted || !(element.textContent || '').includes(value)) {
          element.textContent = value;
        }
      }
      dispatchInputEvents(element, value);
      element.dispatchEvent(new view.CompositionEvent('compositionend', { bubbles: true, data: value }));
    }

    const currentText = element.value || element.textContent || '';
    if (!currentText.includes(value)) {
      if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        const proto = element.tagName === 'TEXTAREA' ? view.HTMLTextAreaElement.prototype : view.HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (setter) setter.call(element, value);
        else element.value = value;
      } else {
        element.textContent = value;
      }
      dispatchInputEvents(element, value);
    }
    return true;
  }

  // ── Input strategy: geminiEditable (Gemini contenteditable + Quill.js) ──
  // Gemini uses a contenteditable div backed by Quill.js inside a web component.
  // We must dispatch beforeinput to notify the framework, then use execCommand
  // or clipboard paste, and finally fire input events for state sync.
  function setInputGeminiEditable(element, value) {
    const view = getElementWindow(element);
    const doc = element.ownerDocument || document;
    element.focus();

    // For textarea/input (unlikely in Gemini but safe fallback)
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      setTextControlValue(element, '');
      setTextControlValue(element, value);
      dispatchInputEvents(element, value);
      return true;
    }

    // Step 1: Select all existing content
    try {
      const selection = view.getSelection();
      const range = doc.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
    } catch (err) {
      log('Gemini: selection setup failed:', err.message);
    }

    // Step 2: Notify framework via beforeinput
    try {
      element.dispatchEvent(new view.InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        composed: true,
        inputType: 'insertReplacementText',
        data: value,
      }));
    } catch (_) {}

    // Step 3: Try clipboard paste first (most compatible with Quill.js)
    let pasted = false;
    try {
      const data = new view.DataTransfer();
      data.setData('text/plain', value);
      const pasteEvent = new view.ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        composed: true,
        clipboardData: data,
      });
      element.dispatchEvent(pasteEvent);
      if (pasteEvent.defaultPrevented) {
        pasted = true;
      }
    } catch (err) {
      log('Gemini: clipboard paste skipped:', err.message);
    }

    // Step 4: If paste didn't work, try execCommand
    if (!pasted || !(element.textContent || '').includes(value.slice(0, 20))) {
      try {
        const selection = view.getSelection();
        const range = doc.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
        const inserted = doc.execCommand('insertText', false, value);
        if (inserted && (element.textContent || '').includes(value.slice(0, 20))) {
          pasted = true;
        }
      } catch (err) {
        log('Gemini: execCommand insertText failed:', err.message);
      }
    }

    // Step 5: Last resort — direct textContent assignment
    if (!(element.textContent || '').includes(value.slice(0, 20))) {
      const firstP = element.querySelector('p');
      if (firstP) {
        firstP.textContent = value;
        // 移除其他多余的段落，以防止重复
        element.querySelectorAll('p').forEach((p, idx) => {
          if (idx > 0) p.remove();
        });
      } else {
        while (element.firstChild) {
          element.removeChild(element.firstChild);
        }
        // Insert as a paragraph element to match Quill's expected structure
        const p = doc.createElement('p');
        p.textContent = value;
        element.appendChild(p);
      }
    }

    // Step 6: Fire input events to trigger framework state update
    try {
      element.dispatchEvent(new view.InputEvent('input', {
        bubbles: true,
        cancelable: true,
        composed: true,
        inputType: 'insertText',
        data: value,
      }));
    } catch (_) {
      element.dispatchEvent(new view.Event('input', { bubbles: true, composed: true }));
    }
    element.dispatchEvent(new view.Event('change', { bubbles: true, composed: true }));
    element.dispatchEvent(new view.CompositionEvent('compositionend', { bubbles: true, composed: true, data: value }));

    return true;
  }

  const INPUT_STRATEGIES = {
    reactNativeSetter: setInputReactNativeSetter,
    clearThenInput: setInputClearThenInput,
    geminiEditable: setInputGeminiEditable,
    default: setInputDefault,
  };

  /**
   * Set the value of an input element using a platform-specific strategy.
   * @param {HTMLElement} element - The input element
   * @param {string} value - The value to set
   * @param {string} [strategy='default'] - One of 'default', 'reactNativeSetter', 'clearThenInput'
   */
  function setInput(element, value, strategy = 'default') {
    if (!element) return false;

    const strategyFn = INPUT_STRATEGIES[strategy];
    if (strategyFn) {
      const result = strategyFn(element, value);
      // If strategy returned null (e.g. clearThenInput for contenteditable), fall through to default
      if (result !== null) return result;
    }

    return setInputDefault(element, value);
  }

  function clearInput(element) {
    if (!element) return false;
    const view = getElementWindow(element);
    element.focus();

    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      const proto = element.tagName === 'TEXTAREA' ? view.HTMLTextAreaElement.prototype : view.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) setter.call(element, '');
      else element.value = '';
    } else {
      let cleared = false;
      try {
        const selection = view.getSelection();
        const range = element.ownerDocument.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
        cleared = element.ownerDocument.execCommand('delete', false, null);
      } catch (err) {
        log('clearInput execCommand failed:', err.message);
      }

      if (!cleared || (element.textContent || '').trim() !== '') {
        // Fallback: 避免直接清空整个 textContent 破坏 contenteditable 的富文本框架
        const firstP = element.querySelector('p');
        if (firstP) {
          firstP.innerHTML = '<br>';
          element.querySelectorAll('p').forEach((p, idx) => {
            if (idx > 0) p.remove();
          });
        } else {
          element.innerHTML = '<p><br></p>';
        }
      }
    }

    dispatchInputEvents(element, '');
    element.dispatchEvent(new view.CompositionEvent('compositionend', { bubbles: true, data: '' }));
    return true;
  }

  function keyboardEnter(element, options = {}) {
    if (!element) return;
    const eventOptions = {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
      ...options,
    };
    element.dispatchEvent(new KeyboardEvent('keydown', eventOptions));
    element.dispatchEvent(new KeyboardEvent('keypress', eventOptions));
    element.dispatchEvent(new KeyboardEvent('keyup', eventOptions));
  }

  function pressEnter(element) {
    keyboardEnter(element);
  }

  function pressCtrlEnter(element) {
    keyboardEnter(element, { ctrlKey: true, metaKey: true });
  }

  function clickEl(element) {
    if (!element) return false;
    try {
      element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      const rect = element.getBoundingClientRect();
      const clientX = rect.left + rect.width / 2;
      const clientY = rect.top + rect.height / 2;
      const base = {
        bubbles: true,
        cancelable: true,
        composed: true,
        clientX,
        clientY,
        screenX: window.screenX + clientX,
        screenY: window.screenY + clientY,
        button: 0,
        buttons: 1,
      };
      element.dispatchEvent(new PointerEvent('pointerdown', { ...base, pointerId: 1, pointerType: 'mouse', isPrimary: true }));
      element.dispatchEvent(new MouseEvent('mousedown', base));
      element.dispatchEvent(new PointerEvent('pointerup', { ...base, buttons: 0, pointerId: 1, pointerType: 'mouse', isPrimary: true }));
      element.dispatchEvent(new MouseEvent('mouseup', { ...base, buttons: 0 }));
      element.click();
      return true;
    } catch (err) {
      error('clickEl failed:', err);
      return false;
    }
  }

  async function waitFor(getter, timeout = 6000, interval = 250) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const value = getter();
      if (value) return value;
      await delay(interval);
    }
    return null;
  }

  async function waitForVisible(getter, timeout = 6000, interval = 250) {
    return waitFor(() => {
      const element = getter();
      return isVisible(element) ? element : null;
    }, timeout, interval);
  }

  async function retry(fn, maxAttempts = 3, delayMs = 500) {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const result = await fn();
        if (result) return result;
      } catch (err) {
        error(`Retry ${attempt} failed:`, err);
      }
      if (attempt < maxAttempts) await delay(delayMs);
    }
    return null;
  }

  return {
    version: UTILS_VERSION,
    MAX_INPUT_LENGTH,
    log,
    error,
    delay,
    find,
    findVisible,
    findAll,
    findByText,
    findVisibleByText,
    deepQuerySelector,
    deepQuerySelectorAll,
    setInput,
    clearInput,
    pressEnter,
    pressCtrlEnter,
    clickEl,
    waitFor,
    waitForVisible,
    retry,
    isVisible,
  };
})();
