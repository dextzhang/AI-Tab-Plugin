// 监听来自后台的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('收到来自后台的消息:', message);
  if (message.action === "sendMessage") {
    const content = message.content;
    console.log('要发送的消息内容:', content);
    // 根据不同网站执行不同的发送逻辑
    const result = sendMessageToAI(content);
    sendResponse({ success: result });
  }
  else if (message.action === "generateImage") {
    const prompt = message.prompt;
    const size = message.size;
    console.log('要生成的图片:', prompt, size);
    // 根据不同网站执行不同的图片生成逻辑
    const result = generateImage(prompt, size);
    sendResponse({ success: result });
  }
});

// 发送消息到AI模型
function sendMessageToAI(content) {
  const url = window.location.href;
  console.log('当前URL:', url);
  
  // GPT
  if (url.includes("chat.openai.com")) {
    console.log('检测到GPT网页');
    // 尝试多种选择器
    const selectors = [
      "textarea[placeholder*='Message GPT']",
      "textarea[placeholder*='Send a message']",
      "textarea[placeholder*='Type a message']",
      "textarea"
    ];
    let input = null;
    for (const selector of selectors) {
      input = document.querySelector(selector);
      if (input) {
        console.log('找到输入框:', selector);
        break;
      }
    }
    
    if (input) {
      // 清空输入框
      input.value = '';
      // 模拟真实输入
      for (let i = 0; i < content.length; i++) {
        input.value += content[i];
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('keydown', { key: 'Enter', bubbles: true }));
      input.dispatchEvent(new Event('keyup', { key: 'Enter', bubbles: true }));
      
      // 尝试找到发送按钮
      const buttonSelectors = [
        "button[data-testid='send-button']",
        "button[type='submit']",
        "button:has(svg)",
        "button.absolute",
        "button[aria-label*='Send']"
      ];
      let button = null;
      for (const selector of buttonSelectors) {
        button = document.querySelector(selector);
        if (button) {
          console.log('找到发送按钮:', selector);
          break;
        }
      }
      
      if (button) {
        // 模拟真实点击
        button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        button.click();
        console.log('点击发送按钮成功');
        return true;
      }
    }
  }
  
  // 豆包
  else if (url.includes("doubao.com")) {
    console.log('检测到豆包网页');
    // 尝试多种选择器
    const selectors = [
      "textarea[placeholder*='输入问题']",
      "textarea[placeholder*='Type a message']",
      "textarea"
    ];
    let input = null;
    for (const selector of selectors) {
      input = document.querySelector(selector);
      if (input) {
        console.log('找到输入框:', selector);
        break;
      }
    }
    
    if (input) {
      // 清空输入框
      input.value = '';
      // 模拟真实输入
      for (let i = 0; i < content.length; i++) {
        input.value += content[i];
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('keydown', { key: 'Enter', bubbles: true }));
      input.dispatchEvent(new Event('keyup', { key: 'Enter', bubbles: true }));
      
      // 尝试找到发送按钮
      const buttonSelectors = [
        "button[aria-label='发送']",
        "button[type='submit']",
        "button:has(svg)",
        "button.send-btn",
        "button[class*='send']"
      ];
      let button = null;
      for (const selector of buttonSelectors) {
        button = document.querySelector(selector);
        if (button) {
          console.log('找到发送按钮:', selector);
          break;
        }
      }
      
      if (button) {
        // 模拟真实点击
        button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        button.click();
        console.log('点击发送按钮成功');
        return true;
      }
    }
  }
  
  // Gemini
  else if (url.includes("gemini.google.com")) {
    console.log('检测到Gemini网页');
    const selectors = [
      "textarea[placeholder*='Message Gemini']",
      "textarea[placeholder*='Type a message']",
      "textarea"
    ];
    let input = null;
    for (const selector of selectors) {
      input = document.querySelector(selector);
      if (input) {
        console.log('找到输入框:', selector);
        break;
      }
    }
    
    if (input) {
      input.value = content;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('keydown', { key: 'Enter', bubbles: true }));
      
      const buttonSelectors = [
        "button[aria-label='Send message']",
        "button:has(svg[aria-label='Send'])",
        "button[type='submit']"
      ];
      let button = null;
      for (const selector of buttonSelectors) {
        button = document.querySelector(selector);
        if (button) {
          console.log('找到发送按钮:', selector);
          break;
        }
      }
      
      if (button) {
        button.click();
        console.log('点击发送按钮成功');
        return true;
      }
    }
  }
  
  // Grok (x.ai)
  else if (url.includes("x.ai")) {
    console.log('检测到Grok网页');
    const selectors = [
      "textarea[placeholder*='Message Grok']",
      "textarea[placeholder*='Type a message']",
      "textarea"
    ];
    let input = null;
    for (const selector of selectors) {
      input = document.querySelector(selector);
      if (input) {
        console.log('找到输入框:', selector);
        break;
      }
    }
    
    if (input) {
      input.value = content;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('keydown', { key: 'Enter', bubbles: true }));
      
      const buttonSelectors = [
        "button[aria-label='Send']",
        "button[type='submit']",
        "button:has(svg)"
      ];
      let button = null;
      for (const selector of buttonSelectors) {
        button = document.querySelector(selector);
        if (button) {
          console.log('找到发送按钮:', selector);
          break;
        }
      }
      
      if (button) {
        button.click();
        console.log('点击发送按钮成功');
        return true;
      }
    }
  }
  
  // 千问
  else if (url.includes("qianwen.baidu.com")) {
    console.log('检测到千问网页');
    const selectors = [
      "textarea[placeholder*='输入问题']",
      "textarea[placeholder*='Type a message']",
      "textarea"
    ];
    let input = null;
    for (const selector of selectors) {
      input = document.querySelector(selector);
      if (input) {
        console.log('找到输入框:', selector);
        break;
      }
    }
    
    if (input) {
      input.value = content;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('keydown', { key: 'Enter', bubbles: true }));
      
      const buttonSelectors = [
        "button[aria-label='发送']",
        "button[type='submit']",
        "button:has(svg)"
      ];
      let button = null;
      for (const selector of buttonSelectors) {
        button = document.querySelector(selector);
        if (button) {
          console.log('找到发送按钮:', selector);
          break;
        }
      }
      
      if (button) {
        button.click();
        console.log('点击发送按钮成功');
        return true;
      }
    }
  }
  
  // Kimi
  else if (url.includes("kimi.moonshot.cn")) {
    console.log('检测到Kimi网页');
    const selectors = [
      "textarea[placeholder*='输入问题']",
      "textarea[placeholder*='Type a message']",
      "textarea"
    ];
    let input = null;
    for (const selector of selectors) {
      input = document.querySelector(selector);
      if (input) {
        console.log('找到输入框:', selector);
        break;
      }
    }
    
    if (input) {
      input.value = content;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('keydown', { key: 'Enter', bubbles: true }));
      
      const buttonSelectors = [
        "button[aria-label='发送']",
        "button[type='submit']",
        "button:has(svg)"
      ];
      let button = null;
      for (const selector of buttonSelectors) {
        button = document.querySelector(selector);
        if (button) {
          console.log('找到发送按钮:', selector);
          break;
        }
      }
      
      if (button) {
        button.click();
        console.log('点击发送按钮成功');
        return true;
      }
    }
  }
  
  console.log('未找到匹配的AI模型网页');
  return false;
}

// 生成图片
function generateImage(prompt, size) {
  const url = window.location.href;
  console.log('当前URL:', url);
  
  // GPT (DALL-E)
  if (url.includes("chat.openai.com")) {
    console.log('检测到GPT网页，准备生成图片');
    // 首先尝试找到图片生成按钮
    const imageButton = document.querySelector("button[aria-label*='image']") ||
                        document.querySelector("button:has(svg[aria-label*='image'])") ||
                        document.querySelector("button[data-testid*='image']");
    console.log('找到图片生成按钮:', imageButton);
    
    if (imageButton) {
      imageButton.click();
      setTimeout(() => {
        const input = document.querySelector("textarea[placeholder*='Describe']") ||
                      document.querySelector("textarea[placeholder*='描述']") ||
                      document.querySelector("textarea");
        console.log('找到图片描述输入框:', input);
        if (input) {
          input.value = prompt;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          
          setTimeout(() => {
            const generateButton = document.querySelector("button[aria-label*='Generate']") ||
                                  document.querySelector("button[type='submit']") ||
                                  document.querySelector("button:has(svg[aria-label*='Generate'])");
            console.log('找到生成按钮:', generateButton);
            if (generateButton) {
              generateButton.click();
              console.log('点击生成按钮成功');
              return true;
            }
          }, 500);
        }
      }, 1000);
    }
  }
  
  // Gemini
  else if (url.includes("gemini.google.com")) {
    console.log('检测到Gemini网页，准备生成图片');
    // 构造图片生成的提示词
    const imagePrompt = `请生成一张图片，描述：${prompt}，尺寸：${size}`;
    const input = document.querySelector("textarea[placeholder*='Message Gemini']") ||
                  document.querySelector("textarea[placeholder*='Type a message']") ||
                  document.querySelector("textarea");
    console.log('找到输入框:', input);
    if (input) {
      input.value = imagePrompt;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      setTimeout(() => {
        const button = document.querySelector("button[aria-label='Send message']") ||
                      document.querySelector("button:has(svg[aria-label='Send'])") ||
                      document.querySelector("button[type='submit']");
        console.log('找到发送按钮:', button);
        if (button) {
          button.click();
          console.log('点击发送按钮成功');
          return true;
        }
      }, 500);
    }
  }
  
  // Kimi
  else if (url.includes("kimi.moonshot.cn")) {
    console.log('检测到Kimi网页，准备生成图片');
    // 构造图片生成的提示词
    const imagePrompt = `请生成一张图片，描述：${prompt}，尺寸：${size}`;
    const input = document.querySelector("textarea[placeholder*='输入问题']") ||
                  document.querySelector("textarea[placeholder*='Type a message']") ||
                  document.querySelector("textarea");
    console.log('找到输入框:', input);
    if (input) {
      input.value = imagePrompt;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      setTimeout(() => {
        const button = document.querySelector("button[aria-label='发送']") ||
                      document.querySelector("button[type='submit']") ||
                      document.querySelector("button:has(svg)");
        console.log('找到发送按钮:', button);
        if (button) {
          button.click();
          console.log('点击发送按钮成功');
          return true;
        }
      }, 500);
    }
  }
  
  console.log('未找到支持图片生成的AI模型网页');
  return false;
}