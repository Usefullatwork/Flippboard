import { BOARD_ROWS, BOARD_COLS, VestaboardEngine } from '../core/VestaboardEngine.js';
import { audioEngine } from '../audio/FlapAudioEngine.js';

export class BoardComponent {
  constructor(screenElement) {
    this.screenElement = screenElement;
    this.currentMatrix = Array.from({ length: BOARD_ROWS }, () =>
      Array.from({ length: BOARD_COLS }, () => ({ char: ' ', isColor: false, colorClass: '' }))
    );
    this.flapElements = []; // 6x22 (or dynamic) 2D array of DOM nodes
    this.alignMode = 'center';
    this.speedMode = 'realistic';
    this.pendingTimeouts = [];

    this.initDOM();
  }

  /**
   * Clears all pending animation timeouts to prevent race conditions during rapid flips.
   */
  clearPendingTimeouts() {
    this.pendingTimeouts.forEach(t => clearTimeout(t));
    this.pendingTimeouts = [];
  }

  /**
   * Initializes the grid DOM elements with crisp split-flap leaf structure.
   */
  initDOM() {
    this.clearPendingTimeouts();
    this.screenElement.innerHTML = '';
    this.flapElements = [];

    for (let r = 0; r < BOARD_ROWS; r++) {
      const rowElements = [];
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
      }
      this.flapElements.push(rowElements);
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
   * Cascading flip animation comparing current vs target matrix.
   */
  flipToMatrix(targetMatrix) {
    // Clear any active/queued timeouts from previous flips
    this.clearPendingTimeouts();

    // Pre-count changed flaps and cap the total cascade at ~1.6s so giant
    // boards (400 flaps) finish before the minimum 5s playback interval
    let changedCount = 0;
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const cur = this.currentMatrix[r] ? this.currentMatrix[r][c] : null;
        const tgt = targetMatrix[r][c];
        if (cur && (cur.char !== tgt.char || cur.colorClass !== tgt.colorClass)) changedCount++;
      }
    }
    const stagger = changedCount ? Math.min(12, 1600 / changedCount) : 0;

    let delayCounter = 0;

    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const flapEl = this.flapElements[r] ? this.flapElements[r][c] : null;
        const currentCell = this.currentMatrix[r] ? this.currentMatrix[r][c] : null;
        const targetCell = targetMatrix[r][c];
        if (!flapEl || !currentCell) continue;

        // Check if character or color tile changed
        if (currentCell.char !== targetCell.char || currentCell.colorClass !== targetCell.colorClass) {
          const staggerDelay = delayCounter * stagger;
          delayCounter++;

          const tId = setTimeout(() => {
            this.animateSingleFlap(flapEl, currentCell, targetCell);
          }, staggerDelay);
          this.pendingTimeouts.push(tId);
        } else {
          // Keep static flap updated
          this.setFlapStatic(flapEl, targetCell);
        }
      }
    }

    this.currentMatrix = targetMatrix;
  }

  setFlapStatic(flapEl, cell) {
    if (!flapEl) return;
    flapEl.className = 'split-flap';
    if (cell.isColor) {
      flapEl.classList.add(cell.colorClass);
    }

    const upperText = flapEl.querySelector('.flap-upper .flap-text');
    const lowerText = flapEl.querySelector('.flap-lower .flap-text');
    const frontText = flapEl.querySelector('.face-front .flap-text');
    const backText = flapEl.querySelector('.face-back .flap-text');
    const flipper = flapEl.querySelector('.flap-flipper');

    if (flipper) flipper.classList.remove('flipping');

    const charVal = cell.isColor ? '' : cell.char;
    if (upperText) upperText.textContent = charVal;
    if (lowerText) lowerText.textContent = charVal;
    if (frontText) frontText.textContent = charVal;
    if (backText) backText.textContent = charVal;
  }

  /**
   * Gets animation duration in ms based on speedMode setting.
   */
  getAnimationDurationMs() {
    if (this.speedMode === 'fast') return 150;
    if (this.speedMode === 'slow') return 500;
    return 280; // realistic default
  }

  /**
   * Animates a single flap cell transition.
   */
  animateSingleFlap(flapEl, oldCell, newCell) {
    if (!flapEl) return;
    const upperText = flapEl.querySelector('.flap-upper .flap-text');
    const lowerText = flapEl.querySelector('.flap-lower .flap-text');
    const frontText = flapEl.querySelector('.face-front .flap-text');
    const backText = flapEl.querySelector('.face-back .flap-text');
    const flipper = flapEl.querySelector('.flap-flipper');

    // Remove old tile color classes
    flapEl.className = 'split-flap';
    if (newCell.isColor) {
      flapEl.classList.add(newCell.colorClass);
    }

    const oldChar = oldCell.isColor ? '' : oldCell.char;
    const newChar = newCell.isColor ? '' : newCell.char;

    // Set leaf characters for flip transition
    if (frontText) frontText.textContent = oldChar;
    if (backText) backText.textContent = newChar;
    if (upperText) upperText.textContent = newChar;
    if (lowerText) lowerText.textContent = oldChar;

    // Restart CSS flip animation
    if (flipper) {
      flipper.classList.remove('flipping');
      void flipper.offsetWidth; // trigger reflow
      flipper.classList.add('flipping');
    }

    // Trigger mechanical clack sound
    audioEngine.playFlapClick();

    // After the flip animation finishes, normalize the flap to its at-rest
    // state. The flipper stays visible at rotateX(0) covering the upper half,
    // so the front face MUST be updated to the new char here — otherwise the
    // flap shows the old char's top half over the new char's bottom half.
    // +50ms buffer so the CSS animation always completes before the snap-back.
    const duration = this.getAnimationDurationMs() + 50;
    const cleanupId = setTimeout(() => {
      if (lowerText) lowerText.textContent = newChar;
      if (frontText) frontText.textContent = newChar;
      if (flipper) flipper.classList.remove('flipping');
    }, duration);
    this.pendingTimeouts.push(cleanupId);
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
    let duration = '0.28s';
    if (speed === 'fast') duration = '0.15s';
    if (speed === 'slow') duration = '0.50s';
    document.documentElement.style.setProperty('--flip-speed', duration);
  }
}

