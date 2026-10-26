// Quit: screens, state and event wiring. Pure math lives in taper.js / stats.js.
import * as D from './dates.js';
import * as T from './taper.js';
import * as S from './stats.js';
import { load, save, exportJSON, importJSON, clear, defaultState } from './store.js';
import { HEALTH_MILESTONES, BADGES, HEALTH_SOURCES, HEALTH_NOTE } from './content/health.js';
import { LESSONS, TRACKS } from './content/program.js';
import { TRIGGERS } from './content/distractions.js';
import { startSOS } from './sos.js';
import { taperChart, hourChart, triggerChart } from './charts.js';
import { plantSVG, growthStage, GROWTH_STAGES, nextGrowth, dailyEncouragement, pendingCelebrations } from './rewards.js';

const PRODUCT_META = {
  cig: { label: 'Cigarettes', one: 'cigarette', many: 'cigarettes', verb: 'I had one', emoji: '🚬' },
  vape: { label: 'Vape', one: 'vape session', many: 'vape sessions', verb: 'I vaped', emoji: '💨' },
};
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY'];
const IDENTITY_IDEAS = ["I'm someone who doesn't smoke.", "I don't smoke. I never did it well anyway.", 'I breathe easy.', 'My lungs are mine.'];

let state = load();
let screen = 'home';
let setup = null;
let overlayOpen = false;
let celebrating = false;

const $ = s => document.querySelector(s);
const app = $('#app'), tabbar = $('#tabbar'), sosBtn = $('#sos-btn'), overlay = $('#overlay'), toastEl = $('#toast'), importFile = $('#import-file');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const now = () => Date.now();

// ---------- helpers ----------
function persist() { if (!save(state)) toast('Could not save. Is storage blocked in this browser?'); }
let toastTimer;
function toast(msg, ms = 2800) {
  toastEl.textContent = msg; toastEl.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
}
function money(n) {
  const cur = state.settings?.currency || 'USD';
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur, maximumFractionDigits: Math.abs(n) >= 100 ? 0 : 2 }).format(n); }
  catch { return `${cur} ${n.toFixed(2)}`; }
}
function fmtWhen(ms) {
  return new Date(ms).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
function tile(v, label) { return `<div class="tile"><div class="tile-v">${esc(v)}</div><div class="tile-l">${esc(label)}</div></div>`; }
function plural(n, one, many) { return n === 1 ? one : many; }

function ctx() {
  const s = state.settings, nowMs = now(), today = D.dayKey(new Date(nowMs));
  return {
    s, nowMs, today,
    phase: T.phaseFor(today, s),
    N: T.taperLength(s),
    dayIndex: D.daysBetween(s.startDate, today),
    quitDay: D.daysBetween(s.quitDate, today),
    products: S.enabledProducts(s),
    sinceMs: S.smokeFreeSince(state.uses, s),
  };
}

function lessonUnlocked(l, c) {
  if (l.track === 'reduce') return c.phase === 'quit' || c.dayIndex >= l.day - 1;
  return c.phase === 'quit' && c.quitDay >= l.day - 1;
}
function todaysLesson(c) {
  const track = c.phase === 'quit' ? 'quit' : 'reduce';
  return LESSONS.filter(l => l.track === track && lessonUnlocked(l, c)).find(l => !state.lessons[l.id]?.doneAt) || null;
}

// ---------- overlay ----------
function showOverlay(html) {
  overlayOpen = true; sosBtn.hidden = true; overlay.hidden = false;
  overlay.innerHTML = `<div class="overlay-inner">${html}</div>`;
  overlay.scrollTop = 0;
}
function hideOverlay() {
  overlayOpen = false; overlay.hidden = true; overlay.innerHTML = '';
  sosBtn.hidden = !state.settings;
}

// ---------- render ----------
function render() {
  if (!state.settings) { tabbar.hidden = true; sosBtn.hidden = true; renderSetup(); return; }
  tabbar.hidden = false; sosBtn.hidden = overlayOpen;
  for (const b of tabbar.querySelectorAll('[data-screen]')) b.classList.toggle('on', b.dataset.screen === screen);
  const c = ctx();
  if (screen === 'home') app.innerHTML = c.phase === 'quit' ? renderHomeQuit(c) : renderHomeTaper(c);
  else if (screen === 'progress') app.innerHTML = renderProgress(c);
  else if (screen === 'program') app.innerHTML = renderProgram(c);
  else app.innerHTML = renderSettings(c);
  updateTimers();
  if (!overlayOpen) maybeCelebrate(c);
}

function ring(used, allowance) {
  const r = 62, circ = 2 * Math.PI * r;
  const frac = allowance > 0 ? Math.min(1, used / allowance) : (used > 0 ? 1 : 0);
  return `<svg viewBox="0 0 150 150" aria-hidden="true"><circle class="ring-bg" cx="75" cy="75" r="${r}"/><circle class="ring-fg ${used > allowance ? 'over' : ''}" cx="75" cy="75" r="${r}" stroke-dasharray="${(frac * circ).toFixed(1)} ${circ.toFixed(1)}"/></svg>`;
}

function plantCard(stage, days, labelMany, labelOne) {
  const nx = nextGrowth(days);
  return `<section class="card plant">${plantSVG(stage)}<div><div class="stage">${esc(GROWTH_STAGES[stage].name)}</div>
    <p class="muted" style="margin:4px 0 0">${days} ${esc(days === 1 ? labelOne : labelMany)}.${nx ? ` Next stage at ${nx.min}.` : ' Fully grown.'}</p>
    <p class="tiny" style="margin:4px 0 0">Your plant grows with every ${esc(labelOne)} you bank.</p></div></section>`;
}

function lessonCard(c) {
  const l = todaysLesson(c);
  if (l) {
    return `<button class="lesson-card" data-act="open-lesson" data-id="${l.id}" aria-label="Today's lesson: ${esc(l.title)}"><span class="lc-icon">📖</span><span class="lc-text"><small>Today's lesson · ${l.minutes} min</small><strong>${esc(l.title)}</strong></span><span class="muted">›</span></button>`;
  }
  const track = c.phase === 'quit' ? 'quit' : 'reduce';
  const list = LESSONS.filter(x => x.track === track);
  const allDone = list.every(x => state.lessons[x.id]?.doneAt);
  let note;
  if (c.phase === 'quit') note = allDone ? 'You have finished the program. The SOS button and Progress screen stay with you.' : 'The next one unlocks tomorrow.';
  else note = allDone ? 'The Stay-quit track opens on your quit day.' : 'The next one unlocks tomorrow.';
  return `<section class="card soft"><strong>All caught up on lessons.</strong><p class="muted" style="margin:4px 0 0">${note}</p></section>`;
}

function renderHomeTaper(c) {
  const { s, nowMs, today, N, dayIndex, products } = c;
  const daysLeft = D.daysBetween(today, s.quitDate);
  const pct = N > 0 ? Math.min(100, Math.round((dayIndex / N) * 100)) : 100;
  const wakeMs = D.atTime(today, s.wake), sleepMs = D.atTime(today, s.sleep);
  let cards = '';
  for (const p of products) {
    const m = PRODUCT_META[p];
    const allowance = T.allowanceFor(today, s, p);
    const todayUses = state.uses.filter(u => u.product === p && D.dayKey(new Date(u.t)) === today);
    const used = todayUses.length;
    const last = used ? todayUses[used - 1].t : null;
    const next = T.nextAllowedAt({ nowMs, lastUseMs: last, remaining: allowance - used, wakeMs, sleepMs });
    const tomorrow = T.allowanceFor(D.addDays(today, 1), s, p);
    let nextText;
    if (used > allowance) nextText = `${used - allowance} over today's target. No judgment: tomorrow's target is ${tomorrow}.`;
    else if (used === allowance) nextText = `That's today's ${allowance}. Tomorrow's target is ${tomorrow}.`;
    else if (next.status === 'now') nextText = `You can have one now. ${allowance - used} left today.`;
    else if (next.status === 'wait') nextText = `Next one at <strong>${D.fmtClock(next.at)}</strong>, in <span data-until="${Math.round(next.at)}"></span>. If a craving comes sooner, that is what SOS is for.`;
    else nextText = `Done for today. Tomorrow's target is ${tomorrow}.`;
    cards += `<section class="card product-card">
      <div class="row between"><h2>${m.emoji} ${m.label}</h2><span class="muted">target ${allowance}</span></div>
      <div class="ring-wrap">${ring(used, allowance)}<div class="ring-label"><div class="big">${used}</div><div class="muted">of ${allowance}</div></div></div>
      <p class="next">${nextText}</p>
      <button class="btn btn-big" data-act="use" data-product="${p}">${m.verb}</button>
      ${used ? `<div style="text-align:center"><button class="btn-link" data-act="undo" data-product="${p}">Undo last (${D.fmtClock(last)})</button></div>` : ''}
    </section>`;
  }
  const onTarget = S.onTargetDays(state.uses, s, nowMs - D.DAY_MS, T.allowanceFor);
  const cs = S.cravingStats(state.cravings);
  return `
    <div class="screen-title"><h1>Day ${dayIndex + 1} of ${N}</h1><span class="muted">${daysLeft} ${plural(daysLeft, 'day', 'days')} to quit day</span></div>
    <div class="progress-bar" aria-label="Taper progress"><div style="width:${pct}%"></div></div>
    <p class="tiny" style="margin:6px 0 12px">Quit day: ${esc(D.fmtDate(s.quitDate))}</p>
    <p class="encourage">${esc(dailyEncouragement(today))}</p>
    ${cards}
    <div class="tiles">${tile(money(S.moneySaved(state.uses, s, nowMs)), 'kept')}${tile(cs.beaten, 'cravings beaten')}${tile(onTarget, 'days on target')}</div>
    ${lessonCard(c)}
    ${plantCard(growthStage(onTarget), onTarget, 'days on target', 'day on target')}`;
}

function renderHomeQuit(c) {
  const { s, nowMs, today, sinceMs } = c;
  const st = S.streaks(state.uses, s, nowMs);
  const cs = S.cravingStats(state.cravings);
  const elapsed = nowMs - sinceMs;
  const next = HEALTH_MILESTONES.find(m => m.afterMs > elapsed);
  const prev = [...HEALTH_MILESTONES].reverse().find(m => m.afterMs <= elapsed);
  let mile = '';
  if (next) {
    const from = prev ? prev.afterMs : 0;
    const frac = Math.min(1, (elapsed - from) / (next.afterMs - from));
    mile = `<section class="card milestone-next"><div class="row between"><strong>Next: ${esc(next.title)}</strong><span class="muted">in <span data-until="${sinceMs + next.afterMs}"></span></span></div>
      <div class="progress-bar" style="margin:8px 0"><div style="width:${(frac * 100).toFixed(0)}%"></div></div><p class="muted" style="margin:0">${esc(next.body)}</p></section>`;
  }
  const avoided = Object.values(S.unitsAvoided(state.uses, s, nowMs)).reduce((a, b) => a + b, 0);
  return `
    <div class="screen-title"><h1>Smoke-free</h1><span class="muted">day ${st.current || 1}</span></div>
    <section class="card"><div class="timer" data-since="${sinceMs}"></div><p class="since">Since ${esc(fmtWhen(sinceMs))}</p></section>
    <p class="encourage">${esc(dailyEncouragement(today))}</p>
    <div class="tiles">${tile(money(S.moneySaved(state.uses, s, nowMs)), 'kept')}${tile(Math.round(avoided), 'not smoked')}${tile(cs.beaten, 'cravings beaten')}</div>
    ${mile}
    ${lessonCard(c)}
    ${plantCard(growthStage(st.current), st.current, 'clean days', 'clean day')}
    <div class="streak-row">${tile(st.current, 'day streak')}${tile(st.longest, 'longest streak')}</div>
    <div class="slip-wrap"><button class="btn-link" data-act="slip">I slipped. Log it.</button></div>`;
}

function renderProgress(c) {
  const { s, nowMs, phase, products, sinceMs } = c;
  const cs = S.cravingStats(state.cravings);
  const saved = S.moneySaved(state.uses, s, nowMs);
  const avoided = S.unitsAvoided(state.uses, s, nowMs);
  let tiles;
  if (phase === 'quit') {
    const st = S.streaks(state.uses, s, nowMs);
    tiles = `<div class="tiles four">${tile(D.fmtDurationLong(nowMs - sinceMs), 'smoke-free')}${tile(money(saved), 'kept')}${tile(cs.beaten, 'cravings beaten')}${tile(`${st.current} / ${st.longest}`, 'streak / longest')}</div>`;
  } else {
    tiles = `<div class="tiles four">${tile(`${Math.round(S.reductionPct(state.uses, s, nowMs))}%`, 'below baseline, 7 days')}${tile(money(saved), 'kept')}${tile(cs.beaten, 'cravings beaten')}${tile(S.onTargetDays(state.uses, s, nowMs - D.DAY_MS, T.allowanceFor), 'days on target')}</div>`;
  }
  const avoidedText = products.map(p => `${Math.round(avoided[p] || 0)} ${PRODUCT_META[p].many}`).join(' and ');

  let charts = '';
  for (const p of products) {
    let series = S.dailySeries(state.uses, s, p, nowMs, T.allowanceFor);
    if (series.length > 90) series = series.slice(-90);
    charts += `<section class="card"><h2>${PRODUCT_META[p].label} per day</h2>${taperChart(series, { quitKey: s.quitDate, unit: PRODUCT_META[p].many })}</section>`;
  }

  const cravingsCard = state.cravings.length
    ? `<section class="card"><h2>Cravings by hour</h2>${hourChart(cs.byHour)}<p class="tiny">${cs.total} logged, ${cs.beaten} beaten${cs.avgDrop != null ? `, intensity drops ${cs.avgDrop.toFixed(1)} points on average by the end of the SOS flow` : ''}.</p>
       <h2 style="margin-top:14px">By trigger</h2>${triggerChart(cs.byTrigger, id => TRIGGERS.find(t => t.id === id)?.label || id)}</section>`
    : `<section class="card"><h2>Cravings</h2><p class="muted">Nothing logged yet. When a craving hits, tap SOS and the pattern will build here.</p></section>`;

  const ms = S.milestoneStatus(HEALTH_MILESTONES, sinceMs, nowMs);
  const timeline = `<section class="card"><h2>Your body, recovering</h2>
    ${phase === 'quit' ? '' : '<p class="muted">Starts counting from your last cigarette after quit day.</p>'}
    <ul class="timeline">${ms.map(m => {
      const reached = phase === 'quit' && m.reached;
      return `<li class="${reached ? 'reached' : 'locked'}"><span class="mark">${reached ? '✓' : ''}</span><div><strong>${esc(m.title)}${!reached && phase === 'quit' ? ` <span class="tiny">in ${esc(D.fmtDuration(m.remainingMs, { short: true }))}</span>` : ''}</strong><span class="muted">${esc(m.body)}</span></div></li>`;
    }).join('')}</ul>
    <p class="tiny" style="margin-top:10px">${esc(HEALTH_NOTE)}</p></section>`;

  const badges = `<section class="card"><h2>Badges</h2><div class="badges">${BADGES.map(b => {
    const got = phase === 'quit' && nowMs - sinceMs >= b.afterMs;
    return `<div class="badge ${got ? '' : 'locked'}"><span class="b-emoji">${b.emoji}</span>${esc(b.label)}</div>`;
  }).join('')}</div></section>`;

  return `<div class="screen-title"><h1>Progress</h1></div>${tiles}
    <p class="tiny" style="margin:-4px 0 12px">Not smoked: ${esc(avoidedText)}, compared with where you started.</p>
    ${charts}${cravingsCard}${timeline}${badges}`;
}

function renderProgram(c) {
  const sections = TRACKS.map(tr => {
    const list = LESSONS.filter(l => l.track === tr.id);
    const done = list.filter(l => state.lessons[l.id]?.doneAt).length;
    const lockNote = tr.id === 'quit' && c.phase !== 'quit' ? `<p class="tiny">Unlocks on your quit day, ${esc(D.fmtDate(c.s.quitDate))}.</p>` : '';
    return `<section class="card"><div class="row between"><h2>${esc(tr.title)}</h2><span class="muted">${done}/${list.length}</span></div><p class="muted">${esc(tr.blurb)}</p>${lockNote}
      <ul class="lessons">${list.map(l => {
        const un = lessonUnlocked(l, c), isDone = !!state.lessons[l.id]?.doneAt;
        const inner = `<span class="lesson-day">${isDone ? '✓' : l.day}</span><span class="lesson-title">${esc(l.title)}<small>${l.minutes} min read${un ? '' : ' · locked'}</small></span>`;
        return `<li class="lesson ${un ? '' : 'locked'} ${isDone ? 'done' : ''}">${un ? `<button class="lesson-btn" data-act="open-lesson" data-id="${l.id}" aria-label="Day ${l.day}: ${esc(l.title)}">${inner}</button>` : `<div class="lesson-btn" aria-label="Day ${l.day}: ${esc(l.title)}, locked">${inner}</div>`}</li>`;
      }).join('')}</ul></section>`;
  }).join('');
  return `<div class="screen-title"><h1>Program</h1></div><p class="muted" style="margin-bottom:12px">One short lesson a day, each with a task. Missed days stay open; there is no streak to lose here.</p>${sections}`;
}

function openLesson(id) {
  const l = LESSONS.find(x => x.id === id);
  if (!l) return;
  const saved = state.lessons[id] || {};
  const tr = TRACKS.find(t => t.id === l.track);
  showOverlay(`<header class="ov-head"><button class="btn-link" data-act="close-overlay">‹ Back</button><span class="muted">${esc(tr.title)} · Day ${l.day}</span></header>
    <div class="lesson-body"><h1>${esc(l.title)}</h1>${l.body.map(p => `<p>${esc(p)}</p>`).join('')}</div>
    <section class="card task"><h3>Today's task</h3><p>${esc(l.task.prompt)}</p>
      <textarea id="task-answer" rows="5" placeholder="${esc(l.task.placeholder || 'Write it here. It stays on this device.')}">${esc(saved.answer || '')}</textarea>
      <button class="btn btn-big" data-act="lesson-done" data-id="${id}">${saved.doneAt ? 'Save changes' : 'Save and mark done'}</button>
      ${saved.doneAt ? `<p class="tiny" style="margin:8px 0 0">Completed ${new Date(saved.doneAt).toLocaleDateString()}</p>` : ''}
    </section>`);
}
function completeLesson(id) {
  const answer = $('#task-answer')?.value || '';
  const prev = state.lessons[id] || {};
  state.lessons[id] = { doneAt: prev.doneAt || now(), answer };
  persist(); hideOverlay(); toast('Saved.'); render();
}

// ---------- settings ----------
function productFields(d, p) {
  const pr = d.products[p], m = PRODUCT_META[p];
  const costs = p === 'cig'
    ? `<div class="grid-2"><div class="field"><label for="p-cig-price">Price per pack</label><input id="p-cig-price" type="number" inputmode="decimal" min="0" step="0.01" value="${pr.packPrice}"></div><div class="field"><label for="p-cig-perpack">Cigarettes per pack</label><input id="p-cig-perpack" type="number" inputmode="numeric" min="1" value="${pr.perPack}"></div></div>`
    : `<div class="grid-2"><div class="field"><label for="p-vape-price">Price of one pod or disposable</label><input id="p-vape-price" type="number" inputmode="decimal" min="0" step="0.01" value="${pr.unitPrice}"></div><div class="field"><label for="p-vape-days">Days one lasts you</label><input id="p-vape-days" type="number" inputmode="decimal" min="0.1" step="0.5" value="${pr.unitDays}"></div></div>`;
  return `<label class="check"><input type="checkbox" id="p-${p}-on" class="toggle-product" ${pr.enabled ? 'checked' : ''}><span class="check-label">${m.emoji} ${m.label}</span></label>
    ${pr.enabled ? `<div class="field"><label for="p-${p}-baseline">${p === 'cig' ? 'Cigarettes per day right now' : 'Vape sessions per day right now'}</label><input id="p-${p}-baseline" type="number" inputmode="numeric" min="1" value="${pr.baseline}"></div>
    ${p === 'vape' ? '<p class="help">A session is each time you pick it up. Estimate; you can change it later.</p>' : ''}${costs}` : ''}`;
}
function scheduleFields(d) {
  return `<div class="grid-2"><div class="field"><label for="f-wake">I'm usually up by</label><input id="f-wake" type="time" value="${d.wake}"></div><div class="field"><label for="f-sleep">And in bed by</label><input id="f-sleep" type="time" value="${d.sleep}"></div></div>
    <div class="field"><label for="f-quit">Quit date</label><input id="f-quit" type="date" value="${d.quitDate}"></div>`;
}
function reasonFields(d) {
  return `${[0, 1, 2].map(i => `<div class="field"><label for="r${i}">Reason ${i + 1}</label><input id="r${i}" type="text" maxlength="120" value="${esc(d.reasons[i] || '')}" placeholder="${['To stop coughing every morning', 'For my kids / partner / future self', 'Because it is costing me a holiday a year'][i]}"></div>`).join('')}
    <div class="field"><label for="f-identity">Who you are now, in one line</label><input id="f-identity" type="text" maxlength="80" value="${esc(d.identity)}"></div>
    <div class="chips">${IDENTITY_IDEAS.map(t => `<button class="chip" type="button" data-act="identity-pick" data-text="${esc(t)}">${esc(t)}</button>`).join('')}</div>`;
}
function readForm(d) {
  for (const p of ['cig', 'vape']) {
    const on = $(`#p-${p}-on`); if (on) d.products[p].enabled = on.checked;
    const b = $(`#p-${p}-baseline`); if (b) d.products[p].baseline = Math.max(1, Math.round(+b.value || 0));
  }
  const pp = $('#p-cig-price'); if (pp) d.products.cig.packPrice = Math.max(0, +pp.value || 0);
  const pk = $('#p-cig-perpack'); if (pk) d.products.cig.perPack = Math.max(1, Math.round(+pk.value || 20));
  const up = $('#p-vape-price'); if (up) d.products.vape.unitPrice = Math.max(0, +up.value || 0);
  const ud = $('#p-vape-days'); if (ud) d.products.vape.unitDays = Math.max(0.1, +ud.value || 1);
  const cur = $('#f-currency'); if (cur) d.currency = cur.value;
  const w = $('#f-wake'); if (w && w.value) d.wake = w.value;
  const sl = $('#f-sleep'); if (sl && sl.value) d.sleep = sl.value;
  const q = $('#f-quit'); if (q && q.value) d.quitDate = q.value;
  for (let i = 0; i < 3; i++) { const r = $(`#r${i}`); if (r) d.reasons[i] = r.value.trim(); }
  const idn = $('#f-identity'); if (idn) d.identity = idn.value.trim();
}
function validate(d, { allowPastQuit }) {
  const enabled = Object.keys(d.products).filter(p => d.products[p].enabled);
  if (!enabled.length) return 'Pick at least one: cigarettes or vape.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.quitDate)) return 'Pick a quit date.';
  if (D.minutesOfDay(d.sleep) <= D.minutesOfDay(d.wake) + 60) return 'Bedtime needs to be at least an hour after wake time.';
  const today = D.dayKey();
  if (!allowPastQuit && D.daysBetween(today, d.quitDate) < 0) return 'The quit date is in the past. Pick today or later.';
  return null;
}

function renderSettings(c) {
  const d = c.s;
  return `<div class="screen-title"><h1>Settings</h1></div>
    <section class="card settings"><h2>What you use</h2>${productFields(d, 'cig')}${productFields(d, 'vape')}
      <div class="field"><label for="f-currency">Currency</label><select id="f-currency">${CURRENCIES.map(x => `<option ${x === d.currency ? 'selected' : ''}>${x}</option>`).join('')}</select></div></section>
    <section class="card settings"><h2>Schedule</h2>${scheduleFields(d)}
      <p class="help">Started ${esc(D.fmtDate(d.startDate))}. Moving the quit date reshapes the taper from today; the lessons explain why to do this rarely.</p></section>
    <section class="card settings"><h2>Your reasons</h2>${reasonFields(d)}</section>
    <button class="btn btn-big" data-act="settings-save">Save changes</button>
    <section class="card settings" style="margin-top:12px"><h2>Reminders</h2><p class="muted">Without an account or server, a web app can only remind you while it is open. For a dependable daily nudge, set a phone alarm at the time you want to read the lesson. The home screen will always show it.</p></section>
    <section class="card settings"><h2>Backup</h2><p class="muted">Everything lives in this browser. Export a copy now and then, or to move between phone and laptop.</p>
      <div class="btn-row"><button class="btn btn-ghost" data-act="export">Export JSON</button><button class="btn btn-ghost" data-act="import">Import JSON</button></div></section>
    <section class="card settings"><h2>About the evidence</h2>
      <p class="muted">Structured reduction to a fixed quit date works about as well as stopping abruptly (Cochrane review, Lindson 2019). Spacing uses on a schedule, riding out urges with acceptance-based breathing, mapping triggers, if-then plans and treating slips as data rather than failure all come from cognitive behavioural and acceptance-based quit programs. Health milestones:</p>
      <ul class="source-list">${HEALTH_SOURCES.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`).join('')}</ul>
      <p class="tiny">This app is a self-help tool, not medical advice. For medication or nicotine replacement, talk to a doctor or pharmacist. In the US, 1-800-QUIT-NOW is free.</p></section>
    <section class="card settings danger-zone"><h2>Start over</h2><p class="muted">Deletes everything on this device: settings, logs, lesson answers.</p><button class="btn btn-outline" data-act="reset">Delete all data</button></section>`;
}
function saveSettings() {
  const d = JSON.parse(JSON.stringify(state.settings));
  readForm(d);
  const err = validate(d, { allowPastQuit: true });
  if (err) { toast(err); return; }
  state.settings = d; persist(); toast('Saved.'); render();
}

// ---------- setup wizard ----------
function defaultDraft() {
  const today = D.dayKey();
  return {
    products: {
      cig: { enabled: true, baseline: 10, packPrice: 10, perPack: 20 },
      vape: { enabled: false, baseline: 10, unitPrice: 20, unitDays: 5 },
    },
    wake: '07:00', sleep: '23:00', quitDate: D.addDays(today, 28), currency: 'USD',
    reasons: ['', '', ''], identity: IDENTITY_IDEAS[0],
  };
}
function schedulePreview(d) {
  const today = D.dayKey();
  const N = D.daysBetween(today, d.quitDate);
  const p = Object.keys(d.products).find(k => d.products[k].enabled);
  if (!p) return '';
  if (N <= 0) return `<p class="muted">Quit date is today, so there is no taper: the app starts in smoke-free mode right away.</p>`;
  const base = d.products[p].baseline;
  const sched = [];
  for (let i = 0; i <= N; i++) sched.push(T.allowanceAt(i, base, N));
  const firstDrop = sched.findIndex(a => a < base);
  const firstOne = sched.findIndex(a => a === 1);
  let warn = '';
  if (N < 7) warn = `<p class="help" style="color:var(--warn)">Under a week is a steep taper. Fine if you are ready; cravings will be sharper.</p>`;
  else if (N > 56) warn = `<p class="help" style="color:var(--warn)">Long tapers tend to stall. Four to six weeks is the sweet spot for most people.</p>`;
  return `<div class="preview-sched" aria-hidden="true">${sched.map(a => `<span style="height:${Math.max(4, (a / base) * 100)}%"></span>`).join('')}</div>
    <p class="muted">${N} days. Starting at ${base} a day${firstDrop > 0 ? `, first step down on ${esc(D.fmtDate(D.addDays(today, firstDrop)))}` : ''}${firstOne > 0 ? `, down to 1 a day from ${esc(D.fmtDate(D.addDays(today, firstOne)))}` : ''}, zero on ${esc(D.fmtDate(d.quitDate))}.</p>${warn}`;
}
function renderSetup() {
  if (!setup) setup = { step: 0, draft: defaultDraft() };
  const d = setup.draft;
  let html = '';
  switch (setup.step) {
    case 0:
      html = `<div class="hero"><div class="hero-emoji">🌱</div><h1>Quit, gradually.</h1>
        <p>This app helps you taper down to a quit date, ride out cravings when they hit, and watch what you get back: time, money, breath.</p>
        <p class="muted">Everything stays on this device. No account, no server, no one watching.</p>
        <button class="btn btn-big" data-act="setup-next">Set it up</button></div>`;
      break;
    case 1:
      html = `<h1>What do you use?</h1><p class="muted">Be honest about the numbers. The taper is built from them.</p>
        ${productFields(d, 'cig')}${productFields(d, 'vape')}
        <div class="field"><label for="f-currency">Currency</label><select id="f-currency">${CURRENCIES.map(x => `<option ${x === d.currency ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
        <button class="btn btn-big" data-act="setup-next">Next</button>`;
      break;
    case 2:
      html = `<h1>When?</h1><p class="muted">Your waking hours set the spacing between uses. The quit date sets the slope.</p>
        ${scheduleFields(d)}<div class="card">${schedulePreview(d)}</div>
        <button class="btn btn-big" data-act="setup-next">Next</button>`;
      break;
    case 3:
      html = `<h1>Why?</h1><p class="muted">These show up when a craving hits. Make them yours, not what you think you should say.</p>
        ${reasonFields(d)}<button class="btn btn-big" data-act="setup-next" style="margin-top:14px">Next</button>`;
      break;
    case 4: {
      const prods = Object.keys(d.products).filter(p => d.products[p].enabled);
      const N = D.daysBetween(D.dayKey(), d.quitDate);
      html = `<h1>Ready.</h1>
        <section class="card"><p><strong>${prods.map(p => `${d.products[p].baseline} ${PRODUCT_META[p].many} a day`).join(', ')}</strong></p>
        <p>${N > 0 ? `Tapering over <strong>${N} days</strong> to zero on <strong>${esc(D.fmtDate(d.quitDate))}</strong>.` : `Smoke-free from <strong>today</strong>.`}</p>
        <p>Awake ${esc(d.wake)} to ${esc(d.sleep)}.</p>
        <p class="identity" style="font-size:18px">${esc(d.identity)}</p>
        ${d.reasons.filter(Boolean).length ? `<ul class="reasons">${d.reasons.filter(Boolean).map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}</section>
        <p class="muted">You can change any of this later in Settings.</p>
        <button class="btn btn-big" data-act="setup-next">Start today</button>`;
      break;
    }
  }
  app.innerHTML = `<div class="setup"><div class="steps">${[0, 1, 2, 3, 4].map(i => `<span class="dot ${i <= setup.step ? 'on' : ''}"></span>`).join('')}</div>${html}${setup.step > 0 ? `<div style="text-align:center;margin-top:8px"><button class="btn-link" data-act="setup-back">‹ Back</button></div>` : ''}</div>`;
  window.scrollTo(0, 0);
}
function setupNext() {
  const d = setup.draft;
  readForm(d);
  if (setup.step === 1) {
    const enabled = Object.keys(d.products).filter(p => d.products[p].enabled);
    if (!enabled.length) { toast('Pick at least one: cigarettes or vape.'); return; }
  }
  if (setup.step === 2) {
    const err = validate(d, { allowPastQuit: false });
    if (err) { toast(err); return; }
  }
  if (setup.step === 4) {
    const err = validate(d, { allowPastQuit: false });
    if (err) { toast(err); setup.step = 2; renderSetup(); return; }
    state.settings = { ...d, startDate: D.dayKey(), startedAt: now() };
    persist(); setup = null; screen = 'home'; render();
    toast(T.taperLength(state.settings) > 0 ? 'Set. Log each one as you have it.' : 'Set. The clock is running.');
    return;
  }
  setup.step++;
  renderSetup();
}

// ---------- logging ----------
function logUse(product, kind) {
  state.uses.push({ t: now(), product, kind });
  persist();
  if (kind === 'use') {
    const c = ctx();
    const a = T.allowanceFor(c.today, c.s, product), used = S.usesOnDay(state.uses, c.today, product);
    toast(used <= a ? `Logged. ${a - used} left today.` : `Logged. ${used - a} over today's target.`);
  }
  render();
}
function undoLast(product) {
  const today = D.dayKey();
  let idx = -1;
  state.uses.forEach((u, i) => { if (u.product === product && D.dayKey(new Date(u.t)) === today) idx = i; });
  if (idx >= 0) { state.uses.splice(idx, 1); persist(); toast('Removed.'); render(); }
}
function openSlipSheet() {
  const c = ctx();
  const chips = c.products.length > 1
    ? `<p>Which one?</p><div class="chips" style="margin-bottom:16px">${c.products.map(p => `<button class="chip" data-act="slip-confirm" data-product="${p}">${PRODUCT_META[p].emoji} ${PRODUCT_META[p].label}</button>`).join('')}</div>`
    : `<button class="btn btn-big" data-act="slip-confirm" data-product="${c.products[0]}">Yes, log it</button>`;
  showOverlay(`<header class="ov-head"><span class="muted">Logging a slip</span><button class="btn-link" data-act="close-overlay">Cancel</button></header>
    <h1>Log a slip?</h1><p class="lead muted">Honest records are what you learn from. Your streak restarts; everything you have learned does not.</p>
    <div class="ov-grow"></div><div class="ov-actions">${chips}<button class="btn btn-ghost" data-act="close-overlay">Cancel</button></div>`);
}
function showSlipSupport() {
  showOverlay(`<div class="celebrate"><div class="c-emoji">🫂</div><h1>Logged. Now the next hour.</h1>
    <p>A slip is a data point, not a verdict. Get away from the source. Do not have a second one, and do not buy a pack. Drink water, brush your teeth, change rooms.</p>
    <p>Then look at your numbers. The days, the money, the cravings beaten: all still true.</p></div>
    <div class="ov-grow"></div><div class="ov-actions"><button class="btn btn-big" data-act="open-lesson" data-id="q12">Read: slips vs relapse</button><button class="btn btn-ghost" data-act="close-overlay">Back to home</button></div>`);
}

// ---------- SOS ----------
function liveStats(c) {
  const cs = S.cravingStats(state.cravings);
  const items = [{ label: 'kept', value: money(S.moneySaved(state.uses, c.s, c.nowMs)) }, { label: 'cravings beaten', value: cs.beaten }];
  if (c.phase === 'quit') items.unshift({ label: 'smoke-free', value: D.fmtDurationLong(c.nowMs - c.sinceMs) });
  else items.unshift({ label: 'below baseline', value: `${Math.round(S.reductionPct(state.uses, c.s, c.nowMs))}%` });
  return items;
}
let sosHandle = null;
function openSOS() {
  const c = ctx();
  overlayOpen = true; sosBtn.hidden = true; overlay.hidden = false;
  sosHandle = startSOS({
    mount: overlay,
    reasons: (c.s.reasons || []).filter(Boolean),
    identity: c.s.identity,
    phase: c.phase,
    products: c.products.map(p => ({ id: p, label: PRODUCT_META[p].label })),
    triggers: TRIGGERS,
    liveStats: () => liveStats(ctx()),
    onDone: craving => {
      state.cravings.push(craving);
      if (craving.outcome === 'used' && craving.product) {
        state.uses.push({ t: now(), product: craving.product, kind: c.phase === 'quit' ? 'slip' : 'use' });
      }
      sosHandle = null; persist(); hideOverlay(); render();
    },
    onCancel: () => { sosHandle = null; hideOverlay(); render(); },
  });
}

// ---------- celebrations ----------
function maybeCelebrate(c) {
  if (celebrating) return;
  const cs = S.cravingStats(state.cravings);
  const list = pendingCelebrations({
    celebrated: state.celebrated, phase: c.phase, sinceMs: c.sinceMs, nowMs: c.nowMs,
    cravingsBeaten: cs.beaten,
    onTargetDaysBeforeToday: c.phase === 'quit' ? 0 : S.onTargetDays(state.uses, c.s, c.nowMs - D.DAY_MS, T.allowanceFor),
    dayIndex: c.dayIndex, taperN: c.N,
    moneyText: S.moneySaved(state.uses, c.s, c.nowMs) >= 1 ? money(S.moneySaved(state.uses, c.s, c.nowMs)) : '',
  });
  if (!list.length) return;
  const item = list[0];
  celebrating = true;
  const colors = ['var(--accent)', 'var(--warn)', '#f1a7c1', '#7aa7ff', 'var(--good)'];
  const confetti = Array.from({ length: 48 }, (_, i) =>
    `<i style="left:${(Math.random() * 100).toFixed(1)}%;background:${colors[i % colors.length]};animation-duration:${(2.2 + Math.random() * 2).toFixed(2)}s;animation-delay:${(Math.random() * 0.9).toFixed(2)}s"></i>`).join('');
  showOverlay(`<div class="confetti" aria-hidden="true">${confetti}</div>
    <div class="celebrate"><div class="c-emoji">${item.emoji}</div><h1>${esc(item.title)}</h1><p>${esc(item.body)}</p></div>
    <div class="ov-grow"></div><div class="ov-actions"><button class="btn btn-big" data-act="celebrate-ok" data-id="${esc(item.id)}">Keep going</button></div>`);
}

// ---------- backup ----------
function doExport() {
  const blob = new Blob([exportJSON(state)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `quit-backup-${D.dayKey()}.json`;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
importFile.addEventListener('change', async () => {
  const f = importFile.files && importFile.files[0];
  importFile.value = '';
  if (!f) return;
  try {
    const imported = importJSON(await f.text());
    showOverlay(`<h1>Replace everything?</h1><p class="muted">This will replace what is on this device with the backup from ${esc(f.name)} (${imported.uses.length} logged uses, ${imported.cravings.length} cravings).</p>
      <div class="ov-grow"></div><div class="ov-actions"><button class="btn btn-big" id="import-confirm">Replace</button><button class="btn btn-ghost" data-act="close-overlay">Cancel</button></div>`);
    $('#import-confirm').onclick = () => { state = imported; persist(); hideOverlay(); screen = 'home'; toast('Imported.'); render(); };
  } catch (e) { toast(e.message || 'Could not read that file.'); }
});
function confirmReset() {
  showOverlay(`<h1>Delete all data?</h1><p class="muted">Settings, every logged use and craving, and all lesson answers on this device. This cannot be undone. Export a backup first if you want one.</p>
    <div class="ov-grow"></div><div class="ov-actions"><button class="btn btn-danger" data-act="reset-confirm">Delete everything</button><button class="btn btn-ghost" data-act="close-overlay">Cancel</button></div>`);
}

// ---------- timers ----------
function timerParts(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), sec: s % 60 };
}
function updateTimers() {
  const nowMs = now();
  document.querySelectorAll('[data-since]').forEach(el => {
    const { d, h, m, sec } = timerParts(nowMs - Number(el.dataset.since));
    if (d >= 1) el.innerHTML = `<span class="big">${d}</span><span class="unit">${plural(d, 'day', 'days')}</span><div class="sub">${h}h ${m}m ${sec}s</div>`;
    else if (h >= 1) el.innerHTML = `<span class="big">${h}</span><span class="unit">${plural(h, 'hour', 'hours')}</span><div class="sub">${m}m ${sec}s</div>`;
    else el.innerHTML = `<span class="big">${m}</span><span class="unit">min</span><div class="sub">${sec}s</div>`;
  });
  document.querySelectorAll('[data-until]').forEach(el => { el.textContent = D.fmtDuration(Number(el.dataset.until) - nowMs); });
}
setInterval(updateTimers, 1000);
setInterval(() => { if (state.settings && !overlayOpen && !setup) render(); }, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && state.settings && !overlayOpen) render(); });

// ---------- events ----------
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act, d = el.dataset;
  switch (act) {
    case 'nav': screen = d.screen; window.scrollTo(0, 0); render(); break;
    case 'use': logUse(d.product, 'use'); break;
    case 'undo': undoLast(d.product); break;
    case 'slip': openSlipSheet(); break;
    case 'slip-confirm': logUse(d.product, 'slip'); showSlipSupport(); break;
    case 'sos': openSOS(); break;
    case 'open-lesson': openLesson(d.id); break;
    case 'lesson-done': completeLesson(d.id); break;
    case 'close-overlay': hideOverlay(); render(); break;
    case 'celebrate-ok':
      if (!state.celebrated.includes(d.id)) state.celebrated.push(d.id);
      persist(); celebrating = false; hideOverlay(); render(); break;
    case 'setup-next': setupNext(); break;
    case 'setup-back': readForm(setup.draft); setup.step = Math.max(0, setup.step - 1); renderSetup(); break;
    case 'identity-pick': { const f = $('#f-identity'); if (f) f.value = d.text; break; }
    case 'settings-save': saveSettings(); break;
    case 'export': doExport(); break;
    case 'import': importFile.click(); break;
    case 'reset': confirmReset(); break;
    case 'reset-confirm': clear(); state = defaultState(); setup = null; screen = 'home'; hideOverlay(); render(); break;
  }
});
document.addEventListener('change', e => {
  if (!setup) return;
  if (e.target.classList.contains('toggle-product') || e.target.id === 'f-quit') { readForm(setup.draft); renderSetup(); }
});
document.addEventListener('change', e => {
  if (setup || screen !== 'settings') return;
  if (e.target.classList.contains('toggle-product')) {
    // Re-render the settings form with the new toggle so the right fields show, without saving yet.
    const d = JSON.parse(JSON.stringify(state.settings)); readForm(d);
    const keep = state.settings; state.settings = d; app.innerHTML = renderSettings(ctx()); state.settings = keep;
  }
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || !overlayOpen || celebrating) return;
  if (sosHandle) sosHandle.cancel(); else { hideOverlay(); render(); }
});

// ---------- boot ----------
render();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(err => console.warn('Service worker not registered', err));
}
