"use strict";

/*
 * CHT 360°‰. · Prstenec pokojíčků
 *
 * Šest samostatných bran pro vlastní Glyphy. Prstenec pouze ukládá výběr a
 * vysílá události; žádnou hru ani AI si nevymýšlí. Budoucí modul se může
 * připojit přes window.addEventListener("cht.room.open", handler).
 */

const CHTRoomOrbit = (() => {
  const STORAGE_KEY = "cht360_room_orbit_v1";
  const ROOM_COUNT = 6;
  const GLOW_TIME = 5000;
  const MAX_GLYPH_GRAPHEMES = 12;
  const ORBIT_ID = "chtRoomOrbit";

  const ROOM_POSITIONS = Object.freeze([
    [17, 20],
    [15, 46],
    [29, 76],
    [71, 76],
    [85, 46],
    [83, 20]
  ]);

  const state = loadState();
  const timers = new Map();
  let selectedId = state.selectedId || state.rooms[0].id;
  let dom = null;

  function graphemes(value) {
    const text = String(value || "").normalize("NFC");

    if (typeof Intl !== "undefined" && Intl.Segmenter) {
      return Array.from(
        new Intl.Segmenter("cs", { granularity: "grapheme" }).segment(text),
        item => item.segment
      );
    }

    return Array.from(text);
  }

  function normaliseGlyph(value) {
    return graphemes(String(value || "").replace(/\uFFFD/g, "").trim())
      .slice(0, MAX_GLYPH_GRAPHEMES)
      .join("");
  }

  function roomId(index) {
    return "room-" + String(index).padStart(2, "0");
  }

  function createRoom(index) {
    return {
      id: roomId(index),
      index,
      label: "Pokojíček " + String(index).padStart(2, "0"),
      glyph: "",
      route: null,
      updatedAt: null
    };
  }

  function normaliseRoom(value, index) {
    const base = createRoom(index);
    const source = value && typeof value === "object" ? value : {};

    return {
      ...base,
      id: base.id,
      index,
      glyph: normaliseGlyph(source.glyph),
      route: normaliseRoute(source.route),
      updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : null
    };
  }

  function normaliseRoute(value) {
    if (!value || typeof value !== "object") {
      return null;
    }

    const kind = String(value.kind || "").trim().slice(0, 40);
    const target = String(value.target || "").trim().slice(0, 240);

    return kind && target ? { kind, target } : null;
  }

  function loadState() {
    const fallback = {
      version: 1,
      selectedId: roomId(1),
      updatedAt: null,
      rooms: Array.from({ length: ROOM_COUNT }, (_, offset) => createRoom(offset + 1))
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const source = raw ? JSON.parse(raw) : null;

      if (!source || typeof source !== "object") {
        return fallback;
      }

      const savedRooms = Array.isArray(source.rooms) ? source.rooms : [];
      const rooms = Array.from(
        { length: ROOM_COUNT },
        (_, offset) => normaliseRoom(savedRooms[offset], offset + 1)
      );

      const requested = String(source.selectedId || "");

      return {
        version: 1,
        selectedId: rooms.some(room => room.id === requested) ? requested : roomId(1),
        updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : null,
        rooms
      };
    } catch (error) {
      console.warn("Prstenec pokojíčků se nepodařilo načíst.", error);
      return fallback;
    }
  }

  function saveState() {
    state.selectedId = selectedId;
    state.updatedAt = new Date().toISOString();

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      console.warn("Prstenec pokojíčků se nepodařilo uložit.", error);
      return false;
    }
  }

  function cloneRoom(room) {
    return {
      id: room.id,
      index: room.index,
      label: room.label,
      glyph: room.glyph,
      route: room.route ? { ...room.route } : null,
      updatedAt: room.updatedAt
    };
  }

  function getRoom(id) {
    return state.rooms.find(room => room.id === String(id)) || null;
  }

  function selectedRoom() {
    return getRoom(selectedId) || state.rooms[0];
  }

  function eventDetail(room, action) {
    return Object.freeze({
      source: "cht360-room-orbit",
      action,
      id: room.id,
      index: room.index,
      label: room.label,
      glyph: room.glyph,
      route: room.route ? { ...room.route } : null,
      updatedAt: room.updatedAt
    });
  }

  function publish(type, room, action) {
    window.dispatchEvent(
      new CustomEvent(type, { detail: eventDetail(room, action) })
    );
  }

  function status(message) {
    if (dom?.status) {
      dom.status.textContent = message;
    }
  }

  function build() {
    if (document.getElementById(ORBIT_ID)) {
      return false;
    }

    const host = document.querySelector(".stage");

    if (!host) {
      return false;
    }

    const root = document.createElement("aside");
    root.id = ORBIT_ID;
    root.setAttribute("aria-label", "Prstenec šesti pokojíčků");
    root.innerHTML = `
      <div class="cht-room-orbit__shell">
        <p class="cht-room-orbit__label">Prstenec pokojíčků · 1–6</p>

        <svg class="cht-room-orbit__wire" viewBox="0 0 300 500" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="cht-room-orbit-line" x1="20" y1="20" x2="280" y2="480" gradientUnits="userSpaceOnUse">
              <stop stop-color="#8a682c" stop-opacity=".62" />
              <stop offset=".33" stop-color="#fff0c5" stop-opacity=".9" />
              <stop offset=".68" stop-color="#c79736" stop-opacity=".7" />
              <stop offset="1" stop-color="#fff0c5" stop-opacity=".56" />
            </linearGradient>
            <radialGradient id="cht-room-orbit-aura" cx="50%" cy="50%" r="50%">
              <stop stop-color="#e8bb61" stop-opacity=".14" />
              <stop offset=".64" stop-color="#7f5e25" stop-opacity=".035" />
              <stop offset="1" stop-color="#000" stop-opacity="0" />
            </radialGradient>
          </defs>

          <ellipse class="orbit-aura" cx="150" cy="250" rx="134" ry="235" />
          <path class="orbit-outer" d="M150 18 C76 18 41 97 72 171 C103 244 111 261 71 329 C31 397 77 482 150 482 C223 482 269 397 229 329 C189 261 197 244 228 171 C259 97 224 18 150 18 Z" />
          <path class="orbit-inner" d="M150 37 C93 37 69 102 94 160 C124 231 128 266 93 334 C63 393 101 458 150 458 C199 458 237 393 207 334 C172 266 176 231 206 160 C231 102 207 37 150 37 Z" />
          <path class="orbit-cross" d="M74 171 C117 203 183 203 226 171 M72 329 C116 296 184 296 228 329 M150 19 C150 130 150 370 150 481" />
          <path class="orbit-dash" d="M150 18 C76 18 41 97 72 171 C103 244 111 261 71 329 C31 397 77 482 150 482 C223 482 269 397 229 329 C189 261 197 244 228 171 C259 97 224 18 150 18" />
          <circle class="orbit-star" cx="150" cy="18" r="2.1" />
          <circle class="orbit-star" cx="150" cy="482" r="2.1" />
          <circle class="orbit-star" cx="72" cy="171" r="1.7" />
          <circle class="orbit-star" cx="228" cy="171" r="1.7" />
          <circle class="orbit-star" cx="71" cy="329" r="1.7" />
          <circle class="orbit-star" cx="229" cy="329" r="1.7" />
        </svg>

        <div class="cht-room-orbit__rooms" data-room-buttons></div>

        <form class="cht-room-orbit__console" data-room-form>
          <input
            class="cht-room-orbit__input"
            data-room-glyph
            type="text"
            maxlength="24"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            placeholder="Vyber pokojíček"
            aria-label="Glyph pro vybraný pokojíček"
          >
          <button class="cht-room-orbit__action" data-room-assign type="submit">Přiřadit</button>
          <div class="cht-room-orbit__foot">
            <span class="cht-room-orbit__status" data-room-status aria-live="polite"></span>
            <button class="cht-room-orbit__secondary" data-room-clear type="button">Odebrat</button>
            <button class="cht-room-orbit__secondary cht-room-orbit__secondary--open" data-room-open type="button">Vstoupit</button>
          </div>
        </form>
      </div>
    `;

    host.append(root);

    dom = {
      root,
      buttons: root.querySelector("[data-room-buttons]"),
      form: root.querySelector("[data-room-form]"),
      glyph: root.querySelector("[data-room-glyph]"),
      assign: root.querySelector("[data-room-assign]"),
      clear: root.querySelector("[data-room-clear]"),
      open: root.querySelector("[data-room-open]"),
      status: root.querySelector("[data-room-status]")
    };

    state.rooms.forEach(room => {
      const [x, y] = ROOM_POSITIONS[room.index - 1];
      const button = document.createElement("button");
      const number = document.createElement("span");
      const glyph = document.createElement("span");

      button.type = "button";
      button.className = "cht-room";
      button.dataset.roomId = room.id;
      button.style.setProperty("--room-x", x + "%");
      button.style.setProperty("--room-y", y + "%");
      button.setAttribute("aria-label", room.label + ": prázdný");

      number.className = "cht-room__number";
      number.textContent = String(room.index);
      glyph.className = "cht-room__glyph";

      button.append(number, glyph);
      button.addEventListener("click", () => select(room.id));
      dom.buttons.append(button);
    });

    dom.form.addEventListener("submit", event => {
      event.preventDefault();
      assignGlyph(dom.glyph.value);
    });

    dom.clear.addEventListener("click", () => clearGlyph());
    dom.open.addEventListener("click", () => openRoom());

    render();
    status("Vyber pokojíček. Po 5 s světlo jemně zhasne.");
    return true;
  }

  function render() {
    if (!dom) {
      return;
    }

    const room = selectedRoom();

    state.rooms.forEach(item => {
      const button = dom.buttons.querySelector("[data-room-id='" + item.id + "']");

      if (!button) {
        return;
      }

      const filled = Boolean(item.glyph);
      const glyph = button.querySelector(".cht-room__glyph");

      glyph.textContent = filled ? item.glyph : "·";
      button.classList.toggle("is-empty", !filled);
      button.classList.toggle("is-selected", item.id === room.id);
      button.setAttribute(
        "aria-label",
        item.label + ": " + (filled ? item.glyph : "zatím bez Glyphu")
      );
      button.setAttribute("aria-pressed", String(item.id === room.id));
    });

    dom.glyph.value = room.glyph;
    dom.glyph.placeholder = "Glyph pro " + room.label;
    dom.clear.disabled = !room.glyph;
    dom.open.disabled = !room.glyph;
    dom.open.title = room.glyph
      ? "Vyslat událost pro " + room.label
      : "Nejprve přiřaď Glyph";
  }

  function lightRoom(id) {
    const button = dom?.buttons?.querySelector("[data-room-id='" + id + "']");

    if (!button) {
      return;
    }

    clearTimeout(timers.get(id));
    button.classList.remove("is-lit");
    void button.offsetWidth;
    button.classList.add("is-lit");

    timers.set(id, setTimeout(() => {
      button.classList.remove("is-lit");
      timers.delete(id);
    }, GLOW_TIME));
  }

  function select(id, options = {}) {
    const room = getRoom(id);

    if (!room) {
      return null;
    }

    selectedId = room.id;
    saveState();
    render();
    lightRoom(room.id);

    if (options.focusInput && dom?.glyph) {
      dom.glyph.focus({ preventScroll: true });
      dom.glyph.select();
    }

    status(room.label + " je vybraný — sem patří jeho Glyph.");
    publish("cht.room.selected", room, "select");
    return cloneRoom(room);
  }

  function assignGlyph(value) {
    const room = selectedRoom();
    const glyph = normaliseGlyph(value);

    if (!glyph) {
      status("Napiš nejdřív svůj Glyph — prstenec nic nevymýšlí sám.");
      dom?.glyph?.focus({ preventScroll: true });
      return null;
    }

    room.glyph = glyph;
    room.updatedAt = new Date().toISOString();
    saveState();
    render();
    lightRoom(room.id);
    status(room.label + " nese Glyph „" + glyph + "“.");
    publish("cht.room.changed", room, "assign-glyph");
    return cloneRoom(room);
  }

  function clearGlyph() {
    const room = selectedRoom();

    if (!room.glyph) {
      status(room.label + " je už prázdný.");
      return cloneRoom(room);
    }

    room.glyph = "";
    room.updatedAt = new Date().toISOString();
    saveState();
    render();
    lightRoom(room.id);
    status("Glyph z " + room.label + " byl odebrán.");
    publish("cht.room.changed", room, "clear-glyph");
    return cloneRoom(room);
  }

  function openRoom(id = selectedId) {
    const room = getRoom(id);

    if (!room) {
      return null;
    }

    if (!room.glyph) {
      status("" + room.label + " čeká na svůj Glyph.");
      return null;
    }

    lightRoom(room.id);
    publish("cht.room.open", room, "open");
    status(room.label + " vyslal svou bránu. Až ho napojíme, otevře se jeho svět.");
    return cloneRoom(room);
  }

  function setRoute(id, route) {
    const room = getRoom(id);

    if (!room) {
      return null;
    }

    room.route = normaliseRoute(route);
    room.updatedAt = new Date().toISOString();
    saveState();
    publish("cht.room.changed", room, "set-route");
    return cloneRoom(room);
  }

  function getRooms() {
    return state.rooms.map(cloneRoom);
  }

  function initialise() {
    if (!build()) {
      return;
    }

    window.dispatchEvent(new CustomEvent("cht.room.ready", {
      detail: Object.freeze({
        source: "cht360-room-orbit",
        rooms: getRooms()
      })
    }));
  }

  const api = Object.freeze({
    version: "1.0.0",
    getRooms,
    getRoom: id => {
      const room = getRoom(id);
      return room ? cloneRoom(room) : null;
    },
    select,
    assignGlyph,
    clearGlyph,
    open: openRoom,
    setRoute
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise, { once: true });
  } else {
    initialise();
  }

  return api;
})();

if (!window.CHTRoomOrbit) {
  window.CHTRoomOrbit = CHTRoomOrbit;
}
