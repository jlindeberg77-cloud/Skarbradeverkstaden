// Millimetres throughout. X = panel width, Y = grain direction, Z = thickness.
// A tilted slice maps (X,Y,Z) -> (X,Z,Y): crosscut length becomes final thickness.
export const WOODS = {
  walnut: { name: 'Valnöt', color: '#76503a', grain: '#3f281f' },
  maple: { name: 'Lönn', color: '#ead7ab', grain: '#ba955b' },
  padouk: { name: 'Padouk', color: '#b9532e', grain: '#6e2b20' },
  purpleheart: { name: 'Purpleheart', color: '#77506f', grain: '#402b44' },
  oak: { name: 'Ek', color: '#bd965f', grain: '#79552e' },
  ash: { name: 'Ask', color: '#d7c399', grain: '#9b7e50' },
  wenge: { name: 'Wenge', color: '#40332b', grain: '#201b18' },
  zebrawood: { name: 'Zebrawood', color: '#c7a268', grain: '#4e3426' },
  bubinga: { name: 'Bubinga', color: '#934f3d', grain: '#512d29' }
};
export const SCHEMA = 1;
export const STORAGE_KEY = 'skarbradeverkstan.project.v1';
export const clone = value => JSON.parse(JSON.stringify(value));
export const sumWidth = strips => strips.reduce((n, s) => n + s.width, 0);
export const mm = value => new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 2 }).format(value);
const assert = (test, message) => { if (!test) throw new Error(message); };
function number(value, min, max, name) {
  assert(typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max,
    `${name} måste vara mellan ${min} och ${max}.`);
}
export function validate(p) {
  assert(p && p.version === SCHEMA, 'Projektets filversion stöds inte.');
  assert(['edge', 'end'].includes(p.mode), 'Okänd brädtyp.');
  assert(typeof p.name === 'string' && p.name.length <= 80, 'Projektnamn får vara högst 80 tecken.');
  for (const k of ['length', 'width']) number(p.target?.[k], 30, 2000, 'Slutmått');
  number(p.target?.thickness, 5, 150, 'Sluttjocklek');
  number(p.stock?.thickness, 5, 150, 'Grundlimningens tjocklek');
  number(p.stock?.slice, 5, 160, 'Tvärkapmått');
  number(p.stock?.kerf, 0, 10, 'Sågspår');
  number(p.stock?.surface, 0, 10, 'Ytmån per sida');
  number(p.stock?.endTrim, 0, 100, 'Ändmån per ände');
  assert(['same', 'turn', 'ab', 'ab-turn'].includes(p.arrangement?.pattern), 'Okänt radmönster.');
  number(p.arrangement?.offset, -150, 150, 'Förskjutning');
  for (const key of ['A', 'B']) {
    const g = p.glueups?.[key];
    assert(g && Array.isArray(g.strips) && g.strips.length >= 1 && g.strips.length <= 60, 'Varje limning behöver 1–60 remsor.');
    number(g.angle, -45, 45, 'Fasvinkel');
    for (const s of g.strips) {
      assert(Object.hasOwn(WOODS, s.wood), 'Okänt träslag.');
      number(s.width, 1, 500, 'Remsbredd');
    }
    assert(sumWidth(g.strips) <= 3000, 'Grundlimningen får vara högst 3 000 mm bred.');
  }
  assert(typeof p.groove?.enabled === 'boolean', 'Ogiltig spårinställning.');
  number(p.groove.inset, 2, 200, 'Spåravstånd');
  number(p.groove.width, 1, 30, 'Spårbredd');
  number(p.groove.depth, 0.5, 20, 'Spårdjup');
  assert(typeof p.inlay?.enabled === 'boolean' && typeof p.inlay.text === 'string' && p.inlay.text.length <= 60, 'Inlaytext får vara högst 60 tecken.');
  assert(Object.hasOwn(WOODS, p.inlay.wood), 'Okänt inlayträslag.');
  assert(['serif', 'sans-serif', 'monospace'].includes(p.inlay.font), 'Okänt typsnitt.');
  number(p.inlay.size, 3, 100, 'Textstorlek');
  number(p.inlay.x, 0, 100, 'Textens X-position');
  number(p.inlay.y, 0, 100, 'Textens Y-position');
  number(p.inlay.rotation, -180, 180, 'Textrotation');
  return p;
}
export function serialize(project) { return JSON.stringify(validate(project), null, 2); }
export function deserialize(text) {
  assert(typeof text === 'string' && text.length <= 150000, 'Projektfilen är för stor.');
  let p;
  try { p = JSON.parse(text); } catch { throw new Error('Filen innehåller inte giltig JSON.'); }
  return clone(validate(p));
}
export function moveStrip(strips, index, direction) {
  const next = index + direction;
  if (index < 0 || index >= strips.length || next < 0 || next >= strips.length) return strips;
  [strips[index], strips[next]] = [strips[next], strips[index]];
  return strips;
}
export const EXAMPLES = [
  { id: 'classic', name: 'Valnöt & lönn', description: 'Längsgående · 400 × 280 mm' },
  { id: 'colours', name: 'Verkstadens färger', description: 'Nio träslag · 360 × 270 mm' },
  { id: 'end', name: 'Klassiskt ändträ', description: 'Vända rader · 400 × 280 mm' },
  { id: 'chevron', name: 'Sicksack i ändträ', description: 'Två limningar · ±22,5° fasning' }
];
export function example(id = 'classic') {
  const strips = [50, 15, 50, 50, 50, 15, 50].map((width, i) => ({ wood: [1, 5].includes(i) ? 'maple' : 'walnut', width }));
  const p = {
    version: SCHEMA, name: 'Valnöt & lönn', mode: 'edge',
    target: { length: 400, width: 280, thickness: 30 },
    stock: { thickness: 25, slice: 32, kerf: 3.2, surface: 1, endTrim: 10 },
    glueups: { A: { angle: 0, strips }, B: { angle: 0, strips: clone(strips) } },
    arrangement: { pattern: 'turn', offset: 0 },
    groove: { enabled: false, inset: 18, width: 6, depth: 3 },
    inlay: { enabled: false, text: 'J L', x: 50, y: 82, size: 18, rotation: 0, font: 'serif', wood: 'maple' }
  };
  if (id === 'colours') {
    p.name = 'Verkstadens färger'; p.target.length = 360; p.target.width = 270;
    p.glueups.A.strips = Object.keys(WOODS).map(wood => ({ wood, width: 30 }));
  }
  if (id === 'end' || id === 'chevron') {
    p.mode = 'end'; p.name = 'Klassiskt ändträ';
    p.glueups.A.strips = Array.from({ length: 8 }, (_, i) => ({ wood: i % 2 ? 'maple' : 'walnut', width: 35 }));
  }
  if (id === 'chevron') {
    p.name = 'Sicksack i ändträ'; p.target.length = 360; p.stock.thickness = 30;
    p.arrangement.pattern = 'ab';
    p.glueups.A.angle = 22.5;
    p.glueups.A.strips = Array.from({ length: 12 }, (_, i) => ({ wood: i % 3 === 0 ? 'padouk' : i % 3 === 1 ? 'maple' : 'walnut', width: 25 }));
    p.glueups.B = clone(p.glueups.A); p.glueups.B.angle = -22.5;
  }
  return validate(p);
}

export function rectangle(x, y, width, height) {
  return [{ x, y }, { x: x + width, y }, { x: x + width, y: y + height }, { x, y: y + height }];
}
// Sutherland–Hodgman: every operation retains actual material polygons.
export function clipPolygon(poly, box) {
  let result = poly;
  for (const [axis, limit, sign] of [['x', box.x, 1], ['x', box.x + box.width, -1], ['y', box.y, 1], ['y', box.y + box.height, -1]]) {
    const out = [];
    for (let i = 0; i < result.length; i++) {
      const a = result[i], b = result[(i + 1) % result.length];
      const ia = sign * (a[axis] - limit) >= -1e-9, ib = sign * (b[axis] - limit) >= -1e-9;
      if (ia !== ib) {
        const t = (limit - a[axis]) / (b[axis] - a[axis]);
        out.push({ x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) });
      }
      if (ib) out.push(b);
    }
    result = out;
  }
  return result;
}
export function area(poly) {
  return Math.abs(poly.reduce((a, p, i) => { const q = poly[(i + 1) % poly.length]; return a + p.x * q.y - q.x * p.y; }, 0)) / 2;
}
export function crossSection(glue, thickness) {
  const shift = Math.tan(glue.angle * Math.PI / 180) * thickness;
  const width = sumWidth(glue.strips), left = Math.max(0, shift), usable = width - Math.abs(shift);
  assert(usable > 0, 'Fasningen tar hela grundlimningens bredd. Öka remsbredderna eller minska vinkeln.');
  let x = 0;
  const raw = glue.strips.map((s, index) => {
    const polygon = [{ x, y: 0 }, { x: x + s.width, y: 0 }, { x: x + s.width + shift, y: thickness }, { x: x + shift, y: thickness }];
    x += s.width;
    return { wood: s.wood, strip: index, polygon };
  });
  const parts = raw.map(p => ({ ...p, polygon: clipPolygon(p.polygon, { x: left, y: 0, width: usable, height: thickness }).map(q => ({ x: q.x - left, y: q.y })) })).filter(p => area(p.polygon) > 1e-8);
  return { width, shift, left, usable, thickness, raw, parts };
}
export function sourceLength(count, slice, kerf, trim) {
  // One saw pass per harvested slice, plus independently specified end allowances.
  return count * (slice + kerf) + 2 * trim;
}
export function arrangeRow(section, index, turn, offset) {
  return section.parts.map(p => ({ ...p, row: index, polygon: p.polygon.map(q => ({
    x: (turn ? section.usable - q.x : q.x) + offset,
    y: (turn ? section.thickness - q.y : q.y) + index * section.thickness
  })) }));
}
function cropParts(parts, width, length, originX = 0) {
  return parts.map(p => ({ ...p, polygon: clipPolygon(p.polygon, { x: originX, y: 0, width, height: length }).map(q => ({ x: q.x - originX, y: q.y })) })).filter(p => area(p.polygon) > 1e-8);
}
export function derive(project) {
  const p = validate(project), end = p.mode === 'end', { target: t, stock: s } = p;
  const z = end ? s.thickness : t.thickness + 2 * s.surface;
  const count = end ? Math.ceil(t.length / z) : 1;
  assert(count <= 200, 'Högst 200 rader stöds. Öka grundlimningens tjocklek eller minska längden.');
  const rows = Array.from({ length: count }, (_, i) => ({
    index: i, source: end && p.arrangement.pattern.startsWith('ab') && i % 2 ? 'B' : 'A',
    turn: end && p.arrangement.pattern.includes('turn') && i % 2 === 1,
    offset: end && i % 2 ? p.arrangement.offset : 0
  }));
  const sections = {}, sources = {};
  for (const row of rows) {
    if (!sections[row.source]) sections[row.source] = crossSection(p.glueups[row.source], z);
    sources[row.source] ??= { count: 0 };
    sources[row.source].count++;
  }
  const cutlist = [], material = {}, operations = [], warnings = [];
  for (const [key, source] of Object.entries(sources)) {
    const section = sections[key], g = p.glueups[key];
    source.length = end ? sourceLength(source.count, s.slice, s.kerf, s.endTrim) : t.length + 2 * s.endTrim;
    source.width = section.usable;
    const group = new Map();
    for (const strip of g.strips) {
      const blankWidth = strip.width + Math.abs(section.shift);
      const k = `${strip.wood}|${strip.width}`;
      if (!group.has(k)) group.set(k, { source: key, stage: 'Kapning → limning 1', wood: strip.wood, count: 0, length: source.length, width: blankWidth, thickness: z, stripWidth: strip.width, angle: g.angle });
      group.get(k).count++;
      material[strip.wood] ??= { wood: strip.wood, blankVolume: 0, shapedVolume: 0, count: 0 };
      material[strip.wood].blankVolume += blankWidth * z * source.length;
      material[strip.wood].shapedVolume += strip.width * z * source.length;
      material[strip.wood].count++;
    }
    cutlist.push(...group.values());
    // Top face of panel after outer edges have been straightened.
    let x = section.shift - section.left;
    const top = g.strips.map((strip, i) => { const part = { wood: strip.wood, strip: i, polygon: rectangle(x, 0, strip.width, source.length) }; x += strip.width; return part; });
    source.parts = cropParts(top, section.usable, source.length);
    operations.push({ id: `glue1-${key}`, type: 'glue', inputs: [], source: key, parts: source.parts, width: section.usable, length: source.length, thickness: z });
    if (end) operations.push({ id: `cut-${key}`, type: 'crosscut', inputs: [`glue1-${key}`], count: source.count, slice: s.slice, kerf: s.kerf });
  }
  const left = Math.max(...rows.map(r => r.offset));
  const right = Math.min(...rows.map(r => r.offset + sections[r.source].usable));
  const availableWidth = Math.max(0, right - left);
  assert(availableWidth > 0, 'Raderna har ingen gemensam bredd. Minska förskjutningen.');
  const actual = { width: Math.min(t.width, availableWidth), length: t.length, thickness: end ? Math.min(t.thickness, s.slice - 2 * s.surface) : t.thickness };
  assert(actual.thickness > 0, 'Tvärkapmåttet måste vara större än båda ytornas planingsmån.');
  if (availableWidth < t.width - 1e-7) warnings.push(`Det saknas ${mm(t.width - availableWidth)} mm bredd. Möjlig slutbredd är ${mm(availableWidth)} mm.`);
  if (end && s.slice - 2 * s.surface < t.thickness - 1e-7) warnings.push(`Tvärkapen ger bara ${mm(actual.thickness)} mm sluttjocklek efter ytmån. Öka tvärkapmåttet till minst ${mm(t.thickness + 2 * s.surface)} mm.`);
  const assembled = end ? rows.flatMap(r => arrangeRow(sections[r.source], r.index, r.turn, r.offset).map(part => ({ ...part, source: r.source }))) : sources.A.parts;
  const rawLength = end ? count * z : sources.A.length;
  // Edge: remove end allowance at both ends. Strips are constant along the grain.
  const finalParts = cropParts(assembled, actual.width, actual.length, left);
  if (end) {
    operations.push({ id: 'rotate', type: 'rotate90', inputs: Object.keys(sources).map(k => `cut-${k}`), rows, parts: assembled, width: availableWidth, length: rawLength, thickness: s.slice });
    operations.push({ id: 'glue2', type: 'glue', inputs: ['rotate'], parts: assembled, width: availableWidth, length: rawLength, thickness: s.slice });
  }
  operations.push({ id: 'finish', type: 'trim', inputs: [end ? 'glue2' : 'glue1-A'], parts: finalParts, ...actual });
  const grooveValid = p.groove.inset > p.groove.width / 2 && 2 * p.groove.inset + p.groove.width < Math.min(actual.width, actual.length) && p.groove.depth < actual.thickness;
  if (p.groove.enabled && !grooveValid) warnings.push('Spåret ryms inte i brädan. Justera kantavstånd, bredd eller djup.');
  const plan = [];
  for (const [key, source] of Object.entries(sources)) {
    const g = p.glueups[key], sec = sections[key];
    plan.push({ title: `Kapa råämnen · ${key}`, text: `Kapa ${g.strips.length} stavar, ${mm(source.length)} mm långa och ${mm(z)} mm tjocka, enligt kaplistan. Måtten gäller riktat virke; lägg själv till råvirkets riktningsmån.` });
    if (g.angle) plan.push({ title: `Fasa stavarna · ${key}`, text: `Fasa båda långsidorna ${mm(g.angle)}° från lodrätt. Remsbredderna mäts horisontellt på samma sida av tvärsnittet. Varje rektangulärt råämne har ${mm(Math.abs(sec.shift))} mm extra bredd för fasningen.` });
    plan.push({ title: `Limning 1 · ${key}`, text: `Limma i ordning: ${g.strips.map((strip, i) => `${i + 1}. ${WOODS[strip.wood].name} ${mm(strip.width)}`).join(' → ')} mm. ${g.angle ? `Räta ytterkanterna; kvar blir ${mm(sec.usable)} mm bredd.` : `Bredd ${mm(sec.usable)} mm.`} ${end ? `Kalibrera till ${mm(z)} mm tjocklek före tvärkapning.` : ''}` });
    if (end) plan.push({ title: `Tvärkapa · ${key}`, text: `Ta ut ${source.count} segment à ${mm(s.slice)} mm med vinkelräta tvärkap (90° mot fiberriktningen). Budget: ${source.count} sågspår à ${mm(s.kerf)} mm och ${mm(s.endTrim)} mm ändmån i vardera änden.` });
  }
  if (end) {
    plan.push({ title: 'Vält & arrangera', text: `Vält alla ${count} segment 90° så ändträet pekar uppåt. Varje rad är ${mm(z)} mm lång i brädans längdriktning, tjockleken blir ${mm(s.slice)} mm. Radordning: ${rows.map(r => `${r.index + 1}:${r.source}${r.turn ? '↻' : ''}`).join(' ')}.${p.arrangement.offset ? ` Förskjut varannan rad ${mm(p.arrangement.offset)} mm; överskjutande material trimmas bort, det återkommer inte på andra sidan.` : ''}${p.arrangement.pattern.includes('turn') ? ' ↻ = vrid 180° i bordets plan efter vältningen.' : ''}` });
    plan.push({ title: 'Limning 2', text: `Limma raderna kant mot kant. Längd före trimning ${mm(rawLength)} mm. Gemensam, helt täckt bredd ${mm(availableWidth)} mm.` });
  }
  plan.push({ title: 'Plana & trimma', text: `${end ? 'Plana ändträytan med frässläde/CNC eller slipning.' : 'Plana limningen.'} Avsatt ytmån ${mm(s.surface)} mm per sida${end && s.slice - 2 * s.surface > t.thickness ? ` plus ${mm(s.slice - 2 * s.surface - t.thickness)} mm för att nå önskad tjocklek` : ''}. Trimma till ${mm(actual.length)} × ${mm(actual.width)} × ${mm(actual.thickness)} mm.${warnings.length ? ' Kontrollera måttvarningarna före tillverkning.' : ''}` });
  if (p.groove.enabled && grooveValid) plan.push({ title: 'Fräs spåret', text: `Spårets centrumlinje ${mm(p.groove.inset)} mm från kanten, ${mm(p.groove.width)} mm brett och ${mm(p.groove.depth)} mm djupt. Radie i centrumlinjens hörn ${mm(p.groove.width)} mm.` });
  if (p.inlay.enabled) plan.push({ title: 'Förbered inlay', text: `Text ”${p.inlay.text}”, nominell teckenstorlek ${mm(p.inlay.size)} mm, rotation ${mm(p.inlay.rotation)}°. Endast visualisering; skapa och kontrollera verktygsbanor separat i CAM.` });
  return { actual, rows, sections, sources, cutlist, material: Object.values(material), operations, parts: finalParts, assembled, rawLength, availableWidth, originX: left, warnings, plan, grooveValid, targetMet: actual.width >= t.width - 1e-7 && actual.thickness >= t.thickness - 1e-7 };
}
