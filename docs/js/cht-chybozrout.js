"use strict";

const CHYBOZROUT_STATE_KEY = "cht360_chybozrout_v2";
const CHYBOZROUT_BACKUP_KEY = "cht360_samoopravovna_backup_v1";
const BACKUP_KEYS = [
  "vaft_pamet_v1",
  "cht360_pamet_v1",
  "vaft_pamet_scene_v2"
];
const REQUIRED_FILES = [
  { label: "hlavní stránka", url: "./index.html" },
  { label: "styl Paměti", url: "./css/pamet.css" },
  { label: "jádra Paměti", url: "./js/aplikace.js" },
  { label: "Chybožrout", url: "./js/cht-chybozrout.js" },
  { label: "manifest", url: "./manifest.json" },
  { label: "offline vrstva", url: "./service-worker.js" }
];
const MAX_QUEUE = 60;

let busyTask = null;
let handlersInstalled = false;
let state = readState();

const ui = {
  panel: document.getElementById("repairPanel"),
  open: document.getElementById("openLifePanel"),
  close: document.getElementById("closeRepairPanel"),
  state: document.getElementById("repairState"),
  summary: document.getElementById("repairSummary"),
  queue: document.getElementById("repairQueue"),
  last: document.getElementById("repairLast"),
  log: document.getElementById("repairLog"),
  scan: document.getElementById("repairScan"),
  repair: document.getElementById("repairFix"),
  backup: document.getElementById("repairBackup"),
  restore: document.getElementById("repairRestore")
};

function createInitialState() {
  return {
    version: 2,
    queue: [],
    lastReport: null,
    lastBackupAt: null,
    lastRepairAt: null
  };
}

function readState() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(CHYBOZROUT_STATE_KEY) || "null"
    );

    if (!saved || typeof saved !== "object") {
      return createInitialState();
    }

    return {
      ...createInitialState(),
      ...saved,
      queue: Array.isArray(saved.queue)
        ? saved.queue.slice(-MAX_QUEUE)
        : []
    };
  } catch {
    return createInitialState();
  }
}

function writeState() {
  try {
    localStorage.setItem(
      CHYBOZROUT_STATE_KEY,
      JSON.stringify(state)
    );
  } catch {
    /* Diagnostic state must never stop the Paměť app. */
  }
}

function emit(name, detail) {
  window.dispatchEvent(
    new CustomEvent(name, { detail })
  );
}

function formatTime(value) {
  if (!value) {
    return "zatím neproběhlo";
  }

  try {
    return new Date(value).toLocaleString("cs-CZ", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  } catch {
    return "neznámý čas";
  }
}

function setPanelState(text, tone = "ready") {
  if (!ui.state) {
    return;
  }

  ui.state.textContent = text;
  ui.state.dataset.tone = tone;
}

function addEntry(kind, message, source = "") {
  const item = {
    id: Date.now() + "-" + Math.random().toString(16).slice(2),
    at: Date.now(),
    kind,
    message: String(message),
    source: String(source || "")
  };

  state.queue.push(item);

  if (state.queue.length > MAX_QUEUE) {
    state.queue.splice(0, state.queue.length - MAX_QUEUE);
  }

  writeState();
  render();
  emit("cht.chybozrout.event", item);
  return item;
}

function render() {
  if (!ui.panel) {
    return;
  }

  const report = state.lastReport;
  const failures = Number(report?.failures || 0);
  const problems = state.queue.filter(item =>
    item.kind === "error" || item.kind === "warn"
  ).length;

  if (ui.queue) {
    ui.queue.textContent = String(problems);
  }

  if (ui.last) {
    ui.last.textContent = formatTime(
      report?.finishedAt || state.lastRepairAt
    );
  }

  if (ui.summary) {
    if (!report) {
      ui.summary.textContent =
        "Připraveno. Samoopravovna nejdřív vytvoří zálohu a potom zkontroluje Paměť.";
    } else if (failures) {
      ui.summary.textContent =
        "Kontrola našla " + failures +
        " problémů. Bezpečná oprava obnoví offline vrstvu a připraví přesný report.";
    } else {
      ui.summary.textContent =
        "Poslední kontrola je v pořádku. Paměť i její offline vrstva odpovídají očekávané kostře.";
    }
  }

  if (!ui.log) {
    return;
  }

  ui.log.textContent = "";

  const entries = state.queue.slice(-42).reverse();

  if (!entries.length) {
    const empty = document.createElement("div");
    empty.className = "repairLogEmpty";
    empty.textContent = "Zatím žádné události.";
    ui.log.appendChild(empty);
    return;
  }

  for (const entry of entries) {
    const line = document.createElement("div");
    line.className = "repairLogLine repairLogLine-" + entry.kind;

    const when = document.createElement("time");
    when.textContent = formatTime(entry.at);

    const text = document.createElement("div");
    text.textContent = entry.message;

    line.append(when, text);

    if (entry.source) {
      const source = document.createElement("small");
      source.textContent = entry.source;
      line.appendChild(source);
    }

    ui.log.appendChild(line);
  }
}

function installGlobalHandlers() {
  if (handlersInstalled) {
    return;
  }

  handlersInstalled = true;

  window.addEventListener("error", event => {
    const target = event.target;

    if (
      target &&
      target !== window &&
      (target.src || target.href)
    ) {
      addEntry(
        "error",
        "Soubor se nenačetl.",
        target.src || target.href
      );
      return;
    }

    if (event.message) {
      addEntry(
        "error",
        "Běhová chyba: " + event.message,
        event.filename || ""
      );
    }
  }, true);

  window.addEventListener("unhandledrejection", event => {
    const reason = event.reason;
    addEntry(
      "error",
      "Nedokončený úkol: " +
        (reason?.message || String(reason || "neznámá chyba"))
    );
  });
}

async function probeFile(file) {
  const separator = file.url.includes("?") ? "&" : "?";
  const requestUrl =
    file.url + separator + "chybozrout=" + Date.now();

  try {
    const response = await fetch(requestUrl, {
      cache: "no-store"
    });

    return {
      ...file,
      ok: response.ok,
      status: response.status
    };
  } catch (error) {
    return {
      ...file,
      ok: false,
      status: "síťová chyba",
      error: String(error?.message || error)
    };
  }
}

async function inspectServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return {
      supported: false,
      active: false,
      scope: ""
    };
  }

  try {
    const registration =
      await navigator.serviceWorker.getRegistration();

    return {
      supported: true,
      active: Boolean(registration?.active),
      waiting: Boolean(registration?.waiting),
      scope: registration?.scope || ""
    };
  } catch (error) {
    return {
      supported: true,
      active: false,
      error: String(error?.message || error),
      scope: ""
    };
  }
}

async function runScan() {
  const startedAt = Date.now();
  setPanelState("skenuji", "working");
  addEntry("info", "Spouštím kontrolu Paměti.");

  const files = [];

  for (const file of REQUIRED_FILES) {
    const result = await probeFile(file);
    files.push(result);

    if (!result.ok) {
      addEntry(
        "error",
        "Nedostupné: " + result.label +
          " (" + result.status + ")",
        result.url
      );
    }
  }

  const serviceWorker = await inspectServiceWorker();

  if (!serviceWorker.supported) {
    addEntry(
      "warn",
      "Tento prohlížeč nepodporuje offline vrstvu."
    );
  } else if (!serviceWorker.active) {
    addEntry(
      "warn",
      "Offline vrstva není aktivní."
    );
  } else {
    addEntry(
      "ok",
      "Offline vrstva je aktivní."
    );
  }

  const failures = files.filter(file => !file.ok).length;

  const report = {
    system: "CHT 360°‰.",
    scanner: "[◉_◉] Chybožrout • Samoopravovna",
    startedAt,
    finishedAt: Date.now(),
    durationMs: Date.now() - startedAt,
    failures,
    files,
    serviceWorker
  };

  state.lastReport = report;
  writeState();

  setPanelState(
    failures ? "potřebuje pozornost" : "v pořádku",
    failures ? "warn" : "ok"
  );

  render();
  emit("cht.chybozrout.completed", report);
  return report;
}

function createBackup() {
  const values = {};

  for (const key of BACKUP_KEYS) {
    values[key] = localStorage.getItem(key);
  }

  const backup = {
    createdAt: new Date().toISOString(),
    values
  };

  localStorage.setItem(
    CHYBOZROUT_BACKUP_KEY,
    JSON.stringify(backup)
  );

  state.lastBackupAt = backup.createdAt;
  writeState();
  addEntry("ok", "Vytvořena bezpečná záloha Paměti.");
  emit("cht.chybozrout.backup", backup);
  return backup;
}

function restoreBackup() {
  let backup = null;

  try {
    backup = JSON.parse(
      localStorage.getItem(CHYBOZROUT_BACKUP_KEY) || "null"
    );
  } catch {
    backup = null;
  }

  if (!backup?.values) {
    addEntry("warn", "Zatím není z čeho Paměť obnovit.");
    return false;
  }

  const accepted = window.confirm(
    "Obnovit poslední zálohu Paměti? Současný stav bude nejdřív zachován v nové záloze."
  );

  if (!accepted) {
    return false;
  }

  createBackup();

  for (const key of BACKUP_KEYS) {
    const value = backup.values[key];

    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  }

  addEntry("ok", "Záloha obnovena. Paměť se nyní znovu načte.");

  window.setTimeout(() => {
    window.location.reload();
  }, 280);

  return true;
}

async function refreshServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return {
      ok: false,
      message: "Prohlížeč nepodporuje offline vrstvu."
    };
  }

  try {
    let registration =
      await navigator.serviceWorker.getRegistration();

    if (!registration) {
      registration = await navigator.serviceWorker.register(
        "./service-worker.js",
        { updateViaCache: "none" }
      );
    }

    await registration.update();

    if (registration.waiting) {
      registration.waiting.postMessage({
        type: "SKIP_WAITING"
      });
    }

    return {
      ok: true,
      message: "Offline vrstva byla zkontrolována a obnovena."
    };
  } catch (error) {
    return {
      ok: false,
      message: String(error?.message || error)
    };
  }
}

async function runSafeRepair() {
  const startedAt = Date.now();
  setPanelState("opravuji", "working");

  createBackup();

  const serviceWorker = await refreshServiceWorker();

  if (serviceWorker.ok) {
    addEntry("ok", serviceWorker.message);
  } else {
    addEntry("warn", "Offline vrstvu se nepodařilo obnovit: " + serviceWorker.message);
  }

  window.dispatchEvent(new Event("resize"));

  const report = await runScan();

  if (report.failures) {
    addEntry(
      "warn",
      "Zdrojové soubory vyžadují úpravu v repozitáři. Report zůstal bezpečně uložen."
    );
  } else {
    addEntry(
      "ok",
      "Bezpečná samooprava dokončena."
    );
  }

  state.lastRepairAt = Date.now();
  writeState();
  render();

  emit("cht.chybozrout.repaired", {
    startedAt,
    finishedAt: Date.now(),
    report
  });

  return report;
}

function runExclusive(operation) {
  if (busyTask) {
    return busyTask;
  }

  busyTask = Promise.resolve()
    .then(operation)
    .finally(() => {
      busyTask = null;
    });

  return busyTask;
}

function openPanel() {
  ui.panel?.classList.add("open");
  ui.panel?.setAttribute("aria-hidden", "false");
  ui.open?.classList.add("hidden");
  render();
}

function closePanel() {
  ui.panel?.classList.remove("open");
  ui.panel?.setAttribute("aria-hidden", "true");
  ui.open?.classList.remove("hidden");
}

function bindUI() {
  ui.open?.addEventListener("click", openPanel);
  ui.close?.addEventListener("click", closePanel);

  ui.scan?.addEventListener("click", () => {
    runExclusive(runScan).catch(error => {
      addEntry("error", "Sken selhal: " + String(error?.message || error));
    });
  });

  ui.repair?.addEventListener("click", () => {
    runExclusive(runSafeRepair).catch(error => {
      addEntry("error", "Samooprava selhala: " + String(error?.message || error));
    });
  });

  ui.backup?.addEventListener("click", createBackup);
  ui.restore?.addEventListener("click", restoreBackup);
}

function initialise() {
  if (!ui.panel) {
    return;
  }

  installGlobalHandlers();
  bindUI();
  setPanelState(
    state.lastReport?.failures ? "potřebuje pozornost" : "připraven",
    state.lastReport?.failures ? "warn" : "ready"
  );

  if (!state.queue.length) {
    addEntry("info", "Samoopravovna je připravená.");
  }

  render();
}

window.CHTChybozrout = {
  name: "[◉_◉] Chybožrout • Samoopravovna",
  connect() {
    installGlobalHandlers();
    return true;
  },
  open: openPanel,
  close: closePanel,
  scan() {
    return runExclusive(runScan);
  },
  repair() {
    return runExclusive(runSafeRepair);
  },
  backup: createBackup,
  restore: restoreBackup,
  getLastReport() {
    return state.lastReport;
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialise, { once: true });
} else {
  initialise();
}
