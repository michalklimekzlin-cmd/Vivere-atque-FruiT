from pathlib import Path

code = r'''/* =========================================================
   VIVERE FRIEND STATE — CHT 360°‰
   v0.1 — životní stav a životní tok

   Navazuje na:
     vivere-friend-core.js
     vivere-friend-memory.js

   Účel:
   - udržovat aktuální životní stav Frienda
   - sledovat číselný životní tok
   - počítat změny, zkušenosti a cykly
   - vytvářet události při změně toku
   - připravit bezpečný vstup pro budoucí AI

   DŮLEŽITÉ:
   Číselný tok je pouze DATA. Nejsou to peníze
   a tento modul neprovádí žádné finanční operace.

   Použití:
     <script src="./vivere-friend-core.js"></script>
     <script src="./vivere-friend-memory.js"></script>
     <script src="./vivere-friend-state.js"></script>

   API:
     VivereFriendState.get()
     VivereFriendState.pulse()
     VivereFriendState.setStream(value)
     VivereFriendState.experience(amount)
     VivereFriendState.snapshot()
     VivereFriendState.onChange(callback)
   ========================================================= */

(() => {
  "use strict";

  const STATE_KEY = "cht360_vivere_friend_state_v1";

  function now() {
    return new Date().toISOString();
  }

  function load() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function save(state) {
    localStorage.setItem(
      STATE_KEY,
      JSON.stringify(state)
    );
    return state;
  }

  function getCore() {
    if (
      window.VivereFriend &&
      typeof window.VivereFriend.ensure === "function"
    ) {
      return window.VivereFriend.ensure();
    }

    return null;
  }

  function getMemory() {
    if (
      window.VivereFriendMemory &&
      typeof window.VivereFriendMemory.remember === "function"
    ) {
      return window.VivereFriendMemory;
    }

    return null;
  }

  function initialState() {
    const core = getCore();
    const dna =
      core?.identity?.dna ||
      "942187130398611";

    const timestamp = now();

    return {
      version: 1,

      dna: String(dna),

      life: {
        status: "alive",
        startedAt: timestamp,
        lastPulse: timestamp,
        pulses: 0,
        experience: 0,
        changes: 0
      },

      stream: {
        value: String(dna),
        previous: null,
        direction: "stable",
        delta: "0"
      },

      signals: {
        activity: 0,
        curiosity: 0,
        stability: 100
      }
    };
  }

  function ensure() {
    return load() || save(initialState());
  }

  function compareDecimalStrings(a, b) {
    // Jednoduché porovnání celočíselných/číselných řetězců
    // bez převodu na Number. Pro náš experiment je důležité,
    // aby se neztratila přesnost velkých hodnot.
    const A = String(a).trim();
    const B = String(b).trim();

    if (A === B) {
      return "0";
    }

    const normalize = value => {
      let sign = "";
      let text = value;

      if (text[0] === "-" || text[0] === "+") {
        sign = text[0] === "-" ? "-" : "";
        text = text.slice(1);
      }

      const parts = text.split(".");
      const integer = (parts[0] || "0")
        .replace(/^0+(?=\d)/, "");

      const fraction = parts[1] || "";

      return {
        sign,
        integer,
        fraction
      };
    };

    const x = normalize(A);
    const y = normalize(B);

    // Pro směr nám stačí porovnat znaménko a absolutní část.
    if (x.sign !== y.sign) {
      return x.sign === "-" ? "-1" : "1";
    }

    if (x.integer.length !== y.integer.length) {
      const greater =
        x.integer.length > y.integer.length
          ? 1
          : -1;

      return x.sign === "-" ? String(-greater) : String(greater);
    }

    if (x.integer !== y.integer) {
      const greater =
        x.integer > y.integer ? 1 : -1;

      return x.sign === "-" ? String(-greater) : String(greater);
    }

    const max = Math.max(
      x.fraction.length,
      y.fraction.length
    );

    for (let i = 0; i < max; i++) {
      const aChar = x.fraction[i] || "0";
      const bChar = y.fraction[i] || "0";

      if (aChar !== bChar) {
        const greater =
          aChar > bChar ? 1 : -1;

        return x.sign === "-"
          ? String(-greater)
          : String(greater);
      }
    }

    return "0";
  }

  function setStream(value) {
    const state = ensure();
    const next = String(value);

    const comparison = compareDecimalStrings(
      next,
      state.stream.value
    );

    if (comparison === "0") {
      state.stream.direction = "stable";
      state.stream.previous = state.stream.value;
      state.stream.delta = "0";
      state.life.lastPulse = now();
      state.life.pulses += 1;

      save(state);

      return state;
    }

    state.stream.previous = state.stream.value;
    state.stream.value = next;
    state.stream.direction =
      comparison === "1"
        ? "up"
        : "down";

    // Přesný rozdíl velkých čísel zatím nepočítáme.
    // Uchováváme bezpečně pouze směr.
    state.stream.delta =
      comparison === "1"
        ? "changed_up"
        : "changed_down";

    state.life.changes += 1;
    state.life.experience += 1;
    state.life.pulses += 1;
    state.life.lastPulse = now();

    state.signals.activity = Math.min(
      100,
      state.signals.activity + 5
    );

    state.signals.curiosity = Math.min(
      100,
      state.signals.curiosity + 3
    );

    state.signals.stability = Math.max(
      0,
      state.signals.stability - 1
    );

    save(state);

    if (
      window.VivereFriend &&
      typeof window.VivereFriend.record === "function"
    ) {
      window.VivereFriend.record(
        "LIFE_STREAM_CHANGED",
        "Vivere Friend zaznamenal změnu životního toku.",
        {
          previous: state.stream.previous,
          current: state.stream.value,
          direction: state.stream.direction
        }
      );
    }

    const memory = getMemory();

    if (memory) {
      memory.remember({
        type: "life-stream",
        text:
          `Životní tok se změnil směrem ${state.stream.direction}.`,
        importance: 60,
        tags: [
          "vivere",
          "life-stream",
          state.stream.direction
        ],
        source: "vivere-friend-state",
        data: {
          previous: state.stream.previous,
          current: state.stream.value
        }
      });
    }

    window.dispatchEvent(
      new CustomEvent(
        "cht360:vivere-state-changed",
        {
          detail: state
        }
      )
    );

    return state;
  }

  function pulse() {
    const state = ensure();

    state.life.pulses += 1;
    state.life.lastPulse = now();

    // Aktivita se při pulzu pomalu vrací k normálu.
    state.signals.activity = Math.max(
      0,
      state.signals.activity - 1
    );

    state.signals.stability = Math.min(
      100,
      state.signals.stability + 1
    );

    save(state);

    window.dispatchEvent(
      new CustomEvent(
        "cht360:vivere-pulse",
        {
          detail: state
        }
      )
    );

    return state;
  }

  function experience(amount = 1) {
    const state = ensure();

    const value = Number(amount);

    if (
      Number.isFinite(value) &&
      value > 0
    ) {
      state.life.experience += Math.floor(value);
    }

    state.life.lastPulse = now();

    save(state);

    return state;
  }

  function snapshot() {
    const state = ensure();

    return JSON.parse(
      JSON.stringify(state)
    );
  }

  function onChange(callback) {
    if (typeof callback !== "function") {
      return () => {};
    }

    const handler = event => {
      callback(event.detail);
    };

    window.addEventListener(
      "cht360:vivere-state-changed",
      handler
    );

    return () => {
      window.removeEventListener(
        "cht360:vivere-state-changed",
        handler
      );
    };
  }

  window.VivereFriendState = Object.freeze({
    version: 1,
    storageKey: STATE_KEY,
    get: ensure,
    pulse,
    setStream,
    experience,
    snapshot,
    onChange
  });

  const state = ensure();

  window.dispatchEvent(
    new CustomEvent(
      "cht360:vivere-state-ready",
      {
        detail: state
      }
    )
  );

  console.log(
    "❤️ CHT 360°‰ — Vivere Friend State ready",
    state.stream.value
  );
})();
'''

path = Path("/mnt/data/vivere-friend-state.js")
path.write_text(code, encoding="utf-8")
print(f"Hotovo: {path}")
print(f"Velikost: {path.stat().st_size} B")
