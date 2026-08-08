import { audioEngine } from '../audio/FlapAudioEngine.js';

export class SettingsModalComponent {
  constructor(options) {
    this.onFrameThemeChange = options.onFrameThemeChange;
    this.onBackdropChange = options.onBackdropChange;
    this.onFlipSpeedChange = options.onFlipSpeedChange;
    this.onAlignChange = options.onAlignChange;
    this.onScreensaverTimeoutChange = options.onScreensaverTimeoutChange;
    this.onFontChange = options.onFontChange;
    this.onMatrixSizeChange = options.onMatrixSizeChange;
    this.onZoomChange = options.onZoomChange;
    this.onViewportFillChange = options.onViewportFillChange;

    this.bindDOM();
  }

  bindDOM() {
    this.modalEl = document.getElementById('modal-settings');
    const openBtn = document.getElementById('btn-settings');
    const closeBtns = this.modalEl.querySelectorAll('.modal-close');

    openBtn.addEventListener('click', () => {
      this.modalEl.classList.remove('hidden');
    });

    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.modalEl.classList.add('hidden');
      });
    });

    // Font Family Segmented Control
    const fontBtns = document.querySelectorAll('#font-segmented-control .segment-btn');
    fontBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        fontBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const fontName = btn.dataset.font;
        document.body.classList.remove('font-outfit', 'font-inter', 'font-grotesk', 'font-roboto');
        document.body.classList.add(`font-${fontName}`);
        if (this.onFontChange) this.onFontChange(fontName);
      });
    });

    // Backdrop Themes Grid
    const backdropCards = document.querySelectorAll('#backdrop-themes-grid .theme-card');
    backdropCards.forEach(card => {
      card.addEventListener('click', () => {
        backdropCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const backdrop = card.dataset.backdrop;
        if (this.onBackdropChange) this.onBackdropChange(backdrop);
      });
    });

    // Frame Theme Cards
    const themeCards = this.modalEl.querySelectorAll('.theme-card[data-theme]');
    const vestaboardFrame = document.getElementById('vestaboard-frame');

    themeCards.forEach(card => {
      card.addEventListener('click', () => {
        themeCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const theme = card.dataset.theme;

        vestaboardFrame.className = `vestaboard-frame frame-${theme}`;
        if (this.onFrameThemeChange) this.onFrameThemeChange(theme);
      });
    });

    // Screensaver Idle Select
    const idleSelect = document.getElementById('screensaver-idle-select');
    idleSelect.addEventListener('change', (e) => {
      const seconds = parseInt(e.target.value, 10);
      if (this.onScreensaverTimeoutChange) this.onScreensaverTimeoutChange(seconds);
    });

    // Matrix Size Select
    const matrixSelect = document.getElementById('matrix-size-select');
    if (matrixSelect) {
      matrixSelect.addEventListener('change', (e) => {
        const [rows, cols] = e.target.value.split('x').map(Number);
        if (this.onMatrixSizeChange) this.onMatrixSizeChange(rows, cols);
      });
    }

    // Zoom Slider
    const zoomSlider = document.getElementById('board-zoom-slider');
    if (zoomSlider) {
      zoomSlider.addEventListener('input', (e) => {
        const scale = parseFloat(e.target.value);
        if (this.onZoomChange) this.onZoomChange(scale);
      });
    }

    // Viewport Fill Checkbox
    const fillCheckbox = document.getElementById('setting-fill-viewport');
    if (fillCheckbox) {
      fillCheckbox.addEventListener('change', (e) => {
        if (this.onViewportFillChange) this.onViewportFillChange(e.target.checked);
      });
    }

    // Speed Segmented Control
    const speedBtns = document.querySelectorAll('#speed-segmented-control .segment-btn');
    speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const speed = btn.dataset.speed;
        if (this.onFlipSpeedChange) this.onFlipSpeedChange(speed);
      });
    });

    // Alignment Segmented Control
    const alignBtns = document.querySelectorAll('#align-segmented-control .segment-btn');
    alignBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        alignBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const align = btn.dataset.align;
        if (this.onAlignChange) this.onAlignChange(align);
      });
    });

    // Audio Controls
    const soundCheck = document.getElementById('setting-sound-enabled');
    const volumeSlider = document.getElementById('setting-sound-volume');

    soundCheck.addEventListener('change', (e) => {
      audioEngine.setEnabled(e.target.checked);
    });

    volumeSlider.addEventListener('input', (e) => {
      audioEngine.setVolume(parseFloat(e.target.value));
    });
  }
}
