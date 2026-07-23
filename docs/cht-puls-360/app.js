"use strict";

import {
  CHANNEL_NAME,
  IR_COMMANDS,
  WAYS,
  addEntry,
  createArchive,
  createPulse,
  loadState,
  mergeArchive,
  receivePulse,
  restoreLastTrash,
  safeCleanup,
  saveState,
  scanCleanup
} from "./memory.js?v=kompost3";

const $ = id => document.getElementById(id);
const ui = {
  ways: [...document.querySelectorAll("[data-way]")],
  content: $("wayContent"),
  input: $("memoryInput"),
  log: $("memoryLog"),
  stats: $("memoryStats"),
  trashStats: $("trashStats"),
  seedLog: $("seedLog"),
  preview: $("pulsePreview"),
  checksum: $("pulseChecksum"),
  status: $("status"),
  connection: $("connectionState")
};

let state = loadState();
let way = "local";
let channel = null;

const lastItem = list => list[list.length - 1];
const say = text => {
  ui.status.textContent = text;
};

function persist(reason) {
  saveState(state);
  window.dispatchEvent(new CustomEvent("cht.puls.changed", { detail: { reason, updatedAt: state.updatedAt } }));
}

function showPulse(pulse) {
  ui.preview.textContent = JSON.stringify(pulse, null, 2);
  ui.checksum.textContent = pulse.checksum || "čeká";
}

function emit(type, payload, source = "CHT Puls") {
  const pulse = createPulse(way, type, payload, source);
  receivePulse(state, pulse);
  persist(type);
  showPulse(pulse);
  try { channel?.postMessage(pulse); } catch {}
  return pulse;
}

function button(text, action, kind = "") {
  const item = document.createElement("button");
  item.type = "button";
  item.textContent = text;
  if (kind) item.className = kind;
  item.addEventListener("click", action);
  return item;
}

function renderMemory() {
  ui.stats.textContent = `${state.entries.length} stop · ${state.pulses.length} pulsů · ${state.seeds.length} semínek`;
  ui.log.replaceChildren();

  [...state.entries].reverse().slice(0, 24).forEach(entry => {
    const item = document.createElement("article");
    item.className = "memoryEntry";
    const date = new Date(entry.at).toLocaleString("cs-CZ");
    item.innerHTML = `<small>${date} · ${entry.source}</small>`;
    const text = document.createElement("div");
    text.textContent = entry.text;
    item.append(text);
    ui.log.append(item);
  });
}

function renderTrash(report = scanCleanup(state)) {
  ui.trashStats.textContent = `${state.trash.length} střepů · ${state.seeds.length} semínek`;
  ui.seedLog.replaceChildren();

  const finding = document.createElement("article");
  finding.className = "seedItem";
  finding.innerHTML = `<b>Nález Samočističky</b><small>${report.duplicateEntries} duplicit · ${report.emptyEntries} prázdných · ${report.oldPulses} starších pulsů · ${report.oldBridgeItems} starších příkazů</small>`;
  ui.seedLog.append(finding);

  [...state.seeds].reverse().slice(0, 4).forEach(seed => {
    const item = document.createElement("article");
    item.className = "seedItem";
    const glyphs = (seed.glyphs || []).slice(0, 8).map(part => part.glyph).join(" ");
    item.innerHTML = `<b>${seed.title || "semínko mluvy"}</b><small>${seed.phrase || "čeká na první kompost"}${glyphs ? ` · ${glyphs}` : ""}</small>`;
    ui.seedLog.append(item);
  });

  if (!state.seeds.length && state.trash.length) {
    const item = document.createElement("article");
    item.className = "seedItem";
    item.innerHTML = "<b>Koš čeká</b><small>Střepy jsou uložené. Při dalším bezpečném čištění z nich vzniknou semínka.</small>";
    ui.seedLog.append(item);
  }
}

function routeLocal() {
  const box = document.createElement("div");
  box.className = "wayContent";
  box.innerHTML = `<h2>1 · Lokální most</h2><p>Stejný puls může přejít mezi otevřenými částmi CHT na stejné adrese. Bez internetu, bez názvu Wi‑Fi, bez cizího serveru.</p><div class="hint">Tahle cesta je živá jen mezi otevřenými stránkami stejného projektu. Každý přijatý puls se uloží do společné Paměti.</div>`;
  const actions = document.createElement("div");
  actions.className = "routeActions";
  actions.append(button("Vyslat zkušební puls", () => {
    emit("lokální pozdrav", { message: "CHT Puls je v oběhu" });
    renderMemory();
    renderTrash();
    say("Lokální puls byl uložen a oznámen ostatním částem CHT.");
  }, "primary"));
  box.append(actions);
  return box;
}

function routeJSON() {
  const box = document.createElement("div");
  box.className = "wayContent";
  box.innerHTML = `<h2>2 · JSON paměť</h2><p>Celý stav CHT Puls lze nést v jednom souboru. Import pouze slučuje stopy, pulsy, koš i semínka; nemaže vlastní Paměť.</p><div class="hint">Tohle je nejspolehlivější cesta mezi dvěma telefony, instalacemi PWA nebo verzemi projektu.</div>`;
  const actions = document.createElement("div");
  actions.className = "routeActions";
  actions.append(button("Vytvořit JSON puls", () => {
    const pulse = emit("JSON bod obnovy", {
      entries: state.entries.length,
      pulses: state.pulses.length,
      trash: state.trash.length,
      seeds: state.seeds.length
    });
    const blob = new Blob([JSON.stringify(createArchive(state), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cht-puls-360-zaloha.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    renderMemory();
    renderTrash();
    say("JSON záloha byla připravena; poslední puls má otisk " + pulse.checksum + ".");
  }, "primary"));
  box.append(actions);
  return box;
}

function routeLight() {
  const box = document.createElement("div");
  box.className = "wayContent";
  box.innerHTML = `<h2>3 · Světelný puls</h2><p>Nejde o skutečné infračervené vysílání. Je to viditelný, krátký Glyph-puls pro předání mezi lidmi a zařízeními bez sítě.</p><div class="lightPulse">CHT · SVIT · 360°‰</div><div class="hint">První verze vytváří ověřitelný puls a jeho otisk. Další krok může být QR/Glyph obrazec načítaný po povolení fotoaparátu.</div>`;
  const actions = document.createElement("div");
  actions.className = "routeActions";
  actions.append(button("Vytvořit Světelný puls", () => {
    const pulse = emit("světelný puls", { excerpt: (lastItem(state.entries)?.text || "prázdná stopa").slice(0, 180) });
    renderMemory();
    renderTrash();
    say("Světelný puls je připraven; zatím se pouze ukazuje a ukládá.");
    showPulse(pulse);
  }, "primary"));
  box.append(actions);
  return box;
}

function routeBridge() {
  const box = document.createElement("div");
  box.className = "wayContent";
  box.innerHTML = `<h2>4 · IR / budoucí brána</h2><p>Tvůj registr příkazů je uložen místně. Kliknutí vytvoří puls a zařadí jej do bezpečné fronty — nic se neposílá na síť, dokud jednou nepřipojíme konkrétní vlastní adaptér.</p><div class="hint">Tahle vrstva odděluje význam příkazu od způsobu přenosu. Stejný puls může jednou nést IR brána, ESP32 nebo jiný tvůj most.</div>`;
  const grid = document.createElement("div");
  grid.className = "commandGrid";
  Object.entries(IR_COMMANDS).forEach(([code, command]) => {
    const item = button("", () => {
      const pulse = emit("příkaz pro bránu", { code, command });
      state.bridgeQueue.push({ pulse, queuedAt: new Date().toISOString(), status: "čeká na vlastní adaptér" });
      state.bridgeQueue = state.bridgeQueue.slice(-40);
      persist("příkaz uložen do fronty");
      renderMemory();
      renderTrash();
      say(command.label + " je ve frontě jako puls, nikam neodeslán.");
    }, "command");
    const label = document.createElement("span");
    label.textContent = command.label;
    const small = document.createElement("small");
    small.textContent = code;
    item.append(label, small);
    grid.append(item);
  });
  box.append(grid);
  return box;
}

function renderWay() {
  ui.ways.forEach(item => item.classList.toggle("is-active", item.dataset.way === way));
  ui.content.replaceChildren(({ local: routeLocal, json: routeJSON, light: routeLight, bridge: routeBridge }[way])());
}

async function refreshOwnCache() {
  if (!("caches" in window)) {
    say("Tahle verze prohlížeče neumí ruční obnovu cache, Paměť ale drží dál.");
    return;
  }
  const keys = await caches.keys();
  const own = keys.filter(key => key.startsWith("cht-puls-360-"));
  await Promise.all(own.map(key => caches.delete(key)));
  try {
    const registration = await navigator.serviceWorker?.getRegistration("./");
    await registration?.update();
  } catch {}
  emit("obnova cache", { deletedCaches: own.length });
  renderMemory();
  renderTrash();
  say(`Cache byla obnovena (${own.length} vrstev). Kdyby iPhone držel starou verzi, zavři a otevři PWA.`);
}

ui.ways.forEach(item => item.addEventListener("click", () => {
  way = item.dataset.way;
  renderWay();
  say(WAYS[way] + " je aktivní.");
}));

$("saveMemory").addEventListener("click", () => {
  const entry = addEntry(state, ui.input.value, "ručně vložená stopa");
  if (!entry) {
    say("Nejdřív napiš stopu.");
    return;
  }
  ui.input.value = "";
  emit("uložená stopa", { entryId: entry.id, excerpt: entry.text.slice(0, 180) });
  renderMemory();
  renderTrash();
  say("Stopa byla uložena do společné Paměti Pulsu.");
});

$("clearDraft").addEventListener("click", () => {
  ui.input.value = "";
  ui.input.focus();
});

$("exportMemory").addEventListener("click", () => {
  way = "json";
  renderWay();
  $("wayContent").querySelector("button")?.click();
});

$("importMemory").addEventListener("change", async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const ok = mergeArchive(state, JSON.parse(await file.text()));
    if (!ok) throw new Error();
    emit("import JSON", { file: file.name });
    renderMemory();
    renderTrash();
    say("JSON byl bezpečně sloučen s Pamětí Pulsu.");
  } catch {
    say("Soubor není platná záloha CHT Puls.");
  }
  event.target.value = "";
});

$("scanTrash").addEventListener("click", () => {
  const report = scanCleanup(state);
  renderTrash(report);
  say(`Samočistička našla ${report.duplicateEntries} duplicit, ${report.emptyEntries} prázdných stop a ${report.oldPulses + report.oldBridgeItems} starších položek.`);
});

$("safeClean").addEventListener("click", () => {
  const report = safeCleanup(state);
  emit("samočistička", report, "Koš · Kompost · Revia");
  renderMemory();
  renderTrash(report);
  say(report.moved
    ? `Uklizeno bezpečně: ${report.moved} věcí je ve střepovém Koši a ${report.seeds} semínek živí mluvu.`
    : "Nic nebylo potřeba košovat. Paměť je čistá.");
});

$("restoreTrash").addEventListener("click", () => {
  const result = restoreLastTrash(state);
  if (result.ok) emit("obnova z koše", { message: result.message }, "Koš · Kompost · Revia");
  else persist("kontrola koše");
  renderMemory();
  renderTrash();
  say(result.message);
});

$("clearCache").addEventListener("click", refreshOwnCache);

if ("BroadcastChannel" in window) {
  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.addEventListener("message", event => {
    if (receivePulse(state, event.data)) {
      persist("přijatý lokální puls");
      renderMemory();
      renderTrash();
      showPulse(event.data);
      say("Přišel lokální puls z jiné otevřené části CHT.");
    }
  });
}

window.addEventListener("online", () => {
  ui.connection.textContent = "spojení k dispozici";
  emit("návrat připojení", { online: true });
  renderMemory();
  renderTrash();
});

window.addEventListener("offline", () => {
  ui.connection.textContent = "offline · Paměť drží";
  persist("přechod offline");
});

window.addEventListener("pagehide", () => persist("uspání PWA"));

renderMemory();
renderTrash();
renderWay();
if (lastItem(state.pulses)) showPulse(lastItem(state.pulses));
ui.connection.textContent = navigator.onLine ? "místní oběh · připojení k dispozici" : "offline · Paměť drží";
say("CHT Puls je připravený. Koš, Kompost i Revia mají živá tlačítka.");

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker
    .register("./sw.js?v=kompost3")
    .catch(() => say("Offline vrstvu se nepodařilo zapnout; Paměť dál běží místně.")));
}
