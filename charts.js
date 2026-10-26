// Inline SVG charts. No library, works offline, themed through CSS variables.
import { fmtDate, daysBetween } from './dates.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Daily use (bars) against the taper allowance (step line).
export function taperChart(series, { quitKey, unit }) {
  const W = 360, H = 190, mL = 30, mR = 8, mT = 10, mB = 30;
  const n = series.length;
  if (!n) return '';
  const maxY = Math.max(1, ...series.map(d => Math.max(d.allowance, d.used ?? 0)));
  const plotW = W - mL - mR, plotH = H - mT - mB;
  const slot = plotW / n;
  const bw = Math.max(1.5, slot - Math.min(3, slot * 0.3));
  const x = i => mL + i * slot;
  const y = v => mT + (1 - v / maxY) * plotH;

  const ticks = [0, Math.round(maxY / 2), maxY];
  let g = '';
  for (const t of ticks) {
    g += `<line class="grid" x1="${mL}" x2="${W - mR}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"/>`;
    g += `<text x="${mL - 6}" y="${(y(t) + 4).toFixed(1)}" text-anchor="end">${t}</text>`;
  }

  let bars = '';
  series.forEach((d, i) => {
    if (d.used == null) return;
    const h = Math.max(d.used > 0 ? 2 : 0, (d.used / maxY) * plotH);
    const cls = d.used > d.allowance ? 'bar over' : 'bar';
    bars += `<rect class="${cls}" x="${(x(i) + (slot - bw) / 2).toFixed(1)}" y="${(y(0) - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="1.5"><title>${esc(fmtDate(d.key))}: ${d.used} ${esc(unit)}, target ${d.allowance}</title></rect>`;
  });

  let path = '';
  series.forEach((d, i) => {
    const yy = y(d.allowance).toFixed(1);
    path += (i === 0 ? `M${x(0).toFixed(1)} ${yy}` : ` H${x(i).toFixed(1)} V${yy}`);
  });
  path += ` H${(x(n - 1) + slot).toFixed(1)}`;

  const qi = series.findIndex(d => d.key === quitKey);
  let quit = '';
  if (qi >= 0) {
    const qx = (x(qi) + slot / 2).toFixed(1);
    quit = `<line class="grid quit-mark" x1="${qx}" x2="${qx}" y1="${mT}" y2="${y(0).toFixed(1)}"/><text x="${qx}" y="${H - 4}" text-anchor="middle">quit day</text>`;
  }
  const first = series[0].key, last = series[n - 1].key;
  const labels = `<text x="${mL}" y="${H - 16}">${esc(fmtDate(first))}</text>` +
    (daysBetween(first, last) > 2 ? `<text x="${W - mR}" y="${H - 16}" text-anchor="end">${esc(fmtDate(last))}</text>` : '');

  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Daily ${esc(unit)} compared with the taper target">${g}${bars}<path class="allow" d="${path}"/>${quit}${labels}</svg>` +
    `<div class="legend"><span><i></i>${esc(unit)} logged</span><span><i class="over"></i>over target</span><span><i class="line"></i>daily target</span></div>`;
}

// Cravings by hour of day: 24 bars.
export function hourChart(byHour) {
  const W = 360, H = 120, mL = 22, mR = 6, mT = 8, mB = 22;
  const max = Math.max(1, ...byHour);
  const plotW = W - mL - mR, plotH = H - mT - mB;
  const slot = plotW / 24, bw = slot - 3;
  const y = v => mT + (1 - v / max) * plotH;
  let bars = '', labels = '';
  byHour.forEach((v, h) => {
    const hh = Math.max(v > 0 ? 2 : 0, (v / max) * plotH);
    bars += `<rect class="bar" x="${(mL + h * slot + 1.5).toFixed(1)}" y="${(y(0) - hh).toFixed(1)}" width="${bw.toFixed(1)}" height="${hh.toFixed(1)}" rx="1.5"><title>${hourLabel(h)}: ${v} craving${v === 1 ? '' : 's'}</title></rect>`;
    if (h % 6 === 0) labels += `<text x="${(mL + h * slot + slot / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle">${hourLabel(h)}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Cravings by hour of day"><line class="grid" x1="${mL}" x2="${W - mR}" y1="${y(0).toFixed(1)}" y2="${y(0).toFixed(1)}"/><text x="${mL - 4}" y="${mT + 8}" text-anchor="end">${max}</text>${bars}${labels}</svg>`;
}

function hourLabel(h) {
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

// Cravings by trigger: horizontal bars with direct labels (plain HTML).
export function triggerChart(byTrigger, labelFor) {
  const rows = Object.entries(byTrigger).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (!rows.length) return '<p class="muted">No cravings logged yet.</p>';
  const max = rows[0][1];
  return rows.map(([id, n]) =>
    `<div class="hbar-row"><span class="hbar-label">${esc(labelFor(id))}</span><div class="hbar-track"><div class="hbar" style="width:${Math.max(3, (n / max) * 100).toFixed(0)}%"></div></div><span class="hbar-val">${n}</span></div>`
  ).join('');
}
