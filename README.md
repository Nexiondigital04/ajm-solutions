# AJM Solutions — Coming-Soon / „Under Construction"

Statische Landingpage, gebaut nach dem Vorschaubild `docs/referenz-endergebnis.png`.
Kein Build-Schritt, keine Abhaengigkeiten — HTML, CSS und die Original-Assets.

## Struktur

```
ajm-solutions/
├─ README.md
├─ serve.mjs                  kleiner Dev-Server ohne Abhaengigkeiten
├─ site/                      Deploy-Root — genau dieser Ordner wird hochgeladen
│  ├─ index.html
│  └─ assets/
│     ├─ css/styles.css
│     └─ img/
│        ├─ bg.png            Original-Hintergrund quer, unveraendert
│        ├─ bg-mobile.png     Original-Hintergrund hoch, unveraendert
│        ├─ ajm-mark.png      Signet, aus dem Logo freigestellt
│        ├─ ajm-mark-512.png  Favicon / Social
│        └─ ajm-wordmark.png  Schriftzug, fuer dunklen Grund umgefaerbt
├─ docs/
│  ├─ referenz-endergebnis.png   Design-Vorlage Desktop
│  ├─ referenz-mobile.png        Design-Vorlage Hochkant
│  └─ quellen/                   Originaldateien (Logo .ai/.png, Hintergrund)
└─ tools/                     Node-Skripte fuer Assets und Abgleich
```

## Lokal ansehen

```bash
node serve.mjs
```

Danach http://localhost:4180 oeffnen (`PORT=… node serve.mjs` fuer einen anderen Port).
`site/index.html` laesst sich auch direkt im Browser oeffnen.

## Woher die Assets kommen

Nichts ist nachgezeichnet — alles stammt aus den Originaldateien in `docs/quellen/`.

`tools/extract.mjs` zerlegt `ajm-logo-original.png` (4167 × 4167, transparent) in
seine zwei Baender: das Signet oben, den Schriftzug unten. Es trennt sie ueber die
Leerzeilen im Alphakanal, schneidet beide eng zu und skaliert sie herunter.

Der Schriftzug ist in der Originaldatei schwarz und waere auf dem dunklen
Hintergrund unsichtbar. Das Skript faerbt deshalb um: Schwarz wird zu `#eef3f8`,
das Blau des `J` zu `#2f92cf`. Der Alphakanal bleibt unangetastet, die
Buchstabenformen sind also exakt die der Originaldatei — keine nachgebaute Schrift.

Neu erzeugen:

```bash
node tools/extract.mjs
```

`tools/png.mjs` ist ein minimaler PNG-Decoder/-Encoder auf Basis von `node:zlib`,
damit dafuer keine Bildbibliothek installiert werden muss.

## Massverhaeltnisse

Die Vorlage ist 1717 × 916 gross. Saemtliche Groessen und Abstaende sind in dieser
Referenz notiert und haengen an einer Einheit:

```css
--u: min(0.132vw, 0.1092vh);   /* 1u = 1px der Vorlage */
```

Bei 1717 × 916 ist `1u = 1px`, die Seite entspricht dann exakt dem Vorschaubild.
Auf jedem anderen Format skaliert der gesamte Block proportional mit — der
kleinere der beiden Werte gewinnt, damit nichts aus dem Viewport laeuft.
`.status` und `.lede` haben zusaetzlich Pixel-Untergrenzen, damit der Text auf
flachen Landscape-Formaten lesbar bleibt.

Abgleich mit der Vorlage — Element-Positionen bzw. Gegenueberstellung samt
Differenzbild:

```bash
node tools/measure.mjs pfad/zum/screenshot.png
```

```bash
node tools/compare.mjs pfad/zum/screenshot.png docs/vergleich.png
```

Detailvergleich eines Ausschnitts, wahlweise gegen eine andere Referenz und
vergroessert — noetig, um Kantenschaerfe und Saettigung zu beurteilen:

```bash
AJM_REF=../docs/referenz-schweif.png AJM_ZOOM=3 node tools/crop-compare.mjs shot.png out.png 790 105 150 130
```

Stand der letzten Messung — Abweichung ueberall ≤ 3 px auf 916 px Hoehe:

| Element | Vorlage (y) | Umsetzung (y) |
|---|---|---|
| Signet (Silhouette) | 92–489 | 92–489 |
| Signet (blaues J) | 289–488 | 291–488 |
| Schriftzug | 510–541 | 510–541 |
| Statuszeile | 608–624 | 609–625 |
| Fliesstext | 686–735 | 686–738 |

Mittlere Pixelabweichung ueber das ganze Bild: **8,5 %** — im Differenzbild
bleiben nur Kanten-Antialiasing und der Lichthof hinter dem Signet uebrig.

**Eine bewusste Abweichung:** im Vorschaubild ist das Signet rund 4 % breiter
gezogen als das Original-Artwork. Hier steht es unverzerrt, ist also minimal
schmaler als in der Vorlage. Wenn es exakt dem Bild entsprechen soll:
`.mark img { width: calc(432 * var(--u)); height: calc(366 * var(--u)); }`.

## Schriften

Die Wortmarke ist ein Bild, braucht also keine Schrift. Fuer die Statuszeile
kommt Orbitron zum Einsatz, fuer den Fliesstext Inter — beide ueber Google Fonts.

Fuer Offline-/DSGVO-Betrieb: `.woff2` nach `site/assets/fonts/` legen,
`@font-face` in `styles.css` ergaenzen und den `<link>` in `index.html` entfernen.

## Farben

| Token | Wert | Einsatz |
|---|---|---|
| `--c-bg` | `#04070c` | Grundflaeche hinter dem Hintergrundbild |
| `--c-text` | `#eef3f8` | „CONSTRUCTION", Schriftzug |
| `--c-text-dim` | `#97a1ad` | Fliesstext |
| `--c-blue` | `#3d9fd6` | „UNDER", Raute in der Trennlinie |

Das Logo-Blau `#00668C` steckt unveraendert in `ajm-mark.png`.

## Verhalten

- Der Hintergrund ist starr — keine Parallaxe, kein JavaScript auf der Seite.
- `prefers-reduced-motion` schaltet Einblendung, Lichthof-Puls und die Lichtpunkte ab.
- Der Hintergrund ist `aria-hidden`, Screenreader lesen nur Logo-Alt-Text und Fliesstext.

## Arbeitsstand

Desktop wird gegen `docs/referenz-endergebnis.png` bei 1717 × 916 abgeglichen,
Hochkant gegen `docs/referenz-mobile.png`.

Was schon steht:

- Desktop-Ansicht deckt sich mit der Vorlage (Abweichungen ≤ 3 px, s. o.)
- Assets aus den Originaldateien erzeugt, reproduzierbar ueber `tools/extract.mjs`
- Energy Trail um das Signet (s. u.)
- Hochkant-Layout mit eigener Hintergrundgrafik (s. u.)
- Mess- und Vergleichswerkzeuge in `tools/`

## Hochkant

Vorlage: `docs/referenz-mobile.png`.

Umgeschaltet wird nach **Seitenverhaeltnis**, nicht nach Geraetebreite —
entscheidend ist, ob das Querformat (1.87) oder das Hochformat (0.46) weniger
beschnitten wird. Die Grenze `3/4` liegt dazwischen. Betroffen ist nur die
Hintergrundgrafik; das Layout selbst braucht keine eigenen Regeln.

Der Grund: `--u` haengt an `min(0.132vw, 0.1092vh)`. Auf hohen schmalen
Formaten gewinnt die Breite, der ganze Block skaliert also ohnehin mit der
Viewportbreite. Gemessen gegen die Vorlage:

| Element | Vorlage | Umsetzung |
|---|---|---|
| Signet | ~58 % | 56,1 % |
| Wortmarke | ~70 % | 68,4 % |
| Statuszeile | ~70 % | 67,6 % |
| Fliesstext | ~49 % | 54,0 % |

(Anteil an der Viewportbreite, gemessen bei 375 × 812.)

Eine frueher hier stehende Regel verengte die Laufweite der Statuszeile auf
Mobilgeraeten auf `.22em` und drueckte sie damit auf 56 % — sie ist entfernt.
Mit der normalen Laufweite von `.30em` sitzt die Zeile so breit wie die
Wortmarke, genau wie in der Vorlage.

## Energy Trail

Vorlage: `docs/referenz-schweif.png`. Die gesamte Logokontur traegt eine blaue
Leuchtkante, auf der drei helle Lichtpunkte mit Schweif entlanglaufen.

### Kontur

Die Konturen sind nicht nachgezeichnet, sondern 1:1 aus
`docs/quellen/ajm-logo-vector.svg` uebernommen:

```bash
node tools/logo-outline.mjs
```

Das Skript rechnet die Signet-Pfade in Root-Koordinaten um und gibt sie als
SVG-`d` aus. Signet und Schriftzug trennt es ueber ein strukturelles Merkmal
der Originaldatei — die Buchstaben sind einzeln geclippt, die Signet-Flaechen
nicht. Drei Streupixel-Pfade (1–8 Einheiten gross) fliegen per Groessenfilter
raus. Es bleiben fuenf Konturen: A-Kette (Umfang 2422), blaues J (1789),
M-Flaeche (1643) und zwei kleine Gipfel (442, 152).

Das Koordinatensystem ist so gewaehlt, dass die `viewBox` deckungsgleich auf
`ajm-mark.png` liegt — inklusive des Rands, den `tools/extract.mjs` beim
Zuschneiden stehen laesst. Das Overlay braucht deshalb nur `width/height: 100%`
und sitzt ohne Zusatzrechnung exakt auf dem Logo.

### Aufbau

Der Layer liegt per `z-index: -1` im isolierten Stacking-Context von `.mark`
hinter dem Signet. Sichtbar ist dadurch nur die **aeussere Haelfte** jedes
Strichs — die Strichstaerken sind also doppelt so gross wie die gewuenschte
Kantenbreite.

Ruhende Leuchtkante, drei Ebenen von aussen nach innen: weicher Bloom,
gesaettigter blauer Koerper, haarfeiner weisser Kern. Der scharfe Kern traegt
den Eindruck — ein breiter weicher Schein allein wirkt nur wie ein Schleier,
und aufgehellte Blautoene entsaettigen die Kante.

Drei Lichtpunkte, je einer pro grosser Kontur, als eigene Pfade. Das ist
noetig, weil SVG das Strichmuster **an jedem Teilpfad neu ansetzt**: in einem
gemeinsamen Pfad ergibt ein Drei-Punkte-Muster pro Kontur drei Punkte statt
drei ueber das Ganze.

Jeder Punkt besteht aus sieben Strichen auf demselben Pfad (`<use>`), die per
`stroke-dasharray` nur ein Segment zeigen. Die Segmentlaengen sind gestaffelt
und die `stroke-dashoffset`-Keyframes so gesetzt, dass alle dieselbe
Vorderkante haben und nach hinten unterschiedlich weit reichen — uebereinander
ergibt das den Verlauf vom hellen Kopf zum ausblendenden Schweif. Einen Verlauf
entlang des Pfades kann SVG-Stroke selbst nicht.

Sichtbar ist an jeder Stelle die oberste noch vorhandene Ebene, an jedem
Ebenen-Ende springt die Farbe also einen Schritt. Mit vier Ebenen waren diese
Schritte als Kanten sichtbar; mit sieben eng gestaffelten liegen sie unter der
Wahrnehmungsschwelle.

Darueber liegen drei weitere Ebenen (`h1`–`h3`) fuer den Lichtpunkt an der
Spitze: ein sehr kurzes Segment auf breitem Strich mit runden Enden. Die Kappen
ragen um die halbe Strichbreite ueber das Segment hinaus, aus dem Strich wird
dadurch ein runder Punkt.

**Die Reihenfolge im Markup ist die Malreihenfolge** — hinten/breit zuerst,
vorne/hell zuletzt. Andersherum deckt der breite blasse Schweif den hellen Kopf
zu und es bleibt nur ein Schweif ohne Punkt uebrig.

Das Markup erzeugt `tools/build-comets.mjs` — 30 `<use>`-Elemente von Hand zu
tippen ist fehleranfaellig:

```bash
node tools/build-comets.mjs
```

`pathLength="1000"` normiert jede Kontur, alle Dash-Werte sind also Promille
der jeweiligen Kontur. Damit alle drei gleich schnell laufen, ist die Dauer
proportional zum Umfang: A 9 s, J 6,65 s, M 6,1 s.

Bei `prefers-reduced-motion` entfallen nur die laufenden Punkte (`.comet`),
die ruhende Kante bleibt — sie bewegt sich ohnehin nicht.

### Was dafuer am bestehenden Design geaendert wurde

- Der silberne Saum am Signet (`drop-shadow` oben links) ist entfernt. Er lag
  genau auf dem schmalen Band, in dem die blaue Kante aus dem Logo herausschaut,
  und hat sie verdeckt.
- Der Lichthof hinter dem Signet ist deutlich zurueckgenommen und kuehler. Der
  alte, helle Hof hat die Kante ueberstrahlt und entsaettigt.

Das Logo selbst ist unveraendert — dieselbe `ajm-mark.png`, ohne Transformation.

Offen — nicht angefangen, bewusst zurueckgestellt:

- [ ] Schriften selbst hosten statt ueber Google Fonts (DSGVO)
- [ ] Git-Repo anlegen
- [ ] Favicon-Varianten und `og:image` als PNG in Zielgroesse

Hinweis zum Pruefen: Headless-Chrome erzwingt eine Mindest-Fensterbreite —
Screenshots schmaler Viewports sind dort irrefuehrend. Solche Formate im echten
Browser messen, nicht per Screenshot.
