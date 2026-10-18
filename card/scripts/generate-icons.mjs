import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return ~c >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'binary');
  const crc = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crc.writeUInt32BE(crc32(toCrc), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function distToSegment(px, py, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - x0, py - y0);
  let t = ((px - x0) * dx + (py - y0) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x0 + t * dx), py - (y0 + t * dy));
}

/**
 * Renders the iconic KTP gold monogram and darkroom frame onto an RGBA PNG buffer.
 * - Background: Darkroom obsidian (#070709)
 * - Accent: Editorial gold (#c9a96e)
 * - Safe zone for maskable icon: fits comfortably inside the 80% circle (diameter 0.8 * size)
 */
export function renderIcon(size, { isMaskable = false } = {}) {
  const width = size;
  const height = size;
  const rowSize = 1 + width * 4;
  const raw = Buffer.alloc(rowSize * height);

  const bgR = 7, bgG = 7, bgB = 9;
  const goldR = 201, goldG = 169, goldB = 110;
  const borderR = 45, borderG = 40, borderB = 30;

  // Maskable icons require all content to reside within 80% safe zone circle (margin >= 10%)
  const scale = (isMaskable ? 0.58 : 0.68) * (size / 64);
  const offsetX = (size - 64 * scale) / 2;
  const offsetY = (size - 64 * scale) / 2;

  const strokeWidth = 5.2 * scale;
  const strokeRadius = strokeWidth / 2;

  // Monogram segments from official brand mark:
  // 1. Vertical backbone: (17, 13) -> (17, 51)
  // 2. Diagonal upper arm: (46, 13) -> (19, 34)
  // 3. Diagonal lower leg: (29, 26) -> (48, 51)
  const segments = [
    [17 * scale + offsetX, 13 * scale + offsetY, 17 * scale + offsetX, 51 * scale + offsetY],
    [46 * scale + offsetX, 13 * scale + offsetY, 19 * scale + offsetX, 34 * scale + offsetY],
    [29 * scale + offsetX, 26 * scale + offsetY, 48 * scale + offsetX, 51 * scale + offsetY],
  ];

  // Optional subtle square frame for non-maskable icons
  const frameMargin = size * 0.08;
  const frameStrokeRadius = Math.max(1, 0.75 * scale);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const px = x + 0.5;
      const py = y + 0.5;

      // Distance to monogram segments
      let minDist = 999999;
      for (const seg of segments) {
        const d = distToSegment(px, py, seg[0], seg[1], seg[2], seg[3]);
        if (d < minDist) minDist = d;
      }

      // Smooth anti-aliased edge for monogram
      let monogramAlpha = 0;
      if (minDist <= strokeRadius - 0.75) {
        monogramAlpha = 1;
      } else if (minDist >= strokeRadius + 0.75) {
        monogramAlpha = 0;
      } else {
        monogramAlpha = (strokeRadius + 0.75 - minDist) / 1.5;
      }

      // Distance to delicate frame (only on non-maskable icons)
      let frameAlpha = 0;
      if (!isMaskable) {
        const dLeft = Math.abs(px - frameMargin);
        const dRight = Math.abs(px - (width - frameMargin));
        const dTop = Math.abs(py - frameMargin);
        const dBottom = Math.abs(py - (height - frameMargin));

        const inX = px >= frameMargin && px <= width - frameMargin;
        const inY = py >= frameMargin && py <= height - frameMargin;

        let dBorder = 999999;
        if (inX) dBorder = Math.min(dBorder, dTop, dBottom);
        if (inY) dBorder = Math.min(dBorder, dLeft, dRight);

        if (dBorder <= frameStrokeRadius - 0.5) frameAlpha = 0.4;
        else if (dBorder <= frameStrokeRadius + 0.5) frameAlpha = 0.4 * (frameStrokeRadius + 0.5 - dBorder);
      }

      // Base background
      let r = bgR, g = bgG, b = bgB;

      // Blend frame
      if (frameAlpha > 0 && monogramAlpha < 1) {
        r = Math.round(borderR * frameAlpha + r * (1 - frameAlpha));
        g = Math.round(borderG * frameAlpha + g * (1 - frameAlpha));
        b = Math.round(borderB * frameAlpha + b * (1 - frameAlpha));
      }

      // Blend gold monogram over top
      if (monogramAlpha > 0) {
        r = Math.round(goldR * monogramAlpha + r * (1 - monogramAlpha));
        g = Math.round(goldG * monogramAlpha + g * (1 - monogramAlpha));
        b = Math.round(goldB * monogramAlpha + b * (1 - monogramAlpha));
      }

      raw[pxOffset] = r;
      raw[pxOffset + 1] = g;
      raw[pxOffset + 2] = b;
      raw[pxOffset + 3] = 255; // Solid opaque (required for PWA and iOS)
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = deflateSync(raw);
  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', idat),
    createChunk('IEND', Buffer.alloc(0))
  ]);
}

// Generate files if executed directly
const targetDir = resolve(import.meta.dirname, '../public');
mkdirSync(targetDir, { recursive: true });

const iconsToGenerate = [
  { file: 'icon-192x192.png', size: 192, isMaskable: false },
  { file: 'icon-512x512.png', size: 512, isMaskable: false },
  { file: 'icon-maskable-512x512.png', size: 512, isMaskable: true },
  { file: 'apple-touch-icon.png', size: 180, isMaskable: false },
];

for (const { file, size, isMaskable } of iconsToGenerate) {
  const filePath = resolve(targetDir, file);
  const buffer = renderIcon(size, { isMaskable });
  writeFileSync(filePath, buffer);
  console.log(`[PWA ICON] Generated ${file} (${size}x${size}, maskable=${isMaskable})`);
}
