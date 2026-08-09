// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  loadCustomQuotes,
  saveCustomQuotes
} from '../src/core/settings.js';

beforeEach(() => localStorage.clear());

describe('settings persistence', () => {
  it('returns defaults when nothing is stored', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('merges stored values over defaults (partial store)', () => {
    localStorage.setItem('vestaboard_settings', JSON.stringify({ rows: 10, cols: 40 }));
    const s = loadSettings();
    expect(s.rows).toBe(10);
    expect(s.cols).toBe(40);
    expect(s.font).toBe(DEFAULT_SETTINGS.font);
  });

  it('falls back to defaults on corrupt JSON', () => {
    localStorage.setItem('vestaboard_settings', '{not json');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('round-trips through saveSettings', () => {
    const s = { ...DEFAULT_SETTINGS, scale: 1.8, backdrop: 'pitch-black' };
    saveSettings(s);
    expect(loadSettings()).toEqual(s);
  });
});

describe('custom quote persistence', () => {
  it('returns [] when nothing is stored', () => {
    expect(loadCustomQuotes()).toEqual([]);
  });

  it('round-trips a quote list', () => {
    const quotes = [{ id: 'custom-1', text: 'HI', author: 'ME', category: 'custom', active: true }];
    saveCustomQuotes(quotes);
    expect(loadCustomQuotes()).toEqual(quotes);
  });

  it('stashes corrupt data instead of silently discarding it', () => {
    localStorage.setItem('vestaboard_custom_quotes', '{broken!!');
    expect(loadCustomQuotes()).toEqual([]);
    expect(localStorage.getItem('vestaboard_custom_quotes_corrupt')).toBe('{broken!!');
  });

  it('stashes valid-JSON-but-wrong-shape data too', () => {
    localStorage.setItem('vestaboard_custom_quotes', '{"not":"an array"}');
    expect(loadCustomQuotes()).toEqual([]);
    expect(localStorage.getItem('vestaboard_custom_quotes_corrupt')).toBe('{"not":"an array"}');
  });
});
