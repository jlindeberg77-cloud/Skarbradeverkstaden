import { WOODS, EXAMPLES, SOURCE_IDS, STORAGE_KEY, sourceSequence, clone, example, derive, crossSection, sumWidth, mm, serialize, deserialize, moveStrip } from './model.mjs';
import { renderPreview, escapeHTML as esc } from './preview.mjs';
const $=id=>document.getElementById(id);
let project=example(), active='A', view='finish', report='plan', history=[], storageBlocked=false;
const getPath=(p,path)=>path.split('.').reduce((o,k)=>o[k],p);
function setPath(p,path,value){const keys=path.split('.');const last=keys.pop();keys.reduce((o,k)=>o[k],p)[last]=value;}
function message(text,error=false){$('project-message').hidden=!text;$('project-message').textContent=text;$('project-message').className=error?'error':'';}
try {
  const saved=localStorage.getItem(STORAGE_KEY);
  if(saved){project=deserialize(saved); derive(project);}
  else if(localStorage.getItem('skarbradeverkstan')) message('Ett äldre v4-projekt finns kvar i webbläsaren. Det har inte skrivits över. Det gamla dimensionsformatet kan inte importeras automatiskt.');
} catch(error){project=example();storageBlocked=true;message(`Det sparade projektet kunde inte läsas: ${error.message} Originalet har bevarats. Exportera din nya design som JSON eller välj Ny design för att börja spara igen.`,true);}
function save(){
  if(storageBlocked){$('save-status').textContent='Autosparning pausad';return;}
  try {localStorage.setItem(STORAGE_KEY,serialize(project));$('save-status').textContent='✓ Sparat på den här enheten';}
  catch { $('save-status').textContent='Kunde inte spara · exportera JSON'; }
}
function commit(next,{controls=false}={}) {
  try {derive(next);} catch(error){message(error.message,true);return false;}
  if(JSON.stringify(next)!==JSON.stringify(project)){history.push(clone(project));if(history.length>60)history.shift();project=next;}
  if(controls)renderControls();
  render();save();return true;
}
function options(selected){return Object.entries(WOODS).map(([id,w])=>`<option value="${id}" ${id===selected?'selected':''}>${w.name}</option>`).join('');}
function renderControls(){
  if(project.mode==='edge'||!project.glueups[active])active='A';
  renderSequence();renderReglueControls();
  document.querySelectorAll('[data-path]').forEach(el=>{const value=getPath(project,el.dataset.path);if(el.type==='checkbox')el.checked=value;else el.value=value;el.removeAttribute('aria-invalid');});
  $('bevel').value=project.glueups[active].angle;
  renderStrips();
}
function renderSequence(){
  $('sequence-editor').innerHTML=project.arrangement.sequence.map((key,i)=>`<div class="sequence-position"><label>Rad ${i+1}<select data-sequence="${i}" aria-label="Grundlimning position ${i+1}">${SOURCE_IDS.filter(k=>project.glueups[k]).map(k=>`<option ${key===k?'selected':''}>${k}</option>`).join('')}</select></label><button data-remove-sequence="${i}" aria-label="Ta bort position ${i+1}" ${project.arrangement.sequence.length===1?'disabled':''}>×</button></div>`).join('');
  $('add-sequence').disabled=project.arrangement.sequence.length>=16;
}
function renderReglueControls(){
  $('reglue-editor').innerHTML=project.reglue.map((step,i)=>`<div class="reglue-step"><div class="section-title"><h3>Limning ${i+3}</h3><button data-remove-reglue="${i}" ${i!==project.reglue.length-1?'disabled':''} title="Ta bort sista limningssteget först">Ta bort steg</button></div><label>Kapriktning<select data-path="reglue.${i}.axis"><option value="x">Dela bredden · längsgående remsor</option><option value="y">Dela längden · tvärgående remsor</option></select></label><div class="fields"><label>Remsmått (mm)<input data-path="reglue.${i}.stripWidth" type="number" min="5" max="500" step="0.5"></label><label>Ytmån per sida (mm)<input data-path="reglue.${i}.surface" type="number" min="0" max="5" step="0.1"></label></div><label class="toggle"><input data-path="reglue.${i}.turn" type="checkbox"><span>Vrid varannan remsa 180°</span></label><label class="toggle"><input data-path="reglue.${i}.reverse" type="checkbox"><span>Omvänd remsordning</span></label><p class="help" id="reglue-result-${i}"></p></div>`).join('');
}
function renderStrips(){
  const strips=project.glueups[active].strips;
  $('strips').innerHTML=strips.map((s,i)=>`<div class="strip-row" data-index="${i}"><span class="wood-swatch" style="--wood:${WOODS[s.wood].color}" aria-hidden="true"></span><select data-strip="wood" aria-label="Träslag stav ${i+1}">${options(s.wood)}</select><input data-strip="width" type="number" min="1" max="500" step="0.5" value="${s.width}" aria-label="Bredd stav ${i+1}"><div class="strip-tools"><button data-action="left" ${i===0?'disabled':''} aria-label="Flytta stav ${i+1} vänster" title="Flytta vänster">←</button><button data-action="right" ${i===strips.length-1?'disabled':''} aria-label="Flytta stav ${i+1} höger" title="Flytta höger">→</button><button data-action="duplicate" ${strips.length>=60?'disabled':''} aria-label="Duplicera stav ${i+1}">Duplicera</button><button class="remove" data-action="remove" ${strips.length===1?'disabled':''} aria-label="Ta bort stav ${i+1}">Ta bort</button></div></div>`).join('');
  $('strip-count').textContent=`${strips.length} stavar`;$('add-strip').disabled=strips.length>=60;
}
function render(){
  let m;
  try {m=derive(project);}catch(error){$('preview').innerHTML=`<p class="preview-error">${esc(error.message)}</p>`;return;}
  const end=project.mode==='end';
  $('end-settings').hidden=!end;$('source-tabs').hidden=!end;$('source-actions').hidden=!end;$('reglue-settings').hidden=!end;
  $('sequence-settings').hidden=!project.arrangement.pattern.startsWith('custom');
  $('source-tabs').innerHTML=SOURCE_IDS.filter(key=>project.glueups[key]).map(key=>`<button data-source="${key}" aria-pressed="${key===active}">Limning ${key}</button>`).join('');
  $('add-source').disabled=Object.keys(project.glueups).length>=4;$('remove-source').disabled=active==='A';
  $('remove-source').textContent=`Ta bort ${active}`;
  $('add-reglue').hidden=project.reglue.length===2;$('add-reglue').textContent=`＋ Lägg till limning ${project.reglue.length+3}`;
  $('extra-row-settings').hidden=!project.reglue.length&&!project.stock.extraRows;
  $('reglue-info').hidden=!m.reglues.length;
  $('reglue-info').innerHTML=m.reglues.map(step=>`Limning ${step.stage}: <b>${mm(step.length)} × ${mm(step.width)} × ${mm(step.thickness)} mm</b>`).join('<br>');
  for(const [i,step] of m.reglues.entries())if($(`reglue-result-${i}`))$(`reglue-result-${i}`).textContent=`${step.count} remsor. Sågspår totalt ${mm(step.count*step.kerf)} mm + restbit ${mm(step.offcut)} mm. Kvar ${mm(step.length)} × ${mm(step.width)} × ${mm(step.thickness)} mm.`;
  $('groove-settings').hidden=!project.groove.enabled;$('inlay-settings').hidden=!project.inlay.enabled;
  $('undo').disabled=!history.length;
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===project.mode));
  document.querySelectorAll('[data-source]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.source===active));
  $('source-help').textContent=end?`Redigerar grundlimning ${active}. ${m.sources[active]?`${m.sources[active].count} rader hämtas härifrån; källängden räknas separat.`:'Används inte i radföljden och räknas inte i materialbehovet.'}`:'Ordningen följer stavarna tvärs över brädans bredd.';
  const section=crossSection(project.glueups[active],end?project.stock.thickness:project.target.thickness+2*project.stock.surface);
  const total=sumWidth(project.glueups[active].strips),diff=total-project.target.width;
  $('width-status').className=`width-status ${Math.abs(diff)>.01?'bad':''}`;
  $('width-status').innerHTML=`<b>${mm(total)} mm</b> total stavbredd / mål ${mm(project.target.width)} mm<br>${Math.abs(diff)<.01?'✓ Stavbredderna stämmer med målet.':`${diff>0?'+':''}${mm(diff)} mm mot önskad slutbredd.`}${section.shift?`<br>Efter rätning: <b>${mm(section.usable)} mm</b>.`:''}`;
  $('bevel-info').textContent=`Fasningens sidoförskjutning: ${mm(Math.abs(section.shift))} mm. Kaplistan lägger till samma bredd på varje råstav. Ytterkanternas trimning minskar limningens bredd med ${mm(Math.abs(section.shift))} mm.`;
  $('row-info').innerHTML=`<b>${m.rows.length} rader × ${mm(project.stock.thickness)} mm</b> = ${mm(m.rawLength)} mm i limning 2.<br>Följd: ${sourceSequence(project).join(' → ')}${project.stock.extraRows?` · ${project.stock.extraRows} extra rader`:''}.<br>Tvärkap ${mm(project.stock.slice)} − 2 × ${mm(project.stock.surface)} slutlig ytmån = ${mm(project.stock.slice-2*project.stock.surface)} mm${m.reglues.length?' före omlimningarnas extra ytmån':' tillgänglig tjocklek'}.`;
  const views=end?[['finish','Färdig bräda'],['section','Stavtvärsnitt'],['source','Limning 1'],['cut','Tvärkapning'],['assembly','Limning 2']]:[['finish','Färdig bräda'],['section','Stavtvärsnitt'],['source','Limning 1']];
  for(const step of m.reglues)views.push([`recut${step.stage}`,`Kapning ${step.stage}`],[step.id,`Limning ${step.stage}`]);
  if(!views.some(([id])=>id===view))view='finish';
  $('view-tabs').innerHTML=views.map(([id,title])=>`<button data-view="${id}" aria-pressed="${view===id}">${title}</button>`).join('');
  const preview=renderPreview(project,m,view,active);
  $('preview').innerHTML=preview.svg;$('preview-title').textContent=preview.title;$('view-description').textContent=preview.description;
  $('mode-badge').textContent=end?'Ändträ · End grain':'Längsgående · Edge grain';
  $('metrics').innerHTML=`<div class="metric"><small>${m.targetMet?'Färdig bräda':'Möjliga slutmått'}</small><strong>${mm(m.actual.length)} × ${mm(m.actual.width)}</strong><span>mm</span></div><div class="metric"><small>Färdig tjocklek</small><strong>${mm(m.actual.thickness)}</strong><span>mm</span></div><div class="metric"><small>${end?'Rader / grundlimningar':'Stavar / grundlimningar'}</small><strong>${end?m.rows.length:project.glueups.A.strips.length} / ${Object.keys(m.sources).length}</strong></div>`;
  $('warnings').innerHTML=m.warnings.map(w=>`<p class="warning">${esc(w)}</p>`).join('');
  renderReports(m);
}
function woodName(id){return `<span class="wood-dot" style="background:${WOODS[id].color}"></span>${WOODS[id].name}`;}
function renderReports(m){
  document.querySelectorAll('[data-report]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.report===report));
  for(const id of ['plan','cutlist','material'])$('report-'+id).hidden=id!==report;
  $('report-plan').innerHTML=`<ol class="plan">${m.plan.map((step,i)=>`<li><span class="plan-number">${i+1}</span><div><h3>${esc(step.title)}</h3><p>${esc(step.text)}</p></div></li>`).join('')}</ol>`;
  $('report-cutlist').innerHTML=`<h3>Råämnen till första limningen</h3><p class="report-caption">L × B × T i mm. Rektangulära ämnen av riktat virke, före eventuell fasning. Identiska stavar är grupperade inom respektive grundlimning.</p><div class="table-wrap"><table><thead><tr><th scope="col">Limning</th><th scope="col">Träslag</th><th scope="col">Antal</th><th scope="col">Längd</th><th scope="col">Bredd</th><th scope="col">Tjocklek</th><th scope="col">Fasvinkel</th></tr></thead><tbody>${m.cutlist.map(r=>`<tr><td>1 · ${r.source}</td><td>${woodName(r.wood)}</td><td>${r.count}</td><td>${mm(r.length)}</td><td>${mm(r.width)}</td><td>${mm(r.thickness)}</td><td>${mm(r.angle)}°</td></tr>`).join('')}</tbody></table></div>${project.mode==='end'?`<h3 style="margin-top:22px">Tvärkapning till andra limningen</h3><p class="report-caption">Varje segment innehåller hela grundlimningens träkombination. Mått nedan gäller före vältning och slutplaning.</p><div class="table-wrap"><table><thead><tr><th>Källa</th><th>Antal</th><th>Tvärkapmått</th><th>Bredd</th><th>Tjocklek</th><th>Kap mot fiber</th></tr></thead><tbody>${Object.entries(m.sources).map(([key,s])=>`<tr><td>${key}</td><td>${s.count}</td><td>${mm(project.stock.slice)}</td><td>${mm(s.width)}</td><td>${mm(project.stock.thickness)}</td><td>90°</td></tr>`).join('')}</tbody></table></div>`:''}<p class="report-caption">Vinkel = fasning från lodrät långsida, inte gering. Runda råämnen uppåt i verkstaden. Lägg till marginal för din såg, riktning och virkesfel.</p>`;
  const volume=m.material.reduce((n,r)=>n+r.blankVolume,0);
  if(m.reglues.length)$('report-cutlist').insertAdjacentHTML('beforeend',`<h3>Omlimning av befintlig skiva</h3><p class="report-caption">Dessa delar kapas ur tidigare limning, inte ur nytt virke. Samtliga består av de träslag som redan finns i skivan. L × B × T före varje omlimnings planing, i mm.</p><div class="table-wrap"><table><thead><tr><th>Steg</th><th>Källa</th><th>Antal</th><th>Längd</th><th>Bredd</th><th>Tjocklek</th></tr></thead><tbody>${m.reglues.map(step=>`<tr><td>Limning ${step.stage}</td><td>Limning ${step.stage-1}</td><td>${step.count}</td><td>${mm(step.segmentLength)}</td><td>${mm(step.segmentWidth)}</td><td>${mm(step.input.thickness)}</td></tr>`).join('')}</tbody></table></div><p class="report-caption">Alla kap är vinkelräta genom skivan. Se arbetsplanen för remsordning, 180° vridning, sågspår och restbitar.</p>`);
  $('report-material').innerHTML=`<h3>Material per träslag</h3><p class="report-caption">Volym av de rektangulära råämnena i kaplistan. 1 liter = 1 000 000 mm³.</p><div class="table-wrap"><table><thead><tr><th>Träslag</th><th>Stavar</th><th>Ämnesvolym</th><th>Varav fasningsspill</th></tr></thead><tbody>${m.material.map(r=>`<tr><td>${woodName(r.wood)}</td><td>${r.count}</td><td>${mm(r.blankVolume/1e6)} l</td><td>${mm((r.blankVolume-r.shapedVolume)/1e6)} l</td></tr>`).join('')}</tbody></table></div><div class="material-total"><strong>≈ ${mm(volume/1e6)} l</strong> riktade ämnen totalt</div><p class="report-caption">Beräkning: antal × längd × bredd × tjocklek, summerat per träslag. Inkluderar definierade tvärsågspår, ändmån, ytmån och fasningsspill. Ytterkantstrimning och radtrimning ingår i ämnesvolymen. Exkluderar längsgående sågspår mellan råämnen, råvirkets riktningsmån, defekter, lim och inlaymaterial. Detta är ett ämnesbehov, inte en färdig inköpsvolym.</p>`;
  if(m.reglues.length)$('report-material').insertAdjacentHTML('beforeend',`<h3>Spill vid omlimning</h3><p class="report-caption">Ingår redan i råämnena ovan, lägg inte till en gång till.</p><div class="table-wrap"><table><thead><tr><th>Steg</th><th>Sågspår</th><th>Restbit</th><th>Planing</th></tr></thead><tbody>${m.reglues.map(step=>`<tr><td>Limning ${step.stage}</td><td>${mm(step.kerfVolume/1e6)} l</td><td>${mm(step.offcutVolume/1e6)} l</td><td>${mm(step.surfaceVolume/1e6)} l</td></tr>`).join('')}</tbody></table></div>`);
}
$('inlay-wood').innerHTML=options(project.inlay.wood);
$('examples').innerHTML=EXAMPLES.map(e=>`<button class="example-card" data-example="${e.id}"><span class="example-art" aria-hidden="true"></span><span><strong>${e.name}</strong><small>${e.description}</small></span></button>`).join('');
document.addEventListener('input',event=>{
  const el=event.target;
  if(!el.matches('[data-path], [data-strip], #bevel'))return;
  const next=clone(project);
  if(el.type==='number'&&(el.value===''||!Number.isFinite(el.valueAsNumber))){el.setAttribute('aria-invalid','true');$('save-status').textContent='Ofullständigt mått · senast giltiga design visas';return;}
  const value=el.type==='checkbox'?el.checked:el.type==='number'?el.valueAsNumber:el.value;
  if(el.dataset.path){
    if(el.dataset.path==='arrangement.pattern'&&value.startsWith('custom'))next.arrangement.sequence=clone(sourceSequence(project));
    setPath(next,el.dataset.path,value);
    if(el.dataset.path==='arrangement.pattern')for(const key of sourceSequence(next))next.glueups[key]??=clone(next.glueups.A);
  }
  else if(el.dataset.strip)next.glueups[active].strips[Number(el.closest('[data-index]').dataset.index)][el.dataset.strip]=value;
  else next.glueups[active].angle=value;
  const controls=el.dataset.path==='arrangement.pattern';
  if(commit(next,{controls})){el.removeAttribute('aria-invalid');if(el.dataset.strip==='wood')el.closest('.strip-row').querySelector('.wood-swatch').style.setProperty('--wood',WOODS[value].color);message('');}
  else {el.setAttribute('aria-invalid','true');$('save-status').textContent='Ogiltigt värde · senast giltiga design visas';}
});
document.addEventListener('focusout',event=>{
  const el=event.target;if(el.getAttribute?.('aria-invalid')!=='true')return;
  if(el.dataset.path)el.value=getPath(project,el.dataset.path);
  else if(el.dataset.strip)el.value=project.glueups[active].strips[Number(el.closest('[data-index]').dataset.index)][el.dataset.strip];
  else if(el.id==='bevel')el.value=project.glueups[active].angle;
  el.removeAttribute('aria-invalid');save();
});
document.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.dataset.mode){const next=clone(project);next.mode=b.dataset.mode;const previous=active;active='A';view='finish';if(!commit(next,{controls:true})){active=previous;renderControls();render();}}
  if(b.dataset.source){active=b.dataset.source;renderControls();render();}
  if(b.dataset.view){view=b.dataset.view;render();}
  if(b.dataset.report){report=b.dataset.report;render();}
  if(b.dataset.removeSequence!==undefined){const next=clone(project);next.arrangement.sequence.splice(Number(b.dataset.removeSequence),1);commit(next,{controls:true});}
  if(b.dataset.removeReglue!==undefined){const next=clone(project);next.reglue.splice(Number(b.dataset.removeReglue));commit(next,{controls:true});}
  if(b.dataset.action){
    const next=clone(project),a=next.glueups[active].strips,i=Number(b.closest('[data-index]').dataset.index);
    if(b.dataset.action==='duplicate'&&a.length<60)a.splice(i+1,0,clone(a[i]));
    if(b.dataset.action==='remove'&&a.length>1)a.splice(i,1);
    if(b.dataset.action==='left')moveStrip(a,i,-1);
    if(b.dataset.action==='right')moveStrip(a,i,1);
    commit(next,{controls:true});
  }
  if(b.dataset.example){active='A';view='finish';commit(example(b.dataset.example),{controls:true});message('Exemplet är laddat och kan redigeras fritt. Ångra återställer din tidigare design.');}
});
document.addEventListener('change',event=>{
  const el=event.target;if(el.dataset.sequence===undefined)return;
  const next=clone(project);next.arrangement.sequence[Number(el.dataset.sequence)]=el.value;commit(next);
});
$('add-sequence').addEventListener('click',()=>{if(project.arrangement.sequence.length>=16)return;const next=clone(project);next.arrangement.sequence.push(active);commit(next,{controls:true});});
$('add-source').addEventListener('click',()=>{
  const key=SOURCE_IDS.find(key=>!project.glueups[key]);if(!key)return;
  const next=clone(project);next.glueups[key]=clone(project.glueups[active]);active=key;
  if(commit(next,{controls:true}))message(`Grundlimning ${key} skapad som kopia. Välj ${key} i radföljden när den ska användas.`);
});
$('remove-source').addEventListener('click',()=>{
  if(active==='A')return;
  const next=clone(project),sequence=sourceSequence(next).filter(key=>key!==active);
  next.arrangement.sequence=sequence.length?sequence:['A'];next.arrangement.pattern=next.arrangement.pattern.includes('turn')?'custom-turn':'custom';
  const previous=active;delete next.glueups[active];active='A';if(!commit(next,{controls:true})){active=previous;renderControls();render();}
});
$('add-reglue').addEventListener('click',()=>{
  if(project.reglue.length>=2)return;
  const next=clone(project),m=derive(project),axis=next.reglue.length?'y':'x';
  const board=m.reglues.at(-1)||{width:m.availableWidth,length:m.rawLength};
  const extent=axis==='x'?board.width:board.length;
  next.reglue.push({axis,stripWidth:Math.max(5,Math.min(40,Math.floor(extent/2-project.stock.kerf))),surface:.5,turn:true,reverse:false});
  commit(next,{controls:true});
});
$('add-strip').addEventListener('click',()=>{const next=clone(project);if(next.glueups[active].strips.length>=60)return;next.glueups[active].strips.push({wood:'walnut',width:20});commit(next,{controls:true});});
$('undo').addEventListener('click',()=>{if(!history.length)return;project=history.pop();renderControls();render();save();message('Föregående design återställd.');});
$('new').addEventListener('click',()=>{const next=example();next.name='Min nya skärbräda';storageBlocked=false;active='A';view='finish';commit(next,{controls:true});message('Ny design skapad. Ångra tar dig tillbaka till den föregående.');});
$('export').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([serialize(project)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=(project.name.replace(/[^\p{L}\p{N} _-]/gu,'').trim()||'skarbrada')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('import').addEventListener('click',()=>$('import-file').click());
$('import-file').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  try {if(file.size>150000)throw new Error('Projektfilen är för stor.');const next=deserialize(await file.text());derive(next);storageBlocked=false;active='A';view='finish';commit(next,{controls:true});message('Projektet har öppnats. Din tidigare design kan återställas med Ångra.');}
  catch(error){message(`Projektet kunde inte öppnas: ${error.message} Din design är oförändrad.`,true);}
  event.target.value='';
});
$('print').addEventListener('click',()=>{view='finish';render();window.print();});
renderControls();render();
// Do not overwrite malformed or legacy storage during initialisation.
$('save-status').textContent=storageBlocked?'Autosparning pausad':'✓ Lokal autosparning aktiv';
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{ /* Network-only remains fully functional. */ });
