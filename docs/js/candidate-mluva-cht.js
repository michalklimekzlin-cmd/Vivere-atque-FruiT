"use strict";

const CHT_MEMORY_KEY = "cht360_pamet_v1";
const CHT_LEGACY_MEMORY_KEY = "vaft_pamet_v1";
const MLUVA_STORE_KEY = "cht360_mluva_dock_v1";
const SLOT_COUNT = 240;

const CORE_LABELS = Object.freeze({
  earth: "Země",
  language: "Jazyk",
  game: "Hra",
  control: "iPhone 14"
});

const dock = document.getElementById("mluvaDock");

if (dock) {
  const toggle = document.getElementById("mluvaToggle");
  const closeButton = document.getElementById("mluvaClose");
  const summary = document.getElementById("mluvaSummary");
  const coreSelect = document.getElementById("mluvaCore");
  const messages = document.getElementById("mluvaMessages");
  const form = document.getElementById("mluvaForm");
  const input = document.getElementById("mluvaInput");
  const status = document.getElementById("mluvaStatus");
  const speakButton = document.getElementById("mluvaSpeak");
  const exportButton = document.getElementById("mluvaExport");

  let data = loadData();

  if (!data.messages.length) {
    data.messages.push({
      role: "bot",
      text: "Jsem Mluva uvnitř CHT 360°‰. Pracuji lokálně s Pamětí, kterou mi dovolíš uložit.",
      at: Date.now()
    });
    saveData();
  }

  function blankData() {
    return {
      version: 1,
      updatedAt: null,
      lessons: [],
      messages: [],
      notes: []
    };
  }

  function loadData() {
    try {
      const parsed = JSON.parse(localStorage.getItem(MLUVA_STORE_KEY) || "null");

      if (!parsed || typeof parsed !== "object") {
        return blankData();
      }

      return {
        ...blankData(),
        ...parsed,
        lessons: Array.isArray(parsed.lessons) ? parsed.lessons.slice(-120) : [],
        messages: Array.isArray(parsed.messages) ? parsed.messages.slice(-80) : [],
        notes: Array.isArray(parsed.notes) ? parsed.notes.slice(-80) : []
      };
    } catch (_) {
      return blankData();
    }
  }

  function saveData() {
    data.updatedAt = new Date().toISOString();

    try {
      localStorage.setItem(MLUVA_STORE_KEY, JSON.stringify(data));
    } catch (_) {
      setStatus("Mluvu se teď nepodařilo uložit do místní Paměti.");
    }
  }

  function normaliseText(value) {
    return String(value || "")
      .toLocaleLowerCase("cs-CZ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function createSlot(index) {
    return {
      id: index + 1,
      name: "Slot " + (index + 1),
      content: "",
      updatedAt: null
    };
  }

  function normaliseSlot(source, index) {
    const value = source && typeof source === "object" ? source : {};
    const defaultName = "Slot " + (index + 1);
    const name = typeof value.name === "string" && value.name.trim()
      ? value.name.trim()
      : defaultName;
    const content = typeof value.content === "string" ? value.content : "";

    return {
      ...value,
      id: index + 1,
      name,
      content,
      updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null
    };
  }

  function createMemory() {
    const cores = {};

    Object.keys(CORE_LABELS).forEach((coreId) => {
      cores[coreId] = Array.from({ length: SLOT_COUNT }, (_, index) => createSlot(index));
    });

    return {
      version: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cores
    };
  }

  function normaliseMemory(source) {
    const base = source && typeof source === "object" ? source : {};
    const result = createMemory();

    result.createdAt = typeof base.createdAt === "string" ? base.createdAt : result.createdAt;
    result.updatedAt = typeof base.updatedAt === "string" ? base.updatedAt : result.updatedAt;

    Object.keys(CORE_LABELS).forEach((coreId) => {
      const incoming = Array.isArray(base.cores && base.cores[coreId])
        ? base.cores[coreId]
        : [];

      result.cores[coreId] = Array.from(
        { length: SLOT_COUNT },
        (_, index) => normaliseSlot(incoming[index], index)
      );
    });

    return result;
  }

  function readMemoryFallback() {
    try {
      const raw = localStorage.getItem(CHT_MEMORY_KEY) || localStorage.getItem(CHT_LEGACY_MEMORY_KEY);
      return normaliseMemory(raw ? JSON.parse(raw) : null);
    } catch (_) {
      return createMemory();
    }
  }

  function countUsed(slots) {
    return slots.filter((slot) => {
      const defaultName = "Slot " + slot.id;
      return Boolean(String(slot.content || "").trim() || String(slot.name || "").trim() !== defaultName);
    }).length;
  }

  function makeSummary(memory) {
    return {
      slotCount: SLOT_COUNT,
      updatedAt: memory.updatedAt,
      cores: Object.keys(CORE_LABELS).map((coreId) => {
        const slots = memory.cores[coreId] || [];

        return {
          id: coreId,
          label: CORE_LABELS[coreId],
          used: countUsed(slots),
          total: SLOT_COUNT
        };
      })
    };
  }

  function getBridge() {
    const bridge = window.CHT360Memory;

    return bridge && typeof bridge === "object" ? bridge : null;
  }

  function getSummary() {
    const bridge = getBridge();

    if (bridge && typeof bridge.summary === "function") {
      try {
        return bridge.summary();
      } catch (_) {
        /* Bezpečný lokální fallback níže. */
      }
    }

    return makeSummary(readMemoryFallback());
  }

  function resolveCore(value) {
    const text = normaliseText(value);

    if (text.includes("zem")) return "earth";
    if (text.includes("jazyk")) return "language";
    if (text.includes("hra")) return "game";
    if (text.includes("iphone") || text.includes("řízení") || text.includes("rizeni")) return "control";

    return Object.prototype.hasOwnProperty.call(CORE_LABELS, value)
      ? value
      : coreSelect.value;
  }

  function validSlotId(value) {
    const slotId = Number.parseInt(value, 10);

    return Number.isInteger(slotId) && slotId >= 1 && slotId <= SLOT_COUNT
      ? slotId
      : null;
  }

  function readSlot(coreId, slotId) {
    const bridge = getBridge();

    if (bridge && typeof bridge.readSlot === "function") {
      try {
        return bridge.readSlot({ coreId, slotId });
      } catch (_) {
        /* Bezpečný lokální fallback níže. */
      }
    }

    const memory = readMemoryFallback();
    const slot = memory.cores[coreId] && memory.cores[coreId][slotId - 1];

    return slot ? { ...slot } : null;
  }

  function writeSlot(coreId, slotId, content, name) {
    const bridge = getBridge();

    if (bridge && typeof bridge.writeSlot === "function") {
      return bridge.writeSlot({
        coreId,
        slotId,
        name,
        content,
        reason: "mluva"
      });
    }

    const memory = readMemoryFallback();
    const index = slotId - 1;
    const slot = memory.cores[coreId] && memory.cores[coreId][index];

    if (!slot) {
      throw new Error("Slot se nepodařilo najít.");
    }

    slot.name = String(name || "").trim() || "Slot " + slotId;
    slot.content = String(content || "");
    slot.updatedAt = new Date().toISOString();
    memory.updatedAt = slot.updatedAt;

    const serialised = JSON.stringify(memory);
    localStorage.setItem(CHT_MEMORY_KEY, serialised);
    localStorage.setItem(CHT_LEGACY_MEMORY_KEY, serialised);

    window.dispatchEvent(new CustomEvent("cht.memory.changed", {
      detail: {
        reason: "mluva",
        coreId,
        slotId,
        updatedAt: slot.updatedAt
      }
    }));

    return { ...slot };
  }

  function setStatus(text) {
    status.textContent = text;
  }

  function refreshSummary() {
    const info = getSummary();
    const active = (info.cores || []).find((core) => core.id === coreSelect.value)
      || (info.cores || [])[0];

    if (!active) {
      summary.textContent = "Paměť CHT zatím čeká na otevření.";
      return;
    }

    const allUsed = (info.cores || []).reduce((total, core) => total + Number(core.used || 0), 0);
    summary.textContent = active.label + " · " + active.used + "/" + active.total + " · celkem " + allUsed + " zápisů";
  }

  function timeLabel(timestamp) {
    try {
      return new Date(timestamp).toLocaleTimeString("cs-CZ", {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (_) {
      return "";
    }
  }

  function renderMessage(message) {
    const item = document.createElement("article");
    item.className = "mluva-dock__message mluva-dock__message--" + (message.role === "user" ? "user" : "bot");

    const body = document.createElement("span");
    body.textContent = String(message.text || "");
    item.append(body);

    const time = document.createElement("small");
    time.className = "mluva-dock__time";
    time.textContent = timeLabel(message.at || Date.now());
    item.append(time);

    messages.append(item);
  }

  function renderMessages() {
    messages.replaceChildren();

    data.messages.slice(-24).forEach(renderMessage);
    messages.scrollTop = messages.scrollHeight;
  }

  function addMessage(role, text) {
    const message = {
      role: role === "user" ? "user" : "bot",
      text: String(text || "").slice(0, 2400),
      at: Date.now()
    };

    data.messages.push(message);
    data.messages = data.messages.slice(-80);
    saveData();
    renderMessages();

    return message;
  }

  function findLesson(text) {
    const query = normaliseText(text);
    const exact = data.lessons.find((lesson) => normaliseText(lesson.trigger) === query);

    if (exact) return exact;

    return data.lessons.find((lesson) => {
      const trigger = normaliseText(lesson.trigger);
      return trigger.length >= 4 && query.includes(trigger);
    }) || null;
  }

  function saveLesson(trigger, reply) {
    const cleanTrigger = String(trigger || "").trim().slice(0, 220);
    const cleanReply = String(reply || "").trim().slice(0, 1800);
    const existing = data.lessons.find((lesson) => normaliseText(lesson.trigger) === normaliseText(cleanTrigger));

    if (existing) {
      existing.reply = cleanReply;
      existing.updatedAt = new Date().toISOString();
    } else {
      data.lessons.push({
        id: "lesson-" + Date.now(),
        trigger: cleanTrigger,
        reply: cleanReply,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        uses: 0
      });
      data.lessons = data.lessons.slice(-120);
    }

    saveData();
  }

  function saveNote(text) {
    data.notes.push({
      id: "note-" + Date.now(),
      text: String(text || "").trim().slice(0, 1800),
      createdAt: new Date().toISOString()
    });
    data.notes = data.notes.slice(-80);
    saveData();
  }

  function coreName(coreId) {
    return CORE_LABELS[coreId] || "Jazyk";
  }

  function answer(rawText) {
    const text = String(rawText || "").trim();
    const lower = normaliseText(text);

    if (!text) {
      return "Napiš mi jednu větu nebo příkaz.";
    }

    if (/^(pomoc|co umíš|co dokážeš|funkce)$/iu.test(lower)) {
      return [
        "Můžu pracovat s místní Pamětí CHT:",
        "• nauč se: otázka = odpověď",
        "• ulož do slotu 5: obsah",
        "• ulož do Jazyk slotu 5: obsah",
        "• přečti slot 5",
        "• stav",
        "• zapamatuj: krátká poznámka",
        "Všechno zůstává v tomto zařízení a prohlížeči."
      ].join("\n");
    }

    if (/^(stav|status|jaký je stav)$/iu.test(lower)) {
      const info = getSummary();
      const rows = (info.cores || []).map((core) => "• " + core.label + ": " + core.used + "/" + core.total);

      return [
        "Stav Mluvy CHT 360°‰.",
        rows.join("\n"),
        "• naučených odpovědí: " + data.lessons.length,
        "• místních poznámek: " + data.notes.length
      ].join("\n");
    }

    const teach = text.match(/^nauč\s*se\s*:\s*([\s\S]+?)\s*=\s*([\s\S]+)$/iu);

    if (teach) {
      saveLesson(teach[1], teach[2]);
      return "Uloženo do místní Mluvy.\nKdyž napíšeš „" + teach[1].trim() + "“, odpovím uloženou větou.";
    }

    const saveMatch = text.match(/^ulož(?:\s+do)?\s+(?:(země|zemi|jazyk|jazyka|hra|hry|iphone(?:\s*14)?|řízení|rizeni)\s+)?slotu?\s*(\d{1,3})\s*[:=]\s*([\s\S]+)$/iu);

    if (saveMatch) {
      const coreId = resolveCore(saveMatch[1] || coreSelect.value);
      const slotId = validSlotId(saveMatch[2]);

      if (!slotId) {
        return "Číslo slotu musí být od 1 do " + SLOT_COUNT + ".";
      }

      const saved = writeSlot(
        coreId,
        slotId,
        saveMatch[3].trim(),
        "Mluva · " + new Date().toLocaleDateString("cs-CZ")
      );

      refreshSummary();
      return "Uloženo do " + coreName(coreId) + " · slot " + slotId + ".\n" + (saved.name || "Slot " + slotId) + " je teď součástí Paměti CHT.";
    }

    const readMatch = text.match(/^přečti\s+(?:(země|zemi|jazyk|jazyka|hra|hry|iphone(?:\s*14)?|řízení|rizeni)\s+)?slot\s*(\d{1,3})$/iu);

    if (readMatch) {
      const coreId = resolveCore(readMatch[1] || coreSelect.value);
      const slotId = validSlotId(readMatch[2]);

      if (!slotId) {
        return "Číslo slotu musí být od 1 do " + SLOT_COUNT + ".";
      }

      const slot = readSlot(coreId, slotId);

      if (!slot || !String(slot.content || "").trim()) {
        return coreName(coreId) + " · slot " + slotId + " je zatím prázdný.";
      }

      return coreName(coreId) + " · slot " + slotId + " · " + (slot.name || "bez názvu") + "\n" + String(slot.content).slice(0, 1500);
    }

    const noteMatch = text.match(/^(zapamatuj|zapamatuj si)\s*:\s*([\s\S]+)$/iu);

    if (noteMatch) {
      saveNote(noteMatch[2]);
      return "Poznámku jsem uložila do místní Mluvy. Nezapíšu ji do slotu, dokud mi výslovně neřekneš kam.";
    }

    const lesson = findLesson(text);

    if (lesson) {
      lesson.uses = Number(lesson.uses || 0) + 1;
      lesson.updatedAt = new Date().toISOString();
      saveData();
      return lesson.reply;
    }

    return [
      "Tohle zatím nemám naučené.",
      "Můžeš mě to naučit třeba takto:",
      "nauč se: " + text.slice(0, 70) + " = tvoje odpověď",
      "Nebo zápis pošli rovnou do Paměti:",
      "ulož do slotu 1: " + text.slice(0, 90)
    ].join("\n");
  }

  function send(text) {
    const clean = String(text || "").trim();

    if (!clean) {
      input.focus();
      return;
    }

    addMessage("user", clean);

    try {
      addMessage("bot", answer(clean));
      setStatus("Mluva odpověděla lokálně. Paměť CHT zůstala v tomto prohlížeči.");
    } catch (error) {
      console.warn("[CHT Mluva] Zápis se nepodařil.", error);
      addMessage("bot", "Zápis se teď nepodařil. Obsah Paměti se nezměnil.");
      setStatus("Kontrola Paměti selhala; zkus to prosím ještě jednou.");
    }
  }

  function setOpen(open) {
    dock.dataset.open = open ? "true" : "false";
    toggle.setAttribute("aria-expanded", open ? "true" : "false");

    if (open) {
      refreshSummary();
      window.setTimeout(() => input.focus(), 100);
    }
  }

  function speakLastAnswer() {
    const last = data.messages.slice().reverse().find((message) => message.role === "bot");

    if (!last) {
      setStatus("Zatím nemám co přečíst.");
      return;
    }

    if (!("speechSynthesis" in window)) {
      setStatus("Tento prohlížeč teď hlasové čtení nepodporuje.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(last.text);
    utterance.lang = "cs-CZ";
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
    setStatus("Čtu poslední odpověď.");
  }

  function exportMluva() {
    const payload = {
      kind: "cht360-mluva-local-backup",
      exportedAt: new Date().toISOString(),
      summary: getSummary(),
      data
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "cht360-mluva-" + new Date().toISOString().slice(0, 10) + ".json";
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("Záloha Mluvy byla připravena ke stažení.");
  }

  toggle.addEventListener("click", () => {
    setOpen(dock.dataset.open !== "true");
  });

  closeButton.addEventListener("click", () => setOpen(false));

  coreSelect.addEventListener("change", () => {
    refreshSummary();
    setStatus("Mluva teď pracuje s jádrem " + coreName(coreSelect.value) + ".");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value;
    input.value = "";
    send(text);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  document.querySelectorAll("[data-mluva-prompt]").forEach((button) => {
    button.addEventListener("click", () => send(button.dataset.mluvaPrompt || ""));
  });

  speakButton.addEventListener("click", speakLastAnswer);
  exportButton.addEventListener("click", exportMluva);

  window.addEventListener("cht.memory.changed", refreshSummary);
  window.addEventListener("cht.memory.ready", refreshSummary);

  renderMessages();
  refreshSummary();
  setOpen(false);
}

