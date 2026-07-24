"use strict";

/*
  CHT 360°‰. — Glyph dvířka 240
  Nahraj jako:
  docs/glyph-pokojicku-cht-360/glyph-dvirka-240.js

  Soubor se načítá až ZA současným app.js.
  Nepoužívá vlastní databázi. Pracuje se současným stavem, Glyphy,
  pokojíčky, IndexedDB, exportem a editory z app.js.
*/

(() => {
  const PAGE_SIZE = 8;
  const ROOM_LIMIT = 240;

  let roomSwipeStartX = null;
  let roomSwipeMoved = false;

  function occupiedRoomPairs() {
    return getRoomPairs()
      .filter((pair) => isRoomSlot(pair.room.slot));
  }

  function allRingEntries() {
    const entries = occupiedRoomPairs()
      .map((pair) => ({
        slot: pair.room.slot,
        pair
      }));

    const nextSlot = getNextRoomSlot();

    if (nextSlot !== null) {
      entries.push({
        slot: nextSlot,
        pair: null
      });
    }

    entries.sort((a, b) => a.slot - b.slot);
    return entries;
  }

  function totalRoomPages(entries = allRingEntries()) {
    return Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  }

  function clampRoomPage(entries = allRingEntries()) {
    const pages = totalRoomPages(entries);

    if (!Number.isInteger(state.roomPage)) {
      state.roomPage = 0;
    }

    state.roomPage = Math.max(
      0,
      Math.min(state.roomPage, pages - 1)
    );

    return pages;
  }

  function roomNumber(slot) {
    return String(slot).padStart(3, "0");
  }

  function renderEmptyDoor(slot) {
    const number = roomNumber(slot);

    return `
      <button
        class="room-wall room-wall--empty glyph-door"
        type="button"
        data-empty-slot="${number}"
        aria-label="Volné dveře ${number}: vytvořit Glyph"
      >
        <span class="room-door-frame" aria-hidden="true"></span>

        <span class="room-number">
          Pokojíček ${number}
        </span>

        <span class="room-empty-title">
          Volné dveře
        </span>

        <span class="room-door room-door--empty" aria-hidden="true">
          <span class="room-window">+</span>
          <span class="room-handle"></span>
        </span>

        <span class="room-tip">
          klepni a napiš Glyph
        </span>
      </button>
    `;
  }

  function renderSavedDoor(slot, pair) {
    const { room, glyph } = pair;
    const selected =
      room.id === state.selectedRoomId
        ? " is-selected"
        : "";

    const revealed =
      room.id === state.revealedRoomId
        ? " is-revealed"
        : "";

    const description =
      glyph.description ||
      "Tento pokojíček nezískal popisek.";

    const note =
      room.note ||
      "Pokojíček čeká na další obsah.";

    const number = roomNumber(slot);

    return `
      <button
        class="room-wall glyph-door theme-${escapeAttribute(room.theme)}${selected}${revealed}"
        type="button"
        data-room-id="${escapeAttribute(room.id)}"
        aria-label="${escapeAttribute(room.title || `Pokojíček ${number}`)}"
        aria-expanded="${revealed ? "true" : "false"}"
      >
        <span class="room-door-frame" aria-hidden="true"></span>

        <span class="room-number">
          ${escapeHtml(room.title || `Pokojíček ${number}`)}
        </span>

        <span class="room-door" aria-hidden="true">
          <span class="room-window">
            ${escapeHtml(glyph.glyph)}
          </span>

          <span class="room-handle"></span>
          <span class="room-light"></span>
        </span>

        <span class="room-tip">
          ${
            revealed
              ? "otevřeno · klepni pro výběr"
              : "dvojité klepnutí otevře"
          }
        </span>

        <span class="room-reveal">
          <strong class="revealed-glyph">
            ${escapeHtml(glyph.glyph)}
          </strong>

          <span class="revealed-description">
            ${escapeHtml(description)}
          </span>

          <small>
            ${escapeHtml(note)}
          </small>
        </span>
      </button>
    `;
  }

  function renderDoors(entries) {
    const start = state.roomPage * PAGE_SIZE;
    const visibleEntries = entries.slice(
      start,
      start + PAGE_SIZE
    );

    if (!visibleEntries.length) {
      return renderEmptyDoor(1);
    }

    return visibleEntries
      .map(({ slot, pair }) =>
        pair
          ? renderSavedDoor(slot, pair)
          : renderEmptyDoor(slot)
      )
      .join("");
  }

  function renderRingNavigation(totalPages) {
    return `
      <button
        class="glyph-ring-nav glyph-ring-nav--prev"
        type="button"
        data-room-page="-1"
        ${state.roomPage <= 0 ? "disabled" : ""}
        aria-label="Předchozí dvířka"
      >‹</button>

      <button
        class="glyph-ring-nav glyph-ring-nav--next"
        type="button"
        data-room-page="1"
        ${
          state.roomPage >= totalPages - 1
            ? "disabled"
            : ""
        }
        aria-label="Další dvířka"
      >›</button>
    `;
  }

  function renderRingStatus(entries, totalPages) {
    const start =
      entries.length
        ? state.roomPage * PAGE_SIZE + 1
        : 0;

    const end = Math.min(
      state.roomPage * PAGE_SIZE + PAGE_SIZE,
      entries.length
    );

    const occupied = entries.filter(
      (entry) => entry.pair
    ).length;

    return `
      <div class="glyph-ring-status">
        <span>Dvířka ${start}–${end}</span>
        <strong>${occupied} / ${ROOM_LIMIT}</strong>
        <span>
          strana ${state.roomPage + 1} / ${totalPages}
        </span>
      </div>
    `;
  }

  /*
    Přepisuje pouze vykreslení scény.
    Ostatní současné funkce app.js zůstávají zachované.
  */
  window.renderRoomScene = function renderRoomScene240() {
    const entries = allRingEntries();
    const pages = clampRoomPage(entries);
    const doors = renderDoors(entries);

    dom.roomScene.innerHTML = `
      <section
        class="glyph-ring"
        aria-label="Prstenec Glyph dvířek"
      >
        <div
          class="glyph-ring-back"
          aria-hidden="true"
        ></div>

        ${renderRingNavigation(pages)}

        <div class="glyph-ring-doors">
          ${doors}
        </div>

        <div
          class="glyph-ring-front"
          aria-hidden="true"
        ></div>
      </section>

      ${renderRingStatus(entries, pages)}
    `;
  };

  function changeRoomPage(direction) {
    const entries = allRingEntries();
    const pages = totalRoomPages(entries);

    state.roomPage = Math.max(
      0,
      Math.min(
        pages - 1,
        Number(state.roomPage || 0) + direction
      )
    );

    state.revealedRoomId = null;
    window.renderRoomScene();
  }

  function handleNavigationClick(event) {
    const button = event.target.closest(
      "[data-room-page]"
    );

    if (!button || button.disabled) return;

    event.preventDefault();
    event.stopPropagation();

    changeRoomPage(
      Number(button.dataset.roomPage)
    );
  }

  function handlePointerDown(event) {
    roomSwipeStartX = event.clientX;
    roomSwipeMoved = false;
  }

  function handlePointerMove(event) {
    if (roomSwipeStartX === null) return;

    if (
      Math.abs(event.clientX - roomSwipeStartX) > 12
    ) {
      roomSwipeMoved = true;
    }
  }

  function handlePointerUp(event) {
    if (roomSwipeStartX === null) return;

    const distance =
      event.clientX - roomSwipeStartX;

    roomSwipeStartX = null;

    if (
      !roomSwipeMoved ||
      Math.abs(distance) < 55
    ) {
      roomSwipeMoved = false;
      return;
    }

    roomSwipeMoved = false;
    changeRoomPage(distance > 0 ? -1 : 1);
  }

  function installRingEvents() {
    dom.roomScene.addEventListener(
      "click",
      handleNavigationClick,
      true
    );

    dom.roomScene.addEventListener(
      "pointerdown",
      handlePointerDown,
      { passive: true }
    );

    dom.roomScene.addEventListener(
      "pointermove",
      handlePointerMove,
      { passive: true }
    );

    dom.roomScene.addEventListener(
      "pointerup",
      handlePointerUp,
      { passive: true }
    );

    dom.roomScene.addEventListener(
      "pointercancel",
      () => {
        roomSwipeStartX = null;
        roomSwipeMoved = false;
      },
      { passive: true }
    );
  }

  function migrateLimitText() {
    const replaceText = (element) => {
      if (!element) return;

      element.textContent = element.textContent
        .replaceAll("70 dveří", "240 dveří")
        .replaceAll(
          "všech 70 dveří",
          "všech 240 dveří"
        );
    };

    replaceText(dom.statusLine);
  }

  /*
    Původní konstanta ROOM_SLOT_COUNT je const a nelze ji přepsat.
    Proto rozšiřujeme funkce, které limit používají.
  */
  window.isRoomSlot = function isRoomSlot240(value) {
    return (
      Number.isInteger(value) &&
      value >= 1 &&
      value <= ROOM_LIMIT
    );
  };

  window.getNextRoomSlot = function getNextRoomSlot240() {
    const usedSlots = new Set(
      state.rooms
        .map((room) => room.slot)
        .filter(window.isRoomSlot)
    );

    for (
      let slot = 1;
      slot <= ROOM_LIMIT;
      slot += 1
    ) {
      if (!usedSlots.has(slot)) return slot;
    }

    return null;
  };

  window.roomCapacityReached =
    function roomCapacityReached240() {
      return window.getNextRoomSlot() === null;
    };

  window.ensureRoomSlots =
    function ensureRoomSlots240() {
      let changed = false;
      const usedSlots = new Set();

      const rooms = [...state.rooms].sort(
        (a, b) =>
          a.createdAt.localeCompare(b.createdAt)
      );

      rooms.forEach((room) => {
        if (
          window.isRoomSlot(room.slot) &&
          !usedSlots.has(room.slot)
        ) {
          usedSlots.add(room.slot);
          return;
        }

        if (room.slot !== null) {
          room.slot = null;
          changed = true;
        }
      });

      rooms.forEach((room) => {
        if (window.isRoomSlot(room.slot)) return;

        for (
          let slot = 1;
          slot <= ROOM_LIMIT;
          slot += 1
        ) {
          if (usedSlots.has(slot)) continue;

          room.slot = slot;
          usedSlots.add(slot);
          changed = true;
          return;
        }
      });

      return changed;
    };

  function updateRoomCounter() {
    const occupied = occupiedRoomPairs().length;

    if (dom.roomCount) {
      dom.roomCount.textContent =
        `${occupied} / ${ROOM_LIMIT}`;
    }
  }

  const originalRenderDrums =
    window.renderDrums;

  window.renderDrums = function renderDrums240() {
    originalRenderDrums();
    updateRoomCounter();
  };

  /*
    Po načtení doplňku proběhne nové vykreslení.
  */
  if (!Number.isInteger(state.roomPage)) {
    state.roomPage = 0;
  }

  installRingEvents();
  migrateLimitText();
  window.renderAll();
})();
