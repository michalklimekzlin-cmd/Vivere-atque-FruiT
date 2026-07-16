"use strict";

const APP_NAME = "Glyph CHT 360°‰";
const DB_NAME = "glyph-cht-360-project-guard";
const DB_VERSION = 1;
const STATE_STORE = "state";
const STATE_KEY = "project";
const FALLBACK_KEY = "glyph-cht-360-project-guard.v1";
const MAX_FILE_SIZE = 900_000;
const MAX_TOTAL_SIZE = 4_500_000;
const CONTROL_CHARACTER = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/u;
const POSSIBLE_MOJIBAKE = /(?:Ã.|Â.|â.{1,2}|ð.{1,2})/u;

const dom = {
  projectFiles: document.getElementById("projectFiles"),
  projectName: document.getElementById("projectName"),
  pasteCode: document.getElementById("pasteCode"),
  pasteFilename: document.getElementById("pasteFilename"),
  scanPaste: document.getElementById("scanPaste"),
  scanAgain: document.getElementById("scanAgain"),
  fileSearch: document.getElementById("fileSearch"),
  fileList: document.getElementById("fileList"),
  findingsList: document.getElementById("findingsList"),
  dependencyList: document.getElementById("dependencyList"),
  selectionText: document.getElementById("selectionText"),
  downloadRepair: document.getElementById("downloadRepair"),
  exportReport: document.getElementById("exportReport"),
  clearProject: document.getElementById("clearProject"),
  fileCount: document.getElementById("fileCount"),
  dependencyCount: document.getElementById("dependencyCount"),
  errorCount: document.getElementById("errorCount"),
  errorNote: document.getElementById("errorNote"),
  storageState: document.getElementById("storageState"),
  storageNote: document.getElementById("storageNote"),
  statusLine: document.getElementById("statusLine")
};

const state = {
  projectName: "",
  files: [],
  selectedId: null,
  db: null,
  storageAvailable: true,
  storageMode: "Načítám",
  storagePersistent: false,
  savedAt: null
};

void initialize();

async function initialize() {
  bindEvents();
  await restoreProject();
  await requestPersistentStorage();
  rescanProject();
  renderAll();
  registerServiceWorker();
}

function bindEvents() {
  dom.projectFiles.addEventListener("change", addSelectedFiles);
  dom.scanPaste.addEventListener("click", addPastedCode);
  dom.scanAgain.addEventListener("click", async () => {
    rescanProject();
    await persistProject();
    renderAll();
    setStatus("ChybaŽrout přepočítal soubory i jejich návaznosti.");
  });
  dom.fileSearch.addEventListener("input", renderFileList);
  dom.fileList.addEventListener("click", selectFileFromList);
  dom.downloadRepair.addEventListener("click", downloadSelectedRepair);
  dom.exportReport.addEventListener("click", exportReport);
  dom.clearProject.addEventListener("click", clearProject);
  dom.projectName.addEventListener("change", async () => {
    state.projectName = dom.projectName.value.trim();
    await persistProject();
    renderDrums();
  });
}

async function restoreProject() {
  const fallback = loadFallback();
  hydrateProject(fallback);

  try {
    state.db = await openDatabase();
    const saved = await dbGet(STATE_STORE, STATE_KEY);

    if (saved?.value) hydrateProject(saved.value);
    else await persistProject(false);

    state.storageMode = "Trvalé";
    state.storageAvailable = true;
  } catch (error) {
    state.storageMode = "Lokální";
    state.storageAvailable = true;
  }
}

function hydrateProject(raw) {
  if (!raw || typeof raw !== "object") return;

  state.projectName = String(raw.projectName || "").trim();
  state.files = Array.isArray(raw.files) ? raw.files.map(hydrateFile).filter(Boolean) : [];
  state.selectedId = state.files.some((file) => file.id === raw.selectedId) ? raw.selectedId : null;
  state.savedAt = validDate(raw.savedAt) ? raw.savedAt : null;
}

function hydrateFile(raw) {
  if (!raw || typeof raw !== "object") return null;

  const name = String(raw.name || "").trim();
  const source = typeof raw.source === "string" ? raw.source : "";

  if (!name) return null;

  return {
    id: String(raw.id || makeId("file")),
    name,
    path: String(raw.path || name).replace(/^\.\//, ""),
    source,
    type: detectType(name),
    addedAt: validDate(raw.addedAt) ? raw.addedAt : new Date().toISOString(),
    updatedAt: validDate(raw.updatedAt) ? raw.updatedAt : new Date().toISOString(),
    findings: [],
    dependencies: [],
    repair: null
  };
}

async function addSelectedFiles(event) {
  const files = Array.from(event.target.files || []);
  event.target.value = "";

  if (!files.length) return;

  const tooLarge = files.filter((file) => file.size > MAX_FILE_SIZE);
  const total = files.reduce((sum, file) => sum + file.size, 0);

  if (tooLarge.length || total > MAX_TOTAL_SIZE) {
    setStatus(
      `Vyber menší sadu: jeden soubor má mít do ${Math.round(MAX_FILE_SIZE / 1000)} kB a celek do ${Math.round(MAX_TOTAL_SIZE / 1_000_000)} MB.`,
      "warning"
    );
    return;
  }

  const incoming = [];

  for (const file of files) {
    incoming.push(hydrateFile({
      id: makeId("file"),
      name: file.name,
      path: file.webkitRelativePath || file.name,
      source: await file.text(),
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }

  mergeFiles(incoming);
  rescanProject();
  await persistProject();
  renderAll();

  setStatus(
    `ChybaŽrout načetl ${incoming.length} soubor${czechEnding(incoming.length, "", "y", "ů")} a prověřil jejich spojení.`
  );
}

async function addPastedCode() {
  const source = dom.pasteCode.value;
  const name = dom.pasteFilename.value.trim() || "vlozeny-kod.txt";

  if (!source.trim()) {
    setStatus("Nejdřív vlož kód, který má ChybaŽrout prověřit.", "warning");
    return;
  }

  if (new Blob([source]).size > MAX_FILE_SIZE) {
    setStatus("Vložený kus je příliš velký. Rozděl ho na menší soubory.", "warning");
    return;
  }

  mergeFiles([
    hydrateFile({
      id: makeId("file"),
      name,
      path: name,
      source,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  ]);

  dom.pasteCode.value = "";
  dom.pasteFilename.value = "";

  rescanProject();
  await persistProject();
  renderAll();

  setStatus(`ChybaŽrout přidal a prověřil „${name}“.`);
}

function mergeFiles(incoming) {
  const byPath = new Map(
    state.files.map((file) => [file.path.toLocaleLowerCase("cs"), file])
  );

  incoming.filter(Boolean).forEach((file) => {
    const key = file.path.toLocaleLowerCase("cs");
    const previous = byPath.get(key);

    if (previous) file.id = previous.id;

    byPath.set(key, file);
  });

  state.files = [...byPath.values()];

  if (!state.selectedId && incoming[0]) {
    state.selectedId = incoming[0].id;
  }
}

function rescanProject() {
  const paths = new Map();
  const names = new Map();

  state.files.forEach((file) => {
    paths.set(normalizePath(file.path), file);

    const basename = basenameOf(file.path);
    if (!names.has(basename)) names.set(basename, file);
  });

  state.files.forEach((file) => {
    const analysis = inspectSource(file);

    const dependencies = analysis.references.map((reference) => {
      const resolvedPath = resolveReference(file.path, reference.value);
      const target = resolvedPath
        ? paths.get(resolvedPath) || names.get(basenameOf(resolvedPath))
        : null;

      return {
        ...reference,
        resolvedPath,
        targetId: target?.id || null,
        targetName: target?.path || null
      };
    });

    dependencies
      .filter((dependency) => dependency.local && !dependency.targetId)
      .forEach((dependency) => {
        analysis.findings.push(finding(
          "warning",
          "Nenalezená návaznost",
          `„${dependency.value}“ nebyl mezi načtenými soubory nalezen. Může chybět, nebo jen nebyl vybraný.`
        ));
      });

    file.findings = analysis.findings;
    file.dependencies = dependencies;
    file.repair = analysis.repair;
    file.type = detectType(file.name);
  });
}

function inspectSource(file) {
  const source = file.source;
  const type = detectType(file.name);
  const findings = [];
  const references = extractReferences(source, type);
  const repair = { source, changes: [] };

  if (!source) {
    findings.push(finding("warning", "Prázdný soubor", "Soubor neobsahuje žádný text."));
  }

  if (source.includes("\uFFFD")) {
    findings.push(finding(
      "error",
      "Poškozený znak",
      "Obsahuje náhradní znak �. Vrať se ke zdroji textu a vlož jej znovu v UTF‑8."
    ));
  }

  if (CONTROL_CHARACTER.test(source)) {
    findings.push(finding(
      "warning",
      "Skrytý řídicí znak",
      "Obsahuje neviditelný řídicí znak. Může být úmyslný, proto jej ChybaŽrout nemaže."
    ));
  }

  if (POSSIBLE_MOJIBAKE.test(source)) {
    findings.push(finding(
      "warning",
      "Možné špatné UTF‑8",
      "Našel se sled typický pro rozbité načtení jako Ã nebo Â. Neopravuje se automaticky, aby se nezměnil zamýšlený text."
    ));
  }

  if (type === "html") {
    if (!/^\s*<!doctype\s+html/i.test(source)) {
      findings.push(finding(
        "warning",
        "Chybí doctype",
        "HTML začíná bez <!doctype html>. Bezpečná kopie jej může doplnit."
      ));

      repair.source = `<!doctype html>\n${repair.source}`;
      repair.changes.push("doplněn <!doctype html>");
    }

    if (!/<meta\s+charset\s*=\s*["']?utf-8["']?\s*\/?>/i.test(source)) {
      const hasHead = /<head\b[^>]*>/i.test(repair.source);

      findings.push(finding(
        "warning",
        "Chybí UTF‑8 meta",
        hasHead
          ? "V HTML chybí <meta charset=\"utf-8\">. Bezpečná kopie ho vloží hned do <head>."
          : "V HTML chybí <meta charset=\"utf-8\"> a není vidět <head>, do kterého by šel bezpečně vložit."
      ));

      if (hasHead) {
        repair.source = repair.source.replace(
          /<head\b[^>]*>/i,
          (head) => `${head}\n  <meta charset="utf-8">`
        );
        repair.changes.push("doplněno <meta charset=\"utf-8\">");
      }
    }
  }

  if (type === "json" || type === "manifest") {
    try {
      const parsed = JSON.parse(source);

      if (type === "manifest" && !parsed.name) {
        findings.push(finding(
          "warning",
          "Manifest bez názvu",
          "Manifest nemá vlastnost name."
        ));
      }

      if (type === "manifest" && !parsed.start_url) {
        findings.push(finding(
          "warning",
          "Manifest bez start_url",
          "Manifest nemá start_url. PWA se může otevírat nečekaně."
        ));
      }

      const formatted = `${JSON.stringify(parsed, null, 2)}\n`;

      if (formatted !== source) {
        repair.source = formatted;
        repair.changes.push("JSON naformátován bez změny dat");
      }
    } catch (error) {
      findings.push(finding(
        "error",
        "Neplatný JSON",
        `JSON nelze přečíst: ${shortError(error)}.`
      ));

      repair.changes = [];
      repair.source = source;
    }
  }

  if (type === "js") {
    if (/\b(?:NaN|Infinity)\b/u.test(source)) {
      findings.push(finding(
        "warning",
        "Možná nečíselná hodnota",
        "V kódu je NaN nebo Infinity. Zkontroluj výpočty a vstupy před použitím."
      ));
    }

    if (/\.innerHTML\s*=/u.test(source)) {
      findings.push(finding(
        "warning",
        "Přímé innerHTML",
        "Přímé vkládání HTML zkontroluj, zejména pokud může obsahovat text od uživatele."
      ));
    }

    if (/\.catch\s*\(/u.test(source) === false && /\bfetch\s*\(/u.test(source)) {
      findings.push(finding(
        "warning",
        "Fetch bez viditelné catch",
        "Našel se fetch bez zřejmého .catch(). Ověř zachycení síťové chyby."
      ));
    }
  }

  if (source.length > 200_000) {
    findings.push(finding(
      "warning",
      "Velký soubor",
      "Soubor je velmi dlouhý. Rozdělení může usnadnit hledání chyb."
    ));
  }

  return {
    findings,
    references,
    repair: repair.changes.length ? repair : null
  };
}

function extractReferences(source, type) {
  const values = [];

  const add = (value, kind) => {
    const cleaned = String(value || "").trim();
    if (!cleaned) return;

    values.push({
      value: cleaned,
      kind,
      local: isLocalReference(cleaned)
    });
  };

  if (type === "html") {
    for (const match of source.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
      add(match[1], "HTML");
    }
  }

  if (type === "css") {
    for (const match of source.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
      add(match[1], "CSS");
    }
  }

  if (type === "js") {
    for (const match of source.matchAll(/(?:from\s*|import\s*|register\s*\(|new\s+Worker\s*\()["']([^"']+)["']/gi)) {
      add(match[1], "JS");
    }
  }

  if (type === "manifest") {
    try {
      const parsed = JSON.parse(source);

      if (parsed.start_url) add(parsed.start_url, "manifest");
      (parsed.icons || []).forEach((icon) => add(icon?.src, "manifest"));
    } catch (error) {
      // JSON error is reported by inspectSource.
    }
  }

  return uniqueBy(values, (item) => `${item.kind}:${item.value}`);
}

function renderAll() {
  dom.projectName.value = state.projectName;
  renderFileList();
  renderFindings();
  renderDependencies();
  renderDrums();
}

function renderFileList() {
  const query = normalizeSearch(dom.fileSearch.value);

  const files = [...state.files]
    .filter((file) => !query || searchableFile(file).includes(query))
    .sort((a, b) => a.path.localeCompare(b.path, "cs"));

  if (!files.length) {
    dom.fileList.innerHTML = `<p class="empty">${
      escapeHtml(
        state.files.length
          ? "Tomu hledání nic neodpovídá."
          : "Zatím není načtený žádný soubor."
      )
    }</p>`;
    return;
  }

  dom.fileList.innerHTML = files.map((file) => {
    const severity = severityOf(file.findings);
    const selected = file.id === state.selectedId ? " is-selected" : "";

    return `<button type="button" class="file-button${selected}" data-file-id="${escapeAttribute(file.id)}">
      <span class="file-icon">${escapeHtml(typeLabel(file.type))}</span>
      <span>
        <span class="file-name">${escapeHtml(file.path)}</span>
        <span class="file-meta">${file.dependencies.length} návaznost${czechEnding(file.dependencies.length, "", "i", "í")} · ${file.findings.length} nález${czechEnding(file.findings.length, "", "y", "ů")}</span>
      </span>
      <span class="badge ${severity}">${escapeHtml(severityLabel(severity))}</span>
    </button>`;
  }).join("");
}

function renderFindings() {
  const file = getSelectedFile();
  dom.downloadRepair.disabled = !file?.repair;

  if (!file) {
    dom.selectionText.textContent = "Vyber soubor v mapě. Bezpečná kopie doplní jen jisté věci, například chybějící UTF‑8 nebo doctype; neznámé chyby pouze označí.";

    dom.findingsList.innerHTML = `
      <li class="finding-item">
        <span class="finding-kind ok">ČEKÁ</span>
        <div>
          <strong>ChybaŽrout je připravený.</strong>
          <p>Vyber soubory z projektu nebo vlož kus kódu.</p>
        </div>
      </li>`;

    return;
  }

  dom.selectionText.textContent = `Soubor: ${file.path}. ${
    file.repair
      ? `Bezpečná kopie umí: ${file.repair.changes.join(", ")}.`
      : "Pro tento soubor není jistá automatická oprava; nálezy jsou jen označené."
  }`;

  if (!file.findings.length) {
    dom.findingsList.innerHTML = `
      <li class="finding-item">
        <span class="finding-kind ok">ČISTÉ</span>
        <div>
          <strong>Zatím bez známé chyby.</strong>
          <p>ChybaŽrout nic automaticky nemění.</p>
        </div>
      </li>`;

    return;
  }

  dom.findingsList.innerHTML = file.findings.map((item) => `
    <li class="finding-item">
      <span class="finding-kind ${escapeAttribute(item.kind)}">${escapeHtml(item.kind === "error" ? "CHYBA" : "POZOR")}</span>
      <div>
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.message)}</p>
      </div>
    </li>
  `).join("");
}

function renderDependencies() {
  const dependencies = state.files.flatMap((file) =>
    file.dependencies.map((dependency) => ({ from: file, dependency }))
  );

  if (!dependencies.length) {
    dom.dependencyList.innerHTML = `
      <p class="empty">Návaznosti se objeví po načtení HTML, CSS, JavaScriptu nebo manifestu.</p>
    `;
    return;
  }

  dom.dependencyList.innerHTML = dependencies.map(({ from, dependency }) => {
    const target = dependency.targetName || "nenalezeno";

    return `
      <div class="dependency-item">
        <span class="dependency-kind">${escapeHtml(dependency.kind)}</span>
        <div>
          <strong>${escapeHtml(from.path)} → ${escapeHtml(target)}</strong>
          <p>${escapeHtml(dependency.value)}${dependency.targetId ? "" : " · ověř, zda soubor nechybí nebo nebyl vybraný"}</p>
        </div>
      </div>`;
  }).join("");
}

function renderDrums() {
  const dependencies = state.files.reduce((sum, file) => sum + file.dependencies.length, 0);
  const errors = state.files.flatMap((file) => file.findings).filter((item) => item.kind === "error").length;
  const warnings = state.files.flatMap((file) => file.findings).filter((item) => item.kind === "warning").length;

  dom.fileCount.textContent = String(state.files.length);
  dom.dependencyCount.textContent = String(dependencies);
  dom.errorCount.textContent = errors ? formatIssueCount(errors) : warnings ? `${warnings} pozor` : "Čisté";
  dom.errorNote.textContent = errors
    ? "je potřeba opravit"
    : warnings
      ? "ručně ověřit"
      : state.files.length
        ? "kontrola prošla"
        : "čeká na soubory";

  dom.storageState.textContent = state.storageAvailable ? state.storageMode : "Pozor";
  dom.storageNote.textContent = state.storageAvailable
    ? state.savedAt
      ? `uloženo ${formatShortDate(state.savedAt)}${state.storagePersistent ? " · chráněné" : ""}`
      : "místní paměť"
    : "uložení se nepodařilo";
}

function selectFileFromList(event) {
  const button = event.target.closest("[data-file-id]");
  if (!button) return;

  state.selectedId = button.dataset.fileId;
  renderFileList();
  renderFindings();
}

function getSelectedFile() {
  return state.files.find((file) => file.id === state.selectedId) || null;
}

function downloadSelectedRepair() {
  const file = getSelectedFile();
  if (!file?.repair) return;

  downloadFile(
    file.repair.source,
    repairedName(file.name),
    fileMimeType(file.type)
  );

  setStatus(
    `Bezpečná kopie „${repairedName(file.name)}“ je připravená. Původní soubor zůstal beze změny.`
  );
}

async function clearProject() {
  if (!state.files.length) return;

  if (!window.confirm("Opravdu vyčistit uloženou mapu projektu? Nejdřív můžeš stáhnout zálohu kontroly.")) {
    return;
  }

  state.files = [];
  state.selectedId = null;

  await persistProject();
  renderAll();

  setStatus("Mapa projektu byla vyčištěná z tohoto zařízení.");
}

function exportReport() {
  const payload = {
    app: APP_NAME,
    version: 1,
    projectName: state.projectName,
    exportedAt: new Date().toISOString(),
    files: state.files.map((file) => ({
      path: file.path,
      type: file.type,
      addedAt: file.addedAt,
      findings: file.findings,
      dependencies: file.dependencies.map((dependency) => ({
        value: dependency.value,
        kind: dependency.kind,
        targetName: dependency.targetName
      }))
    })),
    sourcesIncluded: false
  };

  downloadFile(
    JSON.stringify(payload, null, 2),
    `glyph-cht-360-kontrola-${new Date().toISOString().slice(0, 10)}.json`,
    "application/json;charset=utf-8"
  );

  setStatus("Záloha kontroly je připravená. Zdrojové kódy do ní schválně nejsou zahrnuté.");
}

async function persistProject(updateTime = true) {
  if (updateTime || !state.savedAt) {
    state.savedAt = new Date().toISOString();
  }

  const payload = {
    projectName: state.projectName,
    files: state.files,
    selectedId: state.selectedId,
    savedAt: state.savedAt
  };

  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(payload));
  } catch (error) {
    state.storageAvailable = false;
  }

  if (!state.db) return;

  try {
    await dbPut(STATE_STORE, {
      key: STATE_KEY,
      value: payload,
      updatedAt: state.savedAt || new Date().toISOString()
    });

    state.storageAvailable = true;
    state.storageMode = "Trvalé";
  } catch (error) {
    state.storageAvailable = false;
    setStatus("Projekt se nepodařilo uložit do trvalé paměti.", "error");
  }
}

function loadFallback() {
  try {
    return JSON.parse(localStorage.getItem(FALLBACK_KEY)) || null;
  } catch (error) {
    return null;
  }
}

async function requestPersistentStorage() {
  try {
    if (!navigator.storage?.persisted) return;

    state.storagePersistent = await navigator.storage.persisted();

    if (!state.storagePersistent && navigator.storage.persist) {
      state.storagePersistent = await navigator.storage.persist();
    }
  } catch (error) {
    state.storagePersistent = false;
  }
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB není dostupná."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STATE_STORE)) {
        db.createObjectStore(STATE_STORE, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Databázi nelze otevřít."));
  });
}

function dbGet(storeName, key) {
  return new Promise((resolve, reject) => {
    const request = state.db
      .transaction(storeName, "readonly")
      .objectStore(storeName)
      .get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function dbPut(storeName, value) {
  return new Promise((resolve, reject) => {
    const request = state.db
      .transaction(storeName, "readwrite")
      .objectStore(storeName)
      .put(value);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function setStatus(message, kind = "") {
  dom.statusLine.textContent = message;
  dom.statusLine.dataset.kind = kind;
}

function detectType(name) {
  const lower = String(name).toLocaleLowerCase("cs");

  if (/\.html?$/u.test(lower)) return "html";
  if (/\.css$/u.test(lower)) return "css";
  if (/\.(?:js|mjs)$/u.test(lower)) return "js";
  if (/\.webmanifest$/u.test(lower) || /manifest\.json$/u.test(lower)) return "manifest";
  if (/\.json$/u.test(lower)) return "json";
  if (/\.svg$/u.test(lower)) return "svg";

  return "text";
}

function typeLabel(type) {
  return {
    html: "HTML",
    css: "CSS",
    js: "JS",
    json: "JSON",
    manifest: "PWA",
    svg: "SVG",
    text: "TXT"
  }[type] || "TXT";
}

function severityOf(findings) {
  if (findings.some((item) => item.kind === "error")) return "error";
  if (findings.some((item) => item.kind === "warning")) return "warning";
  return "ok";
}

function severityLabel(severity) {
  return {
    error: "CHYBA",
    warning: "POZOR",
    ok: "ČISTÉ"
  }[severity];
}

function finding(kind, title, message) {
  return { kind, title, message };
}

function resolveReference(fromPath, reference) {
  if (!isLocalReference(reference)) return null;

  const clean = reference.split(/[?#]/u)[0].trim();

  if (!clean || clean === "." || clean === "./") {
    return normalizePath(fromPath);
  }

  const base = clean.startsWith("/")
    ? []
    : normalizePath(fromPath).split("/").slice(0, -1);

  clean.split("/").forEach((part) => {
    if (!part || part === ".") return;

    if (part === "..") base.pop();
    else base.push(part);
  });

  return base.join("/");
}

function isLocalReference(value) {
  return !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/iu.test(String(value).trim());
}

function normalizePath(value) {
  return String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .split("/")
    .filter(Boolean)
    .join("/");
}

function basenameOf(value) {
  const pieces = normalizePath(value).split("/");
  return pieces[pieces.length - 1] || "";
}

function searchableFile(file) {
  return normalizeSearch([
    file.path,
    file.type,
    ...file.findings.flatMap((item) => [item.title, item.message]),
    ...file.dependencies.map((item) => item.value)
  ].join(" "));
}

function normalizeSearch(value) {
  return String(value || "").normalize("NFC").toLocaleLowerCase("cs");
}

function uniqueBy(items, key) {
  const seen = new Set();

  return items.filter((item) => {
    const id = key(item);

    if (seen.has(id)) return false;

    seen.add(id);
    return true;
  });
}

function repairedName(name) {
  const dot = name.lastIndexOf(".");
  return dot > 0
    ? `${name.slice(0, dot)}.opraveno${name.slice(dot)}`
    : `${name}.opraveno`;
}

function fileMimeType(type) {
  return {
    html: "text/html;charset=utf-8",
    css: "text/css;charset=utf-8",
    js: "text/javascript;charset=utf-8",
    json: "application/json;charset=utf-8",
    manifest: "application/manifest+json;charset=utf-8",
    svg: "image/svg+xml;charset=utf-8"
  }[type] || "text/plain;charset=utf-8";
}

function downloadFile(contents, filename, type) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.append(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function formatIssueCount(count) {
  if (count === 1) return "1 chyba";
  if (count >= 2 && count <= 4) return `${count} chyby`;
  return `${count} chyb`;
}

function czechEnding(count, one, few, many) {
  if (count === 1) return one;
  if (count >= 2 && count <= 4) return few;
  return many;
}

function formatShortDate(value) {
  try {
    return new Intl.DateTimeFormat("cs-CZ", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch (error) {
    return "teď";
  }
}

function validDate(value) {
  return Boolean(value) && !Number.isNaN(new Date(value).getTime());
}

function shortError(error) {
  return String(error?.message || error || "neznámá chyba")
    .replace(/\s+/g, " ")
    .slice(0, 160);
}

function makeId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    "\"": "&quot;"
  })[character]);
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
