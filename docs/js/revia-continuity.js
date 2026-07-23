"use strict";

/*
  Revia Continuity
  ----------------
  Místní body obnovy a schránka objevů. Žádný obsah se odsud sám neposílá
  do sítě. Text z jiných chatů se uloží jen po vložení uživatelem a stane se
  znalostí Revii až po výslovném potvrzení.
*/

const CONTINUITY_KEY = "cht360_revia_continuity_v1";
const DISCOVERY_KEY = "cht360_revia_discoveries_v1";
const ARCHIVE_VERSION = 1;
const MAX_SNAPSHOTS = 8;
const MAX_DISCOVERIES = 32;

function readJSON(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function cleanText(value, limit = 12000) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function cleanDiscovery(value) {
  if (!value || typeof value !== "object") return null;
  const text = cleanText(value.text);
  if (!text) return null;
  return {
    id: cleanText(value.id, 120) || `objev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text,
    source: cleanText(value.source, 160) || "ručně vložený poznatek",
    status: value.status === "approved" ? "approved" : "pending",
    createdAt: cleanText(value.createdAt, 48) || new Date().toISOString(),
    approvedAt: value.status === "approved" ? cleanText(value.approvedAt, 48) || new Date().toISOString() : null
  };
}

function loadDiscoveries() {
  const saved = readJSON(DISCOVERY_KEY, []);
  return Array.isArray(saved)
    ? saved.map(cleanDiscovery).filter(Boolean).slice(-MAX_DISCOVERIES)
    : [];
}

export function createReviaContinuity(getPayload) {
  let discoveries = loadDiscoveries();

  function saveDiscoveries() {
    writeJSON(DISCOVERY_KEY, discoveries.slice(-MAX_DISCOVERIES));
  }

  function checkpoint(reason = "průběžné uložení") {
    const current = readJSON(CONTINUITY_KEY, { snapshots: [] });
    const snapshots = Array.isArray(current.snapshots) ? current.snapshots : [];
    const payload = typeof getPayload === "function" ? getPayload() : {};
    const snapshot = {
      at: new Date().toISOString(),
      reason: cleanText(reason, 160) || "průběžné uložení",
      payload
    };

    try {
      writeJSON(CONTINUITY_KEY, {
        version: ARCHIVE_VERSION,
        updatedAt: snapshot.at,
        snapshots: [...snapshots, snapshot].slice(-MAX_SNAPSHOTS)
      });
      return snapshot;
    } catch (error) {
      console.warn("[Revia] Bod obnovy se nepodařilo uložit.", error);
      return null;
    }
  }

  function addDiscovery(text, source) {
    const candidate = cleanDiscovery({ text, source, status: "pending" });
    if (!candidate) return null;
    discoveries.push(candidate);
    discoveries = discoveries.slice(-MAX_DISCOVERIES);
    saveDiscoveries();
    checkpoint("nový objev ve schránce");
    return candidate;
  }

  function approveLatest() {
    const candidate = [...discoveries].reverse().find(item => item.status === "pending");
    if (!candidate) return null;
    candidate.status = "approved";
    candidate.approvedAt = new Date().toISOString();
    saveDiscoveries();
    checkpoint("potvrzený objev");
    return candidate;
  }

  function getDiscoveries() {
    return discoveries.map(item => ({ ...item }));
  }

  function getApprovedDiscoveries() {
    return getDiscoveries().filter(item => item.status === "approved");
  }

  function createArchive() {
    return {
      kind: "CHT 360°‰. · Revia archive",
      version: ARCHIVE_VERSION,
      createdAt: new Date().toISOString(),
      note: "Lokální záloha Revii. Neobsahuje klíče API ani automaticky neodesílá data.",
      payload: typeof getPayload === "function" ? getPayload() : {},
      discoveries: getDiscoveries()
    };
  }

  function readArchive(raw) {
    let archive;
    try {
      archive = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return null;
    }
    if (!archive || typeof archive !== "object" || archive.version !== ARCHIVE_VERSION || !archive.payload) return null;

    const importedDiscoveries = Array.isArray(archive.discoveries)
      ? archive.discoveries.map(cleanDiscovery).filter(Boolean)
      : [];

    return {
      payload: archive.payload,
      discoveries: importedDiscoveries.slice(-MAX_DISCOVERIES)
    };
  }

  function mergeDiscoveries(items) {
    const known = new Set(discoveries.map(item => `${item.createdAt}|${item.text}`));
    for (const item of items || []) {
      const clean = cleanDiscovery(item);
      if (!clean) continue;
      const identity = `${clean.createdAt}|${clean.text}`;
      if (!known.has(identity)) {
        discoveries.push(clean);
        known.add(identity);
      }
    }
    discoveries = discoveries.slice(-MAX_DISCOVERIES);
    saveDiscoveries();
  }

  async function storageStatus(requestPersistence = false) {
    if (!navigator.storage) return { supported: false, persisted: false, usage: null, quota: null };
    let persisted = false;
    try {
      persisted = await navigator.storage.persisted();
      if (requestPersistence && !persisted && navigator.storage.persist) {
        persisted = await navigator.storage.persist();
      }
    } catch {
      // Stav zůstane false; aplikace dál funguje v běžném místním úložišti.
    }

    let usage = null;
    let quota = null;
    try {
      const estimate = await navigator.storage.estimate();
      usage = estimate.usage ?? null;
      quota = estimate.quota ?? null;
    } catch {
      // Odhad úložiště je pouze doplněk.
    }

    return { supported: true, persisted, usage, quota };
  }

  return Object.freeze({
    checkpoint,
    addDiscovery,
    approveLatest,
    getDiscoveries,
    getApprovedDiscoveries,
    createArchive,
    readArchive,
    mergeDiscoveries,
    storageStatus
  });
}
