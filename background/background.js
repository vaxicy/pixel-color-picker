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
});
