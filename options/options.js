class OptionsManager {
  constructor() {
    this.settings = {};
    this.themeBasePreset = 'pink';
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.bindEvents();
    this.updateUI();
  }

  getThemePresets() {
    return {
      pink: {
        headerColor: '#ff6b9d',
        buttonColor: '#ff6b9d',
        bgColor: '#fff9fc',
        panelColor: '#ffffff',
        panelWarmColor: '#fff1f7',
        bgDotColor: 'rgba(255, 170, 205, 0.22)',
        bgLineColor: 'rgba(63, 52, 64, 0.045)',
        textColor: '#3f3440',
        textSoftColor: '#8a7d86',
        borderColor: '#3f3440'
      },
      green: {
        headerColor: '#70c59b',
        buttonColor: '#66b88f',
        bgColor: '#f5fff8',
        panelColor: '#ffffff',
        panelWarmColor: '#ecfbf1',
        bgDotColor: 'rgba(112, 197, 155, 0.20)',
        bgLineColor: 'rgba(45, 88, 66, 0.05)',
        textColor: '#314238',
        textSoftColor: '#738579',
        borderColor: '#314238'
      },
      night: {
        headerColor: '#6f5bd8',
        buttonColor: '#8c6cff',
        bgColor: '#201c2b',
        panelColor: '#2b2636',
        panelWarmColor: '#332b42',
        bgDotColor: 'rgba(140, 108, 255, 0.20)',
        bgLineColor: 'rgba(255, 255, 255, 0.055)',
        textColor: '#f8edf7',
        textSoftColor: '#c9b9d0',
        borderColor: '#f5d9ee'
      },
      purple: {
        headerColor: '#b58af0',
        buttonColor: '#c795ff',
        bgColor: '#fbf7ff',
        panelColor: '#ffffff',
        panelWarmColor: '#f4eaff',
        bgDotColor: 'rgba(181, 138, 240, 0.20)',
        bgLineColor: 'rgba(70, 52, 92, 0.05)',
        textColor: '#46345c',
        textSoftColor: '#8a7a98',
        borderColor: '#46345c'
      }
    };
  }

  getDefaultSettings() {
    return {
      defaultFormat: 'hex',
      pickAction: 'save',
      autoSave: true,
      maxColorsPerPalette: 20,
      themePreset: 'pink',
      themeBasePreset: 'pink',
      headerColor: '#ff6b9d',
      buttonColor: '#ff6b9d',
      bgColor: '#fff9fc',
      panelColor: '#ffffff'
    };
  }

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['settings'], (result) => {
        this.settings = {
          ...this.getDefaultSettings(),
          ...(result.settings || {})
        };
        this.themeBasePreset = this.settings.themeBasePreset || 'pink';
        resolve();
      });
    });
  }

  async saveSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ settings: this.settings }, resolve);
    });
  }

  getThemeSettings() {
    const presets = this.getThemePresets();
    const baseKey = this.settings.themePreset === 'custom'
      ? (this.settings.themeBasePreset || 'pink')
      : (presets[this.settings.themePreset] ? this.settings.themePreset : 'pink');
    const base = presets[baseKey] || presets.pink;
    return {
      themePreset: this.settings.themePreset || baseKey,
      themeBasePreset: baseKey,
      headerColor: this.settings.headerColor || base.headerColor,
      buttonColor: this.settings.buttonColor || base.buttonColor,
      bgColor: this.settings.bgColor || base.bgColor,
      panelColor: this.settings.panelColor || base.panelColor
    };
  }

  updateUI() {
    const theme = this.getThemeSettings();
    this.themeBasePreset = theme.themeBasePreset;

    document.getElementById('defaultFormat').value = this.settings.defaultFormat;
    document.getElementById('pickAction').value = this.settings.pickAction;
    document.getElementById('autoSave').checked = this.settings.autoSave !== false;
    document.getElementById('maxColors').value = this.settings.maxColorsPerPalette || 20;
    document.getElementById('themePreset').value = theme.themePreset;
    document.getElementById('headerColor').value = theme.headerColor;
    document.getElementById('buttonColor').value = theme.buttonColor;
    document.getElementById('bgColor').value = theme.bgColor;
    document.getElementById('panelColor').value = theme.panelColor;

    this.syncColorLabels();
    this.applyTheme();
  }

  bindEvents() {
    document.getElementById('saveSettings').addEventListener('click', () => this.handleSave());
    document.getElementById('resetSettings').addEventListener('click', () => this.handleReset());
    document.getElementById('backToPopup').addEventListener('click', () => window.close());

    document.getElementById('themePreset').addEventListener('change', () => this.applyThemePresetToInputs());
    ['headerColor', 'buttonColor', 'bgColor', 'panelColor'].forEach((id) => {
      document.getElementById(id).addEventListener('input', () => {
        const presetSelect = document.getElementById('themePreset');
        if (presetSelect.value !== 'custom') this.themeBasePreset = presetSelect.value;
        presetSelect.value = 'custom';
        this.syncColorLabels();
        this.applyThemeFromInputs();
      });
    });

    ['defaultFormat', 'pickAction', 'autoSave', 'maxColors'].forEach((id) => {
      document.getElementById(id).addEventListener('change', () => this.collectSettingsFromInputs());
    });

    document.getElementById('exportData').addEventListener('click', () => this.exportData());
    document.getElementById('importData').addEventListener('click', () => this.importData());
    document.getElementById('clearData').addEventListener('click', () => this.clearData());
    document.getElementById('viewHistory').addEventListener('click', () => this.viewHistory());
  }

  collectSettingsFromInputs() {
    const maxVal = parseInt(document.getElementById('maxColors').value, 10) || 20;
    this.settings = {
      ...this.settings,
      defaultFormat: document.getElementById('defaultFormat').value,
      pickAction: document.getElementById('pickAction').value,
      autoSave: document.getElementById('autoSave').checked,
      maxColorsPerPalette: Math.max(1, Math.min(100, maxVal)),
      themePreset: document.getElementById('themePreset').value,
      themeBasePreset: this.themeBasePreset || 'pink',
      headerColor: document.getElementById('headerColor').value,
      buttonColor: document.getElementById('buttonColor').value,
      bgColor: document.getElementById('bgColor').value,
      panelColor: document.getElementById('panelColor').value
    };
  }

  applyThemePresetToInputs() {
    const preset = document.getElementById('themePreset').value;
    const colors = this.getThemePresets()[preset];
    if (!colors) {
      this.syncColorLabels();
      this.applyThemeFromInputs();
      return;
    }
    this.themeBasePreset = preset;
    document.getElementById('headerColor').value = colors.headerColor;
    document.getElementById('buttonColor').value = colors.buttonColor;
    document.getElementById('bgColor').value = colors.bgColor;
    document.getElementById('panelColor').value = colors.panelColor;
    this.syncColorLabels();
    this.applyThemeFromInputs();
  }

  syncColorLabels() {
    ['headerColor', 'buttonColor', 'bgColor', 'panelColor'].forEach((id) => {
      document.getElementById(`${id}Value`).textContent = document.getElementById(id).value.toUpperCase();
    });
  }

  applyThemeFromInputs() {
    this.collectSettingsFromInputs();
    this.applyTheme();
  }

  async handleSave() {
    this.collectSettingsFromInputs();
    await this.saveSettings();
    this.applyTheme();
    this.showNotification('设置已保存');
  }

  async handleReset() {
    this.settings = this.getDefaultSettings();
    this.themeBasePreset = 'pink';
    this.updateUI();
    await this.saveSettings();
    this.showNotification('设置已重置');
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
    if (!confirm('确定要清空所有数据吗？这个操作不可恢复。')) return;

    await new Promise((resolve) => {
      chrome.storage.sync.clear(resolve);
    });
    await this.loadSettings();
    this.updateUI();
    this.showNotification('所有数据已清空');
  }

  viewHistory() {
    alert(`Pixel Color Picker 更新日志

v1.0.0
- 像素风 popup
- 色卡管理、历史记录、导入导出
- 主题预设与自定义主题`);
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
    }, 1800);
  }

  applyTheme() {
    const presets = this.getThemePresets();
    const presetKey = this.settings.themePreset === 'custom'
      ? this.settings.themeBasePreset
      : this.settings.themePreset;
    const preset = presets[presetKey] || presets.pink;
    const root = document.documentElement;
    const headerColor = this.settings.headerColor || preset.headerColor;
    const buttonColor = this.settings.buttonColor || preset.buttonColor;
    const bgColor = this.settings.bgColor || preset.bgColor;
    const panelColor = this.settings.panelColor || preset.panelColor;

    root.style.setProperty('--header-bg', headerColor);
    root.style.setProperty('--button-bg', buttonColor);
    root.style.setProperty('--primary', buttonColor);
    root.style.setProperty('--bg', bgColor);
    root.style.setProperty('--panel', panelColor);
    root.style.setProperty('--panel-warm', preset.panelWarmColor || panelColor);
    root.style.setProperty('--bg-dot', preset.bgDotColor);
    root.style.setProperty('--bg-line', preset.bgLineColor);
    root.style.setProperty('--text', preset.textColor);
    root.style.setProperty('--text-soft', preset.textSoftColor);
    root.style.setProperty('--border', preset.borderColor);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
});
