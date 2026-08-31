import { readFileSync } from "node:fs";
import { decodePng, bbox, rowProfile } from "./png.mjs";

const src = process.argv[2];
const img = decodePng(readFileSync(src));
console.log("size:", img.width, "x", img.height);

const bb = bbox(img);
console.log("bbox:", bb);

const rows = rowProfile(img);
// Luecken (Zeilen ohne sichtbare Pixel) innerhalb der bbox suchen
const gaps = [];
let start = null;
for (let y = bb.y0; y <= bb.y1; y++) {
  if (rows[y] === 0) { if (start === null) start = y; }
  else if (start !== null) { gaps.push([start, y - 1, y - start]); start = null; }
}
if (start !== null) gaps.push([start, bb.y1, bb.y1 - start + 1]);
console.log("leerzeilen-bloecke (start, ende, hoehe):");
for (const g of gaps) if (g[2] > 5) console.log("  ", g.join(" .. "));

// Farbhistogramm der deckenden Pixel
const hist = new Map();
for (let i = 0; i < img.width * img.height; i++) {
  const a = img.data[i * 4 + 3];
  if (a < 250) continue;
  const key = `${img.data[i * 4]},${img.data[i * 4 + 1]},${img.data[i * 4 + 2]}`;
  hist.set(key, (hist.get(key) ?? 0) + 1);
}
console.log("top-farben:");
[...hist].sort((a, b) => b[1] - a[1]).slice(0, 6)
  .forEach(([c, n]) => console.log("  ", c, n));
