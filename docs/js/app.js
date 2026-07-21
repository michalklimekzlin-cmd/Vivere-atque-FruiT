"use strict";

/*
  CHT 360°‰. · zlatý redesign pokojíčků
  Všechna data zůstávají v localStorage tohoto prohlížeče.
*/

const APP_SCHEMA = "cht360-redesign-v1";
const STORAGE_KEY = "cht360_pamet_v1";
const LEGACY_STORAGE_KEYS = ["vaft_pamet_v1"];
const SNAPSHOT_KEY = "cht360_pamet_snapshots_v1";
const ROOMS_KEY = "cht360_glyph_rooms_v2";
const BACKUP_KEY = "cht360_samoopravovna_backup_v2";
const SCAN_KEY = "cht360_scan_report_v2";
const SLOT_COUNT = 70;
const ROOM_LIMIT = 240;
const MAX_IMPORT_BYTES = 4_000_000;
let storageReady = true;

const CORE_META = Object.freeze([
  {
    id: "earth",
    number: "01",
    icon: "◌",
    title: "Země",
    subtitle: "Modelování, světy a úhel pohledu"
  },
  {
    id: "language",
    number: "02",
    icon: "ア",
    title: "Jazyk",
    subtitle: "Písmena, symboly, Glyphy a význam"
  },
  {
    id: "game",
    number: "03",
    icon: "✦",
    title: "Hra",
    subtitle: "Pravidla, události a postup"
  },
  {
    id: "control",
    number: "04",
    icon: "14",
    title: "iPhone 14",
    subtitle: "Červený uzel a ručně předané cesty"
  }
]);

const coreById = new Map(CORE_META.map(core => [core.id, core]));

const elements = {
  status: document.getElementById("status-message"),
  coreList: document.getElementById("core-list"),
  roomList: document.getElementById("room-list"),
  scanResult: document.getElementById("scan-result"),
  metricMemory: document.getElementById("metric-memory"),
  metricRooms: document.getElementById("metric-rooms"),
  metricStorage: document.getElementById("metric-storage"),
  metricStorageNote: document.getElementById("metric-storage-note"),
  roomsSection: document.getElementById("rooms-section"),
  coreDialog: document.getElementById("core-dialog"),
  coreDialogKicker: document.getElementById("core-dialog-kicker"),
  coreDialogTitle: document.getElementById("core-dialog-title"),
  coreDialogSubtitle: document.getElementById("core-dialog-subtitle"),
  slotSearch: document.getElementById("slot-search"),
  slotSummary: document.getElementById("slot-summary"),
  slotGrid: document.getElementById("slot-grid"),
  slotDialog: document.getElementById("slot-dialog"),
  slotDialogKicker: document.getElementById("slot-dialog-kicker"),
  slotDialogTitle: document.getElementById("slot-dialog-title"),
  slotName: document.getElementById("slot-name"),
  slotContent: document.getElementById("slot-content"),
  roomDialog: document.getElementById("room-dialog"),
  roomDialogTitle: document.getElementById("room-dialog-title"),
  roomGlyph: document.getElementById("room-glyph"),
  roomName: document.getElementById("room-name"),
  roomNote: document.getElementById("room-note"),
  deleteRoom: document.getElementById("delete-room"),
  infoDialog: document.getElementById("info-dialog"),
  importInput: document.getElementById("import-input")
};

const state = {
  memory: loadMemory(),
  rooms: loadRooms(),
  activeCoreId: "earth",
  activeSlotIndex: 0,
  activeRoomId: null,
  slotQuery: "",
  lastStatus: "CHT je připravené. Vyber jádro nebo přidej pokojíček.",
  storageAvailable: storageReady,
  returnToCoreAfterSlot: false,
  scan: loadScan()
};

initialize();

function initialize() {
  bindEvents();
  renderAll();
  registerServiceWorker();
}

function bindEvents() {
  document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-action]");

    if (!trigger) return;

    const action = trigger.dataset.action;

    if (action === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (action === "open-core") {
      openCore(trigger.dataset.core);
      return;
    }

    if (action === "scroll-rooms") {
      elements.roomsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (action === "open-slot") {
      openSlot(Number(trigger.dataset.index));
      return;
    }

    if (action === "close-core") {
      closeDialog(elements.coreDialog);
      return;
    }

    if (action === "close-slot") {
      closeDialog(elements.slotDialog);
      return;
    }

    if (action === "save-slot") {
      saveSlot();
      return;
    }

    if (action === "clear-slot") {
      clearSlot();
      return;
    }

    if (action === "add-room") {
      openRoomEditor(null);
      return;
    }

    if (action === "open-room") {
      openRoomEditor(trigger.dataset.roomId);
      return;
    }

    if (action === "close-room") {
      closeDialog(elements.roomDialog);
      return;
    }

    if (action === "save-room") {
      saveRoom();
      return;
    }

    if (action === "delete-room") {
      deleteRoom();
      return;
    }

    if (action === "open-info") {
      openDialog(elements.infoDialog);
      return;
    }

    if (action === "close-info") {
      closeDialog(elements.infoDialog);
      return;
    }

    if (action === "export") {
      exportData();
      return;
    }

    if (action === "import") {
      elements.importInput.click();
      return;
    }

    if (action === "backup") {
      createLocalBackup();
      return;
    }

    if (action === "scan") {
      runScan();
    }
  });

  elements.slotSearch.addEventListener("input", () => {
    state.slotQuery = elements.slotSearch.value.trim().toLocaleLowerCase("cs-CZ");
    renderSlotGrid();
  });

  elements.importInput.addEventListener("change", importData);

  elements.slotDialog.addEventListener("close", () => {
    if (!state.returnToCoreAfterSlot) return;

    state.returnToCoreAfterSlot = false;
    window.setTimeout(() => openDialog(elements.coreDialog), 0);
  });

  window.addEventListener("storage", event => {
    if (![STORAGE_KEY, ROOMS_KEY].includes(event.key)) return;

    state.memory = loadMemory();
    state.rooms = loadRooms();
    setStatus("CHT zachytilo změnu z jiného otevřeného okna.");
    renderAll();
  });
}

function createEmptySlot(index) {
  return {
    id: index + 1,
    name: `Slot ${index + 1}`,
    content: "",
    createdAt: null,
    updatedAt: null
  };
}

function createEmptyCore() {
  return Array.from({ length: SLOT_COUNT }, (_, index) => createEmptySlot(index));
}

function createEmptyMemory() {
  const now = new Date().toISOString();

  return {
    version: 3,
    createdAt: now,
    updatedAt: now,
    cores: Object.fromEntries(CORE_META.map(core => [core.id, createEmptyCore()]))
  };
}

function normaliseSlot(source, index) {
  const fallback = createEmptySlot(index);
  const value = source && typeof source === "object" ? source : {};
  const name = cleanText(value.name || value.label || fallback.name, 96) || fallback.name;
  let content = typeof value.content === "string" ? value.content : "";

  if (!content && typeof value.url === "string" && value.url.trim()) {
    content = JSON.stringify({
      url: value.url.trim(),
      app: cleanText(value.app, 96),
      icon: cleanText(value.icon, 16),
      action: cleanText(value.action, 32) || "open"
    }, null, 2);
  }

  return {
    ...value,
    id: index + 1,
    name,
    content: cleanText(content, 12_000),
    createdAt: normaliseDate(value.createdAt),
    updatedAt: normaliseDate(value.updatedAt)
  };
}

function normaliseCore(source) {
  const sourceSlots = Array.isArray(source)
    ? source
    : Array.isArray(source?.slots)
      ? source.slots
      : [];

  return Array.from({ length: SLOT_COUNT }, (_, index) => normaliseSlot(sourceSlots[index], index));
}

function normaliseMemory(source) {
  const empty = createEmptyMemory();
  const value = source && typeof source === "object" ? source : {};
  const sourceCores = value.cores && typeof value.cores === "object" ? value.cores : value;

  return {
    version: 3,
    createdAt: normaliseDate(value.createdAt) || empty.createdAt,
    updatedAt: normaliseDate(value.updatedAt) || empty.updatedAt,
    cores: Object.fromEntries(
      CORE_META.map(core => [core.id, normaliseCore(sourceCores[core.id])])
    )
  };
}

function loadMemory() {
  for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
    const parsed = readJson(key);

    if (parsed && typeof parsed === "object") {
      return normaliseMemory(parsed);
    }
  }

  return createEmptyMemory();
}

function saveMemory(reason, createSnapshot = true) {
  state.memory.updatedAt = new Date().toISOString();
  const serialized = JSON.stringify(state.memory);
  const saved = writeStorage(STORAGE_KEY, serialized);

  if (!saved) return false;

  for (const key of LEGACY_STORAGE_KEYS) {
    writeStorage(key, serialized);
  }

  if (createSnapshot) {
    saveSnapshot(reason);
  }

  window.dispatchEvent(new CustomEvent("cht.memory.changed", {
    detail: {
      reason,
      updatedAt: state.memory.updatedAt
    }
  }));

  return true;
}

function saveSnapshot(reason) {
  const existing = Array.isArray(readJson(SNAPSHOT_KEY)) ? readJson(SNAPSHOT_KEY) : [];
  const next = [
    {
      createdAt: new Date().toISOString(),
      reason,
      memory: state.memory
    },
    ...existing
  ].slice(0, 3);

  writeStorage(SNAPSHOT_KEY, JSON.stringify(next));
}

function createRoom(values = {}) {
  const now = new Date().toISOString();

  return {
    id: makeId("room"),
    glyph: cleanText(values.glyph, 16),
    name: cleanText(values.name, 96),
    note: cleanText(values.note, 6_000),
    createdAt: normaliseDate(values.createdAt) || now,
    updatedAt: normaliseDate(values.updatedAt) || now
  };
}

function normaliseRooms(source) {
  if (!Array.isArray(source)) return [];

  const seen = new Set();
  const rooms = [];

  for (const value of source) {
    if (!value || typeof value !== "object") continue;

    const room = createRoom(value);
    room.id = cleanText(value.id, 120) || room.id;

    if (seen.has(room.id)) {
      room.id = makeId("room");
    }

    seen.add(room.id);
    rooms.push(room);

    if (rooms.length >= ROOM_LIMIT) break;
  }

  return rooms.sort((left, right) => dateValue(right.updatedAt) - dateValue(left.updatedAt));
}

function loadRooms() {
  return normaliseRooms(readJson(ROOMS_KEY));
}

function saveRooms() {
  const saved = writeStorage(ROOMS_KEY, JSON.stringify(state.rooms));

  if (saved) {
    window.dispatchEvent(new CustomEvent("cht.rooms.changed", {
      detail: { updatedAt: new Date().toISOString(), count: state.rooms.length }
    }));
  }

  return saved;
}

function loadScan() {
  const scan = readJson(SCAN_KEY);
  return scan && typeof scan === "object" ? scan : null;
}

function renderAll() {
  renderMetrics();
  renderCores();
  renderRooms();
  renderCoreDialog();
  renderScan();
  elements.status.textContent = state.lastStatus;
}

function renderMetrics() {
  const used = CORE_META.reduce((total, core) => total + usedSlots(core.id), 0);
  const lastUpdated = state.memory.updatedAt;

  elements.metricMemory.textContent = `${used} / ${SLOT_COUNT * CORE_META.length}`;
  elements.metricRooms.textContent = `${state.rooms.length} / ${ROOM_LIMIT}`;
  elements.metricStorage.textContent = state.storageAvailable ? "Lokální" : "Pozor";
  elements.metricStorageNote.textContent = state.storageAvailable
    ? lastUpdated
      ? `naposledy ${formatDate(lastUpdated)}`
      : "čekám na první uložení"
    : "prohlížeč zápis odmítl";
}

function renderCores() {
  elements.coreList.innerHTML = CORE_META.map(core => {
    const used = usedSlots(core.id);

    return `
      <button class="core-card" type="button" data-action="open-core" data-core="${core.id}">
        <span class="core-icon" aria-hidden="true">${escapeHtml(core.icon)}</span>
        <small>${escapeHtml(core.number)} · JÁDRO</small>
        <strong>${escapeHtml(core.title)}</strong>
        <p>${escapeHtml(core.subtitle)}</p>
        <span class="core-count">${used} / ${SLOT_COUNT} obsazeno</span>
      </button>
    `;
  }).join("");
}

function renderRooms() {
  if (!state.rooms.length) {
    elements.roomList.innerHTML = `
      <div class="room-empty">
        <p>Zatím tu nejsou žádné dveře. První pokojíček dostane Glyph, jméno a vlastní trvalou poznámku.</p>
      </div>
    `;
    return;
  }

  elements.roomList.innerHTML = state.rooms.map(room => `
    <button class="room-card" type="button" data-action="open-room" data-room-id="${escapeAttribute(room.id)}">
      <span class="room-glyph" aria-hidden="true">${escapeHtml(room.glyph || "◌")}</span>
      <small>POKOJÍČEK</small>
      <strong>${escapeHtml(room.name || "Bezejmenný Glyph")}</strong>
      <p>${escapeHtml(room.note || "Čeká na první poznámku.")}</p>
    </button>
  `).join("");
}

function renderCoreDialog() {
  const core = coreById.get(state.activeCoreId) || CORE_META[0];
  const used = usedSlots(core.id);

  elements.coreDialogKicker.textContent = `${core.number} · JÁDRO`;
  elements.coreDialogTitle.textContent = core.title;
  elements.coreDialogSubtitle.textContent = core.subtitle;
  elements.slotSummary.textContent = `${used} z ${SLOT_COUNT} slotů je obsazeno.`;
  renderSlotGrid();
}

function renderSlotGrid() {
  const slots = state.memory.cores[state.activeCoreId] || [];
  const query = state.slotQuery;

  elements.slotGrid.innerHTML = slots.map((slot, index) => {
    const used = slotIsUsed(slot, index);
    const searchable = `${slot.name} ${slot.content}`.toLocaleLowerCase("cs-CZ");
    const filtered = Boolean(query) && !searchable.includes(query);
    const label = used ? slot.name : String(index + 1);

    return `
      <button
        class="slot-button${used ? " is-used" : ""}${filtered ? " is-filtered" : ""}"
        type="button"
        data-action="open-slot"
        data-index="${index}"
        aria-label="Otevřít slot ${index + 1}${used ? `: ${escapeAttribute(slot.name)}` : ""}"
      ><span>${escapeHtml(label)}</span></button>
    `;
  }).join("");
}

function renderScan() {
  const report = state.scan;

  if (!report) {
    elements.scanResult.textContent = "Kontrola zatím neproběhla.";
    return;
  }

  const heading = report.issues.length
    ? `Kontrola našla ${report.issues.length} věc${report.issues.length === 1 ? "" : "i"} k ručnímu ověření.`
    : "Kontrola je hotová: čtyři jádra i pokojíčky mají správný tvar.";
  const issues = report.issues.length
    ? `<ul>${report.issues.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "";

  elements.scanResult.innerHTML = `<strong>${escapeHtml(heading)}</strong><br>${escapeHtml(formatDate(report.createdAt))}${issues}`;
}

function openCore(coreId) {
  if (!coreById.has(coreId)) return;

  state.activeCoreId = coreId;
  state.slotQuery = "";
  elements.slotSearch.value = "";
  renderCoreDialog();
  openDialog(elements.coreDialog);
}

function openSlot(index) {
  const slots = state.memory.cores[state.activeCoreId] || [];

  if (!Number.isInteger(index) || !slots[index]) return;

  const core = coreById.get(state.activeCoreId);
  const slot = slots[index];
  state.activeSlotIndex = index;
  state.returnToCoreAfterSlot = dialogIsOpen(elements.coreDialog);
  elements.slotDialogKicker.textContent = `${core.number} · ${core.title.toUpperCase()}`;
  elements.slotDialogTitle.textContent = `Slot ${index + 1}`;
  elements.slotName.value = slot.name;
  elements.slotContent.value = slot.content;

  if (state.returnToCoreAfterSlot) {
    closeDialog(elements.coreDialog);
  }

  openDialog(elements.slotDialog);
  window.setTimeout(() => elements.slotName.focus(), 0);
}

function saveSlot() {
  const slots = state.memory.cores[state.activeCoreId];
  const index = state.activeSlotIndex;

  if (!slots || !slots[index]) return;

  const previous = slots[index];
  const now = new Date().toISOString();
  slots[index] = {
    ...previous,
    id: index + 1,
    name: cleanText(elements.slotName.value, 96) || `Slot ${index + 1}`,
    content: cleanText(elements.slotContent.value, 12_000),
    createdAt: previous.createdAt || now,
    updatedAt: now
  };

  if (saveMemory("uložení slotu")) {
    setStatus(`Slot ${index + 1} je uložený v jádru ${coreById.get(state.activeCoreId).title}.`);
  }

  renderAll();
  closeDialog(elements.slotDialog);
}

function clearSlot() {
  const index = state.activeSlotIndex;
  const core = coreById.get(state.activeCoreId);

  if (!window.confirm(`Vyprázdnit Slot ${index + 1} v jádru ${core.title}?`)) return;

  state.memory.cores[state.activeCoreId][index] = createEmptySlot(index);

  if (saveMemory("vyprázdnění slotu")) {
    setStatus(`Slot ${index + 1} je prázdný. Ostatní Paměť zůstala beze změny.`);
  }

  renderAll();
  closeDialog(elements.slotDialog);
}

function openRoomEditor(roomId) {
  const room = roomId ? state.rooms.find(item => item.id === roomId) : null;
  state.activeRoomId = room ? room.id : null;

  elements.roomDialogTitle.textContent = room ? "Úprava pokojíčku" : "Nový pokojíček";
  elements.roomGlyph.value = room?.glyph || "";
  elements.roomName.value = room?.name || "";
  elements.roomNote.value = room?.note || "";
  elements.deleteRoom.classList.toggle("is-hidden", !room);
  openDialog(elements.roomDialog);
  window.setTimeout(() => elements.roomGlyph.focus(), 0);
}

function saveRoom() {
  const glyph = cleanText(elements.roomGlyph.value, 16);
  const name = cleanText(elements.roomName.value, 96);

  if (!glyph) {
    setStatus("Pokojíček potřebuje alespoň jeden Glyph.");
    elements.roomGlyph.focus();
    return;
  }

  if (!name) {
    setStatus("Pokojíček potřebuje jméno, aby se neztratil.");
    elements.roomName.focus();
    return;
  }

  const note = cleanText(elements.roomNote.value, 6_000);
  const now = new Date().toISOString();
  const existingIndex = state.rooms.findIndex(room => room.id === state.activeRoomId);

  if (existingIndex >= 0) {
    const old = state.rooms[existingIndex];
    state.rooms[existingIndex] = {
      ...old,
      glyph,
      name,
      note,
      updatedAt: now
    };
    setStatus(`Pokojíček ${name} je uložený.`);
  } else {
    if (state.rooms.length >= ROOM_LIMIT) {
      setStatus(`Pokojíčky mají nyní strop ${ROOM_LIMIT}. Žádný starý pokojíček jsem nemazal.`);
      return;
    }

    state.rooms.unshift(createRoom({ glyph, name, note, createdAt: now, updatedAt: now }));
    setStatus(`Pokojíček ${name} má svůj domov.`);
  }

  state.rooms = normaliseRooms(state.rooms);
  saveRooms();
  renderAll();
  closeDialog(elements.roomDialog);
}

function deleteRoom() {
  const room = state.rooms.find(item => item.id === state.activeRoomId);

  if (!room) return;
  if (!window.confirm(`Opravdu smazat pokojíček „${room.name}“?`)) return;

  state.rooms = state.rooms.filter(item => item.id !== room.id);
  saveRooms();
  setStatus(`Pokojíček ${room.name} byl odebraný.`);
  renderAll();
  closeDialog(elements.roomDialog);
}

function exportData() {
  const payload = {
    schema: APP_SCHEMA,
    exportedAt: new Date().toISOString(),
    memory: state.memory,
    rooms: state.rooms
  };
  const filename = `cht-360-zaloha-${dateStamp()}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
  setStatus("Záloha je připravená ke stažení. Ulož ji tam, kde ji později najdeš.");
  renderAll();
}

async function importData(event) {
  const file = event.target.files?.[0];
  event.target.value = "";

  if (!file) return;
  if (file.size > MAX_IMPORT_BYTES) {
    setStatus("Tato záloha je příliš velká. Bezpečný strop je 4 MB.");
    renderAll();
    return;
  }

  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    const sourceMemory = payload?.memory || payload;

    if (!sourceMemory || typeof sourceMemory !== "object" || !sourceMemory.cores) {
      throw new Error("Neznámý tvar zálohy");
    }

    if (!window.confirm("Připojit zálohu k současné Paměti? Novější záznam zůstane zachovaný, nic se automaticky nemaže.")) {
      return;
    }

    state.memory = mergeMemory(state.memory, normaliseMemory(sourceMemory));
    state.rooms = mergeRooms(state.rooms, normaliseRooms(payload?.rooms));
    saveMemory("připojení zálohy");
    saveRooms();
    setStatus("Záloha je připojená. CHT ponechalo u stejného slotu novější záznam.");
    renderAll();
  } catch (error) {
    setStatus("Tento soubor není platná záloha CHT 360°‰.");
    renderAll();
  }
}

function mergeMemory(current, incoming) {
  const merged = normaliseMemory(current);

  for (const core of CORE_META) {
    merged.cores[core.id] = merged.cores[core.id].map((currentSlot, index) => {
      const incomingSlot = incoming.cores[core.id][index];
      return chooseNewerSlot(currentSlot, incomingSlot, index);
    });
  }

  merged.updatedAt = new Date().toISOString();
  return merged;
}

function chooseNewerSlot(current, incoming, index) {
  const currentUsed = slotIsUsed(current, index);
  const incomingUsed = slotIsUsed(incoming, index);

  if (!incomingUsed) return current;
  if (!currentUsed) return incoming;

  return dateValue(incoming.updatedAt) > dateValue(current.updatedAt) ? incoming : current;
}

function mergeRooms(current, incoming) {
  const byId = new Map(normaliseRooms(current).map(room => [room.id, room]));

  for (const room of incoming) {
    const existing = byId.get(room.id);

    if (!existing || dateValue(room.updatedAt) > dateValue(existing.updatedAt)) {
      byId.set(room.id, room);
    }
  }

  return normaliseRooms([...byId.values()]);
}

function createLocalBackup() {
  const backup = {
    schema: APP_SCHEMA,
    createdAt: new Date().toISOString(),
    memory: state.memory,
    rooms: state.rooms
  };

  if (writeStorage(BACKUP_KEY, JSON.stringify(backup))) {
    setStatus("Místní kopie je uložená. Pro jistotu si stáhni i běžnou zálohu.");
  }

  renderAll();
}

function runScan() {
  const issues = [];
  const used = CORE_META.reduce((sum, core) => sum + usedSlots(core.id), 0);

  for (const core of CORE_META) {
    const slots = state.memory.cores[core.id];

    if (!Array.isArray(slots) || slots.length !== SLOT_COUNT) {
      issues.push(`${core.title}: nečekaný počet slotů.`);
    }
  }

  for (const room of state.rooms) {
    if (!room.glyph.trim()) issues.push(`Pokojíček ${room.name || "bez jména"} nemá Glyph.`);
    if (!room.name.trim()) issues.push("Jeden pokojíček nemá jméno.");
  }

  if (state.rooms.length > ROOM_LIMIT) {
    issues.push(`Pokojíčků je více než povolených ${ROOM_LIMIT}.`);
  }

  state.scan = {
    createdAt: new Date().toISOString(),
    usedSlots: used,
    roomCount: state.rooms.length,
    issues
  };

  writeStorage(SCAN_KEY, JSON.stringify(state.scan));
  setStatus(issues.length
    ? "Kontrola je hotová. Podívej se na věci k ručnímu ověření."
    : "Chybožrout zkontroloval tvar dat. Nic neměnil.");
  renderAll();
}

function usedSlots(coreId) {
  const slots = state.memory.cores[coreId] || [];
  return slots.reduce((count, slot, index) => count + (slotIsUsed(slot, index) ? 1 : 0), 0);
}

function slotIsUsed(slot, index) {
  if (!slot || typeof slot !== "object") return false;
  const defaultName = `Slot ${index + 1}`;
  return Boolean((slot.content || "").trim() || ((slot.name || "").trim() && slot.name.trim() !== defaultName));
}

function setStatus(message) {
  state.lastStatus = message;
  elements.status.textContent = message;
}

function openDialog(dialog) {
  if (!dialog || dialogIsOpen(dialog)) return;

  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

function closeDialog(dialog) {
  if (!dialog || !dialogIsOpen(dialog)) return;

  if (typeof dialog.close === "function") {
    dialog.close();
  } else {
    dialog.removeAttribute("open");
  }
}

function dialogIsOpen(dialog) {
  return Boolean(dialog?.open || dialog?.hasAttribute("open"));
}

function registerServiceWorker() {
  const canRegister = "serviceWorker" in navigator && ["https:", "http:"].includes(window.location.protocol);

  if (!canRegister) return;

  navigator.serviceWorker.register("./sw.js").catch(() => {
    /* Offline režim je doplněk; samotná Paměť dál funguje. */
  });
}

function readJson(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    storageReady = false;
    return null;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
    storageReady = true;
    state.storageAvailable = true;
    return true;
  } catch (error) {
    storageReady = false;
    state.storageAvailable = false;
    setStatus("Prohlížeč teď nedovolil zápis do místního úložiště.");
    return false;
  }
}

function cleanText(value, maxLength) {
  return String(value ?? "").replace(/\u0000/g, "").trim().slice(0, maxLength);
}

function normaliseDate(value) {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function dateValue(value) {
  const date = new Date(value || 0);
  const time = date.getTime();
  return Number.isFinite(time) ? time : 0;
}

function formatDate(value) {
  const time = dateValue(value);
  if (!time) return "bez data";

  return new Intl.DateTimeFormat("cs-CZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(time));
}

function dateStamp() {
  const date = new Date();
  const part = value => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}`;
}

function makeId(prefix) {
  if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
