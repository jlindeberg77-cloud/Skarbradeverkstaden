# Så räknar Skärbrädeverkstan

Alla tal i geometrin är millimeter, utan avrundning mellan operationer. Visning
avrundas till högst två decimaler. Kapmått måste avrundas uppåt vid tillverkning.

## Axlar och vältning
X går tvärs stavarnas bredder, Y längs fiberriktningen och Z genom grundlimningens
tjocklek. Preview av en liggande bräda visar Y vågrätt och X lodrätt. Tvärsnittsvyn
visar X vågrätt och Z lodrätt.

- Edge grain: längsgående stavar, en limning. Riktad ämnestjocklek = sluttjocklek
  + två ytmåner. Ämneslängd = slutlängd + två ändmåner.
- End grain: tvärkapa vinkelrätt mot Y. Vält varje segment 90° så dess X×Z-yta
  pekar uppåt. Tvärkapmåttet blir brädans nya tjocklek, inte dess radlängd.
- Antal rader = tak(önskad längd / grundlimningens kalibrerade tjocklek).
- Tillgänglig sluttjocklek = tvärkapmått − 2 × ytmån. Överskott planas bort;
  underskott visas som avvikelse och preview visar det möjliga måttet.
- Källängd per A/B = antal segment × (tvärkapmått + sågspår) + 2 × ändmån.
  Ett sågspår per uttaget segment är budgeterat, inklusive det sista.
- A och B är separata paneler. Bara använda paneler förbrukar material.
- Vändning är en riktig 180° rotation i bordets plan efter vältning, inte en
  spegling. Förskjutning ändrar radens position utan upprepning av material.
- Slutbredd begränsas till radernas gemensamma helt fyllda rektangulära bredd.
  Om den är mindre än önskat visas avvikelsen. Längden trimmas från sista raden.

Vältningens dimensionsprincip beskrivs också av WoodWorkers Guild of America:
https://www.wwgoa.com/video/make-an-end-grain-cutting-board-2

## Byggbara vinklade stavar
En limning har en gemensam längsgående fasvinkel θ, högst ±45°, från lodrät sida.
Det är **inte** ett geringskap längs Y. Alla stavar har parallella limytor och lika
tjocklek, så de kan limmas utan glipor. Bredd w mäts horisontellt i X på samma
sida av tvärsnittet för alla stavar.

Sidoförskjutning d = tan(θ) × Z. Varje stavs tvärsnitt är polygonen
(x,0), (x+w,0), (x+w+d,Z), (x+d,Z). Råämnet till just den staven har bredd
w+|d|. Modellen räknar konservativt med separata rektangulära råämnen, utan
nestning av kompletterande trianglar. Rätning av panelens båda ytterkanter
ger en rektangel med bredd summan(w)−|d|. Sedan klipps de verkliga polygonerna
mot denna rektangel; inga överlapp eller tomrum läggs till för att fylla ut.

Exemplet Sicksack använder A=+22,5° och B=−22,5°. Det ger motsatta diagonaler
i verkliga ändträytor. Valfri vinkel per enskild stav, geringskap i XY, kilar,
trianglar och godtyckliga diamantkonstruktioner ingår inte i denna iteration.

## Operationer och fortsatt utveckling
`derive()` returnerar operationer med id, typ, input-id, mått och polygoner.
Kapning → limning 1 → tvärkapning → 90° vältning/180° arrangering → limning 2
→ sluttrimning. Ytterligare kap-/limningssteg kan konsumera ett tidigare
operationsresultat. En tredje limning har ännu ingen editor eller exekvering.
Det finns därför ingen kontroll som utger sig för att utföra den.

## Kaplista och material
Kaplistan grupperar identiska råämnen per panel, träslag och remsbredd. Den
anger antal, längd, rektangulär bredd, tjocklek och fasvinkel. Tvärkapade segment
visas separat med sin blandning av träslag representerad av källpanelens id.

Volym = Σ(antal × längd × bredd × tjocklek). 1 liter = 1 000 000 mm³.
Fasningsspill = rektangulär volym − parallellogrammens volym före paneltrimning.
Ändmån, definierat sågspår vid tvärkap, ytmån, kanttrimning och radtrimning ingår
i råämnesvolymen. Riktningsmån från ohyvlat virke, längsgående sågspår, defekter,
inlay och lim ingår inte. Köpbehovet måste kompletteras med dessa marginaler.

## Spår och text
Saftspårets avstånd mäts till centrumlinjen. Bredd och djup valideras mot
verkliga slutmått. Centrumlinjens hörnradie = spårbredden. Ogiltiga spår döljs
och ger en varning. Inlaytextens position är procent av visad slutytas längd
(vågrätt) och bredd (lodrätt). Teckenstorlek är nominell fontstorlek, inte exakt
versalhöjd. Rotation sker runt textens centrum och text utanför kanten klipps.
Ingen fräsbana, V-bit-vinkel, passning, livsmedelsklassning eller G-code beräknas.

## Sparning
Schema `version: 1` lagras i localStorage under `skarbradeverkstan.project.v1`.
Varje giltig ändring sparas; ofullständiga tal skriver inte över giltiga data.
JSON kontrolleras för version, typer, intervall och geometri innan import.
Gamla v4-data behålls under sin gamla nyckel. Skadad ny lagring skrivs inte över
förrän användaren väljer Ny design eller öppnar en giltig JSON. Ångra lagrar
60 föregående tillstånd i minnet; JSON-export är den beständiga externa backupen.
