// Popup 主逻辑
class PixelColorPicker {
  constructor() {
    this.currentColor = null;
    this.isPicking = false;
    this.palette = [];
    
    this.init();
  }

  async init() {
    // 加载保存的色卡
    await this.loadPalette();
    
    // 绑定事件
    this.bindEvents();
    
    // 更新UI
    this.updatePaletteUI();
  }

  bindEvents() {
    // 快速取色按钮（EyeDropper API）
    document.getElementById('quickPickBtn').addEventListener('click', () => {
      this.quickPick();
    });

    // 放大镜取色按钮
    document.getElementById('pickButton').addEventListener('click', () => {
      this.togglePicker();
    });

    // 保存颜色按钮
    document.getElementById('saveColor').addEventListener('click', () => {
      this.saveCurrentColor();
    });

    // 复制按钮
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetId = e.target.dataset.target;
        this.copyToClipboard(targetId);
      });
    });

    // 清空色卡
    document.getElementById('clearPalette').addEventListener('click', () => {
      this.clearPalette();
    });

    // 导出CSS
    document.getElementById('exportCSS').addEventListener('click', () => {
      this.exportCSS();
    });

    // 导出PNG
    document.getElementById('exportPNG').addEventListener('click', () => {
      this.exportPNG();
    });

    // 打开设置
    document.getElementById('openOptions').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    // 监听来自content script的消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'COLOR_PICKED') {
        this.handleColorPicked(message.color);
      }
    });
  }

  async togglePicker() {
    this.isPicking = !this.isPicking;

    const button = document.getElementById('pickButton');
    const status = document.getElementById('pickerStatus');

    if (this.isPicking) {
      button.querySelector('.button-text').textContent = '停止放大镜';
      button.classList.add('active');
      status.querySelector('.status-dot').classList.add('active');
      status.querySelector('.status-text').textContent = '取色中… 按 E 记录，ESC 取消';

      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) {
          throw new Error('无法获取当前标签页');
        }

        // 禁止在 Chrome 系统页面、扩展商店等无法注入 content script 的页面取色
        const url = tab.url || '';
        const blocked = url.startsWith('chrome://') || url.startsWith('edge://') || url.startsWith('about:') || url.startsWith('https://chrome.google.com/webstore');
        if (blocked) {
          throw new Error('此页面不支持取色');
        }

        // 先 ping 一次，确认 content script 已连接
        try {
          await chrome.tabs.sendMessage(tab.id, { type: 'PING' });
        } catch (pingErr) {
          console.log('Ping failed:', pingErr.message);
          throw new Error('页面脚本未就绪，请关闭当前标签页重新打开');
        }

        await chrome.tabs.sendMessage(tab.id, { type: 'ACTIVATE_PICKER' });
      } catch (e) {
        console.log('取色启动失败:', e.message || e);
        this.isPicking = false;
        button.querySelector('.button-text').textContent = '放大镜取色';
        button.classList.remove('active');
        status.querySelector('.status-dot').classList.remove('active');
        status.querySelector('.status-text').textContent = '就绪';
        this.showNotification(e.message || '此页面暂不支持取色，请刷新后重试');
      }
    } else {
      button.querySelector('.button-text').textContent = '放大镜取色';
      button.classList.remove('active');
      status.querySelector('.status-dot').classList.remove('active');
      status.querySelector('.status-text').textContent = '就绪';

      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id) {
          await chrome.tabs.sendMessage(tab.id, { type: 'DEACTIVATE_PICKER' }).catch(() => {});
        }
      } catch (e) {
        console.log('Stop picker error:', e);
      }
    }
  }

  handleColorPicked(color) {
    if (!color) return;
    this.currentColor = color;

    // 更新颜色预览
    this.updateColorPreview(color);

    // 停止取色模式 UI
    this.isPicking = false;
    const button = document.getElementById('pickButton');
    button.querySelector('.button-text').textContent = '放大镜取色';
    button.classList.remove('active');

    const status = document.getElementById('pickerStatus');
    status.querySelector('.status-dot').classList.remove('active');
    status.querySelector('.status-text').textContent = '就绪';

    // background 已自动保存到 storage；延迟刷新 UI 确保数据已写入
    setTimeout(() => {
      this.loadPalette().then(() => {
        this.updatePaletteUI();
        this.showNotification('颜色已保存到色卡！');
      });
    }, 150);
  }

  // ========== 快速取色（EyeDropper API）==========
  async quickPick() {
    // 检查浏览器是否支持 EyeDropper API（Chrome 95+）
    if (!window.EyeDropper) {
      this.showNotification('浏览器不支持快速取色，请使用放大镜模式');
      this.togglePicker();
      return;
    }

    try {
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();

      // result.sRGBHex 格式: "#RRGGBB"
      const color = this.parseSRGBHex(result.sRGBHex);
      if (!color) {
        this.showNotification('取色失败');
        return;
      }

      // 更新当前颜色预览
      this.currentColor = color;
      this.updateColorPreview(color);

      // 直接保存到色卡
      await this.saveQuickColor(color);
      await this.loadPalette();
      this.updatePaletteUI();
      this.showNotification('⚡ 颜色已保存到色卡！');
    } catch (err) {
      // AbortError 是用户按 ESC 取消，静默处理
      if (err.name !== 'AbortError') {
        console.error('[Pixel Color Picker] Quick pick error:', err);
        this.showNotification('快速取色失败，请重试');
      }
    }
  }

  // 解析 sRGBHex 为 color 对象
  parseSRGBHex(hex) {
    const m = /^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/.exec(hex);
    if (!m) return null;
    const r = parseInt(m[1], 16);
    const g = parseInt(m[2], 16);
    const b = parseInt(m[3], 16);
    return {
      r, g, b,
      hex: hex.toUpperCase(),
      hsl: this.rgbToHsl(r, g, b)
    };
  }

  // RGB → HSL 转换
  rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  // 快速取色专用：直接写入 storage 并去重
  async saveQuickColor(color) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['palette'], (result) => {
        let palette = result.palette || [];
        const exists = palette.some(c => c.hex === color.hex);
        if (!exists) {
          palette.push({
            ...color,
            id: Date.now(),
            note: '',
            createdAt: new Date().toISOString()
          });
          chrome.storage.sync.set({ palette }, resolve);
        } else {
          resolve();
        }
      });
    });
  }

  // ========== 预览更新 ==========
  updateColorPreview(color) {
    const preview = document.getElementById('colorPreview');
    preview.style.backgroundColor = color.hex;
    
    document.getElementById('hexValue').value = color.hex;
    document.getElementById('rgbValue').value = `rgb(${color.r}, ${color.g}, ${color.b})`;
    document.getElementById('hslValue').value = color.hsl;
  }

  async saveCurrentColor() {
    if (!this.currentColor) return;
    
    // 检查是否已存在
    const exists = this.palette.some(c => c.hex === this.currentColor.hex);
    if (exists) {
      this.showNotification('颜色已存在！');
      return;
    }
    
    // 添加到色卡
    this.palette.push({
      ...this.currentColor,
      id: Date.now(),
      note: '',
      createdAt: new Date().toISOString()
    });
    
    // 保存到storage
    await this.savePalette();
    
    // 更新UI
    this.updatePaletteUI();
    
    // 显示通知
    this.showNotification('颜色已保存！');
  }

  async loadPalette() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['palette'], (result) => {
        this.palette = result.palette || [];
        resolve();
      });
    });
  }

  async savePalette() {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ palette: this.palette }, resolve);
    });
  }

  updatePaletteUI() {
    const grid = document.getElementById('paletteGrid');
    const count = document.getElementById('colorCount');
    
    count.textContent = `${this.palette.length} 个颜色`;
    
    if (this.palette.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">🌈</span>
          <p>还没有颜色</p>
          <p class="empty-hint">点击"快速取色"或"放大镜取色"</p>
        </div>
      `;
      return;
    }
    
    grid.innerHTML = this.palette.map(color => `
      <div class="color-swatch" 
           style="background-color: ${color.hex}"
           data-id="${color.id}"
           title="${color.hex}">
        <div class="delete-btn" data-id="${color.id}">×</div>
      </div>
    `).join('');
    
    // 绑定色卡点击事件
    grid.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        if (!e.target.classList.contains('delete-btn')) {
          const id = parseInt(swatch.dataset.id);
          const color = this.palette.find(c => c.id === id);
          if (color) {
            this.updateColorPreview(color);
          }
        }
      });
    });
    
    // 绑定删除按钮
    grid.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        this.deleteColor(id);
      });
    });
  }

  async deleteColor(id) {
    this.palette = this.palette.filter(c => c.id !== id);
    await this.savePalette();
    this.updatePaletteUI();
    this.showNotification('颜色已删除');
  }

  async clearPalette() {
    if (this.palette.length === 0) return;
    
    if (confirm('确定要清空所有颜色吗？')) {
      this.palette = [];
      await this.savePalette();
      this.updatePaletteUI();
      this.showNotification('色卡已清空');
    }
  }

  copyToClipboard(inputId) {
    const input = document.getElementById(inputId);
    const text = input.value;
    
    if (!text) return;
    
    navigator.clipboard.writeText(text).then(() => {
      const btn = input.nextElementSibling;
      btn.textContent = '✅';
      btn.classList.add('copied');
      
      setTimeout(() => {
        btn.textContent = '📋';
        btn.classList.remove('copied');
      }, 1500);
      
      this.showNotification('已复制！');
    });
  }

  exportCSS() {
    if (this.palette.length === 0) {
      this.showNotification('色卡为空！');
      return;
    }
    
    let css = '/* Pixel Color Palette */\n';
    css += ':root {\n';
    
    this.palette.forEach((color, index) => {
      css += `  --color-${index + 1}: ${color.hex};\n`;
      css += `  --color-${index + 1}-rgb: ${color.r}, ${color.g}, ${color.b};\n`;
    });
    
    css += '}\n';
    
    this.downloadFile(css, 'palette.css', 'text/css');
    this.showNotification('CSS已导出！');
  }

  exportPNG() {
    if (this.palette.length === 0) {
      this.showNotification('色卡为空！');
      return;
    }
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const cols = 5;
    const cellSize = 64;
    const rows = Math.ceil(this.palette.length / cols);
    
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;
    
    // 绘制背景
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制颜色块
    this.palette.forEach((color, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      ctx.fillStyle = color.hex;
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      
      // 绘制像素边框
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
      
      // 绘制颜色值
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

  downloadFile(content, filename, type) {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    
    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true
    });
  }

  getContrastColor(r, g, b) {
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
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
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  new PixelColorPicker();
});
