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
        this.settings = {
          defaultFormat: 'hex',
          autoSave: true,
          maxColorsPerPalette: 20,
          headerColor: '#ff6b9d',
          buttonColor: '#ff6b9d',
          ...(result.settings || {})
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
    document.getElementById('defaultFormat').value = this.settings.defaultFormat;
    document.getElementById('autoSave').checked = this.settings.autoSave;
    document.getElementById('maxColors').value = this.settings.maxColorsPerPalette || 20;
    document.getElementById('headerColor').value = this.settings.headerColor || '#ff6b9d';
    document.getElementById('buttonColor').value = this.settings.buttonColor || '#ff6b9d';
    this.applyTheme();
  }

  bindEvents() {
    document.getElementById('saveSettings').addEventListener('click', async () => {
      const maxVal = parseInt(document.getElementById('maxColors').value, 10) || 20;
      this.settings = {
        defaultFormat: document.getElementById('defaultFormat').value,
        autoSave: document.getElementById('autoSave').checked,
        maxColorsPerPalette: Math.max(1, Math.min(100, maxVal)),
        headerColor: document.getElementById('headerColor').value,
        buttonColor: document.getElementById('buttonColor').value
      };

      await this.saveSettings();
      this.applyTheme();
      this.showNotification('设置已保存');
    });

    document.getElementById('backToPopup').addEventListener('click', () => {
      window.close();
    });

    document.getElementById('exportData').addEventListener('click', () => {
      this.exportData();
    });

    document.getElementById('importData').addEventListener('click', () => {
      this.importData();
    });

    document.getElementById('clearData').addEventListener('click', () => {
      this.clearData();
    });

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

    const link = document.createElement('a');
    link.href = url;
    link.download = 'pixel-color-picker-backup.json';
    link.click();

    URL.revokeObjectURL(url);
    this.showNotification('数据已导出');
  }

  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (readerEvent) => {
        try {
          const data = JSON.parse(readerEvent.target.result);
          await new Promise((resolve) => {
            chrome.storage.sync.set(data, resolve);
          });

          await this.loadSettings();
          this.updateUI();
          this.showNotification('数据已导入');
        } catch (error) {
          this.showNotification('导入失败：文件格式错误');
        }
      };

      reader.readAsText(file);
    };

    input.click();
  }

  async clearData() {
    if (!confirm('确定要清除所有数据吗？此操作不可恢复。')) return;

    await new Promise((resolve) => {
      chrome.storage.sync.clear(resolve);
    });

    await this.loadSettings();
    this.updateUI();
    this.showNotification('所有数据已清除');
  }

  viewHistory() {
    const history = `Pixel Color Picker 更新日志

v1.0.0 (2026-06-07)
- 初始版本发布
- 实现基本取色功能
- 支持颜色收藏
- 支持导出 CSS 和 PNG
- 像素风 UI 设计`;

    alert(history);
  }

  showNotification(message) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  applyTheme() {
    const root = document.documentElement;
    root.style.setProperty('--header-bg', this.settings?.headerColor || '#ff6b9d');
    root.style.setProperty('--button-bg', this.settings?.buttonColor || '#ff6b9d');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
});
