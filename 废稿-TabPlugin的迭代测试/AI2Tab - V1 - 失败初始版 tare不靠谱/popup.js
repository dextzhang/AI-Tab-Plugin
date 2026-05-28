// 标签切换
function setupTabs() {
  console.log('开始设置标签切换');
  const tabs = document.querySelectorAll('.tab');
  console.log('找到标签数量:', tabs.length);
  
  tabs.forEach((tab, index) => {
    console.log('为标签添加事件监听器:', tab.textContent, index);
    tab.addEventListener('click', function() {
      console.log('标签被点击:', this.textContent);
      // 移除所有标签的活跃状态
      tabs.forEach(t => {
        console.log('移除标签活跃状态:', t.textContent);
        t.classList.remove('active');
      });
      
      // 移除所有内容区域的活跃状态
      const contents = document.querySelectorAll('.tab-content');
      console.log('找到内容区域数量:', contents.length);
      contents.forEach(c => {
        console.log('移除内容区域活跃状态:', c.id);
        c.classList.remove('active');
      });
      
      // 添加当前标签的活跃状态
      console.log('为当前标签添加活跃状态:', this.textContent);
      this.classList.add('active');
      
      // 显示对应内容区域
      const tabId = this.dataset.tab;
      console.log('获取标签ID:', tabId);
      const content = document.getElementById(`${tabId}-tab`);
      console.log('找到对应内容区域:', content);
      if (content) {
        console.log('为内容区域添加活跃状态:', content.id);
        content.classList.add('active');
      }
    });
  });
}

// 加载历史记录
function loadHistory() {
  const history = JSON.parse(localStorage.getItem('messageHistory') || '[]');
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = '';
  
  if (history.length === 0) {
    historyList.innerHTML = '<div style="color: #9ca3af; font-size: 13px; text-align: center; padding: 20px;">暂无历史记录</div>';
    return;
  }
  
  history.forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <div>${item.content}</div>
      <div class="history-time">${item.time}</div>
    `;
    div.addEventListener('click', () => {
      document.getElementById('message').value = item.content;
      // 切换到聊天标签
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.querySelector('[data-tab="chat"]').classList.add('active');
      document.getElementById('chat-tab').classList.add('active');
    });
    historyList.appendChild(div);
  });
}

// 保存消息到历史记录
function saveToHistory(content) {
  const history = JSON.parse(localStorage.getItem('messageHistory') || '[]');
  const now = new Date().toLocaleString();
  history.unshift({ content, time: now });
  // 只保留最近5条
  if (history.length > 5) {
    history.pop();
  }
  localStorage.setItem('messageHistory', JSON.stringify(history));
  loadHistory();
}

// 清空历史记录
function clearHistory() {
  localStorage.removeItem('messageHistory');
  loadHistory();
}

// 发送消息
function sendMessage() {
  const message = document.getElementById('message').value;
  const status = document.getElementById('status');
  
  if (!message.trim()) {
    status.textContent = '请输入消息内容';
    status.style.color = 'red';
    return;
  }
  
  status.textContent = '正在发送消息...';
  status.style.color = 'blue';
  
  // 保存到历史记录
  saveToHistory(message);
  
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
    
    let successCount = 0;
    
    // 向每个目标标签页注入脚本
    targetTabs.forEach(tab => {
      console.log('向标签页注入脚本:', tab.id, tab.url);
      
      // 直接注入脚本到标签页
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (content) => {
          console.log('注入脚本到标签页:', window.location.href);
          
          // 发送消息到AI模型的函数
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
          
          // 执行发送消息
          return sendMessageToAI(content);
        },
        args: [message]
      }, (results) => {
        if (chrome.runtime.lastError) {
          console.error('注入脚本失败:', chrome.runtime.lastError);
        } else if (results && results[0] && results[0].result) {
          console.log('发送消息成功:', tab.id);
          successCount++;
        }
        
        // 检查是否所有标签页都已处理
        if (targetTabs.indexOf(tab) === targetTabs.length - 1) {
          setTimeout(() => {
            status.textContent = `消息已发送到 ${targetTabs.length} 个AI模型，成功 ${successCount} 个！`;
            status.style.color = 'green';
            setTimeout(() => {
              status.textContent = '';
            }, 3000);
          }, 500);
        }
      });
    });
  });
}

// 生成图片
function generateImage() {
  const prompt = document.getElementById('imagePrompt').value;
  const size = document.getElementById('imageSize').value;
  const status = document.getElementById('status');
  
  if (!prompt.trim()) {
    status.textContent = '请输入图片描述';
    status.style.color = 'red';
    return;
  }
  
  status.textContent = '正在生成图片...';
  status.style.color = 'blue';
  
  // 获取所有打开的标签页
  chrome.tabs.query({}, (tabs) => {
    // 筛选支持图片生成的AI产品标签页
    const targetTabs = tabs.filter(tab => 
      tab.url.includes("chat.openai.com") || // DALL-E
      tab.url.includes("gemini.google.com") || // Gemini 图片生成
      tab.url.includes("kimi.moonshot.cn") // Kimi 图片生成
    );
    console.log('支持图片生成的标签页:', targetTabs.map(tab => tab.url));
    
    let successCount = 0;
    
    // 向每个目标标签页注入脚本
    targetTabs.forEach(tab => {
      console.log('向标签页注入脚本:', tab.id, tab.url);
      
      // 直接注入脚本到标签页
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (prompt, size) => {
          console.log('注入脚本到标签页:', window.location.href);
          
          // 生成图片的函数
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
          
          // 执行生成图片
          return generateImage(prompt, size);
        },
        args: [prompt, size]
      }, (results) => {
        if (chrome.runtime.lastError) {
          console.error('注入脚本失败:', chrome.runtime.lastError);
        } else if (results && results[0] && results[0].result) {
          console.log('生成图片成功:', tab.id);
          successCount++;
        }
        
        // 检查是否所有标签页都已处理
        if (targetTabs.indexOf(tab) === targetTabs.length - 1) {
          setTimeout(() => {
            status.textContent = `图片生成请求已发送到 ${targetTabs.length} 个AI模型，成功 ${successCount} 个！`;
            status.style.color = 'green';
            setTimeout(() => {
              status.textContent = '';
            }, 3000);
          }, 500);
        }
      });
    });
  });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM加载完成');
  setupTabs();
  loadHistory();
  
  // 绑定按钮事件
  document.getElementById('sendBtn').addEventListener('click', sendMessage);
  document.getElementById('generateImageBtn').addEventListener('click', generateImage);
  document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
});