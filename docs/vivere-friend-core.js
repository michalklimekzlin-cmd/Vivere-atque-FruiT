from pathlib import Path

code = r'''/* =========================================================
   VIVERE FRIEND CORE — CHT 360°‰
   v0.1 — první semínko AI kamaráda

   Účel:
   - vytvořit unikátní DNA/seed jako TEXT
   - vytvořit a trvale uložit základní stav
   - vést životní tok a zkušenosti
   - připravit rozhraní pro pozdější paměť a AI
   - žádné finance, obchodování ani převody peněz

   Použití:
     <script src="./vivere-friend-core.js"></script>

   Globální API:
     window.VivereFriend.create()
     window.VivereFriend.get()
     window.VivereFriend.tick()
     window.VivereFriend.record()
     window.VivereFriend.reset()
   ========================================================= */

(() => {
  "use strict";

  const STORAGE_KEY = "cht360_vivere_friend_v1";
  const VERSION = 1;

  // DŮLEŽITÉ: DNA i číselný tok jsou STRING.
  // JavaScript Number by u obrovských čísel mohl ztratit přesnost.
  const DEFAULT_DNA = "942187130398611";

  function now() {
    return new Date().toISOString();
  }

  function safeParse(value) {
    try {
      return value ? JSON.parse(value) : null;
    } catch (_) {
      return null;
    }
  }

  function createInitialState(dna = DEFAULT_DNA, name = "Vivere Friend") {
    const timestamp = now();

    return {
      version: VERSION,
      identity: {
        name: String(name),
        dna: String(dna),
        bornAt: timestamp
      },

      life: {
        state: "awake",
        cycle: 0,
        experience: 0,
        heartbeat: 0,
        lastSeen: timestamp
      },

      stream: {
        current: String(dna),
        previous: null,
        changes: 0
      },

      memory: {
        count: 0,
        lastEvent: null
      },

      glyphs: [],

      events: [
        {
          id: "birth-1",
          type: "BIRTH",
          at: timestamp,
          message: "Vivere Friend byl vytvořen."
        }
      ]
    };
  }

  function save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  }

  function load() {
    return safeParse(localStorage.getItem(STORAGE_KEY));
  }

  function get() {
    return load();
  }

  function create(options = {}) {
    const existing = load();

    // Bezpečnost: existující Friend se automaticky nepřepíše.
    if (existing) return existing;

    const dna = options.dna ?? DEFAULT_DNA;
    const name = options.name ?? "Vivere Friend";

    const state = createInitialState(dna, name);
    save(state);

    return state;
  }

  function ensure() {
    return load() || create();
  }

  function record(type, message, data = {}) {
    const state = ensure();
    const event = {
      id: `event-${Date.now()}-${state.life.cycle}`,
      type: String(type || "EVENT"),
      at: now(),
      message: String(message || ""),
      data
    };

    state.events.push(event);
    state.memory.count += 1;
    state.memory.lastEvent = event.id;
    state.life.experience += 1;
    state.life.lastSeen = event.at;

    // Historii událostí držíme zatím rozumně malou.
    // Později ji napojíme na plnohodnotný CHT Memory Core.
    if (state.events.length > 500) {
      state.events = state.events.slice(-500);
    }

    save(state);

    window.dispatchEvent(
      new CustomEvent("cht360:vivere-event", { detail: event })
    );

    return event;
  }

  function tick(nextStreamValue = null) {
    const state = ensure();

    state.life.cycle += 1;
    state.life.heartbeat += 1;
    state.life.lastSeen = now();

    if (nextStreamValue !== null && nextStreamValue !== undefined) {
      const next = String(nextStreamValue);

      if (next !== state.stream.current) {
        state.stream.previous = state.stream.current;
        state.stream.current = next;
        state.stream.changes += 1;

        record(
          "STREAM_CHANGE",
          "Životní tok se změnil.",
          {
            previous: state.stream.previous,
            current: state.stream.current
          }
        );

        return get();
      }
    }

    save(state);

    window.dispatchEvent(
      new CustomEvent("cht360:vivere-tick", { detail: state.life })
    );

    return state;
  }

  function addGlyph(glyph) {
    const state = ensure();

    const value =
      typeof glyph === "string"
        ? { value: glyph }
        : { ...(glyph || {}) };

    value.id = value.id || `glyph-${Date.now()}`;
    value.createdAt = value.createdAt || now();

    state.glyphs.push(value);

    save(state);

    record(
      "GLYPH_ADDED",
      `Přidán Glyph ${value.value || value.id}.`,
      { glyph: value }
    );

    return get();
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);

    window.dispatchEvent(
      new CustomEvent("cht360:vivere-reset")
    );

    return create();
  }

  // Veřejné API CHT 360°‰
  window.VivereFriend = Object.freeze({
    version: VERSION,
    storageKey: STORAGE_KEY,
    create,
    get,
    ensure,
    tick,
    record,
    addGlyph,
    reset
  });

  // Přirozený start: vytvoř Friend pouze pokud ještě neexistuje.
  const friend = ensure();

  window.dispatchEvent(
    new CustomEvent("cht360:vivere-ready", {
      detail: friend
    })
  );

  console.log(
    "🌱 CHT 360°‰ — Vivere Friend Core ready",
    friend.identity.name,
    "DNA:",
    friend.identity.dna
  );
})();
'''

path = Path("/mnt/data/vivere-friend-core.js")
path.write_text(code, encoding="utf-8")

print(f"Hotovo: {path}")
print(f"Velikost: {path.stat().st_size} B")
