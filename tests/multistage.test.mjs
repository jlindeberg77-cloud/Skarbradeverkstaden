import test from 'node:test';
import assert from 'node:assert/strict';
import { example, derive, clone, sourceSequence, rectangle, regluePanel, area, serialize, deserialize } from '../src/model.mjs';
import { renderPreview } from '../src/preview.mjs';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} ≠ ${b}`);
const surface=parts=>parts.reduce((n,p)=>n+area(p.polygon),0);
test('four independent glue-ups allocate an uneven row count exactly',()=>{
  const p=example('four');p.target.length=325;
  const m=derive(p);
  assert.deepEqual(m.rows.map(r=>r.source),['A','B','C','D','A','B','C','D','A','B','C','D','A']);
  assert.deepEqual(Object.values(m.sources).map(s=>s.count),[4,3,3,3]);
  close(m.sources.D.length,3*(32+3.2)+20);
  assert.equal(m.cutlist.reduce((n,r)=>n+r.count,0),32);
  close(surface(m.parts),325*280);
});
test('custom repeated sequence can omit A and repeat a source',()=>{
  const p=example('four');p.arrangement.pattern='custom-turn';p.arrangement.sequence=['D','B','D','C'];
  const m=derive(p);
  assert.deepEqual(sourceSequence(p),['D','B','D','C']);
  assert.equal(m.sources.A,undefined);assert.equal(m.sources.D.count,8);
  assert.equal(m.sources.B.count,4);assert.equal(m.sources.C.count,4);
  assert.equal(m.rows[1].turn,true);
  assert.ok(m.cutlist.every(r=>r.source!=='A'));
  assert.equal(m.material.some(r=>r.wood==='walnut'),false);
  close(surface(m.parts),400*280);
  for(const view of ['finish','source','section','cut','assembly']){
    const preview=renderPreview(p,m,view,'A');assert.ok(!preview.svg.includes('NaN'));
    if(view==='cut')assert.ok(preview.description.includes('används inte'));
  }
});
test('recut removes known kerfs and offcut and conserves volume',()=>{
  const input={id:'glue2',width:100,length:80,thickness:20,parts:[{wood:'walnut',polygon:rectangle(0,0,100,80)}]};
  const step=regluePanel(input,{axis:'x',stripWidth:20,surface:1,turn:true,reverse:true},3);
  assert.equal(step.count,4);assert.equal(step.width,80);assert.equal(step.length,80);assert.equal(step.thickness,18);
  assert.equal(step.offcut,8);assert.deepEqual(step.order.map(r=>r.piece),[4,3,2,1]);
  close(surface(step.parts),80*80);
  close(input.width*input.length*input.thickness,step.width*step.length*step.thickness+step.kerfVolume+step.offcutVolume+step.surfaceVolume);
});
test('asymmetric pieces really move and turn rather than receiving a graphic filter',()=>{
  const input={id:'glue2',width:40,length:30,thickness:20,parts:[{wood:'walnut',polygon:rectangle(0,0,40,10)},{wood:'maple',polygon:rectangle(0,10,40,20)}]};
  const step=regluePanel(input,{axis:'x',stripWidth:20,surface:0,turn:true,reverse:false},0);
  const secondWalnut=step.parts.find(p=>p.wood==='walnut'&&Math.min(...p.polygon.map(q=>q.x))===20);
  assert.equal(Math.min(...secondWalnut.polygon.map(q=>q.y)),20);
  assert.equal(Math.max(...secondWalnut.polygon.map(q=>q.y)),30);
});
test('third then fourth glue-up consume prior results and preserve complete surface',()=>{
  const p=example('reglue'),m=derive(p);
  assert.equal(m.reglues.length,2);
  assert.equal(m.reglues[0].input.id,'glue2');assert.equal(m.reglues[1].input.id,'glue3');
  assert.equal(m.reglues[0].count,7);assert.equal(m.reglues[0].width,280);
  assert.equal(m.reglues[1].count,10);assert.equal(m.reglues[1].length,400);
  assert.deepEqual(m.actual,{width:260,length:360,thickness:30});
  assert.equal(m.targetMet,true);
  for(const s of m.reglues){close(surface(s.parts),s.width*s.length);close(s.input.width*s.input.length*s.input.thickness,s.width*s.length*s.thickness+s.kerfVolume+s.offcutVolume+s.surfaceVolume);}
  close(surface(m.parts),260*360);
  for(const view of ['recut3','glue3','recut4','glue4'])assert.ok(renderPreview(p,m,view).svg.includes('polygon'));
});
test('each source retains its original wood volume through stages; no new raw blanks',()=>{
  const p=example('reglue'),withStages=derive(p);p.reglue=[];const withoutStages=derive(p);
  assert.deepEqual(withStages.cutlist,withoutStages.cutlist);assert.deepEqual(withStages.material,withoutStages.material);
  assert.ok(withStages.plan.some(step=>step.title==='Limning 4'));
});
test('shortfall in length, width and thickness is reported after regluing',()=>{
  const p=example('end');p.stock.slice=32;p.reglue=[{axis:'x',stripWidth:40,surface:1,turn:true,reverse:false},{axis:'y',stripWidth:40,surface:1,turn:true,reverse:false}];
  const m=derive(p);assert.deepEqual(m.actual,{width:240,length:360,thickness:26});assert.equal(m.targetMet,false);
  assert.ok(m.warnings.some(w=>w.includes('bredd')));assert.ok(m.warnings.some(w=>w.includes('längd')));assert.ok(m.warnings.some(w=>w.includes('tjocklek')));
});
test('extra starting rows increase actual source material and restore length',()=>{
  const p=example('end');p.reglue=[{axis:'y',stripWidth:40,surface:0,turn:false,reverse:false}];
  const before=derive(p);p.stock.extraRows=2;const after=derive(p);
  assert.equal(before.actual.length,360);assert.equal(after.actual.length,400);
  assert.ok(after.sources.A.length>before.sources.A.length);
  assert.ok(after.material.reduce((n,r)=>n+r.blankVolume,0)>before.material.reduce((n,r)=>n+r.blankVolume,0));
});
test('version 1 projects migrate without changing former geometry or row sequence',()=>{
  const current=example('chevron'),old=clone(current);old.version=1;delete old.reglue;delete old.stock.extraRows;delete old.arrangement.sequence;
  const migrated=deserialize(JSON.stringify(old));
  assert.equal(migrated.version,2);assert.deepEqual(migrated.reglue,[]);assert.equal(migrated.stock.extraRows,0);
  assert.deepEqual(derive(migrated).parts,derive(current).parts);assert.deepEqual(derive(migrated).cutlist,derive(current).cutlist);
});
test('four sources and two reglues persist losslessly',()=>{
  const p=example('reglue');p.arrangement.pattern='custom';p.arrangement.sequence=['D','A','C','B','B'];
  assert.deepEqual(deserialize(serialize(p)),p);
  assert.deepEqual(derive(deserialize(serialize(p))).parts,derive(p).parts);
});
test('bad sequences, extra stages, missing sources and impossible cuts fail clearly',()=>{
  const p=example('four');p.arrangement.pattern='custom';p.arrangement.sequence=['Z'];assert.throws(()=>derive(p),/saknas/);
  p.arrangement.sequence=[];assert.throws(()=>derive(p),/positioner/);
  p.arrangement.sequence=['A'];p.stock.extraRows=.5;assert.throws(()=>derive(p),/heltal/);
  p.stock.extraRows=0;p.reglue=[{axis:'x',stripWidth:500,surface:0,turn:true,reverse:false}];assert.throws(()=>derive(p),/inget helt segment/);
  p.reglue=Array(3).fill({axis:'x',stripWidth:10,surface:0,turn:true,reverse:false});assert.throws(()=>derive(p),/Högst två/);
});
test('both recut directions on a bevelled multi-source surface remain gapless',()=>{
  for(const axis of ['x','y'])for(const turn of [true,false])for(const reverse of [true,false]){
    const p=example('chevron');p.reglue=[{axis,stripWidth:38,surface:.5,turn,reverse},{axis:axis==='x'?'y':'x',stripWidth:29,surface:.5,turn,reverse}];
    const m=derive(p);
    close(surface(m.parts),m.actual.width*m.actual.length);
    for(const s of m.reglues)close(surface(s.parts),s.width*s.length);
  }
});
test('stage controls are inactive in edge mode, and old end design survives switching',()=>{
  const p=example('reglue');p.mode='edge';const m=derive(p);
  assert.equal(m.reglues.length,0);assert.deepEqual(Object.keys(m.sources),['A']);
  p.mode='end';assert.equal(derive(p).reglues.length,2);
});
