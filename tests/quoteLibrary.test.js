import { describe, it, expect, afterEach } from 'vitest';
import { FlippboardEngine } from '../src/core/VestaboardEngine.js';
import { DEFAULT_QUOTES } from '../src/data/quoteLibrary.js';

afterEach(() => {
  FlippboardEngine.setMatrixDimensions(6, 22);
});

describe('quote library', () => {
  it('every quote fits the default 6x22 board with only on-drum characters', () => {
    for (const q of DEFAULT_QUOTES) {
      const v = FlippboardEngine.validateQuote(q.text);
      expect(v.invalidChars, `${q.id} has off-drum chars`).toEqual([]);
      expect(v.overflowRows, `${q.id} overflows the board`).toBe(0);
    }
  });

  it('ids are unique', () => {
    const ids = DEFAULT_QUOTES.map(q => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('texts are unique after normalization', () => {
    const norm = s => s.replace(/\{[a-z]+\}/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
    const seen = new Map();
    for (const q of DEFAULT_QUOTES) {
      const n = norm(q.text);
      expect(seen.has(n), `${q.id} duplicates ${seen.get(n)}`).toBe(false);
      seen.set(n, q.id);
    }
  });
});
