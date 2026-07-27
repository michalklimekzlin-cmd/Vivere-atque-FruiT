"use strict";

/*
  Revia — pracovní paměť
  ----------------------
  Místní index CHT 360°‰. Revia do něj zapisuje jen poznámky, které jí
  člověk výslovně předá. Sloty, pokojíčky a vlastní Glyphy pouze čte
  z tohoto stejného zařízení; nic neodesílá do sítě a nic sama nemaže.
*/

const ACTOR_MEMORY_KEY = "cht360_revia_actor_memory_v1";
const MEMORY_KEYS = Object.freeze(["cht360_pamet_v1", "vaft_pamet_v1"]);
const ROOMS_KEY = "cht360_glyph_rooms_v2";
const CUSTOM_GLYPHS_KEY = "cht360_glyph_drums_custom_v1";
const GLYPH_KEYS = Object.freeze([
  CUSTOM_GLYPHS_KEY,
  "cht360_glyph_drums_kostra_v1"
]);
const MAX_NOTES = 120;
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
    console.warn("[Revia] Místní Glyph se nepodařilo uložit.", error);
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
      createdAt: typeof note.createdAt === "string" ? note.createdAt : new Date().toISOString(),
      updatedAt: typeof note.updatedAt === "string" ? note.updatedAt : new Date().toISOString()
    }))
    .slice(-MAX_NOTES);
}

function saveNotes(notes) {
  try {
    localStorage.setItem(ACTOR_MEMORY_KEY, JSON.stringify({
      version: 1,
      updatedAt: new Date().toISOString(),
      notes: notes.slice(-MAX_NOTES)
    }));
    return true;
  } catch (error) {
    console.warn("[Revia] Pracovní paměť se nepodařilo uložit.", error);
    return false;
  }
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
      ...notes.map(note => ({ ...note, kind: "poznámka", source: "Revia · " + note.source })),
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
    if (existing) return { saved: true, existing: true, entry: existing };

    const now = new Date().toISOString();
    const entry = {
      id: makeId(),
      text: cleaned,
      source: cleanText(source, 160) || "ručně uložená poznámka",
      tags: entryWords(cleaned),
      createdAt: now,
      updatedAt: now
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

    return [
      "Pracovní paměť Revii",
      "• ručně uložené poznámky: " + count("poznámka"),
      "• živé zápisy z Paměti CHT: " + count("slot"),
      "• Glyph pokojíčky: " + count("pokojíček"),
      "• vlastní Glyphy: " + count("glyph"),
      "• potvrzené objevy: " + count("potvrzený objev"),
      "Napiš „zapamatuj: …“ pro místní poznámku, „Glyph: …“ pro nový znak z klávesnice nebo „najdi v paměti: …“ pro hledání. Revia nic sama neodesílá."
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
      version: 1,
      notes: notes.slice(-MAX_NOTES)
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
        createdAt: typeof note.createdAt === "string" ? note.createdAt : new Date().toISOString(),
        updatedAt: typeof note.updatedAt === "string" ? note.updatedAt : new Date().toISOString()
      }))
      .filter(note => note.text);

    if (!additions.length) return { added: 0, saved: true };

    notes = [...notes, ...additions].slice(-MAX_NOTES);
    return { added: additions.length, saved: saveNotes(notes) };
  }

  return Object.freeze({
    remember,
    registerGlyph,
    search,
    overview,
    formatSearch,
    exportState,
    importState,
    getNotes: () => notes.slice(),
    getLiveEntries: () => currentEntries().filter(entry => entry.kind !== "poznámka")
  });
}
