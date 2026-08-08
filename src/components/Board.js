import { BOARD_ROWS, BOARD_COLS, VestaboardEngine, FLAP_SEQUENCE } from '../core/VestaboardEngine.js';
import { audioEngine } from '../audio/FlapAudioEngine.js';

// Cell key = what a flap physically displays: a char, or a tile-* color class
const cellKey = (cell) => (cell.isColor ? cell.colorClass : cell.char);
const SEQ_INDEX = new Map(FLAP_SEQUENCE.map((key, i) => [key, i]));

const FLIP_KEYFRAMES = [
  { transform: 'rotateX(0deg)' },
  { transform: 'rotateX(-180deg)' }
];

export class BoardComponent {
  constructor(screenElement) {
    this.screenElement = screenElement;
    this.currentMatrix = Array.from({ length: BOARD_ROWS }, () =>
      Array.from({ length: BOARD_COLS }, () => ({ char: ' ', isColor: false, colorClass: '' }))
    );
    this.flapElements = []; // 2D array of DOM nodes
    this.spinners = [];     // 2D array of per-flap drum state {displayed, target, anim}
    this.alignMode = 'center';
    this.speedMode = 'realistic';

    this.initDOM();
  }

  /**
   * Initializes the grid DOM elements with crisp split-flap leaf structure.
   */
  initDOM() {
    // Cancel any in-flight spins before rebuilding (cancel does NOT fire onfinish)
    this.spinners.flat().forEach(sp => { if (sp.anim) sp.anim.cancel(); });

    this.screenElement.innerHTML = '';
    this.flapElements = [];
    this.spinners = [];

    for (let r = 0; r < BOARD_ROWS; r++) {
      const rowElements = [];
      const rowSpinners = [];
      for (let c = 0; c < BOARD_COLS; c++) {
        const flap = document.createElement('div');
        flap.className = 'split-flap';
        flap.dataset.row = r;
        flap.dataset.col = c;
        flap.style.zIndex = 100 - r; // Row stacking isolation

        flap.innerHTML = `
          <div class="flap-upper"><span class="flap-text"> </span></div>
          <div class="flap-lower"><span class="flap-text"> </span></div>
          <div class="flap-flipper">
            <div class="flipper-face face-front"><span class="flap-text"> </span></div>
            <div class="flipper-face face-back"><span class="flap-text"> </span></div>
          </div>
          <div class="flap-split-line"></div>
        `;

        this.screenElement.appendChild(flap);
        rowElements.push(flap);
        rowSpinners.push({ displayed: ' ', target: ' ', anim: null });
      }
      this.flapElements.push(rowElements);
      this.spinners.push(rowSpinners);
    }
  }

  /**
   * Flips the board to display a new message/text.
   */
  displayMessage(rawText) {
    const targetMatrix = VestaboardEngine.formatTextToMatrix(rawText, this.alignMode);
    this.flipToMatrix(targetMatrix);
  }

  /**
   * Points every flap's drum at its new target character. Flaps spin
   * independently and simultaneously (like the real machine); a flap already
   * spinning simply keeps going until it reaches the updated target, so
   * interrupting messages never needs cancellation or cleanup.
   */
  flipToMatrix(targetMatrix) {
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const sp = this.spinners[r] ? this.spinners[r][c] : null;
        if (!sp || !targetMatrix[r] || !targetMatrix[r][c]) continue;

        sp.target = cellKey(targetMatrix[r][c]);
        if (!sp.anim && sp.displayed !== sp.target) {
          // Small random start jitter so the wall of flaps feels mechanical,
          // not synchronized; steps themselves chain via onfinish
          this.spinStep(sp, this.flapElements[r][c], Math.random() * 120);
        }
      }
    }
    this.currentMatrix = targetMatrix;
  }

  /**
   * Advances one flap a single position on its drum, then chains the next
   * step from the animation's onfinish until it reaches its target.
   */
  spinStep(sp, flapEl, delay = 0) {
    if (sp.displayed === sp.target) {
      sp.anim = null;
      return;
    }

    const from = sp.displayed;
    const fromIdx = SEQ_INDEX.get(from);
    // Chars not on the drum (imported exotic glyphs) jump directly to target
    const next = (fromIdx === undefined || !SEQ_INDEX.has(sp.target))
      ? sp.target
      : FLAP_SEQUENCE[(fromIdx + 1) % FLAP_SEQUENCE.length];

    const upperText = flapEl.querySelector('.flap-upper .flap-text');
    const lowerText = flapEl.querySelector('.flap-lower .flap-text');
    const frontText = flapEl.querySelector('.face-front .flap-text');
    const backText = flapEl.querySelector('.face-back .flap-text');
    const flipper = flapEl.querySelector('.flap-flipper');

    const isColor = next.startsWith('tile-');
    flapEl.className = isColor ? `split-flap ${next}` : 'split-flap';

    const fromChar = from.startsWith('tile-') ? '' : from;
    const nextChar = isColor ? '' : next;

    // Leaf faces for this step: flipper front shows the outgoing char,
    // upper (revealed as it falls) and flipper back show the incoming one
    if (frontText) frontText.textContent = fromChar;
    if (backText) backText.textContent = nextChar;
    if (upperText) upperText.textContent = nextChar;
    if (lowerText) lowerText.textContent = fromChar;

    const anim = flipper.animate(FLIP_KEYFRAMES, {
      duration: this.stepDurationMs(),
      delay,
      easing: 'cubic-bezier(0.55, 0.06, 0.68, 0.5)',
      fill: 'forwards'
    });
    sp.anim = anim;
    audioEngine.playFlapClick();

    anim.onfinish = () => {
      // Normalize to at-rest state: the flipper sits over the upper half at
      // rotateX(0), so its front face must carry the settled char
      sp.displayed = next;
      sp.anim = null;
      if (lowerText) lowerText.textContent = nextChar;
      if (frontText) frontText.textContent = nextChar;
      anim.cancel(); // release the forwards-fill so the flipper rests at 0deg
      this.spinStep(sp, flapEl);
    };
  }

  stepDurationMs() {
    if (this.speedMode === 'fast') return 40;
    if (this.speedMode === 'slow') return 110;
    return 65; // realistic
  }

  setDimensions(rows, cols) {
    this.screenElement.style.setProperty('--board-rows', rows);
    this.screenElement.style.setProperty('--board-cols', cols);
    // Physical width scales with column count (~50px/col, 22 cols = 1100px);
    // consumed by .vestaboard-screen width calc in vestaboard.css
    this.screenElement.style.setProperty('--board-width', `${cols * 50}px`);

    // Compute exact grid aspect ratio and provide it to CSS to avoid calc() division parsing bugs
    const aspectRatio = (cols * 42) / (rows * 60);
    document.documentElement.style.setProperty('--board-aspect-ratio', aspectRatio);

    this.currentMatrix = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ char: ' ', isColor: false, colorClass: '' }))
    );

    this.initDOM();
  }

  setAlignMode(mode) {
    this.alignMode = mode;
  }

  setSpeedMode(speed) {
    this.speedMode = speed;
  }
}
