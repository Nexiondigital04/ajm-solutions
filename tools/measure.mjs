/* Misst in Referenz und Screenshot die Lage der Bildelemente.
 * Aufruf: node tools/measure.mjs <screenshot.png>
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { decodePng } from "./png.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

/** Bounding-Box aller Pixel, die ein Praedikat erfuellen */
function box(img, pred, y0 = 0, y1 = img.height - 1, xa = 0, xb = 1) {
  let x0 = 1e9, yy0 = 1e9, x1 = -1, yy1 = -1, n = 0;
  const xlo = Math.round(img.width * xa), xhi = Math.round(img.width * xb);
  for (let y = y0; y <= y1; y++) {
    for (let x = xlo; x < xhi; x++) {
      const i = (y * img.width + x) * 4;
      if (!pred(img.data[i], img.data[i + 1], img.data[i + 2])) continue;
      n++;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < yy0) yy0 = y; if (y > yy1) yy1 = y;
    }
  }
  return n ? { x0, y0: yy0, x1, y1: yy1, w: x1 - x0 + 1, h: yy1 - yy0 + 1, cx: ((x0 + x1) / 2).toFixed(1), n } : null;
}

// kraeftiges Logo-Blau
const isBlue = (r, g, b) => b > 90 && b - r > 55 && g > r && b - g > 25 && r < 90;
// helle Schrift
const isBright = (r, g, b) => r > 150 && g > 155 && b > 160;

const files = {
  Vorlage: resolve(HERE, "../docs/referenz-endergebnis.png"),
  Umsetzung: process.argv[2],
};

for (const [name, f] of Object.entries(files)) {
  const img = decodePng(readFileSync(f));
  const sx = 1717 / img.width, sy = 916 / img.height;
  const norm = b => b && Object.fromEntries(Object.entries(b).map(([k, v]) =>
    [k, typeof v === "number" && k !== "n" ? Math.round(v * (k.startsWith("x") || k === "cx" ? sx : sy)) : v]));

  // alles nur in der Bildmitte messen — links/rechts liegt Hintergrund-Deko
  const MID = [0.33, 0.67];

  // Signet: blaue Pixel oberhalb 55 % Hoehe
  const mark = box(img, isBlue, 0, Math.round(img.height * 0.55), ...MID);
  // Signet gesamt: alles, was sich vom dunklen Grund abhebt (schwarz auf Lichthof)
  const markDark = box(img, (r, g, b) => r < 14 && g < 16 && b < 20,
                       Math.round(img.height * 0.1), Math.round(img.height * 0.55), 0.38, 0.62);
  // Schriftzug
  const word = box(img, isBright, mark.y1 + Math.round(img.height * 0.005),
                   Math.round(img.height * 0.63), ...MID);
  // Statuszeile
  const status = box(img, isBright, Math.round(img.height * 0.63),
                     Math.round(img.height * 0.72), ...MID);
  // Fliesstext
  const lede = box(img, (r, g, b) => r > 105 && r < 200 && Math.abs(r - b) < 30,
                   Math.round(img.height * 0.73), Math.round(img.height * 0.85), ...MID);

  console.log(`\n=== ${name} (${img.width}x${img.height}) — normiert auf 1717x916`);
  console.log("  Signet blau :", norm(mark));
  console.log("  Signet dunkel:", norm(markDark));
  console.log("  Schriftzug  :", norm(word));
  console.log("  Statuszeile :", norm(status));
  console.log("  Fliesstext  :", norm(lede));
}
