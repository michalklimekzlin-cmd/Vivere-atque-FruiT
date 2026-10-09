/*
  ChybaŽrout — Domov (doplňková vrstva pro CHT 360°‰.)

  Tento soubor pouze rozšiřuje existující window.CHTChybozrout.
  Nemění ani nemaže Paměť, IndexedDB, cache nebo stávající tlačítka.
  Obnovu vždy předává původnímu ChybaŽroutovi, který se nejdřív zeptá
  a před návratem vytvoří bezpečnostní snímek.
*/

const CHT_CHYBOZROUT_DOMOV_VERSION = "2026.08-safe-domov";
const CHT_EXPORT_PREFIXES = [
  "cht360_",
  "vaft_",
  "revia_",
  "glyph-cht-360-"
];

let domovMounted = false;
let domovElements = null;

function getChybozroutApi() {
  const api = window.CHTChybozrout;

  if (!api || typeof api !== "object") {
    throw new Error("Základní ChybaŽrout ještě není načtený.");
  }

  return api;
}

function formatTime(value) {
  if (!value) return "zatím neproběhlo";

  try {
    return new Date(value).toLocaleString("cs-CZ", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "neznámý čas";
  }
}

function setDomovStatus(message, tone = "ready") {
  if (!domovElements?.status) return;

  domovElements.status.textContent = message;
  domovElements.status.dataset.tone = tone;
}

function isChtKey(key) {
  const normalized = String(key || "").toLowerCase();

  return CHT_EXPORT_PREFIXES.some(prefix =>
    normalized.startsWith(prefix)
  );
}

function collectChtExport() {
  const values = {};
  const unavailable = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);

    if (!key || !isChtKey(key)) continue;

    try {
      values[key] = localStorage.getItem(key);
    } catch {
      unavailable.push(key);
    }
  }

  return {
    format: "cht360-export-v1",
    createdAt: new Date().toISOString(),
    source: "ChybaŽrout — Domov",
    version: CHT_CHYBOZROUT_DOMOV_VERSION,
    values,
    unavailable
  };
}

function downloadJson(filename, payload) {
  const blob = new Blob(
    [JSON.stringify(payload, null, 2)],
    { type: "application/json;charset=utf-8" }
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportWholeCht() {
  const payload = collectChtExport();

  const stamp = payload.createdAt
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");

  downloadJson("cht-360-zaloha-" + stamp + ".json", payload);

  const count = Object.keys(payload.values).length;
  const missing = payload.unavailable.length;

  return {
    count,
    missing,
    createdAt: payload.createdAt
  };
}

function inspectIphone14() {
  const viewport = window.visualViewport;
  const width = Math.round(viewport?.width || window.innerWidth || 0);
  const height = Math.round(viewport?.height || window.innerHeight || 0);
  const landscape = width > height;
  const panel = document.getElementById("repairPanel");
  const controls = panel
    ? Array.from(panel.querySelectorAll("button"))
    : [];
  const smallControls = controls.filter(button => {
    const rect = button.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 &&
      (rect.width < 44 || rect.height < 44);
  });

  const findings = [];

  if (!landscape) {
    findings.push("Telefon není otočený na šířku.");
  }

  if (width < 320 || height < 300) {
    findings.push("Aktivní plocha je menší než bezpečné minimum CHT.");
  }

  if (smallControls.length) {
    findings.push(
      "Některá viditelná tlačítka jsou menší než 44 × 44 bodů (" +
      smallControls.length + ")."
    );
  }

  return {
    device: "iPhone 14 — bezpečnostní kontrola rozhraní",
    width,
    height,
    landscape,
    visibleControls: controls.length,
    smallControls: smallControls.length,
    findings,
    ok: findings.length === 0
  };
}

function updateHistory() {
  if (!domovElements?.history) return;

  const api = window.CHTChybozrout;
  const report = typeof api?.getLastReport === "function"
    ? api.getLastReport()
    : null;
  const log = document.getElementById("repairLog");

  domovElements.history.textContent = "";

  const summary = document.createElement("p");
  summary.className = "chtDomovHistorySummary";

  if (!report) {
    summary.textContent = "První kontrola ještě neproběhla. Paměť se tím nemění.";
  } else {
    summary.textContent =
      "Poslední kontrola: " + formatTime(report.finishedAt) +
      " · nálezy: " + Number(report.failures || 0) +
      " · ověřené soubory: " + (Array.isArray(report.files) ? report.files.length : 0) + ".";
  }

  domovElements.history.appendChild(summary);

  const sourceLines = log
    ? Array.from(log.querySelectorAll(".repairLogLine"))
    : [];

  if (!sourceLines.length) {
    const empty = document.createElement("p");
    empty.className = "chtDomovHistoryEmpty";
    empty.textContent = "Zatím nejsou žádné záznamy oprav.";
    domovElements.history.appendChild(empty);
    return;
  }

  const list = document.createElement("ul");
  list.className = "chtDomovHistoryList";

  sourceLines.slice(0, 8).forEach(line => {
    const item = document.createElement("li");
    item.textContent = line.textContent.trim();
    list.appendChild(item);
  });

  domovElements.history.appendChild(list);
}

function toggleHistory() {
  if (!domovElements?.history) return;

  const willOpen = domovElements.history.hidden;
  domovElements.history.hidden = !willOpen;

  if (willOpen) {
    updateHistory();
    setDomovStatus("Historie oprav je otevřená.", "ok");
  } else {
    setDomovStatus("Historie oprav je schovaná.", "ready");
  }
}

async function runAction(button, action) {
  const label = button.dataset.label || button.textContent.trim();

  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  setDomovStatus(label + "…", "working");

  try {
    const result = await action();
    button.disabled = false;
    button.removeAttribute("aria-busy");
    return result;
  } catch (error) {
    button.disabled = false;
    button.removeAttribute("aria-busy");
    const message = String(error?.message || error || "neznámá chyba");
    setDomovStatus("Úkol se nedokončil: " + message, "warn");
    return null;
  }
}

function addStyles() {
  if (document.getElementById("cht-chybozrout-domov-style")) return;

  const style = document.createElement("style");
  style.id = "cht-chybozrout-domov-style";
  style.textContent = `
    .chtDomov {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 7px;
      margin: 10px 0;
      padding-top: 10px;
      border-top: 1px solid rgba(255, 226, 173, .16);
    }

    .chtDomovAction {
      min-width: 0;
      min-height: 44px;
      padding: 7px 8px;
      border: 1px solid rgba(255, 226, 173, .25);
      border-radius: 12px;
      color: #fff0c5;
      background: rgba(255, 226, 173, .07);
      font: inherit;
      font-size: clamp(10px, 1.2vw, 12px);
      font-weight: 800;
      line-height: 1.15;
      cursor: pointer;
      touch-action: manipulation;
    }

    .chtDomovAction:active {
      transform: translateY(1px);
    }

    .chtDomovAction:disabled {
      cursor: wait;
      opacity: .58;
    }

    .chtDomovStatus {
      margin: 0 0 8px;
      color: rgba(255, 240, 197, .72);
      font-size: 11px;
      line-height: 1.35;
    }

    .chtDomovStatus[data-tone="ok"] { color: #aee7ba; }
    .chtDomovStatus[data-tone="warn"] { color: #ffd17f; }
    .chtDomovStatus[data-tone="working"] { color: #ffe2ad; }

    .chtDomovHistory {
      margin: 0 0 10px;
      padding: 9px;
      border: 1px solid rgba(255, 226, 173, .16);
      border-radius: 12px;
      color: rgba(255, 240, 197, .82);
      background: rgba(0, 0, 0, .17);
      font-size: 11px;
      line-height: 1.35;
    }

    .chtDomovHistorySummary,
    .chtDomovHistoryEmpty { margin: 0; }

    .chtDomovHistoryList {
      display: grid;
      gap: 4px;
      margin: 8px 0 0;
      padding-left: 18px;
    }

    @media (max-width: 760px), (max-height: 470px) {
      .chtDomov {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .chtDomovAction {
        min-height: 40px;
        padding: 6px;
        font-size: 10px;
      }
    }
  `;

  document.head.appendChild(style);
}

function createAction(label, handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "chtDomovAction";
  button.dataset.label = label;
  button.textContent = label;
  button.addEventListener("click", () => handler(button));
  return button;
}

function mountDomov() {
  if (domovMounted) return true;

  const panel = document.getElementById("repairPanel");
  const grid = panel?.querySelector(".repairGrid");

  if (!panel || !grid) return false;

  addStyles();

  const status = document.createElement("p");
  status.className = "chtDomovStatus";
  status.dataset.tone = "ready";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.textContent = "Domov ChybaŽrouta je připravený. Paměť zůstává beze změny.";

  const actions = document.createElement("div");
  actions.className = "chtDomov";
  actions.setAttribute("aria-label", "Doplňkové funkce ChybaŽrouta");

  const history = document.createElement("section");
  history.className = "chtDomovHistory";
  history.hidden = true;
  history.setAttribute("aria-label", "Historie oprav");

  actions.append(
    createAction("Kontrola CHT", async button => {
      const report = await runAction(button, () => getChybozroutApi().scan());

      if (report) {
        setDomovStatus(
          Number(report.failures || 0)
            ? "Kontrola dokončena: nálezy čekají bezpečně ve frontě."
            : "Kontrola CHT je hotová a bez nálezů.",
          Number(report.failures || 0) ? "warn" : "ok"
        );
      }
    }),
    createAction("Uložit celé CHT", async button => {
      const exported = await runAction(button, exportWholeCht);

      if (exported) {
        setDomovStatus(
          "Vytvořen export " + exported.count + " místních záznamů. Nic se nemazalo.",
          exported.missing ? "warn" : "ok"
        );
      }
    }),
    createAction("Obnovit Paměť", async button => {
      const restored = await runAction(button, () => getChybozroutApi().restore());

      if (restored) {
        setDomovStatus("Obnova byla potvrzena. ChybaŽrout před ní vytvořil návratový snímek.", "ok");
      } else if (restored === false) {
        setDomovStatus("Obnova se nespustila; Paměť zůstala beze změny.", "ready");
      }
    }),
    createAction("iPhone 14", async button => {
      const result = await runAction(button, async () => inspectIphone14());

      if (result) {
        setDomovStatus(
          result.ok
            ? "Rozhraní sedí do bezpečné plochy iPhone 14."
            : result.findings.join(" "),
          result.ok ? "ok" : "warn"
        );
      }
    }),
    createAction("Historie oprav", async button => {
      await runAction(button, async () => {
        toggleHistory();
        return true;
      });
    })
  );

  grid.insertAdjacentElement("afterend", actions);
  actions.insertAdjacentElement("afterend", status);
  status.insertAdjacentElement("afterend", history);

  domovElements = { panel, status, history };
  domovMounted = true;

  window.addEventListener("cht.chybozrout.completed", () => {
    if (!history.hidden) updateHistory();
  });

  window.addEventListener("cht.chybozrout.repaired", () => {
    if (!history.hidden) updateHistory();
  });

  window.dispatchEvent(new CustomEvent("cht.chybozrout.domov.ready", {
    detail: { version: CHT_CHYBOZROUT_DOMOV_VERSION }
  }));

  return true;
}

function initialise() {
  if (mountDomov()) return;

  window.setTimeout(mountDomov, 120);
}

window.CHTChybozroutDomov = Object.freeze({
  version: CHT_CHYBOZROUT_DOMOV_VERSION,
  mount: mountDomov,
  inspectIphone14,
  exportWholeCht,
  showHistory() {
    if (domovElements?.history?.hidden) toggleHistory();
  }
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialise, { once: true });
} else {
  initialise();
}
/* Zobrazení historie: skryje jen vyřešené staré chyby Domova. */
(() => {
  "use strict";

  let observer = null;

  function isOldDomov404(row) {
    const text = String(row?.textContent || "").toLowerCase();
    return text.includes("chybozrout-domov.js") &&
      text.includes("soubor se nenačetl");
  }

  function refreshRepairLog() {
    const log = document.getElementById("repairLog");
    const queue = document.getElementById("repairQueue");

    if (!log) return;

    const rows = Array.from(log.querySelectorAll(".repairLogLine"));
    const resolved = new Set();

    rows.forEach((row, index) => {
      if (!isOldDomov404(row)) return;

      resolved.add(row);

      [rows[index - 1], rows[index + 1]].forEach(neighbour => {
        const text = String(neighbour?.textContent || "").toLowerCase();

        if (text.includes("běhová chyba: script error")) {
          resolved.add(neighbour);
        }
      });
    });

    resolved.forEach(row => {
      row.hidden = true;
      row.setAttribute("aria-hidden", "true");
    });

    const activeProblems = rows.filter(row =>
      !row.hidden &&
      (row.classList.contains("repairLogLine-error") ||
        row.classList.contains("repairLogLine-warn"))
    ).length;

    if (queue && resolved.size) {
      queue.textContent = String(activeProblems);
    }

    let notice = log.querySelector(".cht-domov-clean-log");

    if (resolved.size && !rows.some(row => !row.hidden)) {
      if (!notice) {
        notice = document.createElement("div");
        notice.className = "cht-domov-clean-log";
        notice.textContent = "Žádné aktuální chyby.";
        log.appendChild(notice);
      }
    } else {
      notice?.remove();
    }
  }

  function start() {
    const log = document.getElementById("repairLog");

    if (!log || observer) {
      refreshRepairLog();
      return;
    }

    observer = new MutationObserver(() => {
      requestAnimationFrame(refreshRepairLog);
    });

    observer.observe(log, { childList: true, subtree: true });
    refreshRepairLog();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  window.addEventListener("cht.chybozrout.completed", refreshRepairLog);
  window.addEventListener("cht.chybozrout.repaired", refreshRepairLog);
})();
