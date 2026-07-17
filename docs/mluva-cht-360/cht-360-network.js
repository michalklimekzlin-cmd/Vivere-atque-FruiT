/*
 * CHT 360°‰. — tichá společná síť PWA
 *
 * Tato vrstva není rozcestník. Každá aplikace dál vlastní svá data, ale při
 * ukládání je bezpečně zaznamená také do společné paměti CHT 360°‰. Zálohy
 * jsou verzované v IndexedDB; při její nedostupnosti zůstává aplikaci její
 * původní localStorage a síť pouze oznámí omezený režim.
 */
(function () {
  "use strict";

  var VERSION = 1;
  var DB_NAME = "cht360-network-v1";
  var DB_VERSION = 1;
  var MODULE_STORE = "modules";
  var SNAPSHOT_STORE = "snapshots";
  var BACKUP_STORE = "backups";
  var MODULES_KEY = "cht360_network_modules_v1";
  var BACKUP_KEY = "cht360_network_backup_v1";
  var PULSE_KEY = "cht360_network_pulse_v1";
  var SNAPSHOT_PREFIX = "cht360_network_snapshot_v1_";
  var CHANGE_EVENT = "cht360.network.changed";
  var MAX_SNAPSHOTS_PER_MODULE = 8;
  var MAX_BACKUPS = 6;
  var MAX_SNAPSHOT_BYTES = 1000000;
  var MAX_BACKUP_BYTES = 4000000;
  var MAX_FALLBACK_SNAPSHOT_BYTES = 120000;

  var expectedModules = [
    {
      id: "cht-360-core",
      label: "CHT 360°‰.",
      entry: "./index.html",
      kind: "pwa",
      storageKeys: [
        "cht360_pamet_v1",
        "vaft_pamet_v1",
        "vaft_pamet_scene_v2",
        "cht360_pamet_snapshots_v1",
        "cht360_trojka_models_v1",
        "cht360_glyph_drums_v1",
        "cht360_glyph_drums_custom_v1",
        "cht360_glyph_context_v1",
        "cht360_glyph_transfer_v1",
        "cht360_glyph_transfer_applied_v1",
        "cht360_iphone14_settings_v1"
      ],
      captureMode: "full"
    },
    {
      id: "glyph-cht-360",
      label: "Glyph CHT 360°‰.",
      entry: "./glyph-cht-360/",
      kind: "pwa",
      storageKeys: [
        "cht360_glyph_workshop_v1",
        "cht360_glyph_context_v1",
        "cht360_glyph_transfer_v1"
      ],
      captureMode: "full"
    },
    {
      id: "glyph-pokojicku-cht-360",
      label: "Glyph pokojíčků CHT 360°‰.",
      entry: "./glyph-pokojicku-cht-360/",
      kind: "pwa",
      storageKeys: ["glyph-cht-360-rooms.v1"],
      captureMode: "full"
    },
    {
      id: "cht-mluva",
      label: "Mluva CHT 360°‰.",
      entry: "./mluva-cht-360/",
      kind: "pwa",
      storageKeys: [
        "cht360_mluva_history_v1",
        "cht360_pamet_v1",
        "cht360_glyph_workshop_v1",
        "cht360_slot_locks_v1"
      ],
      captureMode: "full"
    },
    {
      id: "cht-360-bubinky",
      label: "Bubínky CHT 360°‰.",
      entry: "./bubinky/",
      kind: "pwa",
      storageKeys: [
        "cht360_bubinky_values_v1",
        "cht360_slot_locks_v1",
        "cht360_slot_unlocks_v1"
      ],
      captureMode: "full"
    },
    {
      id: "cht-360-jadra",
      label: "Jádra — pracovní deska CHT 360°‰.",
      entry: "./cht360-jadra-pracovni-deska/",
      kind: "app",
      storageKeys: ["cht360_jadra_pracovni_deska_v1"],
      captureMode: "full"
    },
    {
      id: "signal-360",
      label: "Signal 360°‰.",
      entry: "./signal-360/",
      kind: "pwa",
      storageKeys: ["vaft_pamet_v1"],
      captureMode: "full"
    }
  ];

  var databasePromise = null;
  var registered = {};
  var captureTimers = {};
  var storagePatched = false;

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function now() {
    return new Date().toISOString();
  }

  function text(value, limit) {
    var result = String(value === undefined || value === null ? "" : value).trim();
    return typeof limit === "number" ? result.slice(0, limit) : result;
  }

  function uniqueStrings(values) {
    var result = [];
    var seen = {};

    (values || []).forEach(function (value) {
      var item = text(value, 120);
      if (!item || seen[item]) return;
      seen[item] = true;
      result.push(item);
    });

    return result;
  }

  function clone(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return null;
    }
  }

  function serialise(value) {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return null;
    }
  }

  function byteSize(value) {
    var source = typeof value === "string" ? value : serialise(value);
    if (source === null) return Infinity;

    try {
      if (window.TextEncoder) {
        return new window.TextEncoder().encode(source).length;
      }
    } catch (error) {
      /* Starší Safari bez TextEncoderu používá bezpečný přibližný výpočet. */
    }

    return source.length * 2;
  }

  function parseJson(value) {
    try {
      return { ok: true, value: JSON.parse(value) };
    } catch (error) {
      return { ok: false, error: error };
    }
  }

  function readStorage(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function removeStorage(key) {
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  function moduleById(id) {
    var target = text(id, 80);

    for (var index = 0; index < expectedModules.length; index += 1) {
      if (expectedModules[index].id === target) return expectedModules[index];
    }

    return null;
  }

  function splitStorageKeys(value) {
    if (Array.isArray(value)) return uniqueStrings(value);
    return uniqueStrings(text(value).split(","));
  }

  function normaliseModule(meta) {
    var source = meta && typeof meta === "object" ? meta : {};
    var known = moduleById(source.id);
    var id = text(source.id || (known && known.id), 80).replace(/[^a-z0-9-]/gi, "-");

    if (!id) return null;

    var storageKeys = splitStorageKeys(
      source.storageKeys || (known && known.storageKeys) || []
    );
    var captureMode = text(source.captureMode || (known && known.captureMode) || "full", 20);

    return {
      id: id,
      label: text(source.label || (known && known.label) || id, 120),
      entry: text(source.entry || (known && known.entry) || "", 240),
      kind: text(source.kind || (known && known.kind) || "app", 40),
      storageKeys: storageKeys,
      captureMode: captureMode === "summary" ? "summary" : "full",
      version: VERSION,
      lastSeen: source.lastSeen || null,
      lastCaptureAt: source.lastCaptureAt || null,
      lastIssue: text(source.lastIssue || "", 240)
    };
  }

  function mergeModule(previous, changes) {
    var base = normaliseModule(previous || {}) || {};
    var source = changes && typeof changes === "object" ? changes : {};
    var id = text(source.id || base.id, 80);
    var known = moduleById(id);
    var sourceKeys = hasOwn(source, "storageKeys")
      ? splitStorageKeys(source.storageKeys)
      : [];

    if (!id) return null;

    return normaliseModule({
      id: id,
      label: text(source.label || base.label || (known && known.label) || id, 120),
      entry: text(source.entry || base.entry || (known && known.entry) || "", 240),
      kind: text(source.kind || base.kind || (known && known.kind) || "app", 40),
      storageKeys: sourceKeys.length
        ? uniqueStrings((base.storageKeys || []).concat(sourceKeys))
        : (base.storageKeys || (known && known.storageKeys) || []),
      captureMode: source.captureMode === "summary" ||
        (!source.captureMode && base.captureMode === "summary")
        ? "summary"
        : "full",
      lastSeen: hasOwn(source, "lastSeen") ? source.lastSeen : base.lastSeen,
      lastCaptureAt: hasOwn(source, "lastCaptureAt")
              ? source.lastCaptureAt
        : base.lastCaptureAt,
      lastIssue: hasOwn(source, "lastIssue") ? source.lastIssue : base.lastIssue
    });
  }

  function readFallbackModules() {
    var raw = readStorage(MODULES_KEY);
    var parsed = raw ? parseJson(raw) : null;

    if (!parsed || !parsed.ok || !parsed.value || typeof parsed.value !== "object") {
      return {};
    }

    return parsed.value;
  }

  function writeFallbackModules(records) {
    writeStorage(MODULES_KEY, JSON.stringify(records));
  }

  function writeFallbackModule(record) {
    var records = readFallbackModules();
    records[record.id] = record;
    writeFallbackModules(records);
  }

  function openDatabase() {
    if (databasePromise) return databasePromise;

    databasePromise = new Promise(function (resolve, reject) {
      if (!("indexedDB" in window)) {
        reject(new Error("IndexedDB není dostupná."));
        return;
      }

      var request;

      try {
        request = window.indexedDB.open(DB_NAME, DB_VERSION);
      } catch (error) {
        reject(error);
        return;
      }

      request.onupgradeneeded = function () {
        var db = request.result;

        if (!db.objectStoreNames.contains(MODULE_STORE)) {
          db.createObjectStore(MODULE_STORE, { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
          db.createObjectStore(SNAPSHOT_STORE, { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains(BACKUP_STORE)) {
          db.createObjectStore(BACKUP_STORE, { keyPath: "id" });
        }
      };

      request.onsuccess = function () {
        resolve(request.result);
      };

      request.onerror = function () {
        reject(request.error || new Error("Společná paměť se neotevřela."));
      };

      request.onblocked = function () {
        reject(new Error("Společná paměť čeká na zavření staršího okna."));
      };
    });

    return databasePromise;
  }

  function putRecord(storeName, record) {
    return openDatabase().then(function (db) {
      return new Promise(function (resolve, reject) {
        var transaction = db.transaction(storeName, "readwrite");
        var request = transaction.objectStore(storeName).put(record);

        request.onerror = function () {
          reject(request.error || new Error("Záznam se nepodařilo uložit."));
        };

        transaction.oncomplete = function () {
          resolve(record);
        };

        transaction.onerror = function () {
          reject(transaction.error || new Error("Zápis do společné paměti selhal."));
        };

        transaction.onabort = function () {
          reject(transaction.error || new Error("Zápis do společné paměti byl zastaven."));
        };
      });
    });
  }

  function deleteRecord(storeName, id) {
    return openDatabase().then(function (db) {
      return new Promise(function (resolve, reject) {
        var transaction = db.transaction(storeName, "readwrite");
        var request = transaction.objectStore(storeName).delete(id);

        request.onerror = function () {
          reject(request.error || new Error("Záznam se nepodařilo odstranit."));
        };

        transaction.oncomplete = function () {
          resolve(true);
        };

        transaction.onerror = function () {
          reject(transaction.error || new Error("Odstranění záznamu selhalo."));
        };
      });
    });
  }

  function readAllRecords(storeName) {
    return openDatabase().then(function (db) {
      return new Promise(function (resolve, reject) {
        var transaction = db.transaction(storeName, "readonly");
        var store = transaction.objectStore(storeName);
        var result = [];
        var request = store.openCursor();

        request.onsuccess = function () {
          var cursor = request.result;
          if (!cursor) return;
          result.push(cursor.value);
          cursor.continue();
        };

        request.onerror = function () {
          reject(request.error || new Error("Společná paměť se nepodařila přečíst."));
        };

        transaction.oncomplete = function () {
          resolve(result);
        };

        transaction.onerror = function () {
          reject(transaction.error || new Error("Čtení společné paměti selhalo."));
        };
      });
    });
  }

  function fallbackSnapshots() {
    var records = [];
    var known = expectedModules.slice();
    var modules = readFallbackModules();

    Object.keys(modules).forEach(function (id) {
      if (!moduleById(id)) known.push(modules[id]);
    });

    known.forEach(function (item) {
      var module = normaliseModule(item);
      if (!module) return;
      var raw = readStorage(SNAPSHOT_PREFIX + module.id);
      var parsed = raw ? parseJson(raw) : null;
      if (parsed && parsed.ok && parsed.value && typeof parsed.value === "object") {
        records.push(parsed.value);
      }
    });

    return records;
  }

  function fallbackBackups() {
    var raw = readStorage(BACKUP_KEY);
    var parsed = raw ? parseJson(raw) : null;

    if (!parsed || !parsed.ok || !parsed.value) return [];
    return Array.isArray(parsed.value) ? parsed.value : [parsed.value];
  }

  function writeFallbackBackup(backup) {
    var history = fallbackBackups()
      .filter(function (item) { return item && item.id !== backup.id; })
      .sort(function (first, second) {
        return String(second.createdAt).localeCompare(String(first.createdAt));
      });
    var next = [backup].concat(history).slice(0, MAX_BACKUPS);

    if (byteSize(next) > MAX_FALLBACK_SNAPSHOT_BYTES) {
      next = [backup];
    }

    if (byteSize(next) > MAX_FALLBACK_SNAPSHOT_BYTES) return false;
    return writeStorage(BACKUP_KEY, JSON.stringify(next));
  }

  function readNetworkData() {
    return Promise.all([
      readAllRecords(MODULE_STORE),
      readAllRecords(SNAPSHOT_STORE),
      readAllRecords(BACKUP_STORE)
    ]).then(function (records) {
      return {
        storage: "indexeddb",
        modules: records[0],
        snapshots: records[1],
        backups: records[2]
      };
    }).catch(function () {
      var fallback = readFallbackModules();
      return {
        storage: "local",
        modules: Object.keys(fallback).map(function (id) { return fallback[id]; }),
        snapshots: fallbackSnapshots(),
        backups: fallbackBackups()
      };
    });
  }

  function announce(reason, detail) {
    var payload = {
      reason: text(reason || "změna", 80),
      at: now(),
      detail: clone(detail || {}) || {}
    };

    try {
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: payload }));
    } catch (error) {
      /* Událost je jen doplněk; uložení tím nesmí spadnout. */
    }

    writeStorage(PULSE_KEY, JSON.stringify(payload));
  }

  function saveModule(record) {
    writeFallbackModule(record);

    return putRecord(MODULE_STORE, record).catch(function () {
      return record;
    });
  }

  function register(meta) {
    var incoming = normaliseModule(meta);
    if (!incoming) return Promise.resolve(null);

    var fallback = readFallbackModules();
    var record = mergeModule(fallback[incoming.id], meta);
    record.lastSeen = now();
    registered[record.id] = record;
        return saveModule(record).then(function () {
      announce("připojení", { moduleId: record.id });
      return record;
    });
  }

  function moduleRecord(id) {
    var known = moduleById(id);
    var fallback = readFallbackModules();
    var current = registered[id] || fallback[id] || known;
    return normaliseModule(current || { id: id });
  }

  function updateModule(record, changes) {
    var next = mergeModule(record, changes || {});
    registered[next.id] = next;
    return saveModule(next).then(function () {
      return next;
    });
  }

  function buildStorageSnapshot(module, reason) {
    var payload = {
      schema: "cht360-network-storage-v1",
      moduleId: module.id,
      capturedAt: now(),
      reason: text(reason || "uložení", 120),
      storage: {},
      missingKeys: [],
      invalidKeys: []
    };
    var summary = {
      keys: [],
      bytes: 0,
      invalidKeys: [],
      missingKeys: []
    };

    module.storageKeys.forEach(function (key) {
      var raw = readStorage(key);

      if (raw === null) {
        payload.missingKeys.push(key);
        summary.missingKeys.push(key);
        return;
      }

      var parsed = parseJson(raw);
      summary.keys.push(key);
      summary.bytes += byteSize(raw);

      if (!parsed.ok) {
        payload.invalidKeys.push(key);
        summary.invalidKeys.push(key);
        return;
      }

      if (module.captureMode === "summary") {
        payload.storage[key] = {
          mode: "summary",
          bytes: byteSize(raw),
          type: Array.isArray(parsed.value) ? "array" : typeof parsed.value
        };
        return;
      }

      payload.storage[key] = {
        mode: "json",
        value: parsed.value
      };
    });

    return {
      payload: payload,
      summary: summary,
      recoverable: module.captureMode !== "summary" &&
        Object.keys(payload.storage).length > 0
    };
  }

  function trimSnapshots(moduleId) {
    return readAllRecords(SNAPSHOT_STORE).then(function (snapshots) {
      var expired = snapshots
        .filter(function (item) { return item.moduleId === moduleId; })
        .sort(function (first, second) {
          return String(second.capturedAt).localeCompare(String(first.capturedAt));
        })
        .slice(MAX_SNAPSHOTS_PER_MODULE);

      return Promise.all(expired.map(function (item) {
        return deleteRecord(SNAPSHOT_STORE, item.id);
      }));
    }).catch(function () {
      return [];
    });
  }

  function saveFallbackSnapshot(snapshot) {
    var source = serialise(snapshot);
    if (source === null || byteSize(source) > MAX_FALLBACK_SNAPSHOT_BYTES) {
      return false;
    }

    return writeStorage(SNAPSHOT_PREFIX + snapshot.moduleId, source);
  }

  function captureStorage(moduleId, reason) {
    var module = moduleRecord(moduleId);
    if (!module) return Promise.resolve({ ok: false, reason: "unknown-module" });

    var built = buildStorageSnapshot(module, reason);
    var storedKeys = Object.keys(built.payload.storage);

    /*
     * Prázdný klíč nikdy nepřepíše starší zálohu. To chrání data, pokud je
     * prohlížeč právě vyčistil nebo pokud uživatel otevřel novou kostru.
     */
    if (!storedKeys.length && !built.summary.invalidKeys.length) {
      return updateModule(module, { lastIssue: "" }).then(function () {
        return { ok: true, skipped: "empty", moduleId: module.id };
      });
    }

    if (!storedKeys.length && built.summary.invalidKeys.length) {
      return updateModule(module, {
        lastIssue: "Některá data nejsou platný JSON: " + built.summary.invalidKeys.join(", ")
      }).then(function () {
        announce("poškozená-data", { moduleId: module.id });
        return { ok: false, reason: "invalid-json", moduleId: module.id };
      });
    }

    var payloadSize = byteSize(built.payload);

    if (payloadSize > MAX_SNAPSHOT_BYTES) {
      var tooLarge = "Sdílená záloha přesáhla limit " + MAX_SNAPSHOT_BYTES + " B; původní data zůstala beze změny.";
      return updateModule(module, {
        lastCaptureAt: module.lastCaptureAt,
        lastIssue: tooLarge
      }).then(function () {
        announce("omezená-záloha", { moduleId: module.id });
        return { ok: false, reason: "too-large", bytes: payloadSize, moduleId: module.id };
      });
    }

    var snapshot = {
      id: module.id + "-" + Date.now() + "-" + Math.random().toString(16).slice(2),
      moduleId: module.id,
      capturedAt: built.payload.capturedAt,
      reason: built.payload.reason,
      captureMode: module.captureMode,
      recoverable: built.recoverable,
      summary: built.summary,
      payload: built.payload
    };

    return putRecord(SNAPSHOT_STORE, snapshot).then(function () {
      return trimSnapshots(module.id);
    }).then(function () {
      return updateModule(module, {
        lastCaptureAt: snapshot.capturedAt,
        lastIssue: built.summary.invalidKeys.length
          ? "Některá data nejsou platný JSON: " + built.summary.invalidKeys.join(", ")
          : ""
      });
    }).then(function () {
      announce("uložení", { moduleId: module.id, snapshotId: snapshot.id });
      return { ok: true, moduleId: module.id, snapshot: snapshot };
    }).catch(function () {
      saveFallbackSnapshot(snapshot);
      return updateModule(module, {
        lastCaptureAt: snapshot.capturedAt,
        lastIssue: "Společná IndexedDB není právě dostupná; zůstala pouze omezená lokální kopie."
      }).then(function () {
        announce("omezené-uložení", { moduleId: module.id });
        return { ok: true, moduleId: module.id, snapshot: snapshot, storage: "local" };
      });
    });
  }

  function scheduleCapture(moduleId, reason) {
    if (captureTimers[moduleId]) window.clearTimeout(captureTimers[moduleId]);

    captureTimers[moduleId] = window.setTimeout(function () {
      delete captureTimers[moduleId];
      captureStorage(moduleId, reason).catch(function () {
        /* Vlastní aplikace pokračuje i při chybě společné sítě. */
      });
    }, 260);
  }

  function scheduleForStorageKey(key, reason) {
    var records = readFallbackModules();
    var modules = expectedModules.slice();

    Object.keys(records).forEach(function (id) {
      if (!moduleById(id)) modules.push(records[id]);
    });

    modules.forEach(function (candidate) {
      var module = normaliseModule(candidate);
      if (!module || module.storageKeys.indexOf(key) === -1) return;
      scheduleCapture(module.id, reason);
    });
  }

  function installStorageObserver() {
    if (storagePatched || !window.Storage || !window.Storage.prototype) return;
    storagePatched = true;

    var prototype = window.Storage.prototype;
    var originalSetItem = prototype.setItem;
    var originalRemoveItem = prototype.removeItem;
    var originalClear = prototype.clear;

    function isLocalStorage(instance) {
      try {
        return instance === window.localStorage;
      } catch (error) {
        return false;
      }
    }

    try {
      prototype.setItem = function (key, value) {
        var result = originalSetItem.apply(this, arguments);
        if (isLocalStorage(this)) scheduleForStorageKey(String(key), "uložení aplikace");
        return result;
      };

      prototype.removeItem = function (key) {
        var result = originalRemoveItem.apply(this, arguments);
        if (isLocalStorage(this)) scheduleForStorageKey(String(key), "odebrání dat aplikace");
        return result;
      };

      prototype.clear = function () {
        var result = originalClear.apply(this, arguments);
        if (isLocalStorage(this)) {
          expectedModules.forEach(function (module) {
            scheduleCapture(module.id, "vyčištění lokální paměti");
          });
        }
        return result;
      };
    } catch (error) {
      /* Některé uzamčené prohlížeče nedovolí prototyp rozšířit. */
    }

    window.addEventListener("storage", function (event) {
      if (event.key === PULSE_KEY) {
        try {
          var pulse = parseJson(event.newValue || "{}");
          if (pulse.ok) {
            window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: pulse.value }));
                      }
        } catch (error) {
          /* Příjem pulsu je nepovinný. */
        }
        return;
      }

      if (event.key) scheduleForStorageKey(event.key, "změna v jiném okně");
    });
  }

  function latestSnapshots(snapshots) {
    var result = {};

    (snapshots || []).forEach(function (snapshot) {
      if (!snapshot || !snapshot.moduleId) return;
      var current = result[snapshot.moduleId];

      if (!current || String(snapshot.capturedAt) > String(current.capturedAt)) {
        result[snapshot.moduleId] = snapshot;
      }
    });

    return result;
  }

  function buildHealth(data) {
    var moduleRecords = {};
    var latest = latestSnapshots(data.snapshots || []);
    var backup = (data.backups || []).sort(function (first, second) {
      return String(second.createdAt).localeCompare(String(first.createdAt));
    })[0] || null;

    (data.modules || []).forEach(function (item) {
      if (item && item.id) moduleRecords[item.id] = item;
    });

    var modules = expectedModules.map(function (definition) {
      var record = normaliseModule(moduleRecords[definition.id] || definition);
      var snapshot = latest[definition.id] || null;

      return {
        id: definition.id,
        label: definition.label,
        lastSeen: record.lastSeen || null,
        lastCaptureAt: record.lastCaptureAt || (snapshot && snapshot.capturedAt) || null,
        lastIssue: record.lastIssue || "",
        hasSnapshot: Boolean(snapshot),
        recoverable: Boolean(snapshot && snapshot.recoverable)
      };
    });

    var registeredCount = modules.filter(function (item) { return Boolean(item.lastSeen); }).length;
    var capturedCount = modules.filter(function (item) { return item.hasSnapshot; }).length;
    var issueCount = modules.filter(function (item) { return Boolean(item.lastIssue); }).length;

    return {
      version: VERSION,
      checkedAt: now(),
      storage: data.storage,
      expected: modules.length,
      registered: registeredCount,
      captured: capturedCount,
      issues: issueCount,
      backup: backup ? { id: backup.id, createdAt: backup.createdAt, label: backup.label } : null,
      modules: modules
    };
  }

  function health() {
    return readNetworkData().then(buildHealth);
  }

  function inspect() {
    return readNetworkData().then(function (data) {
      var report = buildHealth(data);
      var findings = [];

      expectedModules.forEach(function (definition) {
        definition.storageKeys.forEach(function (key) {
          var raw = readStorage(key);
          if (raw === null) return;
          if (!parseJson(raw).ok) {
            findings.push({
              level: "warn",
              moduleId: definition.id,
              key: key,
              message: "Uložená hodnota není platný JSON. Síť ji nepřepíše bez výslovného obnovení zálohy."
            });
          }
        });
      });

      report.modules.forEach(function (module) {
        if (module.lastIssue) {
          findings.push({
            level: "warn",
            moduleId: module.id,
            message: module.lastIssue
          });
        }
      });

      return {
        health: report,
        findings: findings,
        failures: findings.filter(function (item) { return item.level === "error"; }).length
      };
    });
  }

  function synchronize(reason) {
    var chain = Promise.resolve([]);

    expectedModules.forEach(function (definition) {
      chain = chain.then(function (results) {
        return captureStorage(definition.id, reason || "synchronizace sítě")
          .then(function (result) {
            results.push(result);
            return results;
          });
      });
    });

    return chain;
  }

  function trimBackups() {
    return readAllRecords(BACKUP_STORE).then(function (backups) {
      var expired = backups
        .sort(function (first, second) {
          return String(second.createdAt).localeCompare(String(first.createdAt));
        })
        .slice(MAX_BACKUPS);

      return Promise.all(expired.map(function (item) {
        return deleteRecord(BACKUP_STORE, item.id);
      }));
    }).catch(function () {
      return [];
    });
  }

  function createBackup(label) {
    return synchronize("záloha: " + text(label || "CHT 360°‰.", 100))
      .then(function () { return readNetworkData(); })
      .then(function (data) {
        var latest = latestSnapshots(data.snapshots || []);
        var snapshots = Object.keys(latest).map(function (id) { return latest[id]; });
        var backup = {
          id: "backup-" + Date.now() + "-" + Math.random().toString(16).slice(2),
          createdAt: now(),
          label: text(label || "CHT 360°‰.", 100),
          version: VERSION,
          snapshots: snapshots
        };

        if (byteSize(backup) > MAX_BACKUP_BYTES) {
          return {
            ok: false,
            reason: "too-large",
            message: "Společná záloha je příliš velká; jednotlivé poslední záznamy zůstaly zachované."
          };
        }

        return putRecord(BACKUP_STORE, backup)
          .then(function () { return trimBackups(); })
          .then(function () {
            announce("záloha", { backupId: backup.id });
            return { ok: true, backup: backup };
          })
          .catch(function () {
            if (writeFallbackBackup(backup)) {
              announce("omezená-záloha", { backupId: backup.id });
              return { ok: true, backup: backup, storage: "local" };
            }

            return {
              ok: false,
              reason: "storage-unavailable",
              message: "Společná paměť pro zálohu není dostupná."
            };
          });
      });
  }

  function findBackup(id) {
    return readNetworkData().then(function (data) {
      var backups = data.backups || [];
      var selected = null;

      backups.forEach(function (backup) {
        if (id && backup.id !== id) return;
        if (!selected || String(backup.createdAt) > String(selected.createdAt)) {
          selected = backup;
        }
      });

      return selected;
    });
  }

  function restoreModule(moduleId, backupId) {
    var module = moduleRecord(moduleId);
    if (!module) return Promise.resolve({ ok: false, reason: "unknown-module" });

    return findBackup(backupId).then(function (backup) {
      if (!backup) return { ok: false, reason: "missing-backup" };

      return createBackup("před obnovením " + module.label)
        .then(function (before) {
          if (!before.ok) return { ok: false, reason: "backup-failed", backup: before };

          var snapshot = (backup.snapshots || []).filter(function (item) {
            return item.moduleId === module.id && item.recoverable;
          })[0];

          if (!snapshot || !snapshot.payload || !snapshot.payload.storage) {
            return { ok: false, reason: "not-recoverable" };
          }

          var restored = [];
          Object.keys(snapshot.payload.storage).forEach(function (key) {
            var item = snapshot.payload.storage[key];
            if (!item || item.mode !== "json") return;
            if (writeStorage(key, JSON.stringify(item.value))) restored.push(key);
          });

          announce("obnovení", { moduleId: module.id, backupId: backup.id });
          return { ok: true, moduleId: module.id, backupId: backup.id, restoredKeys: restored };
        });
    });
  }

  function safeRepair() {
    return createBackup("ChybaŽrout — před bezpečnou opravou")
      .then(function (backup) {
        return inspect().then(function (report) {
          return {
            backup: backup,
            report: report,
            repaired: false,
            note: "Síť nic sama nepřepsala. Případné obnovení konkrétní paměti vyžaduje výslovný příkaz."
          };
        });
      });
  }

  function readScriptMeta() {
    var current = document.currentScript;

    if (!current || !current.getAttribute("data-cht-module")) {
      var scripts = document.querySelectorAll("script[src*='cht-360-network.js']");
      current = scripts.length ? scripts[scripts.length - 1] : null;
    }

    if (!current) return null;

    var id = current.getAttribute("data-cht-module");
    if (!id) return null;

    return {
      id: id,
      label: current.getAttribute("data-cht-label") || "",
      entry: current.getAttribute("data-cht-entry") || "",
      kind: current.getAttribute("data-cht-kind") || "",
      storageKeys: current.getAttribute("data-cht-storage-keys") || "",
      captureMode: current.getAttribute("data-cht-capture-mode") || ""
    };
  }

  window.CHT360Network = {
    version: VERSION,
    register: register,
    captureStorage: captureStorage,
    synchronize: synchronize,
    health: health,
    inspect: inspect,
    backup: createBackup,
    restoreModule: restoreModule,
    repair: safeRepair,
    expectedModules: function () {
      return clone(expectedModules) || [];
    }
  };

  installStorageObserver();

  var currentModule = readScriptMeta();
  if (currentModule) {
    register(currentModule).then(function (module) {
      if (module) scheduleCapture(module.id, "otevření aplikace");
    });
  }
})();
