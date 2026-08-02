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
      ":root{--cht360-gold-primary:#e7b65c;--cht360-gold-light:#f5e6c8;--cht360-gold-dark:#b8933c;--cht360-bg-primary:#fafaf8;--cht360-bg-secondary:#f0ede6;--cht360-text-primary:#2a2a2a;--cht360-text-secondary:#666666;--cht360-border:#d4cfc5;--cht360-success:#4caf50;--cht360-error:#f44336;--cht360-warning:#ff9800;--cht360-info:#2196f3;--cht360-cream:#fff0d3;--cht360-shell-bg:rgba(10,8,7,.88);--cht360-shell-line:rgba(245,230,200,.18);--cht360-shell-shadow:0 14px 32px rgba(0,0,0,.24);--cht360-shell-radius:18px;--cht360-shell-gap:12px;--cht360-shell-font:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}",
      ".cht360-shell{position:fixed;left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));z-index:9999;font-family:var(--cht360-shell-font);pointer-events:none}",
      ".cht360-shell *{box-sizing:border-box}",
      ".cht360-shell--top{top:max(10px,env(safe-area-inset-top))}",
      ".cht360-shell--bottom{bottom:max(10px,env(safe-area-inset-bottom))}",
      ".cht360-shell__panel{pointer-events:auto;display:flex;align-items:center;gap:var(--cht360-shell-gap);padding:10px 12px;border:1px solid var(--cht360-shell-line);border-radius:var(--cht360-shell-radius);background:var(--cht360-shell-bg);backdrop-filter:blur(18px);box-shadow:var(--cht360-shell-shadow);color:var(--cht360-gold-light)}",
      ".cht360-shell__nav{display:flex;align-items:center;gap:8px;min-width:0;flex:1}",
      ".cht360-shell__crumbs{display:flex;align-items:center;gap:6px;min-width:0;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".cht360-shell__crumbs span:last-child{color:#fff}",
      ".cht360-shell__menu{display:flex;gap:8px;overflow:auto;scrollbar-width:none;padding-top:8px}",
      ".cht360-shell__menu::-webkit-scrollbar{display:none}",
      ".cht360-shell__chip,.cht360-shell__action,.cht360-shell__link{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:44px;padding:0 14px;border:1px solid rgba(231,182,92,.24);border-radius:999px;background:rgba(255,240,211,.08);color:#fff0d3;text-decoration:none;font-size:14px;cursor:pointer;transition:transform .18s ease,background .18s ease,border-color .18s ease}",
      ".cht360-shell__chip[aria-current='page']{background:rgba(231,182,92,.22);border-color:rgba(231,182,92,.5);color:#fff}",
      ".cht360-shell__action:hover,.cht360-shell__chip:hover,.cht360-shell__link:hover,.cht360-shell__action:focus-visible,.cht360-shell__chip:focus-visible,.cht360-shell__link:focus-visible{outline:none;transform:translateY(-1px);border-color:rgba(231,182,92,.65);background:rgba(231,182,92,.18)}",
      ".cht360-shell__badge{display:inline-flex;align-items:center;min-height:32px;padding:0 10px;border-radius:999px;background:rgba(231,182,92,.18);color:#fff;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}",
      ".cht360-shell__spacer{flex:1}",
      ".cht360-shell__status{display:inline-flex;align-items:center;gap:8px;min-height:32px;padding:0 10px;border-radius:999px;background:rgba(255,255,255,.06);font-size:12px;color:#fff0d3}",
      ".cht360-shell__status-dot{width:10px;height:10px;border-radius:50%;background:var(--cht360-success);box-shadow:0 0 0 4px rgba(76,175,80,.14)}",
      ".cht360-shell__status[data-state='stale'] .cht360-shell__status-dot{background:var(--cht360-warning);box-shadow:0 0 0 4px rgba(255,152,0,.18)}",
      ".cht360-shell__status[data-state='error'] .cht360-shell__status-dot{background:var(--cht360-error);box-shadow:0 0 0 4px rgba(244,67,54,.18)}",
      ".cht360-toast-stack{position:fixed;right:max(12px,env(safe-area-inset-right));bottom:max(80px,calc(env(safe-area-inset-bottom) + 80px));z-index:10000;display:grid;gap:10px;max-width:min(92vw,360px)}",
      ".cht360-toast{padding:12px 14px;border-radius:16px;border:1px solid rgba(231,182,92,.22);background:rgba(12,10,8,.92);color:#fff;box-shadow:var(--cht360-shell-shadow);font:500 14px/1.45 var(--cht360-shell-font)}",
      ".cht360-toast[data-tone='good']{border-color:rgba(76,175,80,.45)}",
      ".cht360-toast[data-tone='error']{border-color:rgba(244,67,54,.52)}",
      ".cht360-toast[data-tone='warn']{border-color:rgba(255,152,0,.5)}",
      ".cht360-shell-dialog{width:min(92vw,640px);border:1px solid rgba(231,182,92,.24);border-radius:24px;padding:0;background:#120f0c;color:#fff0d3;box-shadow:0 20px 50px rgba(0,0,0,.35)}",
      ".cht360-shell-dialog::backdrop{background:rgba(0,0,0,.55);backdrop-filter:blur(6px)}",
      ".cht360-shell-dialog__head,.cht360-shell-dialog__foot{display:flex;align-items:center;gap:12px;padding:16px 18px;border-bottom:1px solid rgba(231,182,92,.14)}",
      ".cht360-shell-dialog__foot{border-top:1px solid rgba(231,182,92,.14);border-bottom:0;justify-content:flex-end}",
      ".cht360-shell-dialog__body{padding:18px;display:grid;gap:14px;max-height:min(70vh,640px);overflow:auto}",
      ".cht360-shell-dialog__body pre{margin:0;padding:12px;border-radius:14px;background:rgba(255,255,255,.04);white-space:pre-wrap;word-break:break-word;color:#f5e6c8}",
      ".cht360-shell-dialog__body ul{margin:0;padding-left:18px}",
      ".cht360-shell-dialog__body li{margin:0 0 8px}",
      ".cht360-shell-sr{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}",
      "[data-cht-loading='true']{opacity:.72;pointer-events:none}",
      "@media (max-width: 768px){.cht360-shell__panel{padding:10px}.cht360-shell__crumbs{display:none}.cht360-shell__menu{padding-top:0}.cht360-shell__status-label{display:none}}"
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
    if (document.getElementById("cht360-shell-top")) return;
    var current = navigation.getCurrentModule() || { title: "CHT", longTitle: "CHT 360°‰." };
    var top = document.createElement("div");
    top.className = "cht360-shell cht360-shell--top";
    top.id = "cht360-shell-top";
    var panel = document.createElement("div");
    panel.className = "cht360-shell__panel";

    var nav = document.createElement("div");
    nav.className = "cht360-shell__nav";
    nav.appendChild(createButton("← Zpět", function () { navigation.goBack(); }));
    nav.appendChild(createButton("⌂ Domů", function () { navigation.goHome(); }));

    var crumbWrap = document.createElement("div");
    var badge = document.createElement("span");
    badge.className = "cht360-shell__badge";
    badge.textContent = current.badge || current.title || "Modul";
    crumbWrap.appendChild(badge);

    var crumbs = document.createElement("div");
    crumbs.className = "cht360-shell__crumbs";
    navigation.getBreadcrumbs().forEach(function (crumb, index, all) {
      var part = document.createElement("span");
      part.textContent = crumb.label;
      crumbs.appendChild(part);
      if (index < all.length - 1) {
        var sep = document.createElement("span");
        sep.textContent = "›";
        crumbs.appendChild(sep);
      }
    });
    crumbWrap.appendChild(crumbs);
    nav.appendChild(crumbWrap);
    panel.appendChild(nav);

    panel.appendChild(createButton("? Pomoc", openHelp));
    var sync = document.createElement("div");
    sync.className = "cht360-shell__status";
    sync.id = "cht360-shell-sync";
    sync.dataset.state = "ok";
    sync.innerHTML = '<span class="cht360-shell__status-dot" aria-hidden="true"></span><span class="cht360-shell__status-label">Synchronizováno</span>';
    panel.appendChild(sync);
    top.appendChild(panel);

    var menu = document.createElement("nav");
    menu.className = "cht360-shell__panel cht360-shell__menu";
    menu.setAttribute("aria-label", "Rychlé moduly CHT 360°‰.");
    navigation.getModuleLinks().forEach(function (module) {
      var link = document.createElement("a");
      link.className = "cht360-shell__chip";
      link.href = module.url;
      link.textContent = module.title;
      if ((current && current.id) === module.id) link.setAttribute("aria-current", "page");
      menu.appendChild(link);
    });
    top.appendChild(menu);
    document.body.appendChild(top);

    var bottom = document.createElement("div");
    bottom.className = "cht360-shell cht360-shell--bottom";
    bottom.id = "cht360-shell-bottom";
    var bottomPanel = document.createElement("div");
    bottomPanel.className = "cht360-shell__panel";
    var moduleState = document.createElement("div");
    moduleState.className = "cht360-shell__status";
    moduleState.innerHTML = '<span class="cht360-shell__status-dot" aria-hidden="true"></span><span>' + (current.longTitle || current.title) + '</span>';
    bottomPanel.appendChild(moduleState);
    bottomPanel.appendChild(createButton("ChybaŽrout", function () { navigation.openModule("cht-chybozrout"); }, "cht360-shell__action"));
    bottomPanel.appendChild(createButton("Ladění", openDebug));
    var version = document.createElement("span");
    version.className = "cht360-shell__status";
    version.innerHTML = '<span>Verze ' + config.version + '</span>';
    bottomPanel.appendChild(version);
    bottom.appendChild(bottomPanel);
    document.body.appendChild(bottom);

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
      "Horní lišta drží Zpět, Domů, modul a rychlé přepínání mezi hlavními částmi.",
      "Klávesa Escape zavře otevřený dialog, panel nebo modální okno.",
      "Spodní lišta ukazuje aktuální modul, stav synchronizace a rychlou cestu do ChybaŽrouta.",
      "Barevné notifikace potvrzují úspěch, varování i chybu při práci se stavem aplikace."
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
