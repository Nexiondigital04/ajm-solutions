/* Holt die tatsaechlich verwendeten Schnitte von Google Fonts, legt die
 * .woff2-Dateien nach site/assets/fonts/ und schreibt fonts.css.
 *
 * Zur Laufzeit ruft die Seite dadurch nichts Externes mehr auf — noetig,
 * damit ohne Einwilligung keine IP an Google geht.
 *
 * Aufruf: node tools/fetch-fonts.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../site/assets/fonts");

// Nur was styles.css wirklich nutzt: Fliesstext Inter 300, Statuszeile Orbitron 500.
const QUERY = "family=Inter:wght@300&family=Orbitron:wght@500&display=swap";
// Latin reicht fuer den Inhalt; latin-ext deckt zusaetzliche Diakritika ab.
const SUBSETS = ["latin", "latin-ext"];

// Ohne modernen User-Agent liefert Google .ttf statt .woff2
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
           "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

mkdirSync(OUT, { recursive: true });

const css = await fetch(`https://fonts.googleapis.com/css2?${QUERY}`, {
  headers: { "User-Agent": UA },
}).then(r => {
  if (!r.ok) throw new Error(`Google Fonts antwortete mit ${r.status}`);
  return r.text();
});

const faces = [];
const re = /\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g;

for (const [, subset, block] of css.matchAll(re)) {
  if (!SUBSETS.includes(subset)) continue;

  const family = /font-family:\s*'([^']+)'/.exec(block)[1];
  const weight = /font-weight:\s*(\d+)/.exec(block)[1];
  const url = /url\((https:[^)]+\.woff2)\)/.exec(block)[1];
  const range = /unicode-range:\s*([^;]+);/.exec(block)[1].trim();

  const file = `${family.toLowerCase()}-${weight}-${subset}.woff2`;
  const buf = Buffer.from(await fetch(url).then(r => r.arrayBuffer()));
  writeFileSync(resolve(OUT, file), buf);
  console.log(`${file.padEnd(34)} ${buf.length} B`);

  faces.push(
    `@font-face {\n` +
    `  font-family: "${family}";\n` +
    `  font-style: normal;\n` +
    `  font-weight: ${weight};\n` +
    `  font-display: swap;\n` +
    `  src: url("${file}") format("woff2");\n` +
    `  unicode-range: ${range};\n}`
  );
}

if (!faces.length) throw new Error("keine passenden @font-face-Bloecke gefunden");

writeFileSync(resolve(OUT, "fonts.css"),
  "/* Selbst gehostete Schriften — kein Google-Fonts-Aufruf zur Laufzeit.\n" +
  "   Nur die tatsaechlich verwendeten Schnitte: Inter 300, Orbitron 500.\n" +
  "   Neu erzeugen: node tools/fetch-fonts.mjs */\n\n" + faces.join("\n\n") + "\n");

console.log(`fonts.css mit ${faces.length} @font-face-Bloecken geschrieben`);
