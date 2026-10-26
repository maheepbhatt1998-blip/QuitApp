// Local-date helpers. Days are keyed as 'YYYY-MM-DD' in the device's local time zone.

export const DAY_MS = 86400000;

export function pad2(n) { return String(n).padStart(2, '0'); }

export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d); // local midnight
}

export function startOfDayMs(key) { return parseKey(key).getTime(); }

export function addDays(key, n) {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

// Whole days from a to b (b - a). Rounds so 23h / 25h DST days still count as one day.
export function daysBetween(a, b) {
  return Math.round((parseKey(b) - parseKey(a)) / DAY_MS);
}

export function minutesOfDay(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

// Epoch ms for a local 'HH:MM' on a given day key.
export function atTime(key, hhmm) {
  const d = parseKey(key);
  const mins = minutesOfDay(hhmm);
  d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  return d.getTime();
}

export function fmtDuration(ms, { short = false } = {}) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d >= 1) return short ? `${d}d` : `${d}d ${h}h`;
  if (h >= 1) return short ? `${h}h` : `${h}h ${m}m`;
  if (m >= 1) return short ? `${m}m` : `${m}m ${sec}s`;
  return `${sec}s`;
}

export function fmtDurationLong(ms) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d >= 365) { const y = Math.floor(d / 365); return `${y} year${y > 1 ? 's' : ''}`; }
  if (d >= 60) { const mo = Math.floor(d / 30); return `${mo} months`; }
  if (d >= 14) { const w = Math.floor(d / 7); return `${w} weeks`; }
  if (d >= 1) return `${d} day${d > 1 ? 's' : ''}`;
  if (h >= 1) return `${h} hour${h > 1 ? 's' : ''}`;
  return `${m} minute${m !== 1 ? 's' : ''}`;
}

export function fmtClock(ms) {
  const d = new Date(ms);
  let h = d.getHours();
  const m = pad2(d.getMinutes());
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
}

export function fmtDate(key) {
  const d = parseKey(key);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
