// Assertions for the pure math modules. Run with tests.html in a browser or `node run-tests.mjs`.
import * as D from './dates.js';
import * as T from './taper.js';
import * as S from './stats.js';

export function runTests() {
  const results = [];
  const eq = (name, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    results.push({ name, ok, got, want });
  };
  const ok = (name, cond, info) => results.push({ name, ok: !!cond, got: info, want: true });

  // dates
  eq('daysBetween simple', D.daysBetween('2026-10-01', '2026-10-25'), 24);
  eq('daysBetween across spring DST', D.daysBetween('2026-03-07', '2026-03-09'), 2);
  eq('daysBetween across autumn DST', D.daysBetween('2026-10-31', '2026-11-02'), 2);
  eq('addDays month roll', D.addDays('2026-10-30', 3), '2026-11-02');
  eq('minutesOfDay', D.minutesOfDay('07:30'), 450);
  eq('fmtDuration days', D.fmtDuration(3 * 86400000 + 4 * 3600000), '3d 4h');
  eq('fmtDuration minutes', D.fmtDuration(125000), '2m 5s');

  // taper allowance
  eq('allowance day0 = baseline', T.allowanceAt(0, 20, 28), 20);
  eq('allowance quit day = 0', T.allowanceAt(28, 20, 28), 0);
  eq('allowance after quit = 0', T.allowanceAt(40, 20, 28), 0);
  ok('allowance day before quit >= 1', T.allowanceAt(27, 20, 28) >= 1, T.allowanceAt(27, 20, 28));
  ok('allowance day before quit >= 1 (light user)', T.allowanceAt(27, 5, 28) >= 1, T.allowanceAt(27, 5, 28));
  eq('N=0 always zero', T.allowanceAt(0, 20, 0), 0);
  eq('N=1 day0', T.allowanceAt(0, 20, 1), 20);
  eq('N=1 day1', T.allowanceAt(1, 20, 1), 0);
  for (const [b, N] of [[20, 28], [5, 28], [10, 14], [30, 56], [3, 21], [1, 10], [40, 7]]) {
    let mono = true, prev = Infinity;
    for (let d = 0; d <= N + 2; d++) { const a = T.allowanceAt(d, b, N); if (a > prev) mono = false; prev = a; }
    ok(`monotone non-increasing b=${b} N=${N}`, mono);
    ok(`reaches zero b=${b} N=${N}`, T.allowanceAt(N, b, N) === 0);
    ok(`starts at baseline b=${b} N=${N}`, T.allowanceAt(0, b, N) === b);
  }
  eq('stepLength heavy user daily', T.stepLength(20, 28), 1);
  eq('stepLength light user 3-day', T.stepLength(5, 28), 3);

  const settings = {
    startDate: '2026-10-01', quitDate: '2026-10-29', wake: '07:00', sleep: '23:00', currency: 'USD',
    products: {
      cig: { enabled: true, baseline: 20, packPrice: 10, perPack: 20 },
      vape: { enabled: true, baseline: 10, unitPrice: 20, unitDays: 5 },
    },
  };
  eq('taperLength', T.taperLength(settings), 28);
  eq('allowanceFor start', T.allowanceFor('2026-10-01', settings, 'cig'), 20);
  eq('allowanceFor quit', T.allowanceFor('2026-10-29', settings, 'cig'), 0);
  eq('phase taper', T.phaseFor('2026-10-15', settings), 'taper');
  eq('phase quit on quit day', T.phaseFor('2026-10-29', settings), 'quit');
  eq('phase quit after', T.phaseFor('2026-11-05', settings), 'quit');
  eq('schedule length', T.schedule(settings, 'cig').length, 29);

  // next allowed
  const wake = D.atTime('2026-10-10', '07:00'), sleep = D.atTime('2026-10-10', '23:00');
  eq('next: before wake, none used', T.nextAllowedAt({ nowMs: wake - 3600000, lastUseMs: null, remaining: 10, wakeMs: wake, sleepMs: sleep }).status, 'wait');
  eq('next: after wake, none used', T.nextAllowedAt({ nowMs: wake + 60000, lastUseMs: null, remaining: 10, wakeMs: wake, sleepMs: sleep }).status, 'now');
  eq('next: none remaining', T.nextAllowedAt({ nowMs: wake + 60000, lastUseMs: wake, remaining: 0, wakeMs: wake, sleepMs: sleep }).status, 'done');
  {
    const last = D.atTime('2026-10-10', '12:00');
    const r = T.nextAllowedAt({ nowMs: last + 60000, lastUseMs: last, remaining: 10, wakeMs: wake, sleepMs: sleep });
    // 11 hours left, 10 remaining -> interval 1 hour
    eq('next: interval spreads evenly', Math.round(r.interval / 60000), 60);
    eq('next: at = last + interval', r.at, last + 3600000);
    eq('next: status wait', r.status, 'wait');
  }
  eq('next: past bedtime', T.nextAllowedAt({ nowMs: sleep + 1, lastUseMs: null, remaining: 5, wakeMs: wake, sleepMs: sleep }).status, 'done');

  // stats
  const now = D.atTime('2026-10-02', '20:00'); // 2 days inclusive since start
  const uses = [];
  for (let i = 0; i < 10; i++) uses.push({ t: D.atTime('2026-10-01', '08:00') + i * 3600000, product: 'cig', kind: 'use' });
  eq('unitCost cig', S.unitCost(settings, 'cig'), 0.5);
  eq('unitCost vape', S.unitCost(settings, 'vape'), 0.4);
  // elapsed since Oct 1 00:00 = 44h = 1.8333 days
  // cig: expected 36.67, used 10 -> 26.67 x 0.5 = 13.33 ; vape: expected 18.33, used 0 -> 18.33 x 0.4 = 7.33
  eq('elapsedDays', +S.elapsedDays(settings, now).toFixed(4), 1.8333);
  eq('moneySaved', +S.moneySaved(uses, settings, now).toFixed(2), 20.67);
  const av = S.unitsAvoided(uses, settings, now);
  eq('unitsAvoided', { cig: +av.cig.toFixed(2), vape: +av.vape.toFixed(2) }, { cig: 26.67, vape: 18.33 });
  eq('moneySaved uses startedAt', S.moneySaved([], { ...settings, startedAt: now - 12 * 3600000 }, now), 10 * 0.5 + 5 * 0.4);
  const tiny = S.moneySaved(uses, { ...settings, startedAt: now - 60000 }, now);
  ok('moneySaved never negative, near zero right after start', tiny >= 0 && tiny < 0.01, tiny);
  eq('usesOnDay', S.usesOnDay(uses, '2026-10-01', 'cig'), 10);
  eq('usesOnDay other day', S.usesOnDay(uses, '2026-10-02', 'cig'), 0);
  // 1.8333 days elapsed: expected (20 + 10) x 1.8333 = 55, actual 10 -> 81.8%
  eq('reductionPct since start', Math.round(S.reductionPct(uses, settings, now)), 82);
  eq('reductionPct capped at window', Math.round(S.reductionPct([], { ...settings, startedAt: now - 30 * 86400000 }, now)), 100);

  // streaks: quit 10-29, now 11-03, slip on 10-31 -> clean 29,30 (2), slip 31, clean 1,2,3 (3)
  {
    const slip = [{ t: D.atTime('2026-10-31', '21:00'), product: 'cig', kind: 'slip' }];
    const st = S.streaks(slip, settings, D.atTime('2026-11-03', '10:00'));
    eq('streaks', st, { current: 3, longest: 3 });
    const st2 = S.streaks([], settings, D.atTime('2026-11-03', '10:00'));
    eq('streaks no slips', st2, { current: 6, longest: 6 });
    eq('streaks before quit', S.streaks([], settings, D.atTime('2026-10-20', '10:00')), { current: 0, longest: 0 });
    eq('smokeFreeSince with slip', S.smokeFreeSince(slip, settings), slip[0].t);
    eq('smokeFreeSince no uses', S.smokeFreeSince([], settings), D.startOfDayMs('2026-10-29'));
  }

  // on-target days: day0 allowance 20, used 10 -> ok; day1 used 0 -> ok
  eq('onTargetDays', S.onTargetDays(uses, settings, now, T.allowanceFor), 2);

  // cravings
  const cr = [
    { t: D.atTime('2026-10-01', '09:10'), trigger: 'coffee', intensityBefore: 8, intensityAfter: 3, outcome: 'passed' },
    { t: D.atTime('2026-10-01', '09:50'), trigger: 'coffee', intensityBefore: 6, intensityAfter: 6, outcome: 'used' },
    { t: D.atTime('2026-10-01', '21:00'), trigger: 'bored', intensityBefore: 5, intensityAfter: 1, outcome: 'passed' },
  ];
  const cs = S.cravingStats(cr);
  eq('cravings total', cs.total, 3);
  eq('cravings beaten', cs.beaten, 2);
  eq('cravings byTrigger', cs.byTrigger, { coffee: 2, bored: 1 });
  eq('cravings byHour 9', cs.byHour[9], 2);
  eq('cravings avgDrop', cs.avgDrop, 3);

  // milestones
  const ms = S.milestoneStatus([{ afterMs: 1000, title: 'a' }, { afterMs: 5000, title: 'b' }], 0, 2000);
  eq('milestone reached', ms[0].reached, true);
  eq('milestone pending', ms[1].reached, false);
  eq('milestone remaining', ms[1].remainingMs, 3000);

  return results;
}
