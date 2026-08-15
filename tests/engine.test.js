import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  FlippboardEngine,
  VestaboardEngine,
  FLAP_SEQUENCE,
  COLOR_TILES,
  BOARD_ROWS,
  BOARD_COLS
} from '../src/core/VestaboardEngine.js';
import { DEFAULT_QUOTES } from '../src/data/quoteLibrary.js';

// BOARD_ROWS/COLS are live module bindings mutated by setMatrixDimensions —
// always restore the standard board after each test
afterEach(() => {
  FlippboardEngine.setMatrixDimensions(6, 22);
  vi.useRealTimers();
});

const rowText = (matrix, r) => matrix[r].map(c => (c.isColor ? '#' : c.char)).join('');

describe('tokenizeLine', () => {
  it('upper-cases plain characters', () => {
    const tokens = FlippboardEngine.tokenizeLine('abc');
    expect(tokens.map(t => t.val)).toEqual(['A', 'B', 'C']);
    expect(tokens.every(t => t.type === 'char')).toBe(true);
  });

  it('turns a color tile code into exactly one token', () => {
    const tokens = FlippboardEngine.tokenizeLine('{red}A{blue}');
    expect(tokens).toHaveLength(3);
    expect(tokens[0]).toMatchObject({ type: 'color', val: 'tile-red' });
    expect(tokens[1]).toMatchObject({ type: 'char', val: 'A' });
    expect(tokens[2]).toMatchObject({ type: 'color', val: 'tile-blue' });
  });

  it('matches tile codes case-insensitively', () => {
    expect(FlippboardEngine.tokenizeLine('{RED}')[0].val).toBe('tile-red');
  });
});

describe('wrapTextToLines', () => {
  it('keeps a fitting line intact', () => {
    const lines = FlippboardEngine.wrapTextToLines('HELLO WORLD');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toHaveLength(11);
  });

  it('wraps words that overflow the column width', () => {
    const lines = FlippboardEngine.wrapTextToLines('AAAAAAAAAA BBBBBBBBBB CCCCCCCCCC');
    // 10+1+10 = 21 fits on line 1 (22 cols); third word wraps
    expect(lines).toHaveLength(2);
    expect(lines[0]).toHaveLength(21);
    expect(lines[1]).toHaveLength(10);
  });

  it('hard-slices single words longer than the board width', () => {
    const lines = FlippboardEngine.wrapTextToLines('X'.repeat(50));
    expect(lines.map(l => l.length)).toEqual([22, 22, 6]);
  });

  it('truncates silently at BOARD_ROWS', () => {
    const lines = FlippboardEngine.wrapTextToLines(Array(10).fill('ROW').join('\n'));
    expect(lines).toHaveLength(6);
  });

  it('keeps blank paragraph lines as empty rows', () => {
    const lines = FlippboardEngine.wrapTextToLines('A\n\nB');
    expect(lines).toHaveLength(3);
    expect(lines[1]).toEqual([]);
  });

  it('respects reduced dimensions after setMatrixDimensions', () => {
    FlippboardEngine.setMatrixDimensions(4, 15);
    const lines = FlippboardEngine.wrapTextToLines('X'.repeat(20));
    expect(lines.map(l => l.length)).toEqual([15, 5]);
  });
});

describe('formatTextToMatrix', () => {
  it('centers horizontally and vertically (floor bias up/left)', () => {
    const m = FlippboardEngine.formatTextToMatrix('AB');
    // 1 line on 6 rows -> startRow floor((6-1)/2) = 2; 2 tokens on 22 -> startCol 10
    expect(m[2][10].char).toBe('A');
    expect(m[2][11].char).toBe('B');
    expect(rowText(m, 0).trim()).toBe('');
  });

  it('left-aligns when asked', () => {
    const m = FlippboardEngine.formatTextToMatrix('AB', 'left');
    expect(m[0][0].char).toBe('A');
    expect(m[0][1].char).toBe('B');
  });

  it('places color tiles as color cells', () => {
    const m = FlippboardEngine.formatTextToMatrix('{green}', 'left');
    expect(m[0][0]).toMatchObject({ isColor: true, colorClass: 'tile-green' });
  });
});

describe('getClockMessage', () => {
  const PRESETS = [[6, 22], [4, 15], [8, 30], [10, 40], [6, 30], [8, 22], [12, 48]];

  it.each(PRESETS)('fits %ix%i without truncation', (rows, cols) => {
    FlippboardEngine.setMatrixDimensions(rows, cols);
    const lines = FlippboardEngine.wrapTextToLines(FlippboardEngine.getClockMessage());
    const expectedLines = rows >= 6 ? 6 : 4;
    expect(lines.length).toBe(expectedLines);
    lines.forEach(line => expect(line.length).toBeLessThanOrEqual(cols));
    // Header must stay on one line: side blues + " TIME & DATE " = 2*side+13
    const side = Math.max(0, Math.floor((cols - 13) / 2));
    expect(lines[0].length).toBe(2 * side + 13);
  });
});

describe('getDailyQuote', () => {
  it('is deterministic for a fixed date and handles empty lists', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-09T12:00:00Z'));
    const list = DEFAULT_QUOTES.slice(0, 7);
    const a = FlippboardEngine.getDailyQuote(list);
    const b = FlippboardEngine.getDailyQuote(list);
    expect(a).toBe(b);
    expect(FlippboardEngine.getDailyQuote([])).toBeNull();
  });
});

describe('validateQuote', () => {
  it('passes a clean fitting quote', () => {
    const res = FlippboardEngine.validateQuote('HELLO WORLD');
    expect(res).toEqual({ ok: true, overflowRows: 0, invalidChars: [], duplicateOf: null });
  });

  it('reports overflow rows instead of silently truncating', () => {
    const res = FlippboardEngine.validateQuote(Array(9).fill('ROW').join('\n'));
    expect(res.ok).toBe(false);
    expect(res.overflowRows).toBe(3);
  });

  it('flags characters missing from the flap drum', () => {
    const res = FlippboardEngine.validateQuote('CAFÉ — YES');
    expect(res.ok).toBe(false);
    expect(res.invalidChars).toContain('É');
    expect(res.invalidChars).toContain('—');
  });

  it('exempts color tile tokens from the char check', () => {
    const res = FlippboardEngine.validateQuote('{red}{blue} OK');
    expect(res.invalidChars).toEqual([]);
    expect(res.ok).toBe(true);
  });

  it('detects duplicates case/whitespace/tile-insensitively', () => {
    const existing = [{ id: 'q1', text: 'Stay  Hungry\nstay foolish' }];
    const res = FlippboardEngine.validateQuote('{green}STAY HUNGRY STAY FOOLISH', existing);
    expect(res.ok).toBe(false);
    expect(res.duplicateOf).toBe('q1');
  });

  it('respects reduced board dimensions', () => {
    FlippboardEngine.setMatrixDimensions(4, 15);
    const res = FlippboardEngine.validateQuote(Array(6).fill('ROW').join('\n'));
    expect(res.overflowRows).toBe(2);
  });
});

describe('getNextCategoryIndex', () => {
  const list = [
    { id: 1, category: 'a' }, { id: 2, category: 'a' },
    { id: 3, category: 'b' }, { id: 4, category: 'b' },
    { id: 5, category: 'c' }
  ];

  it('jumps to the first quote of the next category, wrapping around', () => {
    expect(FlippboardEngine.getNextCategoryIndex(list, 0)).toBe(2);
    expect(FlippboardEngine.getNextCategoryIndex(list, 3)).toBe(4);
    expect(FlippboardEngine.getNextCategoryIndex(list, 4)).toBe(0);
  });

  it('stays put on single-category and handles empty lists', () => {
    expect(FlippboardEngine.getNextCategoryIndex([{ category: 'x' }, { category: 'x' }], 1)).toBe(1);
    expect(FlippboardEngine.getNextCategoryIndex([], 0)).toBe(0);
  });
});

describe('FLAP_SEQUENCE drum', () => {
  it('has unique entries starting with blank', () => {
    expect(FLAP_SEQUENCE[0]).toBe(' ');
    expect(new Set(FLAP_SEQUENCE).size).toBe(FLAP_SEQUENCE.length);
  });

  it('contains every color tile class', () => {
    Object.values(COLOR_TILES).forEach(cls => expect(FLAP_SEQUENCE).toContain(cls));
  });

  it('covers every token the curated library can produce', () => {
    // Off-drum chars fall back to a direct jump (Board.spinStep), but the
    // shipped library should spin authentically — every token on the drum
    const drum = new Set(FLAP_SEQUENCE);
    for (const quote of DEFAULT_QUOTES) {
      for (const line of quote.text.split('\n')) {
        for (const tok of FlippboardEngine.tokenizeLine(line)) {
          expect(drum.has(tok.val), `off-drum token "${tok.val}" in quote ${quote.id}`).toBe(true);
        }
      }
    }
  });
});

describe('backwards-compat alias', () => {
  it('VestaboardEngine is FlippboardEngine', () => {
    expect(VestaboardEngine).toBe(FlippboardEngine);
  });
});
