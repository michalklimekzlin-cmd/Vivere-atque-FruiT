"use strict";

const STORAGE_KEY = "cht360_revia_chat_v1";
const MAX_HISTORY = 80;

const ui = {
  open: document.getElementById("openReviaPanel"),
  panel: document.getElementById("reviaPanel"),
  close: document.getElementById("closeReviaPanel"),
  mode: document.getElementById("reviaMode"),
  modeLabel: document.getElementById("reviaModeLabel"),
  log: document.getElementById("reviaLog"),
  form: document.getElementById("reviaForm"),
  input: document.getElementById("reviaInput"),
  state: document.getElementById("reviaState")
};

let state = loadState();

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
      text: "Jsem Revia v oběhu CHT 360°‰. Můžu otevřít Paměť, Glyph dílnu, pokojíčky nebo nastavení iPhonu."
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
}

function setState(text) {
  if (ui.state) ui.state.textContent = text;
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
  if (action === "memory") {
    window.dispatchEvent(new Event("cht.memory.open"));
    setState("Otevírám Paměť CHT.");
    return;
  }
  if (action === "iphone") {
    window.dispatchEvent(new Event("cht.phone.open"));
    setState("Otevírám nastavení iPhonu 14.");
    return;
  }
  if (action === "glyph") {
    window.location.assign("./glyph-cht-360/");
    return;
  }
  if (action === "rooms") {
    window.location.assign("./glyph-pokojicku-cht-360/");
  }
}

ui.open?.addEventListener("click", openPanel);
ui.close?.addEventListener("click", closePanel);
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

document.querySelectorAll("[data-revia-action]").forEach(button => {
  button.addEventListener("click", () => runAction(button.dataset.reviaAction));
});

window.addEventListener("cht.memory.changed", event => {
  const detail = event.detail || {};
  const place = detail.coreId ? " v jádru " + detail.coreId : "";
  setState("Paměť byla právě upravena" + place + ".");
});

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
  getHistory: () => state.messages.slice()
});

render();
