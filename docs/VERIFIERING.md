# Verifiering 2026-09-25

## Miljö
- Windows, Node v24.19.0, Playwright med installerad Microsoft Edge i headless-läge.
- Lokal server: `node tools/serve.mjs`, http://127.0.0.1:4173.
- Ingen installation av nya produktionsberoenden och ingen ändring av main.

## Faktiskt körda kontroller

`node --test --test-isolation=none tests/model.test.mjs tests/preview.test.mjs`

**20 tester passerade, 0 misslyckades.**

- Remsbredder, exakta slutmått, antal och grupperade kapmått.
- Verklig ändträtransformation: grundtjocklek styr rader, tvärkap styr sluttjocklek.
- A/B-fördelning med udda antal rader; oanvänd panel förbrukar inget material.
- 180° rotation, positiv/negativ offset, sista delraden och saknat material.
- 45° kända parallellogram, ±22,5° sicksack och fasningsvolym.
- 60 kombinationer av vinkel, offset och radmönster: summan av polygonernas
  areor motsvarar hela slutytan utan luckor eller extra material.
- Interna gränser efter planing av fasad edge-grain-panel.
- Materialvolym = kaplistans volym; riktiga indata till produktionsstegen.
- JSON-roundtrip, felaktig JSON, schemafel, negativa/icke-finita värden och storleksgräns.
- Remsflytt, polygonklippning, spårvalidering, SVG och säkert escaperad inlaytext.

`node tests/browser.mjs` med PLAYWRIGHT_MODULE och BROWSER_EXECUTABLE satta till
miljöns befintliga Playwright respektive Edge.

**40 kontroller passerade, 0 JavaScript-/konsolfel.**

- Start, riktiga dimensioner, add/duplicate/delete/move/undo och liveuppdatering.
- Ändträ, separat B-editor och B i kaplistan, alla fem geometrivyer.
- Spår, text med HTML-tecken och rotation.
- Autosparning och återläsning efter omladdning.
- JSON-nedladdning, ny design, import, avvisad trasig import utan dataförlust.
- Ogiltiga numeriska värden markeras; giltigt värde återställs vid blur.
- 768, 390 och 320 px: ingen horisontell sidöverströmning, fungerande redigering.
- Print-CSS inkluderar både kaplista och material trots vald rapportflik.
- Offline-omladdning efter att service worker fyllt sin cache.
- Skadad localStorage behålls och autosparning pausas tydligt.

Separat slutlig bildkontroll av desktop 1440×1000 och mobil 390×844 efter
typografijustering: innehåll synligt, proportionell preview, ingen mobilöverströmning.
Fullsidobilder av edge, sicksack och mobil granskades också visuellt.
`node --check src/app.mjs`, `node --check src/preview.mjs` och `git diff --check`
passerade.

## Upptäckt och rättat under testningen
- Browserkörning 1 klarade 39 funktionstester men fick konsol-404 för saknad
  favicon. Favicon tillagd; omkörning klarade samtliga 40 kontroller.
- Långa stavlistor begränsades med rullning. Försök med en separat rullande
  editor togs bort efter bildkontroll; den slutliga editorn följer sidans normala flöde.
- Fasade edge-grain-stavars synliga gränser korrigerades för ytmånens planing.

## Miljöbegränsningar, inte produktfel
- Första standardkörningen av Nodes test runner blockerades av sandboxens
  underprocesspolicy (spawn EPERM). Körningen utan processisolering passerade.
- `agent-browser` saknades. Tillgänglig Playwright/Edge användes som fallback.
- Browserstart krävde utökad behörighet eftersom sandboxen blockerade spawn.
- Browserkontroller är gjorda i Chromium/Edge, inte i Safari eller Firefox.
- Måtten har verifierats matematiskt, inte genom fysisk provtillverkning.

Screenshots och tillfälliga testfiler finns lokalt i `test-results/`, som ignoreras av Git.
