// Progress statistics. Pure functions over the use log, craving log and settings.
import { dayKey, daysBetween, addDays, startOfDayMs } from './dates.js';

export function enabledProducts(settings) {
  return Object.keys(settings.products).filter(k => settings.products[k].enabled);
}

export function usesOnDay(uses, key, product = null) {
  let n = 0;
  for (const u of uses) {
    if (product && u.product !== product) continue;
    if (dayKey(new Date(u.t)) === key) n++;
  }
  return n;
}

export function lastUseMs(uses, product = null) {
  let last = null;
  for (const u of uses) {
    if (product && u.product !== product) continue;
    if (last == null || u.t > last) last = u.t;
  }
  return last;
}

// Cost of one cigarette or one vape session.
export function unitCost(settings, product) {
  const p = settings.products[product];
  if (product === 'cig') return p.perPack > 0 ? p.packPrice / p.perPack : 0;
  const sessions = (p.unitDays || 0) * (p.baseline || 0);
  return sessions > 0 ? p.unitPrice / sessions : 0;
}

// Fractional days elapsed since the moment the taper started (falls back to midnight of the start date).
export function elapsedDays(settings, nowMs) {
  const startedAt = settings.startedAt || startOfDayMs(settings.startDate);
  return Math.max(0, (nowMs - startedAt) / 86400000);
}

// Uses avoided compared with baseline: what you would have used since starting, minus what you logged.
export function unitsAvoided(uses, settings, nowMs) {
  const days = elapsedDays(settings, nowMs);
  const out = {};
  for (const prod of enabledProducts(settings)) {
    const expected = settings.products[prod].baseline * days;
    let actual = 0;
    for (const u of uses) if (u.product === prod) actual++;
    out[prod] = Math.max(0, expected - actual);
  }
  return out;
}

// Money not spent, using the same accounting as unitsAvoided.
export function moneySaved(uses, settings, nowMs) {
  const avoided = unitsAvoided(uses, settings, nowMs);
  let total = 0;
  for (const prod of Object.keys(avoided)) total += avoided[prod] * unitCost(settings, prod);
  return total;
}

// Moment the current smoke-free stretch started.
export function smokeFreeSince(uses, settings) {
  const last = lastUseMs(uses);
  const quitStart = startOfDayMs(settings.quitDate);
  if (last == null) return quitStart;
  return last;
}

// Clean-day streaks counted from the quit date. Today counts if nothing has been logged yet.
export function streaks(uses, settings, nowMs) {
  const today = dayKey(new Date(nowMs));
  const n = daysBetween(settings.quitDate, today);
  if (n < 0) return { current: 0, longest: 0 };
  const quitStart = startOfDayMs(settings.quitDate);
  const useDays = new Set();
  for (const u of uses) if (u.t >= quitStart) useDays.add(dayKey(new Date(u.t)));
  let longest = 0, run = 0;
  for (let i = 0; i <= n; i++) {
    const k = addDays(settings.quitDate, i);
    if (useDays.has(k)) run = 0; else { run++; if (run > longest) longest = run; }
  }
  return { current: run, longest };
}

// Percent below baseline over the last `windowDays` days (or since the start, if that is shorter).
export function reductionPct(uses, settings, nowMs, windowDays = 7) {
  const days = Math.min(windowDays, elapsedDays(settings, nowMs));
  if (days <= 0) return 0;
  const since = nowMs - days * 86400000;
  let expected = 0, actual = 0;
  for (const prod of enabledProducts(settings)) {
    expected += settings.products[prod].baseline * days;
    for (const u of uses) if (u.product === prod && u.t >= since) actual++;
  }
  return expected > 0 ? Math.max(0, (1 - actual / expected) * 100) : 0;
}

// Days from start through today where every enabled product stayed at or under its allowance.
export function onTargetDays(uses, settings, nowMs, allowanceFn) {
  const today = dayKey(new Date(nowMs));
  const n = daysBetween(settings.startDate, today);
  let count = 0;
  for (let i = 0; i <= n; i++) {
    const k = addDays(settings.startDate, i);
    let ok = true;
    for (const prod of enabledProducts(settings)) {
      if (usesOnDay(uses, k, prod) > allowanceFn(k, settings, prod)) { ok = false; break; }
    }
    if (ok) count++;
  }
  return count;
}

// Per-day series for the taper chart: [{key, used, allowance}] start -> today (or quit date if later).
export function dailySeries(uses, settings, product, nowMs, allowanceFn) {
  const today = dayKey(new Date(nowMs));
  const end = Math.max(daysBetween(settings.startDate, today), daysBetween(settings.startDate, settings.quitDate));
  const out = [];
  for (let i = 0; i <= end; i++) {
    const k = addDays(settings.startDate, i);
    const future = daysBetween(today, k) > 0;
    out.push({ key: k, used: future ? null : usesOnDay(uses, k, product), allowance: allowanceFn(k, settings, product) });
  }
  return out;
}

export function cravingStats(cravings) {
  const byHour = Array(24).fill(0);
  const byTrigger = {};
  let beaten = 0, dropSum = 0, dropN = 0;
  for (const c of cravings) {
    if (c.outcome === 'passed') beaten++;
    byHour[new Date(c.t).getHours()]++;
    const tr = c.trigger || 'other';
    byTrigger[tr] = (byTrigger[tr] || 0) + 1;
    if (typeof c.intensityBefore === 'number' && typeof c.intensityAfter === 'number') {
      dropSum += c.intensityBefore - c.intensityAfter; dropN++;
    }
  }
  return { total: cravings.length, beaten, byHour, byTrigger, avgDrop: dropN ? dropSum / dropN : null };
}

export function milestoneStatus(list, sinceMs, nowMs) {
  const elapsed = Math.max(0, nowMs - sinceMs);
  return list.map(m => ({ ...m, reached: elapsed >= m.afterMs, remainingMs: Math.max(0, m.afterMs - elapsed) }));
}
