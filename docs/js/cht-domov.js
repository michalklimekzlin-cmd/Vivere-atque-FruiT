/*
  CHT 360°‰. — Chybožrout Domov
  -------------------------------------------------------------
  Nový doplněk k existujícímu ./js/cht-chybozrout.js.
  Tento soubor nic nepřepisuje. Přidává vlastní ovládání, IndexedDB
  se snímky paměti, domácí kontrolu při otevření a bezpečnou obnovu.

  Připojení: vlož do docs/index.html JEDEN řádek hned ZA existující
  <script type="module" src="./js/cht-chybozrout.js"></script>

  <script type="module" src="./js/cht-chybozrout-domov.js"></script>
*/

(() => {
  "use strict";

  if (window.CHTChybozroutDomov) return;

  const DB_NAME = "cht360_chybozrout_domov_v1";
  const DB_VERSION = 1;
  const SNAPSHOT_STORE = "snapshots";
  const REPORT_STORE = "reports";
  const STATE_KEY = "cht360_chybozrout_domov_state_v1";
  const MAX_ASSET_CHECKS = 48;
  const AUTO_SAVE_DELAY = 1400;

  const KNOWN_MEMORY_KEYS = new Set([
    "cht360_pamet_v1",
    "vaft_pamet_v1",
    "cht360_pamet_snapshots_v1",
    "cht360_trojka_models_v1",
    "cht360_glyph_drums_v1",
    "cht360_glyph_drums_custom_v1",
    "cht360_iphone14_settings_v1",
    "cht360_samoopravovna_backup_v1",
    "cht360_chybozrout_v2"
  ]);

  const OWN_KEYS = new Set([STATE_KEY]);
  const keyPattern = /^(?:cht360_|vaft_|vafit_|revia_|glyph-cht-360)/i;
  const activeScript = [...document.scripts].find(script =>
    /cht-chybozrout-domov\.js(?:$|\?)/.test(script.src || "")
  );
  let autoSaveTimer = 0;
  let ui = null;
  let busy = false;

  function now() {
    return new Date().toISOString();
  }

  function makeId(prefix) {
    const random = window.crypto?.randomUUID?.() ||
      Math.random().toString(16).slice(2);
    return prefix + "-" + Date.now() + "-" + random;
  }

  function text(value) {
    return String(value == null ? "" : value);
  }

  function safeJson(value, fallback) {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function readState() {
    const saved = safeJson(localStorage.getItem(STATE_KEY), {});
    return isPlainObject(saved) ? saved : {};
  }

  function writeState(next) {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(next));
    } catch (error) {
      console.warn("CHT 360°‰.: nelze zapsat stav Domova.", error);
    }
  }

  function updateState(patch) {
    writeState({ ...readState(), ...patch, updatedAt: now() });
  }

  function emit(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  function formatTime(value) {
    if (!value) return "zatím ne";

    try {
      return new Date(value).toLocaleString("cs-CZ", {
        dateStyle: "short",
        timeStyle: "short"
      });
    } catch {
      return "neznámý čas";
    }
  }

  function configuredKeys() {
    const raw = activeScript?.dataset?.chtStorageKeys || "";
    return raw.split(",").map(item => item.trim()).filter(Boolean);
  }

  function isRelatedKey(key) {
    return !OWN_KEYS.has(key) &&
      (KNOWN_MEMORY_KEYS.has(key) || configuredKeys().includes(key) || keyPattern.test(key));
  }

  function relatedStorage() {
    const values = {};

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);

      if (key && isRelatedKey(key)) {
        values[key] = localStorage.getItem(key);
      }
    }

    return values;
  }

  function fingerprint(values) {
    const source = Object.keys(values).sort().map(key =>
      key + "\u0000" + text(values[key])
    ).join("\u0001");
    let hash = 2166136261;

    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0).toString(16) + ":" + source.length;
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("Tento prohlížeč nepodporuje IndexedDB."));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(SNAPSHOT_STORE)) {
          const snapshots = database.createObjectStore(SNAPSHOT_STORE, {
            keyPath: "id"
          });
          snapshots.createIndex("createdAt", "createdAt", { unique: false });
        }

        if (!database.objectStoreNames.contains(REPORT_STORE)) {
          const reports = database.createObjectStore(REPORT_STORE, {
            keyPath: "id"
          });
          reports.createIndex("createdAt", "createdAt", { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Databázi nelze otevřít."));
    });
  }

  async function databaseWrite(storeName, value) {
    const database = await openDatabase();

    try {
      await new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, "readwrite");
        transaction.objectStore(storeName).put(value);
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
    } finally {
      database.close();
    }
  }

  async function databaseRead(storeName, id) {
    const database = await openDatabase();

    try {
      return await new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, "readonly");
        const request = transaction.objectStore(storeName).get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } finally {
      database.close();
    }
  }

  async function databaseList(storeName) {
    const database = await openDatabase();

    try {
      return await new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, "readonly");
        const request = transaction.objectStore(storeName).getAll();
        request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
        request.onerror = () => reject(request.error);
      });
    } finally {
      database.close();
    }
  }

  async function requestPersistentStorage() {
    if (!navigator.storage?.persist) return false;

    try {
      return Boolean(await navigator.storage.persist());
    } catch {
      return false;
    }
  }

  function pageDetails() {
    return {
      title: document.title,
      url: location.href,
      path: location.pathname,
      language: document.documentElement.lang || "cs",
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1
      }
    };
  }

  async function latestSnapshot() {
    const all = await databaseList(SNAPSHOT_STORE);
    return all.sort((first, second) =>
      text(second.createdAt).localeCompare(text(first.createdAt))
    )[0] || null;
  }

  async function listSnapshots() {
    const all = await databaseList(SNAPSHOT_STORE);
    const currentKeys = new Set(Object.keys(relatedStorage()));

    return all.map(snapshot => {
      const keys = Object.keys(snapshot.storage || {});
      const overlap = keys.filter(key => currentKeys.has(key)).length;
      const compatible = keys.includes("cht360_pamet_v1") ? 40 : 0;
      const complete = Math.min(30, keys.length * 2);
      const age = Math.max(0, 20 - Math.floor((Date.now() - Date.parse(snapshot.createdAt || 0)) / 86400000));

      return {
        ...snapshot,
        relevance: overlap * 5 + compatible + complete + age,
        keyCount: keys.length
      };
    }).sort((first, second) =>
      second.relevance - first.relevance ||
      text(second.createdAt).localeCompare(text(first.createdAt))
    );
  }

  async function createSnapshot(label, kind = "manual") {
    const storage = relatedStorage();
    const signature = fingerprint(storage);
    const previous = await latestSnapshot();

    if (kind === "automatic" && previous?.fingerprint === signature) {
      return { skipped: true, reason: "Paměť se od posledního bodu nezměnila." };
    }

    const snapshot = {
      id: makeId("cht-snimok"),
      schemaVersion: 1,
      createdAt: now(),
      label: text(label || "bod obnovy"),
      kind,
      fingerprint: signature,
      storage,
      page: pageDetails()
    };

    await databaseWrite(SNAPSHOT_STORE, snapshot);
    await requestPersistentStorage();
    updateState({ lastSnapshotAt: snapshot.createdAt, lastSnapshotId: snapshot.id });
    await saveReport("ok", "Uložen bod obnovy: " + snapshot.label, {
      snapshotId: snapshot.id,
      keyCount: Object.keys(storage).length
    });
    emit("cht.chybozrout.memory-saved", snapshot);
    return snapshot;
  }

  async function saveReport(level, message, details = {}) {
    const report = {
      id: makeId("cht-zaznam"),
      createdAt: now(),
      level,
      message,
      details
    };

    await databaseWrite(REPORT_STORE, report);
    updateState({ lastReportAt: report.createdAt, lastReport: { level, message } });
    emit("cht.chybozrout.event", report);
    return report;
  }

  function mergeArrays(current, incoming) {
    const result = current.slice();
    const known = new Set(current.map(item =>
      isPlainObject(item) && item.id ? "id:" + item.id : "raw:" + JSON.stringify(item)
    ));

    for (const item of incoming) {
      const key = isPlainObject(item) && item.id ?
        "id:" + item.id : "raw:" + JSON.stringify(item);

      if (!known.has(key)) {
        known.add(key);
        result.push(item);
      }
    }

    return result;
  }

  function mergeMissing(current, incoming, conflicts) {
    if (Array.isArray(current) && Array.isArray(incoming)) {
      return mergeArrays(current, incoming);
    }

    if (isPlainObject(current) && isPlainObject(incoming)) {
      const result = { ...current };

      for (const [key, nextValue] of Object.entries(incoming)) {
        if (!(key in result)) {
          result[key] = nextValue;
        } else if (JSON.stringify(result[key]) !== JSON.stringify(nextValue)) {
          if ((isPlainObject(result[key]) && isPlainObject(nextValue)) ||
              (Array.isArray(result[key]) && Array.isArray(nextValue))) {
            result[key] = mergeMissing(result[key], nextValue, conflicts);
          } else {
            conflicts.push(key);
          }
        }
      }

      return result;
    }

    if (JSON.stringify(current) !== JSON.stringify(incoming)) {
      conflicts.push("hodnota");
    }

    return current;
  }

  async function restoreSnapshot(snapshotId, mode) {
    const snapshot = await databaseRead(SNAPSHOT_STORE, snapshotId);

    if (!snapshot?.storage || !isPlainObject(snapshot.storage)) {
      throw new Error("Vybraný snímek Paměti nelze přečíst.");
    }

    const current = relatedStorage();
    await createSnapshot("před obnovou: " + snapshot.label, "before-restore");
    const changed = [];
    const conflicts = [];

    if (mode === "replace") {
      for (const key of Object.keys(current)) {
        if (!(key in snapshot.storage)) {
          localStorage.removeItem(key);
          changed.push(key);
        }
      }

      for (const [key, value] of Object.entries(snapshot.storage)) {
        if (localStorage.getItem(key) !== value) {
          localStorage.setItem(key, value);
          changed.push(key);
        }
      }
    } else {
      for (const [key, incomingRaw] of Object.entries(snapshot.storage)) {
        const currentRaw = localStorage.getItem(key);

        if (currentRaw === null) {
          localStorage.setItem(key, incomingRaw);
          changed.push(key);
          continue;
        }

        if (currentRaw === incomingRaw) continue;

        const currentValue = safeJson(currentRaw, Symbol("neplatné"));
        const incomingValue = safeJson(incomingRaw, Symbol("neplatné"));

        if (typeof currentValue === "symbol" || typeof incomingValue === "symbol") {
          conflicts.push(key);
          continue;
        }

        const keyConflicts = [];
        const merged = mergeMissing(currentValue, incomingValue, keyConflicts);
        const mergedRaw = JSON.stringify(merged);

        if (mergedRaw !== currentRaw) {
          localStorage.setItem(key, mergedRaw);
          changed.push(key);
        }

        if (keyConflicts.length) conflicts.push(key);
      }
    }

    const outcome = {
      snapshotId,
      mode,
      changed,
      conflicts,
      restoredAt: now()
    };

    await saveReport(
      conflicts.length ? "warn" : "ok",
      mode === "replace" ? "Obnoven celý snímek Paměti." : "Přidány chybějící části Paměti.",
      outcome
    );
    emit("cht.memory.changed", {
      source: "chybozrout-domov",
      reason: mode === "replace" ? "úplná obnova" : "doplnění paměti",
      keys: changed
    });
    emit("cht.memory.sync", { source: "chybozrout-domov", keys: changed });
    emit("cht.chybozrout.memory-restored", outcome);
    return outcome;
  }

  async function inspectCache() {
    const result = {
      serviceWorker: false,
      active: false,
      waiting: false,
      cacheNames: []
    };

    if (!("serviceWorker" in navigator)) return result;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      result.serviceWorker = true;
      result.active = Boolean(registration?.active);
      result.waiting = Boolean(registration?.waiting);

      if ("caches" in window) {
        result.cacheNames = (await caches.keys()).filter(name =>
          /^(?:cht360|vaft)/i.test(name)
        );
      }
    } catch (error) {
      result.error = text(error?.message || error);
    }

    return result;
  }

  function inspectMemory() {
    const values = relatedStorage();
    const invalid = [];

    for (const [key, value] of Object.entries(values)) {
      if (value == null || value === "") continue;
      if (safeJson(value, null) === null && value.trim() !== "null") {
        invalid.push(key);
      }
    }

    return {
      keys: Object.keys(values),
      invalid,
      primaryPresent: Object.prototype.hasOwnProperty.call(values, "cht360_pamet_v1"),
      fingerprint: fingerprint(values)
    };
  }

  async function homeCheck(reason = "otevření aplikace") {
    const memory = inspectMemory();
    const cache = await inspectCache();
    const issues = [];

    if (!memory.primaryPresent) issues.push("Hlavní klíč Paměti zatím neexistuje.");
    if (memory.invalid.length) issues.push("Neplatná data: " + memory.invalid.join(", "));
    if (cache.serviceWorker && !cache.active) issues.push("Offline vrstva není aktivní.");

    const report = {
      checkedAt: now(),
      kind: "domácí kontrola",
      reason,
      memory: {
        keyCount: memory.keys.length,
        invalid: memory.invalid,
        primaryPresent: memory.primaryPresent
      },
      cache,
      issues
    };

    updateState({ lastHomeCheck: report });
    await saveReport(issues.length ? "warn" : "ok",
      issues.length ? "Domácí kontrola našla drobnost k prověření." : "Domácí kontrola je v pořádku.",
      report
    );
    renderStatus();
    emit("cht.chybozrout.home-checked", report);
    return report;
  }

  function sameOriginAssetUrls() {
    const urls = new Set([
      new URL("./index.html", location.href).href,
      new URL("./manifest.json", location.href).href,
      new URL("./service-worker.js", location.href).href
    ]);

    document.querySelectorAll("script[src],link[href],a[href]").forEach(element => {
      const value = element.getAttribute("src") || element.getAttribute("href");

      if (!value || value.startsWith("#") || /^(?:data:|blob:|mailto:|tel:)/i.test(value)) return;

      try {
        const url = new URL(value, location.href);
        if (url.origin === location.origin) urls.add(url.href);
      } catch {
        /* Nečitelný odkaz patří do ruční opravy zdrojového souboru. */
      }
    });

    return [...urls].slice(0, MAX_ASSET_CHECKS);
  }

  async function probeAsset(url) {
    try {
      const response = await fetch(url, { cache: "no-store", credentials: "same-origin" });
      return { url, ok: response.ok, status: response.status };
    } catch (error) {
      return { url, ok: false, status: "síťová chyba", error: text(error?.message || error) };
    }
  }

  async function refreshOwnCache() {
    if (!("serviceWorker" in navigator)) return { ok: false, reason: "bez Service Workeru" };

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return { ok: false, reason: "offline vrstva není zaregistrovaná" };

      await registration.update();

      if (navigator.serviceWorker.controller) {
        const channel = new MessageChannel();
        const reply = new Promise(resolve => {
          const timeout = window.setTimeout(() => resolve(null), 4500);
          channel.port1.onmessage = event => {
            window.clearTimeout(timeout);
            resolve(event.data || null);
          };
        });

        navigator.serviceWorker.controller.postMessage({
          type: "CHYBOZROUT_REFRESH_URLS",
          urls: sameOriginAssetUrls().map(url => new URL(url).pathname.replace(location.pathname.replace(/[^/]*$/, ""), "./"))
        }, [channel.port2]);

        return { ok: true, reply: await reply };
      }

      return { ok: true, reply: null };
    } catch (error) {
      return { ok: false, reason: text(error?.message || error) };
    }
  }

  async function fullScan() {
    const startedAt = now();
    const basic = window.CHTChybozrout?.scan ?
      await window.CHTChybozrout.scan().catch(error => ({ error: text(error?.message || error) })) :
      null;
    const memory = inspectMemory();
    const cacheRefresh = await refreshOwnCache();
    const assets = await Promise.all(sameOriginAssetUrls().map(probeAsset));
    const failedAssets = assets.filter(item => !item.ok);
    const cache = await inspectCache();
    const report = {
      id: makeId("cht-uplny-sken"),
      createdAt: now(),
      kind: "úplný scan",
      startedAt,
      memory: {
        keyCount: memory.keys.length,
        invalid: memory.invalid,
        primaryPresent: memory.primaryPresent
      },
      assets,
      failedAssets,
      cache,
      cacheRefresh,
      basic
    };

    await saveReport(
      failedAssets.length || memory.invalid.length ? "warn" : "ok",
      failedAssets.length ? "Úplný scan našel nefunkční cesty." : "Úplný scan je v pořádku.",
      {
        failedPaths: failedAssets.map(item => item.url),
        invalidMemory: memory.invalid,
        cacheRefresh
      }
    );
    updateState({ lastFullScan: report });
    renderStatus();
    renderSnapshotList();
    emit("cht.chybozrout.completed", report);
    return report;
  }

  function iphone14Check() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const overflow = [...document.querySelectorAll("body *")]
      .filter(element => !element.closest("#chtChybozroutDomov"))
      .filter(element => {
        const style = getComputedStyle(element);
        if (style.position === "fixed" || style.display === "none") return false;
        const box = element.getBoundingClientRect();
        return box.right > width + 2 || box.left < -2;
      })
      .slice(0, 12)
      .map(element => element.id ? "#" + element.id : element.tagName.toLowerCase());

    const smallTargets = [...document.querySelectorAll("button,a[href],input,select,textarea")]
      .filter(element => !element.closest("#chtChybozroutDomov"))
      .filter(element => {
        const style = getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden") return false;
        const box = element.getBoundingClientRect();
        return box.width > 0 && box.height > 0 && (box.width < 44 || box.height < 44);
      })
      .slice(0, 12)
      .map(element => element.id ? "#" + element.id : element.tagName.toLowerCase());

    const report = {
      checkedAt: now(),
      viewport: { width, height, devicePixelRatio: window.devicePixelRatio || 1 },
      expectedIphone14Portrait: width === 390,
      overflow,
      smallTargets,
      visualViewport: Boolean(window.visualViewport)
    };

    saveReport(
      overflow.length || smallTargets.length ? "warn" : "ok",
      overflow.length ? "Kontrola iPhonu 14 našla přetékání." : "Rozvržení pro iPhone 14 prošlo základní kontrolou.",
      report
    ).catch(console.warn);
    renderStatus();
    emit("cht.chybozrout.iphone-checked", report);
    return report;
  }

  function setBusy(next) {
    busy = next;
    if (!ui) return;
    ui.root.querySelectorAll("button").forEach(button => {
      button.disabled = next;
    });
  }

  function setMessage(message, tone = "ready") {
    if (!ui) return;
    ui.message.textContent = message;
    ui.message.dataset.tone = tone;
  }

  function createButton(label, action, className = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chyboDomovButton " + className;
    button.textContent = label;
    button.addEventListener("click", action);
    return button;
  }

  function injectStyles() {
    if (document.getElementById("chtChybozroutDomovStyle")) return;

    const style = document.createElement("style");
    style.id = "chtChybozroutDomovStyle";
    style.textContent = `
      #chtChybozroutDomov{margin:12px 0 4px;padding:10px;border:1px solid rgba(255,212,145,.25);border-radius:14px;background:rgba(10,8,6,.64);color:#ffe7bd}
      #chtChybozroutDomov .chyboDomovTop{display:flex;align-items:center;justify-content:space-between;gap:8px}
      #chtChybozroutDomov strong{font-size:12px;letter-spacing:.04em}
      #chtChybozroutDomov p{margin:5px 0 9px;color:#d7c6a5;font-size:11px;line-height:1.35}
      #chtChybozroutDomov .chyboDomovButtons{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
      #chtChybozroutDomov .chyboDomovButton{min-height:44px;padding:7px;border:1px solid rgba(255,214,151,.28);border-radius:10px;background:#24180f;color:#ffe7bd;font:inherit;font-size:11px;line-height:1.2;cursor:pointer}
      #chtChybozroutDomov .chyboDomovButton:hover,#chtChybozroutDomov .chyboDomovButton:focus-visible{background:#3a2514;outline:2px solid #f5c369;outline-offset:2px}
      #chtChybozroutDomov .chyboDomovButton.primary{background:#705018;color:#fff6df;border-color:#f3c262}
      #chtChybozroutDomov .chyboDomovButton:disabled{opacity:.55;cursor:wait}
      #chtChybozroutDomov .chyboDomovMessage{display:block;margin-top:8px;font-size:11px;color:#d7c6a5}
      #chtChybozroutDomov .chyboDomovMessage[data-tone="warn"]{color:#ffc487}
      #chtChybozroutDomov .chyboDomovMessage[data-tone="ok"]{color:#b9e6a8}
      #chtChybozroutDomov .chyboDomovSnapshots{display:grid;gap:7px;margin-top:9px;max-height:206px;overflow:auto}
      #chtChybozroutDomov .chyboSnapshot{padding:8px;border-radius:10px;background:rgba(255,255,255,.04);font-size:10px}
      #chtChybozroutDomov .chyboSnapshotHead{display:flex;justify-content:space-between;gap:8px;color:#ffe7bd}
      #chtChybozroutDomov .chyboSnapshotActions{display:flex;gap:6px;margin-top:7px}
      #chtChybozroutDomov .chyboSnapshotActions button{min-height:36px;flex:1;padding:5px;border-radius:8px;border:1px solid rgba(255,214,151,.25);background:#17110c;color:#ffe7bd;font:inherit;font-size:10px}
      @media (max-width:420px){#chtChybozroutDomov{margin-top:9px}#chtChybozroutDomov .chyboDomovButtons{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(style);
  }

  function injectUI() {
    if (ui || document.getElementById("chtChybozroutDomov")) return;

    const existingGrid = document.querySelector("#repairPanel .repairGrid");
    const host = existingGrid?.parentElement || document.querySelector("#repairPanel") || document.body;
    const root = document.createElement("section");
    root.id = "chtChybozroutDomov";
    root.setAttribute("aria-label", "Domov Chybožrouta");

    const top = document.createElement("div");
    top.className = "chyboDomovTop";
    const title = document.createElement("strong");
    title.textContent = "⌂ Domov a stálá Paměť";
    top.appendChild(title);

    const description = document.createElement("p");
    description.textContent = "Při otevření zkontroluje Paměť a cache. Nové body obnovy přidává, staré nepřepisuje.";

    const buttons = document.createElement("div");
    buttons.className = "chyboDomovButtons";
    const message = document.createElement("output");
    message.className = "chyboDomovMessage";
    message.setAttribute("aria-live", "polite");
    const snapshots = document.createElement("div");
    snapshots.className = "chyboDomovSnapshots";
    snapshots.hidden = true;

    ui = { root, message, snapshots };

    buttons.append(
      createButton("⌘ Úplný scan", async () => {
        await runTask("Skenuji cesty, Paměť a aktuální cache…", async () => {
          const report = await fullScan();
          setMessage(report.failedAssets.length ?
            "Scan našel " + report.failedAssets.length + " nefunkčních cest — zůstaly uložené pro opravu." :
            "Scan je v pořádku; aktuální cache byla ověřena.",
            report.failedAssets.length ? "warn" : "ok");
        });
      }, "primary"),
      createButton("🛟 Uložit celé CHT", async () => {
        await runTask("Ukládám nový bod obnovy Paměti…", async () => {
          const snapshot = await createSnapshot("ruční uložení celého CHT", "manual");
          setMessage(snapshot.skipped ? snapshot.reason : "Uložen nový bod obnovy: " + formatTime(snapshot.createdAt), "ok");
          await renderSnapshotList();
        });
      }),
      createButton("↩︎ Obnovit Paměť", async () => {
        snapshots.hidden = !snapshots.hidden;
        await renderSnapshotList();
        setMessage(snapshots.hidden ? "Seznam snímků je skrytý." : "Vyber snímek; nejdřív se nabízí bezpečné doplnění.");
      }),
      createButton("▣ iPhone 14", async () => {
        const report = iphone14Check();
        setMessage(report.overflow.length ?
          "Nalezeno přetékání: " + report.overflow.join(", ") :
          "iPhone 14: bez vodorovného přetékání.",
          report.overflow.length || report.smallTargets.length ? "warn" : "ok");
      })
    );

    root.append(top, description, buttons, message, snapshots);

    if (existingGrid?.nextSibling) {
      host.insertBefore(root, existingGrid.nextSibling);
    } else {
      host.appendChild(root);
    }

    injectStyles();
    renderStatus();
  }

  async function runTask(label, task) {
    if (busy) return;
    setBusy(true);
    setMessage(label);

    try {
      await task();
    } catch (error) {
      const message = text(error?.message || error);
      setMessage("Chybožrout nic nezměnil: " + message, "warn");
      await saveReport("error", "Úkol Domova se nezdařil.", { error: message });
    } finally {
      setBusy(false);
    }
  }

  async function renderSnapshotList() {
    if (!ui) return;

    const snapshots = await listSnapshots();
    ui.snapshots.textContent = "";

    if (!snapshots.length) {
      const empty = document.createElement("p");
      empty.textContent = "Zatím není žádný snímek Paměti.";
      ui.snapshots.appendChild(empty);
      return;
    }

    for (const snapshot of snapshots.slice(0, 3)) {
      const card = document.createElement("article");
      card.className = "chyboSnapshot";
      const header = document.createElement("div");
      header.className = "chyboSnapshotHead";
      const label = document.createElement("strong");
      label.textContent = snapshot.label;
      const score = document.createElement("span");
      score.textContent = "shoda " + snapshot.relevance;
      header.append(label, score);

      const detail = document.createElement("div");
      detail.textContent = formatTime(snapshot.createdAt) + " · " + snapshot.keyCount + " klíčů";
      const actions = document.createElement("div");
      actions.className = "chyboSnapshotActions";
      const merge = document.createElement("button");
      merge.type = "button";
      merge.textContent = "Přidat chybějící";
      merge.addEventListener("click", async () => {
        await runTask("Doplňuji chybějící Paměť…", async () => {
          const outcome = await restoreSnapshot(snapshot.id, "merge");
          setMessage(outcome.conflicts.length ?
            "Doplněno " + outcome.changed.length + " položek; konflikty zůstaly nedotčené." :
            "Doplněno " + outcome.changed.length + " položek Paměti.",
            outcome.conflicts.length ? "warn" : "ok");
          await renderSnapshotList();
        });
      });

      const replace = document.createElement("button");
      replace.type = "button";
      replace.textContent = "Nahradit vše";
      replace.addEventListener("click", async () => {
        const accepted = window.confirm(
          "Nahradit současnou Paměť tímto snímkem? Současný stav se nejdřív uloží jako nový bod obnovy."
        );
        if (!accepted) return;

        await runTask("Obnovuji celý vybraný snímek…", async () => {
          const outcome = await restoreSnapshot(snapshot.id, "replace");
          setMessage("Obnoven snímek, změněno " + outcome.changed.length + " položek. Projeví se po obnovení stránky.", "ok");
          window.setTimeout(() => location.reload(), 420);
        });
      });

      actions.append(merge, replace);
      card.append(header, detail, actions);
      ui.snapshots.appendChild(card);
    }
  }

  function renderStatus() {
    if (!ui) return;
    const state = readState();
    const home = state.lastHomeCheck;

    if (!home) {
      setMessage("Připravuji první domácí kontrolu…");
    } else if (home.issues?.length) {
      setMessage("Domácí kontrola: " + home.issues[0], "warn");
    } else {
      setMessage("Domácí kontrola v pořádku · poslední bod: " + formatTime(state.lastSnapshotAt), "ok");
    }
  }

  function scheduleAutomaticSnapshot(reason) {
    window.clearTimeout(autoSaveTimer);
    autoSaveTimer = window.setTimeout(() => {
      createSnapshot("průběžný přírůstek: " + reason, "automatic")
        .then(snapshot => {
          if (!snapshot.skipped) renderStatus();
        })
        .catch(error => console.warn("CHT 360°‰.: průběžný bod obnovy se neuložil.", error));
    }, AUTO_SAVE_DELAY);
  }

  function connectLegacyChybozrout() {
    const extension = {
      homeCheck,
      scan: fullScan,
      saveWholeCht: () => createSnapshot("ruční uložení celého CHT", "manual"),
      listSnapshots,
      restoreSnapshot,
      iphone14Check
    };

    if (window.CHTChybozrout) {
      window.CHTChybozrout.domov = extension;
    }

    window.CHTChybozroutDomov = extension;
  }

  async function initialise() {
    injectUI();
    connectLegacyChybozrout();

    try {
      const existing = await latestSnapshot();
      if (!existing) {
        await createSnapshot("základní stav při prvním připojení Domova", "baseline");
      }
      await homeCheck("otevření CHT 360°‰.");
    } catch (error) {
      const message = text(error?.message || error);
      console.warn("CHT 360°‰.: Domov Chybožrouta se nespustil celý.", error);
      if (ui) setMessage("Domov čeká na opravu úložiště: " + message, "warn");
    }

    window.addEventListener("cht.memory.changed", event => {
      scheduleAutomaticSnapshot(event.detail?.reason || "změna Paměti");
    });

    window.addEventListener("storage", event => {
      if (event.key && isRelatedKey(event.key)) {
        scheduleAutomaticSnapshot("změna z jiného okna");
      }
    });

    window.addEventListener("pageshow", () => {
      homeCheck("návrat do CHT 360°‰.").catch(console.warn);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise, { once: true });
  } else {
    initialise();
  }
})();
