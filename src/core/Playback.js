import { VestaboardEngine } from './VestaboardEngine.js';

/**
 * Pure playback state machine: mode/index/play-state transitions only.
 * No timers, no DOM — the app owns those and renders the descriptors
 * ({ kind: 'clock'|'daily'|'indexed'|'none', quote?, text? }) this returns.
 */
export class Playback {
  constructor(quotes) {
    this.quotes = quotes;
    this.index = 0;
    this.mode = 'sequential'; // 'sequential', 'random', 'daily', 'clock'
    this.isPlaying = true;
    this.intervalSeconds = 30;
  }

  // What the auto-flip timer (or a fresh render) should show right now.
  current() {
    if (this.mode === 'clock') {
      return { kind: 'clock', text: VestaboardEngine.getClockMessage() };
    }
    if (this.mode === 'daily') {
      const quote = VestaboardEngine.getDailyQuote(this.quotes);
      return quote ? { kind: 'daily', quote } : { kind: 'none' };
    }
    if (this.quotes.length > 0) {
      return { kind: 'indexed', quote: this.quotes[this.index] };
    }
    return { kind: 'none' };
  }

  // Manual navigation shows the indexed quote even in daily mode (the timer
  // keeps re-displaying the daily quote — see current()).
  indexed() {
    if (this.mode === 'daily' && this.quotes.length > 0) {
      return { kind: 'indexed', quote: this.quotes[this.index] };
    }
    return this.current();
  }

  next(manual = false) {
    if (this.mode === 'clock') return this.current();
    if (this.mode === 'random') {
      this.index = Math.floor(Math.random() * this.quotes.length);
    } else {
      this.index = (this.index + 1) % this.quotes.length;
    }
    return manual ? this.indexed() : this.current();
  }

  prev() {
    if (this.mode === 'clock') return this.current();
    if (this.mode === 'random') {
      this.index = Math.floor(Math.random() * this.quotes.length);
    } else {
      this.index = (this.index - 1 + this.quotes.length) % this.quotes.length;
    }
    return this.indexed();
  }

  jumpCategory() {
    if (this.mode === 'clock') return this.current();
    this.index = VestaboardEngine.getNextCategoryIndex(this.quotes, this.index);
    return this.indexed();
  }

  shuffle() {
    this.index = Math.floor(Math.random() * this.quotes.length);
    return this.indexed();
  }

  setMode(mode) {
    this.mode = mode; // index deliberately survives mode switches
    return this.current();
  }

  setQuotes(quotes) {
    this.quotes = quotes; // index deliberately not re-clamped (pre-extraction behavior)
  }
}
