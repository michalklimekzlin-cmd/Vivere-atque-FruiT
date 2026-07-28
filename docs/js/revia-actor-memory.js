"use strict";

/*
  Revia — pracovní paměť
  ----------------------
  Místní index CHT 360°‰. Revia do něj zapisuje jen poznámky, které jí
  člověk výslovně předá. Sloty, pokojíčky a vlastní Glyphy pouze čte
  z tohoto stejného zařízení; nic neodesílá do sítě a nic sama nemaže.
*/

const ACTOR_MEMORY_KEY = "cht360_revia_actor_memory_v1";
const TRACE_MEMORY_KEY = "cht360_revia_memory_traces_v1";
const MEMORY_KEYS = Object.freeze(["cht360_pamet_v1", "vaft_pamet_v1"]);
const ROOMS_KEY = "cht360_glyph_rooms_v2";
const CUSTOM_GLYPHS_KEY = "cht360_glyph_drums_custom_v1";
const GLYPH_KEYS = Object.freeze([
  CUSTOM_GLYPHS_KEY,
  "cht360_glyph_drums_kostra_v1"
]);
const MAX_NOTES = 120;
const MAX_TRACES = 160;
const MAX_NOTE_LENGTH = 1_600;
const MAX_LIVE_ENTRIES = 180;

const CORE_NAMES = Object.freeze({
  earth: "Země",
  language: "Jazyk",
  game: "Hra",
  control: "iPhone 14"
});

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn("[Revia] Místní paměť se nepodařilo přečíst.", error);
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("[Revia] Místní data se nepodařilo uložit.", error);
    return false;
  }
}

function cleanText(value, limit = MAX_NOTE_LENGTH) {
  return String(value || "").replace(/\u0000/g, "").trim().slice(0, limit);
}

function normalise(value) {
  return cleanText(value, 8_000)
    .toLocaleLowerCase("cs-CZ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function makeId() {
  return "revia-note-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

function loadNotes() {
  const saved = readJson(ACTOR_MEMORY_KEY, null);

  if (!saved || !Array.isArray(saved.notes)) return [];

  return saved.notes
    .filter(note => note && typeof note.text === "string")
    .map(note => ({
      id: cleanText(note.id, 96) || makeId(),
      text: cleanText(note.text),
      source: cleanText(note.source, 160) || "ručně uložená poznámka",
      tags: Array.isArray(note.tags) ? note.tags.map(tag => cleanText(tag, 48)).filter(Boolean).slice(0, 12) : [],
      status: note.status === "archived" ? "archived" : "active",
      createdAt: typeof note.createdAt === "string" ? note.createdAt : new Date().toISOString(),
      updatedAt: typeof note.updatedAt === "string" ? note.updatedAt : new Date().toISOString(),
      archivedAt: typeof note.archivedAt === "string" ? note.archivedAt : null
    }))
    .slice(-MAX_NOTES);
}

function saveNotes(notes) {
  try {
    localStorage.setItem(ACTOR_MEMORY_KEY, JSON.stringify({
      version: 2,
      updatedAt: new Date().toISOString(),
      notes: notes.slice(-MAX_NOTES)
    }));
    return true;
  } catch (error) {
    console.warn("[Revia] Pracovní paměť se nepodařilo uložit.", error);
    return false;
  }
}

function cleanTrace(value) {
  if (!value || typeof value !== "object") return null;
  const text = cleanText(value.text, 360);
  if (!text) return null;

  return {
    id: cleanText(value.id, 96) || "revia-trace-" + Date.now().toString(36),
    kind: cleanText(value.kind, 48) || "změna",
    source: cleanText(value.source, 120) || "CHT 360°‰.",
    text,
    at: typeof value.at === "string" ? value.at : new Date().toISOString()
  };
}

function loadTraces() {
  const saved = readJson(TRACE_MEMORY_KEY, []);
  return Array.isArray(saved)
    ? saved.map(cleanTrace).filter(Boolean).slice(-MAX_TRACES)
    : [];
}

function saveTraces(traces) {
  return writeJson(TRACE_MEMORY_KEY, traces.slice(-MAX_TRACES));
}

function entryWords(value) {
  return normalise(value).split(/[^a-z0-9áčďéěíňóřšťúůýž]+/i).filter(word => word.length > 2).slice(0, 12);
}

function slotIsUsed(slot, index) {
  const name = cleanText(slot?.name || slot?.label, 160);
  const content = cleanText(slot?.content, 12_000);
  const id = Number(slot?.id) || index + 1;
  return Boolean(content || (name && name !== "Slot " + id));
}

function collectSlots() {
  for (const key of MEMORY_KEYS) {
    const memory = readJson(key, null);
    if (!memory?.cores || typeof memory.cores !== "object") continue;

    const entries = [];

    Object.entries(memory.cores).forEach(([coreId, rawCore]) => {
      const slots = Array.isArray(rawCore) ? rawCore : Array.isArray(rawCore?.slots) ? rawCore.slots : [];

      slots.forEach((slot, index) => {
        if (!slotIsUsed(slot, index) || entries.length >= MAX_LIVE_ENTRIES) return;

        const slotId = Number(slot?.id) || index + 1;
        const title = cleanText(slot?.name || slot?.label, 160) || "Slot " + slotId;
        const content = cleanText(slot?.content, 1_000);

        entries.push({
          id: "slot:" + coreId + ":" + slotId,
          kind: "slot",
          source: "Paměť · " + (CORE_NAMES[coreId] || coreId) + " / slot " + slotId,
          text: content ? title + "\n" + content : title,
          updatedAt: typeof slot?.updatedAt === "string" ? slot.updatedAt : memory.updatedAt || ""
        });
      });
    });

    return entries;
  }

  return [];
}

function collectRooms() {
  const rooms = readJson(ROOMS_KEY, []);
  if (!Array.isArray(rooms)) return [];

  return rooms
    .filter(room => room && typeof room === "object")
    .slice(0, 60)
    .map(room => ({
      id: "room:" + cleanText(room.id, 96),
      kind: "pokojíček",
      source: "Glyph pokojíček" + (cleanText(room.glyph, 32) ? " · " + cleanText(room.glyph, 32) : ""),
      text: [cleanText(room.name, 160), cleanText(room.note, 1_000)].filter(Boolean).join("\n"),
      updatedAt: typeof room.updatedAt === "string" ? room.updatedAt : ""
    }))
    .filter(entry => entry.text);
}

function collectCustomGlyphs() {
  const values = [];

  GLYPH_KEYS.forEach(key => {
    const saved = readJson(key, []);
    const source = Array.isArray(saved) ? saved : Array.isArray(saved?.tokens) ? saved.tokens : [];

    source.forEach(value => {
      const glyph = typeof value === "string" ? cleanText(value, 64) : cleanText(value?.glyph || value?.token, 64);
      if (glyph && !values.includes(glyph)) values.push(glyph);
    });
  });

  return values.slice(0, 64).map(glyph => ({
    id: "glyph:" + glyph,
    kind: "glyph",
    source: "Vlastní Glyph",
    text: glyph,
    updatedAt: ""
  }));
}

function scoreEntry(entry, queryWords, rawQuery) {
  const haystack = normalise([entry.source, entry.text, ...(entry.tags || [])].join(" "));
  let score = 0;

  queryWords.forEach(word => {
    if (haystack.includes(word)) score += 4;
  });

  if (rawQuery && normalise(entry.text).includes(normalise(rawQuery))) score += 7;
  if (entry.kind === "poznámka") score += 1;
  return score;
}

function formatEntry(entry) {
  const snippet = cleanText(entry.text, 340).replace(/\s+/g, " ");
  return "• " + entry.source + " — " + snippet;
}

export function createReviaActorMemory({ getDiscoveries = () => [] } = {}) {
  let notes = loadNotes();
  let traces = loadTraces();

  function currentEntries() {
    const discoveries = getDiscoveries()
      .filter(item => item?.status === "approved" && typeof item.text === "string")
      .slice(-32)
      .map(item => ({
        id: "discovery:" + cleanText(item.id || item.createdAt, 96),
        kind: "potvrzený objev",
        source: "Potvrzený objev · " + (cleanText(item.source, 160) || "místní schránka"),
        text: cleanText(item.text, 1_000),
        updatedAt: typeof item.approvedAt === "string" ? item.approvedAt : item.createdAt || ""
      }));

    return [
      ...notes
        .filter(note => note.status !== "archived")
        .map(note => ({ ...note, kind: "poznámka", source: "Revia · " + note.source })),
      ...traces.map(trace => ({
        id: "trace:" + trace.id,
        kind: "stopa CHT",
        source: trace.source + " · " + trace.kind,
        text: trace.text,
        updatedAt: trace.at
      })),
      ...collectSlots(),
      ...collectRooms(),
      ...collectCustomGlyphs(),
      ...discoveries
    ];
  }

  function remember(text, source = "ručně uložená poznámka") {
    const cleaned = cleanText(text);
    if (!cleaned) return { saved: false, reason: "empty" };

    const existing = notes.find(note => normalise(note.text) === normalise(cleaned));
    if (existing) {
      if (existing.status === "archived") {
        existing.status = "active";
        existing.archivedAt = null;
        existing.updatedAt = new Date().toISOString();
        return { saved: saveNotes(notes), existing: false, restored: true, entry: existing };
      }
      return { saved: true, existing: true, entry: existing };
    }

    const now = new Date().toISOString();
    const entry = {
      id: makeId(),
      text: cleaned,
      source: cleanText(source, 160) || "ručně uložená poznámka",
      tags: entryWords(cleaned),
      status: "active",
      createdAt: now,
      updatedAt: now,
      archivedAt: null
    };

    notes = [...notes, entry].slice(-MAX_NOTES);
    return { saved: saveNotes(notes), entry, existing: false };
  }

  function registerGlyph(value, note = "") {
    const glyph = cleanText(value, 64);
    if (!glyph) return { saved: false, reason: "empty" };

    const saved = readJson(CUSTOM_GLYPHS_KEY, []);
    const glyphs = Array.isArray(saved)
      ? saved.filter(item => typeof item === "string").map(item => cleanText(item, 64)).filter(Boolean)
      : [];
    const existing = glyphs.includes(glyph);
    const next = existing ? glyphs : [...glyphs, glyph].slice(-64);
    const glyphSaved = writeJson(CUSTOM_GLYPHS_KEY, next);
    const remembered = remember(
      note ? "Glyph " + glyph + "\n" + cleanText(note, 700) : "Glyph " + glyph,
      "Glyph vložený přes Revii"
    );

    if (glyphSaved && !existing) {
      window.dispatchEvent(new CustomEvent("cht.glyph.changed", {
        detail: { glyph, source: "Revia" }
      }));
    }

    return { saved: glyphSaved && remembered.saved, existing, glyph };
  }

  function search(query, limit = 6) {
    const rawQuery = cleanText(query, 900);
    const words = entryWords(rawQuery);
    if (!words.length && !rawQuery) return [];

    return currentEntries()
      .map(entry => ({ entry, score: scoreEntry(entry, words, rawQuery) }))
      .filter(item => item.score > 0)
      .sort((left, right) => right.score - left.score || String(right.entry.updatedAt).localeCompare(String(left.entry.updatedAt)))
      .slice(0, limit)
      .map(item => item.entry);
  }

  function overview() {
    const entries = currentEntries();
    const count = kind => entries.filter(entry => entry.kind === kind).length;
    const archivedCount = notes.filter(note => note.status === "archived").length;

    return [
      "Pracovní paměť Revii",
      "• ručně uložené poznámky: " + count("poznámka"),
      "• odložené poznámky v koši: " + archivedCount,
      "• místní stopy změn CHT: " + count("stopa CHT"),
      "• živé zápisy z Paměti CHT: " + count("slot"),
      "• Glyph pokojíčky: " + count("pokojíček"),
      "• vlastní Glyphy: " + count("glyph"),
      "• potvrzené objevy: " + count("potvrzený objev"),
      "Napiš „zapamatuj: …“ pro místní poznámku, „najdi v paměti: …“ pro hledání, „odlož paměť: …“ pro bezpečný koš nebo „vrať paměť: …“ pro obnovení. Revia nic sama neodesílá."
    ].join("\n");
  }

  function recordTrace(kind, text, source = "CHT 360°‰.") {
    const trace = cleanTrace({ kind, text, source, at: new Date().toISOString() });
    if (!trace) return { saved: false, reason: "empty" };

    const last = traces.at(-1);
    if (last && last.kind === trace.kind && last.text === trace.text && last.source === trace.source) {
      return { saved: true, existing: true, entry: last };
    }

    traces = [...traces, trace].slice(-MAX_TRACES);
    return { saved: saveTraces(traces), existing: false, entry: trace };
  }

  function matchesNotes(query, status) {
    const needle = normalise(query);
    if (!needle) return [];
    return notes.filter(note =>
      note.status === status &&
      (normalise(note.id) === needle || normalise(`${note.text} ${note.source} ${(note.tags || []).join(" ")}`).includes(needle))
    );
  }

  function moveNote(query, nextStatus) {
    const currentStatus = nextStatus === "archived" ? "active" : "archived";
    const matches = matchesNotes(query, currentStatus);
    if (!matches.length) return { saved: false, reason: "not-found" };
    if (matches.length > 1) return { saved: false, reason: "ambiguous", matches: matches.slice(0, 4) };

    const note = matches[0];
    note.status = nextStatus;
    note.archivedAt = nextStatus === "archived" ? new Date().toISOString() : null;
    note.updatedAt = new Date().toISOString();
    return { saved: saveNotes(notes), entry: note };
  }

  function archiveNote(query) {
    return moveNote(query, "archived");
  }

  function restoreNote(query) {
    return moveNote(query, "active");
  }

  function formatTraces(limit = 8) {
    if (!traces.length) return "Zatím nemám žádnou místní stopu změny CHT.";
    const formatter = new Intl.DateTimeFormat("cs-CZ", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
    return [
      "Místní stopy CHT:",
      ...traces.slice(-limit).reverse().map(trace => {
        const date = new Date(trace.at);
        const stamp = Number.isNaN(date.getTime()) ? "bez času" : formatter.format(date);
        return `• ${stamp} — ${trace.text}`;
      })
    ].join("\n");
  }

  function formatArchive() {
    const archived = notes.filter(note => note.status === "archived");
    if (!archived.length) return "Koš paměti je prázdný. Odložená poznámka se nemaže; můžeš ji kdykoli vrátit.";
    return [
      "Koš paměti Revii:",
      ...archived.slice(-8).reverse().map(note => "• " + cleanText(note.text, 240).replace(/\s+/g, " ")),
      "Pro návrat napiš „vrať paměť: přesný úryvek“."
    ].join("\n");
  }

  function formatSearch(query) {
    const found = search(query);

    if (!found.length) {
      return "V pracovní paměti jsem pro „" + cleanText(query, 120) + "“ nic konkrétního nenašla. Můžeš to uložit příkazem „zapamatuj: …“.";
    }

    return [
      "V pracovní paměti jsem našla:",
      ...found.map(formatEntry)
    ].join("\n");
  }

  function exportState() {
    return {
      version: 2,
      notes: notes.slice(-MAX_NOTES),
      traces: traces.slice(-MAX_TRACES)
    };
  }

  function importState(source) {
    const incoming = Array.isArray(source?.notes) ? source.notes : [];
    const known = new Set(notes.map(note => normalise(note.text)));
    const additions = incoming
      .filter(note => note && typeof note.text === "string" && !known.has(normalise(note.text)))
      .map(note => ({
        id: cleanText(note.id, 96) || makeId(),
        text: cleanText(note.text),
        source: cleanText(note.source, 160) || "importovaná poznámka",
        tags: Array.isArray(note.tags) ? note.tags.map(tag => cleanText(tag, 48)).filter(Boolean).slice(0, 12) : entryWords(note.text),
        status: note.status === "archived" ? "archived" : "active",
        createdAt: typeof note.createdAt === "string" ? note.createdAt : new Date().toISOString(),
        updatedAt: typeof note.updatedAt === "string" ? note.updatedAt : new Date().toISOString(),
        archivedAt: typeof note.archivedAt === "string" ? note.archivedAt : null
      }))
      .filter(note => note.text);

    const incomingTraces = Array.isArray(source?.traces) ? source.traces.map(cleanTrace).filter(Boolean) : [];
    const knownTraces = new Set(traces.map(trace => `${trace.at}|${trace.text}`));
    const traceAdditions = incomingTraces.filter(trace => !knownTraces.has(`${trace.at}|${trace.text}`));

    if (!additions.length && !traceAdditions.length) return { added: 0, tracesAdded: 0, saved: true };

    notes = [...notes, ...additions].slice(-MAX_NOTES);
    traces = [...traces, ...traceAdditions].slice(-MAX_TRACES);
    return {
      added: additions.length,
      tracesAdded: traceAdditions.length,
      saved: saveNotes(notes) && saveTraces(traces)
    };
  }

  return Object.freeze({
    remember,
    registerGlyph,
    recordTrace,
    archiveNote,
    restoreNote,
    search,
    overview,
    formatSearch,
    formatTraces,
    formatArchive,
    exportState,
    importState,
    getNotes: () => notes.slice(),
    getArchivedNotes: () => notes.filter(note => note.status === "archived").map(note => ({ ...note })),
    getTraces: () => traces.slice(),
    getLiveEntries: () => currentEntries().filter(entry => entry.kind !== "poznámka")
  });
}
