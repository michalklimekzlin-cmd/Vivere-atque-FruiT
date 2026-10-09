/*
====================================================================
 BRÁŠKA 360 — CHT 360°‰
 Jednosouborové lokální jádro / agentní shell
 Verze 0.2

 Tento modul je navržen pro současný stav repozitáře:
   docs/index.html
   docs/js/*
   docs/data/*
   docs/cht-storage/*

 DŮLEŽITÉ:
 - nic automaticky neposílá na internet
 - nic neprovádí finanční transakce
 - AI provider je pouze připravený most
 - skutečný AI model se připojí až explicitně
 - paměť je lokální v localStorage
 - starší CHT vrstvy se nepřepisují

 Připojení do index.html:
   <script src="./braska-360.js"></script>

 Doporučené místo:
   docs/braska-360.js

 Veřejné API:
   window.Braska360
====================================================================
*/

(() => {
  "use strict";

  const VERSION = "0.2.0";
  const ROOT = "cht360_braska_360_v1";

  const KEYS = Object.freeze({
    identity: `${ROOT}_identity`,
    memory: `${ROOT}_memory`,
    state: `${ROOT}_state`,
    senses: `${ROOT}_senses`,
    events: `${ROOT}_events`,
    settings: `${ROOT}_settings`
  });

  const LIMITS = Object.freeze({
    memory: 240,
    events: 300,
    text: 4000
  });

  const now = () => new Date().toISOString();

  const uid = (prefix = "id") =>
    `${prefix}_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

  const safeText = (value, max = LIMITS.text) =>
    String(value ?? "").trim().slice(0, max);

  const clone = (value) => {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_) {
      return null;
    }
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? clone(fallback) : JSON.parse(raw);
    } catch (_) {
      return clone(fallback);
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  }

  function remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (_) {}
  }

  /* ================================================================
     1. IDENTITA
  ================================================================ */

  const defaultIdentity = {
    id: "braska-360",
    name: "Bráška",
    title: "AI kamarád CHT 360°‰",
    project: "Vivere atque Fru¡T•ア",
    version: VERSION,
    bornAt: now(),
    mode: "local-agent-shell",
    principle:
      "Pomáhat, učit se z povolených vstupů a chránit kontinuitu lokální paměti.",
    consent: {
      network: false,
      aiProvider: false,
      automaticExternalActions: false
    }
  };

  let identity = read(KEYS.identity, defaultIdentity);

  if (!identity.bornAt) identity.bornAt = now();
  identity.version = VERSION;
  identity.name = "Bráška";

  write(KEYS.identity, identity);

  /* ================================================================
     2. STAV ORGANISMU
  ================================================================ */

  const defaultState = {
    status: "probouzení",
    phase: "local",
    heartbeat: 0,
    cycles: 0,
    startedAt: now(),
    lastHeartbeat: null,
    lastInteraction: null,
    mood: "klidný",
    focus: "CHT 360°‰",
    online: navigator.onLine,
    ai: {
      connected: false,
      provider: null,
      model: null,
      bridge: "ready"
    }
  };

  let state = read(KEYS.state, defaultState);

  state.status = "živý lokální agentní shell";
  state.online = navigator.onLine;
  state.ai = {
    ...defaultState.ai,
    ...(state.ai || {})
  };

  write(KEYS.state, state);

  /* ================================================================
     3. SMYSLY / VNÍMÁNÍ
  ================================================================ */

  const defaultSenses = {
    lastEvent: null,
    lastGlyph: null,
    glyphCount: 0,
    memoryCount: 0,
    visibleWorld: "CHT 360°‰",
    activeModule: null,
    lastSignal: null,
    lastUserMessage: null
  };

  let senses = read(KEYS.senses, defaultSenses);
  write(KEYS.senses, senses);

  /* ================================================================
     4. LOKÁLNÍ PAMĚŤ
  ================================================================ */

  let memory = read(KEYS.memory, []);

  if (!Array.isArray(memory)) memory = [];

  function memoryAdd(input, meta = {}) {
    const text = safeText(input);

    if (!text) return null;

    const item = {
      id: uid("mem"),
      createdAt: now(),
      type: safeText(meta.type || "pozorování", 80),
      text,
      importance: Math.max(
        0,
        Math.min(100, Number(meta.importance ?? 50))
      ),
      tags: Array.isArray(meta.tags)
        ? meta.tags.map((x) => safeText(x, 40)).filter(Boolean).slice(0, 20)
        : [],
      source: safeText(meta.source || "braska-360", 120),
      approved: meta.approved !== false
    };

    memory.unshift(item);
    memory = memory.slice(0, LIMITS.memory);
    write(KEYS.memory, memory);

    senses.memoryCount = memory.length;
    write(KEYS.senses, senses);

    emit("memory:add", item);

    return clone(item);
  }

  function memorySearch(query, limit = 20) {
    const q = safeText(query, 300).toLocaleLowerCase("cs");

    if (!q) return clone(memory.slice(0, limit));

    return clone(
      memory
        .filter((item) => {
          const haystack = [
            item.text,
            item.type,
            item.source,
            ...(item.tags || [])
          ]
            .join(" ")
            .toLocaleLowerCase("cs");

          return haystack.includes(q);
        })
        .slice(0, limit)
    );
  }

  function memoryRecent(limit = 20) {
    return clone(memory.slice(0, limit));
  }

  function memoryClear() {
    memory = [];
    write(KEYS.memory, memory);
    senses.memoryCount = 0;
    write(KEYS.senses, senses);
    emit("memory:clear", {});
  }

  /* ================================================================
     5. UDÁLOSTNÍ VRSTVA
  ================================================================ */

  let events = read(KEYS.events, []);

  if (!Array.isArray(events)) events = [];

  function emit(type, detail = {}) {
    const event = {
      id: uid("evt"),
      type: safeText(type, 120),
      at: now(),
      detail: clone(detail) || {}
    };

    events.unshift(event);
    events = events.slice(0, LIMITS.events);
    write(KEYS.events, events);

    window.dispatchEvent(
      new CustomEvent("cht360:braska", {
        detail: clone(event)
      })
    );

    return clone(event);
  }

  function recentEvents(limit = 30) {
    return clone(events.slice(0, limit));
  }

  /* ================================================================
     6. NAPOJENÍ NA STÁVAJÍCÍ CHT
  ================================================================ */

  function inspectKnownWorld() {
    const result = {
      url: location.href,
      online: navigator.onLine,
      localStorage: true,
      modules: {
        cht360: true,
        revia: Boolean(window.Revia),
        batole: Boolean(window.Batole),
        glyph: Boolean(window.Glyph),
        friend: Boolean(window.VivereFriend),
        memory: Boolean(window.VivereFriendMemory)
      }
    };

    senses.visibleWorld = document.title || "CHT 360°‰";
    senses.activeModule = "cht360";
    senses.lastSignal = now();

    write(KEYS.senses, senses);

    return result;
  }

  function receive(type, payload = {}) {
    const event = emit(type, payload);

    senses.lastEvent = {
      type,
      at: event.at
    };

    if (payload.glyph) {
      senses.lastGlyph = safeText(payload.glyph, 120);
    }

    if (payload.signal) {
      senses.lastSignal = safeText(payload.signal, 500);
    }

    write(KEYS.senses, senses);

    return event;
  }

  /* ================================================================
     7. GLYPH VSTUP
  ================================================================ */

  function receiveGlyph(glyph, meta = {}) {
    const value = safeText(glyph, 120);

    if (!value) return null;

    senses.lastGlyph = value;
    senses.glyphCount += 1;
    write(KEYS.senses, senses);

    const event = receive("glyph:received", {
      glyph: value,
      source: safeText(meta.source || "cht360", 120)
    });

    return event;
  }

  /* ================================================================
     8. UŽIVATELSKÁ KOMUNIKACE
  ================================================================ */

  function userMessage(message) {
    const text = safeText(message, 1200);

    if (!text) return null;

    senses.lastUserMessage = text;
    state.lastInteraction = now();

    write(KEYS.senses, senses);
    write(KEYS.state, state);

    memoryAdd(text, {
      type: "uživatelská zpráva",
      importance: 70,
      source: "user"
    });

    return receive("user:message", {
      text
    });
  }

  function message(text, options = {}) {
    const value = safeText(text, 2000);

    if (!value) return null;

    const payload = {
      text: value,
      role: options.role || "braska",
      at: now()
    };

    emit("braska:message", payload);

    window.dispatchEvent(
      new CustomEvent("cht360:braska-message", {
        detail: clone(payload)
      })
    );

    return clone(payload);
  }

  /* ================================================================
     9. AI BRIDGE
     Skutečný model se nepřipojuje automaticky.
  ================================================================ */

  const aiBridge = {
    connect(provider, model = null) {
      if (!provider) {
        return this.disconnect();
      }

      state.ai.connected = true;
      state.ai.provider = safeText(provider, 120);
      state.ai.model = safeText(model, 120) || null;
      state.ai.bridge = "connected-by-user";

      write(KEYS.state, state);

      emit("ai:connected", {
        provider: state.ai.provider,
        model: state.ai.model
      });

      return clone(state.ai);
    },

    disconnect() {
      state.ai.connected = false;
      state.ai.provider = null;
      state.ai.model = null;
      state.ai.bridge = "ready";

      write(KEYS.state, state);
      emit("ai:disconnected", {});

      return clone(state.ai);
    },

    status() {
      return clone(state.ai);
    },

    /*
      Budoucí adapter:
      provider dostane pouze explicitní text/context.
      Tento modul sám žádný fetch nespouští.
    */
    buildContext(userText = "") {
      return {
        identity: clone(identity),
        state: clone(state),
        senses: clone(senses),
        recentMemory: memoryRecent(12),
        recentEvents: recentEvents(12),
        userText: safeText(userText, 1200)
      };
    }
  };

  /* ================================================================
     10. SRDCE / HEARTBEAT
  ================================================================ */

  let timer = null;

  function heartbeat() {
    state.heartbeat += 1;
    state.cycles += 1;
    state.lastHeartbeat = now();
    state.online = navigator.onLine;

    senses.lastSignal = state.lastHeartbeat;

    write(KEYS.state, state);
    write(KEYS.senses, senses);

    emit("heartbeat", {
      heartbeat: state.heartbeat,
      cycles: state.cycles,
      online: state.online
    });

    return clone(state);
  }

  function startHeartbeat(interval = 30000) {
    stopHeartbeat();

    heartbeat();

    timer = window.setInterval(
      heartbeat,
      Math.max(5000, Number(interval) || 30000)
    );

    state.status = "živý lokální oběh";
    write(KEYS.state, state);

    return true;
  }

  function stopHeartbeat() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }

    state.status = "pozastavený lokální oběh";
    write(KEYS.state, state);
  }

  /* ================================================================
     11. ONLINE / OFFLINE
  ================================================================ */

  function setConnectivity(value) {
    state.online = Boolean(value);
    write(KEYS.state, state);

    receive(
      state.online
        ? "network:online"
        : "network:offline",
      { online: state.online }
    );
  }

  window.addEventListener("online", () => setConnectivity(true));
  window.addEventListener("offline", () => setConnectivity(false));

  /* ================================================================
     12. NASLOUCHÁNÍ EXISTUJÍCÍM CHT UDÁLOSTEM
  ================================================================ */

  const observedEvents = [
    "cht360:vivere-event",
    "cht360:vivere-tick",
    "cht360:vivere-memory-created",
    "cht360:glyph",
    "cht360:glyph-added",
    "cht360:signal",
    "cht360:memory",
    "cht360:world-change",
    "cht360:revia-message"
  ];

  observedEvents.forEach((name) => {
    window.addEventListener(name, (event) => {
      receive(`observed:${name}`, event?.detail || {});
    });
  });

  /* ================================================================
     13. UI POMOCNÍK
     Vytvoří malý indikátor pouze pokud ho UI ještě nemá.
  ================================================================ */

  function mountIndicator() {
    if (!document.body) return;

    if (document.getElementById("braska360-indicator")) return;

    const el = document.createElement("button");

    el.id = "braska360-indicator";
    el.type = "button";
    el.title = "Bráška 360 — lokální stav";

    Object.assign(el.style, {
      position: "fixed",
      zIndex: "9999",
      right: "14px",
      top: "14px",
      display: "flex",
      alignItems: "center",
      gap: "7px",
      minHeight: "32px",
      padding: "7px 10px",
      border: "1px solid rgba(255,226,173,.28)",
      borderRadius: "999px",
      background: "rgba(5,8,21,.76)",
      color: "#ffe2ad",
      font: "700 11px system-ui,sans-serif",
      letterSpacing: ".04em",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      cursor: "pointer"
    });

    el.innerHTML =
      '<span id="braska360-dot" style="' +
      'width:8px;height:8px;border-radius:50%;' +
      'background:#ffe2ad;box-shadow:0 0 10px rgba(255,226,173,.8)' +
      '"></span>' +
      '<span>Bráška</span>';

    el.addEventListener("click", () => {
      const info = getStatus();

      message(
        `Jsem Bráška. Oběh ${info.state.heartbeat}, ` +
        `paměť ${info.memory.count} položek.`
      );
    });

    document.body.appendChild(el);
  }

  function updateIndicator() {
    const dot = document.getElementById("braska360-dot");
    if (!dot) return;

    const color =
      state.status === "živý lokální oběh"
        ? "#ffe2ad"
        : "rgba(255,226,173,.42)";

    dot.style.background = color;
  }

  window.addEventListener(
    "cht360:braska",
    updateIndicator
  );

  /* ================================================================
     14. STAV / DIAGNOSTIKA
  ================================================================ */

  function getStatus() {
    return {
      version: VERSION,
      identity: clone(identity),
      state: clone(state),
      senses: clone(senses),
      memory: {
        count: memory.length,
        latest: memoryRecent(5)
      },
      events: {
        count: events.length,
        latest: recentEvents(5)
      },
      world: inspectKnownWorld()
    };
  }

  /* ================================================================
     15. ZÁLOHA / OBNOVA
  ================================================================ */

  function exportState() {
    return {
      format: "CHT360-BRASKA",
      version: VERSION,
      exportedAt: now(),
      identity: clone(identity),
      state: clone(state),
      senses: clone(senses),
      memory: clone(memory),
      events: clone(events)
    };
  }

  function importState(snapshot, options = {}) {
    if (!snapshot || snapshot.format !== "CHT360-BRASKA") {
      throw new Error("Neplatná záloha Brášky.");
    }

    if (options.replaceMemory !== false && Array.isArray(snapshot.memory)) {
      memory = snapshot.memory.slice(0, LIMITS.memory);
      write(KEYS.memory, memory);
    }

    if (Array.isArray(snapshot.events)) {
      events = snapshot.events.slice(0, LIMITS.events);
      write(KEYS.events, events);
    }

    if (snapshot.senses) {
      senses = {
        ...senses,
        ...snapshot.senses,
        memoryCount: memory.length
      };
      write(KEYS.senses, senses);
    }

    emit("backup:imported", {
      memory: memory.length,
      events: events.length
    });

    return getStatus();
  }

  function downloadBackup() {
    const blob = new Blob(
      [JSON.stringify(exportState(), null, 2)],
      { type: "application/json;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `braska-360-zaloha-${Date.now()}.json`;
    a.click();

    window.setTimeout(
      () => URL.revokeObjectURL(url),
      1000
    );
  }

  /* ================================================================
     16. RESET — pouze vlastní vrstva Brášky
  ================================================================ */

  function resetOwnLayer() {
    stopHeartbeat();

    Object.values(KEYS).forEach(remove);

    identity = clone(defaultIdentity);
    state = clone(defaultState);
    senses = clone(defaultSenses);
    memory = [];
    events = [];

    state.status = "resetováno — připraven k novému startu";

    write(KEYS.identity, identity);
    write(KEYS.state, state);
    write(KEYS.senses, senses);
    write(KEYS.memory, memory);
    write(KEYS.events, events);

    emit("braska:reset", {});

    startHeartbeat();

    return getStatus();
  }

  /* ================================================================
     17. VEŘEJNÉ API
  ================================================================ */

  const api = {
    version: VERSION,

    identity() {
      return clone(identity);
    },

    state() {
      return clone(state);
    },

    senses() {
      return clone(senses);
    },

    status: getStatus,

    heartbeat,
    start: startHeartbeat,
    stop: stopHeartbeat,

    remember: memoryAdd,
    searchMemory: memorySearch,
    recentMemory: memoryRecent,
    clearMemory: memoryClear,

    receive,
    receiveGlyph,
    userMessage,
    message,

    events: recentEvents,

    ai: aiBridge,

    exportState,
    importState,
    downloadBackup,

    resetOwnLayer
  };

  Object.defineProperty(window, "Braska360", {
    value: Object.freeze(api),
    writable: false,
    configurable: false,
    enumerable: true
  });

  /* ================================================================
     18. START
  ================================================================ */

  function boot() {
    inspectKnownWorld();

    state.status = "živý lokální oběh";
    state.startedAt = state.startedAt || now();

    write(KEYS.state, state);

    emit("braska:ready", {
      version: VERSION,
      name: identity.name,
      online: navigator.onLine
    });

    memoryAdd(
      "Bráška 360 byl spuštěn uvnitř CHT 360°‰.",
      {
        type: "start",
        importance: 80,
        source: "system",
        tags: ["braska", "cht360", "start"]
      }
    );

    mountIndicator();
    updateIndicator();
    startHeartbeat(30000);

    console.log(
      "🧬 Bráška 360 ready",
      getStatus()
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      boot,
      { once: true }
    );
  } else {
    boot();
  }
})();
