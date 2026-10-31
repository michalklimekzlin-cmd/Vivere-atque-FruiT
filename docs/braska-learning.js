/* BRÁŠKA LEARNING VAULT — CHT 360°‰.
   Private local learning store. Source slots are read-only.
   Every changed lesson is versioned; old copies remain in IndexedDB.
*/
(() => {
  "use strict";
  if (window.BraskaLearning) return;

  const DB_NAME = "cht360_braska_self_library";
  const DB_VERSION = 2;
  const RECORDS = "learned";
  const REVISIONS = "revisions";
  const META = "meta";
  const REPO_FILES = "repoFiles";
  const REPO_HISTORY = "repoHistory";
  const SOURCE_KEYS = [
    "cht360_pamet_v1", "vaft_pamet_v1",
    "cht360_repository_atlas_v1",
    "cht360_glyph_workshop_v1", "cht360_glyph_context_v1",
    "cht360_glyph_rooms_v2", "glyph-cht-360-rooms.v1",
    "cht360_mluva_history_v1", "cht360_mluva_lessons_v1",
    "cht360_jadra_pracovni_deska_v1"
  ];
  const SKIP_KEYS = new Set([
    "cht360_braska_self_library_meta_v1",
    "cht360_braska_360_v1_memory"
  ]);
  const state = { scanning:false, learned:0, changed:0, lastScan:null, status:"čeká" };

  const text = v => String(v ?? "").replace(/\s+/g," ").trim();
  const hash = s => { let h=2166136261; for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);} return (h>>>0).toString(16); };
  const openDB = () => new Promise((resolve,reject) => {
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains(RECORDS)) db.createObjectStore(RECORDS,{keyPath:"id"});
      if(!db.objectStoreNames.contains(REVISIONS)) {
        const store=db.createObjectStore(REVISIONS,{keyPath:"revisionId"});
        store.createIndex("sourceId","sourceId",{unique:false});
      }
      if(!db.objectStoreNames.contains(META)) db.createObjectStore(META,{keyPath:"key"});
      if(!db.objectStoreNames.contains(REPO_FILES)) db.createObjectStore(REPO_FILES,{keyPath:"path"});
      if(!db.objectStoreNames.contains(REPO_HISTORY)) {
        const history=db.createObjectStore(REPO_HISTORY,{keyPath:"revisionId"});
        history.createIndex("path","path",{unique:false});
      }
    };
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
  });
  async function transact(storeName,mode,fn){
    const db=await openDB();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(storeName,mode),store=tx.objectStore(storeName);
      let result;
      try{result=fn(store);}catch(e){db.close();reject(e);return;}
      tx.oncomplete=()=>{db.close();resolve(result);};
      tx.onerror=()=>{db.close();reject(tx.error);};
      tx.onabort=()=>{db.close();reject(tx.error||new Error("Transakce přerušena"));};
    });
  }
  async function getAll(storeName){
    const db=await openDB();
    return new Promise((resolve,reject)=>{
      const req=db.transaction(storeName).objectStore(storeName).getAll();
      req.onsuccess=()=>{db.close();resolve(req.result||[]);};
      req.onerror=()=>{db.close();reject(req.error);};
    });
  }
  const readJSON = key => { try { const raw=localStorage.getItem(key); return raw?JSON.parse(raw):null; } catch(_){ return null; } };

  function extract(value,sourceKey,path,out,depth=0){
    if(depth>7 || value==null || out.length>1500) return;
    if(typeof value==="string"){
      const v=text(value);
      if(v.length>=8 && !/^data:image\//i.test(v)) out.push({path,title:path.split(".").pop()||"Poznámka",content:v,sourceKey});
      return;
    }
    if(Array.isArray(value)){ value.forEach((v,i)=>extract(v,sourceKey,path+"["+i+"]",out,depth+1)); return; }
    if(typeof value!=="object") return;
    const title=text(value.name||value.title||value.label||value.id||"");
    const content=text(value.content||value.text||value.description||value.note||value.value||"");
    if(content.length>=5){
      out.push({path,title:title||path.split(".").pop()||"Slot",content,sourceKey});
    }
    for(const [k,v] of Object.entries(value)){
      if(["content","text","description","note","value","dataUrl","image","blob"].includes(k)) continue;
      if(v && typeof v==="object") extract(v,sourceKey,path+"."+k,out,depth+1);
    }
  }
  function collectSources(){
    const found=[];
    for(const key of SOURCE_KEYS){
      const value=readJSON(key);
      if(value) extract(value,key,key,found);
    }
    // Legacy SignalCore slots are separate localStorage entries.
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);
      if(!key || SKIP_KEYS.has(key)) continue;
      if(/^VaFiT_SLOT_/i.test(key) || /^VaFiT_360_SLOT_/i.test(key) || /^cht360_slot_/i.test(key)){
        const value=readJSON(key);
        if(value) extract(value,key,key,found);
      }
    }
    const unique=new Map();
    for(const item of found){
      const content=text(item.content);
      if(!content) continue;
      const id=hash(item.sourceKey+"|"+item.path+"|"+content.slice(0,1200));
      if(!unique.has(id)) unique.set(id,{...item,id,content,hash:hash(content)});
    }
    return [...unique.values()].slice(0,1500);
  }
  async function learnFromSlots(){
    if(state.scanning) return { ...state, status:"sken už běží" };
    state.scanning=true; state.status="čtu planetární Sloty";
    try{
      const source=collectSources();
      let changed=0;
      for(const item of source){
        const db=await openDB();
        await new Promise((resolve,reject)=>{
          const tx=db.transaction([RECORDS,REVISIONS], "readwrite");
          const records=tx.objectStore(RECORDS), revisions=tx.objectStore(REVISIONS);
          const req=records.get(item.id);
          req.onsuccess=()=>{
            const previous=req.result;
            if(previous && previous.hash===item.hash) return;
            if(previous){
              revisions.put({...previous,revisionId:previous.id+"::"+previous.hash,archivedAt:new Date().toISOString()});
            }
            records.put({
              id:item.id,title:item.title,content:item.content,
              sourceKey:item.sourceKey,sourcePath:item.path,
              hash:item.hash,learnedAt:previous?.learnedAt||new Date().toISOString(),
              refreshedAt:new Date().toISOString(),version:(previous?.version||0)+1,
              provenance:"kopie z lokálního Slotu CHT; zdroj zůstává nedotčen"
            });
            changed++;
          };
          tx.oncomplete=()=>{db.close();resolve();};
          tx.onerror=()=>{db.close();reject(tx.error);};
        });
      }
      const all=await getAll(RECORDS);
      Object.assign(state,{learned:all.length,changed,lastScan:new Date().toISOString(),status:"uloženo ve vlastní knihovně"});
      await transact(META,"readwrite",s=>s.put({key:"lastScan",value:state.lastScan}));
      window.dispatchEvent(new CustomEvent("cht360:braska-learned",{detail:{...state,sourceCount:source.length}}));
      return {...state,sourceCount:source.length};
    }catch(error){
      state.status="chyba při čtení Slotů";
      state.error=String(error?.message||error);
      throw error;
    }finally{state.scanning=false;}
  }
  async function search(query,limit=6){
    const q=text(query).toLocaleLowerCase("cs");
    if(!q) return [];
    const terms=q.normalize("NFD").replace(/[\u0300-\u036f]/g,"").split(/[^a-z0-9]+/).filter(x=>x.length>1);
    const rows=await getAll(RECORDS);
    return rows.map(row=>{
      const hay=(row.title+" "+row.content+" "+row.sourceKey).toLocaleLowerCase("cs").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      let score=hay.includes(q.normalize("NFD").replace(/[\u0300-\u036f]/g,""))?10:0;
      for(const term of terms) if(hay.includes(term)) score+=term.length>5?3:1;
      return {...row,score};
    }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,Math.max(1,Math.min(12,limit)));
  }
  async function list(limit=100){return (await getAll(RECORDS)).sort((a,b)=>String(b.refreshedAt).localeCompare(String(a.refreshedAt))).slice(0,limit);}
  async function stats(){const [records,revisions]=await Promise.all([getAll(RECORDS),getAll(REVISIONS)]);return {...state,learned:records.length,protectedRevisions:revisions.length,storage:DB_NAME};}
  async function exportBackup(){
    const [records,revisions]=await Promise.all([getAll(RECORDS),getAll(REVISIONS)]);
    return {format:"CHT360-BRASKA-VAULT",version:1,exportedAt:new Date().toISOString(),records,revisions};
  }
  async function downloadBackup(){
    const data=await exportBackup(),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
    const a=document.createElement("a");a.href=url;a.download="braska-vlastni-knihovna-zaloha.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    return {downloaded:true,records:data.records.length,revisions:data.revisions.length};
  }
  async function openSource(path){
    const safe=String(path||"").replace(/^\/+/, "");
    if(!safe || safe.includes("..")) throw new Error("Neplatná cesta modulu.");
    const url=new URL(safe, new URL("./",location.href));
    if(url.origin!==location.origin) throw new Error("Odkaz mimo CHT není povolen.");
    location.href=url.href;
    return true;
  }

  // GitHub repository bridge: source is live; learned copies are immutable history.
  const REPO = { owner:"michalklimekzlin-cmd", name:"Vivere-atque-FruiT", branch:null };
  const REPO_TEXT = /\.(?:js|mjs|cjs|ts|tsx|jsx|html|css|json|md|mdx|txt|svg|yml|yaml|xml|webmanifest|py|sh|toml|ini|cfg|conf|sql|graphql|gql|csv|tsv|lock|gradle|properties|kt|java|go|rs|c|h|cpp|hpp|swift|rb|php|vue|svelte|astro)$/i;
  const REPO_ROOT_DOCS = new Set(["README.md","API.md","COMPONENTS.md","PHILOSOPHY.md","CHT-360-STORAGE-SCHEMA.md"]);
  const repoState = { syncing:false, lastSync:null, branch:null, commit:null, files:0, changed:0, deleted:0, status:"čeká na GitHub" };

  async function putRepoFile(file) {
    const db=await openDB();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction([REPO_FILES,REPO_HISTORY],"readwrite");
      const current=tx.objectStore(REPO_FILES), history=tx.objectStore(REPO_HISTORY);
      const req=current.get(file.path);
      req.onsuccess=()=>{
        const old=req.result;
        if(old && old.sha===file.sha && !old.deleted) { resolve(false); return; }
        if(old && old.content) {
          history.put({...old,revisionId:old.path+"::"+old.sha,archivedAt:new Date().toISOString(),reason:old.deleted?"předchozí uložená verze":"změna v GitHubu"});
        }
        current.put({...file,deleted:false,learnedAt:old?.learnedAt||new Date().toISOString(),refreshedAt:new Date().toISOString()});
        resolve(true);
      };
      req.onerror=()=>reject(req.error);
      tx.oncomplete=()=>db.close();
      tx.onerror=()=>{db.close();reject(tx.error);};
    });
  }
  async function markRepoDeletions(livePaths) {
    const db=await openDB();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(REPO_FILES,"readwrite"),store=tx.objectStore(REPO_FILES),req=store.getAll();
      let count=0;
      req.onsuccess=()=>{
        for(const old of req.result||[]) if(!livePaths.has(old.path) && !old.deleted) {
          old.deleted=true; old.deletedAt=new Date().toISOString(); old.deletionNote="Soubor zmizel z aktuálního GitHubu; naučená kopie zůstává.";
          store.put(old); count++;
        }
      };
      tx.oncomplete=()=>{db.close();resolve(count);};
      tx.onerror=()=>{db.close();reject(tx.error);};
    });
  }
  async function repositorySync(options={}) {
    if(repoState.syncing) return {...repoState,status:"synchronizace už běží"};
    if(!navigator.onLine) return {...repoState,status:"offline — používám vlastní archiv"};
    repoState.syncing=true; repoState.status="kontroluji GitHub";
    try {
      const api="https://api.github.com/repos/"+REPO.owner+"/"+REPO.name;
      const headers={Accept:"application/vnd.github+json"};
      const metaRes=await fetch(api,{headers,cache:"no-store"});
      if(!metaRes.ok) throw new Error("GitHub repository API HTTP "+metaRes.status);
      const meta=await metaRes.json();
      const branch=meta.default_branch;
      const treeRes=await fetch(api+"/git/trees/"+encodeURIComponent(branch)+"?recursive=1",{headers,cache:"no-store"});
      if(!treeRes.ok) throw new Error("GitHub tree HTTP "+treeRes.status);
      const tree=await treeRes.json();
      if(!Array.isArray(tree.tree)) throw new Error("GitHub nevrátil seznam souborů.");
      let commitSha=null;
      try {
        const commitRes=await fetch(api+"/commits/"+encodeURIComponent(branch),{headers,cache:"no-store"});
        if(commitRes.ok) commitSha=(await commitRes.json()).sha||null;
      } catch(_) { /* tree SHA zůstává použitelný pro kontrolu souborů */ }
      const candidates=tree.tree.filter(x=>x.type==="blob" && REPO_TEXT.test(x.path) && Number(x.size||0)<=500000 && !/(^|\/)(?:node_modules|vendor|\.git|dist|build|coverage)\//i.test(x.path));
      const livePaths=new Set(candidates.map(x=>x.path));
      const completeListing=!tree.truncated && processed===candidates.length;
      let changed=0, processed=0;
      const concurrency=5;
      for(let i=0;i<candidates.length;i+=concurrency){
        const batch=candidates.slice(i,i+concurrency);
        const results=await Promise.all(batch.map(async entry=>{
          const url="https://raw.githubusercontent.com/"+REPO.owner+"/"+REPO.name+"/"+encodeURIComponent(branch)+"/"+entry.path.split("/").map(encodeURIComponent).join("/");
          const response=await fetch(url,{cache:"no-store"});
          if(!response.ok) throw new Error("Nelze stáhnout "+entry.path+" (HTTP "+response.status+")");
          const content=await response.text();
          if(content.length>400000) return false;
          const saved=await putRepoFile({path:entry.path,sha:entry.sha,size:entry.size||content.length,content,branch,commit:commitSha,tree:tree.sha||null});
          processed++; if(saved) changed++; return true;
        }));
        if(results.some(x=>x===false)) continue;
      }
      const deleted=completeListing?await markRepoDeletions(livePaths):0;
      repoState.lastSync=new Date().toISOString(); repoState.branch=branch; repoState.commit=commitSha;
      repoState.files=processed; repoState.changed=changed; repoState.deleted=deleted;
      repoState.status="GitHub synchronizován; historie zachována";
      await transact(META,"readwrite",st=>st.put({key:"githubSync",value:{...repoState,repo:REPO.owner+"/"+REPO.name}}));
      window.dispatchEvent(new CustomEvent("cht360:braska-repository-synced",{detail:{...repoState}}));
      return {...repoState};
    } catch(error) {
      repoState.status="GitHub nedostupný — archiv zůstává zachován";
      repoState.error=String(error?.message||error);
      return {...repoState};
    } finally { repoState.syncing=false; }
  }
  async function repositoryStatus() {
    const [files,history]=await Promise.all([getAll(REPO_FILES),getAll(REPO_HISTORY)]);
    return {...repoState,files:files.length,deleted:files.filter(x=>x.deleted).length,protectedRevisions:history.length,repository:REPO.owner+"/"+REPO.name};
  }
  async function searchRepository(query,limit=8,includeHistory=true) {
    const q=text(query).toLocaleLowerCase("cs");
    if(!q) return [];
    const normalize=v=>String(v||"").toLocaleLowerCase("cs").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"");
    const [files,history]=await Promise.all([getAll(REPO_FILES),includeHistory?getAll(REPO_HISTORY):Promise.resolve([])]);
    const rows=[...files,...history];
    return rows.map(row=>{
      const hay=normalize(row.path+" "+row.content);
      const needle=normalize(q);
      let score=hay.includes(needle)?10:0;
      for(const term of needle.split(/[^a-z0-9]+/).filter(x=>x.length>1)) if(hay.includes(term)) score+=term.length>5?3:1;
      return {...row,score};
    }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,Math.max(1,Math.min(20,limit)));
  }
  async function repositoryHistory(path,limit=20) {
    const rows=await getAll(REPO_HISTORY);
    return rows.filter(x=>!path||x.path===path).sort((a,b)=>String(b.archivedAt).localeCompare(String(a.archivedAt))).slice(0,limit);
  }

  const REPO_SKILLS = [
    {id:"cht-memory",title:"Paměť CHT",path:"index.html",about:"Čtyři jádra, 70 slotů v každém, čtení a ukládání poznatků."},
    {id:"signal-tower",title:"Signal Tower",path:"signal-360/",about:"Čtyři světy, jejich sloty, orientace a signální věž."},
    {id:"glyph-workshop",title:"Glyph dílna",path:"glyph-cht-360/",about:"Tvorba, úprava a přenos Glyphů."},
    {id:"glyph-rooms",title:"Glyph pokojíčky",path:"glyph-pokojicku-cht-360/",about:"Místnosti a vazby uložených Glyphů."},
    {id:"glyph-drums",title:"Bubínky",path:"bubinky/",about:"Zámky slotů a práce se znaky."},
    {id:"mluva",title:"Mluva CHT",path:"mluva-cht-360/",about:"Lokální jazyková vrstva a propojení Glyphů."},
    {id:"puls",title:"Puls CHT",path:"cht-puls-360/",about:"Puls, paměťové události a přenosové cesty."},
    {id:"revia",title:"Revia",path:"index.html#revia",about:"Průvodcovská a paměťová vrstva."},
    {id:"chybozrout",title:"ChyboŽrout",path:"index.html#repair",about:"Kontrola a bezpečné opravy."},
    {id:"jadrа",title:"Jádra – pracovní deska",path:"cht360-jadra-pracovni-deska/",about:"Pracovní přehled čtyř jader CHT."}
  ];
  function capabilities(){
    const configured=window.CHT360Config?.modules||[];
    const merged=new Map(REPO_SKILLS.map(x=>[x.id,{...x,available:true}]));
    configured.forEach(item=>{
      const key=String(item.id||"");
      if(!merged.has(key)) merged.set(key,{id:key,title:item.longTitle||item.title||key,path:item.path||"index.html",about:item.description||"",available:true});
    });
    return [...merged.values()];
  }
  async function openCapability(id){
    const item=capabilities().find(x=>x.id===String(id));
    if(!item) throw new Error("Tuhle dovednost zatím v registru neznám.");
    return openSource(item.path);
  }
  window.BraskaLearning=Object.freeze({
    version:"1.1.0",storage:DB_NAME,
    learnFromSlots,search,list,stats,exportBackup,downloadBackup,openSource,capabilities,openCapability,
    repositorySync,repositoryStatus,searchRepository,repositoryHistory,
    getState:()=>({...state})
  });
})();
