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
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
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
