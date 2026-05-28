// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('收到来自popup的消息:', message);
  if (message.action === "sendMessage") {
    // 获取所有打开的标签页
    chrome.tabs.query({}, (tabs) => {
      console.log('所有标签页:', tabs.map(tab => tab.url));
      // 筛选目标AI产品标签页
      const targetTabs = tabs.filter(tab => 
        tab.url.includes("chat.openai.com") ||
        tab.url.includes("gemini.google.com") ||
        tab.url.includes("x.ai") ||
        tab.url.includes("qianwen.baidu.com") ||
        tab.url.includes("doubao.com") ||
        tab.url.includes("kimi.moonshot.cn")
      );
      console.log('目标标签页:', targetTabs.map(tab => tab.url));
      
      // 向每个目标标签页发送消息
      let successCount = 0;
      targetTabs.forEach(tab => {
        console.log('向标签页发送消息:', tab.id, tab.url);
        // 使用chrome.scripting.executeScript来注入脚本，确保内容脚本已加载
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('注入脚本失败:', chrome.runtime.lastError);
          } else {
            // 注入成功后发送消息
            chrome.tabs.sendMessage(tab.id, {
              action: "sendMessage",
              content: message.content
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.error('发送消息失败:', chrome.runtime.lastError);
              } else {
                console.log('发送消息成功:', response);
                successCount++;
              }
            });
          }
        });
      });
      
      // 延迟发送响应，确保所有标签页都已处理
      setTimeout(() => {
        sendResponse({ success: true, targetTabs: targetTabs.length, successCount: successCount });
      }, 1000);
    });
    return true; // 异步响应
  }
  else if (message.action === "generateImage") {
    console.log('收到图片生成请求:', message);
    // 获取所有打开的标签页
    chrome.tabs.query({}, (tabs) => {
      // 筛选支持图片生成的AI产品标签页
      const targetTabs = tabs.filter(tab => 
        tab.url.includes("chat.openai.com") || // DALL-E
        tab.url.includes("gemini.google.com") || // Gemini 图片生成
        tab.url.includes("kimi.moonshot.cn") // Kimi 图片生成
      );
      console.log('支持图片生成的标签页:', targetTabs.map(tab => tab.url));
      
      // 向每个目标标签页发送图片生成请求
      let successCount = 0;
      targetTabs.forEach(tab => {
        console.log('向标签页发送图片生成请求:', tab.id, tab.url);
        // 使用chrome.scripting.executeScript来注入脚本，确保内容脚本已加载
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('注入脚本失败:', chrome.runtime.lastError);
          } else {
            // 注入成功后发送消息
            chrome.tabs.sendMessage(tab.id, {
              action: "generateImage",
              prompt: message.prompt,
              size: message.size
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.error('发送图片生成请求失败:', chrome.runtime.lastError);
              } else {
                console.log('发送图片生成请求成功:', response);
                successCount++;
              }
            });
          }
        });
      });
      
      // 延迟发送响应，确保所有标签页都已处理
      setTimeout(() => {
        sendResponse({ success: true, targetTabs: targetTabs.length, successCount: successCount });
      }, 1000);
    });
    return true; // 异步响应
  }
});