class OptionsManager {
  constructor() {
    this.settings = {};
    this.themeBasePreset = 'pink';
    this.colorHistory = [];
    this.lastPickedColor = null;
    this.activePickedTarget = '';
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
      },
      cream: {
        headerColor: '#f6c65b',
        buttonColor: '#ff9eb7',
        bgColor: '#fffaf0',
        panelColor: '#ffffff',
        panelWarmColor: '#fff3cf',
        bgDotColor: 'rgba(246, 198, 91, 0.22)',
        bgLineColor: 'rgba(86, 65, 42, 0.05)',
        textColor: '#4f3d2d',
        textSoftColor: '#917f68',
        borderColor: '#4f3d2d'
      },
      sea: {
        headerColor: '#75bfe8',
        buttonColor: '#5fc9c0',
        bgColor: '#f2fbff',
        panelColor: '#ffffff',
        panelWarmColor: '#e9f7fb',
        bgDotColor: 'rgba(117, 191, 232, 0.20)',
        bgLineColor: 'rgba(42, 78, 96, 0.05)',
        textColor: '#2d4653',
        textSoftColor: '#718791',
        borderColor: '#2d4653'
      },
      cherry: {
        headerColor: '#f05f7d',
        buttonColor: '#ff8ab0',
        bgColor: '#fff7f8',
        panelColor: '#ffffff',
        panelWarmColor: '#ffe8ee',
        bgDotColor: 'rgba(240, 95, 125, 0.19)',
        bgLineColor: 'rgba(86, 42, 52, 0.05)',
        textColor: '#52313a',
        textSoftColor: '#92737b',
        borderColor: '#52313a'
      },
      gameboy: {
        headerColor: '#6f8f55',
        buttonColor: '#4f6f3f',
        bgColor: '#dce8c3',
        panelColor: '#edf4d9',
        panelWarmColor: '#d4e3b8',
        bgDotColor: 'rgba(79, 111, 63, 0.18)',
        bgLineColor: 'rgba(30, 54, 34, 0.08)',
        textColor: '#263b2a',
        textSoftColor: '#5d7255',
        borderColor: '#263b2a'
      },
      cocoa: {
        headerColor: '#c7834f',
        buttonColor: '#e0a35f',
        bgColor: '#fff8f0',
        panelColor: '#fffdf9',
        panelWarmColor: '#f5e5d2',
        bgDotColor: 'rgba(199, 131, 79, 0.18)',
        bgLineColor: 'rgba(73, 48, 35, 0.05)',
        textColor: '#4b3529',
        textSoftColor: '#8b7566',
        borderColor: '#4b3529'
      },
      mintshake: {
        headerColor: '#76d9bd',
        buttonColor: '#ffd86f',
        bgColor: '#f4fffb',
        panelColor: '#ffffff',
        panelWarmColor: '#e7fbf4',
        bgDotColor: 'rgba(118, 217, 189, 0.22)',
        bgLineColor: 'rgba(48, 92, 79, 0.05)',
        textColor: '#31483f',
        textSoftColor: '#729084',
        borderColor: '#31483f'
      },
      grape: {
        headerColor: '#ad7cff',
        buttonColor: '#7f8cff',
        bgColor: '#faf7ff',
        panelColor: '#ffffff',
        panelWarmColor: '#efe9ff',
        bgDotColor: 'rgba(173, 124, 255, 0.20)',
        bgLineColor: 'rgba(62, 51, 94, 0.05)',
        textColor: '#42345f',
        textSoftColor: '#82769b',
        borderColor: '#42345f'
      },
      mist: {
        headerColor: '#c78ca0',
        buttonColor: '#d7a4b8',
        bgColor: '#faf8fa',
        panelColor: '#ffffff',
        panelWarmColor: '#f3edf1',
        bgDotColor: 'rgba(199, 140, 160, 0.16)',
        bgLineColor: 'rgba(65, 58, 64, 0.05)',
        textColor: '#454046',
        textSoftColor: '#858087',
        borderColor: '#454046'
      }
    };
  }

  getDefaultSettings() {
    return {
      defaultFormat: 'hex',
      pickAction: 'save',
      autoSave: true,
      maxColorsPerPalette: 20,
      language: 'zh-CN',
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
      chrome.storage.sync.get(['settings', 'colorHistory', 'lastPickedColor'], (result) => {
        this.settings = {
          ...this.getDefaultSettings(),
          ...(result.settings || {})
        };
        this.colorHistory = Array.isArray(result.colorHistory) ? result.colorHistory : [];
        this.lastPickedColor = result.lastPickedColor || null;
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
    document.getElementById('languageSelect').value = this.settings.language || 'zh-CN';
    document.getElementById('themePreset').value = theme.themePreset;
    document.getElementById('headerColor').value = theme.headerColor;
    document.getElementById('buttonColor').value = theme.buttonColor;
    document.getElementById('bgColor').value = theme.bgColor;
    document.getElementById('panelColor').value = theme.panelColor;

    this.syncColorLabels();
    this.renderThemeColorHistory();
    this.applyTheme();
    this.applyI18n();
  }

  bindEvents() {
    document.getElementById('saveSettings').addEventListener('click', () => this.handleSave());
    document.getElementById('resetSettings').addEventListener('click', () => this.handleReset());
    document.getElementById('backToPopup').addEventListener('click', () => window.close());
    document.getElementById('useLastPicked').addEventListener('click', () => this.useLastPickedForTheme());
    document.getElementById('closePickedTarget').addEventListener('click', () => this.closePickedTargetPanel());
    document.getElementById('pickedTargetPanel').addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    document.querySelectorAll('.use-picked-btn').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.openPickedTargetPanel(button.dataset.targetColor);
      });
    });

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

    ['defaultFormat', 'pickAction', 'autoSave', 'maxColors', 'languageSelect'].forEach((id) => {
      document.getElementById(id).addEventListener('change', async () => {
        this.collectSettingsFromInputs();
        if (id === 'languageSelect') {
          this.applyI18n();
          await this.saveSettings();
        }
      });
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
      language: document.getElementById('languageSelect').value,
      themePreset: document.getElementById('themePreset').value,
      themeBasePreset: this.themeBasePreset || 'pink',
      headerColor: document.getElementById('headerColor').value,
      buttonColor: document.getElementById('buttonColor').value,
      bgColor: document.getElementById('bgColor').value,
      panelColor: document.getElementById('panelColor').value
    };
  }

  getLanguage() {
    return window.PixelI18n?.normalize(this.settings.language || 'zh-CN') || 'zh-CN';
  }

  t(key) {
    return window.PixelI18n?.t(this.getLanguage(), key) || key;
  }

  applyI18n() {
    if (!window.PixelI18n) return;
    const language = this.getLanguage();
    document.documentElement.lang = language;
    document.title = `${this.t('setup')} - Pixel Color Picker`;
    window.PixelI18n.applyMap(document, language, {
      text: {
        '.pixel-header h1': 'appSettings',
        '.settings-nav a[href="#behavior"]': 'behavior',
        '.settings-nav a[href="#theme"]': 'theme',
        '.settings-nav a[href="#language"]': 'language',
        '.settings-nav a[href="#data"]': 'data',
        '.settings-nav a[href="#about"]': 'about',
        '#behavior .section-head h2': 'behaviorSettings',
        '#theme .section-head h2': 'themeAppearance',
        '#language .section-head h2': 'languageSettings',
        '#data .section-head h2': 'dataManagement',
        '#about .section-head h2': 'about',
        '#behavior .setting-item:nth-of-type(1) strong': 'defaultCopyFormat',
        '#behavior .setting-item:nth-of-type(1) small': 'defaultCopyFormatHint',
        '#behavior .setting-item:nth-of-type(2) strong': 'afterPickAction',
        '#behavior .setting-item:nth-of-type(2) small': 'afterPickActionHint',
        '#behavior .setting-item:nth-of-type(3) strong': 'autoSave',
        '#behavior .setting-item:nth-of-type(3) small': 'autoSaveHint',
        '#behavior .setting-item:nth-of-type(4) strong': 'paletteLimit',
        '#behavior .setting-item:nth-of-type(4) small': 'paletteLimitHint',
        '.theme-preset-block strong': 'themePreset',
        '.theme-preset-block small': 'themePresetHint',
        '.theme-custom-block .theme-block-head strong': 'customColors',
        '.theme-custom-block .theme-block-head small': 'customColorsHint',
        '.color-item:nth-of-type(1) > span': 'headerColor',
        '.color-item:nth-of-type(2) > span': 'buttonColor',
        '.color-item:nth-of-type(3) > span': 'bgColor',
        '.color-item:nth-of-type(4) > span': 'panelColor',
        '#pickedTargetTitle': 'chooseColor',
        '#targetColorHistory .picked-empty': 'noPickedHistory',
        '.picked-theme-head strong': 'generateThemeFromPicked',
        '#useLastPicked': 'useRecentPicked',
        '#themeColorHistory .picked-empty': 'noPickedHistory',
        '.theme-preview-block .theme-block-head strong': 'livePreview',
        '.theme-preview-block .theme-block-head small': 'saveSyncPopup',
        '#previewButton': 'buttonColor',
        '.preview-body strong': 'defaultPalette',
        '.preview-body small': 'themeSyncPopup',
        '#language .setting-item strong': 'uiLanguage',
        '#language .setting-item small': 'languageHint',
        '#exportData': 'exportAllData',
        '#importData': 'importData',
        '#clearData': 'clearAllData',
        '.about-info p:nth-child(2)': 'cuteToolDesc',
        '.about-info p:nth-child(3)': 'copyright',
        '#viewHistory': 'viewChangelog',
        '#saveSettings': 'saveSettings',
        '#resetSettings': 'reset',
        '#backToPopup': 'close'
      },
      title: {
        '.use-picked-btn': 'usePickedFill'
      },
      aria: {
        '.settings-nav': 'settingsGroup',
        '.use-picked-btn': 'usePickedFill'
      }
    });
    document.querySelector('#pickAction option[value="save"]').textContent = this.t('save');
    document.querySelector('#pickAction option[value="preview"]').textContent = this.t('preview');
    document.querySelector('#pickAction option[value="copy"]').textContent = this.t('copy');
    document.querySelector('#pickAction option[value="copy-save"]').textContent = this.t('copySave');
    this.updateThemePresetLabels('themePreset');
  }

  updateThemePresetLabels(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const labels = {
      pink: 'themePink',
      green: 'themeGreen',
      night: 'themeNight',
      purple: 'themePurple',
      cream: 'themeCream',
      sea: 'themeSea',
      cherry: 'themeCherry',
      gameboy: 'themeGameboy',
      cocoa: 'themeCocoa',
      mintshake: 'themeMintshake',
      grape: 'themeGrape',
      mist: 'themeMist',
      custom: 'themeCustom'
    };
    Object.entries(labels).forEach(([value, key]) => {
      const option = select.querySelector(`option[value="${value}"]`);
      if (option) option.textContent = this.t(key);
    });
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

  renderThemeColorHistory() {
    const list = document.getElementById('themeColorHistory');
    if (!list) return;

    const recent = this.getRecentThemeSourceColors();
    if (recent.length === 0) {
      list.innerHTML = `<span class="picked-empty">${this.t('noPickedHistory')}</span>`;
      return;
    }

    list.innerHTML = recent.map((color) => `
      <button type="button"
              class="picked-color"
              data-hex="${color.hex}"
              style="background:${color.hex}"
              title="用 ${color.hex} 生成主题"></button>
    `).join('');

    list.querySelectorAll('.picked-color').forEach((button) => {
      button.addEventListener('click', () => this.generateThemeFromHex(button.dataset.hex));
    });
  }

  getRecentThemeSourceColors() {
    const colors = [];
    if (this.lastPickedColor?.hex) colors.push(this.lastPickedColor);
    this.colorHistory.forEach((color) => {
      if (color?.hex && !colors.some((item) => item.hex === color.hex)) colors.push(color);
    });
    return colors.slice(0, 6);
  }

  openPickedTargetPanel(targetId) {
    if (!['headerColor', 'buttonColor', 'bgColor', 'panelColor'].includes(targetId)) return;
    const panel = document.getElementById('pickedTargetPanel');
    if (this.activePickedTarget === targetId && panel && !panel.hidden) {
      this.closePickedTargetPanel();
      return;
    }

    this.closePickedTargetPanel();

    this.activePickedTarget = targetId;
    const title = document.getElementById('pickedTargetTitle');
    const input = document.getElementById(targetId);
    const item = input?.closest('.color-item');
    const trigger = document.querySelector(`.use-picked-btn[data-target-color="${targetId}"]`);
    const labels = {
      headerColor: `${this.t('chooseColor')}: ${this.t('headerColor')}`,
      buttonColor: `${this.t('chooseColor')}: ${this.t('buttonColor')}`,
      bgColor: `${this.t('chooseColor')}: ${this.t('bgColor')}`,
      panelColor: `${this.t('chooseColor')}: ${this.t('panelColor')}`
    };
    if (!panel || !item) return;

    title.textContent = labels[targetId];
    item.classList.add('is-picking');
    trigger?.classList.add('is-active');
    item.appendChild(panel);
    this.renderTargetColorHistory();
    panel.hidden = false;
  }

  closePickedTargetPanel() {
    this.activePickedTarget = '';
    document.querySelectorAll('.color-item.is-picking').forEach((item) => item.classList.remove('is-picking'));
    document.querySelectorAll('.use-picked-btn.is-active').forEach((button) => button.classList.remove('is-active'));
    const panel = document.getElementById('pickedTargetPanel');
    if (panel) panel.hidden = true;
  }

  renderTargetColorHistory() {
    const list = document.getElementById('targetColorHistory');
    if (!list) return;
    const recent = this.getRecentThemeSourceColors();
    if (recent.length === 0) {
      list.innerHTML = `<span class="picked-empty">${this.t('noPickedHistory')}</span>`;
      return;
    }

    list.innerHTML = recent.map((color) => `
      <button type="button"
              class="picked-color"
              data-hex="${color.hex}"
              style="background:${color.hex}"
              title="使用 ${color.hex}"></button>
    `).join('');

    list.querySelectorAll('.picked-color').forEach((button) => {
      button.addEventListener('click', () => this.applyPickedColorToTarget(button.dataset.hex));
    });
  }

  applyPickedColorToTarget(hex) {
    if (!this.activePickedTarget) return;
    const input = document.getElementById(this.activePickedTarget);
    if (!input) return;
    input.value = hex.toUpperCase();
    document.getElementById('themePreset').value = 'custom';
    this.syncColorLabels();
    this.applyThemeFromInputs();
    this.closePickedTargetPanel();
    this.showNotification(this.getLanguage() === 'en' ? `Filled ${hex.toUpperCase()}` : `已填入 ${hex.toUpperCase()}`);
  }

  useLastPickedForTheme() {
    const hex = this.lastPickedColor?.hex || this.colorHistory[0]?.hex;
    if (!hex) {
      this.showNotification(this.t('noPickedHistory'));
      return;
    }
    this.generateThemeFromHex(hex);
  }

  generateThemeFromHex(hex) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return;

    const header = this.rgbToHex(rgb.r, rgb.g, rgb.b);
    const button = this.rgbToHex(
      this.mixChannel(rgb.r, 255, 0.22),
      this.mixChannel(rgb.g, 255, 0.22),
      this.mixChannel(rgb.b, 255, 0.22)
    );
    const bg = this.rgbToHex(
      this.mixChannel(rgb.r, 255, 0.92),
      this.mixChannel(rgb.g, 255, 0.92),
      this.mixChannel(rgb.b, 255, 0.92)
    );
    const panel = this.rgbToHex(
      this.mixChannel(rgb.r, 255, 0.97),
      this.mixChannel(rgb.g, 255, 0.97),
      this.mixChannel(rgb.b, 255, 0.97)
    );

    document.getElementById('themePreset').value = 'custom';
    this.themeBasePreset = 'pink';
    document.getElementById('headerColor').value = header;
    document.getElementById('buttonColor').value = button;
    document.getElementById('bgColor').value = bg;
    document.getElementById('panelColor').value = panel;
    this.syncColorLabels();
    this.applyThemeFromInputs();
    this.showNotification(this.getLanguage() === 'en' ? `Theme generated from ${header}` : `已用 ${header} 生成主题`);
  }

  hexToRgb(hex) {
    const match = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!match) return null;
    const value = match[1];
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16)
    };
  }

  mixChannel(from, to, amount) {
    return Math.round(from + (to - from) * amount);
  }

  rgbToHex(r, g, b) {
    return `#${[r, g, b].map((value) => {
      return Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0');
    }).join('')}`.toUpperCase();
  }

  applyThemeFromInputs() {
    this.collectSettingsFromInputs();
    this.applyTheme();
  }

  async handleSave() {
    this.collectSettingsFromInputs();
    await this.saveSettings();
    this.applyTheme();
    this.applyI18n();
    this.showNotification(this.t('settingsSaved'));
  }

  async handleReset() {
    this.settings = this.getDefaultSettings();
    this.themeBasePreset = 'pink';
    this.updateUI();
    await this.saveSettings();
    this.showNotification(this.t('settingsReset'));
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
