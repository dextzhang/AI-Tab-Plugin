const AI_PATTERNS = [
  'chat.openai.com', 'chatgpt.com',
  'gemini.google.com',
  'x.ai', 'grok.com',
  'tongyi.aliyun.com',
  'doubao.com',
  'kimi.moonshot.cn',
];

const IMAGE_PATTERNS = [
  'chat.openai.com', 'chatgpt.com',
  'gemini.google.com',
  'kimi.moonshot.cn',
];

function matchesAny(url, patterns) {
  return patterns.some(p => url.includes(p));
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'sendMessage') {
    broadcastToTabs(AI_PATTERNS, message, sendResponse);
    return true;
  }
  if (message.action === 'generateImage') {
    broadcastToTabs(IMAGE_PATTERNS, message, sendResponse);
    return true;
  }
});

function broadcastToTabs(patterns, message, sendResponse) {
  chrome.tabs.query({}, (tabs) => {
    const targetTabs = tabs.filter(t => t.url && matchesAny(t.url, patterns));

    if (targetTabs.length === 0) {
      sendResponse({ success: false, targetTabs: 0, successCount: 0 });
      return;
    }

    let processedCount = 0;
    let successCount = 0;

    targetTabs.forEach(tab => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }, () => {
        if (chrome.runtime.lastError) {
          processedCount++;
          if (processedCount === targetTabs.length) {
            sendResponse({ success: true, targetTabs: targetTabs.length, successCount });
          }
          return;
        }
        chrome.tabs.sendMessage(tab.id, message, (response) => {
          if (!chrome.runtime.lastError && response && response.success) {
            successCount++;
          }
          processedCount++;
          if (processedCount === targetTabs.length) {
            sendResponse({ success: true, targetTabs: targetTabs.length, successCount });
          }
        });
      });
    });
  });
}
