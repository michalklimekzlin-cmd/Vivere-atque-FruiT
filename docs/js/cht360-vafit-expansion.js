/*
 * CHT 360°‰. / Vivere atque Fru¡T •ア — local-first expansion 2026-11-06.
 * Additive module. Never replaces an existing core or auto-imports personal data.
 * Requires no framework, network, external script or cloud service.
 */
(function (window, document) {
  'use strict';
  if (window.CHT360VaFiTExpansion) return;
  const PREFIX='cht360_vafit_expansion_v1';
  const DB_NAME='CHT360-VaFiT-Expansion';
  const DB_VERSION=1;
  const CORE_MEMORY_KEY=window.CHT360VaFiTConfig?.memoryKey || 'cht360_pamet_v1';
  const STORES=['records','trash'];
  const CORE_IDS={earth:'ZEMĚ',language:'JAZYK',game:'HRA',control:'ŘÍZENÍ'};
  const TYPES={project:'Projekt',glyph:'Glyph',letter:'Písmeno',lesson:'Lekce',idea:'Nápad',note:'Záznam'};
  const CZECH_LETTERS=[...'AÁBCČDĎEÉĚFGHIÍJKLMNŇOÓPQRŘSŠTŤUÚŮVWXYÝZŽ'];
  const GLYPHS=['7i_','`९נֶ','¡´','`ii´','j´','°&','¿','`¡¡´','(\\*/)','🫡°)','˚°‰•.','ア'];
  const LESSONS=[
    ['A','A jako ahoj.','Ahoj!'],['Á','Á jako máma.','Máma má ráda čaj.'],
    ['Č','Č jako český.','Učím se česky.'],['Ě','Ě v slově město.','Město je veliké.'],
    ['Ř','Ř jako řeka.','Řeka teče.'],['Š','Š jako škola.','Ve škole se učíme.'],
    ['Ž','Ž jako život.','Život je pestrý.'],['Ů','Ů v slově dům.','To je náš dům.'],
    ['O','O jako oko.','Vidím očima.'],['J','J jako já.','Já se učím.'],
    ['?','Otázka začíná zvědavostí.','Co je to?'],['!','Vykřičník vyjadřuje důraz.','Ahoj!']
  ];
  let dbPromise=null;
  let currentTab='drums';
  let records=[];
  let trash=[];
  let editId=null;
  let currentDrum=null;
  let panel=null;
  let statusNode=null;
  const $=(selector,root=document)=>root.querySelector(selector);
  const esc=(s)=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const now=()=>new Date().toISOString();
  const randomId=()=>('crypto' in window && window.crypto.randomUUID ? window.crypto.randomUUID() : Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
  function setStatus(msg,isError=false){if(statusNode){statusNode.textContent=msg;statusNode.dataset.error=String(isError);}if(isError)console.warn('[CHT VaFiT]',msg);}
  function getLocalRecords(store){try{const v=JSON.parse(localStorage.getItem(PREFIX+'_'+store)||'[]');return Array.isArray(v)?v:[];}catch(_){return [];}}
  function fallbackPut(store,item){const a=getLocalRecords(store);const i=a.findIndex(x=>x.id===item.id);if(i>=0)a[i]=item;else a.push(item);localStorage.setItem(PREFIX+'_'+store,JSON.stringify(a));}
  function fallbackDelete(store,id){localStorage.setItem(PREFIX+'_'+store,JSON.stringify(getLocalRecords(store).filter(x=>x.id!==id)));}
  function openDB(){
    if(dbPromise)return dbPromise;
    dbPromise=new Promise(resolve=>{
      if(!('indexedDB' in window)){resolve(null);return;}
      let request;try{request=indexedDB.open(DB_NAME,DB_VERSION);}catch(_){resolve(null);return;}
      request.onupgradeneeded=()=>{const db=request.result;STORES.forEach(name=>{if(!db.objectStoreNames.contains(name))db.createObjectStore(name,{keyPath:'id'});});};
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>resolve(null);
      request.onblocked=()=>resolve(null);
    });
    return dbPromise;
  }
  async function dbAction(store,method,item){
    const db=await openDB();
    if(!db){if(method==='getAll')return getLocalRecords(store);if(method==='put'){fallbackPut(store,item);return;}if(method==='delete'){fallbackDelete(store,item);return;}}
    return new Promise((resolve,reject)=>{
      try{
        const tx=db.transaction(store,method==='getAll'?'readonly':'readwrite');
        const req=tx.objectStore(store)[method](item);
        req.onsuccess=()=>resolve(req.result);
        req.onerror=()=>reject(req.error||new Error('Databáze odmítla operaci'));
        tx.onabort=()=>reject(tx.error||new Error('Zápis přerušen'));
      }catch(e){reject(e);}
    });
  }
  async function refresh(){records=(await dbAction('records','getAll')).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));trash=(await dbAction('trash','getAll'));render();}
  function broadcast(kind,detail={}){
    window.dispatchEvent(new CustomEvent('cht.vafit.changed',{detail:{kind,...detail}}));
    // Deliberately no BroadcastChannel rebroadcast: prevents relay loops.
  }
  async function saveRecord(record){
    const clean={...record,id:record.id||randomId(),type:record.type in TYPES?record.type:'note',core:record.core in CORE_IDS?record.core:'language',title:String(record.title||'Bez názvu').trim().slice(0,120),content:String(record.content||'').slice(0,20000),glyph:String(record.glyph||'').slice(0,64),drum:record.drum>=1&&record.drum<=25?Number(record.drum):null,updatedAt:now(),createdAt:record.createdAt||now(),source:record.source||'local'};
    if(clean.type!=='project')clean.drum=null;
    if(clean.drum&&records.some(x=>x.id!==clean.id&&x.type==='project'&&x.drum===clean.drum))throw new Error('Tento bubínek už má projekt. Vyber jiný.');
    await dbAction('records','put',clean);broadcast('record.saved',{id:clean.id});await refresh();return clean;
  }
  async function removeRecord(id){const entry=records.find(x=>x.id===id);if(!entry)return;await dbAction('trash','put',{...entry,deletedAt:now()});await dbAction('records','delete',id);broadcast('record.trashed',{id});await refresh();}
  async function restoreRecord(id){const entry=trash.find(x=>x.id===id);if(!entry)return;const {deletedAt,...clean}=entry;if(clean.drum&&records.some(x=>x.drum===clean.drum))clean.drum=null;await dbAction('records','put',clean);await dbAction('trash','delete',id);await refresh();}
  function coreMemory(){try{return JSON.parse(localStorage.getItem(CORE_MEMORY_KEY)||'null');}catch(_){return null;}}
  function usedSlot(slot,i){if(!slot||typeof slot!=='object')return false;return !!(String(slot.content||'').trim()||(String(slot.name||'').trim()&&String(slot.name).trim()!==`Slot ${i+1}`));}
  function coreStats(){const mem=coreMemory();return Object.entries(CORE_IDS).map(([id,label])=>({id,label,used:(mem&&Array.isArray(mem.cores?.[id])?mem.cores[id]:[]).filter(usedSlot).length}));}
  async function backupCore(){
    const mem=coreMemory();if(!mem)throw new Error('Žádná existující Paměť CHT není na této doméně dostupná.');
    download({format:'cht360-core-memory-backup-v1',exportedAt:now(),memory:mem},'CHT360-puvodni-pamet-zaloha.json');
  }
  function download(data,filename){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
  function exportExpansion(){download({format:'cht360-vafit-expansion-v1',exportedAt:now(),records,trash},'CHT360-VaFiT-uloziste-'+now().slice(0,10)+'.json');setStatus('Záloha úložiště byla připravena ke stažení.');}
  async function importExpansion(file){
    if(file.size>8*1024*1024)throw new Error('Soubor je příliš velký (max. 8 MB).');
    const data=JSON.parse(await file.text());
    if(data?.format!=='cht360-vafit-expansion-v1'||!Array.isArray(data.records))throw new Error('Tohle není export rozšíření VaFiT. Původní zálohy CHT se importují v jeho původní Paměti.');
    if(data.records.length>300)throw new Error('Příliš mnoho záznamů.');
    const existing=new Set(records.map(x=>x.id));let amount=0;
    for(const raw of data.records){if(!raw||typeof raw!=='object')continue;const src={...raw,id:existing.has(raw.id)?randomId():(String(raw.id||randomId())),drum:null}; // Imported projects never silently occupy existing bubínky.
      await saveRecord(src);existing.add(src.id);amount++;}
    setStatus('Načteno '+amount+' záznamů. Původní záznamy zůstaly zachované.');await refresh();
  }
  function overlay(){
    if(panel)return;
    const trigger=document.createElement('button');trigger.id='vafit-extension-btn';trigger.type='button';trigger.textContent='◉ VaF’¡¡’T';trigger.title='Úložiště, bubínky a čeština offline';trigger.setAttribute('aria-controls','vafit-extension-panel');trigger.addEventListener('click',()=>toggle(true));document.body.appendChild(trigger);
    panel=document.createElement('section');panel.id='vafit-extension-panel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','VaFiT — rozšíření CHT 360');
    panel.innerHTML=`<header class="vfx-head"><div><strong>Vivere atque Fru¡T •ア</strong><small>CHT 360°‰. · lokální rozšíření · 7/˚</small></div><button type="button" id="vfx-close" aria-label="Zavřít">×</button></header>
      <nav class="vfx-nav" aria-label="Funkce"><button data-tab="drums">25 bubínků</button><button data-tab="records">Záznamy</button><button data-tab="learn">Čeština</button><button data-tab="memory">Jádra / Zálohy</button><button data-tab="health">Kontrola</button></nav>
      <div id="vfx-view" class="vfx-view"></div><footer class="vfx-footer"><span id="vfx-status" role="status">Pouze lokální úložiště. Nic se nikam neposílá.</span></footer>`;
    document.body.appendChild(panel);statusNode=$('#vfx-status',panel);
    $('#vfx-close',panel).addEventListener('click',()=>toggle(false));
    $('.vfx-nav',panel).addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b){currentTab=b.dataset.tab;editId=null;render();}});
    panel.addEventListener('click',onClick);
    panel.addEventListener('submit',onSubmit);
    panel.addEventListener('change',onChange);
    render();
  }
  function toggle(open){overlay();panel.hidden=!open;document.getElementById('vafit-extension-btn').setAttribute('aria-expanded',String(open));if(open)refresh().catch(e=>setStatus(e.message,true));}
  function render(){if(!panel)return;panel.querySelectorAll('[data-tab]').forEach(btn=>btn.classList.toggle('active',btn.dataset.tab===currentTab));const view=$('#vfx-view',panel);if(currentTab==='drums')view.innerHTML=drawDrums();if(currentTab==='records')view.innerHTML=drawRecords();if(currentTab==='learn')view.innerHTML=drawLearn();if(currentTab==='memory')view.innerHTML=drawMemory();if(currentTab==='health')view.innerHTML=drawHealth();}
  function drawDrums(){const assigned=new Map(records.filter(x=>x.type==='project'&&x.drum).map(x=>[x.drum,x]));
    return `<div class="vfx-intro"><h2>Síť VaF’¡¡’T · 25 bubínků</h2><p>Projektový sklad. Jeden bubínek nese úvodní projekt, ostatní čekají na tvoje nápady. Klikni na bubínek a ulož obsah.</p></div><div class="vfx-drums">${Array.from({length:25},(_,i)=>{const n=i+1;const item=assigned.get(n);return `<button type="button" class="vfx-drum ${item?'filled':''}" data-drum="${n}" title="${item?esc(item.title):'Volné místo'}"><span>${n}</span><b>${item?esc(item.glyph||'◉'):'·'}</b><small>${item?esc(item.title):'Volné'}</small></button>`}).join('')}</div><p class="vfx-hint">Všech 25 pozic zůstává zachovaných i po opětovném otevření PWA. Projekty se zapisují do lokální databáze.</p>`;
  }
  function formHTML(data={}){const project=data.type==='project';return `<form id="vfx-editor"><h3>${editId?'Upravit záznam':'Nový záznam'}</h3><div class="vfx-form-row"><label>Typ<select name="type" id="vfx-type">${Object.entries(TYPES).map(([k,v])=>`<option value="${k}" ${data.type===k?'selected':''}>${v}</option>`).join('')}</select></label><label>Jádro<select name="core">${Object.entries(CORE_IDS).map(([k,v])=>`<option value="${k}" ${data.core===k?'selected':''}>${v}</option>`).join('')}</select></label></div>
      <label>Název<input name="title" required maxlength="120" value="${esc(data.title||'')}" placeholder="Název projektu, slovo, zápis..." /></label>
      <div class="vfx-form-row"><label>Glyph<input name="glyph" maxlength="64" value="${esc(data.glyph||'')}" placeholder="°&" /></label><label>Bubínek (pro projekt)<select name="drum"><option value="">Žádný</option>${Array.from({length:25},(_,i)=>`<option value="${i+1}" ${Number(data.drum)===i+1?'selected':''}>${i+1}</option>`).join('')}</select></label></div>
      <label>Obsah<textarea name="content" rows="4" maxlength="20000" placeholder="Obsah zůstává pouze na zařízení...">${esc(data.content||'')}</textarea></label>
      <div class="vfx-actions"><button class="vfx-primary" type="submit">Uložit lokálně</button><button type="button" data-action="cancel-edit">Zrušit</button></div></form>`;}
  function drawRecords(){const listing=records.slice(0,1000).map(r=>`<article class="vfx-record" data-record="${esc(r.id)}"><div><span class="vfx-kicker">${esc(TYPES[r.type]||r.type)} · ${esc(CORE_IDS[r.core]||'')}</span><h4>${esc(r.glyph? r.glyph+' ':'')}${esc(r.title)}</h4><p>${esc(r.content).slice(0,220)}</p></div><div class="vfx-record-buttons"><button type="button" data-action="edit" data-id="${esc(r.id)}">Upravit</button><button type="button" data-action="to-core" data-id="${esc(r.id)}">Do jádra</button><button type="button" data-action="delete" data-id="${esc(r.id)}">Do koše</button></div></article>`).join('');
    const current=records.find(r=>r.id===editId)||{type:currentDrum?'project':'note',core:'language',drum:currentDrum};
    return `<div class="vfx-intro"><h2>Lokální záznamy <span>(${records.length})</span></h2><p>Glyphy, písmena, lekce a projekty — vlastní databáze, bez cloudu.</p></div>${formHTML(current)}<label>Hledat v záznamech<input id="vfx-search" type="search" placeholder="Hledat název, obsah, glyph..." /></label><div id="vfx-list">${listing||'<p>Zatím žádné záznamy.</p>'}</div>`;
  }
  function drawLearn(){return `<div class="vfx-intro"><h2>Batole · český jazyk</h2><p>Výuka v zařízení: písmena, diakritika, první slova a glyphy. Tlačítko „Naučit Batole“ zapisuje konkrétní lekci do jeho lokální paměti.</p></div>
    <h3>Česká abeceda</h3><div class="vfx-letter-grid">${CZECH_LETTERS.map(l=>`<button type="button" data-letter="${esc(l)}" aria-label="Písmeno ${esc(l)}">${esc(l)}</button>`).join('')}</div>
    <h3>První lekce</h3><div class="vfx-lessons">${LESSONS.map((x,i)=>`<article><b>${esc(x[0])} · ${esc(x[1])}</b><p>${esc(x[2])}</p><div class="vfx-actions"><button type="button" data-lesson="${i}">Uložit lekci</button><button type="button" data-teach="${i}">Naučit Batole</button></div></article>`).join('')}</div>
    <h3>Naše glyphy</h3><div class="vfx-letter-grid">${GLYPHS.map(g=>`<button type="button" data-glyph="${esc(g)}">${esc(g)}</button>`).join('')}</div><p class="vfx-hint">Tohle je lokální sběr písmen a pravidel, ne cloudový jazykový model. Batole si bude pamatovat pouze to, co mu vědomě přidáš.</p>`;
  }
  function drawMemory(){const stats=coreStats();return `<div class="vfx-intro"><h2>Čtyři jádra · 280 slotů</h2><p>Původní Paměť CHT zůstává oddělená. Záznam do jádra přidáš vědomě tlačítkem „Do jádra“, jen do volného slotu.</p></div>
    <div class="vfx-cores">${stats.map(s=>`<div><b>${s.label}</b><strong>${s.used} / 70</strong></div>`).join('')}</div><h3>Bezpečné zálohování</h3><div class="vfx-actions"><button data-action="export" class="vfx-primary">Export VaFiT úložiště (JSON)</button><button data-action="backup-core">Záloha původních 280 slotů</button><button data-action="import">Import VaFiT (sloučení)</button></div><input id="vfx-import-input" type="file" accept="application/json,.json" hidden />
    <p class="vfx-hint">Při importu se původní záznamy nepřepisují. Export a zálohy si bezpečně ulož v aplikaci Soubory. Safari může lokální data při mazání webových dat ztratit.</p>
    <h3>Obnovení z koše (${trash.length})</h3><div class="vfx-trash">${trash.slice(0,80).map(t=>`<div><span>${esc(t.title)}</span><button type="button" data-action="restore" data-id="${esc(t.id)}">Obnovit</button></div>`).join('')||'<p>Koš je prázdný.</p>'}</div>`;
  }
  function drawHealth(){return `<div class="vfx-intro"><h2>Chybožrout · bezpečná kontrola</h2><p>Kontrola připojení modulů a schopnosti ukládat. Žádné automatické mazání.</p></div><div class="vfx-cores">
      <div><b>Lokální záznamy</b><strong>${records.length}</strong></div><div><b>Koš</b><strong>${trash.length}</strong></div><div><b>Původní Paměť</b><strong>${coreMemory()?'Načtena':'Není dostupná'}</strong></div><div><b>Batole</b><strong>${window.CHTBatole?'Připojeno':'Samostatně'}</strong></div><div><b>Revia</b><strong>${document.getElementById('reviaPanel')?'Přítomna':'Samostatně'}</strong></div><div><b>Offline</b><strong>${navigator.onLine?'Síť může být dostupná':'Bez sítě'}</strong></div></div>
      <div class="vfx-actions"><button type="button" data-action="test-store" class="vfx-primary">Ověřit zápis a čtení</button><button type="button" data-action="refresh">Znovu načíst</button></div>
      <p class="vfx-hint">Stav „síť dostupná“ neznamená, že aplikace odesílá data. Rozšíření nemá žádné vzdálené API ani analytiku.</p>`;
  }
  function openEditor(id,drum){editId=id||null;currentDrum=drum||null;currentTab='records';render();$('#vfx-editor',panel)?.scrollIntoView({block:'start',behavior:'smooth'});}
  async function teach(index){const lesson=LESSONS[index];if(!lesson)return;
    const content=`Česká lekce: ${lesson[0]} — ${lesson[1]} Příklad: ${lesson[2]}`;
    if(!window.CHTBatole?.remember){setStatus('Batole není na této stránce připojeno. Lekci lze uložit jako místní záznam.',true);return;}
    const done=window.CHTBatole.remember('create',content,'česká lekce',{source:'VaFiT local Czech lessons',letter:lesson[0]});setStatus(done?'Batole má novou českou lekci.':'Batole lekci nepřijalo.',!done);
  }
  async function insertCore(id){
    const item=records.find(x=>x.id===id);if(!item)throw new Error('Záznam nenalezen.');
    const memory=coreMemory();if(!memory?.cores || !Array.isArray(memory.cores[item.core]))throw new Error('Původní Paměť není dostupná. Otevři hlavní CHT na stejné doméně.');
    const slots=memory.cores[item.core];if(slots.length!==70)throw new Error('Jádro nemá očekávaných 70 slotů. Kvůli bezpečnosti zápis odmítnut.');
    const free=slots.findIndex((x,i)=>!usedSlot(x,i));if(free<0)throw new Error('V jádře není žádný volný slot.');
    const label=CORE_IDS[item.core];if(!window.confirm(`Zapsat „${item.title}“ do ${label}, slot ${free+1}? Vytvoří se záloha a stránka se načte znovu.`))return;
    const original=localStorage.getItem(CORE_MEMORY_KEY);if(!original)throw new Error('Chybí původní klíč Paměti.');
    const backupKey='cht360_vafit_core_backup_'+new Date().toISOString().replace(/[:.]/g,'-');
    localStorage.setItem(backupKey,original);
    const newMemory=JSON.parse(original);newMemory.cores[item.core][free]={id:free+1,name:item.title,content:[item.glyph?`Glyph: ${item.glyph}`:'',item.content].filter(Boolean).join('\n'),updatedAt:now(),source:'VaFiT expansion'};newMemory.updatedAt=now();
    try{localStorage.setItem(CORE_MEMORY_KEY,JSON.stringify(newMemory));}catch(err){localStorage.setItem(CORE_MEMORY_KEY,original);throw err;}
    setStatus(`Zapsáno do ${label}, slot ${free+1}. Obnovuji pohled, aby nedošlo ke kolizi se starým stavem.`);
    window.location.reload();
  }
  async function onClick(event){const b=event.target.closest('button');if(!b)return;
    try{
      if(b.dataset.drum){const n=Number(b.dataset.drum);const item=records.find(x=>x.type==='project'&&x.drum===n);openEditor(item?.id,n);return;}
      if(b.dataset.letter){await saveRecord({type:'letter',core:'language',title:'Písmeno '+b.dataset.letter,glyph:b.dataset.letter,content:'České písmeno '+b.dataset.letter+'. Význam a příklady doplníme postupně.'});setStatus('Písmeno uloženo.');return;}
      if(b.dataset.glyph){await saveRecord({type:'glyph',core:'language',title:'Glyph '+b.dataset.glyph,glyph:b.dataset.glyph,content:'Vlastní význam glyphu — zatím otevřený.'});setStatus('Glyph uložen.');return;}
      if(b.dataset.lesson){const l=LESSONS[Number(b.dataset.lesson)];await saveRecord({type:'lesson',core:'language',title:'Lekce '+l[0],glyph:l[0],content:l[1]+'\n'+l[2]});setStatus('Lekce uložena.');return;}
      if(b.dataset.teach){await teach(Number(b.dataset.teach));return;}
      const a=b.dataset.action;if(!a)return;
      if(a==='edit'){openEditor(b.dataset.id);return;}
      if(a==='to-core'){await insertCore(b.dataset.id);return;}
      if(a==='delete'){if(window.confirm('Přesunout záznam do vratného koše?')){await removeRecord(b.dataset.id);setStatus('Přesunuto do koše.');}return;}
      if(a==='cancel-edit'){editId=null;currentDrum=null;render();return;}
      if(a==='restore'){await restoreRecord(b.dataset.id);setStatus('Obnoveno.');return;}
      if(a==='export'){exportExpansion();return;}
      if(a==='backup-core'){await backupCore();setStatus('Záloha původní Paměti připravena.');return;}
      if(a==='import'){$('#vfx-import-input',panel)?.click();return;}
      if(a==='refresh'){await refresh();setStatus('Stav obnoven.');return;}
      if(a==='test-store'){const id='health-'+randomId();await dbAction('records','put',{id,type:'test',title:'TEMP',updatedAt:now()});const all=await dbAction('records','getAll');if(!all.some(x=>x.id===id))throw new Error('Kontrolní záznam se nenačetl.');await dbAction('records','delete',id);setStatus('Zápis, čtení a odstranění testovacího záznamu: OK.');await refresh();return;}
    }catch(err){setStatus('Operace se nepodařila: '+err.message,true);}
  }
  async function onSubmit(e){if(e.target.id!=='vfx-editor')return;e.preventDefault();const f=new FormData(e.target);const old=records.find(x=>x.id===editId)||{};
    try{const record=await saveRecord({...old,type:f.get('type'),core:f.get('core'),title:f.get('title'),glyph:f.get('glyph'),drum:Number(f.get('drum'))||null,content:f.get('content')});editId=null;currentDrum=null;setStatus('Uloženo lokálně: '+record.title);}catch(err){setStatus('Neuloženo: '+err.message,true);}}
  async function onChange(e){if(e.target.id!=='vfx-import-input')return;const file=e.target.files?.[0];if(!file)return;try{await importExpansion(file);}catch(err){setStatus('Import selhal: '+err.message,true);}finally{e.target.value='';}}
  function filterRecords(term){const list=$('#vfx-list',panel);if(!list)return;const q=term.toLocaleLowerCase('cs');list.querySelectorAll('.vfx-record').forEach(node=>{node.hidden=!node.textContent.toLocaleLowerCase('cs').includes(q);});}
  function init(){overlay();panel.addEventListener('input',e=>{if(e.target.id==='vfx-search')filterRecords(e.target.value);});
    const seedKey=PREFIX+'_seeded';
    openDB().then(async()=>{
      if(localStorage.getItem(seedKey)!=='yes'){
        const existing=await dbAction('records','getAll');if(!existing.length)await saveRecord({type:'project',core:'control',title:'CHT 360°‰. · Vivere atque Fru¡T',glyph:'ア',drum:1,content:'Úvodní projekt, čtyři jádra, Batole, síť bubínků, lokální úložiště. Další bubínky čekají na projekty.'});
        localStorage.setItem(seedKey,'yes');
      }
      await refresh();
    }).catch(e=>setStatus('Databáze není dostupná: '+e.message,true));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel&&!panel.hidden)toggle(false);});
  }
  window.CHT360VaFiTExpansion=Object.freeze({open:()=>toggle(true),close:()=>toggle(false),list:()=>records.map(x=>({...x})),export:exportExpansion,health:()=>({records:records.length,trash:trash.length,database:DB_NAME}),version:'1.0.0'});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window,document);
