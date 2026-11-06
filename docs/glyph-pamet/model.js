import { extractMemories } from './grok/parse.js';
import { worldsIn, worldTag } from './grok/worlds.js';

export const CORES = Object.freeze({game:'HRA',control:'ŘÍZENÍ',earth:'ZEMĚ',language:'JAZYK'});
export const FORMAT = 'cht360-glyph-memory-v2';
export const LETTERS = ['A','Á','B','C','Č','D','Ď','E','É','Ě','F','G','H','Ch','I','Í','J','K','L','M','N','Ň','O','Ó','P','Q','R','Ř','S','Š','T','Ť','U','Ú','Ů','V','W','X','Y','Ý','Z','Ž','I','i','l','O','o','0','°','˚','ア','°&','`९נֶ'];
export const now = () => new Date().toISOString();
export const uid = () => {
  if(globalThis.crypto?.randomUUID)return globalThis.crypto.randomUUID();
  const bytes=new Uint8Array(16);
  if(globalThis.crypto?.getRandomValues)globalThis.crypto.getRandomValues(bytes);
  else for(let i=0;i<bytes.length;i++)bytes[i]=Math.floor(Math.random()*256);
  bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  return [...bytes].map((b,i)=>([4,6,8,10].includes(i)?'-':'')+b.toString(16).padStart(2,'0')).join('');
};
export const clone = value => structuredClone(value);
const str = v => typeof v === 'string' ? v : '';
const timestamp = (v,fallback) => v && Number.isFinite(+new Date(v)) ? new Date(v).toISOString() : fallback;
export const unique = a => [...new Set(a)];
export function coreId(value) {
  const v=String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  return ({game:'game',hra:'game',control:'control',rizeni:'control',earth:'earth',zeme:'earth',language:'language',jazyk:'language'})[v] || 'language';
}
export function glyphsOf(value) {
  return unique((Array.isArray(value)?value:String(value||'').split(/[,\n]/)).map(x=>String(x).trim().normalize('NFC')).filter(Boolean));
}
export function blankState() {return {version:2,records:[],trash:[],links:[],updatedAt:now()};}
export function validState(value) {
  if (!value || !Array.isArray(value.records) || !Array.isArray(value.trash) || !Array.isArray(value.links)) throw Error('Poškozený stav komory. Původní data zůstala zachovaná.');
  return value;
}
export function normalRecord(raw,defaults={}) {
  if (!raw || typeof raw!=='object') throw Error('Záznam není objekt.');
  const body=str(raw.body)||str(raw.content)||str(raw.text);
  const title=str(raw.title)||str(raw.name)||body.split('\n').find(x=>x.trim())?.slice(0,72)||'Bez názvu';
  if (!body.trim()) throw Error('Záznam nemá obsah.');
  if (body.length>2_000_000) throw Error('Jeden záznam přesahuje dva miliony znaků. Rozděl jej na části.');
  const stamp=now();
  return {...raw,id:str(raw.id)||uid(),title,body,source:str(raw.source)||defaults.source||'user',core:coreId(raw.core||defaults.core),
    glyphs:glyphsOf(raw.glyphs??(raw.glyph&& !['GLYPH','SAVE','FENCE','LINE'].includes(raw.glyph)?raw.glyph:defaults.glyphs)),
    tags:unique([...(Array.isArray(raw.tags)?raw.tags.filter(x=>typeof x==='string'):[]),...worldsIn(title+'\n'+body).map(worldTag)]),
    createdAt:timestamp(raw.createdAt,stamp),updatedAt:timestamp(raw.updatedAt,stamp),pinned:!!raw.pinned,origin:raw.origin||defaults.origin||'manual'};
}
export function identity(r) {
  // Compare the complete meaningful values, not a short hash or lowercased text.
  return JSON.stringify([r.source,r.core,r.title,r.body,[...r.glyphs].sort(),[...r.tags].sort(),!!r.pinned]);
}
export function parseSignal(text,defaults={}) {
  const drafts=extractMemories(text,defaults.source==='grok'?'grok':'chatgpt','paste');
  if (!drafts.length) return [];
  return drafts.map(d=>{
    const taggedCore=d.tags.find(t=>/^(j[aá]dro|core):/i.test(t));
    const marked=d.tags.filter(t=>/^(p[ií]smeno|glyph):/i.test(t)).map(t=>t.slice(t.indexOf(':')+1));
    return normalRecord({...d,glyph:undefined,core:taggedCore?taggedCore.slice(taggedCore.indexOf(':')+1):defaults.core,glyphs:marked.length?marked:defaults.glyphs},defaults);
  });
}
export function mergeRecords(state,incoming,incomingLinks=[],incomingTrash=[]) {
  const ids=new Map(), byId=new Map([...state.records,...state.trash].map(r=>[r.id,r]));
  let added=0,skipped=0,conflicts=0;
  for (const [rawItems,target] of [[incoming,state.records],[incomingTrash,state.trash]]) {
    const byContent=new Map(target.map(r=>[identity(r),r]));
    for (const raw of rawItems) {
      const item=normalRecord(raw,{origin:'import'}), key=identity(item), same=byContent.get(key);
      if (same) {ids.set(item.id,same.id);skipped++;continue;}
      const originalId=item.id;
      if (byId.has(item.id)) {item.conflictOf=item.id;item.id=uid();conflicts++;}
      target.push(item);byContent.set(key,item);byId.set(item.id,item);ids.set(originalId,item.id);added++;
    }
  }
  const activeIds=new Set(state.records.map(r=>r.id));
  const linkKeys=new Set(state.links.map(l=>[l.a,l.b].sort().join('|')));
  for (const link of incomingLinks) {
    const a=ids.get(link.a)||link.a,b=ids.get(link.b)||link.b,key=[a,b].sort().join('|');
    if (!a||!b||a===b||!activeIds.has(a)||!activeIds.has(b)||linkKeys.has(key)) continue;
    state.links.push({...link,id:uid(),a,b});linkKeys.add(key);
  }
  return {added,skipped,conflicts};
}
export function fromCoreMemory(value,source='CHT') {
  const mem=value?.memory||value?.data||value;
  if (!mem?.cores || typeof mem.cores!=='object') return null;
  const out=[];
  for (const [id,core] of Object.entries(mem.cores)) {
    if (!(id in CORES)) continue;
    const slots=Array.isArray(core)?core:core?.slots;
    if (!Array.isArray(slots)) continue;
    slots.forEach((s,i)=>{
      if (!s||(!String(s.content||s.text||'').trim()&&(!s.name||s.name===`Slot ${i+1}`)))return;
      out.push(normalRecord({...s,id:`cht:${source}:${id}:${s.id||i+1}`,title:s.name||s.title||`Slot ${i+1}`,body:s.content||s.text||s.name,core:id,originalSource:s.source,source,origin:'import',coreSlot:i+1}));
    });
  }
  return out;
}
function messagesFromConversation(c) {
  if (!c?.mapping || typeof c.mapping!=='object')return [];
  const messages=[],visited=new Set();let node=c.mapping[c.current_node];
  if (node) {
    while (node&&!visited.has(node)) {visited.add(node);if(node.message)messages.unshift(node.message);node=node.parent?c.mapping[node.parent]:null;}
  } else {
    // Older exports can omit current_node. Retain all branches and mark them.
    messages.push(...Object.values(c.mapping).map(n=>n?.message).filter(Boolean).sort((a,b)=>(a.create_time||0)-(b.create_time||0)));
  }
  return messages.filter(m=>['user','assistant'].includes(m.author?.role)).map(m=>{
    const parts=m.content?.parts||[m.content?.text];
    const text=parts.map(p=>typeof p==='string'?p:typeof p?.text==='string'?p.text:'').filter(Boolean).join('\n');
    return text?`${m.author.role==='user'?'Ty':'ChatGPT'}:\n${text}`:'';
  }).filter(Boolean);
}
export function importObject(data,defaults={}) {
  if (data?.format===FORMAT) {
    const state=validState(data.state);return {records:state.records.map(r=>normalRecord(r,defaults)),trash:state.trash.map(r=>normalRecord(r,defaults)),links:state.links,extras:data.external||{},history:Array.isArray(data.history)?data.history:[]};
  }
  if (data?.version===1 && Array.isArray(data.memories))return {records:data.memories.map(r=>normalRecord({...r,legacyLayout:{col:r.col,row:r.row,w:r.w,h:r.h}},defaults)),links:data.links||[],trash:[]};
  if (data?.format==='cht360-vafit-expansion-v1'&&Array.isArray(data.records))return {records:data.records.map(r=>normalRecord(r,defaults)),trash:(data.trash||[]).map(r=>normalRecord(r,defaults)),links:[]};
  const core=fromCoreMemory(data);if(core)return {records:core,trash:[],links:[]};
  const conversations=Array.isArray(data)?data:Array.isArray(data?.conversations)?data.conversations:data?.mapping?[data]:null;
  if (conversations) {
    const records=conversations.flatMap((c,i)=>{
      const body=messagesFromConversation(c).join('\n\n');
      if (!body)return [];
      return [normalRecord({id:`chatgpt:${c.id||c.conversation_id||i}`,title:c.title||'Konverzace ChatGPT',body,source:'chatgpt',origin:'import',tags:c.current_node?['chatgpt']:['chatgpt','všechny-větve']},defaults)];
    });
    if(!records.length)throw Error('V exportu nejsou textové konverzace.');
    return {records,links:[],trash:[]};
  }
  throw Error('Nerozpoznaná záloha. Podporuji GLYPH, CHT, VaFiT a export konverzací ChatGPT.');
}
export function contextPack(records,{budget=8000,query='',includeIds=null,core='all'}={}) {
  const cap=Math.max(400,Math.min(100000,Math.floor(Number(budget)||8000)));
  const needle=query.trim().toLocaleLowerCase('cs');
  const pool=records.filter(r=>!r.canonId&&(!includeIds||includeIds.includes(r.id))&&(core==='all'||r.core===core)&&(!needle||[r.title,r.body,...r.tags,...r.glyphs].join('\n').toLocaleLowerCase('cs').includes(needle)))
    .sort((a,b)=>Number(b.pinned)-Number(a.pinned)||String(b.updatedAt).localeCompare(String(a.updatedAt)));
  let text='⟦GLYPH KONTEXT⟧\nUložené záznamy s uvedeným původem. Zachovej nejistoty a nic si nedomýšlej.\n';
  const tail='\n⟦/GLYPH KONTEXT⟧';let used=0,shortened=0;
  for(const r of pool) {
    const head=`\n## ${r.title}\n${CORES[r.core]} · ${r.source} · znaky: ${r.glyphs.join(', ')||'—'}\n`;
    const room=cap-text.length-tail.length;
    if(room<head.length+20)continue;
    if(head.length+r.body.length<=room)text+=head+r.body;
    else {text+=head+r.body.slice(0,room-head.length-16)+'\n[část záznamu]';shortened++;}
    used++;if(text.length+tail.length>=cap-20)break;
  }
  text+=tail;return {text,used,omitted:pool.length-used,shortened,chars:text.length};
}
export function emptyCoreMemory(){return {version:2,createdAt:now(),updatedAt:now(),cores:Object.fromEntries(Object.keys(CORES).map(c=>[c,Array.from({length:70},(_,i)=>({id:i+1,name:`Slot ${i+1}`,content:'',updatedAt:null}))]))};}
export function insertCore(memory,record){
  const result=clone(memory),slots=result?.cores?.[record.core];
  if(!Array.isArray(slots)||slots.length!==70)throw Error('Jádro nemá očekávaných 70 slotů. Zápis zastaven.');
  const duplicate=slots.findIndex(s=>s?.glyphMemoryId===record.id&&s?.content===record.body);
  if(duplicate>=0)return {memory:result,index:duplicate,duplicate:true};
  const index=slots.findIndex((s,i)=>!s||(!String(s.content||'').trim()&&(!s.name||s.name===`Slot ${i+1}`)));
  if(index<0)throw Error('V tomto jádře je všech 70 slotů obsazených. Záznam zůstává v komoře.');
  slots[index]={...(slots[index]||{}),id:index+1,name:record.title,content:record.body,glyphs:record.glyphs,tags:record.tags,source:record.source,glyphMemoryId:record.id,updatedAt:now()};
  result.updatedAt=now();return {memory:result,index,duplicate:false};
}
