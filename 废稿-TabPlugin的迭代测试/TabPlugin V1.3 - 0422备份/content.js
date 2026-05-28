if (window._tabPluginContentLoaded) { /* skip duplicate injection */ } else {
window._tabPluginContentLoaded = true;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'sendMessage') {
    handleAction(message.content, 'text').then(ok => sendResponse({ success: ok }));
    return true;
  }
  if (message.action === 'generateImage') {
    const imgContent = `请生成一张图片。描述：${message.prompt}，尺寸：${message.size}`;
    handleAction(imgContent, 'image').then(ok => sendResponse({ success: ok }));
    return true;
  }
});

async function handleAction(content, mode) {
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const url = window.location.href;

  function find(selectors) {
    for (const s of selectors) {
      try { const el = document.querySelector(s); if (el) return el; } catch (_) {}
    }
    return null;
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
        if (style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null) return el;
      }
    }
    return null;
  }

  function setInput(el, value) {
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      el.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, value);
      if (!(el.textContent || '').includes(value)) {
        el.textContent = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }

  function pressEnter(el) {
    const o = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
    el.dispatchEvent(new KeyboardEvent('keydown', o));
    el.dispatchEvent(new KeyboardEvent('keypress', o));
    el.dispatchEvent(new KeyboardEvent('keyup', o));
  }

  function pressCtrlEnter(el) {
    const o = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, ctrlKey: true, bubbles: true, cancelable: true };
    el.dispatchEvent(new KeyboardEvent('keydown', o));
    el.dispatchEvent(new KeyboardEvent('keypress', o));
    el.dispatchEvent(new KeyboardEvent('keyup', o));
  }

  function clickEl(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: 'instant', block: 'center' });
    el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    el.click();
  }

  async function waitFor(fn, timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const el = fn();
      if (el) return el;
      await delay(300);
    }
    return null;
  }

  // === ChatGPT ===
  if (url.includes('chatgpt.com') || url.includes('chat.openai.com')) {
    clickEl(find(['a[data-testid="create-new-chat-button"]', 'nav a[href="/"]']) || findByText('a,button', ['New chat', '新对话']));
    await delay(2000);
    const input = await waitFor(() => find(['#prompt-textarea', 'div[contenteditable="true"][id="prompt-textarea"]', 'textarea']));
    if (!input) return false;
    setInput(input, content);
    await delay(600);
    const btn = find(['button[data-testid="send-button"]', 'button[aria-label*="Send"]']);
    if (btn && !btn.disabled) clickEl(btn); else pressEnter(input);
    return true;
  }

  // === 豆包 — 专家模型 ===
  if (url.includes('doubao.com')) {
    clickEl(find(['div[data-testid="new_chat_button"]']) || findByText('button,a,div[role="button"]', ['新建对话', '新对话']));
    await delay(2500);
    const mt = find(['div[data-testid="model_selector"]']) || findVisibleByText('button,div[role="button"],span', ['模型', '豆包']);
    if (mt) { clickEl(mt); await delay(1000); const eo = findByText('div,li,button,span,p', ['专家模型']); if (eo) { clickEl(eo); await delay(1000); } }
    else { const d = findVisibleByText('div[role="tab"],button,span', ['专家']); if (d) { clickEl(d); await delay(800); } }
    const input = await waitFor(() => find(['textarea[data-testid="chat_input_input"]', 'textarea[placeholder*="输入"]', 'div[contenteditable="true"]', 'textarea']));
    if (!input) return false;
    setInput(input, content);
    await delay(600);
    const btn = find(['button[data-testid="chat_input_send_button"]', 'button[aria-label="发送"]']) || findVisibleByText('button', ['发送']);
    if (btn) clickEl(btn); else pressEnter(input);
    return true;
  }

  // === 通义千问 — 深度思考 ===
  if (url.includes('tongyi.aliyun.com')) {
    clickEl(find(['button[data-testid="new-chat"]']) || findByText('button,a,div[role="button"],span', ['新建对话', '新对话']));
    await delay(2500);
    const tt = find(['div[data-testid="deep-think"]']) || findVisibleByText('button,div[role="button"],div[role="switch"],span,label', ['深度思考']);
    if (tt) {
      const active = tt.classList.contains('active') || tt.getAttribute('aria-checked') === 'true' || tt.getAttribute('aria-pressed') === 'true';
      if (!active) { clickEl(tt); await delay(1000); }
    }
    const input = await waitFor(() => find(['textarea[data-testid="chat-input"]', 'textarea[placeholder*="输入"]', 'div[contenteditable="true"]', 'textarea']));
    if (!input) return false;
    setInput(input, content);
    await delay(600);
    const btn = find(['button[data-testid="chat-send"]', 'button[aria-label="发送"]']) || findVisibleByText('button', ['发送']);
    if (btn) clickEl(btn); else pressEnter(input);
    return true;
  }

  // === Kimi — 思考模式 ===
  if (url.includes('kimi.moonshot.cn')) {
    clickEl(find(['button[data-testid="new-chat"]', 'a[href="/chat"]']) || findByText('button,a,div[role="button"]', ['发起新对话', '新建对话']));
    await delay(2500);
    const mt = find(['div[data-testid="model-selector"]']) || findVisibleByText('button,div[role="button"],span', ['模型', 'Kimi', 'K1']);
    if (mt) { clickEl(mt); await delay(1000); const to = findByText('div,li,button,span', ['思考']); if (to) { clickEl(to); await delay(1000); } }
    else { const d = findVisibleByText('button,div[role="tab"],span', ['思考', 'K1']); if (d) { clickEl(d); await delay(800); } }
    const input = await waitFor(() => find(['[data-testid="chat-input"] [contenteditable="true"]', 'div[contenteditable="true"]', 'textarea']));
    if (!input) return false;
    setInput(input, content);
    await delay(600);
    const btn = find(['button[data-testid="send-button"]', 'button[aria-label="发送"]']) || findVisibleByText('button', ['发送']);
    if (btn) clickEl(btn); else pressEnter(input);
    return true;
  }

  // === Gemini — Pro + Ctrl+Enter ===
  if (url.includes('gemini.google.com')) {
    clickEl(find(['a[data-test-id="new-chat"]', 'a[href="/app"]']) || findByText('a,button', ['New chat', '新聊天']));
    await delay(2500);
    const mt = find(['button[data-test-id="model-selector"]']) || findVisibleByText('button,div[role="button"],span', ['Gemini', 'Flash', '模型']);
    if (mt) { clickEl(mt); await delay(1000); const po = findByText('mat-option,li,div[role="option"],button,span', ['Pro']); if (po) { clickEl(po); await delay(1000); } }
    const input = await waitFor(() => find(['.ql-editor[contenteditable="true"]', 'div[contenteditable="true"][role="textbox"]', 'div[contenteditable="true"]', 'textarea']));
    if (!input) return false;
    setInput(input, content);
    await delay(600);
    pressCtrlEnter(input);
    await delay(500);
    const btn = find(['button[aria-label="Send message"]', 'button[aria-label*="Send"]']);
    if (btn && !btn.disabled) clickEl(btn);
    return true;
  }

  // === Grok — Expert ===
  if (url.includes('x.ai') || url.includes('grok.com')) {
    clickEl(find(['a[href="/chat"]', 'button[data-testid="new-chat"]']) || findByText('a,button', ['New chat', '新对话']));
    await delay(2500);
    const eb = findVisibleByText('button,div[role="tab"],div[role="button"],a,span', ['Expert', 'Think']);
    if (eb) { clickEl(eb); await delay(1000); }
    const input = await waitFor(() => find(['textarea[placeholder*="Ask"]', 'textarea[placeholder*="Message"]', 'div[contenteditable="true"]', 'textarea']));
    if (!input) return false;
    setInput(input, content);
    await delay(600);
    const btn = find(['button[aria-label="Send"]', 'button[aria-label*="Send"]', 'button[data-testid="send-button"]']);
    if (btn && !btn.disabled) clickEl(btn); else pressEnter(input);
    return true;
  }

  return false;
}

} // end duplicate injection guard
