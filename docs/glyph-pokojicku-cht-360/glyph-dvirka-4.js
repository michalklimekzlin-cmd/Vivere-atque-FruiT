"use strict";

/*
  CHT 360°‰. — ROSTOUCÍ GLYPH DVÍŘKA
  Nahraj jako:
  docs/glyph-pokojicku-cht-360/glyph-dvirka-4.js
*/

(() => {
  const LIMIT = 240;
  const STEP = 4;
  const STORAGE_KEY = "cht360_glyph_grow_rooms_v1";

  const roomList = document.getElementById("room-list");
  const roomDialog = document.getElementById("room-dialog");
  const metricRooms = document.getElementById("metric-rooms");
  const statusMessage = document.getElementById("status-message");

  if (!roomList || !roomDialog) return;

  const fields = {
    glyph: document.getElementById("room-glyph"),
    name: document.getElementById("room-name"),
    doorLabel: document.getElementById("room-door-label"),
    story: document.getElementById("room-story"),
    note: document.getElementById("room-note"),
    miniApp: document.getElementById("room-mini-app"),
    title: document.getElementById("room-dialog-title"),
    deleteButton: document.getElementById("delete-room")
  };

  const state = {
    rooms: loadRooms(),
    editingSlot: null,
    lastOpenSlot: null
  };

  function setStatus(message) {
    if (statusMessage) statusMessage.textContent = message;
  }

  function safeText(value, fallback = "") {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }

  function roomDefaultName(slot) {
    return `Pokojíček ${String(slot).padStart(2, "0")}`;
  }

  function normalizeRoom(raw, slotFallback) {
    const slot = Number(raw?.slot ?? slotFallback);
    return {
      slot,
      glyph: safeText(raw?.glyph, "`i´").slice(0, 24),
      name: safeText(raw?.name, roomDefaultName(slot)).slice(0, 96),
      doorLabel: safeText(raw?.doorLabel, "Nápis").slice(0, 96),
      story: safeText(raw?.story, "Sem přijde příběh obyvatele pokojíčku.").slice(0, 10000),
      note: safeText(raw?.note, "").slice(0, 6000),
      miniApp: safeText(raw?.miniApp, "priprava"),
      createdAt: Number(raw?.createdAt) || Date.now(),
      updatedAt: Number(raw?.updatedAt) || Date.now()
    };
  }

  function loadRooms() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((room, index) => normalizeRoom(room, index + 1))
        .filter((room) => Number.isInteger(room.slot) && room.slot >= 1 && room.slot <= LIMIT)
        .sort((a, b) => a.slot - b.slot);
    } catch (error) {
      console.warn("Nepodařilo se načíst Glyph dvířka:", error);
      return [];
    }
  }

  function saveRooms() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.rooms));
    updateMetrics();
  }

  function updateMetrics() {
    if (metricRooms) {
      metricRooms.textContent = `${state.rooms.length} / ${LIMIT}`;
    }
  }

  function visibleDoorCount() {
    return Math.min(LIMIT, Math.max(STEP, Math.ceil((state.rooms.length + 1) / STEP) * STEP));
  }

  function getRoomBySlot(slot) {
    return state.rooms.find((room) => room.slot === Number(slot)) || null;
  }

  function miniAppLabel(value) {
    const labels = {
      priprava: "Připraveno na napojení",
      poznamky: "Poznámky",
      hra: "Mini hra",
      ai: "AI modul",
      odkaz: "Odkaz / cesta"
    };
    return labels[value] || labels.priprava;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function renderEmptyDoor(slot) {
    return `
      <article class="grow-door-card is-empty" data-slot="${slot}">
        <button class="grow-door" type="button" data-empty-slot="${slot}" aria-label="Vytvořit pokojíček ${slot}">
          <span class="grow-door-number">POKOJÍČEK ${String(slot).padStart(2, "0")}</span>
          <span class="grow-door-leaf">
            <span class="grow-door-window">+</span>
            <span class="grow-door-handle"></span>
          </span>
          <span class="grow-door-label">Volné dvířka</span>
          <span class="grow-door-tip">klepni a vytvoř</span>
        </button>
      </article>
    `;
  }

  function renderFilledDoor(room) {
    const open = state.lastOpenSlot === room.slot ? " is-open" : "";
    return `
      <article class="grow-door-card${open}" data-slot="${room.slot}">
        <button class="grow-door" type="button" data-room-slot="${room.slot}" aria-expanded="${open ? "true" : "false"}" aria-label="${escapeHtml(room.name)}">
          <span class="grow-door-number">POKOJÍČEK ${String(room.slot).padStart(2, "0")}</span>
          <span class="grow-door-leaf">
            <span class="grow-door-window">${escapeHtml(room.glyph)}</span>
            <span class="grow-door-handle"></span>
            <span class="grow-door-light"></span>
          </span>
          <span class="grow-door-label">${escapeHtml(room.doorLabel)}</span>
          <span class="grow-door-tip">${open ? "otevřeno" : "klepni pro otevření"}</span>
        </button>

        <section class="grow-door-panel">
          <strong>${escapeHtml(room.name)}</strong>
          <div class="grow-door-panel-glyph">${escapeHtml(room.glyph)}</div>
          <p>${escapeHtml(room.story)}</p>
          <small>${escapeHtml(miniAppLabel(room.miniApp))}</small>

          <div class="grow-door-actions">
            <button type="button" data-door-action="edit" data-slot="${room.slot}">Upravit</button>
            <button type="button" data-door-action="close" data-slot="${room.slot}">Zavřít</button>
          </div>
        </section>
      </article>
    `;
  }

  function render() {
    const count = visibleDoorCount();
    const parts = [];

    for (let slot = 1; slot <= count; slot += 1) {
      const room = getRoomBySlot(slot);
      parts.push(room ? renderFilledDoor(room) : renderEmptyDoor(slot));
    }

    roomList.innerHTML = `
      <section class="grow-doors-shell" aria-label="Glyph dvířka">
        <div class="grow-doors-grid">
          ${parts.join("")}
        </div>
      </section>
    `;

    updateMetrics();
  }

  function resetDialog(slot) {
    state.editingSlot = slot;
    fields.title.textContent = `Pokojíček ${String(slot).padStart(2, "0")}`;
    fields.glyph.value = "`i´";
    fields.name.value = roomDefaultName(slot);
    fields.doorLabel.value = "Nápis";
    fields.story.value = "";
    fields.note.value = "";
    fields.miniApp.value = "priprava";
    fields.deleteButton.classList.add("is-hidden");
  }

  function openNewRoom(slot) {
    if (state.rooms.length >= LIMIT) {
      setStatus(`Limit ${LIMIT} pokojíčků je zaplněný.`);
      return;
    }
    resetDialog(slot);
    roomDialog.showModal();
    setTimeout(() => fields.glyph.focus(), 60);
  }

  function openEditRoom(slot) {
    const room = getRoomBySlot(slot);
    if (!room) return;

    state.editingSlot = slot;
    fields.title.textContent = `Pokojíček ${String(slot).padStart(2, "0")}`;
    fields.glyph.value = room.glyph;
    fields.name.value = room.name;
    fields.doorLabel.value = room.doorLabel;
    fields.story.value = room.story;
    fields.note.value = room.note;
    fields.miniApp.value = room.miniApp;
    fields.deleteButton.classList.remove("is-hidden");

    roomDialog.showModal();
    setTimeout(() => fields.glyph.focus(), 60);
  }

  function closeDialog() {
    if (roomDialog.open) roomDialog.close();
  }

  function saveFromDialog() {
    const slot = Number(state.editingSlot);
    if (!slot) return;

    const existing = getRoomBySlot(slot);
    const nextRoom = normalizeRoom({
      slot,
      glyph: fields.glyph.value,
      name: fields.name.value,
      doorLabel: fields.doorLabel.value,
      story: fields.story.value,
      note: fields.note.value,
      miniApp: fields.miniApp.value,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now()
    }, slot);

    if (existing) {
      state.rooms = state.rooms.map((room) => room.slot === slot ? nextRoom : room);
      setStatus(`Pokojíček ${String(slot).padStart(2, "0")} je upravený.`);
    } else {
      state.rooms.push(nextRoom);
      state.rooms.sort((a, b) => a.slot - b.slot);
      setStatus(`Pokojíček ${String(slot).padStart(2, "0")} byl vytvořený.`);
    }

    state.lastOpenSlot = slot;
    saveRooms();
    render();
    closeDialog();
  }

  function deleteEditingRoom() {
    const slot = Number(state.editingSlot);
    if (!slot) return;

    state.rooms = state.rooms.filter((room) => room.slot !== slot);
    if (state.lastOpenSlot === slot) state.lastOpenSlot = null;

    saveRooms();
    render();
    closeDialog();
    setStatus(`Pokojíček ${String(slot).padStart(2, "0")} byl smazaný.`);
  }

  function toggleDoor(slot) {
    const room = getRoomBySlot(slot);
    if (!room) {
      openNewRoom(slot);
      return;
    }
    state.lastOpenSlot = state.lastOpenSlot === slot ? null : slot;
    render();
  }

  document.addEventListener("click", (event) => {
    const addButton = event.target.closest('[data-action="add-room"]');
    const saveButton = event.target.closest('[data-action="save-room"]');
    const closeButton = event.target.closest('[data-action="close-room"]');
    const deleteButton = event.target.closest('[data-action="delete-room"]');

    if (addButton) {
      event.preventDefault();
      event.stopImmediatePropagation();

      const freeSlot = [...Array(visibleDoorCount()).keys()]
        .map((index) => index + 1)
        .find((slot) => !getRoomBySlot(slot)) || Math.min(state.rooms.length + 1, LIMIT);

      openNewRoom(freeSlot);
      return;
    }

    if (saveButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      saveFromDialog();
      return;
    }

    if (closeButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeDialog();
      return;
    }

    if (deleteButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      deleteEditingRoom();
      return;
    }

    const emptyDoor = event.target.closest("[data-empty-slot]");
    if (emptyDoor && roomList.contains(emptyDoor)) {
      event.preventDefault();
      openNewRoom(Number(emptyDoor.dataset.emptySlot));
      return;
    }

    const filledDoor = event.target.closest("[data-room-slot]");
    if (filledDoor && roomList.contains(filledDoor)) {
      event.preventDefault();
      toggleDoor(Number(filledDoor.dataset.roomSlot));
      return;
    }

    const doorAction = event.target.closest("[data-door-action]");
    if (doorAction && roomList.contains(doorAction)) {
      event.preventDefault();
      const slot = Number(doorAction.dataset.slot);
      if (doorAction.dataset.doorAction === "edit") openEditRoom(slot);
      if (doorAction.dataset.doorAction === "close") {
        state.lastOpenSlot = null;
        render();
      }
    }
  }, true);

  render();
  setStatus("Glyph dvířka jsou připravená. Nejprve vidíš 4 a po zaplnění přibydou další.");
})();
