import { WOODS, mm, crossSection } from './model.mjs';
export const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const n = v => Number(v.toFixed(4));
export function renderPreview(p, m, view = 'finish', active = 'A') {
  const key = Object.hasOwn(p.glueups,active)?active:Object.keys(m.sources)[0];
  const section = m.sections[key] || crossSection(p.glueups[key],p.mode==='end'?p.stock.thickness:p.target.thickness+2*p.stock.surface), source = m.sources[key];
  const unused = !source;
  if (unused && (view==='source'||view==='cut')) view='section';
  const reglue = m.reglues.find(step=>view===step.id||view===`recut${step.stage}`);
  const recut = reglue && view===`recut${reglue.stage}`;
  const cross = view === 'section', end = p.mode === 'end';
  let parts = m.parts, width = m.actual.width, length = m.actual.length, origin = 0;
  let description = `Färdig yta: ${mm(length)} × ${mm(width)} mm. Tjocklek ${mm(m.actual.thickness)} mm.`, title = 'Färdig bräda';
  if (view === 'source' || view === 'cut') {
    parts = source.parts; width = source.width; length = source.length;
    title = view === 'cut' ? `Tvärkapning · ${key}` : `Limning 1 · ${key}`;
    description = `Längsgående yta efter rätning av ytterkanter. ${mm(length)} × ${mm(width)} × ${mm(section.thickness)} mm.${view === 'cut' ? ` ${source.count} segment à ${mm(p.stock.slice)} mm; markerade band är sågspår, inte trä.` : ' Träets fibrer löper längs brädan.'}`;
  }
  if (cross) {
    parts = section.raw; width = section.width + Math.abs(section.shift); length = section.thickness; origin = Math.min(0,section.shift);
    title = `Stavarnas tvärsnitt · ${key}`;
    description = `${unused?'Denna grundlimning används inte i radföljden; ingen källängd eller materialåtgång beräknas. ':''}Ändvy före rätning av ytterkanter. Fasning ${mm(p.glueups[key].angle)}° genom ${mm(section.thickness)} mm tjocklek. Streckade linjer visar kanterna efter rätning: ${mm(section.usable)} mm användbar bredd.`;
  }
  if (view === 'assembly') {
    parts = m.assembled; origin = Math.min(...m.rows.map(r=>r.offset));
    width = Math.max(...m.rows.map(r=>r.offset + m.sections[r.source].usable))-origin; length = m.rawLength;
    title = 'Vältning & limning 2';
    description = `${m.rows.length} segment, välta 90°${p.arrangement.pattern.includes('turn') ? ', varannan rad vriden 180° i planet' : ''}. Streckad ram visar ${m.reglues.length?'den rätade skivan inför nästa kapning':'sluttrimningen'}. ${mm(m.availableWidth)} mm gemensam bredd. Källor och radordning finns i arbetsplanen.`;
  }
  if (reglue) {
    const board=recut?reglue.input:reglue;
    parts=board.parts;width=board.width;length=board.length;
    title=recut?`Kapning inför limning ${reglue.stage}`:`Limning ${reglue.stage}`;
    description=recut?`${reglue.count} remsor à ${mm(reglue.stripWidth)} mm, ${mm(reglue.kerf)} mm sågspår och ${mm(reglue.offcut)} mm restbit. Ljusa band är material som försvinner.`:`${mm(length)} × ${mm(width)} × ${mm(board.thickness)} mm efter limning och ${mm(reglue.surface)} mm planing per sida. ${reglue.turn?'Varannan lagd remsa är vriden 180°. ':''}${reglue.reverse?'Remsornas ordning är omvänd. ':''}Ändträytan är fortfarande uppåt.`;
  }
  const displayW = cross ? width : length, displayH = cross ? length : width;
  const scaleRef = Math.max(displayW, displayH), pad = scaleRef*.105, font = scaleRef*.022;
  const endTexture = end && (view==='finish'||view==='assembly'||reglue);
  const woodPatterns = Object.entries(WOODS).map(([id,w]) => `<pattern id="wood-${id}" width="${endTexture?13:72}" height="${endTexture?13:18}" patternUnits="userSpaceOnUse"><rect width="100%" height="100%" fill="${w.color}"/>${endTexture ? `<path d="M-3 5 Q7 -6 17 8 M-3 9 Q7 -2 17 12 M-3 13 Q7 2 17 16" fill="none" stroke="${w.grain}" stroke-width=".4" opacity=".28"/><path d="M2 2L3 3M10 9L11 10" stroke="${w.grain}" opacity=".3"/>` : `<path d="M0 3Q20 0 40 3T80 3M0 8Q24 12 50 8T85 8M0 14Q30 10 72 15" fill="none" stroke="${w.grain}" stroke-width="${id==='zebrawood'?1.5:.5}" opacity="${id==='zebrawood'?.55:.25}"/>`}</pattern>`).join('');
  const polygons = parts.map(part => `<polygon data-wood="${part.wood}" points="${part.polygon.map(q=>cross ? `${n(q.x-origin)},${n(q.y)}` : `${n(q.y)},${n(q.x-origin)}`).join(' ')}" fill="url(#wood-${part.wood})" stroke="#362718" stroke-opacity=".18" stroke-width=".3"><title>${WOODS[part.wood].name}${part.row!==undefined?` · rad ${part.row+1}`:''}</title></polygon>`).join('');
  let overlays = '';
  if (view === 'cut') {
    for(let i=0;i<source.count;i++) {
      const x=p.stock.endTrim+i*(p.stock.slice+p.stock.kerf)+p.stock.slice;
      overlays += `<rect x="${n(x)}" y="0" width="${p.stock.kerf}" height="${width}" fill="#f3f0e9" stroke="#476453" stroke-width=".3"/>`;
    }
    overlays += `<rect x="0" y="0" width="${p.stock.endTrim}" height="${width}" fill="#f3f0e9" opacity=".7"/><rect x="${length-p.stock.endTrim}" y="0" width="${p.stock.endTrim}" height="${width}" fill="#f3f0e9" opacity=".7"/>`;
  }
  if(cross) overlays += `<path d="M${section.left-origin} 0v${length}M${section.left-origin+section.usable} 0v${length}" fill="none" stroke="#fff" stroke-width="${scaleRef*.003}" stroke-dasharray="3 2"/>`;
  if(view==='assembly') overlays += `<rect x="0" y="${m.originX-origin}" width="${m.reglues.length?m.rawLength:m.actual.length}" height="${m.reglues.length?m.availableWidth:m.actual.width}" fill="none" stroke="#fff" stroke-width="${scaleRef*.004}" stroke-dasharray="5 3"/>`;
  if(recut) {
    const band=(start,size)=>reglue.axis==='x'?`<rect x="0" y="${n(start)}" width="${length}" height="${n(size)}" fill="#f3f0e9" opacity=".85"/>`:`<rect x="${n(start)}" y="0" width="${n(size)}" height="${width}" fill="#f3f0e9" opacity=".85"/>`;
    for(let i=0;i<reglue.count;i++)overlays+=band(i*(reglue.stripWidth+reglue.kerf)+reglue.stripWidth,reglue.kerf);
    overlays+=band(reglue.count*(reglue.stripWidth+reglue.kerf),reglue.offcut);
  }
  if(view==='finish') {
    if(p.groove.enabled && m.grooveValid) {
      const g=p.groove;
      overlays += `<g data-decoration="groove"><rect x="${g.inset}" y="${g.inset}" width="${length-2*g.inset}" height="${width-2*g.inset}" rx="${g.width}" fill="none" stroke="#251b14" stroke-opacity=".5" stroke-width="${g.width}"/><rect x="${g.inset}" y="${g.inset}" width="${length-2*g.inset}" height="${width-2*g.inset}" rx="${g.width}" fill="none" stroke="#120e0a" stroke-opacity=".18" stroke-width="${g.width*.45}"/></g>`;
    }
    if(p.inlay.enabled) {
      const i=p.inlay,x=length*i.x/100,y=width*i.y/100;
      overlays += `<g clip-path="url(#board-clip)" data-decoration="inlay"><text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="${i.font}" font-size="${i.size}" font-weight="600" fill="${WOODS[i.wood].color}" stroke="${WOODS[i.wood].grain}" stroke-width=".12" transform="rotate(${i.rotation} ${x} ${y})">${escapeHTML(i.text)}</text></g>`;
    }
  }
  const labelX=cross?'Bredd':'Längd', labelY=cross?'Tjocklek':'Bredd';
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeHTML(title)}: ${mm(displayW)} gånger ${mm(displayH)} millimeter" viewBox="${-pad} ${-pad*.5} ${displayW+pad*2} ${displayH+pad*1.7}"><defs>${woodPatterns}<clipPath id="board-clip"><rect width="${displayW}" height="${displayH}"/></clipPath><filter id="shadow" x="-20%" y="-20%" width="150%" height="160%"><feDropShadow dx="0" dy="${scaleRef*.014}" stdDeviation="${scaleRef*.016}" flood-color="#30271c" flood-opacity=".15"/></filter></defs><g filter="url(#shadow)">${polygons}</g>${overlays}<g fill="none" stroke="#6f7d70" stroke-width="${scaleRef*.0012}"><path d="M0 ${displayH+pad*.38}v${pad*.18}M0 ${displayH+pad*.47}H${displayW}M${displayW} ${displayH+pad*.38}v${pad*.18}"/><path d="M${-pad*.38} 0h${-pad*.18}M${-pad*.47} 0V${displayH}M${-pad*.38} ${displayH}h${-pad*.18}"/></g><g fill="#58675c" font-family="system-ui,sans-serif" font-size="${font}"><text x="${displayW/2}" y="${displayH+pad*.86}" text-anchor="middle">${labelX} ${mm(displayW)} mm</text><text transform="translate(${-pad*.67} ${displayH/2}) rotate(-90)" text-anchor="middle">${labelY} ${mm(displayH)} mm</text></g></svg>`;
  return { svg, description, title };
}
