"use strict";

const HISTORY_KEY = "cht360_mluva_history_v1";
const MEMORY_KEY = "cht360_pamet_v1";
const LEGACY_MEMORY_KEY = "vaft_pamet_v1";
const GLYPH_KEY = "cht360_glyph_workshop_v1";
const LOCKS_KEY = "cht360_slot_locks_v1";
const MAX_HISTORY = 80;

const CORE_NAMES = Object.freeze({
  earth: "Země",
  language: "Jazyk",
  game: "Hra",
  control: "Řízení"
});

const elements = {
  connection: document.getElementById("connectionState"),
  refresh: document.getElementById("refreshContext"),
  overview: document.getElementById("memoryOverview"),
  conversation: document.getElementById("conversation"),
  form: document.getElementById("talkForm"),
  input: document.getElementById("talkInput"),
  speak: document.getElementById("speakLast")
};

let context = readContext();
let history = loadHistory();

initialise();

function initialise() {
  bindEvents();
  ensureGreeting();
  renderAll();
  registerServiceWorker();
}

function bindEvents() {
  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = String(elements.input.value || "").trim();
    if (!message) return;

    pushMessage("user", message);
    pushMessage("assistant", createAnswer(message, readContext()));
    elements.input.value = "";
    context = readContext();
    renderAll();
    elements.input.focus();
  });

  document.querySelectorAll("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      const prompt = String(button.dataset.prompt || "").trim();
      if (!prompt) return;
      elements.input.value = prompt;
      elements.form.requestSubmit();
    });
  });

  elements.refresh.addEventListener("click", () => {
    context = readContext();
    pushMessage("system", "Lokální stav CHT je znovu načtený.");
    renderAll();
  });

  elements.speak.addEventListener("click", speakLastAnswer);

  window.addEventListener("online", renderConnection);
  window.addEventListener("offline", renderConnection);

  window.addEventListener("storage", (event) => {
    if (![
      MEMORY_KEY,
      LEGACY_MEMORY_KEY,
      GLYPH_KEY,
      LOCKS_KEY
    ].includes(event.key || "")) return;

    context = readContext();
    renderOverview();
  });
}

function readJson(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    return null;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}

function readContext() {
  const memory = readJson(MEMORY_KEY) || readJson(LEGACY_MEMORY_KEY);
  const cores = Object.entries(CORE_NAMES).map(([id, name]) => {
    const slots = Array.isArray(memory?.cores?.[id]) ? memory.cores[id] : [];
    const usedSlots = slots.filter((slot, index) => {
      const title = String(slot?.name || "").trim();
      const content = String(slot?.content || "").trim();
      return Boolean(content || (title && title !== "Slot " + (index + 1)));
    });

    const latest = usedSlots
      .slice()
      .sort((first, second) => {
        return String(second?.updatedAt || "").localeCompare(String(first?.updatedAt || ""));
      })[0] || null;

    return {
      id,
      name,
      used: usedSlots.length,
      total: 70,
      latest: latest
        ? String(latest.name || "slot").slice(0, 45)
        : "zatím prázdné"
    };
  });

  const glyph = readJson(GLYPH_KEY);
  const blocks = Array.isArray(glyph?.blocks) ? glyph.blocks : [];
  const activeGlyphs = blocks.filter((block) => block?.active !== false).length;
  const archivedGlyphs = blocks.filter((block) => block?.active === false).length;

  const locks = readJson(LOCKS_KEY);
  const lockRecords = locks?.locks && typeof locks.locks === "object"
    ? locks.locks
    : (locks && typeof locks === "object" ? locks : {});

  return {
    cores,
    totalUsed: cores.reduce((total, core) => total + core.used, 0),
    glyphs: {
      total: blocks.length,
      active: activeGlyphs,
      archived: archivedGlyphs
    },
    locks: Object.keys(lockRecords).filter((key) => key.includes(":")).length,
    hasMemory: Boolean(memory?.cores)
  };
}

function loadHistory() {
  const saved = readJson(HISTORY_KEY);
  const messages = Array.isArray(saved?.messages) ? saved.messages : [];

  return messages
    .filter((message) => message && ["user", "assistant", "system"].includes(message.role))
    .map((message) => ({
      role: message.role,
      text: String(message.text || "").slice(0, 1600),
      at: String(message.at || new Date().toISOString())
    }))
    .slice(-MAX_HISTORY);
}

function saveHistory() {
  writeJson(HISTORY_KEY, {
    version: 1,
    updatedAt: new Date().toISOString(),
    messages: history.slice(-MAX_HISTORY)
  });
}

function ensureGreeting() {
  if (history.length) return;

  pushMessage(
    "assistant",
    "Jsem první offline vrstva Mluvy CHT. Napiš „stav“, „nápad“, „bubínky“ nebo „pomoc“ — odpovím z lokální Paměti, bez odesílání jejích dat ven."
  );
}

function pushMessage(role, text) {
  history.push({
    role,
    text: String(text || "").slice(0, 1600),
    at: new Date().toISOString()
  });

  history = history.slice(-MAX_HISTORY);
  saveHistory();
}

function normalise(text) {
  return String(text || "")
    .toLocaleLowerCase("cs-CZ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .trim();
}

function createAnswer(input, nextContext) {
  const command = normalise(input);

  if (/\b(stav|jak se mame|jak se mas|prehled|souhrn)\b/u.test(command)) {
    return makeStatusAnswer(nextContext);
  }

  if (/\b(napad|napady|inspirace|vymysli|vymyslet)\b/u.test(command)) {
    return makeIdeas(nextContext);
  }

  if (/\b(bubinek|bubinky|glyph|glyphy|znak|znaky)\b/u.test(command)) {
    return makeGlyphAnswer(nextContext);
  }

  if (/\b(chyba|chybo|oprav|sken|kontrol)\b/u.test(command)) {
    return [
      "ChybaŽrout teď kontroluje i dílnu Glyphů, její offline vrstvu, zámkové Bubínky, společnou síť a platnost uložených JSON dat.",
      "Bezpečná oprava nejdřív vytvoří zálohu; nic z Paměti sám nepřepisuje."
    ].join("\n\n");
  }

  if (/\b(pamet|slot|jadro|jadra)\b/u.test(command)) {
    return makeMemoryAnswer(nextContext);
  }

  if (/\b(pomoc|umis|co dokazes|prikaz)\b/u.test(command)) {
    return [
      "Offline umím:",
      "• shrnout stav 4 jader a Glyphů („stav“),",
      "• vytvořit tři konkrétní návrhy z toho, co je prázdné nebo nepropojené („nápad“),",
      "• vysvětlit Bubínky, Paměť a ChybaŽrouta,",
      "• přečíst poslední odpověď nahlas přes hlas, který je uložený v zařízení.",
      "",
      "Pro opravdovou online konverzační AI připravíme samostatné, viditelné připojení. Žádný tajný klíč nebude schovaný v této PWA."
    ].join("\n");
  }

  return [
    "Rozumím směru: „" + String(input || "").slice(0, 160) + "“.",
    "V offline verzi zatím nejlépe pracuji s příkazy stav, nápad, Paměť, Bubínky, ChybaŽrout nebo pomoc.",
    "Když mi popíšeš konkrétní cíl, připravím k němu další krok z místních dat."
  ].join("\n\n");
}

function makeStatusAnswer(nextContext) {
  const coreLine = nextContext.cores
    .map((core) => core.name + " " + core.used + "/" + core.total)
    .join(" · ");

  return [
    "CHT má obsazeno " + nextContext.totalUsed + " slotů.",
    coreLine + ".",
    "Glyphy: " + nextContext.glyphs.active + " na ploše, " +
      nextContext.glyphs.archived + " odloženo, celkem " +
      nextContext.glyphs.total + ".",
    "Zámkové Bubínky: " + nextContext.locks + " aktivních zámků.",
    nextContext.hasMemory
      ? "Paměť je čitelná z tohoto zařízení."
      : "Zatím nevidím uloženou Paměť — po vytvoření prvního slotu se zde objeví."
  ].join("\n");
}

function makeMemoryAnswer(nextContext) {
  const least = nextContext.cores
    .slice()
    .sort((first, second) => first.used - second.used)[0];
  const latest = nextContext.cores
    .filter((core) => core.used)
    .map((core) => core.name + ": " + core.latest)
    .join(" · ");

  return [
    "Paměť drží " + nextContext.totalUsed + " obsazených slotů ze 280.",
    least
      ? "Nejvíc prostoru má teď jádro " + least.name + " (" + least.used + "/70)."
      : "",
    latest ? "Poslední pojmenované stopy: " + latest + "." : "Zatím nejsou žádné pojmenované stopy.",
    "Tip: otevři konkrétní slot, spusť Dílnu Glyphů a pošli vybraný řádek zpět přímo do jeho obsahu."
  ].filter(Boolean).join("\n\n");
}

function makeGlyphAnswer(nextContext) {
  return [
    "Na ploše je " + nextContext.glyphs.active + " řádků Glyphů; " +
      nextContext.glyphs.archived + " čeká v odložených bubíncích.",
    "Každý řádek má nyní křížek pro odložení a samostatné smazání. V inspektoru lze odstranit i právě vybraný bubínek.",
    "Sada „Česko/Rakouská · alfanumerická“ je výchozí. Další sady jsou čeština, Deutsch (Österreich), latinka, cyrilice, řecká abeceda a čísla se symboly.",
    "Tyto sady jsou uvnitř PWA. Nastavení a instalaci systémových klávesnic iPhonu pořád řídí iOS."
  ].join("\n\n");
}

function makeIdeas(nextContext) {
  const ordered = nextContext.cores
    .slice()
    .sort((first, second) => first.used - second.used);
  const lightest = ordered[0];
  const next = ordered[1] || ordered[0];
  const glyphAction = nextContext.glyphs.archived
    ? "Vrať jeden odložený Glyph na plochu a pošli ho do slotu v jádru " + lightest.name + "."
    : "Vytvoř jeden krátký Glyph o 1–2 znacích pro jádro " + lightest.name + " a propoj ho s konkrétním slotem.";

  return [
    "1. " + glyphAction,
    "2. V jádru " + lightest.name + " založ malý „startovní slot“ s jednou větou, aby měl systém na co navazovat (" + lightest.used + "/70 využito).",
    "3. Než přidáš další vrstvy, spusť ChybaŽroutův sken. Záloha zachytí Paměť, Glyphy i zámky a ověří společný most.",
    "Vedlejší směr: " + next.name + " je další nejvolnější jádro; může nést první pravidla nebo slovník Mluvy."
  ].join("\n\n");
}

function renderAll() {
  renderConnection();
  renderOverview();
  renderConversation();
}

function renderConnection() {
  const online = navigator.onLine;
  elements.connection.className = "state-pill " + (online ? "is-ready" : "is-offline");
  elements.connection.textContent = online ? "lokální režim připraven" : "offline";
}

function renderOverview() {
  elements.overview.textContent = "";

  context.cores.forEach((core) => {
    elements.overview.append(createTile(
      core.name,
      core.used + "/" + core.total,
      core.used ? "poslední: " + core.latest : "čeká na první stopu"
    ));
  });

  elements.overview.append(createTile(
    "Glyphy",
    context.glyphs.active + " / " + context.glyphs.total,
    context.glyphs.archived
      ? context.glyphs.archived + " odloženo"
      : "vše je na ploše"
  ));

  elements.overview.append(createTile(
    "Zámky",
    String(context.locks),
    context.locks ? "chrání vybrané sloty" : "zatím bez zámku"
  ));
}

function createTile(title, value, detail) {
  const tile = document.createElement("article");
  const heading = document.createElement("strong");
  const number = document.createElement("span");
  const note = document.createElement("small");

  tile.className = "memory-tile";
  heading.textContent = title;
  number.textContent = value;
  note.textContent = detail;
  tile.append(heading, number, note);
  return tile;
}

function renderConversation() {
  elements.conversation.textContent = "";

  history.forEach((message) => {
    const item = document.createElement("article");
    const label = document.createElement("strong");
    const text = document.createElement("div");

    item.className = "message " + message.role;
    label.textContent = message.role === "user"
      ? "Ty"
      : (message.role === "system" ? "Systém" : "Mluva CHT");
    text.textContent = message.text;
    item.append(label, text);
    elements.conversation.append(item);
  });

  elements.conversation.scrollTop = elements.conversation.scrollHeight;
}

function speakLastAnswer() {
  const last = history
    .slice()
    .reverse()
    .find((message) => message.role === "assistant");

  if (!last) return;

  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    pushMessage("system", "Tento prohlížeč nemá dostupné hlasové čtení.");
    renderConversation();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(last.text);
  const voices = window.speechSynthesis.getVoices();
  const czechVoice = voices.find((voice) => /^cs(-|_)/i.test(voice.lang));

  if (czechVoice) utterance.voice = czechVoice;
  utterance.lang = czechVoice?.lang || "cs-CZ";
  utterance.rate = .96;
  window.speechSynthesis.speak(utterance);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      pushMessage("system", "Mluva běží, ale její offline vrstvu se zatím nepodařilo zapnout.");
      renderConversation();
    });
  });
}
