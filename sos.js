// Craving SOS flow: rate -> surf (3 min breathing) -> why -> distract / game -> outcome -> summary.
// Every state change is reported through onChange so the app can persist it and resume the flow
// after the browser reloads the page, which phones do to apps left in the background.
import { fmtDuration } from './dates.js';
import { DISTRACTIONS, ACT_PROMPTS } from './content/distractions.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function startSOS({ mount, reasons, identity, phase, products, triggers, liveStats, onRecord, onClose, onCancel, onChange, resume }) {
  const fresh = {
    step: 'rate', startedAt: Date.now(), intensityBefore: 6, intensityAfter: null, trigger: null,
    product: products.length === 1 ? products[0].id : null, pendingOutcome: null, distraction: null, lastD: -1,
    surfStart: null, record: null,
  };
  const st = resume ? { ...fresh, ...resume } : fresh;
  if (st.step === 'game') st.step = 'distract'; // a half-played game is not worth resuming
  st.timers = [];

  function snapshot() { const { timers, ...rest } = st; return rest; }
  function changed() { if (onChange) onChange(snapshot()); }
  function clearTimers() { st.timers.forEach(clearInterval); st.timers = []; }
  function cleanup() { clearTimers(); mount.onclick = null; mount.oninput = null; }

  function render() {
    clearTimers();
    mount.innerHTML = `<div class="overlay-inner sos">${view()}</div>`;
    mount.scrollTop = 0;
    if (st.step === 'surf') startSurf();
    if (st.step === 'game') startGame();
    changed();
  }

  function head(label) {
    return `<header class="ov-head"><span class="muted">${esc(label)}</span><button class="btn-link" data-sos="cancel">Close</button></header>`;
  }

  function view() {
    switch (st.step) {
      case 'rate': return viewRate();
      case 'surf': return viewSurf();
      case 'why': return viewWhy();
      case 'distract': return viewDistract();
      case 'game': return viewGame();
      case 'outcome': return viewOutcome();
      case 'summary': return viewSummary();
    }
    return '';
  }

  function viewRate() {
    return head('Craving SOS') +
      `<h1>How strong is it?</h1><p class="lead">Just a number. You are already doing the right thing by opening this.</p>
       <div class="int-value" id="sos-int-v">${st.intensityBefore}</div>
       <input type="range" id="sos-int" min="1" max="10" value="${st.intensityBefore}" aria-label="Craving intensity">
       <div class="int-scale"><span>mild</span><span>overwhelming</span></div>
       <h3 style="margin-top:22px">What set it off?</h3>
       <div class="chips">${triggers.map(t => `<button class="chip ${st.trigger === t.id ? 'on' : ''}" data-sos="trigger" data-id="${t.id}">${esc(t.label)}</button>`).join('')}</div>
       <div class="ov-grow"></div>
       <div class="ov-actions"><button class="btn btn-big" data-sos="start">Ride it out (3 min)</button></div>`;
  }

  function viewSurf() {
    return head('Riding the wave') +
      `<div class="breath-wrap">
         <div class="breath" aria-hidden="true"><span id="surf-phase">Breathe in</span></div>
         <div class="surf-timer" id="surf-timer">3:00</div>
         <p class="surf-prompt" id="surf-prompt">${esc(ACT_PROMPTS[0])}</p>
       </div>
       <div class="ov-grow"></div>
       <div class="ov-actions">
         <button class="btn btn-big" data-sos="passed">It's passing. I'm okay.</button>
         <button class="btn btn-ghost" id="surf-still" data-sos="still" hidden>Still strong. Show me why I'm doing this</button>
       </div>`;
  }

  function viewWhy() {
    const stats = liveStats();
    return head('Why you are doing this') +
      `<div class="identity">${esc(identity || "I'm someone who doesn't smoke.")}</div>
       ${reasons.length ? `<ul class="reasons">${reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
       <div class="live-stats">${stats.map(s => `<div class="tile"><div class="tile-v">${esc(s.value)}</div><div class="tile-l">${esc(s.label)}</div></div>`).join('')}</div>
       <p class="muted" style="margin-top:14px">One won't undo this, but it will restart the clock on the hardest part. You have come further than the craving wants you to remember.</p>
       <div class="ov-grow"></div>
       <div class="ov-actions">
         <button class="btn btn-big" data-sos="passed">It passed</button>
         <button class="btn btn-ghost" data-sos="still">Still want it. Distract me</button>
       </div>`;
  }

  function viewDistract() {
    if (!st.distraction) pickDistraction();
    const d = st.distraction;
    return head('Do something else for 5 minutes') +
      `<div class="card distract"><div class="d-emoji">${d.emoji}</div><div class="d-text">${esc(d.text)}</div></div>
       <div class="btn-row"><button class="btn btn-ghost" data-sos="another">Another idea</button><button class="btn btn-ghost" data-sos="game">Tap game</button></div>
       <div class="ov-grow"></div>
       <div class="ov-actions">
         <button class="btn btn-big" data-sos="passed">It passed</button>
         <button class="btn btn-outline" data-sos="used">${phase === 'quit' ? "I'm going to slip. Log it honestly." : "I'm going to have one. Log it."}</button>
       </div>`;
  }

  function viewGame() {
    return head('Tap the dot') +
      `<div class="game-hud"><span>Taps: <span id="game-score">0</span></span><span><span id="game-time">45</span>s</span></div>
       <div class="game-field" id="game-field"></div>
       <p class="muted">Keep your hands busy until the timer ends, then check in with the craving.</p>
       <div class="ov-grow"></div>
       <div class="ov-actions" id="game-after" hidden>
         <button class="btn btn-big" data-sos="passed">It passed</button>
         <button class="btn btn-ghost" data-sos="back-distract">Still want it</button>
       </div>`;
  }

  function viewOutcome() {
    const used = st.pendingOutcome === 'used';
    const needProduct = used && products.length > 1 && !st.product;
    const after = st.intensityAfter ?? Math.max(1, st.intensityBefore - (used ? 0 : 3));
    st.intensityAfter = after;
    return head(used ? 'Logging it' : 'Nice work') +
      `<h1>How strong is it now?</h1>
       <div class="int-value" id="sos-int2-v">${after}</div>
       <input type="range" id="sos-int2" min="1" max="10" value="${after}" aria-label="Craving intensity now">
       <div class="int-scale"><span>mild</span><span>overwhelming</span></div>
       ${needProduct ? `<h3 style="margin-top:22px">Which one?</h3><div class="chips">${products.map(p => `<button class="chip ${st.product === p.id ? 'on' : ''}" data-sos="product" data-id="${p.id}">${esc(p.label)}</button>`).join('')}</div>` : ''}
       ${used ? `<p class="muted" style="margin-top:18px">${phase === 'quit' ? 'Logging it keeps the record honest, and honest records are what you learn from. This is a slip, not a relapse.' : 'It counts toward today. The taper is about the pattern over weeks, not one moment.'}</p>` : ''}
       <div class="ov-grow"></div>
       <div class="ov-actions"><button class="btn btn-big" data-sos="finish" ${needProduct ? 'disabled' : ''}>${used ? 'Log it' : 'Save this win'}</button></div>`;
  }

  function viewSummary() {
    const r = st.record;
    const drop = r.intensityBefore - r.intensityAfter;
    const dur = fmtDuration(r.durationSec * 1000);
    let msg;
    if (r.outcome === 'passed') {
      msg = `<p class="summary-big">You rode it out for <strong>${esc(dur)}</strong>.</p>
             <p class="summary-big">Intensity went from <strong>${r.intensityBefore}</strong> to <strong>${r.intensityAfter}</strong>${drop > 0 ? ' without a single puff' : ''}.</p>
             <p class="muted" style="text-align:center">That is one more craving your brain now knows is survivable.</p>`;
    } else if (phase === 'quit') {
      msg = `<p class="summary-big">Logged as a slip.</p>
             <p class="muted" style="text-align:center">A slip is a data point, not a verdict. Do not buy a pack, do not have a second one, and read "Slips vs relapse" in the Program when you are ready. Everything you have learned still counts.</p>`;
    } else {
      msg = `<p class="summary-big">Logged.</p>
             <p class="muted" style="text-align:center">You waited ${esc(dur)} first, which is longer than you would have a month ago. The spacing is the practice.</p>`;
    }
    return head('') + `<div class="celebrate"><div class="c-emoji">${r.outcome === 'passed' ? '🌊' : '📝'}</div></div>${msg}<div class="ov-grow"></div><div class="ov-actions"><button class="btn btn-big" data-sos="close">Done</button></div>`;
  }

  function pickDistraction() {
    let n;
    do { n = Math.floor(Math.random() * DISTRACTIONS.length); } while (DISTRACTIONS.length > 1 && n === st.lastD);
    st.lastD = n;
    st.distraction = DISTRACTIONS[n];
  }

  function startSurf() {
    if (!st.surfStart) st.surfStart = Date.now();
    const total = 180;
    const timerEl = mount.querySelector('#surf-timer');
    const phaseEl = mount.querySelector('#surf-phase');
    const promptEl = mount.querySelector('#surf-prompt');
    const stillBtn = mount.querySelector('#surf-still');
    const tick = () => {
      const el = (Date.now() - st.surfStart) / 1000;
      const left = Math.max(0, total - el);
      timerEl.textContent = left > 0 ? `${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}` : 'Three minutes. Still here.';
      const ph = el % 12;
      phaseEl.textContent = ph < 4 ? 'Breathe in' : ph < 6 ? 'Hold' : 'Breathe out';
      promptEl.textContent = ACT_PROMPTS[Math.floor(el / 20) % ACT_PROMPTS.length];
      if (el >= 40 && stillBtn) stillBtn.hidden = false;
    };
    tick();
    st.timers.push(setInterval(tick, 250));
  }

  function startGame() {
    const field = mount.querySelector('#game-field');
    const scoreEl = mount.querySelector('#game-score');
    const timeEl = mount.querySelector('#game-time');
    const after = mount.querySelector('#game-after');
    let score = 0;
    const start = Date.now(), dur = 45;
    const dot = document.createElement('button');
    dot.className = 'dot-target';
    dot.setAttribute('aria-label', 'Tap');
    field.appendChild(dot);
    const move = () => {
      const r = field.getBoundingClientRect(), size = 56;
      dot.style.left = `${Math.random() * Math.max(0, r.width - size)}px`;
      dot.style.top = `${Math.random() * Math.max(0, r.height - size)}px`;
    };
    move();
    dot.onclick = e => { e.stopPropagation(); score++; scoreEl.textContent = score; move(); };
    const t = setInterval(() => {
      const left = Math.max(0, dur - (Date.now() - start) / 1000);
      timeEl.textContent = Math.ceil(left);
      if (left <= 0) {
        clearInterval(t);
        dot.remove();
        field.innerHTML = `<div class="game-over">${score} taps. Your hands were busy for 45 seconds and the craving got 45 seconds older.</div>`;
        after.hidden = false;
      }
    }, 200);
    st.timers.push(t);
  }

  function finish() {
    const endedAt = Date.now();
    st.record = {
      t: st.startedAt,
      trigger: st.trigger || 'other',
      intensityBefore: st.intensityBefore,
      intensityAfter: st.intensityAfter ?? st.intensityBefore,
      outcome: st.pendingOutcome,
      durationSec: Math.round((endedAt - st.startedAt) / 1000),
    };
    if (st.pendingOutcome === 'used') st.record.product = st.product || (products[0] && products[0].id);
    st.step = 'summary';
    if (onRecord) onRecord(st.record); // saved now, so a reload on the summary screen loses nothing
    render();
  }

  mount.onclick = e => {
    const el = e.target.closest('[data-sos]');
    if (!el) return;
    const act = el.dataset.sos, d = el.dataset;
    switch (act) {
      case 'cancel': cleanup(); onCancel(); break;
      case 'trigger': st.trigger = d.id; render(); break;
      case 'product': st.product = d.id; render(); break;
      case 'start': st.step = 'surf'; render(); break;
      case 'passed': st.pendingOutcome = 'passed'; st.step = 'outcome'; render(); break;
      case 'still':
        if (st.step === 'surf') st.step = 'why';
        else { st.step = 'distract'; pickDistraction(); }
        render(); break;
      case 'another': pickDistraction(); render(); break;
      case 'game': st.step = 'game'; render(); break;
      case 'back-distract': st.step = 'distract'; pickDistraction(); render(); break;
      case 'used': st.pendingOutcome = 'used'; st.step = 'outcome'; render(); break;
      case 'finish': finish(); break;
      case 'close': cleanup(); if (onClose) onClose(); break;
    }
  };
  mount.oninput = e => {
    if (e.target.id === 'sos-int') { st.intensityBefore = +e.target.value; mount.querySelector('#sos-int-v').textContent = e.target.value; changed(); }
    if (e.target.id === 'sos-int2') { st.intensityAfter = +e.target.value; mount.querySelector('#sos-int2-v').textContent = e.target.value; changed(); }
  };

  render();
  return { cancel() { cleanup(); onCancel(); } };
}
