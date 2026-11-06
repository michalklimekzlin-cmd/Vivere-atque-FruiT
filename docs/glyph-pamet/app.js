import {CORES,FORMAT,LETTERS,now,uid,clone,unique,glyphsOf,normalRecord,identity,parseSignal,mergeRecords,fromCoreMemory,importObject,contextPack,emptyCoreMemory,insertCore} from './model.js';
import * as db from './storage.js';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state={records:[],trash:[],links:[]},activeCore='all',tab='memory',selected=new Set(),noticeTimer,packing,loading=false,pendingImport=null;
const EXTERNAL_KEYS=['cht360_pamet_v1','vaft_pamet_v1','cht360_pamet_snapshots_v1','cht360_batole_v1','cht360_batole_rust_v1','cht360_mluva_history_v1','cht360_mluva_lessons_v1','cht360_glyph_workshop_v1','cht360_slot_locks_v1','cht360_bubinky_values_v1','cht360_vafit_preview_pamet_v1','cht360_vafit_preview_batole_lekce'];
const date=value=>{const d=new Date(value);return Number.isFinite(+d)?d.toLocaleDateString('cs-CZ',{day:'numeric',month:'short',year:'numeric'}):'bez data';};
function note(text,error=false){const host=document.querySelector('dialog[open]')||document.body;host.append($('notice'));$('notice').textContent=text;$('notice').hidden=false;$('notice').classList.toggle('error',error);clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').hidden=true,11000);}
function action(fn){return async e=>{try{await fn(e);}catch(err){note(err.message||String(err),true);}};}
function parentApi(){try{return window.parent!==window&&window.parent.location.origin===location.origin?window.parent:null;}catch{return null;}}
function externalState(){return Object.fromEntries(EXTERNAL_KEYS.map(k=>[k,localStorage.getItem(k)]).filter(([,v])=>v!==null));}
function coreMemory(){
  const p=parentApi();if(p?.CHT360GlyphCoreBridge)return p.CHT360GlyphCoreBridge.read();
  for(const key of ['cht360_pamet_v1','vaft_pamet_v1']){
    const raw=localStorage.getItem(key);if(raw){const value=JSON.parse(raw);if(!value?.cores)throw Error('Paměť CHT nemá rozpoznatelná jádra.');return value;}
  }
  return emptyCoreMemory();
}
function filtered(){const q=$('search').value.trim().toLocaleLowerCase('cs'),glyph=$('glyph-filter').value.trim().normalize('NFC');return state.records.filter(r=>(activeCore==='all'||r.core===activeCore)&&(!glyph||r.glyphs.includes(glyph))&&(!q||[r.title,r.body,r.source,...r.tags,...r.glyphs].join('\n').toLocaleLowerCase('cs').includes(q))).sort((a,b)=>Number(b.pinned)-Number(a.pinned)||String(b.updatedAt).localeCompare(String(a.updatedAt)));}
function renderCores(){
  let memory;try{memory=coreMemory();}catch{memory=null;}
  const icons={game:'7',control:'°&',earth:'𞋒',language:'i'};
  $('cores').innerHTML=Object.entries(CORES).map(([id,label])=>{
    const slots=memory?.cores?.[id],used=Array.isArray(slots)?slots.filter((s,i)=>s&&(s.content||s.name&&s.name!==`Slot ${i+1}`)).length:0;
    return `<button class="core-button ${activeCore===id?'active':''}" data-core="${id}" aria-pressed="${activeCore===id}"><span class="core-orb">${icons[id]}</span><span class="core-info"><strong>${label}</strong><small>${used} / 70 slotů</small></span><span class="counter">${state.records.filter(r=>r.core===id).length}</span></button>`;
  }).join('');
}
function renderLetters(){
  const marks=unique([...LETTERS,...state.records.flatMap(r=>r.glyphs)]),current=$('glyph-filter').value;
  $('alphabet').innerHTML=marks.map(mark=>`<button class="${current===mark?'active':''}" data-glyph="${esc(mark)}" aria-label="Znak ${esc(mark)}" aria-pressed="${current===mark}">${esc(mark)}</button>`).join('');
}
function renderCards(){
  const list=filtered();$('record-count').textContent=state.records.length;
  $('list-heading').textContent=`${activeCore==='all'?'Všechny vzpomínky':CORES[activeCore]} · ${list.length}${selected.size?' · vybráno '+selected.size:''}`;
  $('records').innerHTML=list.length?list.map(r=>`<article class="stone ${selected.has(r.id)?'selected':''}"><div class="stone-top"><span class="stone-glyph">${esc(r.glyphs.join(' · ')||'◌')}</span><label><input type="checkbox" data-select="${esc(r.id)}" ${selected.has(r.id)?'checked':''} aria-label="Vybrat ${esc(r.title)}"></label></div><span class="stone-kind">${esc(CORES[r.core])}${r.conflictOf?' · DALŠÍ VERZE':''}</span><button class="stone-title" data-edit="${esc(r.id)}">${esc(r.title)}</button><p class="stone-body">${esc(r.body.slice(0,210))}${r.body.length>210?'…':''}</p><div class="stone-meta"><span>${esc(r.source)}</span><span>${esc(date(r.updatedAt))}</span></div><div class="stone-actions"><button class="quiet" data-pin="${esc(r.id)}" aria-pressed="${r.pinned}">${r.pinned?'◆ Připnuto':'◇ Připnout'}</button><button class="quiet danger" data-trash="${esc(r.id)}">Do koše</button></div></article>`).join(''):`<div class="empty"><div class="empty-glyph">⟦ i ⟧</div><h2>${state.records.length?'Tady je zatím volno.':'První stopa patří nám.'}</h2><p>${state.records.length?'Zkus jiné písmenko nebo zobraz celou paměť.':'Vlož zprávu z chatu, připoj písmenko a uchovej první vzpomínku.'}</p><button class="primary" id="empty-create">＋ Přidat vzpomínku</button></div>`;
  $('empty-create')?.addEventListener('click',()=>openEditor());
}
async function renderBackup(){
  $('trash-count').textContent=state.trash.length;
  $('trash').innerHTML=state.trash.length?state.trash.map(r=>`<div class="trash-row"><span>${esc(r.title)}</span><button class="quiet" data-restore="${esc(r.id)}">Obnovit</button></div>`).join(''):'<p class="muted">Koš je prázdný.</p>';
  const history=await db.history();
  $('history').innerHTML=history.slice().sort((a,b)=>b.at.localeCompare(a.at)).slice(0,12).map(h=>`<div class="history-row"><span>${esc(h.reason)}<small>${esc(date(h.at))}</small></span>${h.before?.records?`<button class="quiet" data-recover="${esc(h.id)}">Přidat ze snímku</button>`:''}</div>`).join('')||'<p class="muted">Historie vznikne při prvním uložení.</p>';
  const ids=new Set(state.records.map(r=>r.id));
  const repeated=state.records.length-ids.size;
  $('health').textContent=`${state.records.length} vzpomínek · ${state.trash.length} v koši · ${history.length} snímků · ${state.links.length} vazeb. ${repeated?'Nalezena opakovaná ID: '+repeated+'.':'ID záznamů jsou jedinečná.'} Úložiště: ${db.storageMode()}.`;
}
function renderPack(){
  packing=contextPack(state.records,{budget:$('pack-budget').value,query:$('pack-query').value,core:$('pack-core').value,includeIds:$('pack-selected').checked?[...selected]:null});
  $('pack-text').value=packing.text;$('pack-summary').textContent=`${packing.used} záznamů · ${packing.chars} znaků · vynecháno ${packing.omitted}${packing.shortened?' · částečně vypsáno '+packing.shortened:''}`;
}
async function reload(){state=await db.read();selected=new Set([...selected].filter(id=>state.records.some(r=>r.id===id)));renderCores();renderLetters();renderCards();$('storage-mode').textContent=`${db.storageMode()} · ${state.records.length} vzpomínek`;if(tab==='backup')await renderBackup();if(tab==='output')renderPack();}
function setTab(next){tab=next;for(const n of ['memory','signal','output','backup'])$(n+'-view').hidden=n!==next;document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-current',b.dataset.tab===next?'page':'false'));if(next==='output')renderPack();if(next==='backup')void renderBackup().catch(e=>note(e.message,true));}
function openEditor(id){
  const r=state.records.find(x=>x.id===id);$('edit-id').value=r?.id||'';$('editor-heading').textContent=r?'Upravit vzpomínku':'Nová vzpomínka';
  $('edit-title').value=r?.title||'';$('edit-body').value=r?.body||'';$('edit-core').value=r?.core||(activeCore==='all'?'language':activeCore);
  if(r?.source&&![...$('edit-source').options].some(o=>o.value===r.source))$('edit-source').add(new Option(r.source,r.source));
  $('edit-source').value=r?.source||'user';$('edit-glyphs').value=r?.glyphs.join(', ')||$('glyph-filter').value;$('edit-tags').value=r?.tags.join(', ')||'';
  $('to-core').disabled=!r;$('teach').disabled=!r;
  const links=r?state.links.filter(l=>l.a===r.id||l.b===r.id).map(l=>state.records.find(x=>x.id===(l.a===r.id?l.b:l.a))).filter(Boolean):[];
  $('linked-records').innerHTML=links.length?'Propojené vzpomínky:'+links.map(x=>`<button type="button" class="quiet" data-edit="${esc(x.id)}">${esc(x.title)}</button>`).join(''):'';
  if(!$('editor').open)$('editor').showModal();
}
async function saveEditor(e){
  e.preventDefault();const id=$('edit-id').value;const r=state.records.find(x=>x.id===id);
  const next=normalRecord({...r,id:id||uid(),title:$('edit-title').value.trim(),body:$('edit-body').value,core:$('edit-core').value,source:$('edit-source').value,glyphs:$('edit-glyphs').value,tags:$('edit-tags').value.split(',').map(x=>x.trim()).filter(Boolean),updatedAt:now()});
  await db.change(r?'úprava vzpomínky':'nová vzpomínka',s=>{
    const index=s.records.findIndex(x=>x.id===next.id);
    if(r&&index>=0&&identity(s.records[index])!==identity(r)){next.id=uid();next.conflictOf=r.id;s.records.push(next);return;}
    if(r&&index<0){next.id=uid();next.conflictOf=r.id;s.records.push(next);return;}
    if(index>=0)s.records[index]=next;else s.records.push(next);
  });
  $('editor').close();await reload();note('Vzpomínka je uložená. Předchozí stav je v historii.');
}
async function receive(){
  const text=$('signal-text').value,defaults={source:$('signal-source').value,core:$('signal-core').value,glyphs:glyphsOf($('signal-glyphs').value)};
  if(!text.trim())throw Error('Nejdřív vlož text.');
  let records=parseSignal(text,defaults);if(!records.length)records=[normalRecord({body:text},defaults)];
  const result=await db.change('příjem GLYPH',s=>mergeRecords(s,records));
  await reload();note(`Uloženo ${result.added} vzpomínek, shodných ${result.skipped}.`);if(result.added)$('signal-text').value='';
}
async function copy(text,title='Text k přenesení'){
  try{await navigator.clipboard.writeText(text);note('Text je ve schránce.');}
  catch{$('text-title').textContent=title;$('copy-fallback').value=text;$('text-dialog').showModal();$('copy-fallback').focus();$('copy-fallback').select();note('Podrž text a zvol Kopírovat.');}
}
function download(name,value,type='application/json;charset=utf-8'){
  const url=URL.createObjectURL(new Blob([typeof value==='string'?value:JSON.stringify(value,null,2)],{type}));
  const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
async function previewImport(data,label){
  const trial=clone(state),result=mergeRecords(trial,data.records||[],data.links||[],data.trash||[]);
  pendingImport={data,label};
  let dialog=$('import-review');if(!dialog){dialog=document.createElement('dialog');dialog.id='import-review';dialog.innerHTML='<p class="eyebrow">PŘIDAT A UCHOVAT</p><h2>Sloučit paměť</h2><p id="import-summary"></p><div class="actions"><button id="confirm-import" class="primary">Přidat do komory</button><button id="cancel-import" class="quiet">Zrušit</button></div>';document.body.append(dialog);$('confirm-import').onclick=action(confirmImport);$('cancel-import').onclick=()=>dialog.close();}
  $('import-summary').textContent=`${label}: přibyde ${result.added} záznamů, přeskočí se ${result.skipped} přesných shod, ${result.conflicts} rozdílných verzí bude uchováno vedle původních. Importované klíče CHT se uchovají ve snímku a jejich sloty lze přidat do komory.`;
  dialog.showModal();
}
async function confirmImport(){
  if(!pendingImport)return;const {data,label}=pendingImport;$('confirm-import').disabled=true;
  try{
    const result=await db.change('import: '+label,s=>mergeRecords(s,data.records||[],data.links||[],data.trash||[]),{history:data.history||[],external:{current:externalState(),imported:data.extras||{}}});
    $('import-review').close();pendingImport=null;await reload();note(`Přidáno ${result.added}, shodných ${result.skipped}, dalších verzí ${result.conflicts}.`);
  }finally{$('confirm-import').disabled=false;}
}
async function readFile(file){
  if(!file)return;if(file.size>50*1024*1024)throw Error('Soubor přesahuje 50 MB. Rozděl export na menší části.');
  const defaults={core:$('signal-core').value,source:$('signal-source').value,glyphs:glyphsOf($('signal-glyphs').value)};
  let data;
  if(/\.zip$/i.test(file.name)){
    if(!window.JSZip)throw Error('Čtečka ZIP se nenačetla. Zkus obnovit stránku.');
    const zip=await window.JSZip.loadAsync(await file.arrayBuffer()),names=Object.keys(zip.files).filter(n=>!zip.files[n].dir&&/(^|\/)conversations[^/]*\.json$/i.test(n)).sort();
    if(!names.length)throw Error('V ZIPu není export conversations.json z ChatGPT.');
    const records=[];
    for(const name of names){const entry=zip.file(name);if(entry._data?.uncompressedSize>64*1024*1024)throw Error('Konverzační soubor v ZIPu je příliš velký.');const text=await entry.async('string');if(text.length>64*1024*1024)throw Error('Konverzační soubor je příliš velký.');records.push(...importObject(JSON.parse(text),defaults).records);}
    data={records,links:[],trash:[]};
  }else if(/\.json$/i.test(file.name)){data=importObject(JSON.parse(await file.text()),defaults);}
  else{const text=await file.text();const records=parseSignal(text,defaults);data={records:records.length?records:[normalRecord({title:file.name,body:text},defaults)],links:[],trash:[]};}
  // Every external slot is retained as a record as well as in the raw checkpoint.
  if(data.extras){for(const [key,raw] of Object.entries(data.extras)){if(typeof raw==='string'&&['cht360_pamet_v1','vaft_pamet_v1'].includes(key)){const records=fromCoreMemory(JSON.parse(raw),'CHT');if(records)data.records.push(...records.filter(r=>!data.records.some(existing=>existing.id===r.glyphMemoryId&&existing.body===r.body)));}}}
  await previewImport(data,file.name);
}
async function importCHT(){
  const records=[];
  for(const key of ['cht360_pamet_v1','vaft_pamet_v1']){const raw=localStorage.getItem(key);if(raw){const added=fromCoreMemory(JSON.parse(raw),'CHT');if(added)records.push(...added);}}
  const live=fromCoreMemory(coreMemory(),'CHT');if(live)records.push(...live);
  const previous=await readOldDatabase('CHT360-VaFiT-Expansion','records',true);for(const r of previous)records.push(normalRecord(r,{origin:'import'}));
  if(!records.length)throw Error('Na této adrese zatím není uložená paměť CHT ani předchozí VaFiT.');
  await previewImport({records,trash:[],links:[],extras:externalState()},'dostupná paměť CHT');
}
async function readOldDatabase(name,store,optional=false){
  if(!window.indexedDB){if(optional)return [];throw Error('Prohlížeč nepovolil IndexedDB.');}
  if(indexedDB.databases){const dbs=await indexedDB.databases();if(!dbs.some(d=>d.name===name)){if(optional)return [];throw Error('Původní GLYPH na této adrese není. Z Grokovy adresy přenes jeho JSON export přes Importovat.');}}
  return new Promise((resolve,reject)=>{
    const r=indexedDB.open(name);r.onupgradeneeded=()=>{r.transaction.abort();};
    r.onerror=()=>optional?resolve([]):reject(Error('Původní databáze na této adrese není dostupná. Použij export souboru.'));
    r.onsuccess=()=>{const old=r.result;if(!old.objectStoreNames.contains(store)){old.close();resolve([]);return;}const tx=old.transaction(store),q=tx.objectStore(store).getAll();q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);tx.oncomplete=()=>old.close();};
  });
}
async function importGrok(){
  const records=await readOldDatabase('glyph-vault','memories');
  const links=await readOldDatabase('glyph-vault','links',true);
  await previewImport({records:records.map(r=>normalRecord(r)),links,trash:[]},'původní místní GLYPH');
}
async function toCore(){
  const record=state.records.find(r=>r.id===$('edit-id').value);if(!record)throw Error('Nejdřív vzpomínku ulož.');
  if($('edit-body').value!==record.body||$('edit-title').value!==record.title||$('edit-glyphs').value!==record.glyphs.join(', ')||$('edit-core').value!==record.core)throw Error('Nejdřív ulož úpravy vzpomínky.');
  const run=async()=>{
    parentApi()?.CHT360GlyphCoreBridge?.flush();
    const before=externalState(),current=coreMemory(),result=insertCore(current,record);
    if(result.duplicate){note(`Tato vzpomínka už je ve slotu ${result.index+1}.`);return;}
    await db.checkpoint('před zápisem do jádra',{keys:before,live:current,recordId:record.id});
    if(JSON.stringify(before)!==JSON.stringify(externalState()))throw Error('Paměť CHT se mezitím změnila. Zkus zápis znovu.');
    const raw=JSON.stringify(result.memory),keys=['cht360_pamet_v1','vaft_pamet_v1'];
    try{
      for(const key of keys)localStorage.setItem(key,raw);
      for(const key of keys)if(localStorage.getItem(key)!==raw)throw Error('Zápis se nepodařilo ověřit.');
    }catch(err){for(const key of keys){try{if(before[key]===undefined)localStorage.removeItem(key);else localStorage.setItem(key,before[key]);}catch{}}throw err;}
    parentApi()?.CHT360GlyphCoreBridge?.refresh(result.memory);
    await db.checkpoint('po zápisu do jádra',{keys:externalState(),recordId:record.id,slot:result.index+1});
    window.dispatchEvent(new CustomEvent('cht.memory.changed',{detail:{coreId:record.core,slotId:result.index+1,origin:'glyph-pamet'}}));
    renderCores();note(`Uloženo do ${CORES[record.core]}, slot ${result.index+1}.`);
  };
  if(navigator.locks?.request)await navigator.locks.request('cht360-core-memory-write',run);else await run();
}
async function teach(){
  const record=state.records.find(r=>r.id===$('edit-id').value);if(!record)throw Error('Nejdřív vzpomínku ulož.');
  const p=parentApi(),batole=p?.CHTBatole;
  if(!batole?.remember)throw Error('Otevři GLYPH tlačítkem v hlavním CHT. Tam je připojené Batole.');
  if(record.body.length>1100)throw Error('Pro jednu lekci Batolete vyber kratší vzpomínku do 1100 znaků. Úplný text zůstává v komoře.');
  await db.checkpoint('před lekcí Batolete',{keys:externalState(),recordId:record.id});
  const glyph={game:'play',control:'ai',earth:'path',language:'create'}[record.core],before=localStorage.getItem('cht360_batole_v1');
  if(!batole.remember(glyph,record.body,'GLYPH lekce',{source:record.source,recordId:record.id,glyphs:record.glyphs}))throw Error('Batole lekci nepřijalo.');
  if(localStorage.getItem('cht360_batole_v1')===before)throw Error('Lekce je v běžícím Batolěti, ale zápis na zařízení se nepotvrdil. Vyexportuj zálohu.');
  await db.checkpoint('po lekci Batolete',{keys:externalState(),recordId:record.id});note('Batole má uloženou novou lekci.');
}
function instructions(){return 'Když spolu určíme informaci k uchování, přidej blok:\n⟦GLYPH:chatgpt|Krátký název|jadro:jazyk,pismeno:O⟧\nText vzpomínky. Rozlišuj ověřené skutečnosti a tvořivé možnosti.\n⟦/GLYPH⟧\nZdroj může být grok nebo chatgpt. Jádro: hra, řízení, země, jazyk. Písmenko zachovej přesně včetně velikosti. Uživatel blok přenese do komory GLYPH; netvrď, že samotné vypsání bloku už něco uložilo.';}
function bookmarklet(){
  const page=new URL('./index.html?bridge=1',location.href).href,origin=location.origin;
  const code=`(()=>{const t=(document.querySelector('main')||document.body).innerText;const w=window.open(${JSON.stringify(page)},'glyphbridge');if(!w)return;let n=0;const i=setInterval(()=>{if(w.closed||++n>30){clearInterval(i);return;}w.postMessage({type:'GLYPH_INGEST',text:t.slice(-450000),source:/chatgpt|openai/.test(location.hostname)?'chatgpt':'grok'},${JSON.stringify(origin)});},350);window.addEventListener('message',function done(e){if(e.origin===${JSON.stringify(origin)}&&e.source===w&&e.data?.type==='GLYPH_ACK'){clearInterval(i);window.removeEventListener('message',done);}});})()`;
  return 'javascript:'+encodeURIComponent(code);
}
let bridgeReceived=false;
window.addEventListener('message',e=>{
  if(bridgeReceived||e.source!==window.opener||!/^https:\/\/(?:chatgpt\.com|chat\.openai\.com|grok\.com)$/.test(e.origin)||e.data?.type!=='GLYPH_INGEST'||typeof e.data.text!=='string')return;
  bridgeReceived=true;$('signal-text').value=e.data.text.slice(0,500000);$('signal-source').value=e.data.source==='grok'?'grok':'chatgpt';setTab('signal');note('Přepis přijatý. Pro uložení klepni na Rozpoznat a uložit.');e.source.postMessage({type:'GLYPH_ACK',received:true},e.origin);
});
async function delegateClick(e){
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.tab){setTab(b.dataset.tab);return;}
  if(b.dataset.core){activeCore=activeCore===b.dataset.core?'all':b.dataset.core;renderCores();renderCards();return;}
  if(b.dataset.glyph!==undefined){$('glyph-filter').value=$('glyph-filter').value===b.dataset.glyph?'':b.dataset.glyph;renderLetters();renderCards();return;}
  if(b.dataset.edit){openEditor(b.dataset.edit);return;}
  if(b.dataset.pin){await db.change('připnutí vzpomínky',s=>{const r=s.records.find(x=>x.id===b.dataset.pin);if(r)r.pinned=!r.pinned;});await reload();return;}
  if(b.dataset.trash){await db.change('přesun do koše',s=>{const i=s.records.findIndex(x=>x.id===b.dataset.trash);if(i>=0){const [r]=s.records.splice(i,1);s.trash.push({...r,deletedAt:now()});}});await reload();note('Vzpomínka je ve vratném koši.');return;}
  if(b.dataset.restore){await db.change('obnova z koše',s=>{const i=s.trash.findIndex(x=>x.id===b.dataset.restore);if(i<0)return;const [r]=s.trash.splice(i,1);if(s.records.some(x=>x.id===r.id)){r.conflictOf=r.id;r.id=uid();}delete r.deletedAt;s.records.push(r);});await reload();note('Vzpomínka je zpátky v komoře.');return;}
  if(b.dataset.recover){const all=await db.history(),h=all.find(x=>x.id===b.dataset.recover);if(h?.before)await previewImport({records:h.before.records,trash:h.before.trash,links:h.before.links},'snímek '+date(h.at));}
}
async function start(){
  const opts=Object.entries(CORES).map(([id,name])=>`<option value="${id}">${name}</option>`).join('');
  for(const id of ['signal-core','edit-core'])$(id).innerHTML=opts;
  $('signal-core').value='language';$('pack-core').insertAdjacentHTML('beforeend',opts);
  document.addEventListener('click',action(delegateClick));
  $('new-record').onclick=()=>openEditor();$('editor-form').onsubmit=action(saveEditor);$('close-editor').onclick=()=>$('editor').close();$('close-text').onclick=()=>$('text-dialog').close();
  $('search').oninput=renderCards;$('glyph-filter').oninput=()=>{renderLetters();renderCards();};
  $('clear-filter').onclick=()=>{activeCore='all';$('search').value='';$('glyph-filter').value='';renderCores();renderLetters();renderCards();};
  $('records').addEventListener('change',e=>{if(e.target.dataset.select){if(e.target.checked)selected.add(e.target.dataset.select);else selected.delete(e.target.dataset.select);renderCards();}});
  $('receive').onclick=action(receive);$('paste').onclick=action(async()=>{try{$('signal-text').value=await navigator.clipboard.readText();}catch{note('Podrž pole Text a zvol Vložit.');$('signal-text').focus();}});
  $('instructions').onclick=action(()=>copy(instructions(),'Pokyny GLYPH'));$('bookmarklet').onclick=action(()=>copy(bookmarklet(),'Most pro prohlížeč'));
  for(const id of ['pack-query','pack-budget','pack-core','pack-selected'])$(id).addEventListener('input',renderPack);
  $('copy-pack').onclick=action(()=>copy(packing.text,'Kontext do chatu'));$('download-pack').onclick=()=>download('GLYPH-kontext.txt',packing.text,'text/plain;charset=utf-8');
  $('export').onclick=action(async()=>{const snapshot=await db.archive();download(`CHT360-GLYPH-zaloha-${now().slice(0,10)}.json`,{format:FORMAT,version:2,exportedAt:now(),...snapshot,external:externalState(),appVersion:'2.0.0'});note('Záloha je připravená ke stažení.');});
  $('import').onchange=action(async e=>{const file=e.target.files?.[0];e.target.value='';await readFile(file);});
  $('read-cht').onclick=action(importCHT);$('read-grok').onclick=action(importGrok);$('to-core').onclick=action(toCore);$('teach').onclick=action(teach);
  $('check').onclick=action(async()=>{await reload();await renderBackup();note('Stav paměti je znovu načtený.');});
  $('link-records').onclick=action(async()=>{const ids=[...selected];if(ids.length<2)throw Error('Vyber nejméně dvě vzpomínky.');await db.change('propojení vzpomínek',s=>{for(const b of ids.slice(1))if(!s.links.some(l=>l.a===ids[0]&&l.b===b||l.b===ids[0]&&l.a===b))s.links.push({id:uid(),a:ids[0],b});});await reload();note('Vybrané vzpomínky jsou propojené.');});
  $('back').onclick=()=>{const p=parentApi();if(p)p.postMessage({type:'GLYPH_CLOSE'},location.origin);else location.href='../index.html';};
  window.addEventListener('glyph-memory-change',()=>{if(!loading){loading=true;setTimeout(()=>reload().catch(e=>note(e.message,true)).finally(()=>loading=false),30);}});
  if(typeof BroadcastChannel!=='undefined'){const channel=new BroadcastChannel('CHT360GlyphMemory');channel.onmessage=()=>void reload().catch(e=>note(e.message,true));}
  window.addEventListener('storage',e=>{if(e.key==='cht360_pamet_v1')renderCores();});
  await reload();
  const connection=()=>$('connection').textContent=navigator.onLine?'Místní paměť':'Místní paměť · offline';connection();window.addEventListener('online',connection);window.addEventListener('offline',connection);
  if('serviceWorker'in navigator&&location.protocol!=='file:'){
    try{
      const reg=await navigator.serviceWorker.register('./sw.js');
      const status=()=>{const worker=reg.active||reg.waiting||reg.installing;$('offline-state').textContent=worker?.state==='activated'?'Offline vrstva připravená':'Offline vrstva se připravuje…';if(worker&&worker.state!=='activated')worker.addEventListener('statechange',status,{once:true});};status();navigator.serviceWorker.addEventListener('controllerchange',status);
    }catch{$('offline-state').textContent='Offline vrstva se nenačetla. Paměť lze exportovat.';}
  }else $('offline-state').textContent='PWA vyžaduje otevření přes HTTPS nebo místní server.';
}
start().catch(err=>{note('Komora se neotevřela: '+err.message,true);$('storage-mode').textContent='Paměť se nepodařilo načíst.';});
