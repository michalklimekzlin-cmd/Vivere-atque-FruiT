// VAFT společné jádro
const VAFT_CHANNEL = 'vaft-channel';
const VAFT_STORAGE_KEY = 'vaft-state';

// výchozí stav
const defaultState = {
  reviaMode: 'angel',     // 'angel' | 'daemon'
  notes: {},              // můžeš sem časem sypat zápisníky podle jména
  lastSender: null,
  ts: Date.now()
};

// načti ze storage
function vaftLoad() {
  try {
    const raw = localStorage.getItem(VAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { ...defaultState };
  } catch (e) {
    return { ...defaultState };
  }
}

// ulož a rozšiř
function vaftSave(patch = {}) {
  const current = vaftLoad();
  const next = { ...current, ...patch, ts: Date.now() };
  localStorage.setItem(VAFT_STORAGE_KEY, JSON.stringify(next));
  // rozešli info ostatním oknům
  if (window.BroadcastChannel) {
    const bc = new BroadcastChannel(VAFT_CHANNEL);
    bc.postMessage(next);
    bc.close();
  }
  return next;
}

// poslouchání změn
function vaftSubscribe(handler) {
  // hned mu pošli aktuální stav
  handler(vaftLoad());
  if (window.BroadcastChannel) {
    const bc = new BroadcastChannel(VAFT_CHANNEL);
    bc.onmessage = (ev) => handler(ev.data);
    return () => bc.close();
  }
  return () => {};
}

// helpery pro konkrétní věci
function vaftSetReviaMode(mode, sender = 'unknown') {
  return vaftSave({ reviaMode: mode, lastSender: sender });
}

window.VAFT = {
  load: vaftLoad,
  save: vaftSave,
  subscribe: vaftSubscribe,
  setReviaMode: vaftSetReviaMode,
};
