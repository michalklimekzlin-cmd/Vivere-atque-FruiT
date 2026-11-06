"use strict";
const SCHEMA="vaf-grid95-memory-v2", DB="VaFTGrid95Memory", STORE="entries", FALLBACK="vaf_grid95_memory_entries_v2";
const $=id=>document.getElementById(id);
let dbPromise=null, inputMode="import";
function dbOpen(){
 if(dbPromise)return dbPromise;
 dbPromise=new Promise(resolve=>{
   if(!("indexedDB" in window)){resolve(null);return;}
   try{
    const req=indexedDB.open(DB,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:"id"});};
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>resolve(null); req.onblocked=()=>resolve(null);
   }catch{resolve(null);}
 });
 return dbPromise;
}
function fallbackGet(){try{return JSON.parse(localStorage.getItem(FALLBACK)||"[]");}catch{return [];}}
function fallbackPut(entry){const all=fallbackGet(); if(!all.some(x=>x.id===entry.id)){all.push(entry);localStorage.setItem(FALLBACK,JSON.stringify(all));}}
async function getAll(){
 const db=await dbOpen();if(!db)return fallbackGet();
 try{return await new Promise((resolve,reject)=>{const q=db.transaction(STORE,"readonly").objectStore(STORE).getAll();q.onsuccess=()=>resolve(q.result||[]);q.onerror=()=>reject(q.error);});}
 catch{return fallbackGet();}
}
async function putIfNew(entry){
 const existing=await getAll();if(existing.some(x=>x.id===entry.id))return false;
 const db=await dbOpen();if(!db){fallbackPut(entry);return true;}
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,"readwrite");tx.objectStore(STORE).add(entry);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });return true;
}
function status(t){$("status").textContent=t;}
function valid(x){return x&&typeof x.id==="string"&&typeof x.title==="string"&&typeof x.text==="string"&&["ZEMĚ","JAZYK","HRA","ŘÍZENÍ"].includes(x.core);}
const OBSIDIAN_VAULT_KEY = "vaf_grid95_obsidian_local_vault_v1";
function getVaultName(){
  const typed = $("obsidianVault")?.value?.trim();
  if (typed) return typed;
  try { return localStorage.getItem(OBSIDIAN_VAULT_KEY)?.trim() || ""; }
  catch { return ""; }
}
function saveVault(){
  const name = $("obsidianVault").value.trim();
  if (!name) { status("Nejdřív zadej přesný název vaultu."); $("obsidianVault").focus(); return false; }
  try { localStorage.setItem(OBSIDIAN_VAULT_KEY, name); }
  catch { status("Název vaultu nelze trvale uložit do tohoto prohlížeče."); return false; }
  status("Název místního vaultu je uložen pouze v tomto zařízení.");
  return true;
}
function obsidianMarkdown(entry){
  return "# " + entry.title + "\n\n" + entry.text + "\n\n"
    + "**Jádro:** " + entry.core + "\n"
    + "**Štítky:** " + (entry.tags || []).join(", ") + "\n"
    + "**Zdroj:** CHT 360°‰. / VaF’i’T Paměť\n"
    + "**ID:** " + entry.id + "\n";
}
async function handoffToObsidian(entry){
  const vault = getVaultName();
  if (!vault) {
    status("Vyplň název svého místního Obsidian vaultu a ulož ho.");
    $("obsidianVault").focus();
    return;
  }
  const markdown = obsidianMarkdown(entry);
  const title = ("CHT " + entry.title + " " + entry.id).replace(/[\\/:*?"<>|]/g, "-").slice(0, 130);
  const filename = title + ".md";
  const url = "obsidian://new?vault=" + encodeURIComponent(vault)
    + "&name=" + encodeURIComponent(title) + "&content=" + encodeURIComponent(markdown);
  if (url.length < 5500) {
    status("Otevírám Obsidian. Zkontroluj v aplikaci, že se poznámka opravdu uložila.");
    window.location.href = url;
    return;
  }
  const file = new File([markdown], filename, { type: "text/markdown;charset=utf-8" });
  try {
    if (navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))) {
      await navigator.share({files:[file], title:entry.title});
      status("Soubor byl předán nabídce Sdílet. Vyber Obsidian a potvrď uložení.");
      return;
    }
  } catch (error) {
    if (error?.name === "AbortError") { status("Sdílení bylo zrušeno; poznatek zůstává v CHT."); return; }
  }
  download(markdown, filename, "text/markdown;charset=utf-8");
  status("Dlouhá poznámka je stažená jako Markdown. Přesuň ji do Obsidianu přes aplikaci Soubory.");
}
function download(content,name,type){
 const url=URL.createObjectURL(new Blob([content],{type}));
 const a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
}
async function refresh(){
 const data=await getAll(),q=$("search").value.trim().toLocaleLowerCase("cs"),c=$("filter").value;
 const shown=data.filter(x=>(!c||x.core===c)&&(!q||[x.title,x.text,(x.tags||[]).join(" ")].join(" ").toLocaleLowerCase("cs").includes(q)));
 $("count").textContent=data.length+" záznamů";$("entries").replaceChildren();
 for(const entry of shown.sort((a,b)=>a.core.localeCompare(b.core,"cs")||a.title.localeCompare(b.title,"cs"))){
  const box=document.createElement("article");box.className="entry";
  const h=document.createElement("h3");h.textContent=entry.title;
  const core=document.createElement("div");core.className="tag";core.textContent=entry.core+" · "+(entry.tags||[]).join(" · ");
  const p=document.createElement("p");p.textContent=entry.text;
  const m=document.createElement("div");m.className="meta";m.textContent=entry.status||"lokální záznam";
  const actions=document.createElement("div");actions.className="entryActions";
  const obsidian=document.createElement("button");obsidian.type="button";obsidian.textContent="Do Obsidianu";
  obsidian.addEventListener("click",()=>handoffToObsidian(entry).catch(error=>status("Předání do Obsidianu neproběhlo: "+error.message)));
  actions.append(obsidian);
  box.append(core,h,p,m,actions);$("entries").append(box);
 }
}
async function seed(){
 try{
  const r=await fetch("./seed.json",{cache:"no-cache"});if(!r.ok)throw Error("Nenalezen seed");
  const obj=await r.json();let added=0;
  for(const e of obj.entries||[]){if(valid(e)&&await putIfNew(e))added++;}
  status("Paměť připravena. Doplněno "+added+" veřejných projektových záznamů; staré zůstaly beze změny.");
 }catch(e){status("Offline nebo seed nedostupný; použiji existující lokální záznamy.");}
 await refresh();
}
$("save").addEventListener("click",async()=>{
 const title=$("title").value.trim(),text=$("body").value.trim();
 if(!title||!text){status("Vyplň název a obsah.");return;}
 const id="local-"+(self.crypto?.randomUUID?.()||Date.now()+"-"+Math.random().toString(36).slice(2));
 try{await putIfNew({id,core:$("core").value,title,text,tags:$("tags").value.split(",").map(x=>x.trim()).filter(Boolean),status:"lokální poznámka",updated:new Date().toISOString()});
 $("title").value="";$("body").value="";$("tags").value="";status("Uloženo pouze do tohoto prohlížeče.");await refresh();
 }catch(e){status("Nepodařilo se uložit. Zkontroluj volné místo a oprávnění prohlížeče.");}
});
$("search").addEventListener("input",refresh);$("filter").addEventListener("change",refresh);
$("exportJSON").addEventListener("click",async()=>{
 const obj={schema:SCHEMA,project:"Vivere atque Fru¡T•ア / CHT 360°‰.",exported:new Date().toISOString(),entries:await getAll()};
 download(JSON.stringify(obj,null,2),"VaFiT-grid95-grid96-pamet.json","application/json;charset=utf-8");status("JSON stažen. Uschovej zálohu v soukromí.");
});
$("importJSON").addEventListener("click",()=>{$("file").value="";$("file").click();});
$("file").addEventListener("change",async()=>{
 const f=$("file").files?.[0];if(!f)return;
 try{
  const obj=JSON.parse(await f.text()),raw=Array.isArray(obj)?obj:obj.entries;
  if(!Array.isArray(raw))throw Error("Chybí pole entries.");
  let added=0,skipped=0;
  for(const e of raw){if(valid(e)){if(await putIfNew(e))added++;else skipped++;}else skipped++;}
  status("Import: přidáno "+added+", přeskočeno "+skipped+". Existující záznamy nepřepsány.");await refresh();
 }catch(e){status("Import selhal: "+e.message);}
});
$("exportMD").addEventListener("click",async()=>{
 const rows=await getAll();
 const safe=s=>String(s||"").replace(/\r/g,"").replace(/\n{3,}/g,"\n\n");
 const md=["---","title: VaF’i’T Paměť grid95 × grid96","tags: [VaFiT, CHT360, grid95, grid96]","---","# Paměť grid95 × grid96","","> Soukromý export z lokální PWA. Nezveřejňovat automaticky.",""];
 for(const core of ["ZEMĚ","JAZYK","HRA","ŘÍZENÍ"]){
  md.push("## "+core,"");
  for(const e of rows.filter(x=>x.core===core)){md.push("### "+safe(e.title),"",safe(e.text),"",e.tags?.length?"Štítky: "+e.tags.join(", "):"","");}
 }
 download(md.join("\n"),"VaFiT-grid95-grid96-Obsidian.md","text/markdown;charset=utf-8");status("Markdown pro Obsidian stažen.");
});
$("backupCHT").addEventListener("click",()=>{
 const keys=["cht360_pamet_v1","cht360_pamet_snapshots_v1","vaft_pamet_v1"];
 const data={schema:"cht360-localstorage-backup-v1",exported:new Date().toISOString(),source:location.origin,values:{}};
 for(const key of keys){try{data.values[key]=localStorage.getItem(key);}catch{data.values[key]=null;}}
 download(JSON.stringify(data,null,2),"CHT360-soukroma-zaloha-localStorage.json","application/json;charset=utf-8");
 status("Záloha původní Paměti stažena. Nic se nepřepisovalo.");
});
$("obsidianSaveVault").addEventListener("click",saveVault);
$("obsidianTestVault").addEventListener("click",()=>{
  if(!getVaultName()){status("Nejdřív zadej název vaultu.");$("obsidianVault").focus();return;}
  window.location.href="obsidian://open?vault="+encodeURIComponent(getVaultName());
  status("Otevírám místní vault v Obsidianu; ověř jeho název.");
});
try{$("obsidianVault").value=localStorage.getItem(OBSIDIAN_VAULT_KEY)||"";}catch{}
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
seed();
