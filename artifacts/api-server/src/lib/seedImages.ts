import { deflateSync } from "zlib";

function crc32Table(): Uint32Array {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
}
const CRC_TABLE = crc32Table();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)) >>> 0;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeB = Buffer.from(type, "ascii");
  const all = Buffer.concat([typeB, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(all));
  return Buffer.concat([len, typeB, data, crcBuf]);
}

export function createGradientPNG(
  w: number,
  h: number,
  topColor: [number, number, number],
  bottomColor: [number, number, number],
  accentColor?: [number, number, number]
): string {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    const t = y / (h - 1);
    const base = y * (w * 3 + 1);
    raw[base] = 0; // filter: None
    for (let x = 0; x < w; x++) {
      const s = x / (w - 1);
      // vertical gradient + optional diagonal accent
      let r = Math.round(topColor[0] * (1 - t) + bottomColor[0] * t);
      let g = Math.round(topColor[1] * (1 - t) + bottomColor[1] * t);
      let b = Math.round(topColor[2] * (1 - t) + bottomColor[2] * t);
      // circular vignette for depth
      const dx = (x - w / 2) / (w / 2);
      const dy = (y - h / 2) / (h / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const darken = Math.min(0.35, dist * 0.3);
      r = Math.round(r * (1 - darken));
      g = Math.round(g * (1 - darken));
      b = Math.round(b * (1 - darken));
      // diagonal accent stripe
      if (accentColor) {
        const stripe = Math.sin((x + y) * 0.05);
        const intensity = Math.max(0, stripe * 0.12);
        r = Math.min(255, Math.round(r * (1 - intensity) + accentColor[0] * intensity));
        g = Math.min(255, Math.round(g * (1 - intensity) + accentColor[1] * intensity));
        b = Math.min(255, Math.round(b * (1 - intensity) + accentColor[2] * intensity));
      }
      raw[base + 1 + x * 3] = r;
      raw[base + 1 + x * 3 + 1] = g;
      raw[base + 1 + x * 3 + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  const compressed = deflateSync(raw);
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  return png.toString("base64");
}

// Palette per art style
export const STYLE_PALETTES: Record<string, {
  top: [number, number, number];
  bottom: [number, number, number];
  accent?: [number, number, number];
}> = {
  Cartoon:     { top: [255, 107, 53],  bottom: [255, 179, 71], accent: [255, 224, 102] },
  Watercolor:  { top: [126, 200, 227], bottom: [212, 165, 201], accent: [180, 220, 250] },
  "Oil Paint": { top: [139, 69, 19],   bottom: [210, 105, 30], accent: [218, 165, 32] },
  "Pop Art":   { top: [255, 20, 147],  bottom: [255, 215, 0],  accent: [0, 206, 209] },
  Sketch:      { top: [74, 74, 74],    bottom: [176, 176, 176], accent: [220, 220, 220] },
  "Pixel Art": { top: [38, 166, 154],  bottom: [77, 182, 172], accent: [128, 203, 196] },
  Anime:       { top: [236, 64, 122],  bottom: [255, 128, 171], accent: [255, 200, 221] },
  "3D Render": { top: [92, 107, 192],  bottom: [121, 134, 203], accent: [159, 168, 218] },
};
