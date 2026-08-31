/* Listet alle Dateien im Deploy-Root nach Groesse und rechnet zusammen, was
 * ein Erstbesuch tatsaechlich laedt.
 * Aufruf: node tools/weight.mjs
 */
import { readdirSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";

const rows = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const f = join(dir, e.name);
    if (e.isDirectory()) walk(f);
    else rows.push([f.split("\\").join("/"), statSync(f).size]);
  }
})("site");

rows.sort((a, b) => b[1] - a[1]);
let total = 0;
for (const [f, s] of rows) {
  total += s;
  console.log(`${(s / 1024).toFixed(1).padStart(8)} KB  ${f}`);
}
console.log(`${(total / 1024).toFixed(0).padStart(8)} KB  = alle Dateien im Repo\n`);

// Was ein Desktop-Erstbesuch wirklich holt
const html = readFileSync("site/index.html", "utf8");
const css = readFileSync("site/assets/css/styles.css", "utf8");
const need = [
  "site/index.html",
  "site/assets/css/styles.css",
  "site/assets/fonts/fonts.css",
  "site/assets/fonts/orbitron-500-latin.woff2",
  "site/assets/fonts/inter-300-latin.woff2",
  "site/assets/img/bg.webp",
  "site/assets/img/ajm-mark.png",
  "site/assets/img/ajm-wordmark.png",
  "site/assets/img/icon-32.png",
];
const missing = need.filter(f => !rows.some(([p]) => p === f));
if (missing.length) throw new Error("erwartete Datei fehlt: " + missing.join(", "));

const first = need.reduce((s, f) => s + rows.find(([p]) => p === f)[1], 0);
console.log(`${(first / 1024).toFixed(0).padStart(8)} KB  = Desktop-Erstbesuch (WebP-Hintergrund)`);

// Kurze Konsistenzpruefung der Referenzen
const refs = [...html.matchAll(/(?:src|href)="((?!https?:|data:)[^"#]+)"/g)].map(m => m[1]);
const cssRefs = [...css.matchAll(/url\("\.\.\/([^"]+)"\)/g)].map(m => "assets/" + m[1].replace(/^\.\.\//, ""));
const broken = [...refs, ...cssRefs]
  .map(r => "site/" + r.replace(/^\.\//, ""))
  .filter(f => !rows.some(([p]) => p === f));
console.log(broken.length ? "\nFEHLENDE REFERENZEN: " + broken.join(", ") : "\nalle lokalen Referenzen aufloesbar");
