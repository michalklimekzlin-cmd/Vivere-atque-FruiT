import { PametStore, WORLD_DEFINITIONS, worldDefinition, MAX_WORLD_BYTES } from "./pamet-store.js";
import { TowerRenderer } from "./tower-renderer.js";
import { TowerInteraction } from "./tower-ui.js";

const elements = {
  canvas: document.getElementById("towerCanvas"),
  status: document.getElementById("status"),
  activeWorldName: document.getElementById("activeWorldName"),
  activeWorldHint: document.getElementById("activeWorldHint"),
  pills: [...document.querySelectorAll("[data-world]")],
  exportButton: document.getElementById("exportButton"),
  importButton: document.getElementById("importButton"),
  importInput: document.getElementById("importInput"),
  modal: document.getElementById("slotModal"),
  form: document.getElementById("slotForm"),
  modalWorld: document.getElementById("slotWorld"),
  title: document.getElementById("slotTitle"),
  label: document.getElementById("slotLabel"),
  type: document.getElementById("slotType"),
  icon: document.getElementById("slotIcon"),
  color: document.getElementById("slotColor"),
  url: document.getElementById("slotUrl"),
  content: document.getElementById("slotContent"),
  budget: document.getElementById("slotBudget"),
  openSlotButton: document.getElementById("openSlotButton"),
  clearSlotButton: document.getElementById("clearSlotButton")
};

let activeWorldId = "game";
let editing = null;
let renderer;
let interaction;

function formatBytes(bytes) {
  return new Intl.NumberFormat("cs-CZ").format(Math.max(0, Math.round(bytes)));
}

function setStatus(message) {
  elements.status.textContent = message;
}

function updatePills() {
  const counts = PametStore.counts();
  for (const pill of elements.pills) {
    const worldId = pill.dataset.world;
    const count = counts[worldId];
    const label = document.getElementById(`count-${worldId}`);
    if (label && count) label.textContent = `${count.filled}/${count.total}`;
    pill.classList.toggle("active", worldId === activeWorldId);
    pill.setAttribute("aria-pressed", String(worldId === activeWorldId));
  }
}

function selectWorld(worldId, quiet = false) {
  const definition = worldDefinition(worldId);
  if (!definition) return;
  activeWorldId = worldId;
  renderer.setActiveWorld(worldId);
  elements.activeWorldName.textContent = definition.short;
  elements.activeWorldHint.textContent = definition.purpose;
  updatePills();
  if (!quiet) setStatus(`VybrÃ¡no jÃ¡dro ${definition.name}. Klepni na jeden ze 70 slotÅ¯.`);
}

function updateBudget() {
  if (!editing) return;
  const world = PametStore.world(editing.worldId);
  const maxBytes = world?.maxBytes ?? MAX_WORLD_BYTES;
  const currentContent = new TextEncoder().encode(elements.content.value).length;
  const stored = PametStore.bytesForWorld(editing.worldId);
  elements.budget.textContent = `Obsah slotu: ${formatBytes(currentContent)} B Â· jÃ¡dro nynÃ­: ${formatBytes(stored)} / ${formatBytes(maxBytes)} B`;
}

function openSlot(worldId, slotId, longPress) {
  const slot = PametStore.slot(worldId, slotId);
  const world = PametStore.world(worldId);
  if (!slot || !world) return;
  editing = { worldId, slotId: Number(slotId) };
  renderer.setSelected(worldId, slotId);
  selectWorld(worldId, true);

  elements.modalWorld.textContent = `${world.name.toUpperCase()} Â· SLOT ${slot.slotId}`;
  elements.title.textContent = slot.label || `slot ${slot.slotId}`;
  elements.label.value = slot.label ?? "";
  elements.type.value = slot.type || "TEXT";
  elements.icon.value = slot.icon ?? "";
  elements.color.value = /^#[0-9a-f]{6}$/i.test(slot.color) ? slot.color : "#c79b33";
  elements.url.value = slot.url ?? "";
  elements.content.value = slot.content ?? "";
  elements.modal.hidden = false;
  document.body.style.overflow = "hidden";
  updateBudget();
  setStatus(longPress ? `DlouhÃ½ stisk otevÅel ${world.name} Â· slot ${slot.slotId}.` : `OtevÅen ${world.name} Â· slot ${slot.slotId}.`);
  window.requestAnimationFrame(() => elements.label.focus({ preventScroll: true }));
}

function closeSlot() {
  elements.modal.hidden = true;
  document.body.style.overflow = "";
  editing = null;
  renderer.setSelected(null, null);
}

function saveCurrentSlot() {
  if (!editing) return;
  try {
    const slot = PametStore.updateSlot(editing.worldId, editing.slotId, {
      label: elements.label.value.trim() || `slot ${editing.slotId}`,
      type: elements.type.value,
      icon: elements.icon.value.trim(),
      color: elements.color.value,
      url: elements.url.value.trim(),
      content: elements.content.value
    });
    elements.title.textContent = slot.label;
    updateBudget();
    setStatus(`UloÅ¾eno: ${PametStore.world(editing.worldId).name} Â· ${slot.label}.`);
    closeSlot();
  } catch (error) {
    setStatus(error.message || "Slot se nepodaÅilo uloÅ¾it.");
  }
}

function clearCurrentSlot() {
  if (!editing) return;
  const slot = PametStore.slot(editing.worldId, editing.slotId);
  if (!window.confirm(`VyÄistit â${slot?.label || `slot ${editing.slotId}`}â?`)) return;
  try {
    PametStore.clearSlot(editing.worldId, editing.slotId);
    setStatus(`VyÄiÅ¡tÄn slot ${editing.slotId} v jÃ¡dru ${PametStore.world(editing.worldId).name}.`);
    closeSlot();
  } catch (error) {
    setStatus(error.message || "Slot se nepodaÅilo vyÄistit.");
  }
}

function openCurrentSlot() {
  if (!editing) return;
  const slot = PametStore.slot(editing.worldId, editing.slotId);
  const value = String(slot?.url || elements.url.value || "").trim();
  if (!value) {
    setStatus("Tento slot zatÃ­m nemÃ¡ pÅipojenÃ½ odkaz ani aplikaci.");
    return;
  }

  try {
    const address = new URL(value, window.location.href);
    if (!["https:", "http:"].includes(address.protocol)) throw new Error("PouÅ¾ij bezpeÄnÃ½ odkaz http(s) nebo relativnÃ­ cestu.");
    if (address.origin === window.location.origin) {
      window.location.assign(address.href);
    } else {
      window.open(address.href, "_blank", "noopener,noreferrer");
    }
  } catch (error) {
    setStatus(error.message || "Odkaz se nepodaÅilo otevÅÃ­t.");
  }
}

function exportMemory() {
  const blob = new Blob([PametStore.exportText()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `vafit-pamet-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  setStatus("Export PamÄti je pÅipravenÃ½.");
}

async function importMemory(file) {
  if (!file) return;
  try {
    const text = await file.text();
    PametStore.importText(text);
    selectWorld(activeWorldId, true);
    setStatus("Import hotovÃ½: 360Â°â° nynÃ­ Äte novou PamÄÅ¥.");
  } catch (error) {
    setStatus(error.message || "Import se nepodaÅil.");
  } finally {
    elements.importInput.value = "";
  }
}

function bootServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      setStatus("360Â°â° bÄÅ¾Ã­; offline vrstvu se zatÃ­m nepodaÅilo zapnout.");
    });
  });
}

function boot() {
  PametStore.bootstrap();
  renderer = new TowerRenderer(elements.canvas);
  renderer.setData(PametStore.data);
  selectWorld(activeWorldId, true);
  updatePills();

  interaction = new TowerInteraction({
    canvas: elements.canvas,
    renderer,
    onSelectWorld: selectWorld,
    onOpenSlot: openSlot,
    onStatus: setStatus
  });

  PametStore.subscribe((data) => {
    renderer.setData(data);
    updatePills();
  });

  elements.pills.forEach((button) => button.addEventListener("click", () => selectWorld(button.dataset.world)));
  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveCurrentSlot();
  });
  elements.content.addEventListener("input", updateBudget);
  elements.label.addEventListener("input", () => { elements.title.textContent = elements.label.value || "Slot"; });
  elements.openSlotButton.addEventListener("click", openCurrentSlot);
  elements.clearSlotButton.addEventListener("click", clearCurrentSlot);
  elements.exportButton.addEventListener("click", exportMemory);
  elements.importButton.addEventListener("click", () => elements.importInput.click());
  elements.importInput.addEventListener("change", () => importMemory(elements.importInput.files?.[0]));
  document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closeSlot));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.modal.hidden) closeSlot();
  });

  setStatus("360Â°â° je napojenÃ½ na spoleÄnou PamÄÅ¥. Vyber jÃ¡dro nebo slot.");
  bootServiceWorker();
}

boot();
