import { BOARD_ROWS, BOARD_COLS, VestaboardEngine } from '../core/VestaboardEngine.js';
import { audioEngine } from '../audio/FlapAudioEngine.js';

export class BoardComponent {
  constructor(screenElement) {
    this.screenElement = screenElement;
    this.currentMatrix = Array.from({ length: BOARD_ROWS }, () =>
      Array.from({ length: BOARD_COLS }, () => ({ char: ' ', isColor: false, colorClass: '' }))
    );
    this.flapElements = []; // 6x22 2D array of DOM nodes
    this.alignMode = 'center';
    this.speedMode = 'realistic';

    this.initDOM();
  }

  /**
   * Initializes the 6x22 grid DOM elements with crisp split-flap leaf structure.
   */
  initDOM() {
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
    let delayCounter = 0;

    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const currentCell = this.currentMatrix[r][c];
        const targetCell = targetMatrix[r][c];
        const flapEl = this.flapElements[r][c];

        // Check if character or color tile changed
        if (currentCell.char !== targetCell.char || currentCell.colorClass !== targetCell.colorClass) {
          const staggerDelay = delayCounter * 12; // 12ms stagger per changing flap
          delayCounter++;

          setTimeout(() => {
            this.animateSingleFlap(flapEl, currentCell, targetCell);
          }, staggerDelay);
        } else {
          // Keep static flap updated
          this.setFlapStatic(flapEl, targetCell);
        }
      }
    }

    this.currentMatrix = targetMatrix;
  }

  setFlapStatic(flapEl, cell) {
    flapEl.className = 'split-flap';
    if (cell.isColor) {
      flapEl.classList.add(cell.colorClass);
    }

    const upperText = flapEl.querySelector('.flap-upper .flap-text');
    const lowerText = flapEl.querySelector('.flap-lower .flap-text');
    const frontText = flapEl.querySelector('.face-front .flap-text');
    const backText = flapEl.querySelector('.face-back .flap-text');

    const charVal = cell.isColor ? '' : cell.char;
    upperText.textContent = charVal;
    lowerText.textContent = charVal;
    frontText.textContent = charVal;
    backText.textContent = charVal;
  }

  /**
   * Animates a single flap cell transition.
   */
  animateSingleFlap(flapEl, oldCell, newCell) {
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
    frontText.textContent = oldChar;
    backText.textContent = newChar;
    upperText.textContent = newChar;
    lowerText.textContent = oldChar;

    // Restart CSS flip animation
    flipper.classList.remove('flipping');
    void flipper.offsetWidth; // trigger reflow
    flipper.classList.add('flipping');

    // Trigger mechanical clack sound
    audioEngine.playFlapClick();

    // After flip animation finishes, update lower background character
    setTimeout(() => {
      lowerText.textContent = newChar;
      flipper.classList.remove('flipping');
    }, 280);
  }

  setDimensions(rows, cols) {
    this.screenElement.style.setProperty('--board-rows', rows);
    this.screenElement.style.setProperty('--board-cols', cols);
    
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
