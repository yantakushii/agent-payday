#!/usr/bin/env node
// AGENT PAYDAY — the deterministic brand kit for make.fun's coin bounty.
// Standard library only. No network. Same input, same bytes, every run.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const OUT = process.env.MAKEFUN_OUTPUT_DIR || join(process.cwd(), 'out');

const COIN = {
  name: 'Agent Payday',
  symbol: 'PAYDAY',
  website: 'https://make.fun/bounty/makefun-coin-promo-01',
  chain: 'solana',
};

const DESCRIPTION = [
  'AI agents get paid for shipping software. This coin is for make.fun bounty makefun-coin-promo-01.',
  'make.fun is a marketplace where AI agents take coding bounties and win USDC on Solana:',
  'a prompt goes in, an agent writes the code, the code is graded, the reward is claimed from escrow.',
  'AGENT PAYDAY is the payday itself: every agent that ships turns a prompt into a paycheck.',
  COIN.website,
].join(' ');

// ---------------------------------------------------------------- canvas ---
const W = 512;
const H = 512;

function canvas(w, h) {
  return { w, h, px: new Uint8Array(w * h * 3) };
}

function put(c, x, y, r, g, b, a = 1) {
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;
  const i = (y * c.w + x) * 3;
  const k = 1 - a;
  c.px[i] = Math.round(c.px[i] * k + r * a);
  c.px[i + 1] = Math.round(c.px[i + 1] * k + g * a);
  c.px[i + 2] = Math.round(c.px[i + 2] * k + b * a);
}

function rect(c, x, y, w, h, col, a = 1) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) put(c, i, j, col[0], col[1], col[2], a);
}

function disc(c, cx, cy, r, col, a = 1) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++) {
    for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r * r) put(c, x, y, col[0], col[1], col[2], a);
    }
  }
}

function ring(c, cx, cy, r, thickness, col, a = 1) {
  const inner = r - thickness;
  for (let y = Math.floor(cy - r); y <= cy + r; y++) {
    for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const d = dx * dx + dy * dy;
      if (d <= r * r && d >= inner * inner) put(c, x, y, col[0], col[1], col[2], a);
    }
  }
}

function bar(c, x0, y0, x1, y1, width, col) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    disc(c, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, width / 2, col);
  }
}

// A triangle-free upward payday arrow, drawn from three bars.
function candle(c, x, baseY, topY, w, col) {
  rect(c, x - w / 2, topY, w, baseY - topY, col);
}

// --------------------------------------------------------------- drawing ---
const GOLD = [255, 197, 66];
const AMBER = [255, 145, 32];
const INK = [10, 16, 32];
const DEEP = [18, 28, 56];
const MINT = [66, 244, 173];
const WHITE = [245, 248, 255];

function drawLogo() {
  const c = canvas(W, H);

  // radial-ish background wash, computed from distance, never random
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = (x - W / 2) / (W / 2);
      const dy = (y - H / 2) / (H / 2);
      const d = Math.min(1, Math.sqrt(dx * dx + dy * dy));
      const t = d * d;
      put(c, x, y, INK[0] * t + DEEP[0] * (1 - t) + 20 * (1 - d), INK[1] * t + DEEP[1] * (1 - t) + 26 * (1 - d), INK[2] * t + DEEP[2] * (1 - t) + 60 * (1 - d));
    }
  }

  // dotted board behind the coin
  for (let gy = 0; gy < 8; gy++) {
    for (let gx = 0; gx < 8; gx++) {
      disc(c, 40 + gx * 62, 44 + gy * 64, 2.2, [60, 90, 160], 0.5);
    }
  }

  // the coin: gold rim, dark face, gold inner ring
  disc(c, 256, 256, 168, AMBER, 1);
  disc(c, 256, 252, 164, GOLD, 1);
  disc(c, 256, 252, 142, INK, 1);
  ring(c, 256, 252, 132, 4, [255, 222, 130], 0.85);

  // payday chart inside the face: four candles rising, mint highlight
  candle(c, 176, 330, 268, 26, [120, 150, 220]);
  candle(c, 224, 330, 232, 26, [140, 175, 240]);
  candle(c, 272, 330, 196, 26, MINT);
  candle(c, 320, 330, 160, 26, GOLD);
  rect(c, 150, 336, 196, 6, [120, 150, 220], 0.9);
  bar(c, 168, 300, 336, 140, 12, GOLD);

  // arrow head of the rising line
  bar(c, 336, 140, 316, 132, 13, GOLD);
  bar(c, 336, 140, 344, 122, 13, GOLD);

  // the agent: a small antenna above the coin (a bot that ships)
  bar(c, 256, 88, 256, 116, 8, WHITE);
  disc(c, 256, 82, 11, MINT, 1);

  // value ticks around the rim
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const x0 = 256 + Math.cos(angle) * 148;
    const y0 = 252 + Math.sin(angle) * 148;
    const x1 = 256 + Math.cos(angle) * 156;
    const y1 = 252 + Math.sin(angle) * 156;
    bar(c, x0, y0, x1, y1, 3, [255, 222, 130]);
  }

  return c;
}

// ------------------------------------------------------------------- png ---
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(c) {
  const raw = Buffer.alloc((c.w * 3 + 1) * c.h);
  let o = 0;
  for (let y = 0; y < c.h; y++) {
    raw[o++] = 0;
    for (let x = 0; x < c.w; x++) {
      const i = (y * c.w + x) * 3;
      raw[o++] = c.px[i];
      raw[o++] = c.px[i + 1];
      raw[o++] = c.px[i + 2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(c.w, 0);
  ihdr.writeUInt32BE(c.h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------------- run ---
mkdirSync(OUT, { recursive: true });
const logo = encodePng(drawLogo());
writeFileSync(join(OUT, 'logo.png'), logo);
writeFileSync(join(OUT, 'name.txt'), COIN.name + '\n');
writeFileSync(join(OUT, 'symbol.txt'), COIN.symbol + '\n');
writeFileSync(join(OUT, 'description.txt'), DESCRIPTION + '\n');
writeFileSync(
  join(OUT, 'metadata.json'),
  JSON.stringify(
    {
      name: COIN.name,
      symbol: COIN.symbol,
      description: DESCRIPTION,
      website: COIN.website,
      createdOn: 'pump.fun',
      logo_sha256: 'set on launch',
    },
    null,
    2,
  ) + '\n',
);
console.log('wrote', OUT, 'logo', logo.length, 'bytes');