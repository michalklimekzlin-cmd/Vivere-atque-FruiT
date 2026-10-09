from pathlib import Path

code = r'''/* =========================================================
   BRÁŠKA LIVE — CHT 360°‰
   v0.1 — živý oběh dat

   Umístění:
     docs/vivere-friend-live.js

   Navazuje na:
     vivere-friend-core.js
     vivere-friend-memory.js
     vivere-friend-state.js
     vivere-friend-bridge.js
     vivere-friend-yahoo.js
     vivere-friend-ui.js

   Účel:
   - propojit datový tok s Bráškovým stavem
   - reagovat na Yahoo datové události
   - udržovat poslední živý signál
   - vytvářet bezpečné lokální události
   - obnovovat UI
   - připravit cestu pro budoucí AI

   DŮLEŽITÉ:
   Tento modul pouze zpracovává data.
   Neprovádí žádné finanční operace.
   ========================================================= */

(() => {
  "use strict";

  const VERSION = 1;
  const STORAGE_KEY =
    "cht360_braska_live_v1";

  let running = false;
  let unsubscribe = [];

  function now() {
    return new Date().toISOString();
  }

  function load() {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEY);

      return raw
        ? JSON.parse(raw)
        : {
            status: "waiting",
            startedAt: now(),
            lastSignal: null,
            signals: 0,
            source: null
          };
    } catch (_) {
      return {
        status: "waiting",
        startedAt: now(),
        lastSignal: null,
        signals: 0,
        source: null
      };
    }
  }

  function save(data) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );

    return data;
  }

  function getStatus() {
    return load();
  }

  function emit(name, detail) {
    window.dispatchEvent(
      new CustomEvent(name, {
        detail
      })
    );
  }

  function notifyUI() {
    /*
      UI používá vlastní render.
      Událost pouze oznámí, že se má obnovit.
    */

    emit(
      "cht360:braska-live-update",
      getStatus()
    );

    if (
      window.VivereFriendUI &&
      typeof window.VivereFriendUI.render ===
        "function"
    ) {
      window.VivereFriendUI.render();
    }
  }

  function rememberSignal(record) {
    if (
      window.VivereFriendMemory &&
      typeof window.VivereFriendMemory.remember ===
        "function"
    ) {
      return window.VivereFriendMemory.remember({
        type: "live-signal",
        text:
          "Bráška přijal nový živý datový signál.",
        importance: 45,
        tags: [
          "braska",
          "live",
          "signal"
        ],
        source: "vivere-friend-live",
        data: {
          source: record.source || null,
          symbol: record.symbol || null,
          value: record.value || null,
          at: record.at || now()
        }
      });
    }

    return null;
  }

  function processSignal(record) {
    if (!record) {
      return null;
    }

    const status = load();

    status.status = "alive";
    status.lastSignal = {
      id:
        record.id ||
        `signal-${Date.now()}`,

      at:
        record.at ||
        now(),

      source:
        String(
          record.source ||
          "unknown"
        ),

      symbol:
        String(
          record.symbol ||
          "DATA"
        ),

      value:
        String(
          record.value ??
          ""
        )
    };

    status.signals += 1;
    status.source =
      status.lastSignal.source;

    save(status);

    /*
      Předáme hodnotu do State.
      Yahoo Adapter už to dělá při importu,
      takže zde používáme bezpečné API pouze
      pokud je potřeba synchronizace.
    */
    if (
      window.VivereFriendState &&
      typeof window.VivereFriendState.setStream ===
        "function" &&
      record.value !== undefined &&
      record.value !== null
    ) {
      window.VivereFriendState.setStream(
        String(record.value)
      );
    }

    rememberSignal(record);

    if (
      window.VivereFriend &&
      typeof window.VivereFriend.record ===
        "function"
    ) {
      window.VivereFriend.record(
        "LIVE_SIGNAL",
        "Bráška přijal živý datový signál.",
        {
          source: record.source || null,
          symbol: record.symbol || null,
          value: String(
            record.value ?? ""
          )
        }
      );
    }

    emit(
      "cht360:braska-signal",
      status.lastSignal
    );

    notifyUI();

    return status;
  }

  function heartbeat() {
    const status = load();

    status.status = "alive";
    status.lastHeartbeat = now();

    save(status);

    emit(
      "cht360:braska-heartbeat",
      status
    );

    notifyUI();

    return status;
  }

  function connect() {
    if (running) {
      return getStatus();
    }

    const yahooHandler = event => {
      processSignal(
        event?.detail
      );
    };

    const stateHandler = () => {
      notifyUI();
    };

    const memoryHandler = () => {
      notifyUI();
    };

    window.addEventListener(
      "cht360:vivere-yahoo-data",
      yahooHandler
    );

    window.addEventListener(
      "cht360:vivere-state-changed",
      stateHandler
    );

    window.addEventListener(
      "cht360:vivere-memory-created",
      memoryHandler
    );

    unsubscribe = [
      [
        "cht360:vivere-yahoo-data",
        yahooHandler
      ],
      [
        "cht360:vivere-state-changed",
        stateHandler
      ],
      [
        "cht360:vivere-memory-created",
        memoryHandler
      ]
    ];

    running = true;

    const status = load();
    status.status = "alive";
    status.connectedAt = now();

    save(status);

    emit(
      "cht360:braska-live-ready",
      status
    );

    notifyUI();

    console.log(
      "❤️ CHT 360°‰ — BRÁŠKA LIVE ready"
    );

    return status;
  }

  function disconnect() {
    for (const [
      eventName,
      handler
    ] of unsubscribe) {
      window.removeEventListener(
        eventName,
        handler
      );
    }

    unsubscribe = [];
    running = false;

    const status = load();

    status.status = "waiting";

    save(status);

    emit(
      "cht360:braska-live-disconnected",
      status
    );

    return status;
  }

  function simulate(value, options = {}) {
    /*
      Testovací vstup.
      Hodí se pro první test přímo v telefonu
      bez skutečného síťového připojení.
    */

    const record = {
      id:
        `test-${Date.now()}`,

      at: now(),

      source:
        options.source ||
        "CHT TEST",

      symbol:
        options.symbol ||
        "BRASKA",

      value:
        String(value)
    };

    return processSignal(record);
  }

  function clear() {
    localStorage.removeItem(
      STORAGE_KEY
    );

    return getStatus();
  }

  window.VivereFriendLive =
    Object.freeze({
      version: VERSION,

      connect,
      disconnect,

      heartbeat,
      processSignal,
      simulate,

      getStatus,
      clear
    });

  connect();

  window.dispatchEvent(
    new CustomEvent(
      "cht360:braska-live-loaded",
      {
        detail: getStatus()
      }
    )
  );
})();
'''

path = Path("/mnt/data/vivere-friend-live.txt")
path.write_text(code, encoding="utf-8")
print(f"Hotovo: {path}")
print(f"Velikost: {path.stat().st_size} B")
