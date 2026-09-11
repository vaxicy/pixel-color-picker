window.PixelThemes = (() => {
  const presets = {
    pink: {
      label: { 'zh-CN': '莓果像素', en: 'Berry Pixel' },
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
      label: { 'zh-CN': '森绿软糖', en: 'Forest Candy' },
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
      label: { 'zh-CN': '月夜霓虹', en: 'Neon Night' },
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
      label: { 'zh-CN': '薰衣草云', en: 'Lavender Cloud' },
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
      label: { 'zh-CN': '奶油布丁', en: 'Cream Pudding' },
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
      label: { 'zh-CN': '海盐气泡', en: 'Sea Salt Soda' },
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
      label: { 'zh-CN': '樱桃软糖', en: 'Cherry Candy' },
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
      label: { 'zh-CN': '绿屏掌机', en: 'Pocket Green' },
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
      label: { 'zh-CN': '焦糖可可', en: 'Caramel Cocoa' },
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
      label: { 'zh-CN': '薄荷奶昔', en: 'Mint Shake' },
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
      label: { 'zh-CN': '葡萄汽水', en: 'Grape Soda' },
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
      label: { 'zh-CN': '雾粉灰调', en: 'Misty Rose' },
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
    },
    rose: {
      label: { 'zh-CN': '烟熏玫瑰', en: 'Smoked Rose' },
      headerColor: '#853953',
      buttonColor: '#612D53',
      bgColor: '#F3F4F4',
      panelColor: '#FFFFFF',
      panelWarmColor: '#F5F0F2',
      bgDotColor: 'rgba(133, 57, 83, 0.18)',
      bgLineColor: 'rgba(44, 44, 44, 0.06)',
      textColor: '#2C2C2C',
      textSoftColor: '#8A5A6D',
      borderColor: '#2C2C2C'
    },
    forest: {
      label: { 'zh-CN': '苍松翠谷', en: 'Pine Valley' },
      headerColor: '#12544F',
      buttonColor: '#2A835F',
      bgColor: '#f0faf5',
      panelColor: '#ffffff',
      panelWarmColor: '#e4f0e8',
      bgDotColor: 'rgba(42, 131, 95, 0.20)',
      bgLineColor: 'rgba(9, 35, 40, 0.05)',
      textColor: '#092328',
      textSoftColor: '#5a7a70',
      borderColor: '#092328'
    },
    holly: {
      label: { 'zh-CN': '冬青红果', en: 'Holly Berry' },
      headerColor: '#7F2020',
      buttonColor: '#869B7E',
      bgColor: '#F6F3EB',
      panelColor: '#ffffff',
      panelWarmColor: '#E8E9D6',
      bgDotColor: 'rgba(134, 155, 126, 0.18)',
      bgLineColor: 'rgba(61, 43, 43, 0.05)',
      textColor: '#3D2B2B',
      textSoftColor: '#7A6B6B',
      borderColor: '#3D2B2B'
    }
  };

  const DEFAULT_THEME = {
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
  };

  const order = [...Object.keys(presets), 'custom'];

  const getThemePresets = () => presets;
  const getThemeOrder = () => order;
  const getThemeLabel = (key, lang) => {
    if (key === 'custom') return lang === 'en' ? 'Custom' : '自定义';
    const preset = presets[key];
    if (!preset) return key;
    return (preset.label && (preset.label[lang] || preset.label['zh-CN'])) || key;
  };
  const mergeTheme = (theme) => Object.assign({}, DEFAULT_THEME, theme || {});

  return { presets, DEFAULT_THEME, order, getThemePresets, getThemeOrder, getThemeLabel, mergeTheme };
})();
