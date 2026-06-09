class PixelColorPicker {
  constructor() {
    this.currentColor = null;
    this.palettes = [];
    this.currentPaletteId = null;
    this.sortMode = 'latest';
    this.maxColorsPerPalette = 20;
    this.settings = {};
    this.colorHistory = [];
    this.historyTab = 'colors';

    this.init();
  }

  async init() {
    await this.loadData();
    this.bindEvents();
    this.render();
  }

  async loadData() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['palettes', 'currentPaletteId', 'palette', 'settings', 'colorHistory'], (result) => {
        this.settings = result.settings || {};
        this.colorHistory = Array.isArray(result.colorHistory) ? result.colorHistory : [];
        if (this.settings.maxColorsPerPalette != null) {
          this.maxColorsPerPalette = this.settings.maxColorsPerPalette;
        }

        if (!result.palettes && result.palette && result.palette.length > 0) {
          const newPalettes = [{
            id: Date.now(),
            name: '默认色卡',
            colors: result.palette,
            maxColors: this.maxColorsPerPalette,
            createdAt: new Date().toISOString()
          }];
          chrome.storage.sync.set({
            palettes: newPalettes,
            currentPaletteId: newPalettes[0].id
          });
          chrome.storage.sync.remove('palette');
          this.palettes = newPalettes;
          this.currentPaletteId = newPalettes[0].id;
          this.applyTheme();
          resolve();
          return;
        }

        this.palettes = result.palettes || [];
        this.currentPaletteId = result.currentPaletteId || null;

        let needsSave = false;
        this.palettes.forEach((palette) => {
          if (palette.maxColors == null) {
            palette.maxColors = this.maxColorsPerPalette;
            needsSave = true;
          }
        });
        if (needsSave) {
          chrome.storage.sync.set({ palettes: this.palettes });
        }

        if (this.palettes.length === 0) {
          const defaultPalette = {
            id: Date.now(),
            name: '默认色卡',
            colors: [],
            maxColors: this.maxColorsPerPalette,
            createdAt: new Date().toISOString()
          };
          this.palettes = [defaultPalette];
          this.currentPaletteId = defaultPalette.id;
          chrome.storage.sync.set({
            palettes: this.palettes,
            currentPaletteId: this.currentPaletteId
          });
        }

        if (!this.palettes.find((palette) => palette.id === this.currentPaletteId)) {
          this.currentPaletteId = this.palettes[0].id;
        }

        this.applyTheme();
        resolve();
      });
    });
  }

  async saveData() {
    return new Promise((resolve) => {
      chrome.storage.sync.set({
        palettes: this.palettes,
        currentPaletteId: this.currentPaletteId
      }, resolve);
    });
  }

  async saveHistory() {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ colorHistory: this.colorHistory }, resolve);
    });
  }

  getCurrentPalette() {
    return this.palettes.find((palette) => palette.id === this.currentPaletteId) || this.palettes[0] || null;
  }

  getCurrentColors() {
    const palette = this.getCurrentPalette();
    return palette ? palette.colors : [];
  }

  showListView() {
    document.getElementById('listView').style.display = '';
    document.getElementById('detailView').style.display = 'none';
    document.body.scrollTop = 0;
    this.renderListView();
  }

  showDetailView(id) {
    this.currentPaletteId = id;
    document.getElementById('listView').style.display = 'none';
    document.getElementById('detailView').style.display = '';
    document.body.scrollTop = 0;
    this.renderDetailView();
  }

  render() {
    this.showListView();
  }

  renderListView() {
    const list = document.getElementById('paletteCardList');
    const palettes = [...this.palettes];

    switch (this.sortMode) {
      case 'oldest':
        palettes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'az':
        palettes.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'za':
        palettes.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'latest':
      default:
        palettes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    const sortLabels = {
      latest: '最新',
      oldest: '最早',
      az: 'A-Z',
      za: 'Z-A'
    };
    document.getElementById('sortBtn').textContent = sortLabels[this.sortMode];

    if (palettes.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">□</span>
          <p>还没有色卡组</p>
          <p class="empty-hint">点 + 新建一个吧</p>
        </div>
      `;
      return;
    }

    list.innerHTML = palettes.map((palette) => {
      const max = palette.maxColors || this.maxColorsPerPalette;
      const count = palette.colors.length;
      const ratio = count / max;
      const topColors = palette.colors.slice(0, 5);
      const stripes = topColors.map((color) =>
        `<div class="card-stripe" style="background:${color.hex}"></div>`
      ).join('');
      const empties = Array(5 - topColors.length).fill(
        '<div class="card-stripe card-stripe-empty"></div>'
      ).join('');
      const date = new Date(palette.createdAt);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

      let countClass = '';
      if (ratio >= 1) countClass = 'card-count-full';
      else if (ratio >= 0.8) countClass = 'card-count-warn';

      return `
        <div class="palette-card" data-id="${palette.id}">
          <div class="card-stripes">${stripes}${empties}</div>
          <div class="card-info">
            <span class="card-name">${this.escapeHtml(palette.name)}</span>
            <span class="card-meta ${countClass}">${count}/${max} 色 · ${dateStr}</span>
          </div>
          <button class="card-delete-btn" data-id="${palette.id}" title="删除色卡组">×</button>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.palette-card').forEach((card) => {
      card.addEventListener('click', (event) => {
        if (event.target.closest('.card-delete-btn')) return;
        this.showDetailView(Number(card.dataset.id));
      });
    });

    list.querySelectorAll('.card-delete-btn').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        this.deletePalette(Number(button.dataset.id));
      });
    });
  }

  renderDetailView() {
    const palette = this.getCurrentPalette();
    if (!palette) {
      this.showListView();
      return;
    }

    document.getElementById('paletteName').textContent = palette.name;
    const date = new Date(palette.createdAt);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    const max = palette.maxColors || this.maxColorsPerPalette;
    const count = palette.colors.length;
    const ratio = count / max;

    let metaClass = '';
    if (ratio >= 1) metaClass = 'card-count-full';
    else if (ratio >= 0.8) metaClass = 'card-count-warn';

    const meta = document.getElementById('paletteMeta');
    meta.textContent = `创建于 ${dateStr} · ${count}/${max} 色`;
    meta.className = `palette-meta ${metaClass}`;

    document.getElementById('saveColor').disabled = !this.currentColor;
    this.renderColorGrid();
  }

  renderColorGrid() {
    const grid = document.getElementById('paletteGrid');
    const colors = this.getCurrentColors();

    if (colors.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">□</span>
          <p>还没有颜色</p>
          <p class="empty-hint">先快速取一个吧</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = colors.map((color) => {
      const style = this.getSwatchHexStyle(color.r, color.g, color.b);
      return `
        <div class="color-swatch"
             style="background-color: ${color.hex}"
             data-id="${color.id}">
          <span class="swatch-hex" style="background:${style.bg};color:${style.text}">${color.hex}</span>
          <div class="delete-btn" data-id="${color.id}">×</div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.color-swatch').forEach((swatch) => {
      swatch.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-btn')) return;
        const color = colors.find((item) => item.id === Number(swatch.dataset.id));
        if (color) {
          this.currentColor = color;
          this.updateColorPreview(color);
        }
      });
    });

    grid.querySelectorAll('.delete-btn').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        this.deleteColor(Number(button.dataset.id));
      });
    });
  }

  bindEvents() {
    document.getElementById('quickPickBtn').addEventListener('click', () => this.quickPick());
    document.getElementById('quickPickBtn2').addEventListener('click', () => this.quickPick());
    document.getElementById('saveColor').addEventListener('click', () => this.saveCurrentColor());

    document.querySelectorAll('.copy-btn').forEach((button) => {
      button.addEventListener('click', (event) => {
        this.copyToClipboard(event.currentTarget.dataset.target);
      });
    });

    document.getElementById('sortBtn').addEventListener('click', () => this.cycleSort());
    document.getElementById('newPaletteBtn').addEventListener('click', () => this.createPalette());
    document.getElementById('backBtn').addEventListener('click', () => this.showListView());
    document.getElementById('editNameBtn').addEventListener('click', () => this.renamePalette());
    document.getElementById('deletePaletteBtn').addEventListener('click', () => this.deleteCurrentPalette());
    document.getElementById('addColor').addEventListener('click', () => this.addColorManual());
    document.getElementById('clearPalette').addEventListener('click', () => this.clearPalette());
    document.getElementById('exportCSS').addEventListener('click', () => this.exportCSS());
    document.getElementById('exportPNG').addEventListener('click', () => this.exportPNG());
    document.getElementById('openOptions').addEventListener('click', () => chrome.runtime.openOptionsPage());
    document.getElementById('openOptions2').addEventListener('click', () => chrome.runtime.openOptionsPage());
    document.getElementById('closeHistory').addEventListener('click', () => this.closeHistoryDialog());
    document.getElementById('historyOverlay').addEventListener('click', (event) => {
      if (event.target.id === 'historyOverlay') this.closeHistoryDialog();
    });
    document.getElementById('clearHistory').addEventListener('click', () => this.clearColorHistory());
    document.querySelectorAll('.history-tab').forEach((button) => {
      button.addEventListener('click', () => this.switchHistoryTab(button.dataset.tab));
    });

    ['viewHistory', 'viewHistory2'].forEach((id) => {
      const historyButton = document.getElementById(id);
      if (historyButton) {
        historyButton.addEventListener('click', () => this.openHistoryDialog());
      }
    });
  }

  async quickPick() {
    if (!window.EyeDropper) {
      this.showNotification('当前浏览器不支持取色，请使用 Chrome 95+');
      return;
    }

    try {
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      const color = this.parseSRGBHex(result.sRGBHex);
      if (!color) {
        this.showNotification('取色失败');
        return;
      }

      this.currentColor = color;
      this.updateColorPreview(color);
      await this.addToHistory(color);

      const palette = this.getCurrentPalette();
      if (!palette) return;

      const max = palette.maxColors || this.maxColorsPerPalette;
      if (palette.colors.length >= max) {
        this.showNotification(`色卡已满（${max}/${max}），请先删除颜色`);
        return;
      }

      if (palette.colors.some((item) => item.hex === color.hex)) {
        this.showNotification('颜色已存在');
        return;
      }

      palette.colors.push({
        ...color,
        id: Date.now(),
        note: '',
        createdAt: new Date().toISOString()
      });
      await this.saveData();

      this.renderDetailView();
      this.showNotification('颜色已保存');
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('[Pixel Color Picker] Quick pick error:', error);
        this.showNotification('快速取色失败，请重试');
      }
    }
  }

  updateColorPreview(color) {
    document.getElementById('colorPreview').style.backgroundColor = color.hex;
    document.getElementById('hexValue').value = color.hex;
    document.getElementById('rgbValue').value = `rgb(${color.r}, ${color.g}, ${color.b})`;
    document.getElementById('hslValue').value = color.hsl;
    document.getElementById('saveColor').disabled = false;
  }

  async saveCurrentColor() {
    if (!this.currentColor) return;
    const palette = this.getCurrentPalette();
    if (!palette) return;

    const max = palette.maxColors || this.maxColorsPerPalette;
    if (palette.colors.length >= max) {
      this.showNotification(`色卡已满（${max}/${max}），请先删除颜色`);
      return;
    }

    if (palette.colors.some((item) => item.hex === this.currentColor.hex)) {
      this.showNotification('颜色已存在');
      return;
    }

    palette.colors.push({
      ...this.currentColor,
      id: Date.now(),
      note: '',
      createdAt: new Date().toISOString()
    });

    await this.saveData();
    this.renderDetailView();
    this.showNotification('颜色已保存');
  }

  async addColorManual() {
    const input = prompt('请输入 HEX 颜色值，例如 #FF5733：', '');
    if (input === null) return;

    const hex = input.trim();
    const color = this.parseSRGBHex(hex.startsWith('#') ? hex : `#${hex}`);
    if (!color) {
      this.showNotification('颜色格式无效');
      return;
    }

    const palette = this.getCurrentPalette();
    if (!palette) return;

    const max = palette.maxColors || this.maxColorsPerPalette;
    if (palette.colors.length >= max) {
      this.showNotification(`色卡已满（${max}/${max}）`);
      return;
    }

    if (palette.colors.some((item) => item.hex === color.hex)) {
      this.showNotification('颜色已存在');
      return;
    }

    palette.colors.push({
      ...color,
      id: Date.now(),
      note: '',
      createdAt: new Date().toISOString()
    });

    this.currentColor = color;
    this.updateColorPreview(color);
    await this.addToHistory(color);
    await this.saveData();
    this.renderDetailView();
    this.showNotification('颜色已添加');
  }

  async addToHistory(color) {
    const entry = {
      id: Date.now(),
      r: color.r,
      g: color.g,
      b: color.b,
      hex: color.hex,
      hsl: color.hsl || this.rgbToHsl(color.r, color.g, color.b),
      createdAt: new Date().toISOString()
    };

    this.colorHistory = [
      entry,
      ...this.colorHistory.filter((item) => item.hex !== entry.hex)
    ].slice(0, 30);

    await this.saveHistory();
    this.renderHistoryList();
  }

  openHistoryDialog() {
    document.getElementById('historyOverlay').hidden = false;
    this.switchHistoryTab(this.historyTab);
    this.renderHistoryList();
  }

  closeHistoryDialog() {
    document.getElementById('historyOverlay').hidden = true;
  }

  switchHistoryTab(tab) {
    this.historyTab = tab === 'changelog' ? 'changelog' : 'colors';
    document.querySelectorAll('.history-tab').forEach((button) => {
      button.classList.toggle('active', button.dataset.tab === this.historyTab);
    });
    document.getElementById('historyColorsPanel').classList.toggle('active', this.historyTab === 'colors');
    document.getElementById('historyChangelogPanel').classList.toggle('active', this.historyTab === 'changelog');
  }

  renderHistoryList() {
    const list = document.getElementById('historyList');
    const count = document.getElementById('historyCount');
    if (!list || !count) return;

    count.textContent = `${this.colorHistory.length} 条`;

    if (this.colorHistory.length === 0) {
      list.innerHTML = `
        <div class="empty-state compact">
          <span class="empty-icon">□</span>
          <p>还没有取色历史</p>
          <p class="empty-hint">快速取色后会记录在这里</p>
        </div>
      `;
      return;
    }

    list.innerHTML = this.colorHistory.map((color) => `
      <div class="history-item" data-id="${color.id}">
        <button class="history-swatch" data-action="restore" data-id="${color.id}" style="background:${color.hex}" title="恢复这个颜色"></button>
        <div class="history-main">
          <span class="history-hex">${color.hex}</span>
          <span class="history-time">${this.formatHistoryTime(color.createdAt)}</span>
        </div>
        <button class="history-copy" data-action="copy" data-id="${color.id}" title="复制 HEX">⧉</button>
      </div>
    `).join('');

    list.querySelectorAll('[data-action="restore"]').forEach((button) => {
      button.addEventListener('click', () => this.restoreHistoryColor(Number(button.dataset.id)));
    });
    list.querySelectorAll('[data-action="copy"]').forEach((button) => {
      button.addEventListener('click', () => this.copyHistoryColor(Number(button.dataset.id), button));
    });
  }

  restoreHistoryColor(id) {
    const color = this.colorHistory.find((item) => item.id === id);
    if (!color) return;
    this.currentColor = {
      r: color.r,
      g: color.g,
      b: color.b,
      hex: color.hex,
      hsl: color.hsl || this.rgbToHsl(color.r, color.g, color.b)
    };
    this.updateColorPreview(this.currentColor);
    this.showDetailView(this.currentPaletteId);
    this.closeHistoryDialog();
    this.showNotification('已恢复颜色');
  }

  copyHistoryColor(id, button) {
    const color = this.colorHistory.find((item) => item.id === id);
    if (!color) return;
    navigator.clipboard.writeText(color.hex).then(() => {
      button.textContent = '✓';
      setTimeout(() => {
        button.textContent = '⧉';
      }, 1200);
      this.showNotification('已复制');
    });
  }

  async clearColorHistory() {
    if (this.colorHistory.length === 0) return;
    if (!confirm('确定要清空取色历史吗？')) return;
    this.colorHistory = [];
    await this.saveHistory();
    this.renderHistoryList();
    this.showNotification('历史已清空');
  }

  formatHistoryTime(value) {
    const date = new Date(value);
    const pad = (number) => String(number).padStart(2, '0');
    return `${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  async deleteColor(id) {
    const palette = this.getCurrentPalette();
    if (!palette) return;
    palette.colors = palette.colors.filter((color) => color.id !== id);
    await this.saveData();
    this.renderDetailView();
    this.showNotification('颜色已删除');
  }

  async clearPalette() {
    const palette = this.getCurrentPalette();
    if (!palette || palette.colors.length === 0) return;
    if (!confirm('确定要清空当前色卡的所有颜色吗？')) return;
    palette.colors = [];
    await this.saveData();
    this.renderDetailView();
    this.showNotification('色卡已清空');
  }

  async createPalette() {
    const name = prompt('请输入色卡组名称：', '未命名色卡');
    if (name === null) return;

    const palette = {
      id: Date.now(),
      name: name.trim() || '未命名色卡',
      colors: [],
      maxColors: this.maxColorsPerPalette,
      createdAt: new Date().toISOString()
    };
    this.palettes.push(palette);
    this.currentPaletteId = palette.id;
    await this.saveData();
    this.showDetailView(palette.id);
    this.showNotification('色卡组已创建');
  }

  async deletePalette(id) {
    if (this.palettes.length <= 1) {
      this.showNotification('至少保留一个色卡组');
      return;
    }
    if (!confirm('确定要删除这个色卡组吗？')) return;

    this.palettes = this.palettes.filter((palette) => palette.id !== id);
    if (this.currentPaletteId === id) {
      this.currentPaletteId = this.palettes[0].id;
    }

    await this.saveData();
    this.showListView();
    this.showNotification('色卡组已删除');
  }

  async deleteCurrentPalette() {
    await this.deletePalette(this.currentPaletteId);
  }

  async renamePalette() {
    const palette = this.getCurrentPalette();
    if (!palette) return;
    const newName = prompt('重命名色卡组：', palette.name);
    if (newName === null || newName.trim() === '') return;
    palette.name = newName.trim();
    await this.saveData();
    this.renderDetailView();
    this.showNotification('已重命名');
  }

  cycleSort() {
    const modes = ['latest', 'oldest', 'az', 'za'];
    const index = modes.indexOf(this.sortMode);
    this.sortMode = modes[(index + 1) % modes.length];
    this.renderListView();
  }

  exportCSS() {
    const palette = this.getCurrentPalette();
    if (!palette || palette.colors.length === 0) {
      this.showNotification('色卡为空');
      return;
    }

    let css = `/* ${palette.name} */\n:root {\n`;
    palette.colors.forEach((color, index) => {
      css += `  --color-${index + 1}: ${color.hex};\n`;
      css += `  --color-${index + 1}-rgb: ${color.r}, ${color.g}, ${color.b};\n`;
    });
    css += '}\n';

    this.downloadFile(css, 'palette.css', 'text/css');
    this.showNotification('CSS 已导出');
  }

  exportPNG() {
    const palette = this.getCurrentPalette();
    if (!palette || palette.colors.length === 0) {
      this.showNotification('色卡为空');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const cols = Math.min(5, palette.colors.length);
    const cellSize = 64;
    const rows = Math.ceil(palette.colors.length / cols);

    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    palette.colors.forEach((color, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      ctx.fillStyle = color.hex;
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
      ctx.fillStyle = this.getContrastColor(color.r, color.g, color.b);
      ctx.font = '10px monospace';
      ctx.fillText(color.hex, col * cellSize + 4, row * cellSize + cellSize - 8);
    });

    const dataUrl = canvas.toDataURL('image/png');
    chrome.downloads.download({ url: dataUrl, filename: 'palette.png', saveAs: true }, () => {
      if (chrome.runtime.lastError) {
        console.error('[exportPNG] download failed:', chrome.runtime.lastError);
        this.showNotification('导出失败，请重试');
      } else {
        this.showNotification('图片已导出');
      }
    });
  }

  parseSRGBHex(hex) {
    const match = /^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/.exec(hex);
    if (!match) return null;
    const r = parseInt(match[1], 16);
    const g = parseInt(match[2], 16);
    const b = parseInt(match[3], 16);
    return { r, g, b, hex: hex.toUpperCase(), hsl: this.rgbToHsl(r, g, b) };
  }

  rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h;
    let s;
    const l = (max + min) / 2;

    if (max === min) {
      h = 0;
      s = 0;
    } else {
      const diff = max - min;
      s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
      switch (max) {
        case r:
          h = (g - b) / diff + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / diff + 2;
          break;
        default:
          h = (r - g) / diff + 4;
          break;
      }
      h /= 6;
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  }

  copyToClipboard(inputId) {
    const input = document.getElementById(inputId);
    const text = input ? input.value : '';
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      const button = input.nextElementSibling;
      if (!button) return;
      button.textContent = '✓';
      button.classList.add('copied');
      setTimeout(() => {
        button.textContent = '⧉';
        button.classList.remove('copied');
      }, 1500);
      this.showNotification('已复制');
    });
  }

  downloadFile(content, filename, type) {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({ url, filename, saveAs: true });
  }

  getContrastColor(r, g, b) {
    return (r * 299 + g * 587 + b * 114) / 1000 > 200 ? '#000000' : '#ffffff';
  }

  getSwatchHexStyle(r, g, b) {
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    if (brightness <= 200) {
      return { bg: 'rgba(255,255,255,0.92)', text: '#000000' };
    }
    return { bg: 'rgba(0,0,0,0.62)', text: '#ffffff' };
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  showNotification(message) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  applyTheme() {
    const headerColor = this.settings?.headerColor || '#ff6b9d';
    const buttonColor = this.settings?.buttonColor || '#ff6b9d';
    const root = document.documentElement;
    root.style.setProperty('--header-bg', headerColor);
    root.style.setProperty('--button-bg', buttonColor);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PixelColorPicker();
});
