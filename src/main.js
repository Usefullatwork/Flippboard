import { DEFAULT_QUOTES } from './data/quoteLibrary.js';
import { VestaboardEngine } from './core/VestaboardEngine.js';
import { BoardComponent } from './components/Board.js';
import { ControlsComponent } from './components/Controls.js';
import { QuoteManagerComponent } from './components/QuoteManager.js';
import { SettingsModalComponent } from './components/SettingsModal.js';
import { audioEngine } from './audio/FlapAudioEngine.js';
import { IdleDetector } from './screensaver/IdleDetector.js';
import { AmbientBackdrop } from './screensaver/AmbientBackdrop.js';

class VestaboardStudioApp {
  constructor() {
    this.customQuotes = this.loadCustomQuotes();
    this.allQuotes = [...DEFAULT_QUOTES, ...this.customQuotes];

    this.currentIndex = 0;
    this.currentMode = 'sequential'; // 'sequential', 'random', 'daily', 'clock'
    this.intervalSeconds = 30;
    this.isPlaying = true;
    this.timerId = null;

    this.init();
    this.initSSE();
  }

  initSSE() {
    try {
      const sseUrl = `http://${window.location.hostname}:5000/api/stream`;
      this.eventSource = new EventSource(sseUrl);
      
      this.eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'webhook' && data.data && data.data.text) {
          // Interrupt and show webhook message
          const webhookQuote = {
            text: `{red}{red} INCOMING ALERT {red}{red}\n\n${data.data.text}`,
            author: 'Local Webhook',
            category: 'alert'
          };
          this.displayQuote(webhookQuote);
          
          // Pause normal timer, restart it after 15 seconds
          this.stopTimer();
          setTimeout(() => {
            if (this.isPlaying) this.startTimer();
          }, 15000);
        }
      };
      
      this.eventSource.onerror = () => {
        console.log('SSE disconnected, retrying...');
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
      idleTimeoutSeconds: 60,
      onIdleStart: () => this.enterScreensaverMode(),
      onIdleEnd: () => this.exitScreensaverMode()
    });

    // 4. Mount Controls
    this.controls = new ControlsComponent({
      onModeChange: (mode) => this.handleModeChange(mode),
      onNextClick: () => this.flipToNextQuote(),
      onPlayPauseToggle: (isPlaying) => this.handlePlayPause(isPlaying),
      onShuffleClick: () => this.handleShuffle(),
      onIntervalChange: (sec) => this.handleIntervalChange(sec),
      onQuickMessageSubmit: (msg) => this.handleQuickMessage(msg),
      onAudioToggle: (enabled) => audioEngine.setEnabled(enabled),
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
    this.settingsModal = new SettingsModalComponent({
      onFrameThemeChange: (theme) => console.log('Frame Theme:', theme),
      onBackdropChange: (backdrop) => this.backdrop.setTheme(backdrop),
      onFlipSpeedChange: (speed) => this.board.setSpeedMode(speed),
      onScreensaverTimeoutChange: (sec) => this.idleDetector.setIdleTimeout(sec),
      onAlignChange: (align) => {
        this.board.setAlignMode(align);
        this.displayCurrentQuote();
      },
      onMatrixSizeChange: (rows, cols) => {
        VestaboardEngine.setMatrixDimensions(rows, cols);
        this.board.setDimensions(rows, cols);
        this.displayCurrentQuote();
      },
      onZoomChange: (scale) => {
        document.documentElement.style.setProperty('--board-scale', scale);
      },
      onViewportFillChange: (isFill) => {
        const viewport = document.querySelector('.board-viewport');
        if (isFill) {
          viewport.classList.add('fill-viewport');
        } else {
          viewport.classList.remove('fill-viewport');
        }
      }
    });

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

  loadCustomQuotes() {
    try {
      const saved = localStorage.getItem('vestaboard_custom_quotes');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  saveCustomQuote(newQuote) {
    const existingIdx = this.customQuotes.findIndex(q => q.id === newQuote.id);
    if (existingIdx >= 0) {
      this.customQuotes[existingIdx] = newQuote;
    } else {
      this.customQuotes.push(newQuote);
    }

    this.allQuotes = [...DEFAULT_QUOTES, ...this.customQuotes];
    localStorage.setItem('vestaboard_custom_quotes', JSON.stringify(this.customQuotes));
    this.quoteManager.customQuotes = this.customQuotes;
    this.quoteManager.renderCustomQuotes();
  }

  deleteCustomQuote(quoteId) {
    this.customQuotes = this.customQuotes.filter(q => q.id !== quoteId);
    this.allQuotes = [...DEFAULT_QUOTES, ...this.customQuotes];
    localStorage.setItem('vestaboard_custom_quotes', JSON.stringify(this.customQuotes));
    this.quoteManager.customQuotes = this.customQuotes;
    this.quoteManager.renderCustomQuotes();
  }

  handleImportQuotes(imported) {
    this.customQuotes = [...this.customQuotes, ...imported];
    this.allQuotes = [...DEFAULT_QUOTES, ...this.customQuotes];
    localStorage.setItem('vestaboard_custom_quotes', JSON.stringify(this.customQuotes));
    this.quoteManager.customQuotes = this.customQuotes;
    this.quoteManager.renderCustomQuotes();
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

    categoryBadge.textContent = category;
    sourceLabel.textContent = `— ${author}`;
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
  }

  handleModeChange(mode) {
    this.currentMode = mode;
    this.displayCurrentQuote();
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
