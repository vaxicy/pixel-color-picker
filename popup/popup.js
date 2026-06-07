// Popup 主逻辑 - 多色卡组版本
class PixelColorPicker {
  constructor() {
    this.currentColor = null;
    this.palettes = [];
    this.currentPaletteId = null;
    this.sortMode = 'latest'; // 'latest' | 'oldest' | 'az' | 'za'
    this.maxColorsPerPalette = 20; // 全局默认
    this.settings = {};

    this.init();
  }

  async init() {
    await this.loadData();
    this.bindEvents();
    this.render();
  }

  // ========== 数据层 ==========
  async loadData() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['palettes', 'currentPaletteId', 'palette', 'settings'], (result) => {
        // 读取设置
        this.settings = result.settings || {};
        if (this.settings.maxColorsPerPalette != null) {
          this.maxColorsPerPalette = this.settings.maxColorsPerPalette;
        }

        // 迁移旧数据：单色卡 → 多色卡组
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

        // 兼容旧色卡组没有maxColors字段，添加默认值
        let needsSave = false;
        this.palettes.forEach(p => {
          if (p.maxColors == null) {
            p.maxColors = this.maxColorsPerPalette;
            needsSave = true;
          }
        });
        if (needsSave) {
          chrome.storage.sync.set({ palettes: this.palettes });
        }

        // 首次使用，创建默认色卡组
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
          chrome.storage.sync.set({ palettes: this.palettes, currentPaletteId: this.currentPaletteId });
        }

        // currentPaletteId 无效时指向第一个
        if (!this.palettes.find(p => p.id === this.currentPaletteId)) {
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

  getCurrentPalette() {
    return this.palettes.find(p => p.id === this.currentPaletteId) || this.palettes[0] || null;
  }

  getCurrentColors() {
    const p = this.getCurrentPalette();
    return p ? p.colors : [];
  }

  // ========== 视图切换 ==========
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

  // ========== 渲染：列表视图 ==========
  renderListView() {
    const list = document.getElementById('paletteCardList');
    let palettes = [...this.palettes];

    // 排序
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

    const sortLabels = { latest: '🔽最新', oldest: '🔼最旧', az: '🔤A-Z', za: '🔡Z-A' };
    document.getElementById('sortBtn').textContent = sortLabels[this.sortMode];

    if (palettes.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">🌈</span>
          <p>还没有色卡组</p>
          <p class="empty-hint">点击 + 新建色卡组</p>
        </div>
      `;
      return;
    }

    list.innerHTML = palettes.map(p => {
      const max = p.maxColors || this.maxColorsPerPalette;
      const count = p.colors.length;
      const ratio = count / max;

      const topColors = p.colors.slice(0, 5);
      const stripes = topColors.map(c =>
        `<div class="card-stripe" style="background:${c.hex}"></div>`
      ).join('');
      const empties = Array(5 - topColors.length).fill(
        '<div class="card-stripe card-stripe-empty"></div>'
      ).join('');
      const d = new Date(p.createdAt);
      const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;

      let countClass = '';
      if (ratio >= 1) countClass = 'card-count-full';
      else if (ratio >= 0.8) countClass = 'card-count-warn';

      return `
        <div class="palette-card" data-id="${p.id}">
          <div class="card-stripes">${stripes}${empties}</div>
          <div class="card-info">
            <span class="card-name">${this.escapeHtml(p.name)}</span>
            <span class="card-meta ${countClass}">${count}/${max} · ${dateStr}</span>
          </div>
          <button class="card-delete-btn" data-id="${p.id}" title="删除色卡组">×</button>
        </div>
      `;
    }).join('');

    // 绑定事件
    list.querySelectorAll('.palette-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.card-delete-btn')) return;
        this.showDetailView(parseInt(card.dataset.id));
      });
    });

    list.querySelectorAll('.card-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deletePalette(parseInt(btn.dataset.id));
      });
    });
  }

  // ========== 渲染：详情视图 ==========
  renderDetailView() {
    const p = this.getCurrentPalette();
    if (!p) return this.showListView();

    document.getElementById('paletteName').textContent = p.name;
    const d = new Date(p.createdAt);
    const dateStr = `${d.getMonth() + 1}月${d.getDate()}日`;
    const max = p.maxColors || this.maxColorsPerPalette;
    const count = p.colors.length;
    const ratio = count / max;

    let metaClass = '';
    if (ratio >= 1) metaClass = 'card-count-full';
    else if (ratio >= 0.8) metaClass = 'card-count-warn';

    document.getElementById('paletteMeta').textContent =
      `创建于 ${dateStr} · ${count}/${max}个颜色`;
    document.getElementById('paletteMeta').className = `palette-meta ${metaClass}`;

    document.getElementById('saveColor').disabled = !this.currentColor;

    this.renderColorGrid();
  }

  renderColorGrid() {
    const grid = document.getElementById('paletteGrid');
    const colors = this.getCurrentColors();

    if (colors.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">🌈</span>
          <p>还没有颜色</p>
          <p class="empty-hint">点击"快速取色"开始取色</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = colors.map(color => `
      <div class="color-swatch"
           style="background-color: ${color.hex}"
           data-id="${color.id}"
           title="${color.hex}">
        <div class="delete-btn" data-id="${color.id}">×</div>
      </div>
    `).join('');

    grid.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        if (!e.target.classList.contains('delete-btn')) {
          const c = colors.find(col => col.id === parseInt(swatch.dataset.id));
          if (c) {
            this.currentColor = c;
            this.updateColorPreview(c);
          }
        }
      });
    });

    grid.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteColor(parseInt(btn.dataset.id));
      });
    });
  }

  // ========== 事件绑定 ==========
  bindEvents() {
    // 快速取色（双视图各一个）
    document.getElementById('quickPickBtn').addEventListener('click', () => this.quickPick());
    document.getElementById('quickPickBtn2').addEventListener('click', () => this.quickPick());

    // 保存颜色
    document.getElementById('saveColor').addEventListener('click', () => this.saveCurrentColor());

    // 复制按钮
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.copyToClipboard(e.target.dataset.target);
      });
    });

    // 排序
    document.getElementById('sortBtn').addEventListener('click', () => this.cycleSort());

    // 新建色卡组
    document.getElementById('newPaletteBtn').addEventListener('click', () => this.createPalette());

    // 返回列表
    document.getElementById('backBtn').addEventListener('click', () => this.showListView());

    // 重命名
    document.getElementById('editNameBtn').addEventListener('click', () => this.renamePalette());

    // 删除色卡组
    document.getElementById('deletePaletteBtn').addEventListener('click', () => this.deleteCurrentPalette());

    // 清空色卡
    document.getElementById('clearPalette').addEventListener('click', () => this.clearPalette());

    // 导出
    document.getElementById('exportCSS').addEventListener('click', () => this.exportCSS());
    document.getElementById('exportPNG').addEventListener('click', () => this.exportPNG());

    // 设置
    document.getElementById('openOptions').addEventListener('click', () => chrome.runtime.openOptionsPage());
    document.getElementById('openOptions2').addEventListener('click', () => chrome.runtime.openOptionsPage());
  }

  // ========== 取色 ==========
  async quickPick() {
    if (!window.EyeDropper) {
      this.showNotification('浏览器不支持取色功能，请升级到 Chrome 95+');
      return;
    }

    try {
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();

      const color = this.parseSRGBHex(result.sRGBHex);
      if (!color) { this.showNotification('取色失败'); return; }

      this.currentColor = color;
      this.updateColorPreview(color);

      const p = this.getCurrentPalette();
      if (!p) return;

      const max = p.maxColors || this.maxColorsPerPalette;
      if (p.colors.length >= max) {
        this.showNotification(`色卡组已满（${max}/${max}），请删除颜色后再添加`);
        return;
      }

      if (p.colors.some(c => c.hex === color.hex)) {
        this.showNotification('⚡ 颜色已存在！');
        return;
      }

      p.colors.push({
        ...color,
        id: Date.now(),
        note: '',
        createdAt: new Date().toISOString()
      });
      await this.saveData();

      this.renderDetailView();
      this.showNotification('⚡ 颜色已保存！');
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[Pixel Color Picker] Quick pick error:', err);
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

  // ========== 颜色操作 ==========
  async saveCurrentColor() {
    if (!this.currentColor) return;
    const p = this.getCurrentPalette();
    if (!p) return;

    const max = p.maxColors || this.maxColorsPerPalette;
    if (p.colors.length >= max) {
      this.showNotification(`色卡组已满（${max}/${max}），请删除颜色后再添加`);
      return;
    }

    if (p.colors.some(c => c.hex === this.currentColor.hex)) {
      this.showNotification('颜色已存在！');
      return;
    }

    p.colors.push({
      ...this.currentColor,
      id: Date.now(),
      note: '',
      createdAt: new Date().toISOString()
    });

    await this.saveData();
    this.renderDetailView();
    this.showNotification('颜色已保存！');
  }

  async deleteColor(id) {
    const p = this.getCurrentPalette();
    if (!p) return;
    p.colors = p.colors.filter(c => c.id !== id);
    await this.saveData();
    this.renderDetailView();
    this.showNotification('颜色已删除');
  }

  async clearPalette() {
    const p = this.getCurrentPalette();
    if (!p || p.colors.length === 0) return;
    if (!confirm('确定要清空当前色卡的所有颜色吗？')) return;
    p.colors = [];
    await this.saveData();
    this.renderDetailView();
    this.showNotification('色卡已清空');
  }

  // ========== 色卡组操作 ==========
  async createPalette() {
    const name = prompt('请输入色卡组名称：', '未命色卡组');
    if (name === null) return;

    const palette = {
      id: Date.now(),
      name: name.trim() || '未命色卡组',
      colors: [],
      maxColors: this.maxColorsPerPalette,
      createdAt: new Date().toISOString()
    };
    this.palettes.push(palette);
    this.currentPaletteId = palette.id;
    await this.saveData();
    this.showDetailView(palette.id);
    this.showNotification('色卡组已创建！');
  }

  async deletePalette(id) {
    if (this.palettes.length <= 1) {
      this.showNotification('至少保留一个色卡组');
      return;
    }
    if (!confirm('确定要删除这个色卡组吗？')) return;

    this.palettes = this.palettes.filter(p => p.id !== id);
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
    const p = this.getCurrentPalette();
    if (!p) return;
    const newName = prompt('重命名色卡组：', p.name);
    if (newName === null || newName.trim() === '') return;
    p.name = newName.trim();
    await this.saveData();
    this.renderDetailView();
    this.showNotification('已重命名');
  }

  cycleSort() {
    const modes = ['latest', 'oldest', 'az', 'za'];
    const idx = modes.indexOf(this.sortMode);
    this.sortMode = modes[(idx + 1) % modes.length];
    this.renderListView();
  }

  // ========== 导出 ==========
  exportCSS() {
    const p = this.getCurrentPalette();
    if (!p || p.colors.length === 0) { this.showNotification('色卡为空！'); return; }

    let css = `/* ${p.name} */\n:root {\n`;
    p.colors.forEach((color, index) => {
      css += `  --color-${index + 1}: ${color.hex};\n`;
      css += `  --color-${index + 1}-rgb: ${color.r}, ${color.g}, ${color.b};\n`;
    });
    css += '}\n';

    this.downloadFile(css, 'palette.css', 'text/css');
    this.showNotification('CSS已导出！');
  }

  exportPNG() {
    const p = this.getCurrentPalette();
    if (!p || p.colors.length === 0) { this.showNotification('色卡为空！'); return; }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const cols = 5;
    const cellSize = 64;
    const rows = Math.ceil(p.colors.length / cols);

    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    p.colors.forEach((color, index) => {
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

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      this.downloadFile(url, 'palette.png', 'image/png');
      this.showNotification('图片已导出！');
    });
  }

  // ========== 工具 ==========
  parseSRGBHex(hex) {
    const m = /^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/.exec(hex);
    if (!m) return null;
    const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
    return { r, g, b, hex: hex.toUpperCase(), hsl: this.rgbToHsl(r, g, b) };
  }

  rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  }

  copyToClipboard(inputId) {
    const input = document.getElementById(inputId);
    const text = input ? input.value : '';
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      const btn = input.nextElementSibling;
      if (!btn) return;
      btn.textContent = '✅';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = '📋'; btn.classList.remove('copied'); }, 1500);
      this.showNotification('已复制！');
    });
  }

  downloadFile(content, filename, type) {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({ url, filename, saveAs: true });
  }

  getContrastColor(r, g, b) {
    return (r * 299 + g * 587 + b * 114) / 1000 > 128 ? '#000000' : '#FFFFFF';
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
    const headerColor = this.settings?.headerColor || '#F85E9F';
    const buttonColor = this.settings?.buttonColor || '#F85E9F';
    const root = document.documentElement;
    root.style.setProperty('--header-bg', headerColor);
    root.style.setProperty('--button-bg', buttonColor);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PixelColorPicker();
});
