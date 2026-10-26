// Persistence: one JSON blob in localStorage, plus export/import for backups.
const KEY = 'quitapp.v1';

export function defaultState() {
  return { version: 1, settings: null, uses: [], cravings: [], lessons: {}, celebrated: [], createdAt: Date.now() };
}

export function normalize(obj) {
  const s = { ...defaultState(), ...(obj || {}) };
  if (!Array.isArray(s.uses)) s.uses = [];
  if (!Array.isArray(s.cravings)) s.cravings = [];
  if (!Array.isArray(s.celebrated)) s.celebrated = [];
  if (!s.lessons || typeof s.lessons !== 'object') s.lessons = {};
  if (s.settings && (!s.settings.products || !s.settings.quitDate || !s.settings.startDate)) s.settings = null;
  s.uses.sort((a, b) => a.t - b.t);
  return s;
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    return normalize(JSON.parse(raw));
  } catch (e) {
    console.warn('Could not read saved data', e);
    return defaultState();
  }
}

export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
  catch (e) { console.warn('Could not save', e); return false; }
}

export function clear() {
  try { localStorage.removeItem(KEY); localStorage.removeItem(UI_KEY); } catch { /* ignore */ }
}

// Where the user left off: screen, open lesson, unsaved draft, scroll positions, an in-progress SOS flow.
// Kept apart from the data so a bad UI snapshot can never take the data down with it.
const UI_KEY = 'quitapp.ui';
export function loadUI() {
  try { return JSON.parse(localStorage.getItem(UI_KEY)) || {}; } catch { return {}; }
}
export function saveUI(ui) {
  try { localStorage.setItem(UI_KEY, JSON.stringify(ui)); } catch { /* ignore */ }
}

// True when this browser will actually keep what we write.
export function probeStorage() {
  try { localStorage.setItem('quitapp.probe', '1'); localStorage.removeItem('quitapp.probe'); return true; }
  catch { return false; }
}

export function exportJSON(state) {
  return JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
}

export function importJSON(text) {
  const obj = JSON.parse(text);
  if (!obj || typeof obj !== 'object' || !('settings' in obj) || !('uses' in obj)) {
    throw new Error('That file is not a Quit backup.');
  }
  return normalize(obj);
}
