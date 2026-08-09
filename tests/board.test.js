// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BoardComponent } from '../src/components/Board.js';
import { FlippboardEngine, FLAP_SEQUENCE } from '../src/core/VestaboardEngine.js';

// jsdom has no Web Animations API. Board.spinStep assigns onfinish AFTER
// animate() returns, so a plain stub object is enough; chains are driven by
// firing onfinish manually. No audio mock needed: FlapAudioEngine finds no
// window.AudioContext in jsdom and playFlapClick early-returns.
beforeEach(() => {
  Element.prototype.animate = vi.fn(() => ({ onfinish: null, cancel: vi.fn() }));
});

afterEach(() => {
  FlippboardEngine.setMatrixDimensions(6, 22);
  delete Element.prototype.animate;
});

const cell = (char) => ({ char, isColor: false, colorClass: '' });
const tile = (cls) => ({ char: ' ', isColor: true, colorClass: cls });

function makeBoard(rows, cols) {
  FlippboardEngine.setMatrixDimensions(rows, cols);
  return new BoardComponent(document.createElement('div'));
}

function matrixWith(board, r, c, cellValue) {
  return board.currentMatrix.map((row, ri) =>
    row.map((cv, ci) => (ri === r && ci === c ? cellValue : cv))
  );
}

// Run a flap's spin chain to completion (each onfinish schedules the next step)
function settle(sp) {
  let guard = FLAP_SEQUENCE.length * 3;
  while (sp.anim && guard-- > 0) sp.anim.onfinish();
  expect(guard).toBeGreaterThan(0);
}

describe('drum spinner', () => {
  it('builds rows*cols flaps and spinners', () => {
    const b = makeBoard(1, 3);
    expect(b.flapElements.flat()).toHaveLength(3);
    expect(b.spinners.flat()).toHaveLength(3);
    expect(b.spinners[0][0].displayed).toBe(' ');
  });

  it('A to C takes exactly 2 drum steps', () => {
    const b = makeBoard(1, 3);
    b.flipToMatrix(matrixWith(b, 0, 0, cell('A')));
    settle(b.spinners[0][0]);
    expect(b.spinners[0][0].displayed).toBe('A');

    const animateCallsBefore = Element.prototype.animate.mock.calls.length;
    b.flipToMatrix(matrixWith(b, 0, 0, cell('C')));
    settle(b.spinners[0][0]);
    expect(b.spinners[0][0].displayed).toBe('C');
    expect(Element.prototype.animate.mock.calls.length - animateCallsBefore).toBe(2);
  });

  it('retargeting mid-spin lands on the new target without a second chain', () => {
    const b = makeBoard(1, 3);
    const sp = b.spinners[0][0];
    b.flipToMatrix(matrixWith(b, 0, 0, cell('9')));
    expect(sp.anim).toBeTruthy();
    // Interrupt while spinning: only the target moves, no new chain starts
    b.flipToMatrix(matrixWith(b, 0, 0, cell('E')));
    expect(sp.target).toBe('E');
    settle(sp);
    expect(sp.displayed).toBe('E');
  });

  it('settles the front face on every completed step (no ghost halves)', () => {
    const b = makeBoard(1, 3);
    b.flipToMatrix(matrixWith(b, 0, 0, cell('B')));
    settle(b.spinners[0][0]);
    const flap = b.flapElements[0][0];
    const texts = ['.face-front', '.flap-upper', '.flap-lower'].map(
      sel => flap.querySelector(`${sel} .flap-text`).textContent
    );
    expect(texts).toEqual(['B', 'B', 'B']);
  });

  it('spins to color tiles and applies the tile class', () => {
    const b = makeBoard(1, 3);
    b.flipToMatrix(matrixWith(b, 0, 0, tile('tile-red')));
    settle(b.spinners[0][0]);
    expect(b.spinners[0][0].displayed).toBe('tile-red');
    expect(b.flapElements[0][0].className).toBe('split-flap tile-red');
  });

  it('jumps directly for off-drum characters instead of spinning forever', () => {
    const b = makeBoard(1, 3);
    b.flipToMatrix(matrixWith(b, 0, 0, cell('É')));
    const sp = b.spinners[0][0];
    sp.anim.onfinish(); // single step
    expect(sp.displayed).toBe('É');
    expect(sp.anim).toBeNull();
  });

  it('initDOM (resize) cancels in-flight spins', () => {
    const b = makeBoard(1, 3);
    b.flipToMatrix(matrixWith(b, 0, 0, cell('9')));
    const anim = b.spinners[0][0].anim;
    expect(anim).toBeTruthy();
    // Mirror main.js applyMatrixSize: engine globals drive initDOM's loops
    FlippboardEngine.setMatrixDimensions(2, 4);
    b.setDimensions(2, 4);
    expect(anim.cancel).toHaveBeenCalled();
    expect(b.spinners.flat()).toHaveLength(8);
  });
});
