/**
 * FlippboardEngine - Core Layout & Matrix Logic
 * Converts text & color tile tokens into a 6x22 Flippboard grid matrix with word wrapping.
 */
export let BOARD_ROWS = 6;
export let BOARD_COLS = 22;
export let TOTAL_FLAPS = BOARD_ROWS * BOARD_COLS;

export const COLOR_TILES = {
  '{red}': 'tile-red',
  '{orange}': 'tile-orange',
  '{yellow}': 'tile-yellow',
  '{green}': 'tile-green',
  '{blue}': 'tile-blue',
  '{violet}': 'tile-violet',
  '{white}': 'tile-white',
  '{black}': 'tile-black'
};

export class FlippboardEngine {
  static setMatrixDimensions(rows, cols) {
    BOARD_ROWS = rows;
    BOARD_COLS = cols;
    TOTAL_FLAPS = rows * cols;
  }

  /**
   * Tokenizes a string line into text characters and color tile tokens.
   */
  static tokenizeLine(lineStr) {
    const tokens = [];
    let i = 0;
    while (i < lineStr.length) {
      let matchedTile = false;
      for (const [code, className] of Object.entries(COLOR_TILES)) {
        if (lineStr.substr(i, code.length).toLowerCase() === code) {
          tokens.push({ type: 'color', val: className, length: 1 });
          i += code.length;
          matchedTile = true;
          break;
        }
      }
      if (!matchedTile) {
        tokens.push({ type: 'char', val: lineStr[i].toUpperCase(), length: 1 });
        i++;
      }
    }
    return tokens;
  }

  /**
   * Word-wraps raw text into lines of max 22 flap tokens each.
   */
  static wrapTextToLines(rawText) {
    const paragraphLines = rawText.split('\n');
    const finalLines = [];

    for (const lineStr of paragraphLines) {
      if (!lineStr.trim()) {
        finalLines.push([]);
        continue;
      }

      // Tokenize paragraph line into words (split by spaces)
      const words = lineStr.split(' ');
      let currentLineTokens = [];

      for (let wIdx = 0; wIdx < words.length; wIdx++) {
        const word = words[wIdx];
        const wordTokens = this.tokenizeLine(word);

        if (wordTokens.length === 0) continue;

        // Space token before word if line is not empty
        const spaceNeeded = currentLineTokens.length > 0 ? 1 : 0;
        const totalWordLen = wordTokens.length + spaceNeeded;

        if (currentLineTokens.length + totalWordLen <= BOARD_COLS) {
          if (spaceNeeded) {
            currentLineTokens.push({ type: 'char', val: ' ', length: 1 });
          }
          currentLineTokens.push(...wordTokens);
        } else {
          // Word doesn't fit on current line
          if (currentLineTokens.length > 0) {
            finalLines.push(currentLineTokens);
            currentLineTokens = [];
          }

          // If word itself is longer than 22 characters, slice it
          if (wordTokens.length > BOARD_COLS) {
            let offset = 0;
            while (offset < wordTokens.length) {
              const chunk = wordTokens.slice(offset, offset + BOARD_COLS);
              finalLines.push(chunk);
              offset += BOARD_COLS;
            }
          } else {
            currentLineTokens.push(...wordTokens);
          }
        }
      }

      if (currentLineTokens.length > 0) {
        finalLines.push(currentLineTokens);
      }
    }

    return finalLines.slice(0, BOARD_ROWS);
  }

  /**
   * Formats raw text into a 6x22 matrix grid with horizontal & vertical auto-centering.
   */
  static formatTextToMatrix(rawText, alignMode = 'center') {
    const lineTokens = this.wrapTextToLines(rawText);

    // Create empty 6x22 matrix initialized with blank spaces
    const matrix = Array.from({ length: BOARD_ROWS }, () =>
      Array.from({ length: BOARD_COLS }, () => ({ char: ' ', isColor: false, colorClass: '' }))
    );

    if (alignMode === 'left') {
      // Top-Left Alignment
      lineTokens.forEach((line, rIdx) => {
        line.forEach((tok, cIdx) => {
          if (cIdx < BOARD_COLS) {
            if (tok.type === 'color') {
              matrix[rIdx][cIdx] = { char: ' ', isColor: true, colorClass: tok.val };
            } else {
              matrix[rIdx][cIdx] = { char: tok.val, isColor: false, colorClass: '' };
            }
          }
        });
      });
    } else {
      // Auto Center Alignment (Default)
      const numLines = lineTokens.length;
      const startRow = Math.max(0, Math.floor((BOARD_ROWS - numLines) / 2));

      lineTokens.forEach((line, lineIdx) => {
        const targetRow = startRow + lineIdx;
        if (targetRow >= BOARD_ROWS) return;

        const lineLen = line.length;
        const startCol = Math.max(0, Math.floor((BOARD_COLS - lineLen) / 2));

        line.forEach((tok, tokIdx) => {
          const targetCol = startCol + tokIdx;
          if (targetCol >= BOARD_COLS) return;

          if (tok.type === 'color') {
            matrix[targetRow][targetCol] = { char: ' ', isColor: true, colorClass: tok.val };
          } else {
            matrix[targetRow][targetCol] = { char: tok.val, isColor: false, colorClass: '' };
          }
        });
      });
    }

    return matrix;
  }

  /**
   * Deterministically select a Daily Quote from quotes list based on current YYYY-MM-DD date.
   */
  static getDailyQuote(quotesList) {
    if (!quotesList || quotesList.length === 0) return null;
    const today = new Date().toISOString().slice(0, 10);
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = (hash << 5) - hash + today.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % quotesList.length;
    return quotesList[index];
  }

  /**
   * Generate Live Time String formatted for Flippboard Clock Mode.
   */
  static getClockMessage() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    
    return `{blue}{blue}{blue} TIME & DATE {blue}{blue}{blue}\n\n    ${timeStr}\n  ${dateStr}\n\n{violet}{violet}{violet}{violet}{violet}{violet}{violet}{violet}{violet}{violet}{violet}`;
  }
}

// Backwards compatibility export
export const VestaboardEngine = FlippboardEngine;
