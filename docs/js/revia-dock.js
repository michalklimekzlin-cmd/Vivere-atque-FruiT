"use strict";

import {
  CHT_PROJECT_CONTEXT,
  REVIA_REPOSITORY_MEMORY,
  REVIA_GLYPH_MEMORY,
  findProjectContext,
  formatConversationMilestones,
  formatGlyphMemory,
  formatProjectHistory,
  formatRepositoryLinks,
  formatRepositoryMap,
  formatRepositoryPlans,
  searchRepositoryPaths
} from "./revia-context.js";
import { createReviaContinuity } from "./revia-continuity.js";
import { createReviaLocalMesh, formatLocalMeshStatus } from "./revia-local-mesh.js";

const STORAGE_KEY = "cht360_revia_chat_v1";
const ACTIVITY_KEY = "cht360_revia_activity_v1";
const MAX_HISTORY = 80;
const MAX_ACTIVITY = 60;

const ui = {
  open: document.getElementById("openReviaPanel"),
  panel: document.getElementById("reviaPanel"),
  close: document.getElementById("closeReviaPanel"),
  mode: document.getElementById("reviaMode"),
  modeLabel: document.getElementById("reviaModeLabel"),
  log: document.getElementById("reviaLog"),
  form: document.getElementById("reviaForm"),
  input: document.getElementById("reviaInput"),
  state: document.getElementById("reviaState"),
  continuity: document.getElementById("reviaContinuity"),
  continuityClose: document.getElementById("closeReviaContinuity"),
  discoveryInput: document.getElementById("reviaDiscoveryInput"),
  discoverySource: document.getElementById("reviaDiscoverySource"),
  discoverySave: document.getElementById("reviaDiscoverySave"),
  discoveryApprove: document.getElementById("reviaDiscoveryApprove"),
  continuityReview: document.getElementById("reviaContinuityReview"),
  export: document.getElementById("reviaExport"),
  import: document.getElementById("reviaImport"),
  storage: document.getElementById("reviaStorage"),
  continuityState: document.getElementById("reviaContinuityState")
};

let state = loadState();

function loadActivity() {
  try {
    const saved = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || "[]");
    return Array.isArray(saved)
      ? saved
        .filter(item => item && typeof item.text === "string" && typeof item.at === "string")
        .slice(-MAX_ACTIVITY)
      : [];
  } catch (error) {
    console.warn("[Revia] Deník se nepodařilo načíst.", error);
    return [];
  }
}

let activity = loadActivity();
let checkpointTimer = null;

const continuity = createReviaContinuity(() => ({
  revia: {
    mode: state.mode,
    messages: state.messages.slice(-MAX_HISTORY),
    activity: activity.slice(-MAX_ACTIVITY)
  }
}));

const mesh = createReviaLocalMesh(signal => {
  if (signal.origin === "Revia") return;
  rememberActivity("mesh", "Lokální most zachytil signál: " + signal.origin + " — " + signal.type + ".");
  scheduleCheckpoint("signál z lokálního mostu");
});

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved && Array.isArray(saved.messages)) {
      return {
        mode: saved.mode === "kontrola" ? "kontrola" : "revia",
        messages: saved.messages
          .filter(item => item && typeof item.text === "string" && (item.role === "user" || item.role === "revia"))
          .slice(-MAX_HISTORY)
      };
    }
  } catch (error) {
    console.warn("[Revia] Historii se nepodařilo načíst.", error);
  }

  return {
    mode: "revia",
    messages: [{
      role: "revia",
      text: "Jsem Revia v oběhu CHT 360°‰. Mám mapu projektu i tohoto repozitáře. Můžu otevřít Paměť, Glyph dílnu, pokojíčky nebo iPhone; napiš také historie nebo mapa repozitáře."
    }]
  };
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      mode: state.mode,
      messages: state.messages.slice(-MAX_HISTORY)
    }));
  } catch (error) {
    setState("Historii se nepodařilo uložit do tohoto zařízení.");
    console.warn("[Revia] Historii se nepodařilo uložit.", error);
  }
  scheduleCheckpoint("změna rozhovoru Revii");
}

function setState(text) {
  if (ui.state) ui.state.textContent = text;
}

function saveActivity() {
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity.slice(-MAX_ACTIVITY)));
  } catch (error) {
    console.warn("[Revia] Deník se nepodařilo uložit.", error);
  }
  scheduleCheckpoint("změna deníku Revii");
}

function scheduleCheckpoint(reason) {
  if (!continuity) return;
  window.clearTimeout(checkpointTimer);
  checkpointTimer = window.setTimeout(() => continuity.checkpoint(reason), 450);
}

function rememberActivity(kind, text) {
  if (typeof text !== "string" || !text.trim()) return;
  const last = activity.at(-1);
  if (last?.kind === kind && last.text === text && Date.now() - Date.parse(last.at) < 1500) return;

  activity.push({
    kind,
    text: text.trim().slice(0, 360),
    at: new Date().toISOString()
  });
  activity = activity.slice(-MAX_ACTIVITY);
  saveActivity();
}

function formatRecentActivity() {
  if (!activity.length) return "V tomto zařízení zatím není žádná nová událost. Projektovou mapu už ale znám.";

  return [
    "Poslední dění v tomto zařízení:",
    ...activity.slice(-5).reverse().map(item => {
      const time = new Intl.DateTimeFormat("cs-CZ", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(new Date(item.at));
      return `• ${time} — ${item.text}`;
    })
  ].join("\n");
}

function formatDiscoveries() {
  const discoveries = continuity.getDiscoveries();
  if (!discoveries.length) {
    return "Schránka objevů je prázdná. Vlož sem třeba výňatek z GPT nebo z bratříčka; Revia jej uloží lokálně a počká na tvoje potvrzení.";
  }

  return [
    "Schránka objevů:",
    ...discoveries.slice(-6).reverse().map(item => `• ${item.status === "approved" ? "potvrzeno" : "čeká"} — ${item.source}: ${item.text.slice(0, 220)}`)
  ].join("\n");
}

function formatInfraredStatus() {
  return [
    "Infračervený most:",
    "• PWA si umí místně pamatovat budoucí zařízení a příkazy, ale iPhone jí nevystavuje přímý IR vysílač.",
    "• Skutečný IR signál bude možný až přes tebou zvolený externí adaptér (např. Wi‑Fi/ESP32 brána).",
    "• Revia bez zařízení nic nepředstírá, nic sama neodesílá a neprohledává okolní sítě.",
    "• Až budeš mít konkrétní adaptér, připojí se jen jeho jasně popsaný místní most."
  ].join("\n");
}

function setContinuityState(text) {
  if (ui.continuityState) ui.continuityState.textContent = text;
}

function openContinuity() {
  ui.continuity?.removeAttribute("hidden");
  ui.discoveryInput?.focus();
  setContinuityState("Schránka je místní. Nic se automaticky neposílá ven.");
}

function closeContinuity() {
  ui.continuity?.setAttribute("hidden", "");
}

function toggleContinuity() {
  if (ui.continuity?.hasAttribute("hidden")) openContinuity();
  else closeContinuity();
}

function mergeMessages(current, incoming) {
  const known = new Set(current.map(item => `${item.role}|${item.text}`));
  const additions = Array.isArray(incoming)
    ? incoming.filter(item => item && (item.role === "user" || item.role === "revia") && typeof item.text === "string" && !known.has(`${item.role}|${item.text}`))
    : [];
  return [...current, ...additions].slice(-MAX_HISTORY);
}

function mergeActivity(current, incoming) {
  const known = new Set(current.map(item => `${item.at}|${item.text}`));
  const additions = Array.isArray(incoming)
    ? incoming.filter(item => item && typeof item.at === "string" && typeof item.text === "string" && !known.has(`${item.at}|${item.text}`))
    : [];
  return [...current, ...additions].slice(-MAX_ACTIVITY);
}

function downloadArchive() {
  const archive = continuity.createArchive();
  const blob = new Blob([JSON.stringify(archive, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "cht360-revia-zaloha.json";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  continuity.checkpoint("ručně vyexportovaná záloha Revii");
  rememberActivity("backup", "Vytvořena exportní záloha Revii.");
  setContinuityState("Záloha byla připravena ke stažení.");
}

async function importArchive(file) {
  if (!file) return;
  const raw = await file.text();
  const archive = continuity.readArchive(raw);
  if (!archive) {
    setContinuityState("Soubor není platná záloha Revii.");
    return;
  }

  const payload = archive.payload?.revia || {};
  state.messages = mergeMessages(state.messages, payload.messages);
  activity = mergeActivity(activity, payload.activity);
  continuity.mergeDiscoveries(archive.discoveries);
  saveState();
  saveActivity();
  continuity.checkpoint("importovaná záloha Revii");
  render();
  rememberActivity("backup", "Importována a sloučena záloha Revii.");
  setContinuityState("Záloha byla bezpečně sloučena; místní zápisy zůstaly zachované.");
}

function render() {
  if (!ui.log) return;
  ui.log.replaceChildren();

  state.messages.forEach(message => {
    const item = document.createElement("article");
    item.className = "reviaMessage reviaMessage-" + message.role;

    const author = document.createElement("strong");
    author.textContent = message.role === "user" ? "Ty" : state.mode === "kontrola" ? "Revia · kontrola" : "Revia";

    const text = document.createElement("span");
    text.textContent = message.text;
    item.append(author, text);
    ui.log.append(item);
  });

  ui.log.scrollTop = ui.log.scrollHeight;
  if (ui.modeLabel) ui.modeLabel.textContent = state.mode === "kontrola" ? "Kontrola" : "Revia";
}

function push(role, text) {
  state.messages.push({ role, text });
  state.messages = state.messages.slice(-MAX_HISTORY);
  saveState();
  render();
}

function normalise(value) {
  return value.toLocaleLowerCase("cs-CZ").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function replyFor(message) {
  const text = normalise(message);
  const controlled = state.mode === "kontrola";

  if (/(historie|co se delalo|milnik|vyvoj|posledni zmen|co umis)/.test(text)) {
    return `${formatProjectHistory()}\n\n${formatConversationMilestones()}\n\n${formatRecentActivity()}`;
  }
  if (/(objev|schrank|bratricek|gpt ?5|chatgpt|nauc se|moje poznam)/.test(text)) {
    return `${formatDiscoveries()}\n\nPoužij tlačítko Schránka: vložený text nejdřív čeká na potvrzení.`;
  }
  if (/(wifi|wi-fi|pripojen|offline|online|signal|mistni most|most)/.test(text)) {
    return formatLocalMeshStatus(mesh);
  }
  if (/(infra|ir port|infračerven|infracerven)/.test(text)) {
    return formatInfraredStatus();
  }
  if (/(vafit|ascii|glyph.*znamena|znamena.*glyph|‰|٩|נֶ|✧|╦|╤|_;|`)/.test(message) || /(vafit|ascii|glyph.*znamena|znamena.*glyph)/.test(text)) {
    return formatGlyphMemory(message);
  }
  if (/(odkaz|url|github|github pages|vercel|netlify|hosting|server)/.test(text)) {
    return formatRepositoryLinks();
  }
  if (/(plan|roadmap|budouc|otevren|co chybi|dalsi krok)/.test(text)) {
    return formatRepositoryPlans();
  }
  if (/(mapa.*repo|repozitar|slozk|cela aplikace|architektur)/.test(text)) {
    return formatRepositoryMap();
  }
  if (/(co je|najdi|kde je|modul)/.test(text)) {
    const modules = findProjectContext(message);
    if (modules.length) {
      return ["V projektové mapě jsem našla:", ...modules.slice(0, 4).map(item => `• ${item.name} (${item.path}) — ${item.role}`)].join("\n");
    }

    const paths = searchRepositoryPaths(message);
    if (paths.length) {
      return ["V atlasu repozitáře jsem našla:", ...paths.map(path => `• ${path}`)].join("\n");
    }
  }
  if (/(pamet|slot|jadro|uloz)/.test(text)) {
    return "Paměť je propojená. Otevřu první jádro; uložení zůstává v místním úložišti zařízení.";
  }
  if (/(glyph|znak|bubinek|sifra)/.test(text)) {
    return "Glyph dílna je připravená. Můžeš ji otevřít přes tlačítko Glyph nad zprávami.";
  }
  if (/(pokoj|prsten|dver)/.test(text)) {
    return "Pokojíčky jsou samostatná vrstva prstence. Tlačítko Pokojíčky tě vezme přímo k nim.";
  }
  if (/(iphone|telefon|nastaven)/.test(text)) {
    return "Otevřu nastavení iPhonu 14 uvnitř CHT. Přidané odkazy aplikací zůstávají pod tvou kontrolou.";
  }
  if (/(chybozrout|oprava|chyba|kontrol)/.test(text)) {
    return "Chybožrout je v oběhu vpravo dole. Než něco opraví, vytvoří bezpečnou zálohu stavu.";
  }

  return controlled
    ? "Zachytila jsem zprávu. Pro konkrétní krok napiš třeba: otevři Paměť, Glyph, pokojíčky nebo iPhone."
    : "Jsem s tebou. Napiš mi, kam chceš v CHT pokračovat — Paměť, Glyph, pokojíčky, iPhone nebo oprava.";
}

function openPanel() {
  ui.panel?.classList.add("is-open");
  ui.panel?.setAttribute("aria-hidden", "false");
  ui.open?.setAttribute("aria-hidden", "true");
  window.setTimeout(() => ui.input?.focus(), 80);
}

function closePanel() {
  ui.panel?.classList.remove("is-open");
  ui.panel?.setAttribute("aria-hidden", "true");
  ui.open?.removeAttribute("aria-hidden");
}

function runAction(action) {
  if (action === "inbox") {
    toggleContinuity();
    rememberActivity("revia", "Otevřena schránka objevů.");
    return;
  }
  if (action === "backup") {
    downloadArchive();
    return;
  }
  if (action === "signal") {
    rememberActivity("mesh", "Otevřen stav lokálního mostu CHT.");
    push("revia", formatLocalMeshStatus(mesh));
    setState("Lokální most pracuje bez odesílání dat do cizí sítě.");
    return;
  }
  if (action === "history") {
    rememberActivity("revia", "Revia otevřela projektovou paměť.");
    push("revia", formatProjectHistory());
    setState("Projektová paměť je otevřená.");
    return;
  }
  if (action === "map") {
    rememberActivity("revia", "Revia otevřela mapu repozitáře.");
    push("revia", formatRepositoryMap());
    setState("Mapa repozitáře je otevřená.");
    return;
  }
  if (action === "plans") {
    rememberActivity("revia", "Revia otevřela plány repozitáře.");
    push("revia", formatRepositoryPlans());
    setState("Plány repozitáře jsou otevřené.");
    return;
  }
  if (action === "links") {
    rememberActivity("revia", "Revia otevřela provozní odkazy.");
    push("revia", formatRepositoryLinks());
    setState("Provozní odkazy jsou otevřené.");
    return;
  }
  if (action === "vafit") {
    rememberActivity("revia", "Revia otevřela pracovní slovník VaFiT a Glyphů.");
    push("revia", formatGlyphMemory());
    setState("Pracovní slovník VaFiT je otevřený a funguje offline.");
    return;
  }
  if (action === "memory") {
    window.dispatchEvent(new Event("cht.memory.open"));
    rememberActivity("navigation", "Otevřena Paměť CHT.");
    setState("Otevírám Paměť CHT.");
    return;
  }
  if (action === "iphone") {
    window.dispatchEvent(new Event("cht.phone.open"));
    rememberActivity("navigation", "Otevřeno nastavení iPhonu 14.");
    setState("Otevírám nastavení iPhonu 14.");
    return;
  }
  if (action === "glyph") {
    rememberActivity("navigation", "Přechod do Glyph dílny.");
    window.location.assign("./glyph-cht-360/");
    return;
  }
  if (action === "rooms") {
    rememberActivity("navigation", "Přechod do Glyph pokojíčků.");
    window.location.assign("./glyph-pokojicku-cht-360/");
  }
}

ui.open?.addEventListener("click", openPanel);
ui.close?.addEventListener("click", closePanel);
ui.continuityClose?.addEventListener("click", closeContinuity);
ui.mode?.addEventListener("click", () => {
  state.mode = state.mode === "revia" ? "kontrola" : "revia";
  saveState();
  render();
  setState(state.mode === "kontrola" ? "Revia je v režimu kontroly." : "Revia je v klidném režimu.");
});

ui.form?.addEventListener("submit", event => {
  event.preventDefault();
  const message = ui.input?.value.trim();
  if (!message) return;
  ui.input.value = "";
  push("user", message);
  window.setTimeout(() => push("revia", replyFor(message)), 120);
});

ui.input?.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    ui.form?.requestSubmit();
  }
});

ui.discoverySave?.addEventListener("click", () => {
  const text = ui.discoveryInput?.value || "";
  const source = ui.discoverySource?.value || "ručně vložený poznatek";
  const candidate = continuity.addDiscovery(text, source);
  if (!candidate) {
    setContinuityState("Nejdřív vlož text objevu.");
    return;
  }
  if (ui.discoveryInput) ui.discoveryInput.value = "";
  rememberActivity("discovery", "Do schránky byl uložen nový objev ze zdroje „" + candidate.source + "“.");
  setContinuityState("Objev čeká na tvoje potvrzení; Revia jej ještě nepovažuje za jistý.");
});

ui.discoveryApprove?.addEventListener("click", () => {
  const approved = continuity.approveLatest();
  if (!approved) {
    setContinuityState("Není tu žádný čekající objev k potvrzení.");
    return;
  }
  rememberActivity("discovery", "Potvrzen objev ze zdroje „" + approved.source + "“.");
  push("revia", "Potvrdila jsem tento místní poznatek:\n• " + approved.text.slice(0, 900));
  setContinuityState("Objev je potvrzený a zůstává jen v tomto zařízení, dokud jej nevyexportuješ.");
});

ui.continuityReview?.addEventListener("click", () => push("revia", formatDiscoveries()));
ui.export?.addEventListener("click", downloadArchive);
ui.import?.addEventListener("change", event => {
  importArchive(event.target.files?.[0]).catch(() => setContinuityState("Zálohu se nepodařilo přečíst."));
  event.target.value = "";
});
ui.storage?.addEventListener("click", async () => {
  const status = await continuity.storageStatus(true);
  if (!status.supported) {
    setContinuityState("Tento prohlížeč neumí ověřit trvalé úložiště; záloha JSON zůstává jistota.");
    return;
  }
  setContinuityState(status.persisted
    ? "Prohlížeč potvrdil upřednostněné trvalé úložiště Revii."
    : "Úložiště je místní, ale prohlížeč trvalé držení nepotvrdil. Pravidelně exportuj zálohu.");
});

document.querySelectorAll("[data-revia-action]").forEach(button => {
  button.addEventListener("click", () => runAction(button.dataset.reviaAction));
});

window.addEventListener("cht.memory.changed", event => {
  const detail = event.detail || {};
  const place = detail.coreId ? " v jádru " + detail.coreId : "";
  const slot = detail.slotId ? ", slot " + detail.slotId : "";
  rememberActivity("memory", "Paměť byla upravena" + place + slot + ".");
  mesh.announce("paměť upravena", { core: detail.coreId || "", slot: detail.slotId || 0, reason: detail.reason || "" });
  setState("Paměť byla právě upravena" + place + ".");
});

window.addEventListener("cht.track.changed", event => {
  const reason = event.detail?.reason ? " (" + event.detail.reason + ")" : "";
  rememberActivity("track", "Změněn model oběhu" + reason + ".");
  mesh.announce("oběh upraven", { reason: event.detail?.reason || "" });
});

window.addEventListener("cht.chybozrout.completed", event => {
  const failures = Number(event.detail?.failures || 0);
  rememberActivity("diagnostic", failures ? `Chybožrout dokončil kontrolu: ${failures} problémů.` : "Chybožrout dokončil kontrolu bez problémů.");
  mesh.announce("kontrola Chybožrouta", { failures });
  setState(failures ? `Chybožrout našel ${failures} problémů.` : "Chybožrout potvrdil stav bez problémů.");
});

window.addEventListener("cht.chybozrout.backup", () => {
  rememberActivity("diagnostic", "Chybožrout vytvořil bezpečnou zálohu Paměti.");
  mesh.announce("záloha Chybožrouta");
});

window.addEventListener("cht.chybozrout.repaired", () => {
  rememberActivity("diagnostic", "Chybožrout dokončil bezpečnou samoopravu.");
  mesh.announce("samooprava Chybožrouta");
});

window.addEventListener("cht.batole.changed", event => {
  const detail = event.detail || {};
  rememberActivity("mesh", "Batole předalo změnu do oběhu CHT.");
  mesh.announce("Batole upraveno", { reason: detail.reason || "", state: detail.state || "" });
  setState("Lokální most zachytil změnu ze světa Batole.");
});

window.addEventListener("cht.revia.assist.request", event => {
  const detail = event.detail || {};
  const request = typeof detail.text === "string" ? detail.text.trim().slice(0, 900) : "";
  if (!request) return;
  rememberActivity("assist", "Přijat místní požadavek na pomoc z části CHT.");
  push("revia", "Místní část CHT předala požadavek:\n" + request);
  mesh.announce("požadavek na pomoc", { source: detail.source || "část CHT" });
});

window.addEventListener("offline", () => {
  mesh.announce("přechod offline", { online: false });
  continuity.checkpoint("přechod do offline režimu");
  setState("Revia je offline. Atlas, Glyphy i místní deník zůstávají dostupné.");
});

window.addEventListener("online", () => {
  mesh.announce("připojení k dispozici", mesh.getConnectionHint());
  continuity.checkpoint("návrat připojení — připraveno k ručnímu importu nebo exportu");
  setState("Připojení je zpět. Revia má uložený bod obnovy; cizí poznatky načti přes Schránku.");
});

window.addEventListener("pagehide", () => continuity.checkpoint("opuštění nebo uspání PWA"));

window.addEventListener("cht.revia.message", event => {
  const text = event.detail?.text;
  if (typeof text === "string" && text.trim()) push("revia", text.trim());
});

window.CHT360Revia = Object.freeze({
  open: openPanel,
  close: closePanel,
  say: text => {
    if (typeof text === "string" && text.trim()) push("revia", text.trim());
  },
  getHistory: () => state.messages.slice(),
  getActivity: () => activity.slice(),
  getProjectContext: () => CHT_PROJECT_CONTEXT,
  getRepositoryMemory: () => REVIA_REPOSITORY_MEMORY,
  getGlyphMemory: () => REVIA_GLYPH_MEMORY,
  getDiscoveries: () => continuity.getDiscoveries(),
  getLocalSignals: () => mesh.getSignals(),
  getLocalMeshStatus: () => formatLocalMeshStatus(mesh),
  announceLocalSignal: (type, detail) => mesh.announce(type, detail),
  exportArchive: () => continuity.createArchive(),
  showProjectHistory: () => push("revia", formatProjectHistory()),
  showRepositoryMap: () => push("revia", formatRepositoryMap()),
  showRepositoryPlans: () => push("revia", formatRepositoryPlans()),
  showRepositoryLinks: () => push("revia", formatRepositoryLinks())
});

render();
