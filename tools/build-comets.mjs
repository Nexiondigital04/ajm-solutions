/* Schreibt die drei Kometen-Gruppen in site/index.html neu.
 * Sieben Ebenen je Komet von Hand zu tippen ist fehleranfaellig — deshalb
 * generiert. Aufruf: node tools/build-comets.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "site/index.html";

// Reihenfolge = Malreihenfolge: hinten/breit zuerst, vorne/hell zuletzt.
// SVG malt spaetere Elemente obenauf — andersherum deckt der breite blasse
// Schweif den hellen Kopf zu.
// t2–t4 bleiben ungefiltert: schmal und scharf.
const LAYERS = [
  ["t7", "ajmGlowWide"],
  ["t6", "ajmGlowSoft"],
  ["t5", "ajmGlowMid"],
  ["t4", null],
  ["t3", null],
  ["t2", null],
  ["t1", "ajmGlowHead"],
  // der Lichtpunkt selbst: sehr kurzes Segment, breiter runder Strich —
  // durch die runden Enden wird daraus ein Punkt statt eines Strichs
  ["h1", "ajmGlowDot"],
  ["h2", "ajmGlowHead"],
  ["h3", null],
];

const COMETS = [["a", "ajmA"], ["j", "ajmJ"], ["m", "ajmM"]];

const groups = COMETS.map(([name, path]) => {
  const uses = LAYERS.map(([cls, filter]) =>
    `          <use class="trail trail--${cls}" href="#${path}"` +
    (filter ? ` filter="url(#${filter})"` : "") + `/>`
  ).join("\n");
  return `        <g class="comet comet--${name}">\n${uses}\n        </g>`;
}).join("\n");

let html = readFileSync(FILE, "utf8");

const start = html.indexOf('        <g class="comet comet--a">');
const endMarker = '        </g>\n      </svg>';
const end = html.indexOf(endMarker);
if (start < 0 || end < 0) throw new Error("Kometen-Bloecke nicht gefunden");

html = html.slice(0, start) + groups + "\n" + html.slice(end + "        </g>\n".length);
writeFileSync(FILE, html);

console.log(`${COMETS.length} Gruppen x ${LAYERS.length} Ebenen geschrieben`);
