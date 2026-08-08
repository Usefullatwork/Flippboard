/**
 * FlapAudioEngine - Procedural Web Audio Synthesizer for Mechanical Split-Flap Sounds
 * Generates realistic plastic click-clacks without relying on external MP3 files.
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

  playFlapClick() {
    if (!this.enabled || !this.volume || this.volume <= 0) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Master Gain Node
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(this.volume * 0.4, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    // 1. Noise Generator for plastic click snap
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Bandpass Filter for plastic body resonance
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    // Randomize pitch slightly per click for organic variety
    const baseFreq = 1400 + (Math.random() * 400 - 200);
    filter.frequency.setValueAtTime(baseFreq, now);
    filter.Q.setValueAtTime(3.0, now);

    noise.connect(filter);
    filter.connect(gainNode);

    // 2. Low-frequency thud for mechanical solenoid movement
    const thud = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(180, now);
    thud.frequency.exponentialRampToValueAtTime(40, now + 0.03);

    thudGain.gain.setValueAtTime(this.volume * 0.3, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    thud.connect(thudGain);
    thudGain.connect(this.ctx.destination);

    gainNode.connect(this.ctx.destination);

    noise.start(now);
    thud.start(now);
    thud.stop(now + 0.04);
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

export const audioEngine = new FlapAudioEngine();
