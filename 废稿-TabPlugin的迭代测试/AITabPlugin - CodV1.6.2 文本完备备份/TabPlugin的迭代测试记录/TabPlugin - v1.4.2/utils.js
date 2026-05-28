const TabPluginUtils = (function() {
  const DEBUG = true;

  function log(...args) {
    if (DEBUG) {
      console.log('[TabPlugin]', new Date().toISOString(), ...args);
    }
  }

  function error(...args) {
    console.error('[TabPlugin Error]', new Date().toISOString(), ...args);
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function find(selectors) {
    if (typeof selectors === 'string') {
      selectors = [selectors];
    }
    for (const s of selectors) {
      try {
        const el = document.querySelector(s);
        if (el) return el;
      } catch (_) {}
    }
    return null;
  }

  function findAll(selectors) {
    if (typeof selectors === 'string') {
      selectors = [selectors];
    }
    for (const s of selectors) {
      try {
        const els = document.querySelectorAll(s);
        if (els && els.length > 0) return Array.from(els);
      } catch (_) {}
    }
    return [];
  }

  function findByText(tags, texts) {
    const els = document.querySelectorAll(tags);
    for (const el of els) {
      const t = (el.textContent || '').trim();
      if (texts.some(x => t.includes(x))) return el;
    }
    return null;
  }

  function findVisibleByText(tags, texts) {
    const els = document.querySelectorAll(tags);
    for (const el of els) {
      const t = (el.textContent || '').trim();
      if (texts.some(x => t.includes(x))) {
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null) {
          return el;
        }
      }
    }
    return null;
  }

  function setInput(el, value) {
    if (!el) return false;
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      if (setter) {
        setter.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    } else {
      el.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, value);
      if (!(el.textContent || '').includes(value)) {
        el.textContent = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return true;
    }
    return false;
  }

  function pressEnter(el) {
    if (!el) return;
    const opts = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
    el.dispatchEvent(new KeyboardEvent('keydown', opts));
    el.dispatchEvent(new KeyboardEvent('keypress', opts));
    el.dispatchEvent(new KeyboardEvent('keyup', opts));
  }

  function pressCtrlEnter(el) {
    if (!el) return;
    const opts = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, ctrlKey: true, bubbles: true, cancelable: true };
    el.dispatchEvent(new KeyboardEvent('keydown', opts));
    el.dispatchEvent(new KeyboardEvent('keypress', opts));
    el.dispatchEvent(new KeyboardEvent('keyup', opts));
  }

  function clickEl(el) {
    if (!el) return false;
    try {
      el.scrollIntoView({ behavior: 'instant', block: 'center' });
      el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      el.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, cancelable: true }));
      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      el.click();
      return true;
    } catch (e) {
      error('clickEl failed:', e);
      return false;
    }
  }

  async function waitFor(selectorsFn, timeout = 5000, interval = 300) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const el = selectorsFn();
      if (el) return el;
      await delay(interval);
    }
    return null;
  }

  async function waitForVisible(selectorsFn, timeout = 5000, interval = 300) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const el = selectorsFn();
      if (el) {
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null) {
          return el;
        }
      }
      await delay(interval);
    }
    return null;
  }

  async function retry(fn, maxAttempts = 3, delayMs = 500) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const result = await fn();
        if (result) return result;
      } catch (e) {
        error(`Retry attempt ${i + 1} failed:`, e);
      }
      if (i < maxAttempts - 1) {
        await delay(delayMs);
      }
    }
    return null;
  }

  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
  }

  return {
    log,
    error,
    delay,
    find,
    findAll,
    findByText,
    findVisibleByText,
    setInput,
    pressEnter,
    pressCtrlEnter,
    clickEl,
    waitFor,
    waitForVisible,
    retry,
    isVisible
  };
})();
