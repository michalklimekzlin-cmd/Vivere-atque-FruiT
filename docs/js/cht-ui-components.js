(function (window, document) {
  "use strict";

  var config = window.CHT360Config;
  var navigation = window.CHT360Navigation;
  var logger = window.CHT360Logger || { info: function () {}, warn: function () {}, error: function () {}, getEntries: function () { return []; }, clear: function () {} };
  var performanceApi = window.CHT360Performance || { mark: function () {}, measure: function () {}, record: function () {}, noteStorage: function () {}, getEntries: function () { return []; } };

  if (!config || !navigation || window.CHT360UI) return;

  var lastStatusText = "";
  var syncState = "ok";

  function injectStyles() {
    if (document.getElementById("cht360-ui-shell-style")) return;
    var style = document.createElement("style");
    style.id = "cht360-ui-shell-style";
    style.textContent = [
      ":root{--cht360-gold-primary:#e7b65c;--cht360-gold-light:#f5e6c8;--cht360-gold-dark:#b8933c;--cht360-success:#4caf50;--cht360-error:#f44336;--cht360-warning:#ff9800;--cht360-shell-bg:rgba(10,8,7,.92);--cht360-shell-line:rgba(245,230,200,.2);--cht360-shell-shadow:0 18px 42px rgba(0,0,0,.34);--cht360-shell-font:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}",
      ".cht360-arc{position:fixed;z-index:9999;right:max(10px,env(safe-area-inset-right));bottom:max(10px,env(safe-area-inset-bottom));left:max(10px,env(safe-area-inset-left));display:grid;justify-items:center;pointer-events:none;font-family:var(--cht360-shell-font);}",
      ".cht360-arc *{box-sizing:border-box}",
      ".cht360-arc__panel{width:min(960px,100%);max-height:0;overflow:hidden;opacity:0;transform:translateY(34px);pointer-events:none;border:0 solid transparent;border-radius:34px 34px 18px 18px;background:var(--cht360-shell-bg);box-shadow:var(--cht360-shell-shadow);transition:max-height .34s ease,opacity .2s ease,transform .34s ease,border-color .2s ease;}",
      ".cht360-arc.is-open .cht360-arc__panel{max-height:min(58dvh,560px);opacity:1;transform:translateY(0);pointer-events:auto;border-width:1px;border-color:var(--cht360-shell-line);}",
      ".cht360-arc__inner{max-height:min(58dvh,560px);overflow:auto;padding:13px;scrollbar-width:thin;overscroll-behavior:contain;}",
      ".cht360-arc__signatures{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;width:min(620px,100%);margin:0 auto 11px;}",
      ".cht360-arc__signature{min-height:42px;display:flex;align-items:center;justify-content:center;padding:8px 10px;border:1px solid rgba(231,182,92,.25);border-radius:16px;background:linear-gradient(135deg,rgba(255,240,211,.14),rgba(255,255,255,.035));color:#fff0d3;font-size:12px;font-weight:800;letter-spacing:.02em;text-align:center;box-shadow:inset 0 0 18px rgba(255,226,173,.045);}",
      ".cht360-arc__utilities,.cht360-arc__modules{display:flex;align-items:flex-end;justify-content:center;gap:8px;flex-wrap:wrap;}",
      ".cht360-arc__utilities{padding:0 0 11px;border-bottom:1px solid rgba(245,230,200,.12);}",
      ".cht360-arc__modules{padding:14px 0 2px;}",
      ".cht360-arc__card,.cht360-shell__action{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:42px;padding:8px 13px;border:1px solid rgba(231,182,92,.28);border-radius:15px;background:rgba(255,240,211,.075);color:#fff0d3;font:750 13px/1.15 var(--cht360-shell-font);text-decoration:none;cursor:pointer;transform:translateY(calc(var(--cht360-arc-lift,0) * -1px));transition:transform .18s ease,background .18s ease,border-color .18s ease,box-shadow .18s ease;}",
      ".cht360-arc__card:hover,.cht360-arc__card:focus-visible,.cht360-shell__action:hover,.cht360-shell__action:focus-visible{outline:none;transform:translateY(calc(var(--cht360-arc-lift,0) * -1px - 2px));border-color:rgba(231,182,92,.72);background:rgba(231,182,92,.2);box-shadow:0 7px 18px rgba(0,0,0,.2);}",
      ".cht360-arc__card[aria-current='page']{border-color:rgba(231,182,92,.75);background:rgba(231,182,92,.23);color:#fff;}",
      ".cht360-arc__handle{position:relative;z-index:1;pointer-events:auto;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:150px;min-height:48px;margin-top:7px;padding:9px 19px;border:1px solid rgba(231,182,92,.42);border-radius:999px;background:linear-gradient(180deg,rgba(39,29,16,.98),rgba(13,10,8,.98));color:#fff0d3;box-shadow:0 9px 24px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,240,211,.12);font:900 14px/1 var(--cht360-shell-font);letter-spacing:.04em;cursor:pointer;transition:transform .2s ease,border-color .2s ease,background .2s ease;}",
      ".cht360-arc__handle:hover,.cht360-arc__handle:focus-visible{outline:none;transform:translateY(-2px);border-color:#f5e6c8;background:rgba(62,43,18,.98);}",
      ".cht360-arc__handle-glyph{font-size:18px;line-height:1;transition:transform .28s ease;}",
      ".cht360-arc.is-open .cht360-arc__handle-glyph{transform:rotate(180deg);}",
      ".cht360-toast-stack{position:fixed;right:max(12px,env(safe-area-inset-right));bottom:calc(env(safe-area-inset-bottom) + 74px);z-index:10000;display:grid;gap:10px;max-width:min(92vw,360px);}",
      ".cht360-toast{padding:12px 14px;border:1px solid rgba(231,182,92,.22);border-radius:16px;background:rgba(12,10,8,.94);color:#fff;box-shadow:var(--cht360-shell-shadow);font:500 14px/1.45 var(--cht360-shell-font);}",
      ".cht360-toast[data-tone='good']{border-color:rgba(76,175,80,.45)}.cht360-toast[data-tone='error']{border-color:rgba(244,67,54,.52)}.cht360-toast[data-tone='warn']{border-color:rgba(255,152,0,.5)}",
      ".cht360-shell-dialog{width:min(92vw,640px);border:1px solid rgba(231,182,92,.24);border-radius:24px;padding:0;background:#120f0c;color:#fff0d3;box-shadow:0 20px 50px rgba(0,0,0,.35);}",
      ".cht360-shell-dialog::backdrop{background:rgba(0,0,0,.55);backdrop-filter:blur(6px)}",
      ".cht360-shell-dialog__head,.cht360-shell-dialog__foot{display:flex;align-items:center;gap:12px;padding:16px 18px;border-bottom:1px solid rgba(231,182,92,.14)}",
      ".cht360-shell-dialog__foot{justify-content:flex-end;border-top:1px solid rgba(231,182,92,.14);border-bottom:0}",
      ".cht360-shell-dialog__body{display:grid;gap:14px;max-height:min(70vh,640px);overflow:auto;padding:18px}.cht360-shell-dialog__body pre{margin:0;padding:12px;border-radius:14px;background:rgba(255,255,255,.04);white-space:pre-wrap;word-break:break-word;color:#f5e6c8}.cht360-shell-dialog__body ul{margin:0;padding-left:18px}.cht360-shell-dialog__body li{margin:0 0 8px}",
      ".cht360-shell__spacer{flex:1}.cht360-shell-sr{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}[data-cht-loading='true']{opacity:.72;pointer-events:none}",
      "@media (max-width:560px){.cht360-arc{right:max(7px,env(safe-area-inset-right));bottom:max(7px,env(safe-area-inset-bottom));left:max(7px,env(safe-area-inset-left))}.cht360-arc__inner{padding:10px}.cht360-arc__signatures{gap:6px}.cht360-arc__signature{min-height:38px;padding:6px;font-size:10px}.cht360-arc__card{min-height:38px;padding:7px 10px;font-size:11px}.cht360-arc__utilities{padding-bottom:9px}.cht360-arc__modules{padding-top:11px}.cht360-arc__handle{min-height:44px;margin-top:5px;min-width:132px}}",
      "@media (prefers-reduced-motion:reduce){.cht360-arc__panel,.cht360-arc__card,.cht360-arc__handle,.cht360-arc__handle-glyph{transition:none!important}}"
    ].join("");
    document.head.appendChild(style);
  }

  function createButton(label, onClick, className) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = className || "cht360-shell__action";
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  function createShell() {
    if (document.getElementById("cht360-arc")) return;
    var current = navigation.getCurrentModule() || { id: "", title: "Paměť", longTitle: "CHT 360°‰." };
    var dock = document.createElement("div");
    dock.className = "cht360-arc";
    dock.id = "cht360-arc";

    var panel = document.createElement("section");
    panel.className = "cht360-arc__panel";
    panel.id = "cht360-arc-panel";
    panel.setAttribute("aria-label", "Oblouk přepínacích karet CHT 360°‰.");

    var inner = document.createElement("div");
    inner.className = "cht360-arc__inner";

    var signatures = document.createElement("div");
    signatures.className = "cht360-arc__signatures";
    ["Michal Klimek", "Terry", "Dominik"].forEach(function (name) {
      var card = document.createElement("div");
      card.className = "cht360-arc__signature";
      card.textContent = name;
      signatures.appendChild(card);
    });
    inner.appendChild(signatures);

    var utilities = document.createElement("nav");
    utilities.className = "cht360-arc__utilities";
    utilities.setAttribute("aria-label", "Rychlé ovládání CHT");
    utilities.appendChild(createButton("← Zpět", function () { navigation.goBack(); }, "cht360-arc__card"));
    utilities.appendChild(createButton("⌂ Domů", function () { navigation.goHome(); }, "cht360-arc__card"));
    utilities.appendChild(createButton("? Pomoc", openHelp, "cht360-arc__card"));
    utilities.appendChild(createButton("Ladění", openDebug, "cht360-arc__card"));
    inner.appendChild(utilities);

    var modules = document.createElement("nav");
    modules.className = "cht360-arc__modules";
    modules.setAttribute("aria-label", "Moduly CHT 360°‰.");
    var lifts = [10, 5, 1, 0, 1, 5, 10, 5, 1, 0];
    navigation.getModuleLinks().forEach(function (module, index) {
      var link = document.createElement("a");
      link.className = "cht360-arc__card";
      link.href = module.url;
      link.textContent = module.title;
      link.style.setProperty("--cht360-arc-lift", String(lifts[index % lifts.length]));
      if (current.id === module.id) link.setAttribute("aria-current", "page");
      modules.appendChild(link);
    });
    inner.appendChild(modules);
    panel.appendChild(inner);

    var handle = document.createElement("button");
    handle.type = "button";
    handle.className = "cht360-arc__handle";
    handle.setAttribute("aria-controls", panel.id);
    handle.setAttribute("aria-expanded", "false");
    handle.setAttribute("aria-label", "Otevřít oblouk přepínacích karet");
    handle.innerHTML = '<span class="cht360-arc__handle-glyph" aria-hidden="true">⌃</span><span> Karty</span>';

    function setOpen(open) {
      dock.classList.toggle("is-open", open);
      handle.setAttribute("aria-expanded", open ? "true" : "false");
      handle.setAttribute("aria-label", open ? "Zasunout oblouk přepínacích karet" : "Otevřít oblouk přepínacích karet");
    }

    handle.addEventListener("click", function () {
      setOpen(!dock.classList.contains("is-open"));
    });

    dock.appendChild(panel);
    dock.appendChild(handle);
    document.body.appendChild(dock);

    var stack = document.createElement("div");
    stack.className = "cht360-toast-stack";
    stack.id = "cht360-toast-stack";
    document.body.appendChild(stack);

    createDialog("help", "Rychlá pomoc");
    createDialog("debug", "Ladění a výkonnost");
  }

  function createDialog(kind, title) {
    if (document.getElementById("cht360-shell-dialog-" + kind)) return;
    var dialog = document.createElement("dialog");
    dialog.id = "cht360-shell-dialog-" + kind;
    dialog.className = "cht360-shell-dialog";
    dialog.innerHTML = '<form method="dialog"><div class="cht360-shell-dialog__head"><strong>' + title + '</strong><span class="cht360-shell__spacer"></span><button class="cht360-shell__action" type="submit">Zavřít</button></div><div class="cht360-shell-dialog__body" id="cht360-shell-dialog-body-' + kind + '"></div><div class="cht360-shell-dialog__foot"><button class="cht360-shell__action" type="submit">Hotovo</button></div></form>';
    document.body.appendChild(dialog);
  }

  function openDialog(kind) {
    var dialog = document.getElementById("cht360-shell-dialog-" + kind);
    if (!dialog) return;
    if (kind === "help") renderHelp();
    if (kind === "debug") renderDebug();
    if (typeof dialog.showModal === "function") dialog.showModal();
  }

  function openHelp() { openDialog("help"); }

  function openDebug() { openDialog("debug"); }

  function renderHelp() {
    var body = document.getElementById("cht360-shell-dialog-body-help");
    var current = navigation.getCurrentModule() || { title: "CHT", description: "" };
    body.innerHTML = "";
    var intro = document.createElement("p");
    intro.textContent = current.description || "Tento modul je součástí propojeného oběhu CHT 360°‰.";
    var list = document.createElement("ul");
    [
      "Šipka Karty u spodního okraje vysune nebo zasune oblouk ovládání.",
      "V oblouku jsou podpisové karty Michal Klimek, Terry a Dominik a cesty do hlavních částí CHT.",
      "Karty Paměť, Mluva, Glyphy, Pokojíčky, Bubínky, Jádra, Puls, Signal, ChybaŽrout a Revia vedou přímo do svých modulů.",
      "Klávesa Escape zavře otevřený dialog, panel nebo modální okno."
    ].forEach(function (text) {
      var item = document.createElement("li");
      item.textContent = text;
      list.appendChild(item);
    });
    body.appendChild(intro);
    body.appendChild(list);
  }

  function renderDebug() {
    var body = document.getElementById("cht360-shell-dialog-body-debug");
    body.innerHTML = "";
    var logs = document.createElement("pre");
    var logEntries = (window.CHT360Logger && window.CHT360Logger.getEntries ? window.CHT360Logger.getEntries() : []).slice(-20);
    logs.textContent = logEntries.length
      ? logEntries.map(function (entry) { return "[" + entry.level + "] " + entry.at + " · " + entry.message; }).join("\n")
      : "Zatím nejsou uložené žádné logy.";
    var perf = document.createElement("pre");
    var perfEntries = (window.CHT360Performance && window.CHT360Performance.getEntries ? window.CHT360Performance.getEntries() : []).slice(-12);
    perf.textContent = perfEntries.length
      ? perfEntries.map(function (entry) { return entry.at + " · " + entry.name + " · " + Math.round(entry.duration) + " ms · " + entry.detail; }).join("\n")
      : "Zatím nejsou uložená žádná měření.";
    var clear = createButton("Vymazat logy", function () {
      if (window.CHT360Logger && window.CHT360Logger.clear) window.CHT360Logger.clear();
      if (window.CHT360Performance && window.CHT360Performance.clear) window.CHT360Performance.clear();
      renderDebug();
      notify("good", "Místní logy a měření byly vymazány.");
    });
    body.appendChild(clear);
    body.appendChild(logs);
    body.appendChild(perf);
  }

  function notify(tone, message) {
    var text = String(message || "").trim();
    if (!text) return;
    var stack = document.getElementById("cht360-toast-stack");
    if (!stack) return;
    var toast = document.createElement("div");
    toast.className = "cht360-toast";
    toast.dataset.tone = tone || "info";
    toast.textContent = text;
    stack.appendChild(toast);
    window.setTimeout(function () {
      toast.remove();
    }, 3400);
  }

  function setSyncState(state, label) {
    syncState = state;
    var sync = document.getElementById("cht360-shell-sync");
    if (!sync) return;
    sync.dataset.state = state;
    var text = sync.querySelector(".cht360-shell__status-label");
    if (text) text.textContent = label;
  }

  function handleEscape(event) {
    if (event.key !== "Escape") return;
    var dialog = document.querySelector("dialog[open]");
    if (dialog && dialog.id.indexOf("cht360-shell-dialog") !== -1) {
      dialog.close();
      return;
    }
    if (dialog && typeof dialog.close === "function") {
      dialog.close();
      notify("info", "Panel byl zavřen klávesou Escape.");
      return;
    }
    var closer = document.querySelector("[data-close-modal], .close-button, [data-action='close-core'], [data-action='close-slot'], [data-action='close-room'], [data-action='close-info']");
    if (closer) {
      closer.click();
      notify("info", "Panel byl zavřen klávesou Escape.");
    }
  }

  function bindConfirmations() {
    document.querySelectorAll("[data-cht-confirm]").forEach(function (element) {
      if (element.dataset.chtConfirmBound === "true") return;
      element.dataset.chtConfirmBound = "true";
      element.addEventListener("click", function (event) {
        var message = element.getAttribute("data-cht-confirm") || "Opravdu pokračovat?";
        if (!window.confirm(message)) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }, true);
    });
  }

  function bindLoadingStates() {
    document.querySelectorAll("[data-cht-loading-label]").forEach(function (element) {
      if (element.dataset.chtLoadingBound === "true") return;
      element.dataset.chtLoadingBound = "true";
      element.addEventListener("click", function () {
        if (element.dataset.chtLoading === "true") return;
        var originalValue = element.tagName === "INPUT" ? element.value : "";
        var originalHtml = element.tagName === "INPUT" ? "" : element.innerHTML;
        var loading = element.getAttribute("data-cht-loading-label");
        element.dataset.chtLoading = "true";
        if (element.tagName === "INPUT") element.value = loading;
        else element.textContent = loading;
        if ("disabled" in element) element.disabled = true;
        window.setTimeout(function () {
          if (element.tagName === "INPUT") element.value = originalValue;
          else element.innerHTML = originalHtml;
          element.dataset.chtLoading = "false";
          if ("disabled" in element) element.disabled = false;
        }, 1200);
      });
    });
  }

  function observeStatuses() {
    var targets = document.querySelectorAll("[role='status'], #status, #status-message, #saveStatus, #connectionState, .status");
    targets.forEach(function (target) {
      var observer = new MutationObserver(function () {
        var text = String(target.textContent || "").trim();
        if (!text || text === lastStatusText) return;
        lastStatusText = text;
        var tone = /chyb|nepodař|fail|error|nelze/i.test(text) ? "error" : (/hotov|uložen|připraven|odemčen|zamčen/i.test(text) ? "good" : "info");
        logger.info("status", text);
        notify(tone, text);
      });
      observer.observe(target, { childList: true, characterData: true, subtree: true });
    });
  }

  function listenForSync() {
    var current = navigation.getCurrentModule() || { storageKeys: [] };
    var keys = (current.storageKeys || []).slice();
    window.addEventListener("storage", function (event) {
      if (keys.length && keys.indexOf(event.key || "") === -1) return;
      setSyncState("stale", "Změna v jiném okně");
      performanceApi.noteStorage(event.key || "unknown");
      logger.warn("storage-sync", event.key || "unknown");
      notify("warn", "Data se změnila v jiném okně. Rozhraní bylo označeno k synchronizaci.");
      window.setTimeout(function () {
        setSyncState("ok", "Synchronizováno");
      }, 2200);
    });
    if ("BroadcastChannel" in window) {
      var channel = new BroadcastChannel("cht360-ui-shell");
      channel.addEventListener("message", function (event) {
        if (!event.data || event.data.type !== "cht360-ui-shell-sync") return;
        setSyncState("stale", event.data.label || "Změna v jiném okně");
      });
      window.CHT360UISyncChannel = channel;
    }
  }

  function broadcastSync(label) {
    try {
      if (window.CHT360UISyncChannel) {
        window.CHT360UISyncChannel.postMessage({ type: "cht360-ui-shell-sync", label: label || "Změna v jiném okně" });
      }
    } catch (error) {
      logger.warn("broadcast-sync-failed", error && error.message ? error.message : error);
    }
  }

  function initShell() {
    if (document.body.dataset.cht360ShellReady === "true") return;
    document.body.dataset.cht360ShellReady = "true";
    performanceApi.mark("cht360-shell-start");
    injectStyles();
    createShell();
    bindConfirmations();
    bindLoadingStates();
    observeStatuses();
    listenForSync();
    document.addEventListener("keydown", handleEscape);
    logger.info("ui-shell-ready", navigation.getCurrentModule() && navigation.getCurrentModule().id);
    performanceApi.measure("cht360-shell-init", "cht360-shell-start");
  }

  window.CHT360UI = {
    initShell: initShell,
    notify: notify,
    setSyncState: setSyncState,
    openHelp: openHelp,
    openDebug: openDebug,
    broadcastSync: broadcastSync
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initShell, { once: true });
  } else {
    initShell();
  }
})(window, document);


