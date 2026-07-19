"use strict";

/*
 * CHT 360°‰. · 3D rotující prstenec pokojíčků
 *
 * Šest pokojíčků je možné táhnout po celém prstenci. Krátké klepnutí otevře
 * přímo klávesnici iPhonu pro Glyph; smazání z klávesnice Glyph vymaže.
 */

const CHTRoomOrbit = (() => {
  const STORAGE_KEY = "cht360_room_orbit_v1";
  const ROOM_COUNT = 6;
  const GLOW_TIME = 5000;
  const MAX_GLYPH_GRAPHEMES = 12;
  const ORBIT_ID = "chtRoomOrbit";
  const DRAG_THRESHOLD = 7;
  const SPIN_DEGREES_PER_SECOND = 18;
  const RING_RADIUS_PERCENT = 42;

  const DEFAULT_ANGLES = Object.freeze([-90, -30, 30, 90, 150, 210]);
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  const state = loadState();
  const glowTimers = new Map();
  let selectedId = state.selectedId || state.rooms[0].id;
  let ringSpin = 0;
  let lastFrameTime = 0;
  let drag = null;
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

  function normaliseAngle(value, fallback = 0) {
    const numeric = Number(value);
    const safe = Number.isFinite(numeric) ? numeric : fallback;
    return ((safe % 360) + 360) % 360;
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
      angle: normaliseAngle(DEFAULT_ANGLES[index - 1]),
      route: null,
      updatedAt: null
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

  function normaliseRoom(value, index) {
    const base = createRoom(index);
    const source = value && typeof value === "object" ? value : {};

    return {
      ...base,
      id: base.id,
      index,
      glyph: normaliseGlyph(source.glyph),
      angle: normaliseAngle(source.angle, base.angle),
      route: normaliseRoute(source.route),
      updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : null
    };
  }

  function loadState() {
    const fallback = {
      version: 2,
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
        version: 2,
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
      angle: room.angle,
      route: room.route ? { ...room.route } : null,
      updatedAt: room.updatedAt
    };
  }

  function getRoom(id) {
    return state.rooms.find(room => room.id === String(id)) || null;
  }

  function eventDetail(room, action) {
    return Object.freeze({
      source: "cht360-room-orbit",
      action,
      id: room.id,
      index: room.index,
      label: room.label,
      glyph: room.glyph,
      angle: room.angle,
      route: room.route ? { ...room.route } : null,
      updatedAt: room.updatedAt
    });
  }

  function publish(type, room, action) {
    window.dispatchEvent(
      new CustomEvent(type, { detail: eventDetail(room, action) })
    );
  }

  function positionForAngle(angle) {
    const radians = normaliseAngle(angle) * Math.PI / 180;

    return {
      x: 50 + Math.cos(radians) * RING_RADIUS_PERCENT,
      y: 50 + Math.sin(radians) * RING_RADIUS_PERCENT
    };
  }

  function roomElement(id) {
    return dom?.rooms?.querySelector("[data-room-id='" + id + "']") || null;
  }

  function editorFor(id) {
    return roomElement(id)?.querySelector(".cht-room__editor") || null;
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
    root.setAttribute("aria-label", "3D rotující prstenec šesti pokojíčků");
    root.innerHTML = `
      <div class="cht-room-orbit__shell">
        <p class="cht-room-orbit__label">3D prstenec · pokojíčky 1–6</p>

        <div class="cht-room-orbit__rotor" data-room-rotor>
          <svg class="cht-room-orbit__wire" viewBox="0 0 520 520" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id="cht-room-ring-v3-line" x1="70" y1="74" x2="450" y2="446" gradientUnits="userSpaceOnUse">
                <stop stop-color="#8d6a2d" stop-opacity=".74" />
                <stop offset=".28" stop-color="#fff0c5" stop-opacity=".96" />
                <stop offset=".59" stop-color="#c89735" stop-opacity=".78" />
                <stop offset="1" stop-color="#fff0c5" stop-opacity=".64" />
              </linearGradient>
              <radialGradient id="cht-room-ring-v3-aura" cx="50%" cy="50%" r="50%">
                <stop stop-color="#ffd781" stop-opacity=".18" />
                <stop offset=".64" stop-color="#b67e26" stop-opacity=".04" />
                <stop offset="1" stop-color="#000" stop-opacity="0" />
              </radialGradient>
            </defs>

            <circle class="ring-v3__aura" cx="260" cy="260" r="244" />
            <circle class="ring-v3__outer" cx="260" cy="260" r="205" />
            <circle class="ring-v3__middle" cx="260" cy="260" r="190" />
            <circle class="ring-v3__inner" cx="260" cy="260" r="165" />
            <ellipse class="ring-v3__latitude" cx="260" cy="260" rx="205" ry="78" />
            <ellipse class="ring-v3__latitude" cx="260" cy="260" rx="190" ry="58" />
            <ellipse class="ring-v3__latitude" cx="260" cy="260" rx="165" ry="36" />
            <ellipse class="ring-v3__longitude" cx="260" cy="260" rx="78" ry="205" />
            <ellipse class="ring-v3__longitude" cx="260" cy="260" rx="48" ry="190" />
            <path class="ring-v3__longitude" d="M55 260 C132 170 388 170 465 260 M55 260 C132 350 388 350 465 260" />
            <path class="ring-v3__dash" d="M260 55 A205 205 0 0 1 465 260 A205 205 0 0 1 260 465 A205 205 0 0 1 55 260 A205 205 0 0 1 260 55" />
            <circle class="ring-v3__star" cx="260" cy="55" r="2.4" />
            <circle class="ring-v3__star" cx="465" cy="260" r="2.4" />
            <circle class="ring-v3__star" cx="260" cy="465" r="2.4" />
            <circle class="ring-v3__star" cx="55" cy="260" r="2.4" />
          </svg>

          <div class="cht-room-orbit__rooms" data-room-buttons></div>
        </div>
      </div>
    `;

    host.append(root);

    dom = {
      root,
      rotor: root.querySelector("[data-room-rotor]"),
      rooms: root.querySelector("[data-room-buttons]")
    };

    state.rooms.forEach(room => {
      const slot = document.createElement("div");
      const number = document.createElement("span");
      const glyph = document.createElement("span");
      const editor = document.createElement("input");

      slot.className = "cht-room";
      slot.dataset.roomId = room.id;
      slot.tabIndex = 0;
      slot.setAttribute("role", "button");

      number.className = "cht-room__number";
      number.textContent = String(room.index);

      glyph.className = "cht-room__glyph";

      editor.className = "cht-room__editor";
      editor.type = "text";
      editor.maxLength = 24;
      editor.autocomplete = "off";
      editor.autocapitalize = "off";
      editor.spellcheck = false;
      editor.setAttribute("aria-label", "Glyph pro " + room.label);

      slot.append(number, glyph, editor);

      slot.addEventListener("pointerdown", event => startPointer(room.id, slot, editor, event));
      slot.addEventListener("pointermove", event => movePointer(room.id, event));
      slot.addEventListener("pointerup", event => endPointer(room.id, slot, event));
      slot.addEventListener("pointercancel", event => cancelPointer(slot, event));

      slot.addEventListener("keydown", event => {
        if (event.target === editor) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select(room.id, { focusInput: true });
        }
      });

      editor.addEventListener("focus", () => {
        if (selectedId !== room.id) {
          selectedId = room.id;
          saveState();
        }

        dom.root.classList.add("is-editing");
        renderAll();
      });

      editor.addEventListener("input", () => {
        updateGlyph(room.id, editor.value, "type-glyph");
      });

      editor.addEventListener("keydown", event => {
        if (event.key === "Enter") {
          event.preventDefault();
          editor.blur();
        }

        if (event.key === "Escape") {
          event.preventDefault();
          editor.value = getRoom(room.id)?.glyph || "";
          editor.blur();
        }
      });

      editor.addEventListener("blur", () => {
        requestAnimationFrame(() => {
          if (!dom?.root?.querySelector(".cht-room__editor:focus")) {
            finishEditing();
          }
        });
      });

      dom.rooms.append(slot);
    });

    document.addEventListener("pointerdown", event => {
      if (dom && !dom.root.contains(event.target)) {
        finishEditing();
      }
    }, true);

    renderAll();
    requestAnimationFrame(animate);
    return true;
  }

  function startPointer(id, slot, editor, event) {
    if (event.target === editor || event.button > 0) {
      return;
    }

    const room = getRoom(id);

    if (!room) {
      return;
    }

    event.preventDefault();
    finishEditing();
    selectedId = room.id;
    saveState();

    drag = {
      id: room.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false
    };

    dom.root.classList.add("is-dragging");
    slot.classList.add("is-dragging");
    slot.setPointerCapture?.(event.pointerId);
    renderAll();
  }

  function movePointer(id, event) {
    if (!drag || drag.id !== id || drag.pointerId !== event.pointerId) {
      return;
    }

    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);

    if (distance < DRAG_THRESHOLD && !drag.moved) {
      return;
    }

    drag.moved = true;
    event.preventDefault();
    moveRoomToPointer(id, event.clientX, event.clientY);
  }

  function endPointer(id, slot, event) {
    if (!drag || drag.id !== id || drag.pointerId !== event.pointerId) {
      return;
    }

    const wasMoved = drag.moved;
    drag = null;
    slot.releasePointerCapture?.(event.pointerId);
    slot.classList.remove("is-dragging");
    dom.root.classList.remove("is-dragging");

    if (wasMoved) {
      const room = getRoom(id);
      renderAll();
      lightRoom(id);
      publish("cht.room.changed", room, "move-room");
      return;
    }

    select(id, { focusInput: true });
  }

  function cancelPointer(slot, event) {
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    drag = null;
    slot.releasePointerCapture?.(event.pointerId);
    slot.classList.remove("is-dragging");
    dom?.root?.classList.remove("is-dragging");
    renderAll();
  }

  function moveRoomToPointer(id, clientX, clientY) {
    const room = getRoom(id);
    const rect = dom?.rotor?.getBoundingClientRect();

    if (!room || !rect || !rect.width || !rect.height) {
      return null;
    }

    const centreX = rect.left + rect.width / 2;
    const centreY = rect.top + rect.height / 2;
    const relativeX = (clientX - centreX) / (rect.width * RING_RADIUS_PERCENT / 100);
    const relativeY = (clientY - centreY) / (rect.height * RING_RADIUS_PERCENT / 100);
    const screenAngle = Math.atan2(relativeY, relativeX) * 180 / Math.PI;

    room.angle = normaliseAngle(screenAngle - ringSpin);
    room.updatedAt = new Date().toISOString();
    saveState();
    renderRoom(room);
    return cloneRoom(room);
  }

  function renderRoom(room) {
    const slot = roomElement(room.id);

    if (!slot || !dom) {
      return;
    }

    const glyph = slot.querySelector(".cht-room__glyph");
    const editor = slot.querySelector(".cht-room__editor");
    const filled = Boolean(room.glyph);
    const editing = dom.root.classList.contains("is-editing") && room.id === selectedId;
    const point = positionForAngle(room.angle);

    slot.style.setProperty("--room-x", point.x + "%");
    slot.style.setProperty("--room-y", point.y + "%");
    glyph.textContent = filled ? room.glyph : "·";
    slot.classList.toggle("is-empty", !filled);
    slot.classList.toggle("is-selected", room.id === selectedId);
    slot.classList.toggle("is-editing", editing);
    slot.setAttribute(
      "aria-label",
      room.label + ": " + (filled ? room.glyph : "klepni a napiš Glyph, podrž a táhni po prstenci")
    );
    slot.setAttribute("aria-pressed", String(room.id === selectedId));

    if (document.activeElement !== editor) {
      editor.value = room.glyph;
    }
  }

  function renderAll() {
    if (!dom) {
      return;
    }

    state.rooms.forEach(renderRoom);
  }

  function animate(time) {
    const elapsed = lastFrameTime ? Math.min(time - lastFrameTime, 48) : 16;
    lastFrameTime = time;

    if (
      dom &&
      !prefersReducedMotion &&
      !dom.root.classList.contains("is-editing") &&
      !dom.root.classList.contains("is-dragging")
    ) {
      ringSpin = normaliseAngle(ringSpin + elapsed * SPIN_DEGREES_PER_SECOND / 1000);
      dom.rotor.style.setProperty("--ring-spin", ringSpin + "deg");
      dom.rotor.style.setProperty("--ring-counter", -ringSpin + "deg");
    }

    requestAnimationFrame(animate);
  }

  function lightRoom(id) {
    const slot = roomElement(id);

    if (!slot) {
      return;
    }

    clearTimeout(glowTimers.get(id));
    slot.classList.remove("is-lit");
    void slot.offsetWidth;
    slot.classList.add("is-lit");

    glowTimers.set(id, setTimeout(() => {
      slot.classList.remove("is-lit");
      glowTimers.delete(id);
    }, GLOW_TIME));
  }

  function finishEditing() {
    if (!dom || !dom.root.classList.contains("is-editing")) {
      return;
    }

    dom.root.classList.remove("is-editing");
    renderAll();
  }

  function select(id, options = {}) {
    const room = getRoom(id);

    if (!room) {
      return null;
    }

    selectedId = room.id;
    dom?.root?.classList.add("is-editing");
    saveState();
    renderAll();
    lightRoom(room.id);

    if (options.focusInput !== false) {
      const editor = editorFor(room.id);

      if (editor) {
        /* Volá se přímo po klepnutí, proto iPhone otevře klávesnici. */
        editor.focus({ preventScroll: true });
        editor.select();
      }
    }

    publish("cht.room.selected", room, "select");
    return cloneRoom(room);
  }

  function updateGlyph(id, value, action = "assign-glyph") {
    const room = getRoom(id);

    if (!room) {
      return null;
    }

    const glyph = normaliseGlyph(value);
    const editor = editorFor(room.id);

    if (editor && editor.value !== glyph) {
      editor.value = glyph;
    }

    if (room.glyph === glyph) {
      return cloneRoom(room);
    }

    room.glyph = glyph;
    room.updatedAt = new Date().toISOString();
    saveState();
    renderRoom(room);
    publish("cht.room.changed", room, glyph ? action : "clear-glyph");
    return cloneRoom(room);
  }

  function assignGlyph(value) {
    return updateGlyph(selectedId, value, "assign-glyph");
  }

  function clearGlyph() {
    return updateGlyph(selectedId, "", "clear-glyph");
  }

  function openRoom(id = selectedId) {
    const room = getRoom(id);

    if (!room || !room.glyph) {
      return null;
    }

    lightRoom(room.id);
    publish("cht.room.open", room, "open");
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

  function setAngle(id, angle) {
    const room = getRoom(id);

    if (!room) {
      return null;
    }

    room.angle = normaliseAngle(angle, room.angle);
    room.updatedAt = new Date().toISOString();
    saveState();
    renderRoom(room);
    publish("cht.room.changed", room, "move-room");
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
    version: "3.0.0",
    getRooms,
    getRoom: id => {
      const room = getRoom(id);
      return room ? cloneRoom(room) : null;
    },
    select,
    assignGlyph,
    clearGlyph,
    open: openRoom,
    setRoute,
    setAngle
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
