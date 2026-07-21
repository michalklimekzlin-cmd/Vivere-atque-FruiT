"use strict";

/*
 * Mluva CHT is deliberately a local layer. It only reads CHT's browser
 * storage, remembers explicit lessons, and opens a selected link after a
 * person clicks it. No conversation is sent to a model from this file.
 */

const HISTORY_KEY = "cht360_mluva_history_v1";
const LESSONS_KEY = "cht360_mluva_lessons_v1";
const MODELS_KEY = "cht360_mluva_models_v1";
const MEMORY_KEY = "cht360_pamet_v1";
const LEGACY_MEMORY_KEY = "vaft_pamet_v1";
const GLYPH_KEY = "cht360_glyph_workshop_v1";
const LOCKS_KEY = "cht360_slot_locks_v1";

const MAX_HISTORY = 120;
const MAX_LESSONS = 120;
const MODEL_LIMIT = 24;
const CANDIDATE_RENDER_LIMIT = 80;

const CORE_NAMES = Object.freeze({
  earth: "Země",
  language: "Jazyk a Glyphy",
  game: "Glyph pokojíčky",
  control: "ChybaŽrout · kontrola"
});

const elements = {
  connection: document.getElementById("connectionState"),
  refresh: document.getElementById("refreshContext"),
  overview: document.getElementById("memoryOverview"),
  modelCount: document.getElementById("modelCount"),
  modelList: document.getElementById("modelList"),
  scanModels: document.getElementById("scanModels"),
  lessonList: document.getElementById("lessonList"),
  openLesson: document.getElementById("openLesson"),
  exportLearning: document.getElementById("exportLearning"),
  conversation: document.getElementById("conversation"),
  form: document.getElementById("talkForm"),
  input: document.getElementById("talkInput"),
  speak: document.getElementById("speakLast"),
  teachFromQuick: document.getElementById("teachFromQuick"),
  modelDialog: document.getElementById("modelDialog"),
  modelSearch: document.getElementById("modelSearch"),
  modelCandidateInfo: document.getElementById("modelCandidateInfo"),
  candidateList: document.getElementById("candidateList"),
  saveModels: document.getElementById("saveModels"),
  lessonDialog: document.getElementById("lessonDialog"),
  lessonTrigger: document.getElementById("lessonTrigger"),
  lessonReply: document.getElementById("lessonReply"),
  saveLesson: document.getElementById("saveLesson")
};

let context = readContext();
let history = loadHistory();
let lessons = loadLessons();
let models = loadModels();
let candidates = [];
let selectedCandidateIds = new Set();

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

    context = readContext();
    pushMessage("user", message);
    pushMessage("assistant", createAnswer(message, context));
    elements.input.value = "";
    renderAll();
    elements.input.focus();
  });

  document.querySelectorAll("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      const prompt = String(button.dataset.prompt || "").trim();
      if (!prompt) return;
      elements.input.value = prompt;
      if (typeof elements.form.requestSubmit === "function") {
        elements.form.requestSubmit();
      } else {
        elements.form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      }
    });
  });

  elements.refresh.addEventListener("click", () => {
    context = readContext();
    pushMessage("system", "Místní stav CHT je znovu načtený. Nic se neposlalo ven.");
    renderAll();
  });

  elements.scanModels.addEventListener("click", openModelDialog);
  elements.openLesson.addEventListener("click", openLessonDialog);
  elements.teachFromQuick.addEventListener("click", openLessonDialog);
  elements.exportLearning.addEventListener("click", exportLearning);
  elements.saveModels.addEventListener("click", saveSelectedModels);
  elements.saveLesson.addEventListener("click", saveLesson);
  elements.speak.addEventListener("click", speakLastAnswer);

  elements.modelSearch.addEventListener("input", renderCandidateList);
  elements.candidateList.addEventListener("change", handleCandidateChange);

  document.addEventListener("click", (event) => {
    const control = event.target.closest("[data-action]");
    if (!control) return;

    const action = String(control.dataset.action || "");
    if (action === "close-models") closeDialog(elements.modelDialog);
    if (action === "close-lesson") closeDialog(elements.lessonDialog);
    if (action === "open-model") openModel(String(control.dataset.id || ""));
    if (action === "remove-model") removeModel(String(control.dataset.id || ""));
    if (action === "delete-lesson") deleteLesson(String(control.dataset.id || ""));
  });

  window.addEventListener("online", renderConnection);
  window.addEventListener("offline", renderConnection);

  window.addEventListener("storage", (event) => {
    const key = String(event.key || "");
    if ([MEMORY_KEY, LEGACY_MEMORY_KEY, GLYPH_KEY, LOCKS_KEY].includes(key)) {
      context = readContext();
      renderOverview();
      return;
    }

    if (key === LESSONS_KEY) {
      lessons = loadLessons();
      renderLessons();
      return;
    }

    if (key === MODELS_KEY) {
      models = loadModels();
      renderModels();
    }
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

function getCoreSlots(memory, id) {
  const core = memory?.cores?.[id];
  if (Array.isArray(core)) return core;
  if (Array.isArray(core?.slots)) return core.slots;
  return [];
}

function getCoreTotal(memory, slots) {
  const declared = Number(memory?.slotsPerCore || memory?.capacityPerCore || memory?.slotLimit);
  if (Number.isFinite(declared) && declared > 0) return Math.floor(declared);
  return slots.length || 240;
}

function slotHasContent(slot, index) {
  const title = String(slot?.name || slot?.title || "").trim();
  const content = String(slot?.content || slot?.text || "").trim();
  return Boolean(content || (title && title !== "Slot " + (index + 1)));
}

function readContext() {
  const memory = readJson(MEMORY_KEY) || readJson(LEGACY_MEMORY_KEY);
  const cores = Object.entries(CORE_NAMES).map(([id, name]) => {
    const slots = getCoreSlots(memory, id);
    const usedSlots = slots.filter(slotHasContent);
    const latest = usedSlots
      .slice()
      .sort((first, second) => String(second?.updatedAt || "").localeCompare(String(first?.updatedAt || "")))[0] || null;

    return {
      id,
      name,
      slots,
      used: usedSlots.length,
      total: getCoreTotal(memory, slots),
      latest: latest
        ? String(latest.name || latest.title || "slot").slice(0, 45)
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
    memory,
    cores,
    totalUsed: cores.reduce((total, core) => total + core.used, 0),
    totalCapacity: cores.reduce((total, core) => total + core.total, 0),
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
      text: String(message.text || "").slice(0, 1800),
      at: String(message.at || new Date().toISOString())
    }))
    .slice(-MAX_HISTORY);
}

function loadLessons() {
  const saved = readJson(LESSONS_KEY);
  const savedLessons = Array.isArray(saved?.lessons) ? saved.lessons : [];

  return savedLessons
    .map((lesson) => ({
      id: String(lesson?.id || ""),
      trigger: String(lesson?.trigger || "").trim().slice(0, 120),
      reply: String(lesson?.reply || "").trim().slice(0, 1800),
      createdAt: String(lesson?.createdAt || ""),
      updatedAt: String(lesson?.updatedAt || "")
    }))
    .filter((lesson) => lesson.id && lesson.trigger && lesson.reply)
    .slice(-MAX_LESSONS);
}

function loadModels() {
  const saved = readJson(MODELS_KEY);
  const savedModels = Array.isArray(saved?.models) ? saved.models : [];
  const known = new Set();

  return savedModels
    .map((model) => ({
      id: String(model?.id || ""),
      name: String(model?.name || "Napojení z CHT").trim().slice(0, 140),
      url: normaliseUrl(model?.url),
      coreName: String(model?.coreName || "CHT").trim().slice(0, 100),
      slotName: String(model?.slotName || "slot").trim().slice(0, 120),
      addedAt: String(model?.addedAt || "")
    }))
    .filter((model) => model.id && model.url && !known.has(model.id) && known.add(model.id))
    .slice(0, MODEL_LIMIT);
}

function saveHistory() {
  return writeJson(HISTORY_KEY, {
    version: 2,
    updatedAt: new Date().toISOString(),
    messages: history.slice(-MAX_HISTORY)
  });
}

function saveLessons() {
  return writeJson(LESSONS_KEY, {
    version: 1,
    updatedAt: new Date().toISOString(),
    lessons: lessons.slice(-MAX_LESSONS)
  });
}

function saveModels() {
  return writeJson(MODELS_KEY, {
    version: 1,
    updatedAt: new Date().toISOString(),
    models: models.slice(0, MODEL_LIMIT)
  });
}

function ensureGreeting() {
  if (history.length) return;

  pushMessage(
    "assistant",
    "Jsem místní učící vrstva Mluvy CHT. Napiš „stav“, „modely“, „nápad“ nebo „pomoc“. Když chceš, ulož mi vlastní lekci — zůstane jen v tomto prohlížeči."
  );
}

function pushMessage(role, text) {
  history.push({
    role,
    text: String(text || "").slice(0, 1800),
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
    .replace(/\s+/gu, " ")
    .trim();
}

function normaliseUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    return /^https?:$/i.test(url.protocol) ? url.href : "";
  } catch (error) {
    return "";
  }
}

function makeId(prefix) {
  if (window.crypto?.randomUUID) return prefix + "-" + window.crypto.randomUUID();
  return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

function findLesson(input) {
  const command = normalise(input);
  if (command.length < 2) return null;

  return lessons
    .map((lesson) => ({ ...lesson, match: normalise(lesson.trigger) }))
    .filter((lesson) => lesson.match.length >= 2 && command.includes(lesson.match))
    .sort((first, second) => second.match.length - first.match.length)[0] || null;
}

function createAnswer(input, nextContext) {
  const learned = findLesson(input);
  if (learned) {
    return [
      "Používám tvoji místní lekci pro: „" + learned.trigger + "“.",
      learned.reply
    ].join("\n\n");
  }

  const command = normalise(input);

  if (/\b(stav|jak se mame|jak se mas|prehled|souhrn)\b/u.test(command)) {
    return makeStatusAnswer(nextContext);
  }

  if (/\b(model|modely|ai|napojeni|napojení)\b/u.test(command)) {
    return makeModelsAnswer();
  }

  if (/\b(nauc|uč|lekc|pamatuj)\b/u.test(command)) {
    return [
      "Můžu se naučit místní lekci: krátký spouštěč a tvoji odpověď nebo pravidlo.",
      "Ťukni na „Naučit Mluvu“ nebo „Nová lekce“. Nic nevymýšlím ani neukládám samo."
    ].join("\n\n");
  }

  if (/\b(napad|napady|inspirace|vymysli|vymyslet)\b/u.test(command)) {
    return makeIdeas(nextContext);
  }

  if (/\b(bubinek|bubinky|glyph|glyphy|znak|znaky)\b/u.test(command)) {
    return makeGlyphAnswer(nextContext);
  }

  if (/\b(chyba|chybo|oprav|sken|kontrol)\b/u.test(command)) {
    return [
      "ChybaŽrout umí prověřit místní části CHT, ale Mluva sama nic neopravuje ani nepřepisuje.",
      "Nejdřív si udělej zálohu a pak otevři kontrolu. Tady ti můžu vytvořit lekci pro bezpečný postup."
    ].join("\n\n");
  }

  if (/\b(pamet|paměť|slot|jadro|jádro|jadra|jádra)\b/u.test(command)) {
    return makeMemoryAnswer(nextContext);
  }

  if (/\b(pomoc|umis|umíš|co dokazes|co dokážeš|prikaz|příkaz)\b/u.test(command)) {
    return [
      "Offline umím:",
      "• přečíst stav jader, Glyphů a zámků („stav“),",
      "• navrhnout tři další kroky („nápad“),",
      "• používat lekce, které mi sám uložíš,",
      "• ukázat a ručně otevřít tebou vybraná napojení z CHT,",
      "• vyexportovat jen lekce a výběr modelů jako zálohu.",
      "",
      "Nemám skrytý přístup k iPhonu, ostatním aplikacím ani ke všem AI. Rozhovor nikam neposílám."
    ].join("\n");
  }

  return [
    "Rozumím směru: „" + String(input || "").slice(0, 160) + "“.",
    "V místní verzi nejlépe pracuji s příkazy stav, modely, nápad, Paměť, Bubínky nebo pomoc.",
    "Pokud z toho chceš stálé pravidlo, ulož mi ho jako lekci — pak ho příště použiji jen tady na zařízení."
  ].join("\n\n");
}

function makeStatusAnswer(nextContext) {
  const coreLine = nextContext.cores
    .map((core) => core.name + " " + core.used + "/" + core.total)
    .join(" · ");

  return [
    "CHT má obsazeno " + nextContext.totalUsed + " slotů z " + nextContext.totalCapacity + ".",
    coreLine + ".",
    "Glyphy: " + nextContext.glyphs.active + " na ploše, " + nextContext.glyphs.archived + " odloženo, celkem " + nextContext.glyphs.total + ".",
    "Zámkové Bubínky: " + nextContext.locks + " aktivních zámků.",
    "Mluva: " + lessons.length + " lekcí a " + models.length + " vybraných cest k AI.",
    nextContext.hasMemory
      ? "Paměť je čitelná z tohoto zařízení."
      : "Zatím nevidím uloženou Paměť — po prvním uložení CHT se zde objeví."
  ].join("\n");
}

function makeModelsAnswer() {
  if (!models.length) {
    return [
      "Zatím nemáš vybrané žádné napojení.",
      "Ťukni na „Vybrat z CHT“. Mluva přečte jen odkazy uložené ve slotech a ty označíš ty, které chceš mít po ruce."
    ].join("\n\n");
  }

  const names = models.slice(0, 6).map((model) => model.name).join(" · ");
  const rest = models.length > 6 ? " a další " + (models.length - 6) : "";
  return [
    "Máš vybráno " + models.length + " cest: " + names + rest + ".",
    "Mluva je sama neotevře a nepošle jim tento rozhovor. Otevřeš je až ručně tlačítkem „Otevřít“."
  ].join("\n\n");
}

function makeMemoryAnswer(nextContext) {
  const least = nextContext.cores.slice().sort((first, second) => first.used - second.used)[0];
  const latest = nextContext.cores
    .filter((core) => core.used)
    .map((core) => core.name + ": " + core.latest)
    .join(" · ");

  return [
    "Paměť drží " + nextContext.totalUsed + " obsazených slotů z " + nextContext.totalCapacity + ".",
    least
      ? "Nejvíc prostoru má teď jádro " + least.name + " (" + least.used + "/" + least.total + ")."
      : "",
    latest ? "Poslední pojmenované stopy: " + latest + "." : "Zatím nejsou žádné pojmenované stopy.",
    "Mluva pouze čte tento stav. Vlastní lekce ukládá odděleně, takže Paměť CHT nepřepisuje."
  ].filter(Boolean).join("\n\n");
}

function makeGlyphAnswer(nextContext) {
  return [
    "Na ploše je " + nextContext.glyphs.active + " Glyphů; " + nextContext.glyphs.archived + " čeká v odložených Bubíncích.",
    "Mluva může tento stav vysvětlit nebo si z něj nechat uložit pravidlo. Do Dílny Glyphů ale sama nic nezapisuje.",
    "Otevři „Dílnu Glyphů“, pokud chceš vytvořit nebo vrátit konkrétní znak."
  ].join("\n\n");
}

function makeIdeas(nextContext) {
  const ordered = nextContext.cores.slice().sort((first, second) => first.used - second.used);
  const lightest = ordered[0];
  const next = ordered[1] || ordered[0];
  const glyphAction = nextContext.glyphs.archived
    ? "Vrať jeden odložený Glyph na plochu a propojíš ho se slotem v jádru " + lightest.name + "."
    : "Vytvoř jeden krátký Glyph pro jádro " + lightest.name + " a dej mu konkrétní účel v jednom slotu.";

  return [
    "1. " + glyphAction,
    "2. V jádru " + lightest.name + " založ malý startovní slot s jedinou větou (využito " + lightest.used + "/" + lightest.total + ").",
    "3. Ulož Mluvě lekci typu „večerní kontrola“ s postupem, který chceš opakovat.",
    "Vedlejší směr: " + next.name + " je další nejvolnější jádro; může nést slovník nebo pravidla Mluvy."
  ].join("\n\n");
}

function extractUrls(slot) {
  const values = [slot?.url, slot?.href, slot?.link, slot?.website, slot?.endpoint];
  const content = String(slot?.content || slot?.text || "").trim();

  if (content) {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object") {
        values.push(parsed.url, parsed.href, parsed.link, parsed.website, parsed.endpoint);
      }
    } catch (error) {
      // A normal text slot can still contain one or more visible links.
    }

    const matches = content.match(/https?:\/\/[^\s<>"']+/gu) || [];
    values.push(...matches);
  }

  return [...new Set(values.map(normaliseUrl).filter(Boolean))];
}

function hostFromUrl(url) {
  try {
    return new URL(url).host.replace(/^www\./i, "");
  } catch (error) {
    return url;
  }
}

function collectModelCandidates(nextContext) {
  const found = [];
  const seen = new Set();

  nextContext.cores.forEach((core) => {
    core.slots.forEach((slot, index) => {
      const slotName = String(slot?.name || slot?.title || "Slot " + (index + 1)).trim().slice(0, 120);
      extractUrls(slot).forEach((url, urlIndex) => {
        const id = core.id + ":" + index + ":" + url;
        if (seen.has(id)) return;
        seen.add(id);
        found.push({
          id,
          name: slotName && !/^slot\s+\d+$/iu.test(slotName)
            ? slotName
            : hostFromUrl(url),
          url,
          coreId: core.id,
          coreName: core.name,
          slotName,
          order: index,
          urlIndex
        });
      });
    });
  });

  return found.sort((first, second) => {
    const coreOrder = first.coreName.localeCompare(second.coreName, "cs-CZ");
    return coreOrder || first.order - second.order || first.urlIndex - second.urlIndex;
  });
}

function openModelDialog() {
  context = readContext();
  candidates = collectModelCandidates(context);
  selectedCandidateIds = new Set(models.map((model) => model.id));
  elements.modelSearch.value = "";
  renderCandidateList();
  openDialog(elements.modelDialog);
  window.setTimeout(() => elements.modelSearch.focus(), 80);
}

function renderCandidateList() {
  const query = normalise(elements.modelSearch.value);
  const matching = candidates.filter((candidate) => {
    const searchable = normalise(candidate.name + " " + candidate.coreName + " " + candidate.slotName + " " + candidate.url);
    return !query || searchable.includes(query);
  });
  const visible = matching.slice(0, CANDIDATE_RENDER_LIMIT);

  elements.candidateList.textContent = "";
  const selectionText = selectedCandidateIds.size + " / " + MODEL_LIMIT + " označeno";

  if (!candidates.length) {
    elements.modelCandidateInfo.textContent = "V Paměti CHT teď nevidím žádný platný odkaz http/https. Neznamená to, že data chybí — jen v nich není cesta, kterou lze bezpečně otevřít.";
    elements.candidateList.append(createEmptyState("Až uložíš odkaz do některého slotu CHT, objeví se zde při dalším výběru."));
    return;
  }

  elements.modelCandidateInfo.textContent = "Nalezeno " + candidates.length + " cest · " + selectionText + (matching.length > visible.length ? " · ukazuji prvních " + visible.length + ", zúž hledáním" : "");

  if (!visible.length) {
    elements.candidateList.append(createEmptyState("Pro tento hledaný výraz tu zatím není žádné napojení."));
    return;
  }

  visible.forEach((candidate) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    const copy = document.createElement("span");
    const name = document.createElement("strong");
    const detail = document.createElement("small");

    label.className = "candidate-item";
    checkbox.type = "checkbox";
    checkbox.checked = selectedCandidateIds.has(candidate.id);
    checkbox.dataset.candidateId = candidate.id;
    name.textContent = candidate.name;
    detail.textContent = candidate.coreName + " · " + candidate.slotName + " · " + hostFromUrl(candidate.url);
    copy.append(name, detail);
    label.append(checkbox, copy);
    elements.candidateList.append(label);
  });
}

function handleCandidateChange(event) {
  const checkbox = event.target;
  if (!(checkbox instanceof HTMLInputElement) || checkbox.type !== "checkbox") return;
  const id = String(checkbox.dataset.candidateId || "");
  if (!id) return;

  if (checkbox.checked) {
    if (!selectedCandidateIds.has(id) && selectedCandidateIds.size >= MODEL_LIMIT) {
      checkbox.checked = false;
      elements.modelCandidateInfo.textContent = "Vybraný seznam má místo pro " + MODEL_LIMIT + " cest. Nejdřív jednu odznač.";
      return;
    }
    selectedCandidateIds.add(id);
  } else {
    selectedCandidateIds.delete(id);
  }

  renderCandidateList();
}

function saveSelectedModels() {
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const retained = models.filter((model) => selectedCandidateIds.has(model.id) && !byId.has(model.id));
  const chosen = candidates
    .filter((candidate) => selectedCandidateIds.has(candidate.id))
    .map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      url: candidate.url,
      coreName: candidate.coreName,
      slotName: candidate.slotName,
      addedAt: new Date().toISOString()
    }));

  models = [...retained, ...chosen].slice(0, MODEL_LIMIT);
  if (!saveModels()) {
    pushMessage("system", "Výběr se nepodařilo uložit do místního úložiště tohoto prohlížeče.");
  } else {
    pushMessage("system", "Uložen výběr " + models.length + " cest. Mluva je sama neotevře.");
  }
  closeDialog(elements.modelDialog);
  renderModels();
  renderConversation();
}

function renderModels() {
  elements.modelCount.textContent = models.length + " / " + MODEL_LIMIT;
  elements.modelList.textContent = "";

  if (!models.length) {
    elements.modelList.append(createEmptyState("Zatím žádný výběr. „Vybrat z CHT“ jen načte odkazy uložené ve slotech; rozhodnutí zůstává na tobě."));
    return;
  }

  models.forEach((model) => {
    const item = document.createElement("article");
    const copy = document.createElement("div");
    const name = document.createElement("strong");
    const detail = document.createElement("small");
    const actions = document.createElement("div");
    const open = document.createElement("button");
    const remove = document.createElement("button");

    item.className = "model-item";
    name.textContent = model.name;
    detail.textContent = model.coreName + " · " + model.slotName + " · " + hostFromUrl(model.url);
    copy.append(name, detail);

    actions.className = "model-actions";
    open.type = "button";
    open.className = "model-action";
    open.dataset.action = "open-model";
    open.dataset.id = model.id;
    open.textContent = "Otevřít";
    remove.type = "button";
    remove.className = "model-action";
    remove.dataset.action = "remove-model";
    remove.dataset.id = model.id;
    remove.textContent = "Odebrat";
    actions.append(open, remove);
    item.append(copy, actions);
    elements.modelList.append(item);
  });
}

function openModel(id) {
  const model = models.find((entry) => entry.id === id);
  const url = normaliseUrl(model?.url);
  if (!url) {
    pushMessage("system", "Tato cesta už nemá platný odkaz. Můžeš ji z výběru odebrat.");
    renderConversation();
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

function removeModel(id) {
  const model = models.find((entry) => entry.id === id);
  if (!model) return;
  if (!window.confirm("Odebrat „" + model.name + "“ jen z výběru Mluvy? Odkaz v CHT zůstane beze změny.")) return;

  models = models.filter((entry) => entry.id !== id);
  saveModels();
  renderModels();
}

function openLessonDialog() {
  elements.lessonTrigger.value = "";
  elements.lessonReply.value = "";
  openDialog(elements.lessonDialog);
  window.setTimeout(() => elements.lessonTrigger.focus(), 80);
}

function saveLesson() {
  const trigger = String(elements.lessonTrigger.value || "").trim();
  const reply = String(elements.lessonReply.value || "").trim();

  if (trigger.length < 2 || reply.length < 2) {
    pushMessage("system", "Lekce potřebuje krátký spouštěč i odpověď nebo pravidlo.");
    renderConversation();
    return;
  }

  const now = new Date().toISOString();
  lessons.push({
    id: makeId("lekce"),
    trigger: trigger.slice(0, 120),
    reply: reply.slice(0, 1800),
    createdAt: now,
    updatedAt: now
  });
  lessons = lessons.slice(-MAX_LESSONS);

  if (!saveLessons()) {
    lessons = loadLessons();
    pushMessage("system", "Lekci se nepodařilo uložit do místního úložiště.");
  } else {
    pushMessage("system", "Lekce „" + trigger.slice(0, 80) + "“ je uložená jen tady v Mluvě.");
  }

  closeDialog(elements.lessonDialog);
  renderLessons();
  renderConversation();
}

function renderLessons() {
  elements.lessonList.textContent = "";

  if (!lessons.length) {
    elements.lessonList.append(createEmptyState("Ještě nemá žádnou lekci. Začni jednou malou větou, kterou chceš mít při ruce."));
    return;
  }

  lessons.slice().reverse().forEach((lesson) => {
    const item = document.createElement("article");
    const copy = document.createElement("div");
    const trigger = document.createElement("strong");
    const reply = document.createElement("small");
    const remove = document.createElement("button");

    item.className = "lesson-item";
    trigger.textContent = lesson.trigger;
    reply.textContent = lesson.reply;
    copy.append(trigger, reply);
    remove.type = "button";
    remove.className = "lesson-delete";
    remove.dataset.action = "delete-lesson";
    remove.dataset.id = lesson.id;
    remove.textContent = "Smazat";
    item.append(copy, remove);
    elements.lessonList.append(item);
  });
}

function deleteLesson(id) {
  const lesson = lessons.find((entry) => entry.id === id);
  if (!lesson) return;
  if (!window.confirm("Smazat místní lekci „" + lesson.trigger + "“? Paměť CHT ani historie konverzace se tím nezmění.")) return;

  lessons = lessons.filter((entry) => entry.id !== id);
  saveLessons();
  renderLessons();
}

function exportLearning() {
  const payload = {
    format: "Mluva CHT · místní učení",
    version: 1,
    exportedAt: new Date().toISOString(),
    note: "Obsahuje jen explicitní lekce a výběr cest. Neobsahuje Paměť CHT ani historii rozhovorů.",
    lessons,
    models
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);

  link.href = URL.createObjectURL(blob);
  link.download = "mluva-cht-uceni-" + date + ".json";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  pushMessage("system", "Připravila jsem místní zálohu lekcí a výběru modelů.");
  renderConversation();
}

function createEmptyState(text) {
  const state = document.createElement("div");
  state.className = "empty-state";
  state.textContent = text;
  return state;
}

function renderAll() {
  renderConnection();
  renderOverview();
  renderModels();
  renderLessons();
  renderConversation();
}

function renderConnection() {
  const online = navigator.onLine;
  elements.connection.className = "state-pill " + (online ? "is-ready" : "is-offline");
  elements.connection.textContent = online ? "lokální režim" : "offline";
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
    context.glyphs.archived ? context.glyphs.archived + " odloženo" : "vše je na ploše"
  ));

  elements.overview.append(createTile(
    "Mluva",
    lessons.length + " lekcí",
    models.length ? models.length + " cest připraveno" : "čeká na první lekci"
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
  const last = history.slice().reverse().find((message) => message.role === "assistant");
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
  utterance.rate = 0.96;
  window.speechSynthesis.speak(utterance);
}

function openDialog(dialog) {
  if (typeof dialog.showModal === "function") {
    if (!dialog.open) dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

function closeDialog(dialog) {
  if (typeof dialog.close === "function" && dialog.open) {
    dialog.close();
  } else {
    dialog.removeAttribute("open");
  }
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
