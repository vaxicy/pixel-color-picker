// 颜色工具库
const ColorUtils = {
  // HEX转RGB
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    };
  },

  // RGB转HEX
  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  },

  // RGB转HSL
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
    
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  },

  // HSL转RGB
  hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  },

  // 获取对比色（黑或白）
  getContrastColor(r, g, b) {
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  },

  // 颜色亮度
  getLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  // 颜色对比度
  getContrastRatio(color1, color2) {
    const lum1 = this.getLuminance(color1.r, color1.g, color1.b);
    const lum2 = this.getLuminance(color2.r, color2.g, color2.b);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  },

  // 生成随机颜色
  randomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    
    return {
      r, g, b,
      hex: this.rgbToHex(r, g, b),
      hsl: this.rgbToHsl(r, g, b)
    };
  },

  // 颜色调色板生成
  generatePalette(baseColor, type = 'complementary') {
    const hsl = this.rgbToHsl(baseColor.r, baseColor.g, baseColor.b);
    const colors = [];
    
    switch (type) {
      case 'complementary':
        colors.push(baseColor);
        const comp = this.hslToRgb((hsl.h + 180) % 360, hsl.s, hsl.l);
        colors.push({
          r: comp.r, g: comp.g, b: comp.b,
          hex: this.rgbToHex(comp.r, comp.g, comp.b)
        });
        break;
        
      case 'triadic':
        for (let i = 0; i < 3; i++) {
          const rgb = this.hslToRgb((hsl.h + i * 120) % 360, hsl.s, hsl.l);
          colors.push({
            r: rgb.r, g: rgb.g, b: rgb.b,
            hex: this.rgbToHex(rgb.r, rgb.g, rgb.b)
          });
        }
        break;
        
      case 'analogous':
        for (let i = -2; i <= 2; i++) {
          const rgb = this.hslToRgb((hsl.h + i * 30 + 360) % 360, hsl.s, hsl.l);
          colors.push({
            r: rgb.r, g: rgb.g, b: rgb.b,
            hex: this.rgbToHex(rgb.r, rgb.g, rgb.b)
          });
        }
        break;
    }
    
    return colors;
  },

  // 颜色字符串解析
  parseColorString(str) {
    str = str.trim().toLowerCase();
    
    // HEX
    if (/^#?[0-9a-f]{3,8}$/.test(str)) {
      if (!str.startsWith('#')) str = '#' + str;
      if (/^#[0-9a-f]{3}$/.test(str)) {
        str = '#' + str[1] + str[1] + str[2] + str[2] + str[3] + str[3];
      }
      const rgb = this.hexToRgb(str);
      return {
        r: rgb.r, g: rgb.g, b: rgb.b,
        hex: str.toUpperCase()
      };
    }
    
    // RGB
    const rgbMatch = str.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      return {
        r, g, b,
        hex: this.rgbToHex(r, g, b)
      };
    }
    
    // HSL
    const hslMatch = str.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (hslMatch) {
      const h = parseInt(hslMatch[1]);
      const s = parseInt(hslMatch[2]);
      const l = parseInt(hslMatch[3]);
      const rgb = this.hslToRgb(h, s, l);
      return {
        r: rgb.r, g: rgb.g, b: rgb.b,
        hex: this.rgbToHex(rgb.r, rgb.g, rgb.b)
      };
    }
    
    return null;
  }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ColorUtils;
}
