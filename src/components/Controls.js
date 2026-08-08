export class ControlsComponent {
  constructor(options) {
    this.onModeChange = options.onModeChange;
    this.onNextClick = options.onNextClick;
    this.onPlayPauseToggle = options.onPlayPauseToggle;
    this.onShuffleClick = options.onShuffleClick;
    this.onIntervalChange = options.onIntervalChange;
    this.onQuickMessageSubmit = options.onQuickMessageSubmit;
    this.onAudioToggle = options.onAudioToggle;
    this.onKioskToggle = options.onKioskToggle;

    this.isPlaying = true;
    this.currentMode = 'sequential';
    this.intervalSeconds = 30;

    this.bindDOM();
  }

  bindDOM() {
    // Mode Buttons
    const modeBtns = document.querySelectorAll('#mode-segmented-control .segment-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        this.currentMode = mode;
        this.updateModeLabel(mode);
        if (this.onModeChange) this.onModeChange(mode);
      });
    });

    // Next Quote Flip Button
    document.getElementById('btn-next-quote').addEventListener('click', () => {
      if (this.onNextClick) this.onNextClick();
    });

    // Play / Pause Button
    const playPauseBtn = document.getElementById('btn-play-pause');
    playPauseBtn.addEventListener('click', () => {
      this.isPlaying = !this.isPlaying;
      this.updatePlayPauseUI(playPauseBtn);
      if (this.onPlayPauseToggle) this.onPlayPauseToggle(this.isPlaying);
    });

    // Shuffle Button
    document.getElementById('btn-shuffle').addEventListener('click', () => {
      if (this.onShuffleClick) this.onShuffleClick();
    });

    // Interval Slider
    const slider = document.getElementById('interval-slider');
    const valDisplay = document.getElementById('interval-val-display');
    slider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.intervalSeconds = val;
      valDisplay.textContent = `${val} seconds`;
      if (this.onIntervalChange) this.onIntervalChange(val);
    });

    // Quick Message Input & Send
    const quickInput = document.getElementById('quick-message-input');
    const sendBtn = document.getElementById('btn-send-quick');
    const handleQuickSend = () => {
      const msg = quickInput.value.trim();
      if (msg && this.onQuickMessageSubmit) {
        this.onQuickMessageSubmit(msg);
        quickInput.value = '';
      }
    };
    sendBtn.addEventListener('click', handleQuickSend);
    quickInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleQuickSend();
    });

    // Audio Toggle
    const audioBtn = document.getElementById('btn-audio-toggle');
    audioBtn.addEventListener('click', () => {
      const soundOnIcon = audioBtn.querySelector('.sound-on');
      const soundOffIcon = audioBtn.querySelector('.sound-off');
      const isMuted = soundOnIcon.classList.contains('hidden');

      soundOnIcon.classList.toggle('hidden', isMuted);
      soundOffIcon.classList.toggle('hidden', !isMuted);

      if (this.onAudioToggle) this.onAudioToggle(!isMuted);
    });

    // Kiosk Fullscreen Mode
    const kioskBtn = document.getElementById('btn-kiosk');
    const exitKioskBtn = document.getElementById('btn-exit-kiosk');

    kioskBtn.addEventListener('click', () => {
      document.body.classList.add('kiosk-mode');
      exitKioskBtn.classList.remove('hidden');
      if (this.onKioskToggle) this.onKioskToggle(true);
    });

    exitKioskBtn.addEventListener('click', () => {
      document.body.classList.remove('kiosk-mode');
      exitKioskBtn.classList.add('hidden');
      if (this.onKioskToggle) this.onKioskToggle(false);
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('kiosk-mode')) {
        document.body.classList.remove('kiosk-mode');
        exitKioskBtn.classList.add('hidden');
        if (this.onKioskToggle) this.onKioskToggle(false);
      }
    });
  }

  updatePlayPauseUI(btn) {
    const playIcon = btn.querySelector('.icon-play');
    const pauseIcon = btn.querySelector('.icon-pause');
    const textSpan = document.getElementById('play-pause-text');

    if (this.isPlaying) {
      playIcon.classList.add('hidden');
      pauseIcon.classList.remove('hidden');
      textSpan.textContent = 'Auto-Flip Active';
      btn.classList.add('active');
    } else {
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
      textSpan.textContent = 'Paused';
      btn.classList.remove('active');
    }
  }

  updateModeLabel(mode) {
    const label = document.getElementById('current-mode-label');
    const modeNames = {
      sequential: 'Mode: Sequential',
      random: 'Mode: Random',
      daily: 'Mode: Daily Quote',
      clock: 'Mode: Flip Clock'
    };
    label.textContent = modeNames[mode] || 'Mode: Sequential';
  }
}
