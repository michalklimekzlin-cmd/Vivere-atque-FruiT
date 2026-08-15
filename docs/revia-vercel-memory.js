"use strict";

/*
  Plná paměť repozitáře je záměrně mimo hlavní PWA:
  19 tisíc řádků zůstává na Vercelu a stáhne se až na výslovný pokyn v Revii.
*/

export const VERCEL_REPOSITORY_MEMORY_URL = "https://vivere-atque-frui-t.vercel.app/revia-repository-memory.js";

const STATUS_KEY = "cht360_vercel_repository_memory_status_v1";
let loadedModule = null;
let loading = null;

function savedStatus() {
  try {
    const value = JSON.parse(localStorage.getItem(STATUS_KEY) || "null");
    return value && typeof value === "object" ? value : null;
  } catch (_) {
    return null;
  }
}

function writeStatus(status) {
  try {
    localStorage.setItem(STATUS_KEY, JSON.stringify(status));
  } catch (_) {
    /* Stav připojení nesmí zastavit samotnou Revii. */
  }
}

function validate(module) {
  if (!module?.REVIA_REPOSITORY_MEMORY || typeof module.findRepositoryContent !== "function") {
    throw new Error("Vercel neposlal platnou paměť repozitáře.");
  }
  return module;
}

async function importFromVercel(force) {
  const url = force
    ? `${VERCEL_REPOSITORY_MEMORY_URL}?v=${Date.now()}`
    : VERCEL_REPOSITORY_MEMORY_URL;

  try {
    return validate(await import(url));
  } catch (firstError) {
    /* V některých Safari sestavách je spolehlivější importovat ověřený Blob. */
    const response = await fetch(url, { mode: "cors", cache: force ? "no-store" : "default" });
    if (!response.ok) throw new Error(`Vercel vrátil ${response.status}.`);
    const source = await response.text();
    const blob = new Blob([source], { type: "text/javascript" });
    const objectUrl = URL.createObjectURL(blob);
    try {
      return validate(await import(objectUrl));
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

export async function loadVercelRepositoryMemory({ force = false } = {}) {
  if (loadedModule && !force) return loadedModule;
  if (loading && !force) return loading;

  loading = importFromVercel(force)
    .then(module => {
      loadedModule = module;
      const snapshot = module.REVIA_REPOSITORY_MEMORY.snapshot || {};
      writeStatus({
        state: "loaded",
        source: VERCEL_REPOSITORY_MEMORY_URL,
        loadedAt: new Date().toISOString(),
        trackedFileCount: Number(snapshot.trackedFileCount) || 0,
        sourceLines: Number(snapshot.sourceLines) || 0
      });
      window.dispatchEvent(new CustomEvent("cht.revia.repository.loaded", { detail: getVercelRepositoryMemoryStatus() }));
      return module;
    })
    .catch(error => {
      writeStatus({ state: "error", source: VERCEL_REPOSITORY_MEMORY_URL, checkedAt: new Date().toISOString(), message: String(error?.message || error) });
      throw error;
    })
    .finally(() => { loading = null; });

  return loading;
}

export function getLoadedVercelRepositoryMemory() {
  return loadedModule?.REVIA_REPOSITORY_MEMORY || null;
}

export function getVercelRepositoryMemoryStatus() {
  const status = savedStatus() || { state: "idle", source: VERCEL_REPOSITORY_MEMORY_URL };
  return { ...status, loaded: Boolean(loadedModule) };
}

export async function searchVercelRepository(query, limit = 8) {
  const module = await loadVercelRepositoryMemory();
  return {
    memory: module.REVIA_REPOSITORY_MEMORY,
    results: module.findRepositoryContent(query, limit),
    text: module.formatRepositorySearch(query)
  };
}

export async function refreshVercelRepositoryMemory() {
  return loadVercelRepositoryMemory({ force: true });
}
