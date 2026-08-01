/*
  Batole × CHT 360°‰. — společný střed
  Při nahrání na GitHub tento soubor přejmenuj na: batole-core.js

  Tento modul je schválně samostatný: nepřepisuje stávající index.html.
  Čte jen data uložená na stejné doméně a nikdy sám nestahuje internetový obsah.
*/
(function batoleCore(window, document) {
  "use strict";

  const VERSION = "1.0.0";
  const STORAGE_KEY = "cht360_batole_v1";
  const CHANNEL_NAME = "cht360-batole";
  const MAX_EVENTS = 60;
  const MAX_GLYPH_MEMORIES = 30;
  const MAX_INBOX = 24;
  const MAX_SOURCES = 16;

  const GLYPHS = [
    { id: "play", glyph: "7i_", title: "Hra", core: "game" },
    { id: "ai", glyph: "°&", title: "Al a Mluva", core: "control" },
    { id: "create", glyph: "`ii´", title: "Tvorba", core: "language" },
    { id: "path", glyph: "j’", title: "Cesty", core: "earth" },
    { id: "identity", glyph: "i’", title: "Identita", core: "control" },
    { id: "question", glyph: "¿", title: "Otázky", core: "language" },
    { id: "signal", glyph: ",!,", title: "Signály", core: "control" },
    { id: "seed", glyph: ",_.", title: "Nový glyph", core: "earth" }
  ];

  const CHT_MEMORY_KEYS = [
    "cht360_pamet_v1",
    "cht360_pamet_snapshots_v1",
    "VaFiT_STORE",
    "VaFiT_MEMORY"
  ];
  const REVIA_KEYS = [
    "cht360_revia_v1",
    "cht360_revia_state_v1",
    "cht360_revia_signals_v1",
    "revia_memory_v1"
  ];
  const CHYBO_KEYS = [
    "cht360_chybozrout_v3",
    "cht360_chybozrout_v2",
    "cht360_chybozrout_kos_v1",
    "vaft.chzr.state"
  ];
  const SENSITIVE_KEY = /(?:pass(?:word)?|token|secret|api[_-]?key|authorization|cookie|session)/i;
  const VIVERE_KEY = /(?:vivere|vaft|vafit|glyph|background[_-]?color|description)/i;

  const view = {
    selectedGlyph: "signal",
    open: false,
    ui: {},
    lastSignature: "",
    lastEventAt: Object.create(null),
    channel: null
  };

  function time() { return Date.now(); }
  function iso() { return new Date().toISOString(); }
  function trimText(value, limit) {
    const clean = String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    return clean.length > limit ? `${clean.slice(0, Math.max(0, limit - 1))}…` : clean;
  }
  function safeJson(raw, fallback) {
    if (!raw || typeof raw !== "string") return fallback;
    try { return JSON.parse(raw); } catch (_) { return fallback; }
  }
  function readKey(key, fallback) {
    try { return safeJson(window.localStorage.getItem(key), fallback); } catch (_) { return fallback; }
  }
  function writeKey(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; }
  }
  function localKeys() {
    const keys = [];
    try {
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (key) keys.push(key);
      }
    } catch (_) { /* úložiště nemusí být dostupné */ }
    return keys;
  }
  function listOf(value) { return Array.isArray(value) ? value : []; }
  function glyphById(id) { return GLYPHS.find((glyph) => glyph.id === id) || GLYPHS[6]; }
  function glyphForCore(core) { return GLYPHS.find((glyph) => glyph.core === core) || GLYPHS[6]; }
  function eventBus(type, detail) {
    try { window.dispatchEvent(new CustomEvent(type, { detail })); } catch (_) { /* starší prohlížeč */ }
  }

  function blankGlyph(glyph) {
    return {
      id: glyph.id,
      glyph: glyph.glyph,
      title: glyph.title,
      memories: [],
      sources: [],
      lastSeenAt: null
    };
  }

  function blankState() {
    const glyphs = {};
    GLYPHS.forEach((glyph) => { glyphs[glyph.id] = blankGlyph(glyph); });
    return {
      version: VERSION,
      createdAt: iso(),
      updatedAt: iso(),
      cycle: 0,
      energy: 0,
      trust: 0,
      clarity: 0,
      glyphs,
      events: [],
      inbox: [],
      reflections: [],
      lastSnapshot: { slots: 0, vivere: 0, revia: 0, issues: 0, trash: 0 }
    };
  }

  function loadState() {
    const raw = readKey(STORAGE_KEY, null);
    const state = raw && typeof raw === "object" ? raw : blankState();
    state.version = VERSION;
    state.glyphs = state.glyphs && typeof state.glyphs === "object" ? state.glyphs : {};
    GLYPHS.forEach((glyph) => {
      const previous = state.glyphs[glyph.id] || {};
      state.glyphs[glyph.id] = {
        ...blankGlyph(glyph),
        ...previous,
        memories: listOf(previous.memories),
        sources: listOf(previous.sources)
      };
    });
    state.events = listOf(state.events);
    state.inbox = listOf(state.inbox);
    state.reflections = listOf(state.reflections);
    state.lastSnapshot = state.lastSnapshot && typeof state.lastSnapshot === "object"
      ? state.lastSnapshot
      : blankState().lastSnapshot;
    return state;
  }

  let state = loadState();

  function saveState(reason) {
    state.updatedAt = iso();
    writeKey(STORAGE_KEY, state);
    eventBus("cht.batole.changed", { reason, at: state.updatedAt, version: VERSION });
  }

  function appendEvent(type, text, glyphId, meta) {
    const glyph = glyphById(glyphId);
    const item = {
      id: `batole-${time()}-${Math.random().toString(36).slice(2, 7)}`,
      type: String(type || "signál"),
      text: trimText(text, 240),
      glyphId: glyph.id,
      at: iso(),
      meta: meta && typeof meta === "object" ? meta : {}
    };
    state.events.unshift(item);
    state.events = state.events.slice(0, MAX_EVENTS);
    state.glyphs[glyph.id].lastSeenAt = item.at;
    return item;
  }

  function remember(glyphId, text, kind, meta) {
    const glyph = glyphById(glyphId);
    const message = trimText(text, 1200);
    if (!message) return false;
    const memory = {
      id: `memory-${time()}-${Math.random().toString(36).slice(2, 7)}`,
      kind: trimText(kind || "šepot", 30),
      text: message,
      at: iso(),
      meta: meta && typeof meta === "object" ? meta : {}
    };
    state.glyphs[glyph.id].memories.unshift(memory);
    state.glyphs[glyph.id].memories = state.glyphs[glyph.id].memories.slice(0, MAX_GLYPH_MEMORIES);
    appendEvent(memory.kind, message, glyph.id, memory.meta);
    refreshVitals(scanWorld());
    saveState("glyph-memory");
    render();
    return true;
  }

  function slotItems(core) {
    if (Array.isArray(core)) return core;
    if (!core || typeof core !== "object") return [];
    if (Array.isArray(core.slots)) return core.slots;
    if (Array.isArray(core.items)) return core.items;
    return [];
  }

  function countSlots(memory) {
    let count = 0;
    const cores = memory && typeof memory === "object" ? memory.cores : null;
    if (cores && typeof cores === "object") {
      Object.keys(cores).forEach((coreId) => {
        count += slotItems(cores[coreId]).filter((slot) => slot !== null && slot !== undefined && slot !== "").length;
      });
    }
    if (count) return count;
    return localKeys().filter((key) => /^(?:VaFiT_360_SLOT_|VaFiT_SLOT_|cht360_slot_)/i.test(key)).length;
  }

  function countIssueItems(value) {
    if (Array.isArray(value)) return value.length;
    if (!value || typeof value !== "object") return 0;
    if (Array.isArray(value.issues)) return value.issues.length;
    if (Array.isArray(value.items)) return value.items.length;
    if (Array.isArray(value.trash)) return value.trash.length;
    return 0;
  }

  function scanVivereRecords(keys) {
    const records = [];
    keys.filter((key) => VIVERE_KEY.test(key) && !SENSITIVE_KEY.test(key) && key !== STORAGE_KEY)
      .forEach((key) => {
        let raw = "";
        try { raw = window.localStorage.getItem(key) || ""; } catch (_) { return; }
        records.push({ key, preview: trimText(raw, 74) });
      });
    return records.slice(0, 40);
  }

  function scanWorld() {
    const keys = localKeys();
    const memory = CHT_MEMORY_KEYS.map((key) => readKey(key, null)).find((value) => value && typeof value === "object") || null;
    const snapshots = readKey("cht360_pamet_snapshots_v1", []);
    const reviaObjects = REVIA_KEYS.map((key) => readKey(key, null)).filter((value) => value != null);
    const chyboObjects = CHYBO_KEYS.map((key) => readKey(key, null)).filter((value) => value != null);
    const issues = chyboObjects.reduce((total, item) => total + (Array.isArray(item && item.issues) ? item.issues.length : 0), 0);
    const trash = chyboObjects.reduce((total, item) => total + (Array.isArray(item) ? item.length : Array.isArray(item && item.trash) ? item.trash.length : 0), 0);
    const signals = reviaObjects.reduce((total, item) => total + (Array.isArray(item && item.signals) ? item.signals.length : Array.isArray(item) ? item.length : 0), 0);
    const vivereRecords = scanVivereRecords(keys);
    const slotCount = countSlots(memory);
    return {
      keys: keys.length,
      slots: slotCount,
      snapshots: Array.isArray(snapshots) ? snapshots.length : 0,
      revia: Math.max(reviaObjects.length, signals),
      issues,
      trash,
      vivereRecords,
      vivere: vivereRecords.length,
      signature: [slotCount, reviaObjects.length, signals, issues, trash, vivereRecords.map((record) => record.key).join("|")].join("::")
    };
  }

  function refreshVitals(world) {
    const now = time();
    const todayEvents = state.events.filter((event) => now - Date.parse(event.at) < 86400000).length;
    const namedGlyphs = GLYPHS.filter((glyph) => state.glyphs[glyph.id].memories.length > 0).length;
    const linkedParts = [world.slots > 0, world.revia > 0, world.issues >= 0, world.vivere > 0].filter(Boolean).length;
    state.cycle = Math.min(99, todayEvents + world.snapshots);
    state.energy = Math.min(9, Math.max(0, Math.round((todayEvents + (document.hidden ? 0 : 1)) / 2)));
    state.trust = Math.min(9, linkedParts * 2);
    state.clarity = Math.min(9, namedGlyphs + Math.min(1, world.vivere));
    state.lastSnapshot = {
      slots: world.slots,
      vivere: world.vivere,
      revia: world.revia,
      issues: world.issues,
      trash: world.trash
    };
  }

  function shortStatus(world) {
    const glyph = glyphById(view.selectedGlyph);
    const pieces = [
      `${world.slots} slot${world.slots === 1 ? "" : "ů"}`,
      `${world.vivere} záznam${world.vivere === 1 ? "" : "ů"} Vivere`,
      world.revia ? `Revia ${world.revia}` : "Revia čeká"
    ];
    if (world.issues) pieces.push(`ChybaŽrout: ${world.issues}`);
    return {
      headline: `${glyph.glyph} drží ${glyph.title.toLowerCase()}.`,
      text: `Batole právě vidí ${pieces.join(" · ")}.`,
      detail: world.vivereRecords.length
        ? `Poslední zachycený klíč Vivere: ${world.vivereRecords[0].key}.`
        : "Zatím čekám na první záznam z Vivere paměti."
    };
  }

  function postToChannel(type, payload) {
    if (!view.channel) return;
    try { view.channel.postMessage({ type, payload, from: "batole", at: iso() }); } catch (_) { /* kanál není nutný */ }
  }

  function receiveRevia(text, meta) {
    const message = trimText(text, 1400);
    if (!message) return false;
    state.inbox.unshift({ id: `revia-${time()}`, from: "Revia", text: message, at: iso(), meta: meta || {} });
    state.inbox = state.inbox.slice(0, MAX_INBOX);
    appendEvent("Revia", message, "ai", meta);
    refreshVitals(scanWorld());
    saveState("revia-reply");
    render();
    return true;
  }

  function receiveChybozrout(report) {
    const count = countIssueItems(report);
    const text = typeof report === "string"
      ? report
      : count ? `ChybaŽrout poslal ${count} nález${count === 1 ? "" : "ů"}.` : "ChybaŽrout poslal nový stav.";
    appendEvent("ChybaŽrout", text, "signal", report && typeof report === "object" ? report : {});
    refreshVitals(scanWorld());
    saveState("chybozrout-report");
    render();
  }

  function sendToRevia(text) {
    const message = trimText(text, 1400);
    if (!message) return false;
    const detail = { text: message, from: "Batole", at: iso(), glyphId: view.selectedGlyph };
    state.inbox.unshift({ id: `to-revia-${time()}`, from: "Batole", text: message, at: detail.at, pending: true });
    state.inbox = state.inbox.slice(0, MAX_INBOX);
    appendEvent("otázka pro Revii", message, "ai", { pending: true });
    eventBus("cht.batole.toRevia", detail);
    eventBus("cht.revia.signal", detail);
    postToChannel("revia.message", detail);
    try {
      if (typeof window.sendMessageToRevia === "function") {
        Promise.resolve(window.sendMessageToRevia(message, "Batole"))
          .then((reply) => {
            const replyText = typeof reply === "string"
              ? reply
              : reply && typeof reply === "object" ? (reply.text || reply.message || reply.reply || "") : "";
            if (replyText) receiveRevia(replyText, { returnedBy: "sendMessageToRevia" });
          })
          .catch(() => {});
      }
    } catch (_) { /* Revia může být zrovna offline */ }
    refreshVitals(scanWorld());
    saveState("to-revia");
    render();
    return true;
  }

  function queueSource(glyphId, source) {
    const glyph = glyphById(glyphId);
    const candidate = source && typeof source === "object" ? source : {};
    const url = trimText(candidate.url, 500);
    if (url && !/^https?:\/\//i.test(url)) return false;
    const item = {
      id: `source-${time()}-${Math.random().toString(36).slice(2, 7)}`,
      title: trimText(candidate.title || url || "Nový zdroj", 120),
      url,
      summary: trimText(candidate.summary, 450),
      state: "čeká na schválení",
      at: iso()
    };
    state.glyphs[glyph.id].sources.unshift(item);
    state.glyphs[glyph.id].sources = state.glyphs[glyph.id].sources.slice(0, MAX_SOURCES);
    appendEvent("zdroj čeká", item.title, glyph.id, { sourceId: item.id });
    saveState("source-queued");
    render();
    return item;
  }

  function approveSource(glyphId, sourceId) {
    const glyph = glyphById(glyphId);
    const source = state.glyphs[glyph.id].sources.find((item) => item.id === sourceId);
    if (!source) return false;
    source.state = "schváleno";
    source.approvedAt = iso();
    remember(glyph.id, `${source.title}${source.summary ? ` — ${source.summary}` : ""}`, "ověřený zdroj", { sourceId: source.id, url: source.url });
    return true;
  }

  function makeReflection() {
    const world = scanWorld();
    refreshVitals(world);
    const active = GLYPHS.filter((glyph) => state.glyphs[glyph.id].memories.length > 0);
    const reflection = {
      id: `reflection-${time()}`,
      at: iso(),
      text: `Střed drží ${world.slots} slotů CHT, ${world.vivere} záznamů Vivere a ${active.length} probuzených glyphů.${world.issues ? ` ChybaŽrout hlídá ${world.issues} nálezů.` : " ChybaŽrout hlásí klid."}`
    };
    state.reflections.unshift(reflection);
    state.reflections = state.reflections.slice(0, 18);
    appendEvent("reflexe", reflection.text, "signal");
    saveState("reflection");
    render();
    return reflection;
  }

  function openChybozrout() {
    const detail = { from: "Batole", at: iso() };
    eventBus("cht.batole.openChybozrout", detail);
    postToChannel("chybozrout.open", detail);
    try {
      if (typeof window.openChybozrout === "function") window.openChybozrout();
    } catch (_) { /* hostitelská stránka může mít jiný způsob otevření */ }
    appendEvent("povel", "Batole zavolalo ChybaŽrouta.", "signal");
    saveState("open-chybozrout");
    render();
  }

  function openGlyph() {
    const glyph = glyphById(view.selectedGlyph);
    const detail = { glyphId: glyph.id, glyph: glyph.glyph, title: glyph.title, from: "Batole", at: iso() };
    eventBus("cht.batole.openGlyph", detail);
    eventBus("cht.glyph.open", detail);
    postToChannel("glyph.open", detail);
    appendEvent("povel", `Otevři svět ${glyph.title}.`, glyph.id);
    saveState("open-glyph");
    render();
  }

  function exportBatole() {
    const data = JSON.stringify({ exportedAt: iso(), state }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cht360-batole-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function importBatole(payload) {
    const candidate = typeof payload === "string" ? safeJson(payload, null) : payload;
    const incoming = candidate && candidate.state ? candidate.state : candidate;
    if (!incoming || typeof incoming !== "object") return false;
    state = { ...blankState(), ...incoming, glyphs: { ...blankState().glyphs, ...(incoming.glyphs || {}) } };
    state = loadStateFrom(state);
    saveState("import");
    render();
    return true;
  }

  function loadStateFrom(candidate) {
    const before = readKey(STORAGE_KEY, null);
    writeKey(STORAGE_KEY, candidate);
    const normalized = loadState();
    if (before) writeKey(STORAGE_KEY, before);
    else {
      try { window.localStorage.removeItem(STORAGE_KEY); } catch (_) { /* nic */ }
    }
    return normalized;
  }

  function readExternalDetail(event) {
    return event && event.detail && typeof event.detail === "object" ? event.detail : {};
  }

  function receiveIntegration(type, event) {
    const previous = view.lastEventAt[type] || 0;
    if (time() - previous < 1200) return;
    view.lastEventAt[type] = time();
    const detail = readExternalDetail(event);
    if (type === "cht.revia.reply" || type === "cht.revia.message") {
      receiveRevia(detail.text || detail.message || "Revia poslala nový signál.", detail);
      return;
    }
    if (type === "cht.chybozrout.report" || type === "cht.chybozrout.changed") {
      receiveChybozrout(detail);
      return;
    }
    const core = detail.coreId || detail.core || detail.world;
    const glyph = glyphForCore(core);
    const message = detail.text || detail.message || detail.status || type;
    appendEvent(type.replace(/^cht\.|^vaft\./, ""), trimText(message, 240), glyph.id, detail);
    refreshVitals(scanWorld());
    saveState(type);
    render();
  }

  function installBridges() {
    [
      "cht.memory.changed", "cht.memory.saved", "cht.slot.saved", "cht.glyph.changed",
      "cht.revia.signal", "cht.revia.reply", "cht.revia.message",
      "cht.chybozrout.report", "cht.chybozrout.changed", "vaft.signal"
    ].forEach((type) => window.addEventListener(type, (event) => receiveIntegration(type, event)));

    window.addEventListener("storage", (event) => {
      if (!event.key || event.key === STORAGE_KEY) return;
      syncWorld("storage");
    });

    if ("BroadcastChannel" in window) {
      try {
        view.channel = new BroadcastChannel(CHANNEL_NAME);
        view.channel.addEventListener("message", (event) => {
          const message = event.data || {};
          if (message.from === "batole") return;
          if (message.type === "revia.reply" || message.type === "revia.message") {
            receiveRevia(message.payload && (message.payload.text || message.payload.message), message.payload);
          } else if (message.type === "chybozrout.report") {
            receiveChybozrout(message.payload);
          } else if (message.type === "memory.saved") {
            syncWorld("channel");
          }
        });
      } catch (_) { view.channel = null; }
    }
  }

  function syncWorld(reason) {
    const world = scanWorld();
    if (reason && world.signature !== view.lastSignature) {
      view.lastSignature = world.signature;
      appendEvent("společná paměť", `Zachycen stav CHT: ${world.slots} slotů · ${world.vivere} záznamů Vivere.`, "signal", { reason });
      saveState("world-sync");
    }
    refreshVitals(world);
    render();
    return world;
  }

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text != null) element.textContent = text;
    return element;
  }

  function createUI() {
    if (document.getElementById("batole-core")) return;
    const root = makeElement("aside", "");
    root.id = "batole-core";
    root.setAttribute("data-open", "false");
    root.setAttribute("aria-label", "Batole, společný střed CHT 360°‰.");
    root.innerHTML = [
      '<button class="batole-orbit-button" type="button" aria-expanded="false" aria-controls="batole-panel" title="Otevřít Batole">',
      '  <span class="batole-orbit-halo" aria-hidden="true"></span>',
      '  <span class="batole-orbit" aria-hidden="true"></span>',
      '  <span class="batole-center" aria-hidden="true"><span>101</span></span>',
      '  <span class="batole-orbit-label">Batole</span>',
      '</button>',
      '<section class="batole-panel" id="batole-panel" aria-label="Paměť Batolete">',
      '  <header class="batole-panel-head"><div><p class="batole-kicker">CHT 360°‰. · společný střed</p><h2>Batole</h2></div><button class="batole-close" type="button" aria-label="Zavřít Batole">×</button></header>',
      '  <div class="batole-vitals"><div class="batole-vital"><b data-batole-vital="cycle">0</b><span>Cyklus</span></div><div class="batole-vital"><b data-batole-vital="trust">0</b><span>Důvěra</span></div><div class="batole-vital"><b data-batole-vital="clarity">0</b><span>Jasnost</span></div><div class="batole-vital"><b data-batole-vital="energy">0</b><span>Energie</span></div></div>',
      '  <div class="batole-screen"><strong data-batole-screen-title>Střed se probouzí.</strong><span data-batole-screen-text></span><small data-batole-screen-detail></small></div>',
      '  <div class="batole-glyphs" aria-label="Vyber glyph"></div>',
      '  <div class="batole-composer"><label>Vzkaz pro vybraný glyph<textarea data-batole-input placeholder="Šepot, otázka nebo povel…"></textarea></label><div class="batole-actions"><button class="batole-action batole-action--primary" data-batole-action="whisper" type="button">Šept uložit</button><button class="batole-action" data-batole-action="ask" type="button">Otázka Revii</button><button class="batole-action" data-batole-action="open" type="button">Otevřít glyph</button><button class="batole-action" data-batole-action="reflect" type="button">Reflexe</button><button class="batole-action" data-batole-action="chybo" type="button">ChybaŽrout</button><button class="batole-action" data-batole-action="export" type="button">Export Batolete</button></div></div>',
      '  <p class="batole-foot">Batole čte jen data této domény. Internetové zdroje mohou do paměti jen jako návrhy ke schválení.</p>',
      '</section>'
    ].join("");
    document.body.appendChild(root);

    view.ui.root = root;
    view.ui.button = root.querySelector(".batole-orbit-button");
    view.ui.orbit = root.querySelector(".batole-orbit");
    view.ui.panel = root.querySelector(".batole-panel");
    view.ui.glyphs = root.querySelector(".batole-glyphs");
    view.ui.input = root.querySelector("[data-batole-input]");
    view.ui.screenTitle = root.querySelector("[data-batole-screen-title]");
    view.ui.screenText = root.querySelector("[data-batole-screen-text]");
    view.ui.screenDetail = root.querySelector("[data-batole-screen-detail]");
    view.ui.vitals = {};
    ["cycle", "trust", "clarity", "energy"].forEach((name) => { view.ui.vitals[name] = root.querySelector(`[data-batole-vital="${name}"]`); });

    GLYPHS.forEach((glyph, index) => {
      const node = makeElement("span", "batole-orbit-node", glyph.glyph);
      node.style.setProperty("--batole-index", index);
      node.dataset.glyph = glyph.id;
      node.title = glyph.title;
      view.ui.orbit.appendChild(node);
      const choice = makeElement("button", "batole-glyph-choice", glyph.glyph);
      choice.type = "button";
      choice.dataset.glyph = glyph.id;
      choice.title = glyph.title;
      choice.addEventListener("click", () => { view.selectedGlyph = glyph.id; render(); });
      view.ui.glyphs.appendChild(choice);
    });

    view.ui.button.addEventListener("click", () => setOpen(!view.open));
    root.querySelector(".batole-close").addEventListener("click", () => setOpen(false));
    root.querySelectorAll("[data-batole-action]").forEach((button) => {
      button.addEventListener("click", () => handleAction(button.dataset.batoleAction));
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && view.open) setOpen(false);
    });
  }

  function setOpen(open) {
    view.open = Boolean(open);
    if (!view.ui.root) return;
    view.ui.root.dataset.open = String(view.open);
    view.ui.button.setAttribute("aria-expanded", String(view.open));
    if (view.open) {
      syncWorld("panel-open");
      window.setTimeout(() => view.ui.input && view.ui.input.focus(), 180);
    }
  }

  function handleAction(action) {
    const message = view.ui.input ? view.ui.input.value : "";
    if (action === "whisper") {
      if (remember(view.selectedGlyph, message, "šepot")) view.ui.input.value = "";
      else showTemporary("Napiš nejdřív krátký vzkaz.");
    } else if (action === "ask") {
      if (sendToRevia(message)) view.ui.input.value = "";
      else showTemporary("Napiš otázku pro Revii.");
    } else if (action === "open") {
      openGlyph();
      showTemporary(`${glyphById(view.selectedGlyph).glyph} posílá povel do CHT.`);
    } else if (action === "reflect") {
      const reflection = makeReflection();
      showTemporary(reflection.text);
    } else if (action === "chybo") {
      openChybozrout();
      showTemporary("ChybaŽrout dostal signál.");
    } else if (action === "export") {
      exportBatole();
      showTemporary("Batole exportováno do souboru.");
    }
  }

  function showTemporary(message) {
    if (!view.ui.screenText) return;
    view.ui.screenText.textContent = trimText(message, 250);
  }

  function render() {
    if (!view.ui.root) return;
    const world = scanWorld();
    refreshVitals(world);
    const status = shortStatus(world);
    if (view.ui.screenTitle) view.ui.screenTitle.textContent = status.headline;
    if (view.ui.screenText) view.ui.screenText.textContent = status.text;
    if (view.ui.screenDetail) view.ui.screenDetail.textContent = status.detail;
    Object.keys(view.ui.vitals).forEach((name) => {
      if (view.ui.vitals[name]) view.ui.vitals[name].textContent = String(state[name] || 0);
    });
    view.ui.glyphs.querySelectorAll("[data-glyph]").forEach((choice) => {
      choice.dataset.selected = String(choice.dataset.glyph === view.selectedGlyph);
    });
    view.ui.orbit.querySelectorAll("[data-glyph]").forEach((node) => {
      const glyph = state.glyphs[node.dataset.glyph];
      node.dataset.active = String(Boolean(glyph && (glyph.memories.length || glyph.sources.length)));
    });
  }

  function boot() {
    createUI();
    installBridges();
    const world = scanWorld();
    view.lastSignature = world.signature;
    refreshVitals(world);
    if (!state.events.length) appendEvent("připojení", "Batole se připojilo ke společné paměti CHT.", "signal");
    saveState("boot");
    render();
    window.setInterval(() => syncWorld("periodic"), 5000);
  }

  window.CHTBatole = Object.freeze({
    version: VERSION,
    remember,
    receiveRevia,
    receiveChybozrout,
    queueSource,
    approveSource,
    reflect: makeReflection,
    sync: () => syncWorld("manual"),
    export: exportBatole,
    import: importBatole,
    state: () => JSON.parse(JSON.stringify(state))
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})(window, document);
