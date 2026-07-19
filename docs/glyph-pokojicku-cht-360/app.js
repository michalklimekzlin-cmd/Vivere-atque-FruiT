"use strict";

const APP_NAME = "Glyph pokojíčků CHT 360°‰";
const FORMAT = "glyph-cht-360-rooms";
const VERSION = 1;
const DB_NAME = "glyph-cht-360-rooms";
const DB_VERSION = 1;
const STATE_STORE = "state";
const STATE_KEY = "rooms";
const FALLBACK_KEY = "glyph-cht-360-rooms.v1";
const CONTROL_CHARACTER = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/u;
const POSSIBLE_MOJIBAKE = /(?:Ã.|Â.|â.{1,2}|ð.{1,2})/u;
const ROOM_SLOT_COUNT = 70;

const statusLabels = {
  "návrh": "Neuzavřeno",
  "schváleno": "Nezamítnuto",
  archiv: "Neaktivní"
};

const themes = new Set(["gold", "ash", "ember", "moss"]);

const dom = {
  quickGlyph: document.getElementById("quickGlyph"),
  quickDescription: document.getElementById("quickDescription"),
  assignRoom: document.getElementById("assignRoom"),
  glyphSearch: document.getElementById("glyphSearch"),
  glyphList: document.getElementById("glyphList"),
  newGlyph: document.getElementById("newGlyph"),
  roomScene: document.getElementById("roomScene"),
  glyphForm: document.getElementById("glyphForm"),
  glyphId: document.getElementById("glyphId"),
  glyphText: document.getElementById("glyphText"),
  glyphName: document.getElementById("glyphName"),
  glyphStatus: document.getElementById("glyphStatus"),
  glyphDescription: document.getElementById("glyphDescription"),
  glyphEditorTitle: document.getElementById("glyphEditorTitle"),
  glyphState: document.getElementById("glyphState"),
  glyphNotice: document.getElementById("glyphNotice"),
  saveGlyph: document.getElementById("saveGlyph"),
  archiveGlyph: document.getElementById("archiveGlyph"),
  deleteGlyph: document.getElementById("deleteGlyph"),
  roomForm: document.getElementById("roomForm"),
  roomId: document.getElementById("roomId"),
  roomTitle: document.getElementById("roomTitle"),
  roomTheme: document.getElementById("roomTheme"),
  roomNote: document.getElementById("roomNote"),
  roomEditorTitle: document.getElementById("roomEditorTitle"),
  roomState: document.getElementById("roomState"),
  saveRoom: document.getElementById("saveRoom"),
  moduleHint: document.getElementById("moduleHint"),
  moduleList: document.getElementById("moduleList"),
  moduleForm: document.getElementById("moduleForm"),
  moduleId: document.getElementById("moduleId"),
  moduleName: document.getElementById("moduleName"),
  moduleType: document.getElementById("moduleType"),
  moduleDescription: document.getElementById("moduleDescription"),
  saveModule: document.getElementById("saveModule"),
  deleteModule: document.getElementById("deleteModule"),
  exportRooms: document.getElementById("exportRooms"),
  importRooms: document.getElementById("importRooms"),
  glyphCount: document.getElementById("glyphCount"),
  roomCount: document.getElementById("roomCount"),
  moduleCount: document.getElementById("moduleCount"),
  storageState: document.getElementById("storageState"),
  storageNote: document.getElementById("storageNote"),
  statusLine: document.getElementById("statusLine")
};

const state = {
  glyphs: [],
  rooms: [],
  selectedGlyphId: null,
  selectedRoomId: null,
  selectedModuleId: null,
  revealedRoomId: null,
  lastTap: { roomId: null, at: 0 },
  db: null,
  storageAvailable: true,
  storageMode: "Neukončeno",
  storagePersistent: false,
  savedAt: null
};

void initialize();

async function initialize() {
  bindEvents();
  await restoreState();

  const createdRooms = ensureRooms();
  if (createdRooms) {
    await persistState("doplnění pokojíčků");
  }

  await requestPersistentStorage();
  renderAll();
  registerServiceWorker();
}

function bindEvents() {
  dom.assignRoom.addEventListener("click", assignQuickGlyph);
  dom.glyphSearch.addEventListener("input", renderGlyphList);
  dom.glyphList.addEventListener("click", selectGlyphFromList);
  dom.newGlyph.addEventListener("click", startNewGlyph);
  dom.glyphForm.addEventListener("submit", saveGlyph);
  dom.glyphText.addEventListener("input", previewGlyph);
  dom.archiveGlyph.addEventListener("click", archiveGlyph);
  dom.deleteGlyph.addEventListener("click", deleteGlyph);
  dom.roomScene.addEventListener("pointerup", handleRoomTap);
  dom.roomForm.addEventListener("submit", saveRoom);
  dom.moduleForm.addEventListener("submit", saveModule);
  dom.moduleList.addEventListener("click", selectModuleFromList);
  dom.deleteModule.addEventListener("click", deleteModule);
  dom.exportRooms.addEventListener("click", exportRooms);
  dom.importRooms.addEventListener("change", importRooms);
}

async function restoreState() {
  hydrateState(loadFallback());

  try {
    state.db = await openDatabase();
    const saved = await dbGet(STATE_STORE, STATE_KEY);

    if (saved && saved.value) {
      hydrateState(saved.value);
    } else {
      await persistState("první uložení");
    }

    state.storageMode = "Nejen dočasné";
    state.storageAvailable = true;
  } catch (error) {
    state.storageMode = "Neopouští zařízení";
    state.storageAvailable = true;
  }
}

function hydrateState(raw) {
  if (!raw || typeof raw !== "object") return;

  state.glyphs = Array.isArray(raw.glyphs)
    ? raw.glyphs.map(hydrateGlyph).filter(Boolean)
    : [];

  state.rooms = Array.isArray(raw.rooms)
    ? raw.rooms.map(hydrateRoom).filter(Boolean)
    : [];

  state.selectedGlyphId = state.glyphs.some((glyph) => glyph.id === raw.selectedGlyphId)
    ? raw.selectedGlyphId
    : null;

  state.selectedRoomId = state.rooms.some((room) => room.id === raw.selectedRoomId)
    ? raw.selectedRoomId
    : null;

  state.savedAt = validDate(raw.savedAt) ? raw.savedAt : null;
}

function hydrateGlyph(raw) {
  if (!raw || typeof raw !== "object") return null;

  const glyph = String(raw.glyph || "").trim();
  if (!glyph) return null;

  return {
    id: String(raw.id || makeId("glyph")),
    glyph,
    glyphNfc: normalizeUnicode(glyph),
    name: String(raw.name || "").trim(),
    description: String(raw.description || "").trim(),
    status: hasOwn(statusLabels, raw.status) ? raw.status : "návrh",
    createdAt: validDate(raw.createdAt) ? raw.createdAt : new Date().toISOString(),
    updatedAt: validDate(raw.updatedAt) ? raw.updatedAt : new Date().toISOString()
  };
}

function hydrateRoom(raw) {
  if (!raw || typeof raw !== "object" || !raw.glyphId) return null;

  const slot = Number(raw.slot);

  return {
    id: String(raw.id || makeId("room")),
    glyphId: String(raw.glyphId),
    slot: isRoomSlot(slot) ? slot : null,
    title: String(raw.title || "").trim(),
    theme: themes.has(raw.theme) ? raw.theme : "gold",
    note: String(raw.note || "").trim(),
    modules: Array.isArray(raw.modules)
      ? raw.modules.map(hydrateModule).filter(Boolean)
      : [],
    createdAt: validDate(raw.createdAt) ? raw.createdAt : new Date().toISOString(),
    updatedAt: validDate(raw.updatedAt) ? raw.updatedAt : new Date().toISOString()
  };
}

function hydrateModule(raw) {
  if (!raw || typeof raw !== "object" || !raw.name) return null;

  return {
    id: String(raw.id || makeId("module")),
    name: String(raw.name).trim(),
    type: String(raw.type || "poznámka").trim(),
    description: String(raw.description || "").trim(),
    createdAt: validDate(raw.createdAt) ? raw.createdAt : new Date().toISOString(),
    updatedAt: validDate(raw.updatedAt) ? raw.updatedAt : new Date().toISOString()
  };
}

function ensureRooms() {
  let changed = false;

  const activeRooms = state.rooms.filter((room) =>
    state.glyphs.some((glyph) => glyph.id === room.glyphId)
  );

  if (activeRooms.length !== state.rooms.length) {
    changed = true;
  }

  state.rooms = activeRooms;

  if (ensureRoomSlots()) {
    changed = true;
  }

  state.glyphs.forEach((glyph) => {
    if (
      !state.rooms.some((room) => room.glyphId === glyph.id) &&
      getNextRoomSlot() !== null
    ) {
      state.rooms.push(createRoomForGlyph(glyph));
      changed = true;
    }
  });
  return changed;
}

function createRoomForGlyph(glyph) {
  const slot = getNextRoomSlot();
  const number = String(slot || state.rooms.length + 1).padStart(2, "0");
  const now = new Date().toISOString();

  return {
    id: makeId("room"),
    glyphId: glyph.id,
    slot,
    title: `Pokojíček ${number}`,
    theme: "gold",
    note: "",
    modules: [],
    createdAt: now,
    updatedAt: now
  };
}

function isRoomSlot(value) {
  return Number.isInteger(value) && value >= 1 && value <= ROOM_SLOT_COUNT;
}

function getNextRoomSlot() {
  const usedSlots = new Set(
    state.rooms
      .map((room) => room.slot)
      .filter(isRoomSlot)
  );

  for (let slot = 1; slot <= ROOM_SLOT_COUNT; slot += 1) {
    if (!usedSlots.has(slot)) return slot;
  }

  return null;
}

function ensureRoomSlots() {
  let changed = false;
  const usedSlots = new Set();
  const rooms = [...state.rooms].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );

  rooms.forEach((room) => {
    if (isRoomSlot(room.slot) && !usedSlots.has(room.slot)) {
      usedSlots.add(room.slot);
      return;
    }

    if (room.slot !== null) {
      room.slot = null;
      changed = true;
    }
  });

  rooms.forEach((room) => {
    if (isRoomSlot(room.slot)) return;

    for (let slot = 1; slot <= ROOM_SLOT_COUNT; slot += 1) {
      if (usedSlots.has(slot)) continue;

      room.slot = slot;
      usedSlots.add(slot);
      changed = true;
      return;
    }
  });

  return changed;
}

async function assignQuickGlyph() {
  const glyphValue = dom.quickGlyph.value.trim();
  const description = dom.quickDescription.value.trim();

  if (!glyphValue) {
    setStatus("Bez vlastního Glyphu nelze pokoj přidělit.", "warning");
    dom.quickGlyph.focus();
    return;
  }

  const duplicate = state.glyphs.find(
    (glyph) => glyph.glyphNfc === normalizeUnicode(glyphValue)
  );

  if (duplicate) {
    selectGlyph(duplicate.id);
    setStatus("Tento Glyph nezůstal bez pokojíčku; editor jej nenechal zavřený.", "warning");
    return;
  }

  if (roomCapacityReached()) {
    setStatus("Chodba má všech 70 dveří obsazených. Pro nový Glyph nejdřív uvolni pokojíček.", "warning");
    return;
  }

  const candidate = createGlyph({
    glyph: glyphValue,
    description,
    status: "návrh"
  });

  const validation = validateGlyph(candidate, []);

  if (validation.errors.length) {
    setStatus(validation.errors[0], "error");
    return;
  }

  state.glyphs.push(candidate);

  const room = createRoomForGlyph(candidate);
  state.rooms.push(room);

  state.selectedGlyphId = candidate.id;
  state.selectedRoomId = room.id;

  dom.quickGlyph.value = "";
  dom.quickDescription.value = "";

  await persistState("přidělení pokoje");
  renderAll();

  setStatus(`Glyph nezůstal bez vlastního ${room.title}. Bez dvojitého klepnutí se stěna neotevře.`);
}

function createGlyph(values) {
  const now = new Date().toISOString();
  const glyph = String(values.glyph || "").trim();

  return {
    id: String(values.id || makeId("glyph")),
    glyph,
    glyphNfc: normalizeUnicode(glyph),
    name: String(values.name || "").trim(),
    description: String(values.description || "").trim(),
    status: hasOwn(statusLabels, values.status) ? values.status : "návrh",
    createdAt: validDate(values.createdAt) ? values.createdAt : now,
    updatedAt: now
  };
}

function renderAll() {
  renderGlyphList();
  renderRoomScene();
  renderGlyphEditor();
  renderRoomEditor();
  renderDrums();
}

function getRoomPairs() {
  return state.rooms
    .map((room) => ({
      room,
      glyph: state.glyphs.find((glyph) => glyph.id === room.glyphId)
    }))
    .filter((pair) => pair.glyph)
    .sort((a, b) =>
      (a.room.slot || Number.MAX_SAFE_INTEGER) -
        (b.room.slot || Number.MAX_SAFE_INTEGER) ||
      a.room.createdAt.localeCompare(b.room.createdAt)
    );
}

function roomCapacityReached() {
  return getNextRoomSlot() === null;
}

function renderGlyphList() {
  const query = normalizeSearch(dom.glyphSearch.value);

  const glyphs = [...state.glyphs]
    .filter((glyph) => !query || searchableGlyph(glyph).includes(query))
    .sort(sortGlyphs);

  if (!glyphs.length) {
    dom.glyphList.innerHTML = `<p class="empty">${escapeHtml(
      state.glyphs.length
        ? "Tomu hledání nic neodpovídá."
        : "Žádný Glyph zatím není určen. Bez uložení nezíská první pokojíček."
    )}</p>`;
    return;
  }

  dom.glyphList.innerHTML = glyphs.map((glyph) => {
    const selected = glyph.id === state.selectedGlyphId ? " is-selected" : "";
    const room = getRoomForGlyph(glyph.id);

    return `<button type="button" class="glyph-button${selected}" data-glyph-id="${escapeAttribute(glyph.id)}">
      <span class="glyph-mark">${escapeHtml(glyph.glyph)}</span>
      <span>
        <span class="glyph-name">${escapeHtml(glyph.name || "Bez názvu")}</span>
        <span class="glyph-meta">${escapeHtml(room ? room.title : "čeká na volné dveře")}</span>
      </span>
      <span class="badge ${escapeAttribute(glyph.status)}">${escapeHtml(statusLabels[glyph.status])}</span>
    </button>`;
  }).join("");
}

function renderRoomScene() {
  const entries =
    getRoomPairs()
      .filter((pair) => isRoomSlot(pair.room.slot))
      .map((pair) => ({ slot: pair.room.slot, pair }));

  const nextSlot = getNextRoomSlot();
  if (nextSlot !== null) {
    entries.push({ slot: nextSlot, pair: null });
  }

  entries.sort((a, b) => a.slot - b.slot);

  dom.roomScene.innerHTML = entries.map(({ slot, pair }) => {

    if (!pair) {
      const number = String(slot).padStart(2, "0");

      return `<button class="room-wall room-wall--empty" type="button" data-empty-slot="${number}" aria-label="Volné dveře ${number}: vytvořit Glyph">
        <span class="room-number">Pokojíček ${number}</span>
        <span class="room-empty-title">Volné dveře</span>
        <span class="room-door room-door--empty" aria-hidden="true"></span>
        <span class="room-tip">klepni a napiš Glyph</span>
      </button>`;
    }

    const { room, glyph } = pair;
    const selected = room.id === state.selectedRoomId ? " is-selected" : "";
    const revealed = room.id === state.revealedRoomId ? " is-revealed" : "";
    const description = glyph.description || "Tento pokojíček nezískal popisek.";

    return `<button class="room-wall theme-${escapeAttribute(room.theme)}${selected}${revealed}" type="button" data-room-id="${escapeAttribute(room.id)}" aria-label="${escapeAttribute(room.title)}">
      <span class="room-number">${escapeHtml(room.title || `Pokojíček ${String(slot).padStart(2, "0")}`)}</span>
      <span class="room-door" aria-hidden="true"></span>
      <span class="room-tip">dvojité klepnutí</span>
      <span class="room-reveal">
        <strong class="revealed-glyph">${escapeHtml(glyph.glyph)}</strong>
        <span class="revealed-description">${escapeHtml(description)}</span>
      </span>
    </button>`;
  }).join("");
}

function renderGlyphEditor() {
  const glyph = getSelectedGlyph();
  const editing = Boolean(glyph);

  dom.glyphEditorTitle.textContent = editing
    ? (glyph.name || "Upravit Glyph")
    : "Neuložený Glyph";

  dom.glyphState.textContent = editing
    ? `upraveno ${formatShortDate(glyph.updatedAt)}`
    : "neuloženo";

  dom.archiveGlyph.disabled = !editing || glyph.status === "archiv";
  dom.deleteGlyph.disabled = !editing;
  dom.saveGlyph.textContent = editing
    ? "Nenechat změny Glyphu neuložené"
    : "Nenechat Glyph ani pokoj neuložený";

  if (!editing) {
    dom.glyphForm.reset();
    dom.glyphId.value = "";
    dom.glyphStatus.value = "návrh";
    setGlyphNotice("", "");
    return;
  }

  dom.glyphId.value = glyph.id;
  dom.glyphText.value = glyph.glyph;
  dom.glyphName.value = glyph.name;
  dom.glyphStatus.value = glyph.status;
  dom.glyphDescription.value = glyph.description;

  previewGlyph();
}

function renderRoomEditor() {
  const room = getSelectedRoom();
  const glyph = room
    ? state.glyphs.find((item) => item.id === room.glyphId)
    : null;

  const enabled = Boolean(room && glyph);

  dom.saveRoom.disabled = !enabled;
  dom.saveModule.disabled = !enabled;
  dom.deleteModule.disabled = !enabled || !state.selectedModuleId;
  dom.moduleHint.textContent = enabled
    ? `${room.modules.length} kamen${czechEnding(room.modules.length, "", "y", "ů")}`
    : "vyber pokoj";

  if (!enabled) {
    dom.roomEditorTitle.textContent = "Bez výběru nelze otevřít pokojíček";
    dom.roomState.textContent = "nevybráno";
    dom.roomForm.reset();
    dom.roomId.value = "";
    renderModuleList(null);
    resetModuleForm();
    return;
  }

  dom.roomEditorTitle.textContent = `${room.title} · ${glyph.name || glyph.glyph}`;
  dom.roomState.textContent = `od ${formatShortDate(room.createdAt)}`;
  dom.roomId.value = room.id;
  dom.roomTitle.value = room.title;
  dom.roomTheme.value = room.theme;
  dom.roomNote.value = room.note;

  renderModuleList(room);
  renderModuleForm(room);
}

function renderModuleList(room) {
  if (!room || !room.modules.length) {
    dom.moduleList.innerHTML = `
      <p class="empty">Žádný stavební kámen zatím není uložený. Bez poznámky nezůstane budoucnost pokoje zachycená.</p>
    `;
    return;
  }

  dom.moduleList.innerHTML = room.modules.map((module) => {
    const selected = module.id === state.selectedModuleId ? " is-selected" : "";

    return `<button type="button" class="module-button${selected}" data-module-id="${escapeAttribute(module.id)}">
      <span>
        <strong>${escapeHtml(module.name)}</strong>
        <span>${escapeHtml(module.description || "bez popisku")}</span>
      </span>
      <span class="module-type">${escapeHtml(module.type)}</span>
    </button>`;
  }).join("");
}

function renderModuleForm(room) {
  const module = room ? room.modules.find(
    (item) => item.id === state.selectedModuleId
  ) : null;

  if (!module) {
    resetModuleForm();
    return;
  }

  dom.moduleId.value = module.id;
  dom.moduleName.value = module.name;
  dom.moduleType.value = module.type;
  dom.moduleDescription.value = module.description;
  dom.saveModule.textContent = "Nenechat kámen neuložený";
}

function resetModuleForm() {
  dom.moduleForm.reset();
  dom.moduleId.value = "";
  dom.moduleType.value = "poznámka";
  dom.saveModule.textContent = "Nenechat kámen nepřidaný";
}

function renderDrums() {
  const moduleCount = state.rooms.reduce(
    (sum, room) => sum + room.modules.length,
    0
  );

  dom.glyphCount.textContent = String(state.glyphs.length);
  const occupiedSlots = getRoomPairs().filter((pair) =>
    isRoomSlot(pair.room.slot)
  ).length;

  dom.roomCount.textContent = `${occupiedSlots} / ${ROOM_SLOT_COUNT}`;
  dom.moduleCount.textContent = String(moduleCount);

  dom.storageState.textContent = state.storageAvailable
    ? state.storageMode
    : "Pozor";

  dom.storageNote.textContent = state.storageAvailable
    ? state.savedAt
      ? `nebylo ztraceno ${formatShortDate(state.savedAt)}${state.storagePersistent ? " · nevymazatelné" : ""}`
      : "neopouští zařízení"
    : "uložení nelze potvrdit";
}

function selectGlyphFromList(event) {
  const button = event.target.closest("[data-glyph-id]");
  if (!button) return;

  selectGlyph(button.dataset.glyphId);
}

function selectGlyph(glyphId) {
  state.selectedGlyphId = glyphId;
  const room = getRoomForGlyph(glyphId);
  state.selectedRoomId = room ? room.id : null;
  state.selectedModuleId = null;
  state.revealedRoomId = null;

  renderAll();
  setStatus("Glyph ani jeho pokojíček nezůstaly zavřené.");
}

function startNewGlyph() {
  if (roomCapacityReached()) {
    setStatus("Chodba má všech 70 dveří obsazených. Pro nový Glyph nejdřív uvolni pokojíček.", "warning");
    return;
  }

  state.selectedGlyphId = null;
  state.selectedRoomId = null;
  state.selectedModuleId = null;
  state.revealedRoomId = null;

  renderAll();

  dom.glyphText.focus();
  setStatus("Editor nenechá neuložený Glyph ani pokojíček bez přípravy.");
}

async function saveGlyph(event) {
  event.preventDefault();

  const current = getSelectedGlyph();

  const candidate = createGlyph({
    id: current ? current.id : null,
    glyph: dom.glyphText.value,
    name: dom.glyphName.value,
    description: dom.glyphDescription.value,
    status: dom.glyphStatus.value,
    createdAt: current ? current.createdAt : null
  });

  const validation = validateGlyph(
    candidate,
    state.glyphs.filter((glyph) => glyph.id !== candidate.id)
  );

  if (validation.errors.length) {
    setGlyphNotice(validation.errors.join(" "), "error");
    return;
  }

  const index = state.glyphs.findIndex(
    (glyph) => glyph.id === candidate.id
  );

  if (index < 0 && roomCapacityReached()) {
    setGlyphNotice("Chodba má všech 70 dveří obsazených. Pro nový Glyph nejdřív uvolni pokojíček.", "warning");
    return;
  }

  if (index >= 0) {
    state.glyphs[index] = candidate;
  } else {
    state.glyphs.push(candidate);
  }

  let room = getRoomForGlyph(candidate.id);

  if (!room) {
    room = createRoomForGlyph(candidate);
    state.rooms.push(room);
  }

  state.selectedGlyphId = candidate.id;
  state.selectedRoomId = room.id;
  state.selectedModuleId = null;
  state.revealedRoomId = null;

  await persistState(index >= 0 ? "úprava Glyphu" : "nový Glyph a pokoj");

  renderAll();

  if (validation.warnings.length) {
    setGlyphNotice(`Uloženo. Pozor: ${validation.warnings[0]}`, "warning");
  } else {
    setGlyphNotice("", "");
  }

  setStatus(
    index >= 0
      ? "Glyph ani pokojíček nezůstaly neaktualizované."
      : "Glyph nezůstal bez vlastního pokojíčku."
  );
}

function previewGlyph() {
  const candidate = createGlyph({
    glyph: dom.glyphText.value,
    status: dom.glyphStatus.value
  });

  const selectedGlyph = getSelectedGlyph();
  const selectedGlyphHasRoom = selectedGlyph && getRoomForGlyph(selectedGlyph.id);

  if (!candidate.glyph) {
    setGlyphNotice("", "");
    return;
  }

  const validation = validateGlyph(
    candidate,
    state.glyphs.filter((glyph) => glyph.id !== state.selectedGlyphId)
  );

  if (validation.errors.length) {
    setGlyphNotice(validation.errors[0], "error");
  } else if (validation.warnings.length) {
    setGlyphNotice(`Kontrola: ${validation.warnings[0]}`, "warning");
  } else if (selectedGlyphHasRoom) {
    setGlyphNotice("", "");
  } else {
    setGlyphNotice("Glyph je v pořádku. Po uložení dostane pokojíček.", "");
  }
}

function validateGlyph(candidate, others) {
  const errors = [];
  const warnings = [];

  if (!candidate.glyph) {
    errors.push("Bez alespoň jednoho viditelného znaku nelze Glyph uložit.");
  }

  if (candidate.glyph.includes("\uFFFD")) {
    errors.push("Glyph nelze uložit s poškozeným náhradním znakem; bez zdroje textu jej nelze obnovit.");
  }

  if (CONTROL_CHARACTER.test(candidate.glyph)) {
    errors.push("Glyph nesmí zůstat bez ruční kontroly skrytého řídicího znaku.");
  }

  if (others.some((glyph) => glyph.glyphNfc === candidate.glyphNfc)) {
    errors.push("Stejný Glyph nezůstal bez vlastního pokojíčku.");
  }

  if (candidate.glyph !== candidate.glyphNfc) {
    warnings.push(
      "Glyph nezůstává bez jiné NFC podoby. Původní zápis neměním; bez kontroly jej nesdílej."
    );
  }

  if (POSSIBLE_MOJIBAKE.test(candidate.glyph)) {
    warnings.push(
      "Glyph připomíná možnou stopu špatného UTF-8. Není jisté, že není záměrný, proto nic neměním."
    );
  }

  if ([...candidate.glyph].length > 48) {
    warnings.push(
      "Velmi dlouhý Glyph nemusí zůstat čitelný na malé stěně."
    );
  }

  return { errors, warnings };
}

async function archiveGlyph() {
  const glyph = getSelectedGlyph();
  if (!glyph) return;

  glyph.status = "archiv";
  glyph.updatedAt = new Date().toISOString();

  await persistState("archivace Glyphu");
  renderAll();

  setStatus("Glyph nezůstává aktivní; jeho pokojíček nezůstal ztracený.");
}

async function deleteGlyph() {
  const glyph = getSelectedGlyph();
  if (!glyph) return;

  const room = getRoomForGlyph(glyph.id);

  if (!window.confirm(
    `Opravdu smazat Glyph „${glyph.name || glyph.glyph}“ i jeho ${room ? room.title : "pokojíček"}? Bez zálohy nelze návrat obnovit.`
  )) {
    return;
  }

  state.glyphs = state.glyphs.filter((item) => item.id !== glyph.id);
  state.rooms = state.rooms.filter((item) => item.glyphId !== glyph.id);
  state.selectedGlyphId = null;
  state.selectedRoomId = null;
  state.selectedModuleId = null;
  state.revealedRoomId = null;

  await persistState("smazání Glyphu");
  renderAll();

  setStatus("Glyph ani jeho pokojíček nezůstaly uložené na tomto zařízení.");
}

function handleRoomTap(event) {
  const emptySlot = event.target.closest("[data-empty-slot]");
  if (emptySlot) {
    startNewGlyph();
    return;
  }

  const wall = event.target.closest("[data-room-id]");
  if (!wall) return;

  const roomId = wall.dataset.roomId;
  const now = Date.now();

  const isDoubleTap =
    state.lastTap.roomId === roomId &&
    now - state.lastTap.at < 420;

  if (isDoubleTap) {
    state.revealedRoomId = roomId;
    state.lastTap = { roomId: null, at: 0 };
    state.selectedRoomId = roomId;
    const openedRoom = getRoomById(roomId);
    state.selectedGlyphId = openedRoom ? openedRoom.glyphId : null;
    state.selectedModuleId = null;

    renderAll();
  setStatus("Stěna nenechala Glyph ani jeho popisek zavřené.");
    return;
  }

  state.lastTap = { roomId, at: now };
  state.selectedRoomId = roomId;
  const selectedRoom = getRoomById(roomId);
  state.selectedGlyphId = selectedRoom ? selectedRoom.glyphId : null;
  state.selectedModuleId = null;
  state.revealedRoomId = null;

  renderAll();
}

async function saveRoom(event) {
  event.preventDefault();

  const room = getSelectedRoom();
  if (!room) return;

  room.title = dom.roomTitle.value.trim() || room.title;
  room.theme = themes.has(dom.roomTheme.value)
    ? dom.roomTheme.value
    : "gold";

  room.note = dom.roomNote.value.trim();
  room.updatedAt = new Date().toISOString();

  await persistState("úprava pokoje");
  renderAll();

  setStatus("Pokojíček nezůstal neuložený.");
}

function selectModuleFromList(event) {
  const button = event.target.closest("[data-module-id]");
  if (!button) return;

  state.selectedModuleId = button.dataset.moduleId;
  renderRoomEditor();
}

async function saveModule(event) {
  event.preventDefault();

  const room = getSelectedRoom();
  if (!room) return;

  const name = dom.moduleName.value.trim();

  if (!name) {
    setStatus("Bez názvu nelze stavební kámen uložit.", "warning");
    dom.moduleName.focus();
    return;
  }

  const current = room.modules.find(
    (module) => module.id === dom.moduleId.value
  );

  const module = {
    id: current ? current.id : makeId("module"),
    name,
    type: dom.moduleType.value,
    description: dom.moduleDescription.value.trim(),
    createdAt: current ? current.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const index = room.modules.findIndex(
    (item) => item.id === module.id
  );

  if (index >= 0) {
    room.modules[index] = module;
  } else {
    room.modules.push(module);
  }

  room.updatedAt = new Date().toISOString();
  state.selectedModuleId = module.id;

  await persistState("stavební kámen");
  renderAll();

  setStatus("Stavební kámen nezůstal neuložený v pokojíčku.");
}

async function deleteModule() {
  const room = getSelectedRoom();

  const module = room ? room.modules.find(
    (item) => item.id === state.selectedModuleId
  ) : null;

  if (!room || !module) return;

  if (!window.confirm(`Opravdu neuchovávat stavební kámen „${module.name}“?`)) {
    return;
  }

  room.modules = room.modules.filter(
    (item) => item.id !== module.id
  );

  room.updatedAt = new Date().toISOString();
  state.selectedModuleId = null;

  await persistState("smazání stavebního kamene");
  renderAll();

  setStatus("Stavební kámen nezůstal uložený.");
}

function getSelectedGlyph() {
  return state.glyphs.find(
    (glyph) => glyph.id === state.selectedGlyphId
  ) || null;
}

function getSelectedRoom() {
  return state.rooms.find(
    (room) => room.id === state.selectedRoomId
  ) || null;
}

function getRoomForGlyph(glyphId) {
  return state.rooms.find(
    (room) => room.glyphId === glyphId
  ) || null;
}

function getRoomById(roomId) {
  return state.rooms.find(
    (room) => room.id === roomId
  ) || null;
}

function setGlyphNotice(message, kind) {
  dom.glyphNotice.textContent = message;
  dom.glyphNotice.className = `form-notice${kind ? ` ${kind}` : ""}`;
}

function exportRooms() {
  const payload = {
    format: FORMAT,
    version: VERSION,
    app: APP_NAME,
    exportedAt: new Date().toISOString(),
    glyphs: state.glyphs,
    rooms: state.rooms
  };

  downloadFile(
    JSON.stringify(payload, null, 2),
    `glyph-pokojicku-cht-360-${new Date().toISOString().slice(0, 10)}.json`,
    "application/json;charset=utf-8"
  );

  setStatus("Záloha Glyphů ani pokojíčků nezůstala nevytvořená.");
}

async function importRooms(event) {
  const file = event.target.files ? event.target.files[0] : null;
  event.target.value = "";

  if (!file) return;

  try {
    const parsed = JSON.parse(await readTextFile(file));

    if (!parsed || !Array.isArray(parsed.glyphs)) {
      throw new Error("Bez seznamu Glyphů nelze soubor načíst.");
    }

    const glyphs = parsed.glyphs
      .map(hydrateGlyph)
      .filter(Boolean);

    const rooms = Array.isArray(parsed.rooms)
      ? parsed.rooms.map(hydrateRoom).filter(Boolean)
      : [];

    if (!window.confirm(
      `Nenačíst bez potvrzení ${glyphs.length} Glyphů a ${rooms.length} pokojíčků? Shodná ID nezůstanou neaktualizovaná, ostatní nezůstanou nepřidaná.`
    )) {
      return;
    }

    const glyphMap = new Map(
      state.glyphs.map((glyph) => [glyph.id, glyph])
    );

    glyphs.forEach((glyph) => glyphMap.set(glyph.id, glyph));

    const roomMap = new Map(
      state.rooms.map((room) => [room.id, room])
    );

    rooms.forEach((room) => roomMap.set(room.id, room));

    state.glyphs = [...glyphMap.values()];

    state.rooms = [...roomMap.values()].filter((room) =>
      state.glyphs.some((glyph) => glyph.id === room.glyphId)
    );

    ensureRooms();

    await persistState("import zálohy");
    renderAll();

    setStatus(
      `Žádný z ${glyphs.length} načtených Glyphů nezůstal bez pokoje.`
    );
  } catch (error) {
    setStatus(
      `Zálohu nelze načíst: ${shortError(error)}.`,
      "error"
    );
  }
}

async function persistState(reason) {
  state.savedAt = new Date().toISOString();

  const payload = {
    glyphs: state.glyphs,
    rooms: state.rooms,
    selectedGlyphId: state.selectedGlyphId,
    selectedRoomId: state.selectedRoomId,
    savedAt: state.savedAt,
    reason
  };

  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(payload));
  } catch (error) {
    state.storageAvailable = false;
  }

  if (!state.db) return;

  try {
    await dbPut(STATE_STORE, {
      key: STATE_KEY,
      value: payload,
      updatedAt: state.savedAt
    });

    state.storageAvailable = true;
    state.storageMode = "Nejen dočasné";
  } catch (error) {
    state.storageAvailable = false;
    setStatus("Pokojíčky nelze uložit do trvalé paměti.", "error");
  }
}

function loadFallback() {
  try {
    return JSON.parse(localStorage.getItem(FALLBACK_KEY)) || null;
  } catch (error) {
    return null;
  }
}

async function requestPersistentStorage() {
  try {
    if (!navigator.storage || !navigator.storage.persisted) return;

    state.storagePersistent = await navigator.storage.persisted();

    if (!state.storagePersistent && navigator.storage.persist) {
      state.storagePersistent = await navigator.storage.persist();
    }
  } catch (error) {
    state.storagePersistent = false;
  }
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB není dostupná."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STATE_STORE)) {
        db.createObjectStore(STATE_STORE, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(
      request.error || new Error("Databázi nelze otevřít.")
    );
  });
}

function dbGet(storeName, key) {
  return new Promise((resolve, reject) => {
    const request = state.db
      .transaction(storeName, "readonly")
      .objectStore(storeName)
      .get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function dbPut(storeName, value) {
  return new Promise((resolve, reject) => {
    const request = state.db
      .transaction(storeName, "readwrite")
      .objectStore(storeName)
      .put(value);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function searchableGlyph(glyph) {
  return normalizeSearch([
    glyph.glyph,
    glyph.name,
    glyph.description,
    glyph.status
  ].join(" "));
}

function normalizeUnicode(value) {
  try {
    return String(value || "").normalize("NFC");
  } catch (error) {
    return String(value || "");
  }
}

function normalizeSearch(value) {
  return normalizeUnicode(value).toLocaleLowerCase("cs");
}

function sortGlyphs(a, b) {
  const order = {
    "schváleno": 0,
    "návrh": 1,
    archiv: 2
  };

  return (
    order[a.status] - order[b.status] ||
    b.updatedAt.localeCompare(a.updatedAt)
  );
}

function czechEnding(count, one, few, many) {
  if (count === 1) return one;
  if (count >= 2 && count <= 4) return few;
  return many;
}

function formatShortDate(value) {
  try {
    return new Intl.DateTimeFormat("cs-CZ", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch (error) {
    return "teď";
  }
}

function validDate(value) {
  return Boolean(value) && !Number.isNaN(new Date(value).getTime());
}

function makeId(prefix) {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function shortError(error) {
  return String((error && error.message) || error || "neznámá chyba")
    .replace(/\s+/g, " ")
    .slice(0, 160);
}

function hasOwn(object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
}

function readTextFile(file) {
  if (file && typeof file.text === "function") return file.text();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Soubor nelze přečíst."));
    reader.readAsText(file, "UTF-8");
  });
}

function downloadFile(contents, filename, type) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.append(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function setStatus(message, kind = "") {
  dom.statusLine.textContent = message;
  dom.statusLine.dataset.kind = kind;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    "\"": "&quot;"
  })[character]);
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
