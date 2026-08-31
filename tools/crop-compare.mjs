/* Schneidet denselben Ausschnitt aus Referenz und Screenshot und legt sie
 * uebereinander (Referenz rot, Umsetzung cyan) — Deckung = grau.
 * Aufruf: node tools/crop-compare.mjs <screenshot.png> <out.png> [x y w h]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { decodePng, encodePng, crop, resize } from "./png.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const [, , shotPath, outPath, ...rect] = process.argv;
const [X, Y, W, H] = rect.length === 4 ? rect.map(Number) : [590, 70, 550, 700];

// Vergroesserung fuer Detailvergleiche (Schaerfe, Kantenbreite)
const Z = Number(process.env.AJM_ZOOM ?? 1);

function region(path) {
  const img = decodePng(readFileSync(path));
  const s = img.width / 1717;               // auf Referenzmass normieren
  const c = crop(img, Math.round(X * s), Math.round(Y * s), Math.round(W * s), Math.round(H * s));
  if (Z === 1) return resize(c, W, H);
  // Nearest Neighbour: bei Zoom sollen die Pixel hart bleiben
  const out = Buffer.alloc(W * Z * H * Z * 4);
  const base = resize(c, W, H);
  for (let y = 0; y < H * Z; y++)
    for (let x = 0; x < W * Z; x++)
      base.data.copy(out, (y * W * Z + x) * 4,
        ((y / Z | 0) * W + (x / Z | 0)) * 4, ((y / Z | 0) * W + (x / Z | 0)) * 4 + 4);
  return { width: W * Z, height: H * Z, data: out };
}

const REF = process.env.AJM_REF ?? "../docs/referenz-endergebnis.png";
const a = region(resolve(HERE, REF));                                // Vorlage
const b = region(shotPath);                                          // Umsetzung

const RW = a.width, RH = a.height;
const OW = RW * 2 + 12;
const out = { width: OW, height: RH, data: Buffer.alloc(OW * RH * 4, 255) };

function blit(src, ox) {
  for (let y = 0; y < RH; y++)
    for (let x = 0; x < RW; x++)
      src.data.copy(out.data, ((y * OW) + x + ox) * 4, (y * RW + x) * 4, (y * RW + x) * 4 + 4);
}
blit(a, 0);
blit(b, RW + 12);

writeFileSync(outPath, encodePng(out));
console.log(`Ausschnitt ${X},${Y} ${W}x${H}, Zoom ${Z}x — links Vorlage, rechts Umsetzung`);
