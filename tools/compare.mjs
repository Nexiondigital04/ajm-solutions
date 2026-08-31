/* Legt Screenshot und Referenz nebeneinander + als Differenzbild ab.
 * Aufruf: node tools/compare.mjs <screenshot.png> <out.png>
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { decodePng, encodePng, resize } from "./png.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const shot = decodePng(readFileSync(process.argv[2]));
const ref = decodePng(readFileSync(resolve(HERE, "../docs/referenz-endergebnis.png")));

const W = 858, H = Math.round((W * ref.height) / ref.width);
const a = resize(shot, W, Math.round((W * shot.height) / shot.width));
const b = resize(ref, W, H);

const out = { width: W * 2, height: Math.max(a.height, b.height) * 2, data: null };
out.data = Buffer.alloc(out.width * out.height * 4, 0);

function blit(src, ox, oy) {
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const s = (y * src.width + x) * 4;
      const d = ((y + oy) * out.width + x + ox) * 4;
      src.data.copy(out.data, d, s, s + 4);
    }
  }
}

// oben: Referenz | Screenshot
blit(b, 0, 0);
blit(a, W, 0);

// unten links: Differenz (Graustufen, verstaerkt)
const diff = { width: W, height: Math.min(a.height, b.height), data: Buffer.alloc(W * Math.min(a.height, b.height) * 4) };
let sum = 0;
for (let y = 0; y < diff.height; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const d = Math.min(255, (Math.abs(a.data[i] - b.data[i]) +
                             Math.abs(a.data[i + 1] - b.data[i + 1]) +
                             Math.abs(a.data[i + 2] - b.data[i + 2])) * 1.6);
    sum += d;
    diff.data[i] = diff.data[i + 1] = diff.data[i + 2] = d;
    diff.data[i + 3] = 255;
  }
}
blit(diff, 0, Math.max(a.height, b.height));

// unten rechts: Overlay 50/50
const ov = { width: W, height: diff.height, data: Buffer.alloc(W * diff.height * 4) };
for (let i = 0; i < W * diff.height * 4; i += 4) {
  ov.data[i] = (a.data[i] + b.data[i]) >> 1;
  ov.data[i + 1] = (a.data[i + 1] + b.data[i + 1]) >> 1;
  ov.data[i + 2] = (a.data[i + 2] + b.data[i + 2]) >> 1;
  ov.data[i + 3] = 255;
}
blit(ov, W, Math.max(a.height, b.height));

writeFileSync(process.argv[3], encodePng(out));
console.log("mittlere Abweichung:", (sum / (W * diff.height) / 255 * 100).toFixed(2) + "%");
console.log("links oben = Vorlage, rechts oben = Umsetzung, unten = Differenz / Overlay");
