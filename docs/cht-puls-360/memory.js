"use strict";

export const STORAGE_KEY = "cht360_puls_memory_v1";
export const CHANNEL_NAME = "cht360_puls_channel_v1";
export const WAYS = Object.freeze({
  local: "Lokální most",
  json: "JSON paměť",
  light: "Světelný puls",
  bridge: "IR / budoucí brána"
});

/* Platný JSON přepsaný z dodaného registru; příkazy se pouze ukládají do fronty. */
export const IR_COMMANDS = Object.freeze({
  "0xF740BF": { "label": "On/Off", "cmd": "T=2", "rpt": true },
  "0xF700FF": { "label": "Speed +", "cmd": "SX=~16" },
  "0xF720DF": { "label": "Red", "cmnt": "Lava palette + primary, secondary and tertiary colors", "cmd": "FP=8&CL=hFF7F00&C2=hFF0000&C3=hCC3D60" },
  "0xF710EF": { "label": "Timer1", "cmnt": "Timer 60 min", "cmd": "NL=60&NT=0" },
  "0xF730CF": { "label": "Play", "cmnt": "prime example of a playlist that cycles every 180 seconds and continues to repeat", "cmd": { "playlist": { "ps": [1,3,5,7,11,13,17], "dur": 1800, "transition": 7, "repeat": 0, "end": 0 } } },
  "0xFF9867": { "label": "Bright+", "cmnt": "smaller steps at beginning, larger steps at the end", "cmd": "!incBrightness" },
  "0xF78877": { "label": "DIY1", "cmnt": "Preset 1, fallback to Saw(16) - Party(6) if it doesn't exist", "cmd": "!presetFallback", "PL": 1, "FX": 16, "FP": 6 }
});

function id(){return `${Date.now()}-${Math.random().toString(36).slice(2,8)}`}
function hash(text){let value=2166136261;for(let i=0;i<text.length;i+=1){value^=text.charCodeAt(i);value=Math.imul(value,16777619)}return `P-${(value>>>0).toString(16).toUpperCase().padStart(8,"0")}`}
function cleanEntry(entry){if(!entry||typeof entry.text!=="string")return null;return {id:String(entry.id||id()).slice(0,80),text:entry.text.trim().slice(0,4000),source:String(entry.source||"místní stopa").slice(0,120),at:String(entry.at||new Date().toISOString()).slice(0,48)}}

export function emptyState(){return {version:1,updatedAt:new Date().toISOString(),entries:[],pulses:[],bridgeQueue:[]}}
export function loadState(){try{const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");if(raw&&Array.isArray(raw.entries))return {version:1,updatedAt:raw.updatedAt||new Date().toISOString(),entries:raw.entries.map(cleanEntry).filter(Boolean).slice(-120),pulses:Array.isArray(raw.pulses)?raw.pulses.slice(-80):[],bridgeQueue:Array.isArray(raw.bridgeQueue)?raw.bridgeQueue.slice(-40):[]}}catch{}return emptyState()}
export function saveState(state){state.updatedAt=new Date().toISOString();localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
export function createPulse(way,type,payload,source="CHT Puls"){const base={version:1,id:id(),way,type,source,at:new Date().toISOString(),payload};return {...base,checksum:hash(JSON.stringify(base))}}
export function addEntry(state,text,source="místní stopa"){const entry=cleanEntry({text,source});if(!entry?.text)return null;state.entries.push(entry);state.entries=state.entries.slice(-120);return entry}
export function receivePulse(state,pulse){if(!pulse||typeof pulse!=="object"||!pulse.id||!pulse.checksum)return false;if(state.pulses.some(item=>item.id===pulse.id))return false;state.pulses.push(pulse);state.pulses=state.pulses.slice(-80);return true}
export function createArchive(state){return {kind:"CHT Puls 360°‰.",version:1,createdAt:new Date().toISOString(),state}}
export function mergeArchive(state,raw){if(!raw||raw.kind!=="CHT Puls 360°‰."||raw.version!==1||!raw.state)return false;const known=new Set(state.entries.map(item=>`${item.at}|${item.text}`));for(const item of raw.state.entries||[]){const clean=cleanEntry(item);if(clean&&!known.has(`${clean.at}|${clean.text}`)){state.entries.push(clean);known.add(`${clean.at}|${clean.text}`)}}for(const pulse of raw.state.pulses||[])receivePulse(state,pulse);state.entries=state.entries.slice(-120);return true}
