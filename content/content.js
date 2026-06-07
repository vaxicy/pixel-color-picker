// Content Script - 取色器核心逻辑
(function () {
  'use strict';

  // 如果 chrome.runtime 不可用（扩展已重载、特殊 iframe 等），静默退出
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.onMessage) {
    console.warn('[Pixel Color Picker] chrome.runtime is not available. The extension may have been reloaded. Please refresh the page.');
    return;
  }

  class ColorPickerContent {
    constructor() {
      this.isActive = false;
      this.magnifier = null;
      this.crosshair = null;
      this.currentColor = null;
      this.canvas = null;
      this.ctx = null;
      this.screenshotCanvas = null;
      this.screenshotCtx = null;
      this.devicePixelRatio = 1;

      // 绑定事件处理器引用，确保能正确 removeEventListener
      this.boundHandleMouseMove = this.handleMouseMove.bind(this);
      this.boundHandleClick = this.handleClick.bind(this);
      this.boundHandleKeyDown = this.handleKeyDown.bind(this);

      this.init();
    }

    init() {
      try {
        // 必须先注册消息监听器，确保 popup 能连上；DOM 操作失败不影响通信
        this.bindMessages();
        this.createMagnifier();
        this.createCrosshair();
        console.log('[Pixel Color Picker] Content script initialized successfully');
      } catch (err) {
        console.error('[Pixel Color Picker] Init failed:', err);
      }
    }

    bindMessages() {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        try {
          if (message.type === 'ACTIVATE_PICKER') {
            this.activate();
            return false;
          } else if (message.type === 'DEACTIVATE_PICKER') {
            this.deactivate();
            return false;
          } else if (message.type === 'PING') {
            sendResponse({ pong: true });
            return true; // 需要保持通道开放以发送响应
          }
        } catch (err) {
          console.error('[Pixel Color Picker] Message handler error:', err);
        }
        return false;
      });
      console.log('[Pixel Color Picker] Message listener registered');
    }

  async activate() {
    if (this.isActive) return;

    try {
      await this.captureScreen();
    } catch (e) {
      console.error('截图失败:', e);
      alert('无法截取页面，请在普通网页（非Chrome系统页）刷新后重试');
      return;
    }

    this.isActive = true;
    document.body.style.cursor = 'crosshair';

    this.magnifier.style.display = 'block';
    this.crosshair.style.display = 'block';

    document.addEventListener('mousemove', this.boundHandleMouseMove);
    document.addEventListener('click', this.boundHandleClick);
    // 用 window + capture 阶段监听键盘，避免被页面 JS 拦截
    window.addEventListener('keydown', this.boundHandleKeyDown, true);
  }

  deactivate() {
    if (!this.isActive) return;
    this.isActive = false;
    document.body.style.cursor = '';

    this.magnifier.style.display = 'none';
    this.crosshair.style.display = 'none';

    document.removeEventListener('mousemove', this.boundHandleMouseMove);
    document.removeEventListener('click', this.boundHandleClick);
    window.removeEventListener('keydown', this.boundHandleKeyDown, true);

    // 清理截图资源
    this.screenshotCanvas = null;
    this.screenshotCtx = null;
    this.devicePixelRatio = 1;
  }

  captureScreen() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'CAPTURE_TAB' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response || response.error) {
          reject(new Error(response ? response.error : '截屏失败'));
          return;
        }

        const img = new Image();
        img.onload = () => {
          this.devicePixelRatio = window.devicePixelRatio || 1;
          this.screenshotCanvas = document.createElement('canvas');
          this.screenshotCanvas.width = img.naturalWidth;
          this.screenshotCanvas.height = img.naturalHeight;
          this.screenshotCtx = this.screenshotCanvas.getContext('2d', { willReadFrequently: true });
          this.screenshotCtx.drawImage(img, 0, 0);
          resolve();
        };
        img.onerror = () => reject(new Error('截屏图片加载失败'));
        img.src = response.dataUrl;
      });
    });
  }

  createMagnifier() {
    this.magnifier = document.createElement('div');
    this.magnifier.className = 'pixel-magnifier';
    this.magnifier.style.display = 'none';

    this.canvas = document.createElement('canvas');
    this.canvas.width = 160;
    this.canvas.height = 160;
    this.ctx = this.canvas.getContext('2d');

    this.magnifier.appendChild(this.canvas);
    document.body.appendChild(this.magnifier);
  }

  createCrosshair() {
    this.crosshair = document.createElement('div');
    this.crosshair.className = 'pixel-crosshair';
    this.crosshair.style.display = 'none';
    document.body.appendChild(this.crosshair);
  }

  handleMouseMove(e) {
    if (!this.isActive) return;

    const x = e.clientX;
    const y = e.clientY;

    this.updateMagnifier(x, y);
    this.updateCrosshair(x, y);
    this.currentColor = this.getColorAtPosition(x, y);
  }

  handleClick(e) {
    if (!this.isActive) return;

    // 阻止页面本身的点击交互（如小红书打开视频/帖子），但不记录颜色
    e.preventDefault();
    e.stopPropagation();
  }

  handleKeyDown(e) {
    if (!this.isActive) return;

    // 阻止页面本身对按键的响应
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      this.deactivate();
    } else if (e.code === 'KeyE') {
      if (this.currentColor) {
        console.log('[Pixel Color Picker] E pressed, color:', this.currentColor.hex);
        chrome.runtime.sendMessage({
          type: 'COLOR_PICKED',
          color: this.currentColor
        }, () => {
          if (chrome.runtime.lastError) {
            console.log('Send message to popup:', chrome.runtime.lastError.message);
          }
        });

        this.deactivate();
      }
    }
  }

  updateMagnifier(x, y) {
    const magnifierSize = 160;
    const offset = 20;

    let left = x + offset;
    let top = y + offset;

    if (left + magnifierSize > window.innerWidth) {
      left = x - magnifierSize - offset;
    }
    if (top + magnifierSize > window.innerHeight) {
      top = y - magnifierSize - offset;
    }

    this.magnifier.style.left = left + 'px';
    this.magnifier.style.top = top + 'px';

    this.drawMagnifier(x, y);
  }

  drawMagnifier(x, y) {
    const zoom = 8;
    const size = 160;
    const halfSize = size / 2;
    const sampleSize = Math.ceil(size / zoom); // 20

    this.ctx.clearRect(0, 0, size, size);

    if (!this.screenshotCtx) return;

    const dpr = this.devicePixelRatio || 1;
    const cx = Math.round(x * dpr);
    const cy = Math.round(y * dpr);

    // 计算采样区域（以鼠标为中心）
    let sx = cx - Math.floor(sampleSize / 2);
    let sy = cy - Math.floor(sampleSize / 2);
    let sw = sampleSize;
    let sh = sampleSize;

    // 边界裁剪
    if (sx < 0) sx = 0;
    if (sy < 0) sy = 0;
    if (sx + sw > this.screenshotCanvas.width) sw = this.screenshotCanvas.width - sx;
    if (sy + sh > this.screenshotCanvas.height) sh = this.screenshotCanvas.height - sy;

    // 绘制放大的真实页面内容
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(
      this.screenshotCanvas,
      sx, sy, sw, sh,
      0, 0, sw * zoom, sh * zoom
    );

    // 绘制像素网格
    this.ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < size; i += zoom) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, size);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(size, i);
      this.ctx.stroke();
    }

    // 绘制中心十字
    this.ctx.strokeStyle = '#FF0000';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(halfSize, 0);
    this.ctx.lineTo(halfSize, size);
    this.ctx.moveTo(0, halfSize);
    this.ctx.lineTo(size, halfSize);
    this.ctx.stroke();

    // 绘制中心像素颜色块
    if (this.currentColor) {
      this.ctx.fillStyle = this.currentColor.hex;
      this.ctx.fillRect(halfSize - zoom / 2, halfSize - zoom / 2, zoom, zoom);
    }
  }

  updateCrosshair(x, y) {
    this.crosshair.style.left = x + 'px';
    this.crosshair.style.top = y + 'px';
  }

  getColorAtPosition(x, y) {
    if (!this.screenshotCtx) return null;

    const dpr = this.devicePixelRatio || 1;
    const sx = Math.round(x * dpr);
    const sy = Math.round(y * dpr);

    if (
      sx < 0 || sy < 0 ||
      sx >= this.screenshotCanvas.width ||
      sy >= this.screenshotCanvas.height
    ) {
      return null;
    }

    const pixel = this.screenshotCtx.getImageData(sx, sy, 1, 1).data;
    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];
    const a = pixel[3];

    // 完全透明时按白色处理
    if (a === 0) {
      return { r: 255, g: 255, b: 255, hex: '#FFFFFF', hsl: 'hsl(0, 0%, 100%)' };
    }

    return {
      r, g, b,
      hex: this.rgbToHex(r, g, b),
      hsl: this.rgbToHsl(r, g, b)
    };
  }

  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();
  }

  rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

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
}

  // 初始化取色器
  const colorPicker = new ColorPickerContent();
})();
