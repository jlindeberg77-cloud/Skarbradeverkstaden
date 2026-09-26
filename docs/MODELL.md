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
- Antal rader = tak(önskad längd / grundlimningens kalibrerade tjocklek) + extra rader.
- Tillgänglig sluttjocklek = tvärkapmått − 2 × ytmån. Överskott planas bort;
  underskott visas som avvikelse och preview visar det möjliga måttet.
- Källängd per A/B/C/D = antal segment × (tvärkapmått + sågspår) + 2 × ändmån.
  Ett sågspår per uttaget segment är budgeterat, inklusive det sista.
- A–D är separata paneler. Bara använda paneler förbrukar material. Radföljden
  kan vara ett färdigt mönster eller en egen lista med 1–16 positioner, till exempel
  D–B–C–D. Listan upprepas och kapas vid beräknat radantal. Förekomsten av varje
  bokstav avgör exakt hur många segment som ska kapas ur den panelen.
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

## Operationer och limning 3–4
`derive()` returnerar operationer med id, typ, input-id, mått och polygoner.
Kapning → limning 1 → tvärkapning → 90° vältning/180° arrangering → limning 2
→ limning 3 → limning 4 → sluttrimning. De två sista limningarna är valfria.

Före limning 3 rätas limning 2 till radernas gemensamma rektangel, utan att ännu
trimmas till önskat slutmått. Varje omlimning konsumerar sedan föregående skivas
faktiska träpolygoner. Kapning kan dela antingen bredden X eller längden Y.
Alla kap går vinkelrätt genom skivans tjocklek; ändträytan behålls uppåt.

Om kapriktningens tillgängliga mått är E, remsmåttet w och sågspåret k:
- Antal remsor n = golv(E / (w+k)). Ett helt sågspår reserveras för varje uttag,
  även det sista; ingen optimering som sparar sista sågspåret antas.
- Nytt mått i kapriktningen = n×w. Den andra sidans mått ändras inte.
- Restbit = E − n×(w+k). Restbiten återförs inte till brädan.
- Sågspårsvolym = n×k×skivans andra sidmått×ingående tjocklek.
- Restbitsvolym = restbit×andra sidmåttet×ingående tjocklek.
- Efter limning: ny tjocklek = ingående tjocklek − 2×stegets ytmån.

Remsordningen kan reverseras. Därefter vrids varannan **lagd** remsa 180° runt
sin mittpunkt i bordets plan. Varje polygon klipps från ingångsskivan, förflyttas
och roteras som en fysisk del. Ingen geometrisk skevning, materialupprepning,
ny råstav eller ny 90° vältning används. Kapvyn visar sågspår och restbit;
limningsvyn visar de kvarvarande delarna efter arrangering.

Limning 4 använder exakt resultatet efter limning 3, inklusive dess mått och
ytmån. Ytmånen för slutplaning tillkommer efter sista limningen. Verktyget visar
avvikelser om önskad längd, bredd eller tjocklek inte ryms efter operationerna.
Öka extra startrader för längd, stavbredder för bredd och tvärkapmått för tjocklek.
Omlimningarna kräver minst en hel remsa och tillåter högst 200 per steg.
I edge-grain-läget är dessa steg inaktiva men sparade inställningar bevaras.

## Kaplista och material
Kaplistan grupperar identiska råämnen per panel, träslag och remsbredd. Den
anger antal, längd, rektangulär bredd, tjocklek och fasvinkel. Tvärkapade segment
visas separat med sin blandning av träslag representerad av källpanelens id.

Omlimningarnas segmentlista redovisas separat som uttag ur befintlig skiva.
Den adderas inte till råvirkesbehovet. Sågspår, restbit och planingsspill för varje
omlimning visas separat som delar av det ursprungliga materialet.

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
Schema `version: 2` lagras i localStorage under den bevarade nyckeln
`skarbradeverkstan.project.v1`. Import och återläsning migrerar version 1 till
version 2 med noll extra rader, ingen omlimning och motsvarande tidigare A/B-följd.
Tidigare geometri och kaplista ändras inte. Nyckeln behålls för att användaren
automatiskt ska hitta sitt tidigare projekt. Exporten märks med version 2.
Varje giltig ändring sparas; ofullständiga tal skriver inte över giltiga data.
JSON kontrolleras för version, typer, intervall och geometri innan import.
Gamla v4-data behålls under sin gamla nyckel. Skadad ny lagring skrivs inte över
förrän användaren väljer Ny design eller öppnar en giltig JSON. Ångra lagrar
60 föregående tillstånd i minnet; JSON-export är den beständiga externa backupen.
