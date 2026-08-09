// Node >=24 defines an experimental global localStorage getter that returns
// undefined (unless --localstorage-file is passed) and it shadows jsdom's
// storage during vitest's global population. Replace it with a spec-shaped
// in-memory Storage so bare `localStorage` references in src/ work under test.
class MemoryStorage {
  constructor() {
    this._data = new Map();
  }
  get length() {
    return this._data.size;
  }
  key(i) {
    return [...this._data.keys()][i] ?? null;
  }
  getItem(k) {
    return this._data.has(String(k)) ? this._data.get(String(k)) : null;
  }
  setItem(k, v) {
    this._data.set(String(k), String(v));
  }
  removeItem(k) {
    this._data.delete(String(k));
  }
  clear() {
    this._data.clear();
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: new MemoryStorage(),
  configurable: true
});
