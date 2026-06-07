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
          defaultFormat: 'hex'
        }
      });
    }
  });
});
