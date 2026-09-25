# Skärbrädeverkstan

Svenskt design- och planeringsverktyg för längsgående skärbrädor och ändträbrädor.
Vanlig HTML, CSS och JavaScript-moduler. Inget byggsteg, inga runtime-beroenden,
ingen backend och ingen överföring av användarens projekt till någon server.

## Förhandsgranska codex-dev utan att röra main

Repositoryts arbetsbranch är `codex-dev`. Från projektmappen:

```powershell
git status --short --branch
node tools/serve.mjs
```

Öppna **http://127.0.0.1:4173**. Stoppa med Ctrl+C. Node 20+ krävs för servern.
Öppna via HTTP, inte genom att dubbelklicka HTML-filen (ES-moduler kräver server).
Ingen merge, GitHub Pages-ändring eller deploy behövs. Filträdet går även att
servera på en statisk webbserver, inklusive under en sökväg.

## Funktioner

- Önskade slutmått, nio träslag, remsbredder, duplicering, borttagning och ordning.
- Skalenlig SVG med stiliserad ådring och mått, aldrig upprepat låtsasmaterial.
- Edge grain med en limning och ändträ med fysiskt modellerad tvärkap/90° vältning.
- A/B-paneler, 180° vridning av varannan rad och verklig förskjutnings-/trimförlust.
- Gemensam längsgående fasvinkel per panel, inklusive ett ±22,5° sicksackexempel.
- Preview av stavtvärsnitt, limning 1, tvärkapning, limning 2 och färdig yta.
- Grupperad kaplista, separat segmentlista, materialvolym och parametrisk arbetsplan.
- Saftspår och roterad text/inlay som separata dekorationslager.
- Fyra redigerbara exempel, autosparning, ångra, ny design och JSON-import/export.
- Utskrift av preview, arbetsplan, kaplista och material. Offline efter första laddning.
- Responsiv layout med preview först på mobil och rullbar stavlista.

**Läs [modellens antaganden och formler](docs/MODELL.md) före tillverkning.**
Kaplistan gäller riktat virke. Råvirkesmån, defekter och längsgående sågspår tillkommer.

## Tester

Beräknings- och renderingstester använder enbart Nodes inbyggda testmotor:

```powershell
node --test tests/model.test.mjs tests/preview.test.mjs
```

I en miljö som blockerar underprocesser, med Node 22+:

```powershell
node --test --test-isolation=none tests/model.test.mjs tests/preview.test.mjs
```

Browserintegration finns i `tests/browser.mjs`. Starta servern först. Installera
Playwright separat vid behov (`npm install --no-save playwright` och
`npx playwright install chromium`), kör sedan `node tests/browser.mjs`.
`PLAYWRIGHT_MODULE` kan peka på en befintlig `playwright/index.mjs` och
`BROWSER_EXECUTABLE` på en befintlig Chrome/Edge. Bilder hamnar i ignorerade
`test-results/`. Testerna använder en separat temporär browserprofil.

## Struktur

| Fil | Ansvar |
| --- | --- |
| `src/model.mjs` | Schema, validering, exempel, polygoner, dimensionskedja, kaplista, material, plan |
| `src/preview.mjs` | SVG från modellens polygoner, mått och dekorationslager |
| `src/app.mjs` | Editor, händelser, rapporter, lokal lagring, import/export |
| `styles.css` | Desktop, mobil och utskrift |
| `tools/serve.mjs` | Lokal HTTP-server med enbart Node |
| `tests/` | Logik-, rendering- och browserkontroller |
| `docs/ANALYS.md` | Genomgång av den tidigare implementationen |
| `docs/MODELL.md` | Verkstadsantaganden och avgränsningar |

Gamla labbsidor har ersatts av länkar till huvudverktyget för att deras felaktiga
dimensionskedjor inte ska användas som produktionsunderlag. Historiken finns i Git
(exempelvis `git show f782ef3:lab/lab-index-v5.1.html`). Äldre v4-lagring lämnas orörd.

## Avgränsningar

Ingen godtycklig XY-gering, kil-/triangelkonstruktion, individuell fasvinkel inom
en panel, tredje limningseditor, bildtolkning eller automatisk CAM/G-code-export.
Operationsmodellen har typade steg och indata-id för fortsatt utveckling.
Inlay är en designskiss, inte ett verifierat CNC-underlag. Ingen automatisk
bedömning av träslags lämplighet för livsmedelskontakt. Färg/ådring är stiliserad.
