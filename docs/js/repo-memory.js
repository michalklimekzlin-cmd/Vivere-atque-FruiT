"use strict";

/*
 * Atlas repozitáře · CHT 360°‰.
 *
 * Vědomě pracuje jen s localStorage stejného originu GitHub Pages.
 * Pravidlo bezpečí: uživatelský slot se nikdy nepřepisuje. Atlas doplní
 * jen prázdné sloty a pozná vlastní dříve uložené položky podle source.
 */

const STORAGE_KEY = "cht360_pamet_v1";
const LEGACY_KEY = "vaft_pamet_v1";
const ATLAS_KEY = "cht360_repository_atlas_v1";
const BACKUP_KEY = "cht360_repository_atlas_backup_v1";
const VERSION = 1;
const CORE_META = Object.freeze([
  { id: "earth", label: "Země", hint: "základy, mapy a souvislosti" },
  { id: "language", label: "Jazyk", hint: "Glyphy, texty a významy" },
  { id: "game", label: "Hra", hint: "světy, postavy a pokojíčky" },
  { id: "control", label: "Řízení", hint: "PWA, offline a propojení" }
]);

const REPOSITORY = Object.freeze({
  name: "Vivere-atque-FruiT",
  owner: "michalklimekzlin-cmd",
  url: "https://github.com/michalklimekzlin-cmd/Vivere-atque-FruiT",
  pages: "https://michalklimekzlin-cmd.github.io/Vivere-atque-FruiT/",
  branch: "main",
  publishedRoot: "docs/"
});

function entry(core, id, title, path, description, state = "součást repozitáře") {
  return Object.freeze({ core, id, title, path, description, state });
}

/* Mapa obsahuje jen rozcestníky, ne cizí obsah souborů ani soukromá data. */
const ATLAS = Object.freeze([
  entry("earth", "repo-root", "Kořen repozitáře", ".", "Hlavní domov projektu Vivere atque Fru'i¡'T / CHT 360°‰.; větev main.", "aktivní repozitář"),
  entry("earth", "knowledge-map", "Mapa znalostí", "KNOWLEDGE_MAP.md", "Orientační mapa jádra, učení, paměti, PWA, komponent a světů."),
  entry("earth", "readme", "README a dokumentace", "README.md · ARCHITECTURE.md", "První čtení pro cíl projektu, architekturu a souvislosti."),
  entry("earth", "vivere-core", "Vivere / Fru'i¡'T Core", "VIVERE_atque_FruiT_CORE.js", "Základní jádro starší vrstvy Vivere atque Fru'i¡'T."),
  entry("earth", "learning-engine", "Učící motor", "fruiT_learning_engine.js", "Vrstva pro lekce a učení; patří k historii vývoje repozitáře."),
  entry("earth", "memory-system", "Paměťový systém", "fruiT_memory_system.js", "Starší obecný paměťový systém vedle současné Paměti CHT."),
  entry("earth", "teacher-studio", "Teacher Studio", "TEACHER_STUDIO.html · vivere-studio/", "Rozhraní pro tvorbu lekcí a sémantických vazeb."),
  entry("earth", "source-root", "Zdrojová vrstva", "src/ · core/ · config/", "Kostra projektu, zdrojové části a konfigurace."),
  entry("earth", "components", "Komponenty", "components/", "Stavební díly, například Hlavoun, Viri a Pikoš."),
  entry("earth", "worlds", "Světová vrstva", "worlds/", "Samostatné světy a jejich experimenty; sem patří i Revia-Master."),
  entry("earth", "vaft-network", "VaFT Network", "VAFT-Network/", "Síťová a vztahová kostra mezi částmi projektu."),
  entry("earth", "mapa", "Mapa", "mapa/", "Rámec pro orientaci mezi světy, místy a moduly."),
  entry("earth", "uloziste", "Úložiště", "uloziste/", "Místo pro práci s ukládáním a obnovou dat."),
  entry("earth", "recycle", "Recycle", "Recycle/", "Prostor pro odložené či recyklované části; nemaže Paměť CHT."),
  entry("earth", "history", "Historie názvů", "Vivere · VaFT · VaFiT", "Starší názvy zůstávají jako historie; hlavní název je CHT 360°‰."),

  entry("language", "glyph-workshop", "Glyph dílna", "docs/glyph-cht-360/", "Tvorba a práce s Glyphy; ukládá vlastní znaky a jejich kontext."),
  entry("language", "glyph-rooms", "Glyph pokojíčky", "docs/glyph-pokojicku-cht-360/", "Trvalé pokojíčky s ID pro uložené Glyphy, poznámky a odkazy."),
  entry("language", "glyph-drums", "Glyph bubínky", "docs/bubinky/", "Rotující znaky a bubínky pro práci s Glyphy."),
  entry("language", "letter-engine", "Engine písmenka", "engine.pismenka/", "Pokusná vrstva znaků, písmen a jejich skládání."),
  entry("language", "mluva", "Mluva CHT", "docs/mluva-cht-360/", "Lokální mluvící a učící se vrstva CHT; historie a lekce zůstávají v prohlížeči."),
  entry("language", "mluva-alt", "Mluva – pracovní varianta", "docs/36O°‰./", "Samostatná pracovní varianta Mluvy se čtením Paměti CHT."),
  entry("language", "revia-personality", "Revia · osobnost", "Revia/revia-personality.md", "Textová osobnost a tón Revia vrstvy."),
  entry("language", "revia-actor-memory", "Revia · paměť aktéra", "docs/js/revia-actor-memory.js", "Lokální paměťový most pro Revia vrstvu."),
  entry("language", "revia-knowledge", "Revia · základní znalosti", "docs/js/revia-zakladni-znalosti.js", "Základní poznámky pro Revia v rámci CHT."),
  entry("language", "necesstina", "NeČeština CHT", "docs/necesstina-cht-360/", "Plánovaná česká jazyková vrstva.", "cesta je zatím označená k doplnění"),
  entry("language", "glyph-bridge", "Most Glyph ↔ Mluva", "docs/mluva-cht-360/cht-glyph-bridge.js", "Most mezi Mluvou a Glyphy, pokud oba moduly běží na stejné adrese."),
  entry("language", "candidate-mluva", "Kandidát Mluvy", "docs/js/candidate-mluva-cht.js", "Pracovní kandidát pro napojení Mluvy do CHT."),
  entry("language", "utf8", "Čeština a UTF-8", "celý projekt", "Texty, názvy a Glyphy mají zůstávat v UTF-8, aby se nerozbíjely znaky."),

  entry("game", "revia-master", "Revia Master", "worlds/Revia-Master/", "Samostatný svět Revia; jeho README popisuje vlastní PWA vrstvu."),
  entry("game", "signal-core", "VaFT Signal Core", "VaFT-Planets-SignalCore/", "Planety, čtyři světy a signální jádro."),
  entry("game", "signal-tower", "Signal Tower", "VaFT-Planets-SignalTower/", "Věž pro pulsy, orientaci a propojení signálů."),
  entry("game", "signal-360", "Signal 360", "docs/signal-360/", "PWA modul signálu v publikované vrstvě docs/."),
  entry("game", "globe", "Globe a oběh", "vaft-ring.html · vaft-portal-frame.html", "Scénická vrstva oběhu, kruhu a vstupního rámu."),
  entry("game", "rooms", "Pokojíčky CHT", "cht360-pokojíčky · docs/glyph-pokojicku-cht-360/", "Místa pro Glyphy, nápady a budoucí miniaplikace."),
  entry("game", "cht-puls", "Puls CHT 360°‰.", "docs/cht-puls-360/", "Samostatný puls se sdílenou pamětí, JSONem a Košem · Kompostem · Revia."),
  entry("game", "vaft-game", "VAFT Game", "VAFT-Game/", "Herní experiment a prostor pro pravidla, úkoly a postup."),
  entry("game", "hlavoun", "Hlavoun", "Hlavoun/ · components/Hlavoun/", "Postava a její komponentová podoba."),
  entry("game", "braska-hlava", "Bráška Hlava", "Braska-Hlava/", "Dashboard a pracovní hlava projektu."),
  entry("game", "vivere-world", "Vivere", "Vivere/", "Samostatný svět ve větvi Vivere."),
  entry("game", "vafit-gallery", "VaFiT galerie", "VafiT-gallery/", "Galerijní prostor pro VaFiT motivy a výstupy."),
  entry("game", "comet", "VAFT Comet", "VAFT-Comet/", "Samostatná kometová varianta světa."),
  entry("game", "jizva", "VAFT Jizva", "VAFT-Jizva/", "Samostatný světový fragment."),
  entry("game", "doll", "VAFT Doll", "VAFT-Doll/", "Postavový experiment."),
  entry("game", "lady", "VAFT Lady", "VAFT-Lady/", "Postavový experiment."),
  entry("game", "girls", "VAFT Girls", "Vivere/ /VAFT-Girls/", "Samostatný postavový prostor v repozitáři."),
  entry("game", "bicak", "Biçak", "components/Bicak/ · Bicak-Supreme-Edition/", "Komponenta a samostatná varianta Biçaku."),
  entry("game", "ai-hero", "AI Hero Playground", "AI-Hero-Playground/", "Hřiště pro AI postavy a prototypy."),
  entry("game", "letter-lab", "VAFT LetterLab", "VAFT-LetterLab/", "Laboratoř písmen ve světové vrstvě."),
  entry("game", "atlas", "3I ATLAS", "3I-ATLAS/", "Samostatný atlasový svět."),
  entry("game", "legacy-glyph", "Legacy Glyph Core", "worlds/legacy-glyph-core/", "Starší jádro Glyphů; uchované jako historie."),
  entry("game", "michal-ai", "Michal AI Al Klimek", "Michal-AI-Al-Klimek/", "Samostatná osobní/narativní část repozitáře."),

  entry("control", "docs-root", "Publikovaná vrstva", "docs/", "Aktivní kořen GitHub Pages pro CHT a propojené PWA moduly.", "aktivní nasazení"),
  entry("control", "pages", "GitHub Pages", "main + docs/", "Publikace běží z větve main a složky docs/."),
  entry("control", "cht-memory", "Paměť CHT", "docs/js/aplikace.js · docs/js/app.js", "Čtyři jádra Paměti, sloty, import, export a místní ukládání."),
  entry("control", "memory-key", "Klíč Paměti", "localStorage: cht360_pamet_v1", "Hlavní lokální klíč Paměti CHT; automaticky se nikam neposílá."),
  entry("control", "snapshots", "Snímky Paměti", "localStorage: cht360_pamet_snapshots_v1", "Poslední snímky pro bezpečné načtení a návrat."),
  entry("control", "network", "CHT 360 Network", "docs/js/cht-360-network.js", "Společná síť pro registraci modulů, snímky a bezpečná obnovení."),
  entry("control", "chybozrout", "ChyboŽrout", "docs/js/cht-chybozrout.js", "Kontrola a bezpečná oprava bez automatického přepsání uživatelských dat."),
  entry("control", "cache-bridge", "Cache most", "docs/js/chybozrout-cache-bridge.js", "Pomocný most mezi opravou, cache a zachycením stavu."),
  entry("control", "scan", "Skenování CHT", "docs/js/ch-scany.js", "Skenovací a kontrolní vrstva pro stav CHT."),
  entry("control", "life", "Život a puls", "docs/js/cht-zivot", "Pět pulzů: Země, Jazyk, Hra, Řízení a střed CHT."),
  entry("control", "pwa", "PWA soubory", "manifest.json · manifest.webmanifest", "Instalace aplikace, název, barva a ikony."),
  entry("control", "worker-current", "Service worker", "docs/service-worker.js", "Cílový worker pro hlavní CHT a offline cache.", "označeno jako cílová cesta"),
  entry("control", "worker-legacy", "Starý worker", "docs/sw.js", "Starší worker je ponechaný kvůli bezpečné migraci.", "neodstraňovat při opravě"),
  entry("control", "offline-assets", "Offline cache", "docs/offline-cashe-assets.json", "Seznam podkladů pro dostupnost PWA bez připojení."),
  entry("control", "migrations", "Migrace Paměti", "cht360_pamet_v1 · vaft_pamet_v1", "CHT umí číst současný i starší klíč a sloučit použité sloty."),
  entry("control", "storage-boundary", "Hranice ukládání", "stejný origin Pages", "Jiné domény a jiné instalace PWA nesdílejí localStorage automaticky."),
  entry("control", "import-export", "Import a export", "Paměť CHT", "Paměť lze exportovat/importovat jako JSON; je to cesta mezi instalacemi."),
  entry("control", "repository-atlas", "Atlas repozitáře", "repository-memory/", "Tento modul: bezpečně doplní atlas do prázdných slotů a uloží zálohu."),
  entry("control", "icons-watch", "Kontrola ikon", "docs/bubinky/icons/bubinky.svg · docs/signal-360/icons/vafit-360.svg", "Tyto dvě ikony byly označené k doplnění.", "označeno k opravě")
]);

const $ = id => document.getElementById(id);
const elements = {
  cores: $("cores"),
  state: $("memory-state"),
  status: $("status"),
  count: $("atlas-count"),
  summary: $("atlas-summary"),
  list: $("atlas-list"),
  fill: $("fill"),
  download: $("download"),
  origin: $("origin")
};

let lastResult = null;

initialise();

function initialise() {
  elements.origin.textContent = `Zdroj: ${REPOSITORY.owner}/${REPOSITORY.name} · ${REPOSITORY.branch} · GitHub Pages z ${REPOSITORY.publishedRoot}`;
  renderAtlas();
  renderMemory();
  elements.fill.addEventListener("click", fillFreeSlots);
  elements.download.addEventListener("click", downloadAtlas);
  window.addEventListener("storage", event => {
    if ([STORAGE_KEY, LEGACY_KEY].includes(event.key)) renderMemory();
  });
  registerServiceWorker();
}

function now() { return new Date().toISOString(); }

function parse(raw) {
  try {
    const value = raw ? JSON.parse(raw) : null;
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
}

function readRaw(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function slotsFor(memory, coreId) {
  const core = memory?.cores?.[coreId];
  if (Array.isArray(core)) return core;
  if (Array.isArray(core?.slots)) return core.slots;
  return [];
}

function makeSlot(index) {
  return { id: index + 1, name: `Slot ${index + 1}`, content: "", createdAt: null, updatedAt: null };
}

function isUsed(slot, index) {
  const value = slot && typeof slot === "object" ? slot : {};
  const name = String(value.name || value.label || "").trim();
  const content = String(value.content || "").trim();
  return Boolean(content || (name && name !== `Slot ${index + 1}`));
}

function blankMemory() {
  const createdAt = now();
  return {
    version: 3,
    createdAt,
    updatedAt: createdAt,
    cores: Object.fromEntries(CORE_META.map(core => [core.id, Array.from({ length: 70 }, (_, index) => makeSlot(index))]))
  };
}

function normaliseMemory(source) {
  const seed = source && typeof source === "object" && source.cores ? source : blankMemory();
  const result = {
    ...seed,
    version: Math.max(3, Number(seed.version) || 0),
    createdAt: typeof seed.createdAt === "string" ? seed.createdAt : now(),
    updatedAt: typeof seed.updatedAt === "string" ? seed.updatedAt : now(),
    cores: {}
  };
  CORE_META.forEach(core => {
    const sourceSlots = slotsFor(seed, core.id);
    const capacity = Math.max(70, sourceSlots.length || 0);
    result.cores[core.id] = Array.from({ length: capacity }, (_, index) => {
      const previous = sourceSlots[index];
      const fallback = makeSlot(index);
      if (!previous || typeof previous !== "object") return fallback;
      return {
        ...previous,
        id: index + 1,
        name: String(previous.name || previous.label || fallback.name).trim() || fallback.name,
        content: typeof previous.content === "string" ? previous.content : "",
        createdAt: typeof previous.createdAt === "string" ? previous.createdAt : null,
        updatedAt: typeof previous.updatedAt === "string" ? previous.updatedAt : null
      };
    });
  });
  return result;
}

function loadMemory() {
  const main = parse(readRaw(STORAGE_KEY));
  const legacy = parse(readRaw(LEGACY_KEY));
  if (main?.cores) return { memory: normaliseMemory(main), source: STORAGE_KEY, legacy: Boolean(legacy?.cores) };
  if (legacy?.cores) return { memory: normaliseMemory(legacy), source: LEGACY_KEY, legacy: true };
  return { memory: normaliseMemory(null), source: "nová Paměť", legacy: false };
}

function atlasByCore(id) { return ATLAS.filter(item => item.core === id); }

function atlasContent(item) {
  return JSON.stringify({
    schema: "cht360-repository-atlas-entry-v1",
    repository: `${REPOSITORY.owner}/${REPOSITORY.name}`,
    branch: REPOSITORY.branch,
    publishedRoot: REPOSITORY.publishedRoot,
    path: item.path,
    description: item.description,
    state: item.state,
    sourceUrl: REPOSITORY.url
  }, null, 2);
}

function atlasSlot(item, index, createdAt) {
  return {
    id: index + 1,
    name: `Repo · ${item.title}`,
    content: atlasContent(item),
    createdAt,
    updatedAt: createdAt,
    source: "cht360-repository-atlas",
    atlasVersion: VERSION,
    atlasId: item.id,
    atlasCore: item.core
  };
}

function occupiedAtlasIds(memory) {
  const found = new Set();
  CORE_META.forEach(core => slotsFor(memory, core.id).forEach(slot => {
    if (slot?.source === "cht360-repository-atlas" && typeof slot.atlasId === "string") found.add(slot.atlasId);
  }));
  return found;
}

function memoryStats(memory) {
  return CORE_META.map(core => {
    const slots = slotsFor(memory, core.id);
    const used = slots.filter(isUsed).length;
    const atlas = slots.filter(slot => slot?.source === "cht360-repository-atlas").length;
    return { ...core, capacity: slots.length, used, free: Math.max(0, slots.length - used), atlas };
  });
}

function renderAtlas() {
  elements.count.textContent = `${ATLAS.length} záznamů`;
  elements.summary.innerHTML = CORE_META.map(core => {
    const count = atlasByCore(core.id).length;
    return `<div><b>${core.label}</b><span>${count} položek</span></div>`;
  }).join("");
  elements.list.innerHTML = ATLAS.map(item => `<article class="atlas-item"><b>${escapeHtml(coreLabel(item.core))} · ${escapeHtml(item.title)}</b><span><code>${escapeHtml(item.path)}</code><br>${escapeHtml(item.description)} · ${escapeHtml(item.state)}</span></article>`).join("");
}

function renderMemory(message) {
  const loaded = loadMemory();
  const stats = memoryStats(loaded.memory);
  const total = stats.reduce((sum, item) => sum + item.capacity, 0);
  const used = stats.reduce((sum, item) => sum + item.used, 0);
  const free = total - used;
  const saved = occupiedAtlasIds(loaded.memory).size;
  elements.cores.innerHTML = stats.map(item => `<article class="core"><b>${escapeHtml(item.label)}</b><span>${item.used} / ${item.capacity} slotů</span><em>Volno: ${item.free} · Atlas: ${item.atlas}</em></article>`).join("");
  elements.state.textContent = `${used} / ${total}`;
  elements.state.className = `pill${free ? "" : " warn"}`;
  if (message) {
    setStatus(message.text, message.kind || "");
  } else if (saved) {
    setStatus(`Paměť načtena z klíče „${loaded.source}“. Atlas už drží ${saved} položek; další spuštění nic nezdvojí.`, "good");
  } else if (used) {
    setStatus(`Paměť načtena z klíče „${loaded.source}“. Je v ní ${free} volných slotů pro atlas repozitáře.`, "");
  } else {
    setStatus("Paměť je zatím prázdná. Atlas ji může vyplnit skutečnými rozcestníky repozitáře.", "");
  }
  return { loaded, stats, total, used, free, saved };
}

function coreLabel(id) { return CORE_META.find(core => core.id === id)?.label || id; }
function escapeHtml(value) { return String(value).replace(/[&<>'\"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" })[char]); }
function setStatus(text, kind) { elements.status.className = `status${kind ? ` ${kind}` : ""}`; elements.status.textContent = text; }

function backupBeforeWrite() {
  const backup = {
    schema: "cht360-repository-atlas-backup-v1",
    createdAt: now(),
    note: "Automatická záloha před doplněním Atlasu repozitáře do Paměti CHT.",
    values: { [STORAGE_KEY]: readRaw(STORAGE_KEY), [LEGACY_KEY]: readRaw(LEGACY_KEY), [ATLAS_KEY]: readRaw(ATLAS_KEY) }
  };
  return writeJson(BACKUP_KEY, backup);
}

function fillFreeSlots() {
  elements.fill.disabled = true;
  const view = renderMemory();
  const memory = view.loaded.memory;
  const known = occupiedAtlasIds(memory);
  const stamp = now();
  const additions = [];

  CORE_META.forEach(core => {
    const queue = atlasByCore(core.id).filter(item => !known.has(item.id));
    let next = 0;
    const slots = memory.cores[core.id];
    slots.forEach((slot, index) => {
      if (!queue[next] || isUsed(slot, index)) return;
      const item = queue[next++];
      slots[index] = atlasSlot(item, index, stamp);
      additions.push({ core: core.id, id: item.id, slot: index + 1 });
    });
  });

  if (!additions.length) {
    renderMemory({ text: known.size ? "Atlas už je uložený nebo pro něj nezbylo volné místo. Žádný vlastní slot nebyl změněn." : "Nenašla jsem volný slot pro atlas. Žádný vlastní slot nebyl změněn.", kind: "warn" });
    elements.fill.disabled = false;
    return;
  }

  if (!backupBeforeWrite()) {
    renderMemory({ text: "Lokální zálohu se nepodařilo uložit, proto se Paměť nezměnila.", kind: "warn" });
    elements.fill.disabled = false;
    return;
  }

  memory.updatedAt = stamp;
  const atlasRecord = {
    schema: "cht360-repository-atlas-v1",
    version: VERSION,
    repository: REPOSITORY,
    savedAt: stamp,
    added: additions,
    entries: ATLAS
  };

  if (!writeJson(STORAGE_KEY, memory) || !writeJson(ATLAS_KEY, atlasRecord)) {
    renderMemory({ text: "Paměť se nevešla do místního úložiště. Záloha zůstala zachovaná a zkus zmenšit jiné místní údaje.", kind: "warn" });
    elements.fill.disabled = false;
    return;
  }

  /* Pokud starší klíč existoval, držíme ho ve shodě. Bez existence ho nevytváříme zbytečně. */
  if (view.loaded.legacy) writeJson(LEGACY_KEY, memory);
  try { window.dispatchEvent(new CustomEvent("cht.memory.changed", { detail: { reason: "atlas repozitáře", added: additions.length, updatedAt: stamp } })); } catch {}
  lastResult = { added: additions, savedAt: stamp };
  renderMemory({ text: `Hotovo. Atlas doplnil ${additions.length} volných slotů; žádný použitý slot se nepřepsal. Lokální záloha je pod klíčem „${BACKUP_KEY}“.`, kind: "good" });
  elements.fill.disabled = false;
}

function downloadAtlas() {
  const data = {
    schema: "cht360-repository-atlas-export-v1",
    version: VERSION,
    exportedAt: now(),
    repository: REPOSITORY,
    lastResult,
    entries: ATLAS
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "cht-360-atlas-repozitare.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}), { once: true });
}
