from pathlib import Path

code = r'''/* =========================================================
   VIVERE FRIEND BRIDGE — CHT 360°‰
   v0.1 — propojení Core + Memory + State

   Umístění:
     docs/vivere-friend-bridge.js

   Načítat PO:
     vivere-friend-core.js
     vivere-friend-memory.js
     vivere-friend-state.js

   Účel:
   - propojit tři dosavadní vrstvy Frienda
   - vytvořit jednotný stavový snapshot
   - přijímat události CHT
   - zapisovat důležité události do paměti
   - nabídnout jednoduché API pro budoucí AI
   - připravit bezpečný vstup pro další moduly

   TENTO MODUL:
   - neprovádí finanční operace
   - neodesílá data na internet
   - pracuje pouze s lokálním stavem
   ========================================================= */

(() => {
  "use strict";

  const VERSION = 1;

  const EVENTS = {
    READY: "cht360:vivere-bridge-ready",
    SNAPSHOT: "cht360:vivere-snapshot",
    ACTIVITY: "cht360:vivere-activity"
  };

  let initialized = false;
  let listeners = [];

  function timestamp() {
    return new Date().toISOString();
  }

  function core() {
    return window.VivereFriend || null;
  }

  function memory() {
    return window.VivereFriendMemory || null;
  }

  function state() {
    return window.VivereFriendState || null;
  }

  function getSnapshot() {
    const friend = core()?.get?.() || null;
    const life = state()?.snapshot?.() || state()?.get?.() || null;

    const memories =
      memory()?.getAll?.() || [];

    return {
      version: VERSION,
      capturedAt: timestamp(),

      identity: friend?.identity || null,

      life: life?.life || friend?.life || null,

      stream:
        life?.stream ||
        friend?.stream ||
        null,

      signals:
        life?.signals ||
        null,

      memory: {
        count:
          typeof memory()?.count === "function"
            ? memory().count()
            : memories.length,

        recent: memories
          .slice(-10)
          .reverse()
          .map(item => ({
            id: item.id,
            type: item.type,
            text: item.text,
            importance: item.importance,
            createdAt: item.createdAt,
            tags: item.tags
          }))
      },

      glyphs: Array.isArray(friend?.glyphs)
        ? friend.glyphs.slice(-20)
        : [],

      capabilities: {
        core: !!core(),
        memory: !!memory(),
        state: !!state(),
        bridge: true,
        ai: false
      }
    };
  }

  function rememberActivity(type, message, data = {}) {
    const mem = memory();

    if (
      !mem ||
      typeof mem.remember !== "function"
    ) {
      return null;
    }

    return mem.remember({
      type: String(type || "activity"),
      text: String(message || ""),
      importance: 40,
      tags: [
        "vivere",
        "bridge"
      ],
      source: "vivere-friend-bridge",
      data
    });
  }

  function emit(name, detail) {
    window.dispatchEvent(
      new CustomEvent(name, {
        detail
      })
    );
  }

  function getStatus() {
    const snapshot = getSnapshot();

    return {
      alive:
        snapshot.life?.status === "alive" ||
        snapshot.life?.status === "awake",

      identity:
        snapshot.identity,

      experience:
        snapshot.life?.experience ?? 0,

      pulses:
        snapshot.life?.pulses ?? 0,

      memoryCount:
        snapshot.memory.count,

      stream:
        snapshot.stream,

      capabilities:
        snapshot.capabilities
    };
  }

  function thinkContext() {
    /*
      Toto je záměrně pouze DATA pro budoucí AI.
      Bridge sám nepředstírá, že je AI.
    */

    const snapshot = getSnapshot();

    return {
      identity: snapshot.identity,
      currentState: snapshot.life,
      currentStream: snapshot.stream,
      signals: snapshot.signals,

      recentMemory:
        snapshot.memory.recent,

      glyphs:
        snapshot.glyphs,

      instruction:
        "Použij tento stav jako kontext VIVERE FRIEND. " +
        "Nenič DNA. Respektuj historii a lokální stav."
    };
  }

  function handleStreamChange(event) {
    const detail = event?.detail || {};

    rememberActivity(
      "stream-observed",
      "Bridge zaznamenal změnu životního toku.",
      {
        previous: detail.previous ?? null,
        current: detail.current ?? null,
        direction: detail.direction ?? null
      }
    );

    emit(
      EVENTS.SNAPSHOT,
      getSnapshot()
    );
  }

  function handleMemoryCreated(event) {
    const detail = event?.detail || {};

    emit(
      EVENTS.ACTIVITY,
      {
        type: "memory-created",
        memoryId: detail.id || null,
        at: detail.createdAt || timestamp()
      }
    );
  }

  function handlePulse(event) {
    emit(
      EVENTS.SNAPSHOT,
      getSnapshot()
    );
  }

  function subscribe() {
    const registrations = [
      [
        "cht360:vivere-state-changed",
        handleStreamChange
      ],
      [
        "cht360:vivere-memory-created",
        handleMemoryCreated
      ],
      [
        "cht360:vivere-pulse",
        handlePulse
      ]
    ];

    for (const [eventName, handler] of registrations) {
      window.addEventListener(
        eventName,
        handler
      );

      listeners.push({
        eventName,
        handler
      });
    }
  }

  function unsubscribe() {
    for (const item of listeners) {
      window.removeEventListener(
        item.eventName,
        item.handler
      );
    }

    listeners = [];
  }

  function start() {
    if (initialized) {
      return getStatus();
    }

    if (!core()) {
      console.warn(
        "VIVERE FRIEND BRIDGE: Core nebyl nalezen."
      );
    }

    if (!memory()) {
      console.warn(
        "VIVERE FRIEND BRIDGE: Memory nebyla nalezena."
      );
    }

    if (!state()) {
      console.warn(
        "VIVERE FRIEND BRIDGE: State nebyl nalezen."
      );
    }

    subscribe();
    initialized = true;

    const snapshot = getSnapshot();

    emit(
      EVENTS.READY,
      snapshot
    );

    console.log(
      "🔗 CHT 360°‰ — Vivere Friend Bridge ready",
      getStatus()
    );

    return getStatus();
  }

  function stop() {
    unsubscribe();
    initialized = false;
    return true;
  }

  function observe(type, message, data = {}) {
    const event = {
      type: String(type || "OBSERVATION"),
      message: String(message || ""),
      at: timestamp(),
      data
    };

    rememberActivity(
      event.type,
      event.message,
      event.data
    );

    emit(
      EVENTS.ACTIVITY,
      event
    );

    return event;
  }

  function setLifeStream(value) {
    const api = state();

    if (
      !api ||
      typeof api.setStream !== "function"
    ) {
      throw new Error(
        "Vivere Friend State není načten."
      );
    }

    return api.setStream(
      String(value)
    );
  }

  function pulse() {
    const api = state();

    if (
      !api ||
      typeof api.pulse !== "function"
    ) {
      throw new Error(
        "Vivere Friend State není načten."
      );
    }

    return api.pulse();
  }

  function resetLocalFriend() {
    unsubscribe();

    if (
      core() &&
      typeof core().reset === "function"
    ) {
      core().reset();
    }

    localStorage.removeItem(
      "cht360_vivere_friend_memory_v1"
    );

    localStorage.removeItem(
      "cht360_vivere_friend_state_v1"
    );

    initialized = false;

    return start();
  }

  window.VivereFriendBridge =
    Object.freeze({
      version: VERSION,

      start,
      stop,

      getSnapshot,
      getStatus,
      thinkContext,

      observe,
      setLifeStream,
      pulse,

      resetLocalFriend
    });

  // Bridge se pokusí nastartovat až po načtení
  // předchozích modulů.
  start();
})();
'''

path = Path("/mnt/data/vivere-friend-bridge.js")
path.write_text(code, encoding="utf-8")
print(f"Hotovo: {path}")
print(f"Velikost: {path.stat().st_size} B")
