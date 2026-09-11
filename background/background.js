importScripts('../lib/color-utils.js');

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['palettes', 'currentPaletteId', 'settings'], (result) => {
    const updates = {};

    if (!result.palettes) {
      const defaultPalette = {
        id: Date.now(),
        name: '默认色卡',
        colors: [],
        maxColors: 20,
        createdAt: new Date().toISOString()
      };
      updates.palettes = [defaultPalette];
      updates.currentPaletteId = defaultPalette.id;
    } else if (!result.currentPaletteId && result.palettes.length > 0) {
      updates.currentPaletteId = result.palettes[0].id;
    }

    if (!result.settings) {
      updates.settings = {
        defaultFormat: 'hex',
        pickAction: 'save',
        autoSave: true,
        maxColorsPerPalette: 20,
        headerColor: '#ff6b9d',
        buttonColor: '#ff6b9d',
        bgColor: '#fff9fc',
        panelColor: '#ffffff',
        themePreset: 'pink',
        themeBasePreset: 'pink'
      };
    }

    if (Object.keys(updates).length > 0) {
      chrome.storage.sync.set(updates);
    }
  });

  chrome.contextMenus.create({
    id: 'pixel-quick-pick',
    title: '用 Pixel 吸色并保存',
    contexts: ['all']
  });
});

// 右键菜单：在页面注入脚本取色
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'pixel-quick-pick') return;
  if (tab && tab.id) runPagePick(tab.id);
});

async function runPagePick(tabId) {
  try {
    const settings = await getSettings();
    const [res] = await chrome.scripting.executeScript({
      target: { tabId },
      func: pagePickAndCopy,
      args: [settings.defaultFormat || 'hex', settings.pickAction || 'save']
    });
    const data = res && res.result;
    if (!data || !data.ok) return;
    await savePickedColor(data.hex, settings);
  } catch (error) {
    console.error('[Pixel] page pick failed', error);
  }
}

// 在页面上下文运行：打开 EyeDropper、按需复制、提示
function pagePickAndCopy(defaultFormat, pickAction) {
  return new Promise((resolve) => {
    if (!window.EyeDropper) {
      resolve({ ok: false, reason: 'no-eyedropper' });
      return;
    }
    const parseHex = (hex) => {
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
    };
    const rgbToHsl = (r, g, b) => {
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;
      if (max === min) { h = s = 0; }
      else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    };
    const toText = (hex, parsed) => {
      if (defaultFormat === 'rgb') return 'rgb(' + parsed.r + ', ' + parsed.g + ', ' + parsed.b + ')';
      if (defaultFormat === 'hsl') {
        const h = rgbToHsl(parsed.r, parsed.g, parsed.b);
        return 'hsl(' + h.h + ', ' + h.s + '%, ' + h.l + '%)';
      }
      return hex;
    };

    new EyeDropper().open().then(async (result) => {
      const hex = result.sRGBHex;
      const parsed = parseHex(hex);
      if ((pickAction === 'copy' || pickAction === 'copy-save') && parsed) {
        try {
          await navigator.clipboard.writeText(toText(hex, parsed));
        } catch (e) { /* ignore */ }
      }
      showPickToast(hex);
      resolve({ ok: true, hex });
    }).catch((err) => resolve({ ok: false, reason: err && err.name }));
  });
}

function showPickToast(hex) {
  try {
    const el = document.createElement('div');
    el.textContent = '已取色 ' + hex;
    el.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:2147483647;' +
      'padding:8px 12px;background:#ff6b9d;color:#fff;font:13px/1.4 sans-serif;' +
      'border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.25)';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  } catch (e) { /* ignore */ }
}

function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['settings'], (r) => resolve(r.settings || {}));
  });
}

async function savePickedColor(hex, settings) {
  const parsed = ColorUtils.hexToRgb(hex);
  if (!parsed) return;
  const data = await new Promise((resolve) => chrome.storage.sync.get(['palettes', 'currentPaletteId', 'colorHistory'], resolve));
  const palettes = data.palettes || [];
  const currentId = data.currentPaletteId || (palettes[0] && palettes[0].id);
  const palette = palettes.find((p) => p.id === currentId) || palettes[0];
  const hexNorm = hex.toUpperCase();

  if (palette && settings.autoSave !== false && !palette.colors.some((c) => (c.hex || '').toUpperCase() === hexNorm)) {
    palette.colors.push({
      id: Date.now(),
      r: parsed.r,
      g: parsed.g,
      b: parsed.b,
      hex: hexNorm,
      hsl: ColorUtils.rgbToHsl(parsed.r, parsed.g, parsed.b),
      note: '',
      createdAt: new Date().toISOString()
    });
  }

  const history = Array.isArray(data.colorHistory) ? data.colorHistory : [];
  if (!history.some((c) => (c.hex || '').toUpperCase() === hexNorm)) {
    history.unshift({
      id: Date.now(),
      r: parsed.r,
      g: parsed.g,
      b: parsed.b,
      hex: hexNorm,
      hsl: ColorUtils.rgbToHsl(parsed.r, parsed.g, parsed.b),
      note: '',
      favorite: false,
      createdAt: new Date().toISOString()
    });
  }

  const updates = {};
  if (palette) updates.palettes = palettes;
  updates.colorHistory = history.slice(0, 30);
  await new Promise((resolve) => chrome.storage.sync.set(updates));
}
