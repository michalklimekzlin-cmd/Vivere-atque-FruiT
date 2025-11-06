// VAFT společné jádro
const VAFT_CHANNEL = 'vaft-channel';
const VAFT_STORAGE_KEY = 'vaft-state';

// výchozí stav
const defaultState = {
  reviaMode: 'angel',     // 'angel' | 'daemon'
  notes: {},              // zápisníky pro různé postavy
  lastSender: null,
  ts: Date.now()
};

// načti ze storage
function vaftLoad() {
  try {
    const raw = localStorage.getItem(VAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { ...defaultState };
  } catch (e) {
    console.warn('VAFT load error', e);
    return { ...defaultState };
  }
}

// ulož a rozešli
function vaftSave(patch = {}) {
  const current = vaftLoad();
  const next = { ...current, ...patch, ts: Date.now() };
  localStorage.setItem(VAFT_STORAGE_KEY, JSON.stringify(next));
  // rozešli ostatním oknům
  if (window.BroadcastChannel) {
    const bc = new BroadcastChannel(VAFT_CHANNEL);
    bc.postMessage(next);
    bc.close();
  }
  return next;
}

// poslouchání změn
function vaftSubscribe(handler) {
  handler(vaftLoad()); // hned po načtení
  if (window.BroadcastChannel) {
    const bc = new BroadcastChannel(VAFT_CHANNEL);
    bc.onmessage = (ev) => handler(ev.data);
    return () => bc.close();
  }
  return () => {};
}

// přepínání Revia módu
function vaftSetReviaMode(mode, sender = 'unknown') {
  return vaftSave({ reviaMode: mode, lastSender: sender });
}

// vystav do globálu
window.VAFT = {
  load: vaftLoad,
  save: vaftSave,
  subscribe: vaftSubscribe,
  setReviaMode: vaftSetReviaMode,
};
