// Background Service Worker

// 初始化 - 只在安装/更新时执行
chrome.runtime.onInstalled.addListener(() => {
  console.log('Pixel Color Picker installed!');

  // 初始化存储
  chrome.storage.sync.get(['palette', 'settings'], (result) => {
    if (!result.palette) {
      chrome.storage.sync.set({ palette: [] });
    }
    if (!result.settings) {
      chrome.storage.sync.set({
        settings: {
          autoSave: true,
          defaultFormat: 'hex',
          pixelSize: 8,
          showGrid: true
        }
      });
    }
  });

  // 创建右键菜单
  chrome.contextMenus.create({
    id: 'pick-color',
    title: '🎨 使用像素吸色器取色',
    contexts: ['page']
  }, () => {
    // 忽略重复创建的错误
    if (chrome.runtime.lastError) {
      console.log('Context menu already exists');
    }
  });
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'COLOR_PICKED') {
    console.log('Color picked:', message.color);
    // popup 可能已经关闭，由 background 自动保存到色卡
    chrome.storage.sync.get(['palette'], (result) => {
      const palette = result.palette || [];
      const exists = palette.some(c => c.hex === message.color.hex);
      if (!exists) {
        palette.push({
          ...message.color,
          id: Date.now(),
          note: '',
          createdAt: new Date().toISOString()
        });
        chrome.storage.sync.set({ palette });
      }
    });
    return false;
  }

  if (message.type === 'CAPTURE_TAB') {
    chrome.tabs.captureVisibleTab(
      sender.tab ? sender.tab.windowId : null,
      { format: 'png' },
      (dataUrl) => {
        if (chrome.runtime.lastError) {
          sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ dataUrl });
        }
      }
    );
    return true; // 保持通道开放，等待异步 captureVisibleTab 回调
  }

  return false;
});

// 右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'pick-color' && tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'ACTIVATE_PICKER' });
  }
});
