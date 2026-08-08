import { VestaboardEngine, BOARD_ROWS, BOARD_COLS } from '../core/VestaboardEngine.js';
import { PRESET_PATTERNS } from '../data/quoteLibrary.js';

export class QuoteManagerComponent {
  constructor(options) {
    this.curatedQuotes = options.curatedQuotes || [];
    this.customQuotes = options.customQuotes || [];
    this.onSelectQuote = options.onSelectQuote;
    this.onSaveCustomQuote = options.onSaveCustomQuote;
    this.onDeleteCustomQuote = options.onDeleteCustomQuote;
    this.onExportImport = options.onExportImport;

    this.activeCategory = 'all';
    this.searchQuery = '';
    this.editingQuoteId = null;

    this.bindDOM();
  }

  bindDOM() {
    this.modalEl = document.getElementById('modal-quote-library');
    const openBtn = document.getElementById('btn-manage-quotes');
    const closeBtns = this.modalEl.querySelectorAll('.modal-close');

    openBtn.addEventListener('click', () => {
      this.open();
    });

    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.close();
      });
    });

    // Tab Switching
    const tabBtns = this.modalEl.querySelectorAll('.tab-btn');
    const tabContents = this.modalEl.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const targetTabId = btn.dataset.tab;
        const targetContent = document.getElementById(targetTabId);
        if (targetContent) targetContent.classList.add('active');

        if (targetTabId === 'tab-custom') {
          this.renderCustomQuotes();
        }
      });
    });

    // Category Filter Chips
    const chips = document.querySelectorAll('#category-filter-chips .chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeCategory = chip.dataset.category;
        this.renderCuratedQuotes();
      });
    });

    // Search Input
    const searchInput = document.getElementById('search-quotes-input');
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderCuratedQuotes();
    });

    // Compose Form & Palette buttons
    const composeText = document.getElementById('compose-text');
    const charCounter = document.getElementById('char-counter');
    const miniBoard = document.getElementById('mini-board-preview');
    const tileBtns = document.querySelectorAll('.tile-btn');

    // Init mini board preview grid
    this.initMiniBoard(miniBoard);

    const updatePreview = () => {
      const val = composeText.value;
      charCounter.textContent = val.length;
      this.updateMiniBoardPreview(miniBoard, val);
    };

    composeText.addEventListener('input', updatePreview);

    tileBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const colorCode = btn.dataset.color;
        composeText.value += colorCode;
        updatePreview();
        composeText.focus();
      });
    });

    // Form submission
    const composeForm = document.getElementById('compose-quote-form');
    composeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = composeText.value.trim();
      const author = document.getElementById('compose-author').value.trim() || 'Custom';
      const category = document.getElementById('compose-category').value;

      if (text) {
        const quoteObj = {
          id: this.editingQuoteId || `custom-${Date.now()}`,
          category,
          text,
          author,
          active: true
        };

        if (this.onSaveCustomQuote) this.onSaveCustomQuote(quoteObj);
        
        this.editingQuoteId = null;
        composeText.value = '';
        document.getElementById('compose-author').value = '';
        updatePreview();
        alert('Quote saved to your personal library!');
      }
    });

    // Quick Flip Preview Button
    document.getElementById('btn-preview-flip').addEventListener('click', () => {
      const text = composeText.value.trim();
      if (text && this.onSelectQuote) {
        this.onSelectQuote({ text, author: 'Live Preview', category: 'custom' });
        this.close();
      }
    });

    // Export / Import
    const exportBtn = document.getElementById('btn-export-quotes');
    const importInput = document.getElementById('btn-import-quotes');

    exportBtn.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.customQuotes, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "vestaboard_custom_quotes.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });

    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (Array.isArray(imported) && this.onExportImport) {
            this.onExportImport(imported);
            alert(`Successfully imported ${imported.length} custom quotes!`);
          }
        } catch (err) {
          alert('Invalid JSON file format.');
        }
      };
      reader.readAsText(file);
    });

    this.renderCuratedQuotes();
  }

  open() {
    this.modalEl.classList.remove('hidden');
    this.renderCuratedQuotes();
  }

  close() {
    this.modalEl.classList.add('hidden');
  }

  renderCuratedQuotes() {
    const listEl = document.getElementById('curated-quotes-list');
    listEl.innerHTML = '';

    const filtered = this.curatedQuotes.filter(q => {
      const matchCat = this.activeCategory === 'all' || q.category === this.activeCategory;
      const matchSearch = !this.searchQuery || 
        q.text.toLowerCase().includes(this.searchQuery) || 
        (q.author && q.author.toLowerCase().includes(this.searchQuery));
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="empty-state">No quotes match your filter criteria.</div>`;
      return;
    }

    filtered.forEach(q => {
      const card = this.createQuoteCard(q);
      listEl.appendChild(card);
    });
  }

  renderCustomQuotes() {
    const listEl = document.getElementById('saved-quotes-list');
    listEl.innerHTML = '';

    if (this.customQuotes.length === 0) {
      listEl.innerHTML = `<div class="empty-state">No saved custom messages yet. Use the Compose tab to create one!</div>`;
      return;
    }

    this.customQuotes.forEach(q => {
      const card = this.createQuoteCard(q, true);
      listEl.appendChild(card);
    });
  }

  createQuoteCard(quote, isCustom = false) {
    const card = document.createElement('div');
    card.className = 'quote-card';
    
    const actionsHTML = isCustom ? `
      <div class="card-actions">
        <button class="btn-icon-small btn-edit" title="Edit Quote">✏️</button>
        <button class="btn-icon-small btn-delete" title="Delete Quote">🗑️</button>
      </div>
    ` : '';

    card.innerHTML = `
      <div class="quote-card-header">
        <span class="category-pill">${quote.category || 'general'}</span>
        ${actionsHTML}
      </div>
      <div class="quote-card-text">${this.formatDisplayText(quote.text)}</div>
      <div class="quote-card-meta">
        <span>— ${quote.author || 'Unknown'}</span>
        <button class="btn btn-small btn-secondary btn-flip-now">Flip Now</button>
      </div>
    `;

    // Flip Now
    card.querySelector('.btn-flip-now').addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.onSelectQuote) {
        this.onSelectQuote(quote);
      }
      this.close();
    });

    if (isCustom) {
      // Edit
      card.querySelector('.btn-edit').addEventListener('click', (e) => {
        e.stopPropagation();
        this.editingQuoteId = quote.id;
        document.getElementById('compose-text').value = quote.text;
        document.getElementById('compose-author').value = quote.author || '';
        document.getElementById('compose-category').value = quote.category || 'custom';
        
        // Trigger tab switch to composer
        const composeTabBtn = this.modalEl.querySelector('.tab-btn[data-tab="tab-compose"]');
        if (composeTabBtn) composeTabBtn.click();
      });

      // Delete
      card.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this custom quote?')) {
          if (this.onDeleteCustomQuote) this.onDeleteCustomQuote(quote.id);
          this.renderCustomQuotes();
        }
      });
    }

    return card;
  }

  formatDisplayText(text) {
    return text.replace(/\{(red|orange|yellow|green|blue|violet|white|black)\}/g, '[TILE]');
  }

  initMiniBoard(container) {
    container.innerHTML = '';
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const miniFlap = document.createElement('div');
        miniFlap.className = 'mini-flap';
        miniFlap.id = `mini-f-${r}-${c}`;
        container.appendChild(miniFlap);
      }
    }
  }

  updateMiniBoardPreview(container, rawText) {
    const matrix = VestaboardEngine.formatTextToMatrix(rawText);
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const cell = matrix[r][c];
        const flap = container.querySelector(`#mini-f-${r}-${c}`);
        if (flap) {
          flap.style.background = cell.isColor ? this.getColorHex(cell.colorClass) : '#222';
          flap.textContent = cell.isColor ? '' : cell.char;
        }
      }
    }
  }

  getColorHex(className) {
    const map = {
      'tile-red': '#e63946',
      'tile-orange': '#f77f00',
      'tile-yellow': '#fcbf49',
      'tile-green': '#2a9d8f',
      'tile-blue': '#1d3557',
      'tile-violet': '#7209b7',
      'tile-white': '#e0e1dd',
      'tile-black': '#111111'
    };
    return map[className] || '#222';
  }
}
