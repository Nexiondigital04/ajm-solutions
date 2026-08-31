/* Zieht die echten Umrisse des Signets aus AJM_LOGO_vector.svg und gibt sie
 * als ein SVG-Path-d aus (mehrere Teilpfade) — Grundlage fuer die Leuchtkante
 * und die drei Lichtpunkte.
 *
 * Das Koordinatensystem ist so gewaehlt, dass die viewBox deckungsgleich mit
 * assets/img/ajm-mark.png liegt: das Overlay braucht dann nur width/height
 * 100% und sitzt ohne Zusatzrechnung exakt auf dem Logo.
 *
 * Aufruf: node tools/logo-outline.mjs [pfad/zur/AJM_LOGO_vector.svg]
 */
import { readFileSync } from "node:fs";

const SRC = process.argv[2] ?? "docs/quellen/ajm-logo-vector.svg";

// Rand, den tools/extract.mjs beim Zuschneiden der PNG stehen laesst.
// 6 px bei 4167 px Artwork-Breite, umgerechnet auf die 2666.67 der Vektordatei.
const PAD = 6 * (2666.6667 / 4167);

const raw = readFileSync(SRC, "utf8");
const svg = raw.slice(raw.indexOf("layer-MC0"));

const paths = [...svg.matchAll(/<path\b[^>]*>/g)].map(m => {
  const tag = m[0];
  // fuehrendes \s ist noetig: sonst matcht d="…" auch das d in id="…"
  const at = n => (new RegExp(`\\s${n}="([^"]*)"`).exec(tag) ?? [])[1];
  return { id: at("id"), transform: at("transform"), d: at("d"), style: at("style"), clip: at("clip-path") };
}).filter(p => p.d && p.id && !p.clip);        // geclippt = Buchstabe

function parseTransform(t) {
  if (!t) return [1, 0, 0, 1, 0, 0];
  const m = /matrix\(([^)]+)\)/.exec(t);
  if (m) return m[1].split(/[,\s]+/).map(Number);
  const tr = /translate\(([^)]+)\)/.exec(t);
  if (tr) { const [x, y = 0] = tr[1].split(/[,\s]+/).map(Number); return [1, 0, 0, 1, x, y]; }
  return [1, 0, 0, 1, 0, 0];
}

const apply = ([a, b, c, d, e, f], x, y) => [a * x + c * y + e, b * x + d * y + f];

/** Teilpolygone eines reinen Geraden-Pfades (M/L/H/V/Z, gross wie klein) */
function subpaths(d) {
  const tok = d.match(/[MmLlHhVvZz]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? [];
  const out = [];
  let cur = [], x = 0, y = 0, sx = 0, sy = 0, cmd = null, i = 0;
  const num = () => Number(tok[i++]);

  while (i < tok.length) {
    if (/[MmLlHhVvZz]/.test(tok[i])) cmd = tok[i++];
    if (i >= tok.length && !/[Zz]/.test(cmd ?? "")) break;

    switch (cmd) {
      case "M": if (cur.length) out.push(cur); cur = []; x = num(); y = num(); sx = x; sy = y; cmd = "L"; break;
      case "m": if (cur.length) out.push(cur); cur = []; x += num(); y += num(); sx = x; sy = y; cmd = "l"; break;
      case "L": x = num(); y = num(); break;
      case "l": x += num(); y += num(); break;
      case "H": x = num(); break;
      case "h": x += num(); break;
      case "V": y = num(); break;
      case "v": y += num(); break;
      case "Z": case "z": x = sx; y = sy; break;
      default: i++; continue;
    }
    cur.push([x, y]);
  }
  if (cur.length) out.push(cur);
  return out;
}

// Alle Konturen in Root-Koordinaten
let shapes = [];
for (const p of paths) {
  const t = parseTransform(p.transform);
  for (const poly of subpaths(p.d)) {
    const pts = poly.map(([x, y]) => apply(t, x, y));
    if (pts.length < 3) continue;
    const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
    shapes.push({
      id: p.id, pts,
      blue: /00668c/i.test(p.style ?? ""),
      x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys),
    });
  }
}

// Streupixel raus (die Datei enthaelt drei Pfade von 1–8 Einheiten Groesse)
const span = Math.max(...shapes.map(s => Math.max(s.x1 - s.x0, s.y1 - s.y0)));
const dropped = shapes.filter(s => Math.max(s.x1 - s.x0, s.y1 - s.y0) <= span * 0.02);
shapes = shapes.filter(s => Math.max(s.x1 - s.x0, s.y1 - s.y0) > span * 0.02);
if (dropped.length) console.log("verworfen (Streupixel):", dropped.map(s => s.id).join(", "));

// Bezugsrahmen = Zuschnitt der PNG
const bx0 = Math.min(...shapes.map(s => s.x0)) - PAD;
const bx1 = Math.max(...shapes.map(s => s.x1)) + PAD;
const by0 = Math.min(...shapes.map(s => s.y0)) - PAD;
const by1 = Math.max(...shapes.map(s => s.y1)) + PAD;

const S = 1000 / (bx1 - bx0);
const VH = (by1 - by0) * S;
const f = n => (Math.round(n * 100) / 100).toString();
const norm = ([x, y]) => [(x - bx0) * S, (y - by0) * S];

const len = pts => pts.reduce((s, p, i) =>
  s + (i ? Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0)
  + Math.hypot(pts[0][0] - pts.at(-1)[0], pts[0][1] - pts.at(-1)[1]);

console.log(`\nKonturen: ${shapes.length}`);
let total = 0;
const ds = shapes.map(s => {
  const pts = s.pts.map(norm);
  const l = len(pts);
  total += l;
  console.log(`  ${s.id.padEnd(6)} ${s.blue ? "blau" : "    "} ` +
    `${String(pts.length).padStart(3)} Punkte, Umfang ${l.toFixed(0)}`);
  return "M " + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(" L ") + " Z";
});

console.log(`\nviewBox="0 0 1000 ${f(VH)}"   Gesamtumfang ${total.toFixed(0)}`);
console.log("\nd=\n" + ds.join("\n   "));
