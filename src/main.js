import { DEFAULT_QUOTES } from './data/quoteLibrary.js';
import { VestaboardEngine } from './core/VestaboardEngine.js';
import { BoardComponent } from './components/Board.js';
import { ControlsComponent } from './components/Controls.js';
import { QuoteManagerComponent } from './components/QuoteManager.js';
import { SettingsModalComponent } from './components/SettingsModal.js';
import { audioEngine } from './audio/FlapAudioEngine.js';
import { IdleDetector } from './screensaver/IdleDetector.js';
import { AmbientBackdrop } from './screensaver/AmbientBackdrop.js';
import { loadSettings, saveSettings, loadCustomQuotes, saveCustomQuotes } from './core/settings.js';

class VestaboardStudioApp {
  constructor() {
    this.customQuotes = loadCustomQuotes();
    this.allQuotes = [...DEFAULT_QUOTES, ...this.customQuotes];
    this.settings = loadSettings();

    this.currentIndex = 0;
    this.currentMode = 'sequential'; // 'sequential', 'random', 'daily', 'clock'
    this.intervalSeconds = 30;
    this.isPlaying = true;
    this.timerId = null;
    this.clockTickerId = null;

    this.init();
    this.initSSE();
    this.setupAudioUnlock();
  }

  setupAudioUnlock() {
    const unlock = () => {
      audioEngine.ensureContext();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  initSSE() {
    try {
      const sseUrl = `http://${window.location.hostname}:5000/api/stream`;
      this.eventSource = new EventSource(sseUrl);
      
      this.eventSource.onmessage = (event) => {
        let data;
        try {
          data = JSON.parse(event.data);
        } catch (e) {
          return; // malformed frame — ignore
        }
        if (data.type === 'webhook' && data.data && typeof data.data.text === 'string') {
          // Interrupt and show webhook message
          const webhookQuote = {
            text: `{red}{red} INCOMING ALERT {red}{red}\n\n${data.data.text}`,
            author: 'Local Webhook',
            category: 'alert'
          };
          this.displayQuote(webhookQuote);

          // Pause normal timer, restart it after 15 seconds. Keep the handle:
          // back-to-back webhooks must not stack restores or override a pause.
          this.stopTimer();
          if (this.webhookRestoreTimer) clearTimeout(this.webhookRestoreTimer);
          this.webhookRestoreTimer = setTimeout(() => {
            this.webhookRestoreTimer = null;
            if (this.isPlaying) this.startTimer();
          }, 15000);
        }
      };

      this.eventSource.onerror = () => {
        // EventSource auto-reconnects every few seconds; on a 24/7 kiosk with
        // no backend that would spam the console forever — log once
        if (!this.sseErrorLogged) {
          this.sseErrorLogged = true;
          console.log('SSE server not reachable — webhooks disabled (browser keeps retrying quietly).');
        }
      };
    } catch (e) {
      console.warn('Could not connect to backend SSE server. Webhooks disabled.');
    }
  }

  init() {
    // 1. Mount Board Engine
    const screenEl = document.getElementById('vestaboard-screen');
    this.board = new BoardComponent(screenEl);

    // 2. Mount Ambient Backdrop Manager
    this.backdrop = new AmbientBackdrop(document.body);

    // 3. Mount Screensaver Idle Detector
    this.idleDetector = new IdleDetector({
      idleTimeoutSeconds: this.settings.idleTimeout,
      onIdleStart: () => this.enterScreensaverMode(),
      onIdleEnd: () => this.exitScreensaverMode()
    });

    // 4. Mount Controls
    this.controls = new ControlsComponent({
      onModeChange: (mode) => this.handleModeChange(mode),
      onNextClick: () => this.flipToNextQuote(),
      onPrevClick: () => this.flipToPrevQuote(),
      onPlayPauseToggle: (isPlaying) => this.handlePlayPause(isPlaying),
      onShuffleClick: () => this.handleShuffle(),
      onIntervalChange: (sec) => this.handleIntervalChange(sec),
      onQuickMessageSubmit: (msg) => this.handleQuickMessage(msg),
      onAudioToggle: (enabled) => {
        audioEngine.setEnabled(enabled);
        this.settings.audioEnabled = enabled;
        saveSettings(this.settings);
      },
      onKioskToggle: (isKiosk) => {
        if (isKiosk) {
          this.enterScreensaverMode();
        } else {
          this.exitScreensaverMode();
        }
      }
    });

    // 5. Mount Quote Manager Modal
    this.quoteManager = new QuoteManagerComponent({
      curatedQuotes: DEFAULT_QUOTES,
      customQuotes: this.customQuotes,
      onSelectQuote: (quote) => this.displayQuote(quote),
      onSaveCustomQuote: (quote) => this.saveCustomQuote(quote),
      onDeleteCustomQuote: (id) => this.deleteCustomQuote(id),
      onExportImport: (imported) => this.handleImportQuotes(imported)
    });

    // 6. Mount Settings Modal
    const save = (patch) => {
      Object.assign(this.settings, patch);
      saveSettings(this.settings);
    };
    this.settingsModal = new SettingsModalComponent({
      onFrameThemeChange: (theme) => save({ frameTheme: theme }),
      onFontChange: (font) => save({ font }),
      onBackdropChange: (backdrop) => {
        this.backdrop.setTheme(backdrop);
        save({ backdrop });
      },
      onFlipSpeedChange: (speed) => {
        this.board.setSpeedMode(speed);
        save({ speed });
      },
      onScreensaverTimeoutChange: (sec) => {
        this.idleDetector.setIdleTimeout(sec);
        save({ idleTimeout: sec });
      },
      onAlignChange: (align) => {
        this.board.setAlignMode(align);
        save({ align });
        this.displayCurrentQuote();
      },
      onAudioSettingsChange: (patch) => save(patch),
      onMatrixSizeChange: (rows, cols) => {
        save({ rows, cols });
        this.applyMatrixSize(rows, cols);
        this.displayCurrentQuote();
      },
      onZoomChange: (scale) => {
        save({ scale });
        document.documentElement.style.setProperty('--board-scale', scale);
      },
      onViewportFillChange: (isFill) => {
        save({ fillViewport: isFill });
        document.querySelector('.board-viewport').classList.toggle('fill-viewport', isFill);
        // Fill-viewport owns the frame width, so the zoom slider has no
        // effect while it is on — disable it rather than let it lie
        const zoom = document.getElementById('board-zoom-slider');
        if (zoom) zoom.disabled = isFill;
      }
    });

    // Restore ALL persisted settings before the first render so the saved
    // state applies from the very first flip
    const s = this.settings;
    this.applyMatrixSize(s.rows, s.cols);
    document.documentElement.style.setProperty('--board-scale', s.scale);
    document.querySelector('.board-viewport').classList.toggle('fill-viewport', s.fillViewport);
    this.backdrop.setTheme(s.backdrop);
    this.board.setSpeedMode(s.speed);
    this.board.setAlignMode(s.align);
    audioEngine.setEnabled(s.audioEnabled);
    audioEngine.setVolume(s.audioVolume);
    const matrixSelect = document.getElementById('matrix-size-select');
    if (matrixSelect) matrixSelect.value = `${s.rows}x${s.cols}`;
    const zoomSlider = document.getElementById('board-zoom-slider');
    if (zoomSlider) {
      zoomSlider.value = s.scale;
      zoomSlider.disabled = s.fillViewport;
    }
    const fillCheckbox = document.getElementById('setting-fill-viewport');
    if (fillCheckbox) fillCheckbox.checked = s.fillViewport;
    this.settingsModal.syncUI(s);

    // Handle URL Hash Quote loading if present (e.g. #msg=Hello%20World)
    const hash = window.location.hash;
    if (hash.startsWith('#msg=')) {
      const customMsg = decodeURIComponent(hash.substring(5));
      this.handleQuickMessage(customMsg);
    } else {
      this.displayCurrentQuote();
    }

    // Sync Kiosk mode state if user presses ESC to exit native fullscreen
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && document.body.classList.contains('kiosk-mode')) {
        this.exitScreensaverMode();
      }
    });

    this.startTimer();
  }

  enterScreensaverMode() {
    // Sync the idle detector no matter how we got here (auto-timeout or
    // manual kiosk button) so the next mouse move exits the screensaver
    if (this.idleDetector) this.idleDetector.markIdle();
    document.body.classList.add('kiosk-mode');
    const exitBtn = document.getElementById('btn-exit-kiosk');
    if (exitBtn) exitBtn.classList.remove('hidden');

    // Request true browser fullscreen
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Error attempting to enable fullscreen:', err);
      });
    }
  }

  exitScreensaverMode() {
    if (this.idleDetector) this.idleDetector.markActive();
    document.body.classList.remove('kiosk-mode');
    const exitBtn = document.getElementById('btn-exit-kiosk');
    if (exitBtn) exitBtn.classList.add('hidden');

    // Exit true browser fullscreen
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(err => {
        console.warn('Error attempting to exit fullscreen:', err);
      });
    }
  }

  applyMatrixSize(rows, cols) {
    VestaboardEngine.setMatrixDimensions(rows, cols);
    this.board.setDimensions(rows, cols);
    if (this.quoteManager) this.quoteManager.handleMatrixResize(rows, cols);
  }

  saveCustomQuote(newQuote) {
    const existingIdx = this.customQuotes.findIndex(q => q.id === newQuote.id);
    if (existingIdx >= 0) {
      this.customQuotes[existingIdx] = newQuote;
    } else {
      this.customQuotes.push(newQuote);
    }

    this.allQuotes = [...DEFAULT_QUOTES, ...this.customQuotes];
    saveCustomQuotes(this.customQuotes);
    this.quoteManager.customQuotes = this.customQuotes;
    this.quoteManager.renderCustomQuotes();
  }

  deleteCustomQuote(quoteId) {
    this.customQuotes = this.customQuotes.filter(q => q.id !== quoteId);
    this.allQuotes = [...DEFAULT_QUOTES, ...this.customQuotes];
    saveCustomQuotes(this.customQuotes);
    this.quoteManager.customQuotes = this.customQuotes;
    this.quoteManager.renderCustomQuotes();
  }

  handleImportQuotes(imported) {
    this.customQuotes = [...this.customQuotes, ...imported];
    this.allQuotes = [...DEFAULT_QUOTES, ...this.customQuotes];
    saveCustomQuotes(this.customQuotes);
    this.quoteManager.customQuotes = this.customQuotes;
    this.quoteManager.renderCustomQuotes();
  }

  updateClockTicker() {
    if (this.clockTickerId) {
      clearInterval(this.clockTickerId);
      this.clockTickerId = null;
    }
    if (this.currentMode === 'clock') {
      this.clockTickerId = setInterval(() => {
        if (this.currentMode === 'clock') {
          const clockMsg = VestaboardEngine.getClockMessage();
          this.board.displayMessage(clockMsg);
          this.updateMetaUI('Live Flip Clock', 'Vestaboard Studio', 'Clock Mode');
        }
      }, 1000);
    }
  }

  displayCurrentQuote() {
    if (this.currentMode === 'clock') {
      const clockMsg = VestaboardEngine.getClockMessage();
      this.board.displayMessage(clockMsg);
      this.updateMetaUI('Live Flip Clock', 'Vestaboard Studio', 'Clock Mode');
      return;
    }

    if (this.currentMode === 'daily') {
      const dailyQuote = VestaboardEngine.getDailyQuote(this.allQuotes);
      if (dailyQuote) {
        this.displayQuote(dailyQuote);
      }
      return;
    }

    if (this.allQuotes.length > 0) {
      const quote = this.allQuotes[this.currentIndex];
      this.displayQuote(quote);
    }
  }

  displayQuote(quote) {
    this.board.displayMessage(quote.text);
    this.updateMetaUI(quote.text, quote.author || 'Unknown', quote.category || 'General');
  }

  updateMetaUI(text, author, category) {
    const categoryBadge = document.getElementById('quote-category-badge');
    const sourceLabel = document.getElementById('quote-source-label');

    if (categoryBadge) categoryBadge.textContent = category;
    if (sourceLabel) sourceLabel.textContent = `— ${author}`;
  }

  flipToNextQuote() {
    if (this.currentMode === 'clock') {
      this.displayCurrentQuote();
      return;
    }

    if (this.currentMode === 'random') {
      this.currentIndex = Math.floor(Math.random() * this.allQuotes.length);
    } else {
      this.currentIndex = (this.currentIndex + 1) % this.allQuotes.length;
    }

    this.displayCurrentQuote();
    if (this.isPlaying) this.startTimer();
  }

  flipToPrevQuote() {
    if (this.currentMode === 'clock') {
      this.displayCurrentQuote();
      return;
    }

    if (this.currentMode === 'random') {
      this.currentIndex = Math.floor(Math.random() * this.allQuotes.length);
    } else {
      this.currentIndex = (this.currentIndex - 1 + this.allQuotes.length) % this.allQuotes.length;
    }

    this.displayCurrentQuote();
    if (this.isPlaying) this.startTimer();
  }

  handleModeChange(mode) {
    this.currentMode = mode;
    this.updateClockTicker();
    this.displayCurrentQuote();
    if (this.isPlaying) this.startTimer();
  }

  handlePlayPause(isPlaying) {
    this.isPlaying = isPlaying;
    if (this.isPlaying) {
      this.startTimer();
    } else {
      this.stopTimer();
    }
  }

  handleShuffle() {
    this.currentIndex = Math.floor(Math.random() * this.allQuotes.length);
    this.displayCurrentQuote();
    if (this.isPlaying) this.startTimer();
  }

  handleIntervalChange(seconds) {
    this.intervalSeconds = seconds;
    if (this.isPlaying) {
      this.startTimer();
    }
  }

  handleQuickMessage(messageText) {
    const customQuote = {
      text: messageText,
      author: 'Live Input',
      category: 'custom'
    };
    this.displayQuote(customQuote);
    if (this.isPlaying) this.startTimer();
  }

  startTimer() {
    this.stopTimer();
    this.timerId = setInterval(() => {
      if (this.isPlaying) {
        this.flipToNextQuote();
      }
    }, this.intervalSeconds * 1000);
  }

  stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new VestaboardStudioApp();
});

