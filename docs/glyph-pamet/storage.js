import {blankState,validState,clone,now,uid} from './model.js';
const DB='CHT360GlyphMemory',FALLBACK='cht360_glyph_memory_v2';
let opened,mode='IndexedDB',queue=Promise.resolve();
const done=tx=>new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||Error('Paměť nešla zapsat.'));tx.onabort=()=>reject(tx.error||Error('Zápis paměti byl přerušen.'));});
const request=req=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
async function open(){
  if(!opened)opened=new Promise((resolve,reject)=>{
    if(!globalThis.indexedDB){reject(Error('IndexedDB není dostupná.'));return;}
    const r=indexedDB.open(DB,1);
    r.onupgradeneeded=()=>{r.result.createObjectStore('state');r.result.createObjectStore('journal',{keyPath:'id'});};
    r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result);};r.onerror=()=>reject(r.error);
    r.onblocked=()=>reject(Error('Zavři starší okna komory a zkus to znovu.'));
  }).catch(err=>{
    const key=FALLBACK+'_probe_'+uid();
    try{localStorage.setItem(key,'1');localStorage.removeItem(key);mode='localStorage';return null;}catch{throw Error('Prohlížeč nepovolil trvalé ukládání. '+err.message);}
  });
  return opened;
}
function fallback(){
  const raw=localStorage.getItem(FALLBACK);if(!raw)return {state:blankState(),history:[]};
  const data=JSON.parse(raw);validState(data.state);if(!Array.isArray(data.history))throw Error('Poškozená historie komory.');return data;
}
export const storageMode=()=>mode;
export async function read(){
  const db=await open();if(!db)return clone(fallback().state);
  const tx=db.transaction('state','readonly'),complete=done(tx),value=await request(tx.objectStore('state').get('root'));await complete;
  return value?validState(value):blankState();
}
export async function history(){
  const db=await open();if(!db)return clone(fallback().history);
  const tx=db.transaction('journal','readonly'),complete=done(tx),value=await request(tx.objectStore('journal').getAll());await complete;return value;
}
export async function archive(){
  const db=await open();if(!db)return clone(fallback());
  const tx=db.transaction(['state','journal'],'readonly'),complete=done(tx);
  const stateRequest=request(tx.objectStore('state').get('root'));
  const historyRequest=request(tx.objectStore('journal').getAll());
  const [value,entries]=await Promise.all([stateRequest,historyRequest]);await complete;
  return {state:value?validState(value):blankState(),history:entries};
}
function emit(){
  globalThis.dispatchEvent(new Event('glyph-memory-change'));
  if(typeof BroadcastChannel!=='undefined'){const channel=new BroadcastChannel(DB);channel.postMessage('change');channel.close();}
}
export function change(reason,edit,options={}){
  for(const e of options.history||[])if(!e||typeof e.id!=='string'||typeof e.reason!=='string')return Promise.reject(Error('Neplatná historie v záloze.'));
  const run=async()=>{
    const db=await open();
    if(!db){
      const data=fallback(),before=clone(data.state),result=edit(data.state);data.state.updatedAt=now();
      data.history.push({id:uid(),at:now(),reason,before,after:clone(data.state),...(options.external?{external:clone(options.external)}:{})});
      for(const e of options.history||[]){const old=data.history.find(x=>x.id===e.id);if(!old)data.history.push(e);else if(JSON.stringify(old)!==JSON.stringify(e))data.history.push({...e,id:uid(),conflictOf:e.id});}
      try{localStorage.setItem(FALLBACK,JSON.stringify(data));}catch{throw Error('Paměť je plná. Vyexportuj zálohu; změna se neuložila.');}
      emit();return result;
    }
    const tx=db.transaction(['state','journal'],'readwrite'),complete=done(tx);
    let result;
    try{
      const store=tx.objectStore('state'),state=validState(await request(store.get('root'))||blankState()),before=clone(state);
      result=edit(state);if(result instanceof Promise)throw Error('Změna paměti musí být synchronní.');
      state.updatedAt=now();store.put(state,'root');
      const journal=tx.objectStore('journal');
      journal.put({id:uid(),at:now(),reason,before,after:clone(state),...(options.external?{external:clone(options.external)}:{})});
      for(const e of options.history||[]){const old=await request(journal.get(e.id));if(!old)journal.put(e);else if(JSON.stringify(old)!==JSON.stringify(e))journal.put({...e,id:uid(),conflictOf:e.id});}
      await complete;emit();return result;
    }catch(err){try{tx.abort();}catch{}await complete.catch(()=>{});throw err;}
  };
  const next=queue.then(()=>navigator.locks?.request?navigator.locks.request(DB,run):run());queue=next.catch(()=>{});return next;
}
export async function checkpoint(reason,external){
  const entry={id:uid(),at:now(),reason,external:clone(external)};
  const db=await open();if(!db){const data=fallback();data.history.push(entry);localStorage.setItem(FALLBACK,JSON.stringify(data));return entry.id;}
  const tx=db.transaction('journal','readwrite'),complete=done(tx);tx.objectStore('journal').put(entry);await complete;return entry.id;
}
export async function mergeHistory(entries){
  if(!entries.length)return;
  for(const e of entries)if(!e||typeof e.id!=='string'||typeof e.reason!=='string')throw Error('Neplatná historie v záloze.');
  const db=await open();
  if(!db){const d=fallback();for(const e of entries){const same=d.history.find(x=>x.id===e.id);if(!same)d.history.push(e);else if(JSON.stringify(same)!==JSON.stringify(e))d.history.push({...e,id:uid(),conflictOf:e.id});}localStorage.setItem(FALLBACK,JSON.stringify(d));return;}
  const tx=db.transaction('journal','readwrite'),complete=done(tx),store=tx.objectStore('journal');
  for(const e of entries){const old=await request(store.get(e.id));if(!old)store.put(e);else if(JSON.stringify(old)!==JSON.stringify(e))store.put({...e,id:uid(),conflictOf:e.id});}await complete;
}
