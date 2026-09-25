// Optional integration suite. npm install --no-save playwright; npx playwright install chromium
// Or set PLAYWRIGHT_MODULE to an existing module and BROWSER_EXECUTABLE to a browser.
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const moduleName=process.env.PLAYWRIGHT_MODULE;
const { chromium }=await import(moduleName?pathToFileURL(moduleName).href:'playwright');
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
const context=await browser.newContext({viewport:{width:1440,height:1100},acceptDownloads:true});
const page=await context.newPage(), errors=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
const url=process.env.TEST_URL||'http://127.0.0.1:4173';
let checks=0;
function check(condition,label){assert.ok(condition,label);console.log(`PASS ${++checks}: ${label}`);}
async function loadExample(id){await page.locator('.examples').evaluate(e=>e.open=true);await page.locator(`[data-example="${id}"]`).click();}
try {
  await mkdir('test-results',{recursive:true});
  await page.goto(url);await page.locator('#preview svg').waitFor();
  check(await page.title().then(t=>t.includes('Skärbrädeverkstan')),'page loads with meaningful content');
  check(await page.locator('.strip-row').count()===7,'default seven strips');
  check((await page.locator('#metrics').innerText()).includes('400 × 280'),'edge dimensions');
  await page.screenshot({path:'test-results/desktop-edge.png',fullPage:true});
  await page.locator('[aria-label="Bredd stav 1"]').fill('60');
  check((await page.locator('#width-status').innerText()).includes('+10'),'live width update');
  await page.locator('[aria-label="Duplicera stav 1"]').click();
  check(await page.locator('.strip-row').count()===8,'duplicate strip');
  await page.locator('[aria-label="Träslag stav 1"]').selectOption('padouk');
  await page.locator('[aria-label="Flytta stav 1 höger"]').click();
  check(await page.locator('[aria-label="Träslag stav 2"]').inputValue()==='padouk','reorder strip');
  await page.locator('[aria-label="Ta bort stav 2"]').click();
  check(await page.locator('.strip-row').count()===7,'remove strip');
  await page.locator('#undo').click();
  check(await page.locator('.strip-row').count()===8,'undo');
  await loadExample('end');
  check((await page.locator('#row-info').innerText()).includes('16 rader'),'end grain row count');
  await page.locator('[data-path="stock.slice"]').fill('40');
  check((await page.locator('#row-info').innerText()).includes('16 rader'),'slice does not change row count');
  await page.locator('#pattern').selectOption('ab');
  await page.locator('[data-source="B"]').click();
  check((await page.locator('#source-help').innerText()).includes('grundlimning B'),'separate B editor');
  await page.locator('[data-report="cutlist"]').click();
  check((await page.locator('#report-cutlist').innerText()).includes('1 · B'),'B in cutlist');
  for(const view of ['section','source','cut','assembly','finish']){await page.locator(`[data-view="${view}"]`).click();check(await page.locator('#preview svg polygon').count()>0,`${view} has actual polygons`);}
  await loadExample('chevron');
  await page.locator('[data-path="groove.enabled"]').check();
  await page.locator('[data-path="inlay.enabled"]').check();
  await page.locator('[data-path="inlay.text"]').fill('Johan <test>');
  check(await page.locator('[data-decoration="inlay"] text').textContent()==='Johan <test>','safe literal inlay text');
  check(await page.locator('[data-decoration="groove"]').count()===1,'groove overlay');
  await page.locator('[data-path="inlay.rotation"]').fill('25');
  check((await page.locator('[data-decoration="inlay"] text').getAttribute('transform')).startsWith('rotate(25'),'inlay rotation');
  await page.screenshot({path:'test-results/desktop-chevron.png',fullPage:true});
  await page.reload();await page.locator('#preview svg').waitFor();
  check(await page.locator('[data-path="inlay.text"]').inputValue()==='Johan <test>','autosave survives reload');
  check(await page.locator('[data-mode="end"]').getAttribute('aria-pressed')==='true','mode survives reload');
  const downloadEvent=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadEvent;
  const exported=await readFile(await download.path(),'utf8');
  check(JSON.parse(exported).inlay.text==='Johan <test>','JSON export has current design');
  await page.locator('#new').click();
  check(await page.locator('#project-name').inputValue()==='Min nya skärbräda','new project');
  await page.locator('#import-file').setInputFiles({name:'design.json',mimeType:'application/json',buffer:Buffer.from(exported)});
  check(await page.locator('#project-name').inputValue()==='Sicksack i ändträ','JSON import restores project');
  await page.locator('#import-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{')});
  await page.waitForFunction(()=>document.querySelector('#project-message').textContent.includes('kunde inte öppnas'));
  check(await page.locator('#project-name').inputValue()==='Sicksack i ändträ','bad import preserves design');
  await page.locator('[data-path="target.width"]').fill('0');
  check(await page.locator('[data-path="target.width"]').getAttribute('aria-invalid')==='true','invalid numeric input flagged');
  await page.locator('#project-name').focus();
  check(await page.locator('[data-path="target.width"]').inputValue()==='280','invalid edit restores valid value on blur');
  for(const width of [768,390,320]){
    await page.setViewportSize({width,height:900});
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`no page overflow at ${width}px`);
    await page.locator('#add-strip').click();
    check((await page.locator('#width-status').innerText()).includes('320'),'mobile editing works');
    await page.locator('#undo').click();
    await page.screenshot({path:`test-results/mobile-${width}.png`,fullPage:true});
  }
  await page.setViewportSize({width:1440,height:1100});
  await page.emulateMedia({media:'print'});
  check(await page.locator('#report-cutlist').isVisible(),'print includes cutlist');
  check(await page.locator('#report-material').isVisible(),'print includes material');
  await page.emulateMedia({media:'screen'});
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
  await context.setOffline(true);await page.reload();await page.locator('#preview svg').waitFor();
  check((await page.locator('#metrics').innerText()).includes('360 × 280'),'offline reload after cache warmup');
  await context.setOffline(false);
  // Corrupt storage must not be silently overwritten.
  await page.evaluate(()=>localStorage.setItem('skarbradeverkstan.project.v1','broken'));
  await page.reload();await page.locator('#preview svg').waitFor();
  check(await page.evaluate(()=>localStorage.getItem('skarbradeverkstan.project.v1'))==='broken','corrupt storage preserved');
  check((await page.locator('#save-status').innerText()).includes('pausad'),'corrupt storage shows paused save');
  check(errors.length===0,`no JavaScript/console errors: ${errors.join('; ')}`);
  console.log(`BROWSER PASS: ${checks} checks`);
} finally {await browser.close();}
