// Generates the PWA icons (a sprout on a teal tile) as PNGs with no dependencies.
// Run: node tools/make-icons.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'icons');
mkdirSync(outDir, { recursive: true });

const TABLE = [];
for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; TABLE.push(c >>> 0); }
function crc32(buf) { let c = 0xffffffff; for (const b of buf) c = TABLE[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function encodePNG(w, h, px) {
  const stride = w * 4 + 1, raw = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    raw[y * stride] = 0;
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = px(x, y), o = y * stride + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

function roundedSquare(u, v, r) {
  const x = Math.abs(u - 0.5), y = Math.abs(v - 0.5), h = 0.5 - r;
  const dx = Math.max(0, x - h), dy = Math.max(0, y - h);
  return dx * dx + dy * dy <= r * r;
}
function ellipse(u, v, cx, cy, rx, ry, ang) {
  const c = Math.cos(ang), s = Math.sin(ang), dx = u - cx, dy = v - cy;
  const lx = dx * c + dy * s, ly = -dx * s + dy * c;
  return (lx * lx) / (rx * rx) + (ly * ly) / (ry * ry) <= 1;
}
function capsule(u, v, x1, y1, x2, y2, r) {
  const dx = x2 - x1, dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((u - x1) * dx + (v - y1) * dy) / (dx * dx + dy * dy)));
  const px = x1 + t * dx, py = y1 + t * dy;
  return (u - px) ** 2 + (v - py) ** 2 <= r * r;
}

const BG = [31, 138, 122], STEM = [236, 248, 245], LEAF = [205, 237, 229];
const SS = 4;
function render(size, maskable) {
  return encodePNG(size, size, (x, y) => {
    let bg = 0, stem = 0, leaf = 0;
    for (let i = 0; i < SS; i++) for (let j = 0; j < SS; j++) {
      const u = (x + (i + 0.5) / SS) / size, v = (y + (j + 0.5) / SS) / size;
      const su = maskable ? (u - 0.5) / 0.8 + 0.5 : u, sv = maskable ? (v - 0.5) / 0.8 + 0.5 : v;
      if (maskable || roundedSquare(u, v, 0.22)) bg++;
      if (capsule(su, sv, 0.5, 0.76, 0.5, 0.40, 0.035) || capsule(su, sv, 0.5, 0.36, 0.5, 0.36, 0.05)) stem++;
      else if (ellipse(su, sv, 0.375, 0.53, 0.165, 0.085, -0.65) || ellipse(su, sv, 0.625, 0.45, 0.165, 0.085, 0.65)) leaf++;
    }
    const n = SS * SS, a = bg / n;
    if (a === 0) return [0, 0, 0, 0];
    const fs = stem / n, fl = leaf / n, fb = Math.max(0, 1 - fs - fl);
    const mix = k => Math.round(BG[k] * fb + STEM[k] * fs + LEAF[k] * fl);
    return [mix(0), mix(1), mix(2), Math.round(a * 255)];
  });
}

writeFileSync(join(outDir, 'icon-192.png'), render(192, false));
writeFileSync(join(outDir, 'icon-512.png'), render(512, false));
writeFileSync(join(outDir, 'maskable-512.png'), render(512, true));
console.log('icons written to', outDir);
