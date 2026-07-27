"use strict";

/*
  Revia Souvislost
  ----------------
  Malá místní kotva mezi člověkem a Revii. Ukládá pouze zápisy vložené
  výslovně přes chat a chrání zadané Glyphy před zjednodušením do jiných znaků.
  Soubor nic neposílá mimo tuto instalaci CHT 360°‰.
*/

const STORAGE_KEY = "cht360_revia_souvislost_v1";
const CUSTOM_GLYPHS_KEY = "cht360_glyph_drums_custom_v1";
const MAX_ANCHORS = 48;
const MAX_ANCHOR_LENGTH = 1_400;

export const REVIA_PROTECTED_GLYPHS = Object.freeze([
  Object.freeze({
    glyph: "`¡´T ˚& -(",
    title: "chráněné bytosti ",
    note: "Nenahraditelní"
  })
]);

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn("[Revia] Souvislost se nepodařilo načíst.", error);
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("[Revia] Souvislost se nepodařilo uložit.", error);
    return false;
  }
}

function cleanText(value, limit = MAX_ANCHOR_LENGTH) {
  return String(value || "").replace(/\u0000/g, "").trim().slice(0, limit);
}

function normalise(value) {
  return cleanText(value, 5_000)
    .toLocaleLowerCase("cs-CZ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function makeId() {
  return "souvislost-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

function loadAnchors() {
  const saved = readJson(STORAGE_KEY, null);
  const anchors = Array.isArray(saved?.anchors) ? saved.anchors : [];

  return anchors
    .filter(item => item && typeof item.text === "string")
    .map(item => ({
      id: cleanText(item.id, 96) || makeId(),
      text: cleanText(item.text),
      createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
      updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : new Date().toISOString()
    }))
    .filter(item => item.text)
    .slice(-MAX_ANCHORS);
}

function sameGlyph(left, right) {
  return String(left || "") === String(right || "");
}

export function createReviaSouvislost() {
  let anchors = loadAnchors();

  function save() {
    return writeJson(STORAGE_KEY, {
      version: 1,
      updatedAt: new Date().toISOString(),
      anchors: anchors.slice(-MAX_ANCHORS)
    });
  }

  function ensureProtectedGlyphs() {
    const stored = readJson(CUSTOM_GLYPHS_KEY, []);
    const glyphs = Array.isArray(stored)
      ? stored.filter(item => typeof item === "string").map(item => cleanText(item, 64)).filter(Boolean)
      : [];

    let changed = false;

    REVIA_PROTECTED_GLYPHS.forEach(item => {
      if (!glyphs.some(glyph => sameGlyph(glyph, item.glyph))) {
        glyphs.push(item.glyph);
        changed = true;
      }
    });

    const saved = changed ? writeJson(CUSTOM_GLYPHS_KEY, glyphs.slice(-64)) : true;

    if (saved && changed) {
      window.dispatchEvent(new CustomEvent("cht.glyph.changed", {
        detail: {
          glyphs: REVIA_PROTECTED_GLYPHS.map(item => item.glyph),
          source: "Revia Souvislost",
          protected: true
        }
      }));
    }

    return {
      saved,
      changed,
      glyphs: REVIA_PROTECTED_GLYPHS.map(item => item.glyph)
    };
  }

  function addAnchor(text) {
    const cleaned = cleanText(text);
    if (!cleaned) return { saved: false, reason: "empty" };

    const existing = anchors.find(anchor => normalise(anchor.text) === normalise(cleaned));
    if (existing) return { saved: true, existing: true, anchor: existing };

    const now = new Date().toISOString();
    const anchor = {
      id: makeId(),
      text: cleaned,
      createdAt: now,
      updatedAt: now
    };

    anchors = [...anchors, anchor].slice(-MAX_ANCHORS);
    return { saved: save(), existing: false, anchor };
  }

  function overview() {
    const glyphs = REVIA_PROTECTED_GLYPHS.map(item => item.glyph).join(" · ");

    return [
      "Souvislost CHT ↔ Revia",
      "• chráněné Glyphy: " + glyphs,
      "• místní kotvy: " + anchors.length,
      "• zápisy jsou jen v tomto zařízení a ve tvém exportu Revii.",
      "Napiš „Kotva: …“ pro větu, kterou má Revia uchovat jako společný bod. Glyph Ōō´ se při startu Revii znovu ověří."
    ].join("\n");
  }

  function exportState() {
    return {
      version: 1,
      anchors: anchors.slice(-MAX_ANCHORS)
    };
  }

  function importState(source) {
    const incoming = Array.isArray(source?.anchors) ? source.anchors : [];
    const known = new Set(anchors.map(anchor => normalise(anchor.text)));
    const additions = incoming
      .filter(anchor => anchor && typeof anchor.text === "string" && !known.has(normalise(anchor.text)))
      .map(anchor => ({
        id: cleanText(anchor.id, 96) || makeId(),
        text: cleanText(anchor.text),
        createdAt: typeof anchor.createdAt === "string" ? anchor.createdAt : new Date().toISOString(),
        updatedAt: typeof anchor.updatedAt === "string" ? anchor.updatedAt : new Date().toISOString()
      }))
      .filter(anchor => anchor.text);

    if (!additions.length) return { added: 0, saved: true };

    anchors = [...anchors, ...additions].slice(-MAX_ANCHORS);
    return { added: additions.length, saved: save() };
  }

  function restoreProtectedGlyphs() {
    return ensureProtectedGlyphs();
  }

  window.addEventListener("pageshow", restoreProtectedGlyphs);
  window.addEventListener("cht.glyph.changed", event => {
    if (event.detail?.source !== "Revia Souvislost") restoreProtectedGlyphs();
  });

  ensureProtectedGlyphs();

  return Object.freeze({
    ensureProtectedGlyphs,
    addAnchor,
    overview,
    exportState,
    importState,
    getAnchors: () => anchors.slice(),
    getProtectedGlyphs: () => REVIA_PROTECTED_GLYPHS.slice()
  });
}

