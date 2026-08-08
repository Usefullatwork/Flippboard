/**
 * FlapAudioEngine - Procedural Web Audio Synthesizer for Mechanical Split-Flap Sounds
 * Generates ultra-realistic plastic click-clacks without relying on external MP3 files.
 */
class FlapAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.5;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.initialized = true;
      }
    } catch (e) {
      console.warn("Web Audio API not supported:", e);
    }
  }

  ensureContext() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Plays realistic mechanical split-flap click with multi-layered acoustic resonance.
   */
  playFlapClick() {
    if (!this.enabled || !this.volume || this.volume <= 0) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Slight random gain and timing jitter per click for organic acoustic variety
    const volumeJitter = 0.85 + Math.random() * 0.3; // 0.85x - 1.15x
    const masterVolume = this.volume * 0.45 * volumeJitter;

    // Master Gain Node
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(masterVolume, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    // 1. Noise Generator for plastic click slap
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.045);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.18));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // 1a. High Snap Filter (crisp plastic contact)
    const highSnapFilter = this.ctx.createBiquadFilter();
    highSnapFilter.type = 'highpass';
    const snapFreq = 2400 + (Math.random() * 600 - 300);
    highSnapFilter.frequency.setValueAtTime(snapFreq, now);

    // 1b. Mid Bandpass Filter (plastic body acoustic resonance)
    const midBodyFilter = this.ctx.createBiquadFilter();
    midBodyFilter.type = 'bandpass';
    const bodyFreq = 1350 + (Math.random() * 300 - 150);
    midBodyFilter.frequency.setValueAtTime(bodyFreq, now);
    midBodyFilter.Q.setValueAtTime(3.5, now);

    noise.connect(highSnapFilter);
    noise.connect(midBodyFilter);
    highSnapFilter.connect(masterGain);
    midBodyFilter.connect(masterGain);

    // 2. Low-frequency thud for mechanical solenoid actuation
    const thud = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thud.type = 'sine';
    const startFreq = 190 + (Math.random() * 30 - 15);
    thud.frequency.setValueAtTime(startFreq, now);
    thud.frequency.exponentialRampToValueAtTime(35, now + 0.035);

    thudGain.gain.setValueAtTime(masterVolume * 0.4, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    thud.connect(thudGain);
    thudGain.connect(this.ctx.destination);
    masterGain.connect(this.ctx.destination);

    noise.start(now);
    thud.start(now);
    thud.stop(now + 0.045);
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

export const audioEngine = new FlapAudioEngine();

