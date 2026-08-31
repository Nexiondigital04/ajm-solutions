/* Zerlegt "AJM LOGO Transsparent-01.png" in die Web-Assets:
 *   ajm-mark.png       Signet (Original-Farben)
 *   ajm-wordmark.png   Schriftzug, umgefaerbt fuer dunklen Grund
 *   ajm-mark-512.png   Favicon / Social
 *
 * Aufruf:  node tools/extract.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { decodePng, encodePng, crop, resize, bbox, rowProfile } from "./png.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = process.env.AJM_SRC
  ?? "C:\\Users\\yasma\\Desktop\\AJM solutions\\AJM LOGO Transsparent-01.png";
const OUT = resolve(HERE, "../site/assets/img");

// Zielfarben auf dunklem Grund
const TEXT = [0xee, 0xf3, 0xf8];
const BLUE = [0x2f, 0x92, 0xcf];

mkdirSync(OUT, { recursive: true });

const img = decodePng(readFileSync(SRC));
const rows = rowProfile(img);
const bb = bbox(img);

// Horizontale Baender (Signet / Schriftzug / Streupixel) ueber Leerzeilen trennen
const bands = [];
let start = null;
for (let y = bb.y0; y <= bb.y1 + 1; y++) {
  if (rows[y] > 0 && start === null) start = y;
  else if (rows[y] === 0 && start !== null) { bands.push([start, y - 1]); start = null; }
}

const total = bands.reduce((s, [a, b]) => s + (b - a + 1), 0);
const solid = bands.filter(([a, b]) => (b - a + 1) / total > 0.02);
if (solid.length < 2) throw new Error("Signet/Schriftzug nicht gefunden");

const [markBand, wordBand] = solid;
console.log("Signet   :", markBand.join(" .. "));
console.log("Schriftzug:", wordBand.join(" .. "));

/** enge x-Grenzen innerhalb eines Zeilenbereichs */
function xRange([y0, y1]) {
  let x0 = img.width, x1 = -1;
  for (let y = y0; y <= y1; y++) {
    for (let x = 0; x < img.width; x++) {
      if (img.data[(y * img.width + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
      }
    }
  }
  return [x0, x1];
}

function cut(band, pad = 0) {
  const [y0, y1] = band;
  const [x0, x1] = xRange(band);
  const px = Math.max(0, x0 - pad), py = Math.max(0, y0 - pad);
  return crop(img, px, py,
    Math.min(img.width - px, x1 - x0 + 1 + pad * 2),
    Math.min(img.height - py, y1 - y0 + 1 + pad * 2));
}

/** schwarz -> hell, blau -> helleres blau; Alpha bleibt unangetastet */
function recolor(im) {
  for (let i = 0; i < im.width * im.height; i++) {
    const d = i * 4;
    if (im.data[d + 3] === 0) continue;
    const isBlue = im.data[d + 2] >= 40 && im.data[d + 2] > im.data[d];
    const c = isBlue ? BLUE : TEXT;
    im.data[d] = c[0]; im.data[d + 1] = c[1]; im.data[d + 2] = c[2];
  }
  return im;
}

function save(name, im, targetW) {
  const out = targetW && targetW < im.width
    ? resize(im, targetW, Math.round((im.height * targetW) / im.width))
    : im;
  writeFileSync(resolve(OUT, name), encodePng(out));
  console.log(`${name.padEnd(20)} ${out.width}x${out.height}`);
}

const mark = cut(markBand, 6);
const word = cut(wordBand, 6);

save("ajm-mark.png", mark, 1200);
save("ajm-mark-512.png", mark, 512);
save("ajm-wordmark.png", recolor(word), 1800);
