// Options 页面逻辑
class OptionsManager {
  constructor() {
    this.settings = {};
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.bindEvents();
    this.updateUI();
  }

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['settings'], (result) => {
        this.settings = result.settings || {
          pixelSize: 8,
          defaultFormat: 'hex',
          autoSave: true,
          showGrid: true
        };
        resolve();
      });
    });
  }

  async saveSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ settings: this.settings }, resolve);
    });
  }

  updateUI() {
    document.getElementById('pixelSize').value = this.settings.pixelSize;
    document.getElementById('defaultFormat').value = this.settings.defaultFormat;
    document.getElementById('autoSave').checked = this.settings.autoSave;
    document.getElementById('showGrid').checked = this.settings.showGrid;
  }

  bindEvents() {
    // 保存设置
    document.getElementById('saveSettings').addEventListener('click', async () => {
      this.settings = {
        pixelSize: parseInt(document.getElementById('pixelSize').value),
        defaultFormat: document.getElementById('defaultFormat').value,
        autoSave: document.getElementById('autoSave').checked,
        showGrid: document.getElementById('showGrid').checked
      };
      
      await this.saveSettings();
      this.showNotification('设置已保存！');
    });

    // 返回
    document.getElementById('backToPopup').addEventListener('click', () => {
      window.close();
    });

    // 导出数据
    document.getElementById('exportData').addEventListener('click', () => {
      this.exportData();
    });

    // 导入数据
    document.getElementById('importData').addEventListener('click', () => {
      this.importData();
    });

    // 清除数据
    document.getElementById('clearData').addEventListener('click', () => {
      this.clearData();
    });

    // 查看历史
    document.getElementById('viewHistory').addEventListener('click', () => {
      this.viewHistory();
    });
  }

  async exportData() {
    const data = await new Promise((resolve) => {
      chrome.storage.sync.get(null, resolve);
    });
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pixel-color-picker-backup.json';
    a.click();
    
    URL.revokeObjectURL(url);
    this.showNotification('数据已导出！');
  }

  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target.result);
          
          await new Promise((resolve) => {
            chrome.storage.sync.set(data, resolve);
          });
          
          await this.loadSettings();
          this.updateUI();
          this.showNotification('数据已导入！');
        } catch (error) {
          this.showNotification('导入失败：文件格式错误');
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  }

  async clearData() {
    if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
      await new Promise((resolve) => {
        chrome.storage.sync.clear(resolve);
      });
      
      await this.loadSettings();
      this.updateUI();
      this.showNotification('所有数据已清除');
    }
  }

  viewHistory() {
    const history = `
Pixel Color Picker 更新日志

v1.0.0 (2026-06-07)
- 初始版本发布
- 实现基本取色功能
- 支持颜色收藏
- 支持导出CSS和PNG
- 像素风UI设计
    `;
    
    alert(history);
  }

  showNotification(message) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #4CAF50;
      color: white;
      padding: 16px 32px;
      font-family: 'Press Start 2P', monospace;
      font-size: 10px;
      border: 4px solid #4A4A4A;
      box-shadow: 4px 4px 0px rgba(0,0,0,0.3);
      z-index: 1000;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
});
