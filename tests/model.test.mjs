import test from 'node:test';
import assert from 'node:assert/strict';
import { example, derive, sumWidth, crossSection, area, clipPolygon, rectangle, serialize, deserialize, moveStrip, sourceLength, EXAMPLES } from '../src/model.mjs';
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} ≠ ${expected}`);

test('edge grain: width, final dimensions and grouped blanks agree', () => {
  const p = example(), m = derive(p);
  assert.equal(sumWidth(p.glueups.A.strips), 280);
  assert.deepEqual(m.actual, { length: 400, width: 280, thickness: 30 });
  assert.equal(m.cutlist.length, 2);
  assert.equal(m.cutlist.find(r => r.wood === 'walnut').count, 5);
  assert.equal(m.cutlist.find(r => r.wood === 'maple').count, 2);
  assert.equal(m.cutlist[0].length, 420);
  assert.equal(m.cutlist[0].thickness, 32);
  close(m.parts.reduce((a, p) => a + area(p.polygon), 0), 400 * 280);
});
test('end grain: XZ becomes surface, slice becomes thickness, not row pitch', () => {
  const p = example('end'), m = derive(p);
  assert.equal(m.rows.length, 16);
  assert.equal(m.rawLength, 400);
  assert.equal(m.actual.thickness, 30);
  close(m.sources.A.length, 16 * (32 + 3.2) + 20);
  close(m.parts.reduce((a, p) => a + area(p.polygon), 0), 400 * 280);
  p.stock.slice = 40;
  const thicker = derive(p);
  assert.equal(thicker.rows.length, 16);
  assert.equal(thicker.rawLength, 400);
  assert.ok(thicker.sources.A.length > m.sources.A.length);
});
test('turning a row 180 degrees reverses wood order with actual coordinates', () => {
  const m = derive(example('end'));
  const even = m.parts.filter(p => p.row === 0).sort((a,b) => Math.min(...a.polygon.map(p=>p.x))-Math.min(...b.polygon.map(p=>p.x)));
  const odd = m.parts.filter(p => p.row === 1).sort((a,b) => Math.min(...a.polygon.map(p=>p.x))-Math.min(...b.polygon.map(p=>p.x)));
  assert.equal(even[0].wood, 'walnut'); assert.equal(odd[0].wood, 'maple');
  assert.equal(Math.min(...odd[0].polygon.map(p=>p.y)), 25);
});
test('A/B sources are allocated separately, including an odd final row', () => {
  const p = example('end'); p.arrangement.pattern = 'ab'; p.target.length = 325;
  const m = derive(p);
  assert.equal(m.rows.length, 13); assert.equal(m.sources.A.count, 7); assert.equal(m.sources.B.count, 6);
  close(m.sources.A.length, sourceLength(7, 32, 3.2, 10));
  close(m.sources.B.length, sourceLength(6, 32, 3.2, 10));
  assert.equal(m.cutlist.reduce((n,r)=>n+r.count,0), 15);
});
test('unused source B consumes no material', () => {
  const p = example(); p.glueups.B.strips = [{ wood: 'bubinga', width: 500 }];
  const m = derive(p); assert.equal(m.material.some(r=>r.wood==='bubinga'), false);
  assert.equal(Object.keys(m.sources).length, 1);
});
test('offset trims common overlap, never wraps or invents strips', () => {
  const p = example('end'); p.arrangement.offset = 15;
  const m = derive(p);
  assert.equal(m.availableWidth, 265); assert.equal(m.actual.width, 265);
  assert.equal(m.targetMet, false); assert.ok(m.warnings[0].includes('15'));
  close(m.parts.reduce((n,p)=>n+area(p.polygon),0), 265*400);
  p.arrangement.offset = -15; assert.equal(derive(p).actual.width, 265);
});
test('45 degree bevel has a true parallelogram cross section and trim loss', () => {
  const g = { angle: 45, strips: [{wood:'maple',width:30},{wood:'walnut',width:30}] };
  const c = crossSection(g, 20);
  close(c.shift, 20); close(c.usable, 40);
  close(area(c.raw[0].polygon), 600);
  close(c.parts.reduce((n,p)=>n+area(p.polygon),0), 40*20);
  const opposite = crossSection({...g,angle:-45},20);
  close(opposite.usable,40); close(opposite.parts.reduce((n,p)=>n+area(p.polygon),0),800);
});
test('chevron example consists of gapless opposing bevel sections', () => {
  const p = example('chevron'), m = derive(p);
  assert.equal(m.rows.length,12); assert.equal(m.sources.A.count,6); assert.equal(m.sources.B.count,6);
  assert.equal(m.targetMet,true);
  assert.ok(m.sections.A.shift>0 && m.sections.B.shift<0);
  close(m.parts.reduce((n,p)=>n+area(p.polygon),0),280*360);
  assert.ok(m.cutlist.every(r=>r.width>r.stripWidth));
});
test('material equals sum of actual rectangular blanks', () => {
  const m = derive(example('chevron'));
  close(m.material.reduce((n,r)=>n+r.blankVolume,0),m.cutlist.reduce((n,r)=>n+r.count*r.length*r.width*r.thickness,0));
  assert.ok(m.material.every(r=>r.blankVolume>r.shapedVolume));
});
test('insufficient slice thickness is reported rather than shown as requested', () => {
  const p = example('end'); p.stock.slice=20;
  const m=derive(p); assert.equal(m.actual.thickness,18); assert.equal(m.targetMet,false);
  assert.ok(m.warnings.some(w=>w.includes('sluttjocklek')));
});
test('partial last row is clipped to desired length', () => {
  const p=example('end'); p.target.length=411;
  const m=derive(p); assert.equal(m.rows.length,17); assert.equal(m.rawLength,425);
  close(m.parts.reduce((n,p)=>n+area(p.polygon),0),411*280);
});
test('project JSON roundtrips all features and rejects malformed imports', () => {
  const p=example('chevron'); p.inlay.enabled=true; p.inlay.text='<script>åäö</script>'; p.groove.enabled=true;
  assert.deepEqual(deserialize(serialize(p)),p);
  for(const text of ['{','null','{}','{"version":99}']) assert.throws(()=>deserialize(text));
  const bad=example(); bad.glueups.A.strips[0].width=0; assert.throws(()=>serialize(bad));
  bad.glueups.A.strips[0].width=Infinity; assert.throws(()=>derive(bad));
  assert.throws(()=>deserialize(' '.repeat(150001)));
});
test('strip movement preserves widths, inventory and valid boundaries', () => {
  const strips=[{wood:'walnut',width:10},{wood:'maple',width:20}];
  moveStrip(strips,0,1); assert.equal(strips[0].wood,'maple'); assert.equal(sumWidth(strips),30);
  moveStrip(strips,0,-1); assert.equal(strips[0].wood,'maple');
});
test('invalid grooves are flagged and never affect board geometry', () => {
  const p=example(), before=derive(p); p.groove.enabled=true; p.groove.inset=180;
  const m=derive(p); assert.equal(m.grooveValid,false); assert.deepEqual(m.parts,before.parts);
});
test('polygon clipping preserves a known rectangular area', () => {
  close(area(clipPolygon(rectangle(-10,-10,40,40),{x:0,y:0,width:10,height:20})),200);
});
test('all examples satisfy requested dimensions and have complete operation lineage', () => {
  for(const e of EXAMPLES){const m=derive(example(e.id)); assert.equal(m.targetMet,true,e.id);
    const ids=new Set(); for(const op of m.operations){assert.ok(op.inputs.every(id=>ids.has(id)));ids.add(op.id);}
    assert.equal(m.operations.at(-1).type,'trim'); assert.ok(m.plan.length>=3);
  }
});
test('top planing a bevelled edge board shifts internal boundaries',()=>{
  const p=example();p.glueups.A.angle=30;
  const m=derive(p), before=m.sources.A.parts.find(p=>p.strip===1), after=m.parts.find(p=>p.strip===1);
  close(Math.min(...before.polygon.map(p=>p.x))-Math.min(...after.polygon.map(p=>p.x)), Math.tan(Math.PI/6)*p.stock.surface);
  close(m.parts.reduce((n,p)=>n+area(p.polygon),0),m.actual.width*m.actual.length);
});
test('opposed bevels and offsets preserve complete final surface across a parameter grid',()=>{
  for(const angle of [-45,-22.5,0,22.5,45])for(const offset of [-20,0,20])for(const pattern of ['same','turn','ab','ab-turn']){
    const p=example('chevron');p.glueups.A.angle=angle;p.glueups.B.angle=-angle;p.arrangement.offset=offset;p.arrangement.pattern=pattern;
    const m=derive(p);
    close(m.parts.reduce((n,p)=>n+area(p.polygon),0),m.actual.width*m.actual.length);
  }
});
