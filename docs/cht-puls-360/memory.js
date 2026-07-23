"use strict";

export const STORAGE_KEY = "cht360_puls_memory_v1";
export const CHANNEL_NAME = "cht360_puls_channel_v1";
export const WAYS = Object.freeze({
  local: "Lokální most",
  json: "JSON paměť",
  light: "Světelný puls",
  bridge: "IR / budoucí brána"
});

const ENTRY_LIMIT = 120;
const PULSE_LIMIT = 80;
const QUEUE_LIMIT = 40;
const TRASH_LIMIT = 90;
const SEED_LIMIT = 120;
const CLEANUP_LIMIT = 8;

/* Platný JSON přepsaný z dodaného registru; příkazy se pouze ukládají do fronty. */
export const IR_COMMANDS = Object.freeze({
  "0xF740BF": { "label": "On/Off", "cmd": "T=2", "rpt": true },
  "0xF700FF": { "label": "Speed +", "cmd": "SX=~16" },
  "0xF720DF": { "label": "Red", "cmnt": "Lava palette + primary, secondary and tertiary colors", "cmd": "FP=8&CL=hFF7F00&C2=hFF0000&C3=hCC3D60" },
  "0xF710EF": { "label": "Timer1", "cmnt": "Timer 60 min", "cmd": "NL=60&NT=0" },
  "0xF730CF": { "label": "Play", "cmnt": "prime example of a playlist that cycles every 180 seconds and continues to repeat", "cmd": { "playlist": { "ps": [1, 3, 5, 7, 11, 13, 17], "dur": 1800, "transition": 7, "repeat": 0, "end": 0 } } },
  "0xFF9867": { "label": "Bright+", "cmnt": "smaller steps at beginning, larger steps at the end", "cmd": "!incBrightness" },
  "0xF78877": { "label": "DIY1", "cmnt": "Preset 1, fallback to Saw(16) - Party(6) if it doesn't exist", "cmd": "!presetFallback", "PL": 1, "FX": 16, "FP": 6 }
});

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function hash(text) {
  let value = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return `P-${(value >>> 0).toString(16).toUpperCase().padStart(8, "0")}`;
}

function normalizeText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function cleanEntry(entry) {
  if (!entry || typeof entry.text !== "string") return null;
  const text = entry.text.trim().slice(0, 4000);
  if (!text) return null;
  return {
    id: String(entry.id || id()).slice(0, 80),
    text,
    source: String(entry.source || "místní stopa").slice(0, 120),
    at: String(entry.at || new Date().toISOString()).slice(0, 48)
  };
}

function fragmentText(text, size = 120) {
  const clean = String(text || "");
  const fragments = [];
  for (let i = 0; i < clean.length; i += size) {
    const part = clean.slice(i, i + size);
    fragments.push({ index: fragments.length, text: part, checksum: hash(part) });
  }
  return fragments;
}

function cleanTrashItem(item) {
  if (!item || !Array.isArray(item.fragments)) return null;
  const fragments = item.fragments
    .map((part, index) => ({
      index: Number.isFinite(part.index) ? part.index : index,
      text: String(part.text || "").slice(0, 180),
      checksum: String(part.checksum || hash(String(part.text || ""))).slice(0, 24)
    }))
    .filter(part => part.text);
  if (!fragments.length) return null;
  return {
    id: String(item.id || id()).slice(0, 80),
    kind: String(item.kind || "entry").slice(0, 40),
    source: String(item.source || "Samočistička").slice(0, 120),
    reason: String(item.reason || "uloženo do koše").slice(0, 160),
    at: String(item.at || new Date().toISOString()).slice(0, 48),
    checksum: String(item.checksum || hash(fragments.map(part => part.text).join(""))).slice(0, 24),
    excerpt: String(item.excerpt || fragments.map(part => part.text).join("").slice(0, 220)).slice(0, 260),
    fragments,
    meta: item.meta && typeof item.meta === "object" ? item.meta : {},
    restoredAt: item.restoredAt ? String(item.restoredAt).slice(0, 48) : ""
  };
}

function makeTrashItem(kind, text, source, reason, meta = {}) {
  const fullText = String(text || "");
  return cleanTrashItem({
    id: id(),
    kind,
    source,
    reason,
    at: new Date().toISOString(),
    checksum: hash(fullText),
    excerpt: normalizeText(fullText).slice(0, 220),
    fragments: fragmentText(fullText),
    meta
  });
}

function uniqueWords(text) {
  const seen = new Set();
  return normalizeText(text)
    .toLocaleLowerCase("cs-CZ")
    .split(/[\s,.;:!?()[\]{}"'`/\\|<>]+/)
    .map(word => word.trim())
    .filter(word => word.length > 1)
    .filter(word => {
      if (seen.has(word)) return false;
      seen.add(word);
      return true;
    })
    .slice(0, 16);
}

function glyphFrequency(text) {
  const map = new Map();
  for (const glyph of Array.from(String(text || ""))) {
    if (!glyph.trim()) continue;
    map.set(glyph, (map.get(glyph) || 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "cs-CZ"))
    .slice(0, 20)
    .map(([glyph, count]) => ({ glyph, count }));
}

function seedFromTrash(item) {
  const text = readTrashText(item);
  const words = uniqueWords(text);
  const glyphs = glyphFrequency(text);
  return {
    id: id(),
    trashId: item.id,
    at: new Date().toISOString(),
    checksum: hash(`${item.checksum}|${words.join("|")}`),
    title: words.slice(0, 4).join(" · ") || item.kind,
    phrase: words.slice(0, 10).join(" · "),
    glyphs,
    source: "Koš → Revia kompost",
    note: "Vzniklo z věci, kterou CHT nevymazala, ale proměnila na semínko mluvy."
  };
}

function cleanSeed(seed) {
  if (!seed || !seed.trashId) return null;
  return {
    id: String(seed.id || id()).slice(0, 80),
    trashId: String(seed.trashId).slice(0, 80),
    at: String(seed.at || new Date().toISOString()).slice(0, 48),
    checksum: String(seed.checksum || hash(String(seed.phrase || ""))).slice(0, 24),
    title: String(seed.title || "semínko").slice(0, 120),
    phrase: String(seed.phrase || "").slice(0, 400),
    glyphs: Array.isArray(seed.glyphs) ? seed.glyphs.slice(0, 20) : [],
    source: String(seed.source || "Koš → Revia kompost").slice(0, 120),
    note: String(seed.note || "").slice(0, 220)
  };
}

function normalizeState(raw) {
  const state = raw && typeof raw === "object" ? raw : {};
  return {
    version: 2,
    updatedAt: state.updatedAt || new Date().toISOString(),
    entries: Array.isArray(state.entries) ? state.entries.map(cleanEntry).filter(Boolean).slice(-ENTRY_LIMIT) : [],
    pulses: Array.isArray(state.pulses) ? state.pulses.filter(Boolean).slice(-PULSE_LIMIT) : [],
    bridgeQueue: Array.isArray(state.bridgeQueue) ? state.bridgeQueue.filter(Boolean).slice(-QUEUE_LIMIT) : [],
    trash: Array.isArray(state.trash) ? state.trash.map(cleanTrashItem).filter(Boolean).slice(-TRASH_LIMIT) : [],
    seeds: Array.isArray(state.seeds) ? state.seeds.map(cleanSeed).filter(Boolean).slice(-SEED_LIMIT) : [],
    cleanups: Array.isArray(state.cleanups) ? state.cleanups.filter(Boolean).slice(-CLEANUP_LIMIT) : []
  };
}

export function emptyState() {
  return normalizeState({});
}

export function loadState() {
  try {
    return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"));
  } catch {
    return emptyState();
  }
}

export function saveState(state) {
  state.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
}

export function createPulse(way, type, payload, source = "CHT Puls") {
  const base = { version: 1, id: id(), way, type, source, at: new Date().toISOString(), payload };
  return { ...base, checksum: hash(JSON.stringify(base)) };
}

export function addEntry(state, text, source = "místní stopa") {
  const entry = cleanEntry({ text, source });
  if (!entry?.text) return null;
  state.entries.push(entry);
  state.entries = state.entries.slice(-ENTRY_LIMIT);
  return entry;
}

export function receivePulse(state, pulse) {
  if (!pulse || typeof pulse !== "object" || !pulse.id || !pulse.checksum) return false;
  if (state.pulses.some(item => item.id === pulse.id)) return false;
  state.pulses.push(pulse);
  state.pulses = state.pulses.slice(-PULSE_LIMIT);
  return true;
}

export function readTrashText(item) {
  return (item?.fragments || [])
    .slice()
    .sort((a, b) => a.index - b.index)
    .map(part => part.text)
    .join("");
}

export function scanCleanup(state) {
  const seen = new Set();
  let emptyEntries = 0;
  let duplicateEntries = 0;
  for (const entry of state.entries || []) {
    const key = normalizeText(entry.text).toLocaleLowerCase("cs-CZ");
    if (!key) {
      emptyEntries += 1;
    } else if (seen.has(key)) {
      duplicateEntries += 1;
    } else {
      seen.add(key);
    }
  }
  return {
    emptyEntries,
    duplicateEntries,
    oldPulses: Math.max(0, (state.pulses || []).length - 60),
    oldBridgeItems: Math.max(0, (state.bridgeQueue || []).length - 24),
    trashTotal: (state.trash || []).length,
    seedsTotal: (state.seeds || []).length
  };
}

export function compostTrash(state) {
  const known = new Set((state.seeds || []).map(seed => seed.trashId));
  const created = [];
  for (const item of state.trash || []) {
    if (!item?.id || known.has(item.id)) continue;
    const seed = seedFromTrash(item);
    state.seeds.push(seed);
    known.add(item.id);
    created.push(seed);
  }
  state.seeds = state.seeds.map(cleanSeed).filter(Boolean).slice(-SEED_LIMIT);
  return created;
}

export function safeCleanup(state) {
  const moved = [];
  const seen = new Set();
  const keptEntries = [];

  for (const entry of state.entries || []) {
    const key = normalizeText(entry.text).toLocaleLowerCase("cs-CZ");
    if (!key) {
      const trashed = makeTrashItem("entry", entry.text || "", entry.source || "Paměť", "prázdná nebo nečitelná stopa", { entryId: entry.id });
      if (trashed) moved.push(trashed);
      continue;
    }
    if (seen.has(key)) {
      const trashed = makeTrashItem("entry", entry.text, entry.source || "Paměť", "duplicitní stopa proměněná na kompost", { entryId: entry.id });
      if (trashed) moved.push(trashed);
      continue;
    }
    seen.add(key);
    keptEntries.push(entry);
  }

  const oldPulses = (state.pulses || []).slice(0, Math.max(0, (state.pulses || []).length - 60));
  state.pulses = (state.pulses || []).slice(-60);
  for (const pulse of oldPulses) {
    const trashed = makeTrashItem("pulse", JSON.stringify(pulse, null, 2), pulse.source || "Puls", "starší puls uložený do střepů koše", { pulseId: pulse.id });
    if (trashed) moved.push(trashed);
  }

  const oldBridge = (state.bridgeQueue || []).slice(0, Math.max(0, (state.bridgeQueue || []).length - 24));
  state.bridgeQueue = (state.bridgeQueue || []).slice(-24);
  for (const queued of oldBridge) {
    const trashed = makeTrashItem("bridgeQueue", JSON.stringify(queued, null, 2), "IR / brána", "starší položka brány uložená do střepů koše", { queuedAt: queued.queuedAt });
    if (trashed) moved.push(trashed);
  }

  state.entries = keptEntries.slice(-ENTRY_LIMIT);
  state.trash = [...(state.trash || []), ...moved].map(cleanTrashItem).filter(Boolean).slice(-TRASH_LIMIT);
  const seeds = compostTrash(state);
  const report = { ...scanCleanup(state), moved: moved.length, seeds: seeds.length };
  state.cleanups = [
    ...(state.cleanups || []),
    { id: id(), at: new Date().toISOString(), moved: moved.length, seeds: seeds.length, trashIds: moved.map(item => item.id) }
  ].slice(-CLEANUP_LIMIT);
  return report;
}

export function restoreLastTrash(state) {
  const item = [...(state.trash || [])].reverse().find(entry => !entry.restoredAt);
  if (!item) return { ok: false, message: "Koš je prázdný nebo už je vše vrácené." };
  const text = readTrashText(item);
  let restored = false;
  if (item.kind === "pulse") {
    try { restored = receivePulse(state, JSON.parse(text)); } catch { restored = false; }
  } else if (item.kind === "bridgeQueue") {
    try {
      state.bridgeQueue.push(JSON.parse(text));
      state.bridgeQueue = state.bridgeQueue.slice(-QUEUE_LIMIT);
      restored = true;
    } catch {
      restored = false;
    }
  } else {
    restored = Boolean(addEntry(state, text, `obnoveno z koše · ${item.source}`));
  }
  if (restored) item.restoredAt = new Date().toISOString();
  return restored
    ? { ok: true, message: "Poslední střep byl vrácen zpátky do Paměti." }
    : { ok: false, message: "Střep zůstal v koši, ale nepodařilo se jej vrátit jako původní typ." };
}

export function createArchive(state) {
  return { kind: "CHT Puls 360°‰.", version: 2, createdAt: new Date().toISOString(), state: normalizeState(state) };
}

export function mergeArchive(state, raw) {
  if (!raw || raw.kind !== "CHT Puls 360°‰." || ![1, 2].includes(raw.version) || !raw.state) return false;
  const incoming = normalizeState(raw.state);
  const knownEntries = new Set(state.entries.map(item => `${item.at}|${item.text}`));
  const knownTrash = new Set((state.trash || []).map(item => item.checksum));
  const knownSeeds = new Set((state.seeds || []).map(seed => seed.checksum));

  for (const item of incoming.entries || []) {
    const clean = cleanEntry(item);
    if (clean && !knownEntries.has(`${clean.at}|${clean.text}`)) {
      state.entries.push(clean);
      knownEntries.add(`${clean.at}|${clean.text}`);
    }
  }
  for (const pulse of incoming.pulses || []) receivePulse(state, pulse);
  for (const item of incoming.trash || []) {
    const clean = cleanTrashItem(item);
    if (clean && !knownTrash.has(clean.checksum)) {
      state.trash.push(clean);
      knownTrash.add(clean.checksum);
    }
  }
  for (const seed of incoming.seeds || []) {
    const clean = cleanSeed(seed);
    if (clean && !knownSeeds.has(clean.checksum)) {
      state.seeds.push(clean);
      knownSeeds.add(clean.checksum);
    }
  }
  state.entries = state.entries.slice(-ENTRY_LIMIT);
  state.trash = state.trash.slice(-TRASH_LIMIT);
  state.seeds = state.seeds.slice(-SEED_LIMIT);
  return true;
}
