// Things that feel rewarding without being prizes: a plant that grows, celebrations, encouragement.
import { BADGES } from './content/health.js';

export const ENCOURAGEMENTS = [
  'Every craving you ride out weakens the loop a little.',
  'You are not giving something up. You are getting things back.',
  'Receptors are resetting whether you feel it or not.',
  'A plan beats willpower. You have a plan.',
  'Slow is fine. Forward is the only direction that matters.',
  'The craving is loud because it is losing.',
  'You have already proven you can wait. Keep waiting.',
  'Notice what is easier today than it was a week ago.',
  'Smoking never fixed anything. It only paused the withdrawal it caused.',
  'Three minutes. Most cravings do not survive three minutes.',
  'You are becoming someone who does not smoke. That is who you are now.',
  'The money is real. The breath is real. The freedom is real.',
  'One day on target is a win. String a few together and it becomes who you are.',
  'A slip is a data point, not a verdict.',
];

export function dailyEncouragement(key) {
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return ENCOURAGEMENTS[h % ENCOURAGEMENTS.length];
}

export const GROWTH_STAGES = [
  { min: 0, name: 'Seed planted' },
  { min: 1, name: 'First sprout' },
  { min: 3, name: 'Seedling' },
  { min: 7, name: 'Growing' },
  { min: 14, name: 'Leafy' },
  { min: 28, name: 'Blooming' },
  { min: 100, name: 'Thriving' },
];

export function growthStage(days) {
  let s = 0;
  GROWTH_STAGES.forEach((g, i) => { if (days >= g.min) s = i; });
  return s;
}

export function nextGrowth(days) {
  return GROWTH_STAGES.find(g => g.min > days) || null;
}

export function plantSVG(stage) {
  stage = Math.max(0, Math.min(GROWTH_STAGES.length - 1, stage));
  const stemTop = [148, 125, 108, 88, 68, 56, 44][stage];
  const leafCount = [0, 2, 2, 4, 6, 6, 8][stage];
  const leafSize = [0, 7, 10, 12, 13, 14, 15][stage];
  const flowers = [0, 0, 0, 0, 0, 1, 3][stage];
  let s = `<svg viewBox="0 0 200 200" class="plant-svg" aria-hidden="true">`;
  s += `<path d="M60 150 L140 150 L132 196 L68 196 Z" fill="#b5674d"/>`;
  s += `<rect x="54" y="142" width="92" height="12" rx="4" fill="#c9765a"/>`;
  s += `<ellipse cx="100" cy="148" rx="40" ry="6" fill="#4a3528"/>`;
  if (stage === 0) {
    s += `<circle cx="100" cy="145" r="4" fill="#9c7a55"/>`;
  } else {
    s += `<path d="M100 148 Q 103 ${(148 + stemTop) / 2} 100 ${stemTop}" stroke="#3f8f4f" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    for (let i = 0; i < leafCount; i++) {
      const frac = (i + 1) / (leafCount + 1);
      const y = 148 - (148 - stemTop) * frac;
      const side = i % 2 === 0 ? -1 : 1;
      const cx = 100 + side * leafSize * 0.9;
      const rot = side * -35;
      s += `<ellipse cx="${cx}" cy="${y}" rx="${leafSize}" ry="${leafSize * 0.45}" fill="${i % 2 ? '#4fa85f' : '#3f8f4f'}" transform="rotate(${rot} ${cx} ${y})"/>`;
    }
    const spots = [[100, stemTop], [100 - 20, stemTop + 24], [100 + 20, stemTop + 30]];
    for (let f = 0; f < flowers; f++) {
      const [fx, fy] = spots[f];
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        s += `<circle cx="${(fx + Math.cos(a) * 6).toFixed(1)}" cy="${(fy + Math.sin(a) * 6).toFixed(1)}" r="4.5" fill="#f1a7c1"/>`;
      }
      s += `<circle cx="${fx}" cy="${fy}" r="3.5" fill="#f6d365"/>`;
    }
  }
  return s + '</svg>';
}

// Celebrations not yet shown. Each has a stable id so it is only ever shown once.
export function pendingCelebrations({ celebrated, phase, sinceMs, nowMs, cravingsBeaten, onTargetDaysBeforeToday, dayIndex, taperN, moneyText }) {
  const out = [];
  const has = id => celebrated.includes(id);
  const treat = moneyText ? ` You have kept ${moneyText} that would have gone up in smoke. Spend a little of it on something you will enjoy. That is what it is for.` : '';

  if (phase === 'quit') {
    if (!has('quit:day0')) out.push({ id: 'quit:day0', emoji: '🚀', title: 'Quit day', body: 'The taper is done. From here the numbers count up instead of down. Keep the SOS button close today and be generous with yourself.' });
    for (const b of BADGES) {
      const id = `badge:${b.afterMs}`;
      if (!has(id) && nowMs - sinceMs >= b.afterMs) {
        out.push({ id, emoji: b.emoji, title: `${b.label} smoke-free`, body: badgeBody(b.afterMs) + treat });
      }
    }
  } else {
    if (!has('taper:first-on-target') && onTargetDaysBeforeToday >= 1 && dayIndex >= 1) {
      out.push({ id: 'taper:first-on-target', emoji: '🎯', title: 'First day on target', body: 'A full day at or under your allowance. That is the whole method: one day like this, then another.' });
    }
    if (!has('taper:7-on-target') && onTargetDaysBeforeToday >= 7) {
      out.push({ id: 'taper:7-on-target', emoji: '🔥', title: 'Seven days on target', body: 'A week of doing what you said you would do. The habit is already looser than it was.' + treat });
    }
    if (!has('taper:halfway') && taperN >= 4 && dayIndex >= Math.ceil(taperN / 2)) {
      out.push({ id: 'taper:halfway', emoji: '⛰️', title: 'Halfway to quit day', body: 'You are closer to the end of the taper than the start. The amounts are smaller now, and so are the cravings between them.' });
    }
  }
  for (const n of [5, 10, 25, 50, 100, 250, 500]) {
    const id = `cravings:${n}`;
    if (!has(id) && cravingsBeaten >= n) {
      out.push({ id, emoji: '🌊', title: `${n} cravings beaten`, body: `${n} times a craving showed up and you let it pass. Each one taught your brain that the urge is survivable.` });
    }
  }
  return out;
}

function badgeBody(ms) {
  const h = ms / 3600000;
  if (h <= 24) return 'A whole day. Nicotine is almost out of your blood and the hardest hours are behind you.';
  if (h <= 72) return 'Nicotine has left your body. What remains is habit, and habit is yours to rewire.';
  if (h <= 24 * 7) return 'One week. Your sense of taste and smell are sharper and your circulation is improving.';
  if (h <= 24 * 14) return 'Two weeks. Walking and stairs feel easier. The two-week dip in motivation is normal; your plan carries you through it.';
  if (h <= 24 * 28) return 'Twenty-eight days. People who reach this point are about five times more likely to stay quit for good.';
  if (h <= 24 * 100) return 'One hundred days. This is not a streak any more. It is a way of living.';
  return 'A year. Your added risk of heart disease is about half what it was. You did this.';
}
