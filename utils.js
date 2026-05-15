window.TabPluginUtils = (function() {
  const DEBUG = true;
  const UTILS_VERSION = '2.0.0';

  function log(...args) {
    if (DEBUG) {
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

  function deepQuerySelector(selector, root = document) {
    try {
      const element = root.querySelector(selector);
      if (element) return element;
    } catch (err) {
      return null;
    }

    const allElements = root.querySelectorAll ? root.querySelectorAll('*') : [];
    for (const host of allElements) {
      if (host.shadowRoot) {
        const found = deepQuerySelector(selector, host.shadowRoot);
        if (found) return found;
      }
    }
    return null;
  }

  function deepQuerySelectorAll(selector, root = document, results = []) {
    try {
      results.push(...root.querySelectorAll(selector));
    } catch (err) {
      return results;
    }

    const allElements = root.querySelectorAll ? root.querySelectorAll('*') : [];
    for (const host of allElements) {
      if (host.shadowRoot) {
        deepQuerySelectorAll(selector, host.shadowRoot, results);
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

  function setInput(element, value) {
    if (!element) return false;
    const view = getElementWindow(element);
    const siteName = element.dataset.ai2tabSite || '';
    element.focus();

    if (siteName === '千问/Qwen') {
      if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        setTextControlValue(element, '');
        setTextControlValue(element, value);
        dispatchValueEvents(element);
        return true;
      }

      return replaceEditableText(element, value);
    }

    if (siteName === '豆包' && (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT')) {
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

    if (siteName === 'Kimi') {
      if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        setTextControlValue(element, '');
        setTextControlValue(element, value);
        dispatchValueEvents(element);
        return true;
      }

      return replaceEditableText(element, value);
    }

    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      const proto = element.tagName === 'TEXTAREA' ? view.HTMLTextAreaElement.prototype : view.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) setter.call(element, value);
      else element.value = value;
      dispatchInputEvents(element, value);
    } else {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);

      pasteIntoEditable(element, value);
      if ((element.textContent || '').trim() !== value.trim()) {
        element.focus();
        document.execCommand('selectAll', false, null);
        const inserted = document.execCommand('insertText', false, value);
        if (!inserted || !(element.textContent || '').includes(value)) {
          element.textContent = value;
        }
      }
      dispatchInputEvents(element, value);
      element.dispatchEvent(new view.CompositionEvent('compositionend', { bubbles: true, data: value }));
    }

    const currentText = element.value || element.textContent || '';
    if (!currentText.includes(value)) {
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, value);
      dispatchInputEvents(element, value);
    }
    return true;
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
      element.textContent = '';
      try {
        const selection = view.getSelection();
        const range = element.ownerDocument.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
        element.ownerDocument.execCommand('delete', false, null);
      } catch (err) {
        element.textContent = '';
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
      element.scrollIntoView({ block: 'center', inline: 'center' });
      element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      element.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
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
