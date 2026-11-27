// news-image-20261126 — "The World in One Day: 26 November 2026"
// Node 22, standard library only. Draws a 1024x1024 newspaper front page
// (5 main story panels + ticker strip) into a raw RGB buffer, then encodes
// a deterministic PNG with node:zlib. No network, no randomness, no time
// dependence: the same input always produces the same bytes.
//
// Usage: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------------------
// PNG encoding (deterministic: fixed filter 0, zlib level 9, no timestamps)
// ---------------------------------------------------------------------------

const CRC_TABLE: number[] = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table.push(c >>> 0);
  }
  return table;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  const crc = crc32(out.subarray(4, 8 + data.length));
  view.setUint32(8 + data.length, crc);
  return out;
}

function encodePng(rgb: Uint8Array, width: number, height: number): Uint8Array {
  const raw = new Uint8Array(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 3)] = 0; // filter: None
    raw.set(rgb.subarray(y * width * 3, (y + 1) * width * 3), y * (1 + width * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  const ihdr = new Uint8Array(13);
  const v = new DataView(ihdr.buffer);
  v.setUint32(0, width);
  v.setUint32(4, height);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour RGB
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const parts = [sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', new Uint8Array(0))];
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) { out.set(p, off); off += p.length; }
  return out;
}

// ---------------------------------------------------------------------------
// 5x7 bitmap font (authored glyphs; '#' = ink). ASCII only in image text.
// ---------------------------------------------------------------------------

type Glyph = string[];
const FONT: Record<string, Glyph> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.####', '#....', '#....', '#.###', '#...#', '#...#', '.###.'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '...#.', '..#..', '..#..', '..#..'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
  '.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
  ',': ['.....', '.....', '.....', '.....', '.##..', '.##..', '.#...'],
  ':': ['.....', '.##..', '.##..', '.....', '.##..', '.##..', '.....'],
  ';': ['.....', '.##..', '.##..', '.....', '.##..', '.##..', '.#...'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
  "'": ['..#..', '..#..', '.#...', '.....', '.....', '.....', '.....'],
  '(': ['...#.', '..#..', '.#...', '.#...', '.#...', '..#..', '...#.'],
  ')': ['.#...', '..#..', '...#.', '...#.', '...#.', '..#..', '.#...'],
  '/': ['....#', '....#', '...#.', '...#.', '..#..', '.#...', '#....'],
  '%': ['#...#', '#..#.', '...#.', '..#..', '.#...', '#..#.', '#...#'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  '&': ['.###.', '#...#', '#...#', '.#...', '#.#.#', '#..#.', '.##.#'],
  '=': ['.....', '.....', '#####', '.....', '#####', '.....', '.....'],
  '"': ['.#.#.', '.#.#.', '.....', '.....', '.....', '.....', '.....'],
  '*': ['.....', '.#.#.', '..#..', '#####', '..#..', '.#.#.', '.....'],
  '[': ['.###.', '.#...', '.#...', '.#...', '.#...', '.#...', '.###.'],
  ']': ['.###.', '...#.', '...#.', '...#.', '...#.', '...#.', '.###.'],
};

const BLANK: Glyph = ['.....', '.....', '.....', '.....', '.....', '.....', '.....'];

function textWidth(text: string, scale: number): number {
  return text.length * 6 * scale - scale;
}

// ---------------------------------------------------------------------------
// Canvas: raw RGB buffer + shape/text drawing
// ---------------------------------------------------------------------------

type RGB = [number, number, number];

class Canvas {
  buf = new Uint8Array(W * H * 3);
  set(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    this.buf[i] = c[0]; this.buf[i + 1] = c[1]; this.buf[i + 2] = c[2];
  }
  fill(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c);
  }
  rect(x: number, y: number, w: number, h: number, c: RGB, t = 1): void {
    this.fill(x, y, w, t, c);
    this.fill(x, y + h - t, w, t, c);
    this.fill(x, y, t, h, c);
    this.fill(x + w - t, y, t, h, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: RGB, t = 1): void {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, x = x0, y = y0;
    for (;;) {
      this.fill(x - ((t - 1) >> 1), y - ((t - 1) >> 1), t, t, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x += sx; }
      if (e2 <= dx) { err += dx; y += sy; }
    }
  }
  circle(cx: number, cy: number, r: number, c: RGB): void {
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++)
        if (x * x + y * y <= r * r) this.set(cx + x, cy + y, c);
  }
  ring(cx: number, cy: number, r: number, c: RGB, t = 2): void {
    for (let a = 0; a < 360; a += 1) {
      const rad = (a * Math.PI) / 180;
      for (let k = 0; k < t; k++)
        this.set(Math.round(cx + (r - k) * Math.cos(rad)), Math.round(cy + (r - k) * Math.sin(rad)), c);
    }
  }
  text(x: number, y: number, s: string, scale: number, c: RGB): number {
    let cx = x;
    for (const ch of s.toUpperCase()) {
      const g = FONT[ch] ?? BLANK;
      for (let r = 0; r < 7; r++)
        for (let col = 0; col < 5; col++)
          if (g[r][col] === '#') this.fill(cx + col * scale, y + r * scale, scale, scale, c);
      cx += 6 * scale;
    }
    return cx - x - scale;
  }
  // Word-wrap plain text to maxWidth; returns lines. Long words are split.
  wrap(s: string, scale: number, maxWidth: number): string[] {
    const words = s.split(' ');
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      const cand = cur ? cur + ' ' + w : w;
      if (textWidth(cand, scale) <= maxWidth) { cur = cand; continue; }
      if (cur) lines.push(cur);
      if (textWidth(w, scale) > maxWidth) {
        let part = '';
        for (const ch of w) {
          if (textWidth(part + ch, scale) > maxWidth) { lines.push(part); part = ch; }
          else part += ch;
        }
        cur = part;
      } else cur = w;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  // Draw wrapped lines, centred on centreX. Returns y after last line.
  para(x: number, y: number, maxWidth: number, lines: string[], scale: number, c: RGB, lh: number, centreX?: number): number {
    let yy = y;
    for (const ln of lines) {
      const w = textWidth(ln, scale);
      this.text(centreX !== undefined ? centreX - Math.floor(w / 2) : x, yy, ln, scale, c);
      yy += lh;
    }
    return yy;
  }
}

// ---------------------------------------------------------------------------
// Colours
// ---------------------------------------------------------------------------
const PAPER: RGB = [246, 241, 227];
const INK: RGB = [25, 25, 25];
const PANEL_BG: RGB = [255, 253, 246];
const WHITE: RGB = [255, 255, 255];
const RED: RGB = [163, 31, 31];
const NAVY: RGB = [31, 58, 95];
const MAROON: RGB = [140, 47, 57];
const AMBER: RGB = [180, 90, 0];
const SLATE: RGB = [44, 74, 110];
const TICKER_BG: RGB = [22, 35, 58];
const GOLD: RGB = [212, 160, 60];
const GREY: RGB = [120, 120, 115];
const ORANGE: RGB = [230, 110, 20];
const YELLOW: RGB = [240, 200, 40];

// ---------------------------------------------------------------------------
// Pictograms (simple flat shapes drawn in each panel's art band)
// ---------------------------------------------------------------------------

function drawDrone(cv: Canvas, cx: number, cy: number): void {
  cv.fill(cx - 26, cy - 8, 52, 16, INK); // body
  cv.fill(cx - 8, cy - 14, 16, 28, INK);
  cv.line(cx - 26, cy - 6, cx - 52, cy - 26, INK, 3);
  cv.line(cx + 26, cy - 6, cx + 52, cy - 26, INK, 3);
  cv.line(cx - 26, cy + 6, cx - 52, cy + 26, INK, 3);
  cv.line(cx + 26, cy + 6, cx + 52, cy + 26, INK, 3);
  for (const [rx, ry] of [[-52, -26], [52, -26], [-52, 26], [52, 26]] as const) {
    cv.fill(cx + rx - 16, cy + ry - 2, 32, 4, INK);
    cv.circle(cx + rx, cy + ry, 4, INK);
  }
  cv.ring(cx, cy + 36, 9, RED, 3); // target below
  cv.line(cx - 13, cy + 36, cx + 13, cy + 36, RED, 2);
  cv.line(cx, cy + 26, cx, cy + 45, RED, 2);
}

function drawKyiv(cv: Canvas, cx: number, cy: number): void {
  // buildings
  cv.fill(cx - 78, cy - 6, 34, 52, NAVY);
  cv.fill(cx - 38, cy - 26, 40, 72, SLATE);
  cv.fill(cx + 8, cy - 2, 30, 48, NAVY);
  cv.fill(cx + 44, cy - 18, 30, 64, SLATE);
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 3; c++) cv.fill(cx - 70 + c * 11, cy + 4 + r * 11, 6, 6, GOLD);
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < 3; c++) cv.fill(cx - 30 + c * 11, cy - 16 + r * 11, 6, 6, GOLD);
  // incoming missile, top right to centre
  cv.line(cx + 96, cy - 52, cx + 30, cy - 6, RED, 4);
  cv.circle(cx + 30, cy - 6, 7, ORANGE);
  cv.circle(cx + 30, cy - 6, 3, YELLOW);
  cv.circle(cx + 52, cy - 22, 9, GREY);
  cv.circle(cx + 66, cy - 32, 12, GREY);
}

function drawVirus(cv: Canvas, cx: number, cy: number): void {
  for (let a = 0; a < 12; a++) {
    const rad = (a * 30 * Math.PI) / 180;
    const x1 = Math.round(cx + 26 * Math.cos(rad)), y1 = Math.round(cy + 26 * Math.sin(rad));
    const x2 = Math.round(cx + 40 * Math.cos(rad)), y2 = Math.round(cy + 40 * Math.sin(rad));
    cv.line(x1, y1, x2, y2, MAROON, 3);
    cv.circle(x2, y2, 4, MAROON);
  }
  cv.circle(cx, cy, 26, MAROON);
  cv.circle(cx - 9, cy - 7, 6, WHITE);
  cv.circle(cx + 9, cy + 8, 5, WHITE);
  cv.circle(cx + 10, cy - 10, 4, [255, 200, 200]);
}

function drawRefinery(cv: Canvas, cx: number, cy: number): void {
  cv.fill(cx - 84, cy + 6, 168, 40, INK); // ground plant
  cv.fill(cx - 70, cy - 30, 18, 36, SLATE); // tower 1
  cv.fill(cx - 44, cy - 44, 14, 50, SLATE); // chimney
  cv.fill(cx - 22, cy - 18, 44, 24, NAVY); // tank
  cv.fill(cx + 30, cy - 34, 16, 40, SLATE); // tower 2
  cv.fill(cx + 54, cy - 10, 26, 16, NAVY);
  // flames: bright cores over the towers
  cv.circle(cx - 48, cy - 56, 10, ORANGE);
  cv.circle(cx - 48, cy - 60, 5, YELLOW);
  cv.circle(cx + 38, cy - 58, 9, ORANGE);
  cv.circle(cx + 38, cy - 62, 5, YELLOW);
  // smoke
  cv.circle(cx - 76, cy - 52, 10, GREY);
  cv.circle(cx - 60, cy - 64, 13, GREY);
  cv.circle(cx + 62, cy - 58, 11, GREY);
}

function drawStorm(cv: Canvas, cx: number, cy: number): void {
  cv.circle(cx - 34, cy - 6, 22, GREY);
  cv.circle(cx - 6, cy - 16, 28, [90, 90, 88]);
  cv.circle(cx + 26, cy - 4, 22, GREY);
  cv.fill(cx - 56, cy - 6, 112, 22, [90, 90, 88]);
  // lightning bolt
  cv.line(cx - 8, cy + 12, cx - 20, cy + 38, YELLOW, 5);
  cv.line(cx - 20, cy + 38, cx - 8, cy + 38, YELLOW, 5);
  cv.line(cx - 8, cy + 38, cx - 18, cy + 62, YELLOW, 5);
  // rain
  for (const dx of [-48, -30, 28, 46] as const) cv.line(cx + dx, cy + 16, cx + dx - 6, cy + 34, SLATE, 3);
  // deflated balloon, grounded
  cv.circle(cx + 62, cy + 34, 16, RED);
  cv.line(cx + 62, cy + 50, cx + 62, cy + 62, RED, 2);
}

// ---------------------------------------------------------------------------
// Page layout
// ---------------------------------------------------------------------------

interface Story {
  kicker: string;
  accent: RGB;
  art: (cv: Canvas, cx: number, cy: number) => void;
  headline: string;
  body: string;
}

// All five stories happened or were first reported on 26 Nov 2026:
//  1. Kuwait drone strike — Reuters, 26 Nov 2026.
//  2. Kyiv missile strike — NY Post / Reuters, 26 Nov 2026.
//  3. Congo Ebola 12,021 cases / 5,904 deaths — Reuters / UN News, 26 Nov 2026.
//  4. Bangkok refinery blast, 9 hurt — CNN, 26 Nov 2026.
//  5. US Thanksgiving storm, ~900k without power — Reuters / AP, 26 Nov 2026.
// Excluded as 25 Nov stories: Shenzhou-24, Houthi Ras Tanura strike, Cairo
// tanker fire, Trump tariffs on 14 partners, AI stock selloff.
const STORIES: Story[] = [
  {
    kicker: 'MIDDLE EAST - WAR SPILLS OVER',
    accent: RED,
    art: drawDrone,
    headline: 'IRANIAN DRONE KILLS 2 ITALIANS IN KUWAIT',
    body: 'Two technicians for Rheinmetall Italia died in a drone strike on an air-defence site in Kuwait, Italy said. Rome blames an Iranian drone as the war spreads across the Gulf.',
  },
  {
    kicker: 'UKRAINE - RUSSIA STRIKES CAPITAL',
    accent: NAVY,
    art: drawKyiv,
    headline: 'MISSILES HIT KYIV MALL; 7 WOUNDED',
    body: 'Russia fired ballistic missiles and 113 drones overnight, Kyiv said. A shopping centre and two buildings were hit as winter bombing intensifies.',
  },
  {
    kicker: 'AFRICA - HEALTH',
    accent: MAROON,
    art: drawVirus,
    headline: 'EBOLA IN CONGO PASSES 12,000 CASES',
    body: 'Confirmed infections reach 12,021 and deaths 5,904, government data show. It is the second-largest Ebola outbreak ever recorded.',
  },
  {
    kicker: 'ASIA - INDUSTRIAL DISASTER',
    accent: AMBER,
    art: drawRefinery,
    headline: 'BLAST AT BANGKOK REFINERY HURTS 9',
    body: 'An explosion and fire at Bangchak\'s Phra Khanong refinery injured nine, three critically. All production was shut down; the cause is under investigation.',
  },
];

const STORM = {
  kicker: 'UNITED STATES - THANKSGIVING',
  headline: 'STORM BLACKS OUT 900,000 ON THANKSGIVING',
  body: 'A nor\'easter cut power to nearly a million homes and delayed 2,200+ flights. Macy\'s 100th parade moved to Saturday - a first.',
};

const TICKER =
  'ALSO TODAY - 13 DEAD IN INDONESIA GOLD-MINE FLOOD / GUINEA-BISSAU JUNTA DELAYS ELECTIONS TO 2028 / HOUTHIS STRIKE JIZAN PORT / EU OPENS BUDGET SUMMIT / BANK OF KOREA HIKES RATES TO 3.25% / NVIDIA HALTS SERVER SHIPMENTS TO SE ASIA / GAZA STRIKE KILLS HAMAS DEPUTY MINISTER / FCC CLEARS SPACEX PLAN FOR 1M SATELLITES / ANDY TAYLOR OF DURAN DURAN DIES AT 65';

function drawPanel(cv: Canvas, x: number, y: number, w: number, h: number, s: Story): void {
  cv.fill(x, y, w, h, PANEL_BG);
  cv.rect(x, y, w, h, INK, 2);
  cv.fill(x + 2, y + 2, w - 4, 34, s.accent);
  const kw = textWidth(s.kicker, 2);
  cv.text(x + Math.floor((w - kw) / 2), y + 11, s.kicker, 2, WHITE);
  const headLines = cv.wrap(s.headline, 3, w - 32);
  let yy = cv.para(x + 16, y + 50, w - 32, headLines, 3, INK, 26);
  const bodyLines = cv.wrap(s.body, 2, w - 32);
  cv.para(x + 16, yy + 10, w - 32, bodyLines, 2, [40, 40, 40], 17);
  const artY = y + h - 84;
  cv.fill(x + 2, artY, w - 4, 82, [238, 232, 214]);
  cv.line(x + 2, artY, x + w - 2, artY, INK, 2);
  s.art(cv, x + Math.floor(w / 2), artY + 41);
}

function main(): void {
  const cv = new Canvas();
  cv.fill(0, 0, W, H, PAPER);
  cv.rect(6, 6, W - 12, H - 12, INK, 3);

  // Masthead
  const title = 'THE WORLD IN ONE DAY';
  cv.text(Math.floor((W - textWidth(title, 4)) / 2), 26, title, 4, INK);
  const date = 'THURSDAY 26 NOVEMBER 2026';
  cv.text(Math.floor((W - textWidth(date, 4)) / 2), 66, date, 4, RED);
  cv.fill(16, 106, W - 32, 3, INK);
  const sub = 'FIVE STORIES THAT DEFINED THE DAY - FROM KUWAIT TO KYIV, CONGO TO BANGKOK';
  cv.text(Math.floor((W - textWidth(sub, 2)) / 2), 118, sub, 2, [70, 70, 70]);

  // 2x2 grid of main panels
  const pw = 488, ph = 300;
  drawPanel(cv, 16, 152, pw, ph, STORIES[0]);
  drawPanel(cv, 520, 152, pw, ph, STORIES[1]);
  drawPanel(cv, 16, 464, pw, ph, STORIES[2]);
  drawPanel(cv, 520, 464, pw, ph, STORIES[3]);

  // Wide storm panel
  const sx = 16, sy = 776, sw = 992, sh = 108;
  cv.fill(sx, sy, sw, sh, PANEL_BG);
  cv.rect(sx, sy, sw, sh, INK, 2);
  cv.fill(sx + 2, sy + 2, 380, 26, SLATE);
  cv.text(sx + 12, sy + 8, STORM.kicker, 2, WHITE);
  const sHead = cv.wrap(STORM.headline, 3, 800);
  cv.para(sx + 16, sy + 38, 800, sHead, 3, INK, 26);
  const sBody = cv.wrap(STORM.body, 2, 800);
  cv.para(sx + 16, sy + 38 + sHead.length * 26 + 6, 800, sBody, 2, [40, 40, 40], 17);
  drawStorm(cv, sx + 860, sy + 48);

  // Ticker strip
  const tx = 16, ty = 896, tw = 992, th = 112;
  cv.fill(tx, ty, tw, th, TICKER_BG);
  cv.rect(tx, ty, tw, th, INK, 2);
  const tLines = cv.wrap(TICKER, 2, tw - 32);
  cv.para(tx + 16, ty + 12, tw - 32, tLines, 2, [246, 241, 227], 17);

  const png = encodePng(cv.buf, W, H);
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'entry.png'), png);
}

main();

