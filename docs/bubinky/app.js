import {
  DEFAULT_UNLOCK_MINUTES,
  SLOT_LOCK_MAX_DRUMS,
  SLOT_LOCK_MIN_DRUMS,
  SLOT_LOCK_TOKENS,
  exportSlotLocks,
  getSlotLockState,
  importSlotLocks,
  listSlotLocks,
  removeSlotLock,
  setSlotLock,
  unlockSlot
} from "./slot-locks.js";

const CORE_NAMES = Object.freeze({
  earth: "Země",
  language: "Jazyk",
  game: "Hra",
  control: "Řízení"
});
const DRUM_STORAGE_KEY = "cht360_bubinky_values_v1";

const elements = {
  core: document.getElementById("coreSelect"),
  slot: document.getElementById("slotSelect"),
  targetState: document.getElementById("targetState"),
  targetDescription: document.getElementById("targetDescription"),
  rack: document.getElementById("drumRack"),
  drumCount: document.getElementById("drumCount"),
  preview: document.getElementById("codePreview"),
  hint: document.getElementById("hintInput"),
  add: document.getElementById("addDrum"),
  remove: document.getElementById("removeDrum"),
  reset: document.getElementById("resetDrums"),
  setLock: document.getElementById("setLock"),
  unlock: document.getElementById("unlockSlot"),
  removeLock: document.getElementById("removeLock"),
  status: document.getElementById("status"),
  list: document.getElementById("locksList"),
  locksCount: document.getElementById("locksCount"),
  export: document.getElementById("exportLocks"),
  import: document.getElementById("importLocks"),
  importInput: document.getElementById("importInput")
};

function modulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function defaultDrums() {
  return [0, 6, 13, 20];
}

function loadDrums() {
  try {
    const value = JSON.parse(localStorage.getItem(DRUM_STORAGE_KEY) || "null");
    if (!Array.isArray(value)) return defaultDrums();
    const normalised = value
      .slice(0, SLOT_LOCK_MAX_DRUMS)
      .map(item => modulo(Number(item) || 0, SLOT_LOCK_TOKENS.length));
    return normalised.length >= SLOT_LOCK_MIN_DRUMS ? normalised : defaultDrums();
  } catch {
    return defaultDrums();
  }
}

let drumValues = loadDrums();

function currentCore() {
  return elements.core.value;
}

function currentSlot() {
  return Number(elements.slot.value);
}

function codeTokens() {
  return drumValues.map(value => SLOT_LOCK_TOKENS[modulo(value, SLOT_LOCK_TOKENS.length)]);
}

function setStatus(message, tone = "") {
  elements.status.textContent = message;
  elements.status.className = `status${tone ? ` is-${tone}` : ""}`;
}

function updateUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("core", currentCore());
  url.searchParams.set("slot", String(currentSlot()));
  window.history.replaceState(null, "", url);
}

function stepDrum(index, amount) {
  drumValues[index] = modulo(drumValues[index] + amount, SLOT_LOCK_TOKENS.length);
  localStorage.setItem(DRUM_STORAGE_KEY, JSON.stringify(drumValues));
  renderDrums();
}

function attachDrumDrag(button, index) {
  let drag = null;

  button.addEventListener("pointerdown", event => {
    drag = { pointerId: event.pointerId, startY: event.clientY, lastStep: 0, moved: false };
    button.setPointerCapture?.(event.pointerId);
    button.classList.add("is-dragging");
  });

  button.addEventListener("pointermove", event => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const nextStep = Math.trunc((drag.startY - event.clientY) / 18);
    if (nextStep === drag.lastStep) return;
    stepDrum(index, nextStep - drag.lastStep);
    drag.lastStep = nextStep;
    drag.moved = true;
  });

  const finish = event => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved) stepDrum(index, 1);
    button.releasePointerCapture?.(event.pointerId);
    button.classList.remove("is-dragging");
    drag = null;
  };

  button.addEventListener("pointerup", finish);
  button.addEventListener("pointercancel", finish);
  button.addEventListener("keydown", event => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      stepDrum(index, 1);
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      stepDrum(index, -1);
    }
  });
}

function renderDrums() {
  elements.rack.textContent = "";

  drumValues.forEach((value, index) => {
    const button = document.createElement("button");
    const previous = document.createElement("span");
    const current = document.createElement("strong");
    const next = document.createElement("span");
    const tokenIndex = modulo(value, SLOT_LOCK_TOKENS.length);

    button.type = "button";
    button.className = "drum";
    button.setAttribute("aria-label", `Bubínek ${index + 1}: ${SLOT_LOCK_TOKENS[tokenIndex]}`);
    previous.textContent = SLOT_LOCK_TOKENS[modulo(tokenIndex - 1, SLOT_LOCK_TOKENS.length)];
    current.textContent = SLOT_LOCK_TOKENS[tokenIndex];
    next.textContent = SLOT_LOCK_TOKENS[modulo(tokenIndex + 1, SLOT_LOCK_TOKENS.length)];
    button.append(previous, current, next);
    elements.rack.append(button);
    attachDrumDrag(button, index);
  });

  elements.drumCount.textContent = `${drumValues.length} ${drumValues.length === 1 ? "bubínek" : "bubínků"}`;
  elements.preview.textContent = codeTokens().join(" · ");
  elements.add.disabled = drumValues.length >= SLOT_LOCK_MAX_DRUMS;
  elements.remove.disabled = drumValues.length <= SLOT_LOCK_MIN_DRUMS;
}

function renderTarget() {
  const core = currentCore();
  const slot = currentSlot();
  const state = getSlotLockState(core, slot);
  const name = CORE_NAMES[core] || "Jádro";

  elements.targetDescription.textContent = `${name} · slot ${slot}`;
  elements.targetState.className = "state-pill";
  if (!state.locked) {
    elements.targetState.textContent = "neuzamčený";
  } else if (state.unlocked) {
    elements.targetState.textContent = "odemčený";
    elements.targetState.classList.add("is-open");
  } else {
    elements.targetState.textContent = "zamčený";
    elements.targetState.classList.add("is-locked");
  }

  if (state.lock?.hint) elements.hint.value = state.lock.hint;
  updateUrl();
}

function selectTarget(coreId, slotId) {
  if (CORE_NAMES[coreId]) elements.core.value = coreId;
  const slot = Math.max(1, Math.min(70, Number(slotId) || 1));
  elements.slot.value = String(slot);
  renderTarget();
}

function renderLocks() {
  const locks = listSlotLocks().sort((first, second) => {
    const a = `${first.coreId}:${String(first.slotId).padStart(2, "0")}`;
    const b = `${second.coreId}:${String(second.slotId).padStart(2, "0")}`;
    return a.localeCompare(b, "cs");
  });

  elements.locksCount.textContent = `${locks.length} ${locks.length === 1 ? "zámek" : "zámků"}`;
  elements.list.textContent = "";

  if (!locks.length) {
    const empty = document.createElement("p");
    empty.className = "empty-locks";
    empty.textContent = "Zatím není uzamčený žádný slot.";
    elements.list.append(empty);
    return;
  }

  locks.forEach(lock => {
    const row = document.createElement("div");
    const symbol = document.createElement("span");
    const copy = document.createElement("div");
    const heading = document.createElement("strong");
    const detail = document.createElement("small");
    const button = document.createElement("button");
    const title = CORE_NAMES[lock.coreId] || lock.coreId;

    row.className = "lock-row";
    symbol.className = "lock-symbol";
    symbol.textContent = lock.unlocked ? "◌" : "⌁";
    heading.textContent = `${title} · slot ${lock.slotId}`;
    detail.textContent = lock.unlocked
      ? "otevřený pro tento prohlížeč"
      : (lock.hint || "bez nápovědy");
    copy.append(heading, detail);
    button.type = "button";
    button.className = "button button-quiet";
    button.textContent = "Vybrat";
    button.addEventListener("click", () => selectTarget(lock.coreId, lock.slotId));
    row.append(symbol, copy, button);
    elements.list.append(row);
  });
}

async function lockCurrentSlot() {
  try {
    await setSlotLock(currentCore(), currentSlot(), codeTokens(), elements.hint.value);
    renderTarget();
    renderLocks();
    setStatus(`Slot ${currentSlot()} je zamčený. Kód zůstal jen v bubíncích.`, "good");
  } catch (error) {
    setStatus(error.message || "Zámek se nepodařilo nastavit.", "error");
  }
}

async function unlockCurrentSlot() {
  try {
    const result = await unlockSlot(currentCore(), currentSlot(), codeTokens(), DEFAULT_UNLOCK_MINUTES);
    if (!result.ok) {
      setStatus("Kód nesedí. Otoč bubínky a zkus to znovu.", "error");
      return;
    }
    renderTarget();
    renderLocks();
    setStatus(result.wasLocked ? "Slot je odemčený na 15 minut." : "Slot nemá nastavený zámek.", "good");
  } catch (error) {
    setStatus(error.message || "Zámek se nepodařilo ověřit.", "error");
  }
}

async function removeCurrentLock() {
  try {
    const state = getSlotLockState(currentCore(), currentSlot());
    if (!state.locked) {
      setStatus("Vybraný slot nemá zámek.");
      return;
    }
    const removed = await removeSlotLock(currentCore(), currentSlot(), codeTokens());
    if (!removed) {
      setStatus("Kód nesedí, zámek zůstává aktivní.", "error");
      return;
    }
    elements.hint.value = "";
    renderTarget();
    renderLocks();
    setStatus("Zámek byl zrušen.", "good");
  } catch (error) {
    setStatus(error.message || "Zámek se nepodařilo zrušit.", "error");
  }
}

function download(text, filename) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function populateSlots() {
  for (let slot = 1; slot <= 70; slot += 1) {
    const option = document.createElement("option");
    option.value = String(slot);
    option.textContent = `Slot ${slot}`;
    elements.slot.append(option);
  }
}

function applyQueryTarget() {
  const query = new URLSearchParams(window.location.search);
  const core = query.get("core");
  const slot = Number(query.get("slot"));
  if (CORE_NAMES[core]) elements.core.value = core;
  if (Number.isInteger(slot) && slot >= 1 && slot <= 70) elements.slot.value = String(slot);
}

function bootServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {
    setStatus("Bubínky běží, ale offline vrstvu se zatím nepodařilo zapnout.", "error");
  }));
}

populateSlots();
applyQueryTarget();
renderDrums();
renderTarget();
renderLocks();
bootServiceWorker();

elements.core.addEventListener("change", () => { renderTarget(); renderLocks(); });
elements.slot.addEventListener("change", () => { renderTarget(); renderLocks(); });
elements.add.addEventListener("click", () => {
  if (drumValues.length >= SLOT_LOCK_MAX_DRUMS) return;
  drumValues.push(0);
  localStorage.setItem(DRUM_STORAGE_KEY, JSON.stringify(drumValues));
  renderDrums();
});
elements.remove.addEventListener("click", () => {
  if (drumValues.length <= SLOT_LOCK_MIN_DRUMS) return;
  drumValues.pop();
  localStorage.setItem(DRUM_STORAGE_KEY, JSON.stringify(drumValues));
  renderDrums();
});
elements.reset.addEventListener("click", () => {
  drumValues = defaultDrums();
  localStorage.setItem(DRUM_STORAGE_KEY, JSON.stringify(drumValues));
  renderDrums();
  setStatus("Bubínky jsou zpět na výchozím nastavení.");
});
elements.setLock.addEventListener("click", lockCurrentSlot);
elements.unlock.addEventListener("click", unlockCurrentSlot);
elements.removeLock.addEventListener("click", removeCurrentLock);
elements.export.addEventListener("click", () => {
  download(exportSlotLocks(), `cht360-zamky-${new Date().toISOString().slice(0, 10)}.json`);
  setStatus("Export zámků je připravený.", "good");
});
elements.import.addEventListener("click", () => { elements.importInput.value = ""; elements.importInput.click(); });
elements.importInput.addEventListener("change", async () => {
  const file = elements.importInput.files?.[0];
  if (!file) return;
  try {
    const count = importSlotLocks(await file.text());
    renderTarget();
    renderLocks();
    setStatus(`Importováno ${count} zámků.`, "good");
  } catch (error) {
    setStatus(error.message || "Import zámků se nepodařil.", "error");
  }
});
window.addEventListener("storage", event => {
  if (event.key?.startsWith("cht360_slot_")) {
    renderTarget();
    renderLocks();
  }
});
window.addEventListener("cht.slotLocks.changed", () => {
  renderTarget();
  renderLocks();
});
