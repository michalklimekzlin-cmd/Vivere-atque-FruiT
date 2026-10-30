/* BRÁŠKA KNOWLEDGE CORE v1.0 — IndexedDB repository index */
(() => {
  "use strict";
  if (window.BraskaKnowledge) return;
  const DB="cht360_braska_knowledge", STORE="documents", META="cht360_braska_knowledge_meta_v1";
  const MANIFEST="./offline-cashe-assets.json", MAX_BYTES=350000, MAX_FILES=180;
  const SKIP=/\.(?:png|jpe?g|webp|gif|ico|woff2?|ttf|mp4|mp3|pdf|zip)$/i;
  const state={status:"čeká",indexed:0,changed:0,failed:0,lastSync:null};
  const norm=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("cs");
  const toks=s=>norm(s).split(/[^a-z0-9_\u0080-\uFFFF]+/u).filter(x=>x.length>1);
  function db(){return new Promise((ok,no)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:"path"});};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});}
  async function all(){const d=await db();return new Promise((ok,no)=>{const r=d.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>{d.close();ok(r.result||[]);};r.onerror=()=>{d.close();no(r.error);};});}
  async function put(items){if(!items.length)return;const d=await db();return new Promise((ok,no)=>{const t=d.transaction(STORE,"readwrite");items.forEach(x=>t.objectStore(STORE).put(x));t.oncomplete=()=>{d.close();ok(true);};t.onerror=()=>{d.close();no(t.error);};});}
  async function prune(paths){const keep=new Set(paths),old=(await all()).filter(x=>!keep.has(x.path) && !x.path.startsWith("user:/")).map(x=>x.path);if(!old.length)return;const d=await db();await new Promise((ok,no)=>{const t=d.transaction(STORE,"readwrite");old.forEach(p=>t.objectStore(STORE).delete(p));t.oncomplete=ok;t.onerror=()=>no(t.error);});d.close();}
  function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(16);}
  function meta(v){try{if(v){localStorage.setItem(META,JSON.stringify(v));return;}return JSON.parse(localStorage.getItem(META)||"{}");}catch(_){return{};}}
  const SEEDS=[
    {id:"concept:glyph",title:"Glyph",text:"Glyph je v jazyce Vivere označení pro symbolickou znakovou jednotku. Příklady zápisů používaných zakladatelem: ९נֶ a 'ii'. Konkrétní významy se evidují samostatně a nesmějí se domýšlet.",tags:["glyph","jazyk","symbol"],source:"zakladatel / základní slovník"},
    {id:"glyph:pluto",title:"˚°‰•.",text:"˚°‰•. je vlastní Glyph světa Vivere. Podle vysvětlení zakladatele čára uprostřed vyjadřuje přizvání Pluta mezi ostatní planety. Jde o interní symbolický význam projektu, nikoli astronomickou klasifikaci.",tags:["glyph","pluto","planety","symbolika"],source:"zakladatel / výklad Glyphu"},
    {id:"solar-system",title:"Sluneční soustava",text:"Osm planet v pořadí od Slunce: Merkur, Venuše, Země, Mars, Jupiter, Saturn, Uran a Neptun. Pluto je trpasličí planeta podle současné astronomické klasifikace; v symbolickém světě Vivere má vlastní Glyph a příběh přijetí.",tags:["planeta","sluneční soustava","pluto","astronomie"],source:"základní znalost + symbolika zakladatele"},
    {id:"local-first",title:"Lokální znalost Brášky",text:"Bráška ukládá index a kopie textových souborů do IndexedDB. LocalStorage uchovává malé stavové údaje a verzi indexu. Lokální vyhledávání není totéž co generativní jazykový model.",tags:["braska","paměť","offline","technika"],source:"architektura Brášky"},
    {id:"vivere",title:"Vivere atque FruiT",text:"Vivere atque FruiT je název projektového světa CHT 360. Významy jeho vlastních znaků a pravidel mají pocházet z dokumentace a výslovného vysvětlení zakladatele.",tags:["vivere","cht360","projekt"],source:"zakladatel / projektový kontext"}
  ];
  function title(path,text){const m=text.match(/^\s{0,3}#\s+(.+)$/m);return m?m[1].slice(0,140):path.split("/").pop();}
  function record(path,text){return{path,title:title(path,text),text,hash:hash(text),updatedAt:new Date().toISOString(),tokens:toks(path+" "+text).slice(0,12000)};}
  async function sync(){
    if(!("indexedDB"in window))throw Error("IndexedDB není dostupná.");
    state.status="načítám manifest";
    const mr=await fetch(MANIFEST,{cache:"no-cache"});if(!mr.ok)throw Error("Manifest nedostupný: "+mr.status);
    const manifest=await mr.json(),paths=[...new Set((manifest.files||[]).filter(p=>typeof p==="string"&&!SKIP.test(p)).slice(0,MAX_FILES))];
    const old=new Map((await all()).map(x=>[x.path,x])),changed=[];state.failed=0;let checked=0;state.status="porovnávám soubory";
    for(let i=0;i<paths.length;i+=5){
      const batch=await Promise.all(paths.slice(i,i+5).map(async path=>{try{const r=await fetch(path,{cache:"no-cache"});if(!r.ok)throw Error(r.status);const text=await r.text();if(text.length>MAX_BYTES)return null;checked++;const h=hash(text);return old.get(path)?.hash===h?null:record(path,text);}catch(_){state.failed++;return null;}}));
      changed.push(...batch.filter(Boolean));
    }
    await put(changed);await prune(paths);state.indexed=(await all()).length;state.changed=changed.length;state.lastSync=new Date().toISOString();state.status=state.failed?"hotovo s nedostupnými soubory":"synchronizováno";
    meta({version:1,lastSync:state.lastSync,indexed:state.indexed,checked,changed:state.changed,failed:state.failed,manifestGeneratedAt:manifest.generatedAt||null});
    window.dispatchEvent(new CustomEvent("cht360:braska-knowledge-ready",{detail:{...state,checked}}));
    return{...state,checked};
  }
  function score(hay,q,raw){const h=norm(hay);let n=norm(raw).length>2&&h.includes(norm(raw))?8:0;q.forEach(t=>{if(h.includes(t))n+=t.length>5?3:1;});return n;}
  async function search(query,limit=6){
    const q=[...new Set(toks(query))],raw=String(query||"").trim();if(!raw)return[];
    const docs=await all(),seed=SEEDS.map(x=>({...x,score:score(x.title+" "+x.text+" "+x.tags.join(" "),q,raw)}));
    const files=docs.map(d=>{const sc=score(d.title+" "+d.path+" "+d.text,q,raw);if(!sc)return null;const at=norm(d.text).indexOf(norm(raw));const start=at>=0?at:Math.max(0,norm(d.text).indexOf(q[0]||""));return{id:"file:"+d.path,title:d.title,path:d.path,source:d.path,text:d.text.slice(Math.max(0,start-250),Math.min(d.text.length,start+1000)),score:sc};}).filter(Boolean);
    return[...seed,...files].filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,Math.max(1,Math.min(10,limit)));
  }
  async function respond(query){
    const found=await search(query,4);
    if(!found.length)return"Tohle zatím v mém lokálním znalostním indexu nemám doložené. Nechci si význam vymýšlet. Můžeš mi ho vysvětlit a já ho uložím jako nový poznatek.";
    return"V lokálních znalostech jsem našel tyto souvislosti:\n\n"+found.slice(0,3).map((x,i)=>(i+1)+". "+x.title+"\n"+x.text.slice(0,650)+"\nZdroj: "+(x.source||x.path)).join("\n\n")+"\n\nMůžeme význam doplnit nebo opravit.";
  }
  async function teach(name,text,options={}){name=String(name||"").trim();text=String(text||"").trim();if(!name||!text)throw Error("Vyplň název i význam.");const path="user:/"+name.toLocaleLowerCase("cs").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");await put([{path,title:name,text,hash:hash(text),updatedAt:new Date().toISOString(),source:options.source||"uživatel / výuka",tags:options.tags||["uživatelské-učení"]}]);return{saved:true,title:name,path};}
  async function status(){return{...state,indexed:(await all()).length,meta:meta(),seeds:SEEDS.length,storage:"IndexedDB"};}
  window.BraskaKnowledge=Object.freeze({version:"1.0.0",sync,search,respond,teach,status,seeds:SEEDS});
  const start=()=>sync().catch(e=>{state.status="offline / synchronizace čeká";console.warn("[Bráška Knowledge]",e);});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();