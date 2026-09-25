# Analys före ombyggnad

Utgångspunkt: `f782ef3`, ren `codex-dev`. `main` pekar på `458d1d7`.
Samtliga sju ursprungliga filer lästa, inklusive båda labbversionerna.

## Det som kan tas vidare
- Svenska benämningar, nio träslag, enkel remsredigering, A/B/C-idén.
- Lokal manuell lagring och referensbild fungerar i normala fall.
- V5-labbets polygonklippning och V5.1:s beskrivning av axlar är användbara idéer.

## Fel och luckor
- Huvudsidans `draw` ritar alltid rader, även för edge/face grain.
- Preview repeterar remsor utanför limningens faktiska bredd: material uppstår visuellt.
- Tvärkapens mått behandlas som radbredd efter vältning. Den verkliga radbredden är
  grundlimningens tjocklek; tvärkapmåttet blir slutämnets tjocklek.
- V5.1 beskriver X×Z men använder ändå N×F i slutytan. V5 roterar bara 2D-kapytor.
- Kaplistan tar alla A/B/C oavsett användning och samma källängd för samtliga.
- Kapvinkel/shape påverkar inte huvudsidans geometri. V5:s godtyckliga kilar kan
  överlappa eller lämna glipor utan kontroll. Transformens normalisering tar bort offset.
- `el` saknas i huvudsidans operationskod. Undantaget fångas och loggas vid varje render.
  Operations- och byggplansytorna saknas också; operationsdata styr ingen geometri.
- Ändring av träslag/rad anropar bara draw och ger inkonsekvent övrig information.
- Ingen validering av sparad JSON, autosparning, import/export eller läsning vid start.
- Tomma/negativa remsor kan ge felaktiga mått eller låsa ritloopen.
- Inga beräkningstester, spår, inlay, verklig produktionsplan eller exempelväljare.
- Mobil får en lång formulärkolumn innan preview, täta radkontroller och breda tabeller.
- Service worker cachar godtyckliga requests och saknar avgränsad cachehantering.

## Genomförandeplan
1. Ren modell med explicit X (bredd), Y (fiber/längd), Z (tjocklek), validerat schema,
   polygoner, fysisk 90° vältning, A/B-rader, förskjutning och verklig trimning.
2. Testa dimensionskedja, kaplista, material och persistens med Node utan dependencies.
3. Bygg svensk responsiv editor och SVG-preview från exakt samma modell.
4. Produktionsplan, ytspår/text, JSON, autosparning, exempel, utskrift och dokumentation.
5. Browserkontroll, logiktester och separata commits på endast codex-dev.

## Medveten avgränsning för vinklade stavar
Vinkeln är en **längsgående fasning**, mätt från lodrät sida i X–Z-tvärsnittet.
Alla stavar i en limning har samma vinkel och parallella sidor. Varje råstav kapas ur
en egen rektangulär blank; dess bredd är remsbredd + |tan(vinkel) × Z|.
Yttre kanter rätas till det gemensamma rektangulära tvärsnittet. Materialförlust ingår.
A och B kan ha motsatta vinklar och ger ett byggbart sicksackmönster efter vältning.
Godtyckliga geringskap i XY, kilar och tre limningar exponeras inte som färdiga funktioner.
Operationsresultat har egna typer/id/input-id och polygoner för framtida vidarebearbetning.

Fysisk referens för vältning och tvärkap som slutlig tjocklek:
https://www.wwgoa.com/video/make-an-end-grain-cutting-board-2
