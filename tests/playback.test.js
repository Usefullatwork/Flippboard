import { describe, it, expect, afterEach, vi } from 'vitest';
import { Playback } from '../src/core/Playback.js';
import { FlippboardEngine } from '../src/core/VestaboardEngine.js';

const QUOTES = [
  { text: 'ALPHA', author: 'A', category: 'stoic' },
  { text: 'BRAVO', author: 'B', category: 'stoic' },
  { text: 'CHARLIE', author: 'C', category: 'zen' },
  { text: 'DELTA', author: 'D', category: 'zen' }
];

afterEach(() => {
  FlippboardEngine.setMatrixDimensions(6, 22);
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Playback — sequential', () => {
  it('advances and wraps forward', () => {
    const p = new Playback(QUOTES);
    p.index = QUOTES.length - 1;
    const d = p.next();
    expect(p.index).toBe(0);
    expect(d).toEqual({ kind: 'indexed', quote: QUOTES[0] });
  });

  it('goes back and wraps at zero', () => {
    const p = new Playback(QUOTES);
    const d = p.prev();
    expect(p.index).toBe(QUOTES.length - 1);
    expect(d).toEqual({ kind: 'indexed', quote: QUOTES[3] });
  });
});

describe('Playback — random', () => {
  it('picks an in-range index on next and prev', () => {
    const p = new Playback(QUOTES);
    p.setMode('random');
    for (let i = 0; i < 20; i++) {
      p.next();
      expect(p.index).toBeGreaterThanOrEqual(0);
      expect(p.index).toBeLessThan(QUOTES.length);
      p.prev();
      expect(p.index).toBeGreaterThanOrEqual(0);
      expect(p.index).toBeLessThan(QUOTES.length);
    }
  });
});

describe('Playback — daily mode and manual override', () => {
  it('timer tick shows the daily quote, manual next shows the indexed one', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-15T12:00:00Z'));
    const p = new Playback(QUOTES);
    p.setMode('daily');

    const tick = p.next(false); // what the auto-flip timer displays
    expect(tick.kind).toBe('daily');
    expect(tick.quote).toEqual(FlippboardEngine.getDailyQuote(QUOTES));

    const manual = p.next(true); // user pressed next — override
    expect(manual.kind).toBe('indexed');
    expect(manual.quote).toBe(QUOTES[p.index]);

    // the next timer tick reverts to the daily quote (override is transient)
    expect(p.next(false).kind).toBe('daily');
  });

  it('prev is always an override in daily mode', () => {
    const p = new Playback(QUOTES);
    p.setMode('daily');
    expect(p.prev().kind).toBe('indexed');
  });

  it('empty list in daily mode renders nothing', () => {
    const p = new Playback([]);
    p.setMode('daily');
    expect(p.current()).toEqual({ kind: 'none' });
  });
});

describe('Playback — category jump', () => {
  it('jumps to the next category and wraps', () => {
    const p = new Playback(QUOTES);
    expect(p.jumpCategory().quote.category).toBe('zen'); // 0 (stoic) -> 2
    expect(p.index).toBe(2);
    p.jumpCategory();
    expect(p.index).toBe(0); // zen -> wraps to stoic
  });
});

describe('Playback — clock mode', () => {
  it('transitions are display-only: index never moves', () => {
    const p = new Playback(QUOTES);
    p.index = 2;
    p.setMode('clock');
    for (const d of [p.next(), p.prev(), p.jumpCategory()]) {
      expect(d.kind).toBe('clock');
      expect(typeof d.text).toBe('string');
    }
    expect(p.index).toBe(2);
  });
});

describe('Playback — mode switches', () => {
  it('keeps the index across mode changes', () => {
    const p = new Playback(QUOTES);
    p.next();
    p.next();
    expect(p.index).toBe(2);
    p.setMode('random');
    p.setMode('sequential');
    expect(p.index).toBe(2);
    expect(p.current().quote).toBe(QUOTES[2]);
  });

  it('shuffle picks an in-range index and returns it', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const p = new Playback(QUOTES);
    const d = p.shuffle();
    expect(p.index).toBe(QUOTES.length - 1);
    expect(d).toEqual({ kind: 'indexed', quote: QUOTES[3] });
  });
});
