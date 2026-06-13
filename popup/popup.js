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
    this.colorSortMode = 'time';
    this.paletteSearchQuery = '';
    this.historySearchQuery = '';
    this.pixelDialogState = null;
    this.paletteSearchOpen = false;
    this.currentDisplayFormat = 'hex';
    this.batchMode = false;
    this.batchSelectedIds = new Set();
    this.paletteFilter = 'all';
    this.swatchLabelMode = 'note';
    this.themeBasePreset = 'pink';

    this.init();
  }

  async init() {
    await this.loadData();
    this.bindEvents();
    this.render();
  }

  async loadData() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['palettes', 'currentPaletteId', 'palette', 'settings', 'colorHistory', 'lastPickedColor'], (result) => {
        this.settings = result.settings || {};
        this.colorHistory = Array.isArray(result.colorHistory) ? result.colorHistory : [];
        this.currentColor = this.normalizeStoredColor(result.lastPickedColor);
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
    this.paletteSearchQuery = '';
    this.paletteSearchOpen = false;
    this.paletteFilter = 'all';
    this.batchMode = false;
    this.batchSelectedIds.clear();
    this.closePaletteMoreMenu();
    this.markPaletteOpened(id);
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
      case 'recent':
        palettes.sort((a, b) => new Date(b.lastOpenedAt || b.createdAt) - new Date(a.lastOpenedAt || a.createdAt));
        break;
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
      recent: '最近',
      latest: '新建',
      oldest: '最早',
      az: 'A-Z',
      za: 'Z-A'
    };
    const sortButton = document.getElementById('sortBtn');
    if (sortButton) sortButton.textContent = sortLabels[this.sortMode];

    if (palettes.length === 0) {
      list.innerHTML = `
        <div class="empty-state palette-empty-state">
          <span class="empty-icon">?</span>
          <p>新建一个像素色卡吧</p>
          <p class="empty-hint">把常用颜色收进一个小盒子</p>
          <div class="empty-actions">
            <button class="empty-action" data-empty-action="create">+ 新建</button>
          </div>
        </div>
      `;
      this.bindEmptyStateActions(list);
      return;
    }

    list.innerHTML = palettes.map((palette) => {
      const max = palette.maxColors || this.maxColorsPerPalette;
      const count = palette.colors.length;
      const ratio = count / max;
      const topColors = palette.colors.slice(-4).reverse();
      const swatches = topColors.map((color) =>
        `<span class="card-preview-dot" style="background:${color.hex}" title="${color.hex}"></span>`
      ).join('');
      const empties = Array(4 - topColors.length).fill(
        '<span class="card-preview-dot card-preview-empty"></span>'
      ).join('');
      const date = new Date(palette.createdAt);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      let countClass = '';
      if (ratio >= 1) countClass = 'card-count-full';
      else if (ratio >= 0.8) countClass = 'card-count-warn';

      return `
        <div class="palette-card" data-id="${palette.id}">
          <div class="card-preview-grid">${swatches}${empties}</div>
          <div class="card-info">
            <div class="card-title-line">
              <span class="card-name">${this.escapeHtml(palette.name)}</span>
            </div>
            <span class="card-meta ${countClass}">${count}/${max} 色 · 建于 ${dateStr}</span>
          </div>
          <button class="card-delete-btn" data-id="${palette.id}" title="删除这个色卡">×</button>
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

  markPaletteOpened(id) {
    const palette = this.palettes.find((item) => item.id === id);
    if (!palette) return;
    palette.lastOpenedAt = new Date().toISOString();
    this.saveData();
  }

  bindEmptyStateActions(root) {
    root.querySelectorAll('[data-empty-action]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const action = button.dataset.emptyAction;
        if (action === 'create') this.createPalette();
        if (action === 'pick') this.quickPick();
        if (action === 'add') this.addColorManual();
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

    this.updatePaletteCapacityState(palette);
    this.updateColorSortButton();
    this.updateSwatchLabelModeButton();
    const searchInput = document.getElementById('paletteSearch');
    if (searchInput) searchInput.value = this.paletteSearchQuery;
    this.updatePaletteSearchVisibility();
    this.updatePaletteFilterBar();
    const saveButton = document.getElementById('saveColor');
    saveButton.disabled = !this.currentColor;
    saveButton.title = this.currentColor ? '保存到当前色卡' : '先取一个颜色';
    if (this.currentColor) this.updateCurrentColorStatus(this.currentColor);
    this.renderRecentStrip();
    this.renderColorGrid();
  }

  updatePaletteCapacityState(palette = this.getCurrentPalette()) {
    if (!palette) return;
    const max = palette.maxColors || this.maxColorsPerPalette;
    const count = palette.colors.length;
    const isFull = count >= max;
    const isNearFull = !isFull && count / max >= 0.8;
    const addButton = document.getElementById('addColor');
    if (addButton) {
      addButton.classList.toggle('is-full', isFull);
      addButton.classList.toggle('is-warn', isNearFull);
      addButton.title = isFull ? `色卡已满 ${count}/${max}` : '手动添加颜色';
    }
  }

  renderRecentStrip() {
    const strip = document.getElementById('recentStrip');
    const list = document.getElementById('recentStripList');
    if (!strip || !list) return;

    const recentColors = this.colorHistory.slice(0, 5);
    strip.hidden = recentColors.length === 0;
    if (recentColors.length === 0) {
      list.innerHTML = '';
      return;
    }

    list.innerHTML = recentColors.map((color) => `
      <span class="recent-color-wrap">
        <button class="recent-color"
                type="button"
                data-id="${color.id}"
                style="background:${color.hex}"
                title="恢复 ${color.hex}"></button>
        <button class="recent-remove"
                type="button"
                data-id="${color.id}"
                title="删除这条最近颜色">×</button>
      </span>
    `).join('');

    list.querySelectorAll('.recent-color').forEach((button) => {
      button.addEventListener('click', () => this.selectRecentColor(Number(button.dataset.id)));
    });
    list.querySelectorAll('.recent-remove').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        this.deleteRecentColor(Number(button.dataset.id));
      });
    });
  }

  renderColorGrid() {
    const grid = document.getElementById('paletteGrid');
    document.getElementById('toggleBatchMode')?.classList.toggle('active', this.batchMode);
    grid.classList.toggle('batch-mode', this.batchMode);
    const colors = this.getCurrentColors();
    const filteredColors = this.getFilteredColors(colors);
    this.pruneBatchSelection(colors);
    this.updatePaletteSearchStatus(colors.length, filteredColors.length);
    const palette = this.getCurrentPalette();
    const max = palette?.maxColors || this.maxColorsPerPalette;
    const ratio = max ? colors.length / max : 0;
    const capacityClass = colors.length >= max ? 'full' : ratio >= 0.8 ? 'warn' : 'ok';
    const capacityLabel = colors.length >= max ? '已满' : ratio >= 0.8 ? '快满' : '可添加';

    if (colors.length === 0) {
      this.batchMode = false;
      this.batchSelectedIds.clear();
      grid.classList.remove('batch-mode');
      document.getElementById('toggleBatchMode')?.classList.remove('active');
      grid.innerHTML = `
        <div class="empty-state palette-empty-state">
          <span class="empty-icon">+</span>
          <span class="capacity-pill ${capacityClass}">${capacityLabel} · ${colors.length}/${max}</span>
          <p>先取一个颜色试试</p>
          <p class="empty-hint">快速取色或手动输入 HEX 都可以</p>
          <div class="empty-actions">
            <button class="empty-action" data-empty-action="pick">▣ 取色</button>
            <button class="empty-action" data-empty-action="add">+ 添加</button>
          </div>
        </div>
      `;
      this.bindEmptyStateActions(grid);
      return;
    }

    if (filteredColors.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">⌕</span>
          <p>没找到匹配颜色</p>
          <p class="empty-hint">换个 HEX / 备注试试</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filteredColors.map((color) => {
      const style = this.getSwatchHexStyle(color.r, color.g, color.b);
      const label = this.getSwatchLabel(color);
      const labelTitle = color.note ? `${color.note} · ${color.hex}` : color.hex;
      const searchClass = this.paletteSearchQuery ? ' search-match' : '';
      const selectedClass = this.currentColor?.hex === color.hex ? ' selected' : '';
      const batchClass = this.batchSelectedIds.has(color.id) ? ' batch-selected' : '';
      const plainClass = this.swatchLabelMode === 'plain' ? ' label-hidden' : '';
      const noteClass = color.note ? ' has-note' : '';
      return `
        <div class="color-swatch${searchClass}${selectedClass}${batchClass}${plainClass}${noteClass}"
             style="background-color: ${color.hex}"
             data-id="${color.id}"
             data-hex="${color.hex}">
          <button class="note-btn" data-id="${color.id}" title="编辑备注">✎</button>
          <span class="swatch-hex" title="${this.escapeHtml(labelTitle)}" style="background:${style.bg};color:${style.text}">${this.escapeHtml(label)}</span>
          <div class="delete-btn" data-id="${color.id}">×</div>
        </div>
      `;
    }).join('');

    if (this.batchMode) {
      grid.insertAdjacentHTML('afterbegin', this.getBatchToolbarHtml(filteredColors.length));
      grid.querySelector('[data-batch-action="copy"]')?.addEventListener('click', () => this.copyBatchSelectedColors());
      grid.querySelector('[data-batch-action="delete"]')?.addEventListener('click', () => this.deleteBatchSelectedColors());
      grid.querySelector('[data-batch-action="cancel"]')?.addEventListener('click', () => this.toggleBatchMode(false));
    }

    grid.querySelectorAll('.color-swatch').forEach((swatch) => {
      let clickTimer = null;
      swatch.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-btn') || event.target.classList.contains('note-btn')) return;
        if (this.batchMode) {
          this.toggleBatchSelection(Number(swatch.dataset.id));
          return;
        }
        if (clickTimer) return;
        clickTimer = setTimeout(() => {
          clickTimer = null;
          const color = filteredColors.find((item) => item.id === Number(swatch.dataset.id));
          if (color) {
            this.currentColor = color;
            this.updateColorPreview(color);
            this.copySwatchColor(color, swatch);
          }
        }, 180);
      });
      swatch.addEventListener('dblclick', (event) => {
        if (event.target.classList.contains('delete-btn') || event.target.classList.contains('note-btn')) return;
        if (clickTimer) {
          clearTimeout(clickTimer);
          clickTimer = null;
        }
        const color = filteredColors.find((item) => item.id === Number(swatch.dataset.id));
        if (color) this.editColorNote(color.id);
      });
    });

    grid.querySelectorAll('.delete-btn').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        this.deleteColor(Number(button.dataset.id));
      });
    });

    grid.querySelectorAll('.note-btn').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        this.editColorNote(Number(button.dataset.id));
      });
    });
  }

  getBatchToolbarHtml(total) {
    const count = this.batchSelectedIds.size;
    return `
      <div class="batch-toolbar">
        <span class="batch-count">${count}/${total} 已选</span>
        <button type="button" class="batch-action" data-batch-action="copy" ${count === 0 ? 'disabled' : ''}>复制</button>
        <button type="button" class="batch-action danger" data-batch-action="delete" ${count === 0 ? 'disabled' : ''}>删除</button>
        <button type="button" class="batch-action" data-batch-action="cancel">取消</button>
      </div>
    `;
  }

  toggleBatchMode(force) {
    this.batchMode = typeof force === 'boolean' ? force : !this.batchMode;
    if (!this.batchMode) this.batchSelectedIds.clear();
    document.getElementById('toggleBatchMode')?.classList.toggle('active', this.batchMode);
    this.renderColorGrid();
  }

  getSwatchLabel(color) {
    if (this.swatchLabelMode === 'hex') return color.hex;
    if (this.swatchLabelMode === 'plain') return '';
    return color.note || color.hex;
  }

  cycleSwatchLabelMode() {
    const modes = ['note', 'hex', 'plain'];
    const index = modes.indexOf(this.swatchLabelMode);
    this.swatchLabelMode = modes[(index + 1) % modes.length];
    this.updateSwatchLabelModeButton();
    this.renderColorGrid();
  }

  updateSwatchLabelModeButton() {
    const button = document.getElementById('toggleSwatchLabelMode');
    if (!button) return;
    const labels = {
      note: '显示：备注',
      hex: '显示：HEX',
      plain: '显示：纯色'
    };
    button.innerHTML = `<span>▣</span>${labels[this.swatchLabelMode]}`;
  }

  toggleBatchSelection(id) {
    if (this.batchSelectedIds.has(id)) this.batchSelectedIds.delete(id);
    else this.batchSelectedIds.add(id);
    this.renderColorGrid();
  }

  pruneBatchSelection(colors) {
    if (!this.batchSelectedIds.size) return;
    const ids = new Set(colors.map((color) => color.id));
    [...this.batchSelectedIds].forEach((id) => {
      if (!ids.has(id)) this.batchSelectedIds.delete(id);
    });
  }

  getBatchSelectedColors() {
    const palette = this.getCurrentPalette();
    if (!palette) return [];
    return palette.colors.filter((color) => this.batchSelectedIds.has(color.id));
  }

  async copyBatchSelectedColors() {
    const colors = this.getBatchSelectedColors();
    if (colors.length === 0) return;
    const text = colors.map((color) => color.hex).join('\n');
    await this.copyTextValue(text, `已复制 ${colors.length} 个颜色`);
  }

  async deleteBatchSelectedColors() {
    const palette = this.getCurrentPalette();
    const colors = this.getBatchSelectedColors();
    if (!palette || colors.length === 0) return;

    const result = await this.openPixelDialog({
      eyebrow: 'PIXEL BATCH',
      title: '批量删除',
      message: `确定删除选中的 ${colors.length} 个颜色吗？`,
      actions: [
        { id: 'confirm', label: '删除', tone: 'danger' },
        { id: 'cancel', label: '取消' }
      ]
    });
    if (result.action !== 'confirm') return;

    const selected = new Set(colors.map((color) => color.id));
    palette.colors = palette.colors.filter((color) => !selected.has(color.id));
    this.batchSelectedIds.clear();
    this.batchMode = false;
    await this.saveData();
    this.renderDetailView();
    this.showNotification(`已删除 ${colors.length} 个颜色`);
  }

  bindEvents() {
    this.ensureBatchButton();
    this.ensurePaletteFilters();
    document.getElementById('quickPickBtn').addEventListener('click', () => this.quickPick());
    document.getElementById('quickPickBtn2').addEventListener('click', () => this.quickPick());
    document.getElementById('saveColor').addEventListener('click', () => this.saveCurrentColor());
    document.getElementById('deleteCurrentColor').addEventListener('click', () => this.deleteCurrentColor());

    document.getElementById('copyCurrentFormat').addEventListener('click', () => this.copyCurrentDisplayFormat());
    document.getElementById('colorPreview').addEventListener('click', () => this.openCurrentColorDetails());
    document.querySelectorAll('.format-tab').forEach((button) => {
      button.addEventListener('click', () => this.setCurrentDisplayFormat(button.dataset.currentFormat));
    });

    const sortButton = document.getElementById('sortBtn');
    if (sortButton) sortButton.addEventListener('click', () => this.cycleSort());
    document.getElementById('newPaletteBtn').addEventListener('click', () => this.createPalette());
    document.getElementById('backBtn').addEventListener('click', () => this.showListView());
    document.getElementById('editNameBtn').addEventListener('click', () => this.renamePalette());
    document.getElementById('deletePaletteBtn').addEventListener('click', () => this.deleteCurrentPalette());
    document.getElementById('addColor').addEventListener('click', () => this.addColorManual());
    document.getElementById('closeAddColor').addEventListener('click', () => this.closeAddColorDialog());
    document.getElementById('cancelAddColor').addEventListener('click', () => this.closeAddColorDialog());
    document.getElementById('confirmAddColor').addEventListener('click', () => this.confirmManualColor());
    document.getElementById('manualColorInput').addEventListener('input', () => this.updateManualColorPreview());
    document.getElementById('manualColorInput').addEventListener('keydown', (event) => {
      if (event.key === 'Enter') this.confirmManualColor();
      if (event.key === 'Escape') this.closeAddColorDialog();
    });
    document.getElementById('addColorOverlay').addEventListener('click', (event) => {
      if (event.target.id === 'addColorOverlay') this.closeAddColorDialog();
    });
    document.getElementById('sortColors').addEventListener('click', () => this.cycleColorSort());
    document.getElementById('toggleSwatchLabelMode')?.addEventListener('click', () => this.cycleSwatchLabelMode());
    document.getElementById('copyPalette').addEventListener('click', () => this.copyCurrentPalette());
    document.getElementById('importPalette').addEventListener('click', () => this.importPaletteJSON());
    document.getElementById('clearPalette').addEventListener('click', () => this.clearPalette());
    document.getElementById('togglePaletteSearch').addEventListener('click', () => this.togglePaletteSearch());
    document.getElementById('togglePaletteMore').addEventListener('click', (event) => {
      event.stopPropagation();
      this.togglePaletteMoreMenu();
    });
    document.getElementById('paletteMoreMenu').addEventListener('click', (event) => {
      event.stopPropagation();
      if (event.target.closest('.more-menu-item')) this.closePaletteMoreMenu();
    });
    document.addEventListener('click', (event) => {
      const menu = document.getElementById('paletteMoreMenu');
      const trigger = document.getElementById('togglePaletteMore');
      if (!menu || menu.hidden) return;
      if (menu.contains(event.target) || trigger.contains(event.target)) return;
      this.closePaletteMoreMenu();
    });
    document.getElementById('paletteSearch').addEventListener('input', (event) => {
      this.paletteSearchQuery = event.target.value.trim();
      this.renderColorGrid();
    });
    document.getElementById('clearPaletteSearch').addEventListener('click', () => this.clearPaletteSearch());
    document.getElementById('openExportMenu').addEventListener('click', () => this.openExportMenu());
    document.getElementById('closeExport').addEventListener('click', () => this.closeExportMenu());
    document.getElementById('exportOverlay').addEventListener('click', (event) => {
      if (event.target.id === 'exportOverlay') this.closeExportMenu();
    });
    document.querySelectorAll('.export-option[data-format]').forEach((button) => {
      button.addEventListener('click', () => this.exportPalette(button.dataset.format));
    });
    document.getElementById('pixelDialogClose').addEventListener('click', () => this.closePixelDialog('cancel'));
    document.getElementById('pixelDialogOverlay').addEventListener('click', (event) => {
      if (event.target.id === 'pixelDialogOverlay') this.closePixelDialog('cancel');
    });
    document.getElementById('pixelDialogInput').addEventListener('keydown', (event) => {
      if (event.key === 'Enter') this.submitPixelDialog('confirm');
      if (event.key === 'Escape') this.closePixelDialog('cancel');
    });
    ['openOptions', 'openOptionsList', 'openOptions2'].forEach((id) => {
      const optionsButton = document.getElementById(id);
      if (optionsButton) {
        optionsButton.addEventListener('click', () => this.openOptionsPage());
      }
    });
    document.getElementById('closeSettings').addEventListener('click', () => this.closeSettingsDialog());
    document.getElementById('settingsOverlay').addEventListener('click', (event) => {
      if (event.target.id === 'settingsOverlay') this.closeSettingsDialog();
    });
    document.getElementById('savePopupSettings').addEventListener('click', () => this.savePopupSettings());
    document.getElementById('resetPopupSettings').addEventListener('click', () => this.resetPopupSettings());
    document.getElementById('exportAllData').addEventListener('click', () => this.exportAllData());
    document.getElementById('importAllData').addEventListener('click', () => this.importAllData());
    document.getElementById('clearAllData').addEventListener('click', () => this.clearAllData());
    document.getElementById('decreaseMaxColors').addEventListener('click', () => this.changeMaxColors(-1));
    document.getElementById('increaseMaxColors').addEventListener('click', () => this.changeMaxColors(1));
    document.getElementById('popupMaxColors').addEventListener('change', () => {
      this.setMaxColorsInput(document.getElementById('popupMaxColors').value);
    });
    document.getElementById('popupThemePreset').addEventListener('change', () => this.applyThemePresetToSettings());
    ['popupHeaderColor', 'popupButtonColor', 'popupBgColor', 'popupPanelColor'].forEach((id) => {
      document.getElementById(id).addEventListener('input', () => {
        const presetSelect = document.getElementById('popupThemePreset');
        if (presetSelect.value !== 'custom') this.themeBasePreset = presetSelect.value;
        presetSelect.value = 'custom';
        this.syncSettingsColorLabels();
      });
    });
    document.getElementById('closeHistory').addEventListener('click', () => this.closeHistoryDialog());
    document.getElementById('historyOverlay').addEventListener('click', (event) => {
      if (event.target.id === 'historyOverlay') this.closeHistoryDialog();
    });
    document.getElementById('clearHistory').addEventListener('click', () => this.clearColorHistory());
    document.getElementById('clearRecentColors').addEventListener('click', () => this.clearColorHistory());
    document.getElementById('historySearch').addEventListener('input', (event) => {
      this.historySearchQuery = event.target.value.trim();
      this.renderHistoryList();
    });
    document.getElementById('clearHistorySearch').addEventListener('click', () => this.clearHistorySearch());
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

  ensureBatchButton() {
    if (document.getElementById('toggleBatchMode')) return;
    const searchButton = document.getElementById('togglePaletteSearch');
    const button = document.createElement('button');
    button.className = 'mini-btn tool-toggle icon-mini';
    button.id = 'toggleBatchMode';
    button.type = 'button';
    button.title = '批量选择';
    button.textContent = '☑';
    button.addEventListener('click', () => this.toggleBatchMode());
    searchButton?.parentElement?.insertBefore(button, searchButton);
  }

  ensurePaletteFilters() {
    if (document.getElementById('paletteFilterBar')) return;
    const searchWrap = document.getElementById('paletteSearchWrap');
    if (!searchWrap) return;
    const filterBar = document.createElement('div');
    filterBar.className = 'palette-filter-bar';
    filterBar.id = 'paletteFilterBar';
    filterBar.innerHTML = `
      <button type="button" data-filter="all">全部</button>
      <button type="button" data-filter="light">浅色</button>
      <button type="button" data-filter="dark">深色</button>
      <button type="button" data-filter="noted">备注</button>
    `;
    filterBar.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', () => this.setPaletteFilter(button.dataset.filter));
    });
    searchWrap.appendChild(filterBar);
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

      const pickAction = this.getPickAction();
      if (pickAction === 'preview') {
        this.showNotification('已取色，可手动保存');
        return;
      }

      if (pickAction === 'copy') {
        await this.copyColorValue(color);
        return;
      }

      if (pickAction === 'copy-save') {
        await this.copyColorValue(color, `已复制 ${this.getDefaultFormatLabel()}`);
        await this.addColorToCurrentPalette(color, { successMessage: '已复制并保存' });
        return;
      }

      await this.addColorToCurrentPalette(color, { successMessage: '已保存' });
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('[Pixel Color Picker] Quick pick error:', error);
        this.showNotification('快速取色失败，请重试');
      }
    }
  }

  updateColorPreview(color) {
    const preview = document.getElementById('colorPreview');
    preview.style.backgroundColor = color.hex;
    preview.classList.remove('is-empty');
    document.getElementById('hexValue').value = color.hex;
    document.getElementById('rgbValue').value = `rgb(${color.r}, ${color.g}, ${color.b})`;
    document.getElementById('hslValue').value = color.hsl;
    this.updateCurrentFormatDisplay();
    this.updateCurrentColorStatus(color);
    this.renderColorGrid();
    this.saveLastPickedColor(color);
  }

  saveLastPickedColor(color) {
    if (!color?.hex) return Promise.resolve();
    return new Promise((resolve) => {
      chrome.storage.sync.set({
        lastPickedColor: {
          r: color.r,
          g: color.g,
          b: color.b,
          hex: color.hex,
          hsl: color.hsl || this.rgbToHsl(color.r, color.g, color.b),
          note: color.note || '',
          createdAt: color.createdAt || new Date().toISOString()
        }
      }, resolve);
    });
  }

  async saveCurrentColor() {
    if (!this.currentColor) return;
    const color = this.currentColor;
    const palette = this.getCurrentPalette();
    const result = await this.openPixelDialog({
      eyebrow: 'PIXEL SAVE',
      title: '保存颜色',
      message: `${color.hex} 保存到哪个色卡？`,
      previewColor: color.hex,
      detailHtml: this.getSaveTargetDetailHtml(color),
      actions: [
        { id: 'new-palette', label: '+ 新色卡', tone: 'primary' },
        { id: 'cancel', label: '取消' }
      ]
    });

    if (result.action === 'new-palette') {
      await this.createPalette();
      await this.addColorToCurrentPalette(color, { successMessage: '已保存到新色卡' });
      return;
    }

    if (result.action !== 'save-target') return;
    const target = this.palettes.find((item) => String(item.id) === String(result.value));
    if (!target) return;
    await this.addColorToPalette(color, target, { successMessage: `已保存到 ${target.name || '色卡'}` });
    if (palette && target.id !== palette.id) {
      this.currentPaletteId = target.id;
      await this.saveData();
      this.showDetailView(target.id);
    }
    return;
    await this.addColorToCurrentPalette(this.currentColor, { successMessage: '已保存' });
  }

  setCurrentDisplayFormat(format) {
    if (!['hex', 'rgb', 'hsl'].includes(format)) return;
    this.currentDisplayFormat = format;
    this.updateCurrentFormatDisplay();
  }

  updateCurrentFormatDisplay() {
    const label = document.getElementById('currentFormatLabel');
    const value = document.getElementById('currentFormatValue');
    if (!label || !value) return;

    const format = this.currentDisplayFormat || 'hex';
    label.textContent = format.toUpperCase();
    value.value = this.currentColor ? this.formatColorForCopy(this.currentColor, format) : '';
    document.querySelectorAll('.format-tab').forEach((button) => {
      button.classList.toggle('active', button.dataset.currentFormat === format);
    });
  }

  copyCurrentDisplayFormat() {
    if (!this.currentColor) return;
    navigator.clipboard.writeText(this.formatColorForCopy(this.currentColor, this.currentDisplayFormat)).then(() => {
      const button = document.getElementById('copyCurrentFormat');
      button.textContent = '✓';
      button.classList.add('copied');
      setTimeout(() => {
        button.textContent = '⧉';
        button.classList.remove('copied');
      }, 1200);
      this.showNotification(`已复制 ${(this.currentDisplayFormat || 'hex').toUpperCase()}`);
    });
  }

  copyCurrentDefaultFormat() {
    if (!this.currentColor) {
      this.quickPick();
      return;
    }
    this.copyColorValue(this.currentColor, `已复制 ${this.getDefaultFormatLabel()}`);
  }

  async openCurrentColorDetails() {
    if (!this.currentColor) {
      this.quickPick();
      return;
    }

    const color = this.currentColor;
    const palette = this.getCurrentPalette();
    const paletteColor = palette?.colors?.find((item) => item.hex === color.hex);
    const inPalette = Boolean(paletteColor);
    const brightness = this.getBrightness(color.r, color.g, color.b);
    const textAdvice = brightness > 150 ? '适合深色文字' : '适合浅色文字';
    let tone = '中间色';
    if (brightness >= 200) tone = '浅色';
    else if (brightness <= 90) tone = '深色';
    const rgb = this.formatColorForCopy(color, 'rgb');
    const hsl = this.formatColorForCopy(color, 'hsl');
    const allFormats = `HEX ${color.hex}\nRGB ${rgb}\nHSL ${hsl}`;
    const note = paletteColor?.note || color.note || '';
    const status = inPalette ? `已在 ${palette?.name || '当前色卡'}` : '尚未保存到当前色卡';
    const actions = [
      { id: 'copy-hex', label: 'HEX', tone: 'primary' },
      { id: 'copy-rgb', label: 'RGB' },
      { id: 'copy-hsl', label: 'HSL' },
      { id: 'copy-all', label: '全部' },
      inPalette
        ? { id: 'note', label: '备注' }
        : { id: 'save', label: '保存', tone: 'primary' },
      inPalette
        ? { id: 'delete', label: '删除', tone: 'danger' }
        : { id: 'close', label: '关闭' }
    ];

    const result = await this.openPixelDialog({
      eyebrow: 'PIXEL COLOR',
      title: color.hex,
      message: `${status} · ${textAdvice} · ${tone}`,
      previewColor: color.hex,
      detailHtml: `
        <div class="color-detail-panel">
          <div class="color-detail-row"><span>HEX</span><code>${this.escapeHtml(color.hex)}</code></div>
          <div class="color-detail-row"><span>RGB</span><code>${this.escapeHtml(rgb)}</code></div>
          <div class="color-detail-row"><span>HSL</span><code>${this.escapeHtml(hsl)}</code></div>
          <div class="color-detail-row"><span>亮度</span><code>${Math.round(brightness)} · ${tone}</code></div>
          <div class="color-text-preview">
            <span style="background:${color.hex};color:#1f1b22">深色字</span>
            <span style="background:${color.hex};color:#ffffff">浅色字</span>
          </div>
          <div class="color-detail-note ${note ? '' : 'empty'}">
            ${note ? this.escapeHtml(note) : '暂无备注'}
          </div>
        </div>
      `,
      actions
    });

    switch (result.action) {
      case 'copy-hex':
        await this.copyTextValue(color.hex, '已复制 HEX');
        break;
      case 'copy-rgb':
        await this.copyTextValue(rgb, '已复制 RGB');
        break;
      case 'copy-hsl':
        await this.copyTextValue(hsl, '已复制 HSL');
        break;
      case 'copy-all':
        await this.copyTextValue(allFormats, '已复制全部格式');
        break;
      case 'save':
        await this.saveCurrentColor();
        break;
      case 'delete':
        await this.deleteCurrentColor();
        break;
      case 'note':
        if (paletteColor) await this.editColorNote(paletteColor.id);
        break;
      default:
        break;
    }
  }

  addColorManual() {
    const palette = this.getCurrentPalette();
    const max = palette?.maxColors || this.maxColorsPerPalette;
    if (palette && palette.colors.length >= max) {
      this.showNotification(`色卡已满 ${max}/${max}`);
      return;
    }

    const overlay = document.getElementById('addColorOverlay');
    const input = document.getElementById('manualColorInput');
    overlay.hidden = false;
    input.value = '';
    this.updateManualColorPreview();
    setTimeout(() => input.focus(), 0);
  }

  closeAddColorDialog() {
    document.getElementById('addColorOverlay').hidden = true;
  }

  openPixelDialog({
    eyebrow = 'PIXEL NOTE',
    title = '提示',
    message = '',
    input = null,
    previewColor = '',
    detailHtml = '',
    inputTemplates = [],
    actions = [
      { id: 'confirm', label: '确定', tone: 'primary' },
      { id: 'cancel', label: '取消' }
    ],
    validate = null
  } = {}) {
    if (input && inputTemplates.length === 0 && eyebrow === 'PIXEL NOTE') {
      inputTemplates = ['主色', '背景', '文字', '边框', '按钮'];
    }
    if (input && eyebrow === 'PIXEL NOTE') {
      title = '颜色名称';
      message = '只编辑下面的名称 / 备注，色号本身不会改变。';
      input = {
        ...input,
        label: '名称 / 备注',
        placeholder: '例如：主按钮 / 背景色',
        hint: '留空并保存会清空名称 / 备注'
      };
      if (!detailHtml && previewColor) {
        detailHtml = `
          <div class="note-edit-info">
            <span>色号</span>
            <strong>${this.escapeHtml(previewColor)}</strong>
          </div>
        `;
      }
    }
    if (this.pixelDialogState?.resolve) {
      this.pixelDialogState.resolve({ action: 'cancel', value: '' });
    }

    const overlay = document.getElementById('pixelDialogOverlay');
    const body = document.querySelector('.pixel-dialog-body');
    const preview = document.getElementById('pixelDialogPreview');
    const field = document.getElementById('pixelDialogField');
    const dialogInput = document.getElementById('pixelDialogInput');
    const hint = document.getElementById('pixelDialogHint');
    const detail = document.getElementById('pixelDialogDetail');
    const actionWrap = document.getElementById('pixelDialogActions');

    document.getElementById('pixelDialogEyebrow').textContent = eyebrow;
    document.getElementById('pixelDialogTitle').textContent = title;
    document.getElementById('pixelDialogMessage').textContent = message;

    body.classList.toggle('with-preview', Boolean(previewColor));
    preview.hidden = !previewColor;
    if (previewColor) preview.style.backgroundColor = previewColor;

    field.hidden = !input;
    hint.textContent = input?.hint || '';
    hint.className = 'pixel-dialog-hint';
    dialogInput.value = input?.value || '';
    dialogInput.placeholder = input?.placeholder || '';
    document.getElementById('pixelDialogLabel').textContent = input?.label || '内容';
    field.querySelector('.note-template-bar')?.remove();
    if (input && inputTemplates.length > 0) {
      const templateBar = document.createElement('div');
      templateBar.className = 'note-template-bar';
      inputTemplates.forEach((template) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = template;
        button.addEventListener('click', () => {
          dialogInput.value = template;
          dialogInput.focus();
          dialogInput.select();
        });
        templateBar.appendChild(button);
      });
      hint.before(templateBar);
    }
    detail.hidden = !detailHtml;
    detail.innerHTML = detailHtml || '';
    detail.querySelectorAll('[data-dialog-action]').forEach((button) => {
      button.addEventListener('click', () => {
        if (button.disabled || button.getAttribute('aria-disabled') === 'true') return;
        this.closePixelDialog(button.dataset.dialogAction, button.dataset.dialogValue || '');
      });
    });

    actionWrap.innerHTML = '';
    actions.forEach((action) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `pixel-dialog-button ${action.tone || ''}`.trim();
      button.textContent = action.label;
      button.addEventListener('click', () => this.submitPixelDialog(action.id));
      actionWrap.appendChild(button);
    });

    overlay.hidden = false;

    return new Promise((resolve) => {
      this.pixelDialogState = { resolve, validate, hasInput: Boolean(input) };
      if (input) {
        setTimeout(() => {
          dialogInput.focus();
          dialogInput.select();
        }, 0);
      }
    });
  }

  submitPixelDialog(action) {
    const state = this.pixelDialogState;
    if (!state) return;

    const input = document.getElementById('pixelDialogInput');
    const hint = document.getElementById('pixelDialogHint');
    const value = state.hasInput ? input.value : '';

    if (action === 'confirm' && typeof state.validate === 'function') {
      const error = state.validate(value);
      if (error) {
        hint.textContent = error;
        hint.className = 'pixel-dialog-hint error';
        input.focus();
        return;
      }
    }

    this.closePixelDialog(action, value);
  }

  closePixelDialog(action = 'cancel', value = '') {
    const overlay = document.getElementById('pixelDialogOverlay');
    overlay.hidden = true;
    const detail = document.getElementById('pixelDialogDetail');
    if (detail) {
      detail.hidden = true;
      detail.innerHTML = '';
    }

    if (this.pixelDialogState?.resolve) {
      this.pixelDialogState.resolve({ action, value });
    }
    this.pixelDialogState = null;
  }

  openSettingsDialog() {
    const saveButton = document.getElementById('savePopupSettings');
    saveButton.textContent = '保存';
    saveButton.classList.remove('is-saved');
    const theme = this.getThemeSettings();
    this.themeBasePreset = theme.themeBasePreset;
    document.getElementById('popupThemePreset')?.closest('.settings-row')?.querySelector('strong')?.replaceChildren('主题预设');
    document.getElementById('popupThemePreset')?.closest('.settings-row')?.previousElementSibling?.replaceChildren('主题外观');
    this.organizeSettingsThemeRows();
    document.getElementById('popupAutoSave').checked = this.settings.autoSave !== false;
    this.setMaxColorsInput(this.maxColorsPerPalette || 20);
    document.getElementById('popupDefaultFormat').value = this.getDefaultFormat();
    document.getElementById('popupPickAction').value = this.getPickAction();
    document.getElementById('popupThemePreset').value = theme.themePreset;
    document.getElementById('popupHeaderColor').value = theme.headerColor;
    document.getElementById('popupButtonColor').value = theme.buttonColor;
    document.getElementById('popupBgColor').value = theme.bgColor;
    document.getElementById('popupPanelColor').value = theme.panelColor;
    this.syncSettingsColorLabels();
    this.updateSettingsPreview();
    document.getElementById('settingsOverlay').hidden = false;
  }

  closeSettingsDialog() {
    document.getElementById('settingsOverlay').hidden = true;
  }

  openOptionsPage() {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
      return;
    }
    window.open(chrome.runtime.getURL('options/options.html'));
  }

  organizeSettingsThemeRows() {
    const dataRow = document.querySelector('.settings-data-row');
    const bgRow = document.getElementById('popupBgColor')?.closest('.settings-row');
    if (!dataRow || !bgRow) return;
    const misplacedTitle = bgRow.previousElementSibling;
    if (misplacedTitle?.classList?.contains('settings-group-title')) {
      misplacedTitle.textContent = '数据';
      dataRow.before(misplacedTitle);
    }
  }

  setMaxColorsInput(value) {
    const input = document.getElementById('popupMaxColors');
    const nextValue = Math.max(1, Math.min(100, parseInt(value, 10) || 20));
    input.value = nextValue;
  }

  changeMaxColors(delta) {
    const input = document.getElementById('popupMaxColors');
    const currentValue = parseInt(input.value, 10) || 20;
    this.setMaxColorsInput(currentValue + delta);
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

  getThemeSettings() {
    const presets = this.getThemePresets();
    const themeBasePreset = this.settings?.themePreset === 'custom'
      ? (this.settings?.themeBasePreset || 'pink')
      : (presets[this.settings?.themePreset] ? this.settings.themePreset : 'pink');
    const preset = this.settings?.themePreset || themeBasePreset;
    const base = presets[themeBasePreset] || presets.pink;
    return {
      themePreset: this.settings?.themePreset || preset,
      themeBasePreset,
      headerColor: this.settings?.headerColor || base.headerColor,
      buttonColor: this.settings?.buttonColor || base.buttonColor,
      bgColor: this.settings?.bgColor || base.bgColor,
      panelColor: this.settings?.panelColor || base.panelColor
    };
  }

  syncSettingsColorLabels() {
    const headerColor = document.getElementById('popupHeaderColor').value.toUpperCase();
    const buttonColor = document.getElementById('popupButtonColor').value.toUpperCase();
    const bgColor = document.getElementById('popupBgColor').value.toUpperCase();
    const panelColor = document.getElementById('popupPanelColor').value.toUpperCase();
    document.getElementById('popupHeaderColorValue').textContent = headerColor;
    document.getElementById('popupButtonColorValue').textContent = buttonColor;
    document.getElementById('popupBgColorValue').textContent = bgColor;
    document.getElementById('popupPanelColorValue').textContent = panelColor;
    this.updateSettingsPreview();
  }

  updateSettingsPreview() {
    const previewHead = document.getElementById('settingsPreviewHead');
    const previewButton = document.getElementById('settingsPreviewButton');
    if (!previewHead || !previewButton) return;
    const preview = previewHead.closest('.settings-preview');
    previewHead.style.backgroundColor = document.getElementById('popupHeaderColor').value;
    previewButton.style.backgroundColor = document.getElementById('popupButtonColor').value;
    if (preview) {
      preview.style.backgroundColor = document.getElementById('popupPanelColor').value;
      preview.style.boxShadow = `inset 0 0 0 999px ${document.getElementById('popupBgColor').value}22`;
    }
  }

  applyThemePresetToSettings() {
    const preset = document.getElementById('popupThemePreset').value;
    const colors = this.getThemePresets()[preset];
    if (!colors) {
      this.syncSettingsColorLabels();
      return;
    }
    this.themeBasePreset = preset;
    document.getElementById('popupHeaderColor').value = colors.headerColor;
    document.getElementById('popupButtonColor').value = colors.buttonColor;
    document.getElementById('popupBgColor').value = colors.bgColor;
    document.getElementById('popupPanelColor').value = colors.panelColor;
    this.syncSettingsColorLabels();
  }

  async savePopupSettings() {
    const maxInput = document.getElementById('popupMaxColors');
    const maxColors = Math.max(1, Math.min(100, parseInt(maxInput.value, 10) || 20));
    this.setMaxColorsInput(maxColors);
    this.settings = {
      defaultFormat: document.getElementById('popupDefaultFormat').value,
      pickAction: document.getElementById('popupPickAction').value,
      autoSave: document.getElementById('popupAutoSave').checked,
      maxColorsPerPalette: maxColors,
      headerColor: document.getElementById('popupHeaderColor').value,
      buttonColor: document.getElementById('popupButtonColor').value,
      bgColor: document.getElementById('popupBgColor').value,
      panelColor: document.getElementById('popupPanelColor').value,
      themePreset: document.getElementById('popupThemePreset').value,
      themeBasePreset: this.themeBasePreset || 'pink'
    };
    this.maxColorsPerPalette = maxColors;

    await new Promise((resolve) => {
      chrome.storage.sync.set({ settings: this.settings }, resolve);
    });

    this.applyTheme();
    this.refreshCurrentView();
    const saveButton = document.getElementById('savePopupSettings');
    saveButton.textContent = '已保存';
    saveButton.classList.add('is-saved');
    await new Promise((resolve) => setTimeout(resolve, 520));
    this.closeSettingsDialog();
    saveButton.textContent = '保存';
    saveButton.classList.remove('is-saved');
    this.showNotification('设置已保存');
  }

  async resetPopupSettings() {
    this.settings = {
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
    this.themeBasePreset = 'pink';
    this.maxColorsPerPalette = 20;

    document.getElementById('popupAutoSave').checked = true;
    this.setMaxColorsInput(20);
    document.getElementById('popupDefaultFormat').value = 'hex';
    document.getElementById('popupPickAction').value = 'save';
    document.getElementById('popupThemePreset').value = 'pink';
    document.getElementById('popupHeaderColor').value = '#ff6b9d';
    document.getElementById('popupButtonColor').value = '#ff6b9d';
    document.getElementById('popupBgColor').value = '#fff9fc';
    document.getElementById('popupPanelColor').value = '#ffffff';
    this.syncSettingsColorLabels();

    await new Promise((resolve) => {
      chrome.storage.sync.set({ settings: this.settings }, resolve);
    });

    this.applyTheme();
    this.refreshCurrentView();
    this.closeSettingsDialog();
    this.showNotification('设置已重置');
  }

  async exportAllData() {
    const data = await new Promise((resolve) => {
      chrome.storage.sync.get(null, resolve);
    });

    const backup = {
      app: 'pixel-color-picker',
      version: 1,
      exportedAt: new Date().toISOString(),
      data
    };

    this.downloadFile(
      JSON.stringify(backup, null, 2),
      `pixel-color-picker-backup-${this.getDateStamp()}.json`,
      'application/json'
    );
    this.showNotification('备份已导出');
  }

  importAllData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      try {
        const text = await this.readFileAsText(file);
        const parsed = JSON.parse(text);
        const data = parsed?.app === 'pixel-color-picker' && parsed?.data ? parsed.data : parsed;
        const normalized = this.normalizeBackupData(data);

        const result = await this.openPixelDialog({
          eyebrow: 'PIXEL IMPORT',
          title: '导入备份',
          message: `将导入 ${normalized.palettes.length} 个色卡、${normalized.colorHistory.length} 条历史，并覆盖当前数据。`,
          actions: [
            { id: 'confirm', label: '导入', tone: 'primary' },
            { id: 'cancel', label: '取消' }
          ]
        });
        if (result.action !== 'confirm') return;

        await new Promise((resolve) => {
          chrome.storage.sync.clear(resolve);
        });
        await new Promise((resolve) => {
          chrome.storage.sync.set(normalized, resolve);
        });
        await this.loadData();
        this.closeSettingsDialog();
        this.showListView();
        this.showNotification('备份已导入');
      } catch (error) {
        console.error('[Pixel Color Picker] Backup import failed:', error);
        this.showNotification('导入失败：备份格式不正确');
      }
    };

    input.click();
  }

  async clearAllData() {
    const result = await this.openPixelDialog({
      eyebrow: 'PIXEL RESET',
      title: '清空全部数据',
      message: '确定要清空所有色卡、历史和设置吗？建议先导出备份。',
      actions: [
        { id: 'confirm', label: '清空', tone: 'danger' },
        { id: 'cancel', label: '取消' }
      ]
    });
    if (result.action !== 'confirm') return;

    await new Promise((resolve) => {
      chrome.storage.sync.clear(resolve);
    });

    this.settings = {};
    this.colorHistory = [];
    this.currentColor = null;
    this.maxColorsPerPalette = 20;
    await this.loadData();
    this.closeSettingsDialog();
    this.showListView();
    this.showNotification('已清空并重建默认色卡');
  }

  normalizeBackupData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid backup');
    }

    const settings = {
      defaultFormat: 'hex',
      pickAction: 'save',
      autoSave: true,
      maxColorsPerPalette: 20,
      headerColor: '#ff6b9d',
      buttonColor: '#ff6b9d',
      ...(data.settings || {})
    };
    settings.defaultFormat = ['hex', 'rgb', 'hsl'].includes(settings.defaultFormat) ? settings.defaultFormat : 'hex';
    settings.pickAction = ['save', 'preview', 'copy', 'copy-save'].includes(settings.pickAction) ? settings.pickAction : 'save';
    settings.maxColorsPerPalette = Math.max(1, Math.min(100, parseInt(settings.maxColorsPerPalette, 10) || 20));

    const palettes = Array.isArray(data.palettes) ? data.palettes.map((palette, paletteIndex) => {
      const colors = Array.isArray(palette.colors) ? palette.colors.map((color, colorIndex) => {
        const parsed = this.parseSRGBHex(color?.hex || '');
        if (!parsed) return null;
        return {
          ...parsed,
          id: Number(color.id) || Date.now() + paletteIndex * 1000 + colorIndex,
          note: typeof color.note === 'string' ? color.note : '',
          createdAt: color.createdAt || new Date().toISOString()
        };
      }).filter(Boolean) : [];

      return {
        id: Number(palette.id) || Date.now() + paletteIndex,
        name: typeof palette.name === 'string' && palette.name.trim() ? palette.name.trim() : `导入色卡 ${paletteIndex + 1}`,
        colors,
        maxColors: Math.max(colors.length, Math.min(100, parseInt(palette.maxColors, 10) || settings.maxColorsPerPalette)),
        createdAt: palette.createdAt || new Date().toISOString(),
        lastOpenedAt: palette.lastOpenedAt || ''
      };
    }).filter((palette) => palette.name) : [];

    if (palettes.length === 0) {
      palettes.push({
        id: Date.now(),
        name: '默认色卡',
        colors: [],
        maxColors: settings.maxColorsPerPalette,
        createdAt: new Date().toISOString()
      });
    }

    const colorHistory = Array.isArray(data.colorHistory) ? data.colorHistory.map((color, index) => {
      const parsed = this.parseSRGBHex(color?.hex || '');
      if (!parsed) return null;
      return {
        ...parsed,
        id: Number(color.id) || Date.now() + index,
        note: typeof color.note === 'string' ? color.note : '',
        createdAt: color.createdAt || new Date().toISOString()
      };
    }).filter(Boolean).slice(0, 30) : [];

    const currentPaletteId = palettes.some((palette) => palette.id === data.currentPaletteId)
      ? data.currentPaletteId
      : palettes[0].id;

    return {
      palettes,
      currentPaletteId,
      settings,
      colorHistory,
      lastPickedColor: this.normalizeStoredColor(data.lastPickedColor)
    };
  }

  getDateStamp() {
    const date = new Date();
    const pad = (number) => String(number).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  }

  refreshCurrentView() {
    const detailVisible = document.getElementById('detailView').style.display !== 'none';
    if (detailVisible) {
      this.renderDetailView();
    } else {
      this.renderListView();
    }
  }

  updateManualColorPreview() {
    const input = document.getElementById('manualColorInput');
    const preview = document.getElementById('addColorPreview');
    const hint = document.getElementById('manualColorHint');
    const raw = input.value.trim();

    hint.className = 'add-color-hint';
    preview.style.backgroundColor = '#ffffff';

    if (!raw) {
      hint.textContent = '请输入 6 位 HEX';
      return null;
    }

    const color = this.parseSRGBHex(raw.startsWith('#') ? raw : `#${raw}`);
    if (!color) {
      hint.textContent = '格式不正确，例如 #FF5733';
      hint.classList.add('error');
      return null;
    }

    preview.style.backgroundColor = color.hex;
    hint.textContent = `${color.hex} 可以添加`;
    hint.classList.add('ok');
    return color;
  }

  async confirmManualColor() {
    const color = this.updateManualColorPreview();
    if (!color) return;

    document.getElementById('manualColorInput').value = color.hex;
    this.currentColor = color;
    this.updateColorPreview(color);
    await this.addToHistory(color);
    const added = await this.addColorToCurrentPalette(color, { successMessage: '已添加颜色' });
    if (added) this.closeAddColorDialog();
  }

  getSaveTargetDetailHtml(color) {
    const currentId = this.currentPaletteId;
    const items = this.palettes.map((palette) => {
      const max = palette.maxColors || this.maxColorsPerPalette;
      const count = palette.colors.length;
      const isFull = count >= max;
      const exists = palette.colors.some((item) => item.hex === color.hex);
      const disabled = isFull;
      const state = exists ? '已存在' : isFull ? '已满' : `${count}/${max}`;
      const stateClass = exists ? 'exists' : isFull ? 'full' : 'available';
      const classes = [
        'save-target-item',
        `is-${stateClass}`,
        palette.id === currentId ? 'current' : '',
        disabled ? 'disabled' : ''
      ].filter(Boolean).join(' ');

      return `
        <button
          type="button"
          class="${classes}"
          data-dialog-action="save-target"
          data-dialog-value="${palette.id}"
          ${disabled ? 'disabled aria-disabled="true"' : ''}
        >
          <span class="save-target-name">${this.escapeHtml(palette.name || '未命名色卡')}</span>
          <span class="save-target-meta">${state}</span>
        </button>
      `;
    }).join('');

    return `<div class="save-target-list">${items}</div>`;
  }

  async addColorToPalette(color, palette, { successMessage = '已保存' } = {}) {
    if (!palette) return false;

    const max = palette.maxColors || this.maxColorsPerPalette;
    if (palette.colors.length >= max) {
      this.showNotification(`色卡已满 ${max}/${max}`);
      return false;
    }

    const duplicate = palette.colors.find((item) => item.hex === color.hex);
    if (duplicate) {
      return this.handleDuplicateColor(color, palette, duplicate, { successMessage });
      this.currentColor = duplicate;
      this.updateColorPreview(duplicate);
      this.focusExistingColor(duplicate.id);
      this.showNotification('颜色已存在，已定位');
      return false;
    }

    palette.colors.push({
      r: color.r,
      g: color.g,
      b: color.b,
      hex: color.hex,
      hsl: color.hsl || this.rgbToHsl(color.r, color.g, color.b),
      id: Date.now(),
      note: color.note || '',
      createdAt: new Date().toISOString()
    });

    await this.saveData();
    if (palette.id === this.currentPaletteId) this.renderDetailView();
    this.showNotification(successMessage);
    return true;
  }

  async handleDuplicateColor(color, palette, duplicate, { successMessage = '已保存' } = {}) {
    const isCurrentPalette = palette.id === this.currentPaletteId;
    const result = await this.openPixelDialog({
      eyebrow: 'PIXEL SAME',
      title: '颜色已存在',
      message: `${color.hex} 已在「${palette.name || '色卡'}」里。`,
      previewColor: color.hex,
      detailHtml: `
        <div class="duplicate-color-panel">
          <div class="duplicate-color-row"><span>色卡</span><strong>${this.escapeHtml(palette.name || '未命名色卡')}</strong></div>
          <div class="duplicate-color-row"><span>备注</span><strong>${this.escapeHtml(duplicate.note || '暂无备注')}</strong></div>
        </div>
      `,
      actions: [
        { id: 'view', label: '查看', tone: 'primary' },
        { id: 'note', label: '备注' },
        { id: 'copy', label: '复制' },
        { id: 'force', label: '另存' },
        { id: 'cancel', label: '取消' }
      ]
    });

    if (result.action === 'copy') {
      await this.copyTextValue(color.hex, '已复制 HEX');
      return false;
    }

    if (result.action === 'note') {
      if (!isCurrentPalette) this.showDetailView(palette.id);
      await this.editColorNote(duplicate.id);
      return false;
    }

    if (result.action === 'view') {
      this.currentColor = duplicate;
      this.updateColorPreview(duplicate);
      if (!isCurrentPalette) this.showDetailView(palette.id);
      this.focusExistingColor(duplicate.id);
      return false;
    }

    if (result.action === 'force') {
      return this.addDuplicateColorToPalette(color, palette, { successMessage: '已另存颜色' });
    }

    return false;
  }

  async addDuplicateColorToPalette(color, palette, { successMessage = '已另存颜色' } = {}) {
    const max = palette.maxColors || this.maxColorsPerPalette;
    if (palette.colors.length >= max) {
      this.showNotification(`色卡已满 ${max}/${max}`);
      return false;
    }

    palette.colors.push({
      r: color.r,
      g: color.g,
      b: color.b,
      hex: color.hex,
      hsl: color.hsl || this.rgbToHsl(color.r, color.g, color.b),
      id: Date.now(),
      note: color.note || '',
      createdAt: new Date().toISOString()
    });

    await this.saveData();
    if (palette.id === this.currentPaletteId) this.renderDetailView();
    this.showNotification(successMessage);
    return true;
  }

  async addColorToCurrentPalette(color, { successMessage = '已保存' } = {}) {
    const palette = this.getCurrentPalette();
    if (!palette) return false;

    const max = palette.maxColors || this.maxColorsPerPalette;
    if (palette.colors.length >= max) {
      this.showNotification(`色卡已满 ${max}/${max}`);
      return false;
    }

    const duplicate = palette.colors.find((item) => item.hex === color.hex);
    if (duplicate) {
      return this.handleDuplicateColor(color, palette, duplicate, { successMessage });
      this.currentColor = duplicate;
      this.updateColorPreview(duplicate);
      this.focusExistingColor(duplicate.id);
      this.showNotification('颜色已存在，已定位');
      return false;
    }

    palette.colors.push({
      r: color.r,
      g: color.g,
      b: color.b,
      hex: color.hex,
      hsl: color.hsl || this.rgbToHsl(color.r, color.g, color.b),
      id: Date.now(),
      note: color.note || '',
      createdAt: new Date().toISOString()
    });

    await this.saveData();
    this.renderDetailView();
    this.showNotification(successMessage);
    return true;
  }

  focusExistingColor(id, attempt = 0) {
    const openSearch = Boolean(this.paletteSearchQuery);
    const colorNode = document.querySelector(`.color-swatch[data-id="${id}"]`);
    if (!colorNode) {
      if (attempt > 2) return;
      if (openSearch && attempt === 0) this.clearPaletteSearch();
      setTimeout(() => this.focusExistingColor(id, attempt + 1), 0);
      return;
    }

    colorNode.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    colorNode.classList.remove('is-located');
    void colorNode.offsetWidth;
    colorNode.classList.add('is-located');
    setTimeout(() => colorNode.classList.remove('is-located'), 1200);
  }

  async addToHistory(color) {
    const entry = {
      id: Date.now(),
      r: color.r,
      g: color.g,
      b: color.b,
      hex: color.hex,
      hsl: color.hsl || this.rgbToHsl(color.r, color.g, color.b),
      note: color.note || '',
      createdAt: new Date().toISOString()
    };

    this.colorHistory = [
      entry,
      ...this.colorHistory.filter((item) => item.hex !== entry.hex)
    ].slice(0, 30);

    await this.saveHistory();
    this.renderRecentStrip();
    this.renderHistoryList();
  }

  openHistoryDialog() {
    document.getElementById('historyOverlay').hidden = false;
    const input = document.getElementById('historySearch');
    if (input) input.value = this.historySearchQuery;
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

    const filteredHistory = this.getFilteredHistory();
    const latest = this.colorHistory[0]?.hex || '--';
    count.textContent = `共 ${this.colorHistory.length} 条 · 最近 ${latest}`;
    this.updateHistorySearchStatus(this.colorHistory.length, filteredHistory.length);

    if (this.colorHistory.length === 0) {
      list.innerHTML = `
        <div class="empty-state compact">
          <span class="empty-icon">?</span>
          <p>还没有取色历史</p>
          <p class="empty-hint">取色后会自动收进这里</p>
        </div>
      `;
      return;
    }

    if (filteredHistory.length === 0) {
      list.innerHTML = `
        <div class="empty-state compact">
          <span class="empty-icon">⌕</span>
          <p>没有匹配历史</p>
          <p class="empty-hint">换个 HEX / RGB / HSL 试试</p>
        </div>
      `;
      return;
    }

    list.innerHTML = filteredHistory.map((color) => `
      <div class="history-item" data-id="${color.id}">
        <button class="history-swatch" data-action="restore" data-id="${color.id}" style="background:${color.hex}" title="恢复这个颜色"></button>
        <div class="history-main">
          <span class="history-hex">${color.hex}</span>
          <span class="history-time">${this.formatHistoryTime(color.createdAt)}</span>
        </div>
        <button class="history-add" data-action="add" data-id="${color.id}" title="加入当前色卡">+</button>
        <button class="history-copy" data-action="copy" data-id="${color.id}" title="复制默认格式">⧉</button>
      </div>
    `).join('');

    list.querySelectorAll('[data-action="restore"]').forEach((button) => {
      button.addEventListener('click', () => this.restoreHistoryColor(Number(button.dataset.id)));
    });
    list.querySelectorAll('[data-action="copy"]').forEach((button) => {
      button.addEventListener('click', () => this.copyHistoryColor(Number(button.dataset.id), button));
    });
    list.querySelectorAll('[data-action="add"]').forEach((button) => {
      button.addEventListener('click', () => this.addHistoryColorToPalette(Number(button.dataset.id)));
    });
  }

  getFilteredHistory() {
    const query = this.historySearchQuery.trim().toLowerCase();
    if (!query) return this.colorHistory;

    return this.colorHistory.filter((color) => {
      const hsl = color.hsl || this.rgbToHsl(color.r, color.g, color.b);
      const fields = [
        color.hex,
        color.hex.replace('#', ''),
        `rgb(${color.r}, ${color.g}, ${color.b})`,
        `${color.r}, ${color.g}, ${color.b}`,
        hsl
      ];
      return fields.some((field) => String(field).toLowerCase().includes(query));
    });
  }

  updateHistorySearchStatus(total, matched) {
    const status = document.getElementById('historySearchStatus');
    if (!status) return;
    if (total === 0) {
      status.textContent = '取色后会自动记录';
      return;
    }
    if (!this.historySearchQuery) {
      status.textContent = `共 ${total} 条历史`;
      return;
    }
    status.textContent = matched > 0 ? `找到 ${matched}/${total} 条历史` : '没有匹配历史';
  }

  clearHistorySearch() {
    this.historySearchQuery = '';
    const input = document.getElementById('historySearch');
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 0);
    }
    this.renderHistoryList();
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

  selectRecentColor(id) {
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
    this.showNotification('已恢复最近颜色');
  }

  copyHistoryColor(id, button) {
    const color = this.colorHistory.find((item) => item.id === id);
    if (!color) return;
    const text = this.formatColorForCopy(color);
    navigator.clipboard.writeText(text).then(() => {
      button.textContent = '✓';
      setTimeout(() => {
        button.textContent = '⧉';
      }, 1200);
      this.showNotification(`已复制 ${this.getDefaultFormatLabel()}`);
    });
  }

  async addHistoryColorToPalette(id) {
    const color = this.colorHistory.find((item) => item.id === id);
    if (!color) return;
    const added = await this.addColorToCurrentPalette(color, { successMessage: '已加入色卡' });
    if (added) this.renderHistoryList();
  }

  async clearColorHistory() {
    if (this.colorHistory.length === 0) return;
    const result = await this.openPixelDialog({
      eyebrow: 'PIXEL CLEAR',
      title: '清空历史',
      message: `确定要清空 ${this.colorHistory.length} 条取色历史吗？这个操作不会影响当前色卡。`,
      actions: [
        { id: 'confirm', label: '清空', tone: 'danger' },
        { id: 'cancel', label: '取消' }
      ]
    });
    if (result.action !== 'confirm') return;
    this.colorHistory = [];
    await this.saveHistory();
    this.renderRecentStrip();
    this.renderHistoryList();
    this.showNotification('已清空历史');
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
    this.showNotification('已删除颜色');
  }

  async deleteCurrentColor() {
    const palette = this.getCurrentPalette();
    if (!palette || !this.currentColor) return;
    const color = palette.colors.find((item) => item.hex === this.currentColor.hex);
    if (!color) {
      this.showNotification('当前色卡没有这个颜色');
      return;
    }

    const result = await this.openPixelDialog({
      eyebrow: 'PIXEL DELETE',
      title: '删除颜色',
      message: `确定要从当前色卡删除 ${color.hex} 吗？`,
      previewColor: color.hex,
      actions: [
        { id: 'confirm', label: '删除', tone: 'danger' },
        { id: 'cancel', label: '取消' }
      ]
    });
    if (result.action !== 'confirm') return;
    await this.deleteColor(color.id);
  }

  async deleteRecentColor(id) {
    const before = this.colorHistory.length;
    this.colorHistory = this.colorHistory.filter((item) => item.id !== id);
    if (this.colorHistory.length === before) return;
    await this.saveHistory();
    this.renderRecentStrip();
    this.renderHistoryList();
    this.showNotification('已删除最近颜色');
  }

  clearPaletteSearch() {
    this.paletteSearchQuery = '';
    const input = document.getElementById('paletteSearch');
    if (input) input.value = '';
    this.paletteSearchOpen = true;
    this.updatePaletteSearchVisibility();
    this.renderColorGrid();
    if (input) setTimeout(() => input.focus(), 0);
  }

  togglePaletteSearch() {
    this.paletteSearchOpen = !this.paletteSearchOpen;
    if (!this.paletteSearchOpen && this.paletteSearchQuery) {
      this.paletteSearchQuery = '';
      const input = document.getElementById('paletteSearch');
      if (input) input.value = '';
    }
    this.updatePaletteSearchVisibility();
    if (this.paletteSearchOpen) {
      const input = document.getElementById('paletteSearch');
      if (input) setTimeout(() => input.focus(), 0);
    }
    this.renderColorGrid();
  }

  updatePaletteSearchVisibility() {
    const wrap = document.getElementById('paletteSearchWrap');
    const button = document.getElementById('togglePaletteSearch');
    if (!wrap || !button) return;
    const visible = this.paletteSearchOpen || Boolean(this.paletteSearchQuery);
    wrap.classList.toggle('collapsed', !visible);
    button.classList.toggle('active', visible);
    this.updatePaletteFilterBar();
  }

  setPaletteFilter(filter) {
    this.paletteFilter = ['all', 'light', 'dark', 'noted'].includes(filter) ? filter : 'all';
    this.paletteSearchOpen = true;
    this.updatePaletteSearchVisibility();
    this.renderColorGrid();
  }

  updatePaletteFilterBar() {
    const filterBar = document.getElementById('paletteFilterBar');
    if (!filterBar) return;
    filterBar.querySelectorAll('button').forEach((button) => {
      button.classList.toggle('active', button.dataset.filter === (this.paletteFilter || 'all'));
    });
  }

  updatePaletteSearchStatus(total, matched) {
    const status = document.getElementById('paletteSearchStatus');
    if (!status) return;
    const query = this.paletteSearchQuery.trim();
    const hasFilter = (this.paletteFilter || 'all') !== 'all';
    const filterLabels = {
      all: '全部',
      light: '浅色',
      dark: '深色',
      noted: '备注'
    };
    if (hasFilter && !query) {
      status.textContent = `${filterLabels[this.paletteFilter]} · ${matched}/${total}`;
      return;
    }
    if (!this.paletteSearchOpen && !query) {
      status.textContent = '';
      return;
    }
    if (!query) {
      status.textContent = total > 0 ? `共 ${total} 个颜色` : '当前色卡还没有颜色';
      return;
    }
    status.textContent = matched > 0 ? `找到 ${matched}/${total} 个颜色` : '没有匹配颜色';
  }

  togglePaletteMoreMenu() {
    const menu = document.getElementById('paletteMoreMenu');
    const button = document.getElementById('togglePaletteMore');
    if (!menu) return;
    menu.hidden = !menu.hidden;
    if (button) button.classList.toggle('active', !menu.hidden);
  }

  closePaletteMoreMenu() {
    const menu = document.getElementById('paletteMoreMenu');
    const button = document.getElementById('togglePaletteMore');
    if (menu) menu.hidden = true;
    if (button) button.classList.remove('active');
  }

  getFilteredColors(colors) {
    const query = this.paletteSearchQuery.trim().toLowerCase();
    const filter = this.paletteFilter || 'all';

    return colors.filter((color) => {
      if (filter === 'light' && this.getBrightness(color.r, color.g, color.b) < 180) return false;
      if (filter === 'dark' && this.getBrightness(color.r, color.g, color.b) > 120) return false;
      if (filter === 'noted' && !color.note) return false;
      if (!query) return true;
      const fields = [
        color.hex,
        color.hex.replace('#', ''),
        color.note || '',
        `rgb(${color.r}, ${color.g}, ${color.b})`,
        `${color.r}, ${color.g}, ${color.b}`,
        color.hsl || ''
      ];
      return fields.some((field) => String(field).toLowerCase().includes(query));
    });
  }

  updateCurrentColorStatus(color) {
    const status = document.getElementById('colorStatus');
    if (!status) return;

    const palette = this.getCurrentPalette();
    const inPalette = Boolean(palette?.colors?.some((item) => item.hex === color.hex));
    const paletteColor = palette?.colors?.find((item) => item.hex === color.hex);
    const note = color.note || paletteColor?.note || '';
    const brightness = this.getBrightness(color.r, color.g, color.b);
    const textColor = brightness > 150 ? '适合深色文字' : '适合浅色文字';
    let tone = '中间色';
    if (brightness >= 200) tone = '浅色';
    else if (brightness <= 90) tone = '深色';
    const saveButton = document.getElementById('saveColor');
    const deleteButton = document.getElementById('deleteCurrentColor');
    if (saveButton) {
      const max = palette?.maxColors || this.maxColorsPerPalette;
      const isFull = Boolean(palette && palette.colors.length >= max);
      saveButton.disabled = inPalette || isFull;
      saveButton.title = inPalette
        ? '当前色卡已有这个颜色'
        : isFull
          ? `色卡已满 ${max}/${max}`
          : '保存到色卡';
    }
    if (saveButton) {
      const canSaveAnywhere = this.palettes.some((item) => {
        const targetMax = item.maxColors || this.maxColorsPerPalette;
        return item.colors.length < targetMax;
      });
      saveButton.disabled = !canSaveAnywhere;
      saveButton.title = canSaveAnywhere ? '选择色卡保存' : '没有可保存的色卡';
    }
    if (deleteButton) {
      deleteButton.disabled = !inPalette;
      deleteButton.title = inPalette ? '从当前色卡删除这个颜色' : '当前色卡没有这个颜色';
    }
    const max = palette?.maxColors || this.maxColorsPerPalette;
    const isFull = Boolean(palette && palette.colors.length >= max);
    const source = inPalette
      ? `已在 ${palette?.name || '当前色卡'}`
      : isFull
        ? `色卡已满 ${max}/${max}`
        : '可保存到当前色卡';
    status.textContent = [source, note, textColor, tone].filter(Boolean).join(' · ');
    status.classList.toggle('saved', inPalette);
    status.classList.toggle('warning', !inPalette && isFull);
  }

  async editColorNote(id) {
    const palette = this.getCurrentPalette();
    if (!palette) return;
    const color = palette.colors.find((item) => item.id === id);
    if (!color) return;

    const result = await this.openPixelDialog({
      eyebrow: 'PIXEL NOTE',
      title: '颜色备注',
      message: `${color.hex} 的小标签`,
      previewColor: color.hex,
      input: {
        label: '备注',
        value: color.note || '',
        placeholder: '例如：主按钮 / 背景色',
        hint: '留空并保存会清空备注'
      },
      actions: [
        { id: 'confirm', label: '保存', tone: 'primary' },
        { id: 'clear', label: '清空' },
        { id: 'cancel', label: '取消' }
      ]
    });
    if (result.action === 'cancel') return;

    color.note = result.action === 'clear' ? '' : result.value.trim();
    await this.saveData();
    this.renderDetailView();
    this.showNotification(color.note ? '备注已保存' : '备注已清空');
  }

  async cycleColorSort() {
    const modes = ['time', 'hue', 'brightness', 'hex'];
    const index = modes.indexOf(this.colorSortMode);
    this.colorSortMode = modes[(index + 1) % modes.length];
    await this.sortCurrentPaletteColors();
  }

  async sortCurrentPaletteColors() {
    const palette = this.getCurrentPalette();
    if (!palette || palette.colors.length <= 1) {
      this.updateColorSortButton();
      return;
    }

    const getTime = (color) => new Date(color.createdAt || 0).getTime();
    const getHue = (color) => this.getHue(color.r, color.g, color.b);

    switch (this.colorSortMode) {
      case 'hue':
        palette.colors.sort((a, b) => getHue(a) - getHue(b));
        break;
      case 'brightness':
        palette.colors.sort((a, b) => this.getBrightness(a.r, a.g, a.b) - this.getBrightness(b.r, b.g, b.b));
        break;
      case 'hex':
        palette.colors.sort((a, b) => a.hex.localeCompare(b.hex));
        break;
      case 'time':
      default:
        palette.colors.sort((a, b) => getTime(a) - getTime(b));
        break;
    }

    await this.saveData();
    this.renderDetailView();
    this.showNotification(`已按${this.getColorSortLabel()}排序`);
  }

  openExportMenu() {
    const palette = this.getCurrentPalette();
    if (!palette || palette.colors.length === 0) {
      this.showNotification('色卡为空');
      return;
    }
    const summary = document.getElementById('exportSummary');
    if (summary) summary.textContent = `${palette.name} · ${palette.colors.length} 色`;
    document.getElementById('exportOverlay').hidden = false;
  }

  closeExportMenu() {
    document.getElementById('exportOverlay').hidden = true;
  }

  async copyCurrentPalette() {
    const palette = this.getCurrentPalette();
    if (!palette || palette.colors.length === 0) {
      this.showNotification('色卡为空');
      return;
    }

    const formatLabel = this.getDefaultFormatLabel();
    const values = palette.colors.map((color) => this.formatColorForCopy(color));
    const content = values.join(', ');
    const previewValues = values.slice(0, 5);
    const overflowText = values.length > previewValues.length
      ? `<span class="copy-preview-more">另有 ${values.length - previewValues.length} 个颜色</span>`
      : '';
    const result = await this.openPixelDialog({
      eyebrow: 'PIXEL COPY',
      title: '复制色卡',
      message: `将按 ${formatLabel} 格式复制「${palette.name}」里的 ${palette.colors.length} 个颜色。`,
      detailHtml: `
        <div class="copy-preview">
          <div class="copy-preview-head">
            <span>${formatLabel}</span>
            <span>${palette.colors.length} 色</span>
          </div>
          <code>${this.escapeHtml(previewValues.join(', '))}</code>
          ${overflowText}
        </div>
      `,
      actions: [
        { id: 'confirm', label: '复制', tone: 'primary' },
        { id: 'cancel', label: '取消' }
      ]
    });
    if (result.action !== 'confirm') return;

    navigator.clipboard.writeText(content).then(() => {
      this.showNotification(`已复制 ${palette.colors.length} 个颜色`);
    }).catch((error) => {
      console.error('[Pixel Color Picker] Copy palette failed:', error);
      this.showNotification('复制失败，请重试');
    });
  }

  exportPalette(format) {
    this.closeExportMenu();
    switch (format) {
      case 'scss':
        this.exportSCSS();
        break;
      case 'json':
        this.exportJSON();
        break;
      case 'tailwind':
        this.exportTailwind();
        break;
      case 'png':
        this.exportPNG();
        break;
      case 'css':
      default:
        this.exportCSS();
        break;
    }
  }

  updateColorSortButton() {
    const button = document.getElementById('sortColors');
    if (button) {
      button.innerHTML = `<span>↕</span>${this.getColorSortLabel()}`;
      button.classList.add('is-active');
    }
  }

  getColorSortLabel() {
    return {
      time: '时间',
      hue: '色相',
      brightness: '明度',
      hex: 'HEX'
    }[this.colorSortMode] || '时间';
  }

  async clearPalette() {
    const palette = this.getCurrentPalette();
    if (!palette || palette.colors.length === 0) return;
    const result = await this.openPixelDialog({
      eyebrow: 'PIXEL CLEAR',
      title: '清空色卡',
      message: `确定要清空「${palette.name}」里的 ${palette.colors.length} 个颜色吗？`,
      actions: [
        { id: 'confirm', label: '清空', tone: 'danger' },
        { id: 'cancel', label: '取消' }
      ]
    });
    if (result.action !== 'confirm') return;
    palette.colors = [];
    await this.saveData();
    this.renderDetailView();
    this.showNotification('已清空色卡');
  }

  async createPalette() {
    const result = await this.openPixelDialog({
      eyebrow: 'PIXEL CARD',
      title: '新建色卡',
      message: '给新的色卡起个名字。',
      input: {
        label: '名称',
        value: '未命名色卡',
        placeholder: '未命名色卡',
        hint: '最多 16 个字会更小巧'
      },
      actions: [
        { id: 'confirm', label: '创建', tone: 'primary' },
        { id: 'cancel', label: '取消' }
      ]
    });
    if (result.action !== 'confirm') return;

    const palette = {
      id: Date.now(),
      name: result.value.trim() || '未命名色卡',
      colors: [],
      maxColors: this.maxColorsPerPalette,
      createdAt: new Date().toISOString()
    };
    this.palettes.push(palette);
    this.currentPaletteId = palette.id;
    await this.saveData();
    this.showDetailView(palette.id);
    this.showNotification('已新建色卡');
  }

  async deletePalette(id) {
    if (this.palettes.length <= 1) {
      this.showNotification('至少保留一个色卡组');
      return;
    }
    const palette = this.palettes.find((item) => item.id === id);
    const result = await this.openPixelDialog({
      eyebrow: 'PIXEL DELETE',
      title: '删除色卡',
      message: `确定要删除「${palette?.name || '这个色卡'}」吗？里面的颜色也会一起删除。`,
      actions: [
        { id: 'confirm', label: '删除', tone: 'danger' },
        { id: 'cancel', label: '取消' }
      ]
    });
    if (result.action !== 'confirm') return;

    this.palettes = this.palettes.filter((palette) => palette.id !== id);
    if (this.currentPaletteId === id) {
      this.currentPaletteId = this.palettes[0].id;
    }

    await this.saveData();
    this.showListView();
    this.showNotification('已删除色卡');
  }

  async deleteCurrentPalette() {
    await this.deletePalette(this.currentPaletteId);
  }

  async renamePalette() {
    const palette = this.getCurrentPalette();
    if (!palette) return;
    const result = await this.openPixelDialog({
      eyebrow: 'PIXEL RENAME',
      title: '重命名色卡',
      message: '换一个更好认的名字。',
      input: {
        label: '名称',
        value: palette.name,
        placeholder: '色卡名称',
        hint: '名称不能为空'
      },
      actions: [
        { id: 'confirm', label: '保存', tone: 'primary' },
        { id: 'cancel', label: '取消' }
      ],
      validate: (value) => value.trim() ? '' : '请输入色卡名称'
    });
    if (result.action !== 'confirm') return;
    palette.name = result.value.trim();
    await this.saveData();
    this.renderDetailView();
    this.showNotification('已重命名');
  }

  cycleSort() {
    const modes = ['recent', 'latest', 'oldest', 'az', 'za'];
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

    let css = `/* ${this.escapeCssComment(palette.name)} */\n:root {\n`;
    palette.colors.forEach((color, index) => {
      const note = (color.note || '').trim();
      if (note) css += `  /* ${this.escapeCssComment(note)} */\n`;
      const variableName = this.getCssVariableName(note, index);
      css += `  --${variableName}: ${color.hex};\n`;
      css += `  --${variableName}-rgb: ${color.r}, ${color.g}, ${color.b};\n`;
    });
    css += '}\n';

    this.downloadFile(css, 'palette.css', 'text/css');
    this.showNotification('CSS 已导出');
  }

  exportSCSS() {
    const palette = this.getCurrentPalette();
    if (!palette || palette.colors.length === 0) {
      this.showNotification('色卡为空');
      return;
    }

    let scss = `// ${this.escapeLineComment(palette.name)}\n`;
    palette.colors.forEach((color, index) => {
      const note = (color.note || '').trim();
      if (note) scss += `// ${this.escapeLineComment(note)}\n`;
      const variableName = this.getCssVariableName(note, index);
      scss += `$${variableName}: ${color.hex};\n`;
      scss += `$${variableName}-rgb: ${color.r}, ${color.g}, ${color.b};\n`;
    });

    this.downloadFile(scss, 'palette.scss', 'text/x-scss');
    this.showNotification('SCSS 已导出');
  }

  exportJSON() {
    const palette = this.getCurrentPalette();
    if (!palette || palette.colors.length === 0) {
      this.showNotification('色卡为空');
      return;
    }

    const data = {
      name: palette.name,
      exportedAt: new Date().toISOString(),
      colors: palette.colors.map((color) => ({
        hex: color.hex,
        rgb: { r: color.r, g: color.g, b: color.b },
        hsl: color.hsl,
        note: color.note || '',
        createdAt: color.createdAt || ''
      }))
    };

    this.downloadFile(JSON.stringify(data, null, 2), 'palette.json', 'application/json');
    this.showNotification('JSON 已导出');
  }

  exportTailwind() {
    const palette = this.getCurrentPalette();
    if (!palette || palette.colors.length === 0) {
      this.showNotification('色卡为空');
      return;
    }

    let code = `// ${this.escapeLineComment(palette.name)}\ncolors: {\n`;
    palette.colors.forEach((color, index) => {
      const note = (color.note || '').trim();
      const key = this.getCssVariableName(note, index);
      if (note && key === `color-${index + 1}`) code += `  // ${this.escapeLineComment(note)}\n`;
      code += `  '${key}': '${color.hex}',\n`;
    });
    code += '}\n';

    this.downloadFile(code, 'tailwind-colors.js', 'text/javascript');
    this.showNotification('Tailwind 已导出');
  }

  importPaletteJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      try {
        const text = await this.readFileAsText(file);
        const data = JSON.parse(text);
        const imported = this.normalizeImportedPalette(data, file.name);

        if (imported.colors.length === 0) {
          this.showNotification('没有可导入的颜色');
          return;
        }

        const result = await this.openPixelDialog({
          eyebrow: 'PIXEL IMPORT',
          title: '导入色卡',
          message: `从 ${file.name} 读取到「${imported.name}」。`,
          detailHtml: this.getImportPreviewHtml(imported),
          actions: [
            { id: 'confirm', label: '导入', tone: 'primary' },
            { id: 'cancel', label: '取消' }
          ]
        });
        if (result.action !== 'confirm') return;

        const max = Math.max(imported.colors.length, this.maxColorsPerPalette);
        const palette = {
          id: Date.now(),
          name: imported.name,
          colors: imported.colors.slice(0, max),
          maxColors: max,
          createdAt: new Date().toISOString()
        };

        this.palettes.push(palette);
        this.currentPaletteId = palette.id;
        await this.saveData();
        this.showDetailView(palette.id);
        this.showNotification(`已导入并打开 ${palette.name}`);
      } catch (error) {
        console.error('[Pixel Color Picker] Import failed:', error);
        this.showNotification('导入失败：JSON 格式错误');
      }
    };

    input.click();
  }

  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  normalizeImportedPalette(data, filename) {
    const rawColors = Array.isArray(data?.colors)
      ? data.colors
      : Array.isArray(data)
        ? data
        : [];

    const colors = [];
    const seen = new Set();
    let invalidCount = 0;
    let duplicateCount = 0;

    rawColors.forEach((item) => {
      const rawHex = typeof item === 'string' ? item : item?.hex;
      if (!rawHex) {
        invalidCount += 1;
        return;
      }

      const color = this.parseSRGBHex(rawHex.startsWith('#') ? rawHex : `#${rawHex}`);
      if (!color) {
        invalidCount += 1;
        return;
      }
      if (seen.has(color.hex)) {
        duplicateCount += 1;
        return;
      }

      seen.add(color.hex);
      colors.push({
        ...color,
        id: Date.now() + colors.length,
        note: typeof item === 'object' && item?.note ? String(item.note).trim() : '',
        createdAt: typeof item === 'object' && item?.createdAt ? item.createdAt : new Date().toISOString()
      });
    });

    return {
      name: this.getImportedPaletteName(data, filename),
      colors,
      rawCount: rawColors.length,
      invalidCount,
      duplicateCount
    };
  }

  getImportPreviewHtml(imported) {
    const swatches = imported.colors.slice(0, 5).map((color) => `
      <span class="import-preview-swatch" style="background:${color.hex}" title="${color.hex}"></span>
    `).join('');
    const moreText = imported.colors.length > 5
      ? `<span class="import-preview-more">另有 ${imported.colors.length - 5} 色</span>`
      : '';

    return `
      <div class="import-preview">
        <div class="import-preview-row"><span>可导入</span><strong>${imported.colors.length} 色</strong></div>
        <div class="import-preview-row"><span>原始</span><strong>${imported.rawCount} 项</strong></div>
        <div class="import-preview-row"><span>忽略</span><strong>${imported.duplicateCount} 重复 · ${imported.invalidCount} 无效</strong></div>
        <div class="import-preview-swatches">${swatches}${moreText}</div>
      </div>
    `;
  }

  getImportedPaletteName(data, filename) {
    const rawName = typeof data?.name === 'string' ? data.name.trim() : '';
    if (rawName) return `${rawName} 导入`;
    const fileBase = String(filename || '').replace(/\.json$/i, '').trim();
    return fileBase ? `${fileBase} 导入` : '导入色卡';
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
        this.showNotification('PNG 已导出');
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

  normalizeStoredColor(color) {
    if (!color?.hex) return null;
    const parsed = this.parseSRGBHex(color.hex);
    if (!parsed) return null;
    return {
      ...parsed,
      note: typeof color.note === 'string' ? color.note : '',
      createdAt: color.createdAt || new Date().toISOString()
    };
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

  copySwatchColor(color, swatch) {
    if (!color?.hex || !swatch) return;

    navigator.clipboard.writeText(this.formatColorForCopy(color)).then(() => {
      swatch.classList.add('copied');
      setTimeout(() => {
        swatch.classList.remove('copied');
      }, 650);
      this.showNotification(`已复制 ${this.getDefaultFormatLabel()}`);
    });
  }

  copyColorValue(color, message = null) {
    if (!color?.hex) return Promise.resolve();
    return navigator.clipboard.writeText(this.formatColorForCopy(color)).then(() => {
      this.showNotification(message || `已取色并复制 ${this.getDefaultFormatLabel()}`);
    });
  }

  copyTextValue(text, message = '已复制') {
    if (!text) return Promise.resolve();
    return navigator.clipboard.writeText(text).then(() => {
      this.showNotification(message);
    });
  }

  formatColorForCopy(color, format = this.getDefaultFormat()) {
    if (format === 'rgb') return `rgb(${color.r}, ${color.g}, ${color.b})`;
    if (format === 'hsl') return color.hsl || this.rgbToHsl(color.r, color.g, color.b);
    return color.hex;
  }

  getDefaultFormat() {
    const format = this.settings?.defaultFormat || 'hex';
    return ['hex', 'rgb', 'hsl'].includes(format) ? format : 'hex';
  }

  getDefaultFormatLabel() {
    return this.getDefaultFormat().toUpperCase();
  }

  getPickAction() {
    const action = this.settings?.pickAction;
    if (['save', 'preview', 'copy', 'copy-save'].includes(action)) return action;
    return this.settings?.autoSave === false ? 'preview' : 'save';
  }

  downloadFile(content, filename, type) {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({ url, filename, saveAs: true });
  }

  getContrastColor(r, g, b) {
    return (r * 299 + g * 587 + b * 114) / 1000 > 200 ? '#000000' : '#ffffff';
  }

  getHue(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    if (diff === 0) return 361;
    let hue;
    if (max === r) hue = ((g - b) / diff) % 6;
    else if (max === g) hue = (b - r) / diff + 2;
    else hue = (r - g) / diff + 4;
    return Math.round(hue * 60 + (hue < 0 ? 360 : 0));
  }

  getCssVariableName(note, index) {
    const fallback = `color-${index + 1}`;
    if (!note) return fallback;
    const safe = note
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return safe || fallback;
  }

  escapeCssComment(value) {
    return String(value || '').replace(/\*\//g, '* /');
  }

  escapeLineComment(value) {
    return String(value || '').replace(/\r?\n/g, ' ');
  }

  getBrightness(r, g, b) {
    return (r * 299 + g * 587 + b * 114) / 1000;
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
    const tone = this.getNotificationTone(message);
    notification.className = `notification ${tone}`;
    notification.innerHTML = `
      <span class="notification-icon">${tone === 'danger' ? '!' : '✓'}</span>
      <span class="notification-text">${this.escapeHtml(message)}</span>
    `;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  getNotificationTone(message) {
    if (/失败|错误|不支持|已满/.test(message)) return 'danger';
    if (/为空|已存在|至少|没有可导入/.test(message)) return 'warning';
    return 'success';
  }

  applyTheme() {
    const presets = this.getThemePresets();
    const presetKey = this.settings?.themePreset === 'custom'
      ? this.settings?.themeBasePreset
      : this.settings?.themePreset;
    const preset = presets[presetKey] || presets.pink;
    const headerColor = this.settings?.headerColor || preset.headerColor;
    const buttonColor = this.settings?.buttonColor || preset.buttonColor;
    const bgColor = this.settings?.bgColor || preset.bgColor;
    const panelColor = this.settings?.panelColor || preset.panelColor;
    const root = document.documentElement;
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
  new PixelColorPicker();
});
