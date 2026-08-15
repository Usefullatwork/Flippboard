/**
 * Settings & custom-quote persistence (localStorage).
 */
const SETTINGS_KEY = 'vestaboard_settings';
const QUOTES_KEY = 'vestaboard_custom_quotes';

export const DEFAULT_SETTINGS = {
  rows: 6,
  cols: 22,
  scale: 1,
  fillViewport: false,
  backdrop: 'dark-studio',
  frameTheme: 'obsidian',
  font: 'outfit',
  align: 'center',
  speed: 'realistic',
  audioEnabled: true,
  audioVolume: 0.5,
  idleTimeout: 60,
  updateCheck: true
};

export function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadCustomQuotes() {
  const raw = localStorage.getItem(QUOTES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    // fall through to stash
  }
  // Unreadable or wrong shape: preserve the raw value so a later save
  // can't silently destroy the user's quote store
  localStorage.setItem(`${QUOTES_KEY}_corrupt`, raw);
  return [];
}

export function saveCustomQuotes(list) {
  localStorage.setItem(QUOTES_KEY, JSON.stringify(list));
}
