// vaft.message.shell.js
// Bezpečnější klientský message-shell pro VAFT (HMAC + lockdown fallback).
// Vlož do repozitáře a načti v indexu před hlavoun/viri/pikos.

(function (global) {
  const VAFT = global.VAFT = global.VAFT || {};
  const STORE = window.localStorage || {};
  const TAG = 'vaft-lt-1';
  const BREACH_KEY = 'VAFT_breach_count';
  const COUNTER_KEY = 'VAFT_msg_counter';
  const SALT_KEY = 'VAFT_pbkdf2_salt';
  const LOCK_KEY = 'VAFT_lockdown';

  const DICT = {
    missing: 'deest',
    file: 'tabella',
    network: 'rete',
    core: 'cor',
    agent: 'agens',
    hello: 'salve',
    world: 'mundus',
    ok: 'bene',
    error: 'vitium',
    need: 'opus-est',
    ready: 'paratus'
  };

  function toLatin(text){
    if(!text) return '';
    return String(text).split(/\s+/).map(w => {
      const k = w.toLowerCase().replace(/[,.:;!?]/g,'');
      return DICT[k] || ('la-'+k);
    }).join(' ');
  }

  function getOrCreateSalt(){
    let s = STORE[SALT_KEY];
    if (!s) {
      const arr = crypto.getRandomValues(new Uint8Array(12));
      s = Array.from(arr).map(b=>('0'+b.toString(16)).slice(-2)).join('');
      try { STORE[SALT_KEY] = s; } catch(e){ console.warn('vaft: cant store salt'); }
    }
    return hexToBuf(s);
  }

  function hexToBuf(hex){
    if(!hex) return new Uint8Array();
    const len = hex.length/2;
    const out = new Uint8Array(len);
    for(let i=0;i<len;i++) out[i]=parseInt(hex.substr(i*2,2),16);
    return out;
  }
  function bufToHex(buf){
    return Array.from(new Uint8Array(buf)).map(b=>('0'+b.toString(16)).slice(-2)).join('');
  }

  async function deriveKey(passphrase){
    const salt = getOrCreateSalt();
    const enc = new TextEncoder();
    const base = await crypto.subtle.importKey('raw', enc.encode(passphrase), {name:'PBKDF2'}, false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({
      name: 'PBKDF2',
      salt,
      iterations: 120000,
      hash: 'SHA-256'
    }, base, { name: 'HMAC', hash: 'SHA-256', length: 256 }, false, ['sign','verify']);
    return key;
  }

  async function signPayload(key, obj){
    const enc = new TextEncoder();
    const json = JSON.stringify(obj);
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(json));
    return bufToHex(sig);
  }

  async function verifyPayload(key, obj, hexSig){
    try{
      const enc = new TextEncoder();
      const json = JSON.stringify(obj);
      const sigBuf = hexToBuf(hexSig);
      return await crypto.subtle.verify('HMAC', key, sigBuf, enc.encode(json));
    } catch(e){ return false; }
  }

  function nextCounter(){
    let c = parseInt(STORE[COUNTER_KEY]||'0',10);
    c = c + 1;
    try{ STORE[COUNTER_KEY] = String(c); }catch(e){}
    return c;
  }

  function incrementBreach(){
    let b = parseInt(STORE[BREACH_KEY]||'0',10);
    b++;
    try{ STORE[BREACH_KEY] = String(b); }catch(e){}
    return b;
  }
  function setLockdown(on){
    try{ STORE[LOCK_KEY] = on ? '1' : '0'; }catch(e){}
  }
  function isLockdown(){
    return STORE[LOCK_KEY] === '1';
  }

  const listeners = {}; // name => [fn,...]

  function subscribe(name,fn){
    if(!listeners[name]) listeners[name]=[];
    listeners[name].push(fn);
  }

  async function deliver(rawMsg){
    if (isLockdown()) {
      notifyLockdown(rawMsg);
      return;
    }

    if(!VAFT._keyObj){
      naiveDeliver(rawMsg, true);
      return;
    }

    const payloadWrapped = rawMsg.payloadWrapped || rawMsg;
    const signature = payloadWrapped.signature || rawMsg.signature || '';

    const ok = await verifyPayload(VAFT._keyObj, {
      from: payloadWrapped.from,
      to: payloadWrapped.to,
      payload: payloadWrapped.payload,
      counter: payloadWrapped.counter,
      ts: payloadWrapped.ts
    }, signature);

    if(!ok){
      const breaches = incrementBreach();
      if (breaches >= 3){
        setLockdown(true);
        notifyLockdown(rawMsg, {reason:'signature_failed', breaches});
      } else {
        notifyFallback(rawMsg, {breaches});
      }
      return;
    }

    const to = payloadWrapped.to;
    if(listeners[to]){
      listeners[to].forEach(fn=>{
        try{ fn(payloadWrapped); }catch(e){ console.warn(e); }
      });
    }

    const vent = document.getElementById('vaft-world-detail') || document.getElementById('hlavoun-chat');
    if(vent){
      const line = document.createElement('div');
      line.style.fontSize = '.64rem'; line.style.opacity = '.9';
      line.innerHTML = `📩 ${payloadWrapped.from}→${payloadWrapped.to}: ${payloadWrapped.payload?.text || payloadWrapped.payload?.type}`;
      vent.appendChild(line);
      vent.scrollTop = vent.scrollHeight;
    }
  }

  function naiveDeliver(rawMsg, warned){
    const w = rawMsg.payloadWrapped || rawMsg;
    const to = w.to;
    if(listeners[to]){
      listeners[to].forEach(fn=>{ try{ fn(w); }catch(e){console.warn(e)} });
    }
    if(!warned){
      console.warn('VAFT.msg: delivered without verification (init required).');
    }
  }

  function notifyFallback(rawMsg, info){
    const w = rawMsg.payloadWrapped || rawMsg;
    const vent = document.getElementById('vaft-world-detail') || document.getElementById('hlavoun-chat');
    if(vent){
      const n = document.createElement('div');
      n.style.fontSize='.64rem'; n.style.opacity='.85';
      n.innerHTML = `⚠️ Fallback: ${w.from}→${w.to}: ${toLatin(w.payload?.text || w.payload?.type)} <small style="opacity:.5">[breaches:${STORE[BREACH_KEY]||0}]</small>`;
      vent.appendChild(n); vent.scrollTop = vent.scrollHeight;
    }
  }

  function notifyLockdown(rawMsg, info){
    const vent = document.getElementById('vaft-world-detail') || document.getElementById('hlavoun-chat');
    if(vent){
      const n = document.createElement('div');
      n.style.fontSize='.72rem'; n.style.opacity='1';
      n.style.color='#ffb6c1';
      n.innerHTML = `⛔ LOCKDOWN aktivní – komunikace přepnuta do latiny. Důvod: ${info?.reason||'security'}. Breaches: ${STORE[BREACH_KEY]||0}`;
      vent.appendChild(n); vent.scrollTop = vent.scrollHeight;
    }
  }

  async function send(from, to, payload){
    const counter = nextCounter();
    const wrapper = { from, to, payload, counter, ts: Date.now() };

    if(!VAFT._keyObj){
      console.warn('VAFT.msg not initialized - send unsigned (not recommended).');
      setTimeout(()=> naiveDeliver({payloadWrapped:wrapper}, false), 0);
      return;
    }

    const sig = await signPayload(VAFT._keyObj, wrapper);
    const payloadWrapped = Object.assign({}, wrapper, { signature: sig });

    setTimeout(()=> deliver({ payloadWrapped }), 0);

    return { ok:true, signature: sig, counter };
  }

  async function init(passphrase){
    if(!passphrase || typeof passphrase !== 'string') {
      throw new Error('passphrase required to init VAFT.msg');
    }
    VAFT._keyObj = await deriveKey(passphrase);
    try{ STORE[BREACH_KEY] = '0'; }catch(e){}
    setLockdown(false);
    console.log('VAFT.msg initialized.');
    return true;
  }

  VAFT.msg = {
    init, subscribe, send, toLatin, TAG,
    _internal: { deriveKey, signPayload, verifyPayload }
  };

})(window);
