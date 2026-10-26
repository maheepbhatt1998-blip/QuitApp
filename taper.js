// Taper schedule math. Pure functions, no DOM, no storage.
import { daysBetween, addDays } from './dates.js';

// Number of taper days: day 0 = startDate (full baseline), day N = quitDate (zero).
export function taperLength(settings) {
  return daysBetween(settings.startDate, settings.quitDate);
}

// Days per step. Heavy users step down daily; light users hold each level 2-3 days.
export function stepLength(baseline, N) {
  if (N <= 0 || baseline <= 0) return 1;
  return Math.max(1, Math.min(3, Math.round(N / baseline)));
}

// Allowance on a given day index of the taper. Never below 1 until the quit day itself.
export function allowanceAt(dayIndex, baseline, N) {
  if (N <= 0 || dayIndex >= N) return 0;
  if (dayIndex <= 0) return Math.max(0, Math.round(baseline));
  const s = stepLength(baseline, N);
  const stepped = Math.floor(dayIndex / s) * s;
  return Math.max(1, Math.round(baseline * (1 - stepped / N)));
}

export function allowanceFor(key, settings, product) {
  const N = taperLength(settings);
  const d = daysBetween(settings.startDate, key);
  const base = settings.products[product].baseline;
  return allowanceAt(d, base, N);
}

// Full schedule for charts: [{dayIndex, key, allowance}] from start to quit date inclusive.
export function schedule(settings, product) {
  const N = taperLength(settings);
  const base = settings.products[product].baseline;
  const out = [];
  for (let d = 0; d <= Math.max(0, N); d++) {
    out.push({ dayIndex: d, key: addDays(settings.startDate, d), allowance: allowanceAt(d, base, N) });
  }
  return out;
}

export function phaseFor(key, settings) {
  return daysBetween(key, settings.quitDate) > 0 ? 'taper' : 'quit';
}

// When is the next use "allowed" under scheduled spacing?
// Remaining uses are spread evenly between the last use and bedtime.
export function nextAllowedAt({ nowMs, lastUseMs, remaining, wakeMs, sleepMs }) {
  if (remaining <= 0) return { status: 'done' };
  if (nowMs >= sleepMs) return { status: 'done' };
  if (lastUseMs == null || lastUseMs < wakeMs) {
    return nowMs >= wakeMs ? { status: 'now', at: nowMs } : { status: 'wait', at: wakeMs };
  }
  const interval = (sleepMs - lastUseMs) / (remaining + 1);
  const at = lastUseMs + interval;
  return at <= nowMs ? { status: 'now', at, interval } : { status: 'wait', at, interval };
}
