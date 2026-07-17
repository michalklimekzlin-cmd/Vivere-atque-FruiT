"use strict";

const APP_NAME = "Glyph CHT 360°‰";
const STORAGE_KEY = "cht360_glyph_workshop_v1";
const BRIDGE_CONTEXT_KEY = "cht360_glyph_context_v1";
const BRIDGE_TRANSFER_KEY = "cht360_glyph_transfer_v1";
const MAX_CUSTOM_TOKENS = 180;
const MAX_SMALL_TOKEN_GRAPHEMES = 2;
const MAX_WORD_GRAPHEMES = 80;
const MAX_BLOCKS = 60;
const MAX_VISIBLE_BLOCKS = 24;
const MODES = Object.freeze(["single", "double", "word"]);
const STYLES = Object.freeze(["ring", "bracket", "rail", "capsule"]);
const DEFAULT_KEYBOARD_LAYOUT = "cs-at";

const COMMON_TOKENS = Object.freeze([
  ".", ",", ":", ";", "!", "?", "…",
  "°", "‰", "•", "·", "_", "-", "+", "=",
  "/", "\\", "(", ")", "[", "]", "{", "}",
  "<", ">", "←", "→", "↑", "↓", "×", "÷",
  "∞", "○", "□", "△", "◇", "☆", "★"
]);

const KEYBOARD_LAYOUTS = Object.freeze({
  "cs-at": Object.freeze({
    label: "Česko/Rakouská · alfanumerická",
    description: "Česká abeceda, rakouská němčina, čísla a základní znaky. Je to sada této PWA; nemění nastavení klávesnice iPhonu.",
    tokens: Object.freeze(unique([
      ...glyphsOf("ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
      ...glyphsOf("abcdefghijklmnopqrstuvwxyz"),
      ...glyphsOf("ÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ"),
      ...glyphsOf("áčďéěíňóřšťúůýž"),
      ...glyphsOf("ÄÖÜẞäöüß"),
      ...glyphsOf("0123456789"),
      ...COMMON_TOKENS
    ]))
  }),
  cs: Object.freeze({
    label: "Čeština",
    description: "Česká alfanumerická sada včetně všech běžných háčků a čárek.",
    tokens: Object.freeze(unique([
      ...glyphsOf("ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
      ...glyphsOf("abcdefghijklmnopqrstuvwxyz"),
      ...glyphsOf("ÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ"),
      ...glyphsOf("áčďéěíňóřšťúůýž"),
      ...glyphsOf("0123456789"),
      ...COMMON_TOKENS
    ]))
  }),
  "de-at": Object.freeze({
    label: "Deutsch (Österreich)",
    description: "Německá sada pro Rakousko: Ä, Ö, Ü, ß a čísla.",
    tokens: Object.freeze(unique([
      ...glyphsOf("ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
      ...glyphsOf("abcdefghijklmnopqrstuvwxyz"),
      ...glyphsOf("ÄÖÜẞäöüß"),
      ...glyphsOf("0123456789"),
      ...COMMON_TOKENS
    ]))
  }),
  latin: Object.freeze({
    label: "Latin / English",
    description: "Čistá latinka, čísla a společné znaky pro rychlé skládání.",
    tokens: Object.freeze(unique([
      ...glyphsOf("ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
      ...glyphsOf("abcdefghijklmnopqrstuvwxyz"),
      ...glyphsOf("0123456789"),
      ...COMMON_TOKENS
    ]))
  }),
  cyrillic: Object.freeze({
    label: "Cyrilice",
    description: "Ruská a ukrajinská cyrilice spolu s čísly a společnými znaky.",
    tokens: Object.freeze(unique([
      ...glyphsOf("АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ"),
      ...glyphsOf("абвгдеёжзийклмнопрстуфхцчшщъыьэюя"),
      ...glyphsOf("ҐЄІЇґєії"),
      ...glyphsOf("0123456789"),
      ...COMMON_TOKENS
    ]))
  }),
  greek: Object.freeze({
    label: "Řecká abeceda",
    description: "Řecké znaky pro vlastní Glyphy, matematiku a názvy.",
    tokens: Object.freeze(unique([
      ...glyphsOf("ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ"),
      ...glyphsOf("αβγδεζηθικλμνξοπρστυφχψω"),
      ...glyphsOf("0123456789"),
      ...COMMON_TOKENS
    ]))
  }),
  symbols: Object.freeze({
    label: "Čísla a symboly",
    description: "Čísla, šipky, závorky a znaky CHT pro práci bez písmen.",
    tokens: Object.freeze(unique([
      ...glyphsOf("0123456789"),
      ...COMMON_TOKENS,
      "ア", "☉", "⌁", "⌘", "⌂", "⌫", "✓", "✦"
    ]))
  })
});

const BASE_TOKENS = KEYBOARD_LAYOUTS[DEFAULT_KEYBOARD_LAYOUT].tokens;
const CORE_NAMES = Object.freeze({
  earth: "Země",
  language: "Jazyk",
  game: "Hra",
  control: "Řízení"
});

const elements = {
  titleGlyphs: document.getElementById("titleGlyphs"),
  newLineForm: document.getElementById("newLineForm"),
  newText: document.getElementById("newText"),
  newModeChoices: document.getElementById("newModeChoices"),
  newStyleChoices: document.getElementById("newStyleChoices"),
  customToken: document.getElementById("customToken"),
  addToken: document.getElementById("addToken"),
  keyboardLayout: document.getElementById("keyboardLayout"),
  keyboardDescription: document.getElementById("keyboardDescription"),
  tokenShelf: document.getElementById("tokenShelf"),
  workspace: document.getElementById("workspace"),
  workspaceMessage: document.getElementById("workspaceMessage"),
  blockCount: document.getElementById("blockCount"),
  storageState: document.getElementById("storageState"),
  arrangeBlocks: document.getElementById("arrangeBlocks"),
  hideAllBlocks: document.getElementById("hideAllBlocks"),
  archivePanel: document.getElementById("archivePanel"),
  archiveCount: document.getElementById("archiveCount"),
  archiveList: document.getElementById("archiveList"),
  emptySelection: document.getElementById("emptySelection"),
  inspectorForm: document.getElementById("inspectorForm"),
  selectedBadge: document.getElementById("selectedBadge"),
  selectedName: document.getElementById("selectedName"),
  selectedModeChoices: document.getElementById("selectedModeChoices"),
  selectedStyleChoices: document.getElementById("selectedStyleChoices"),
  selectedCellInfo: document.getElementById("selectedCellInfo"),
  selectedCellValue: document.getElementById("selectedCellValue"),
  applyCellValue: document.getElementById("applyCellValue"),
  removeSelectedDrum: document.getElementById("removeSelectedDrum"),
  toggleBlock: document.getElementById("toggleBlock"),
  duplicateBlock: document.getElementById("duplicateBlock"),
  deleteBlock: document.getElementById("deleteBlock"),
  undoAction: document.getElementById("undoAction"),
  exportAction: document.getElementById("exportAction"),
  importInput: document.getElementById("importInput"),
  transferCard: document.getElementById("transferCard"),
  transferTarget: document.getElementById("transferTarget"),
  transferMode: document.getElementById("transferMode"),
  sendToCht: document.getElementById("sendToCht"),
  returnToCht: document.getElementById("returnToCht")
};

let data = loadData();

const ui = {
  newMode: "single",
  newStyle: "ring",
  selectedCell: null,
  history: [],
  message: "Dotkni se bubínku a otoč ho nahoru nebo dolů. Za horní proužek přesuneš celý řádek.",
  storagePersistent: false,
  storageFailed: false,
  bridgeTarget: readBridgeTarget()
};

initialize();

function initialize() {
  ensureSelection();
  bindEvents();
  renderAll();
  requestPersistentStorage();
  registerServiceWorker();
}

function bindEvents() {
  elements.newLineForm.addEventListener("submit", createNewBlock);
  elements.newModeChoices.addEventListener("click", chooseNewMode);
  elements.newStyleChoices.addEventListener("click", chooseNewStyle);
  elements.selectedModeChoices.addEventListener("click", chooseSelectedMode);
  elements.selectedStyleChoices.addEventListener("click", chooseSelectedStyle);
  elements.addToken.addEventListener("click", addCustomToken);
  elements.keyboardLayout.addEventListener("change", changeKeyboardLayout);

  elements.customToken.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addCustomToken();
  });

  elements.tokenShelf.addEventListener("click", applyShelfToken);
  elements.selectedName.addEventListener("change", updateSelectedName);
  elements.applyCellValue.addEventListener("click", applyCellValue);
  elements.removeSelectedDrum.addEventListener("click", removeSelectedDrum);
  elements.toggleBlock.addEventListener("click", toggleSelectedBlock);
  elements.duplicateBlock.addEventListener("click", duplicateSelectedBlock);
  elements.deleteBlock.addEventListener("click", deleteSelectedBlock);
  elements.arrangeBlocks.addEventListener("click", arrangeVisibleBlocks);
  elements.hideAllBlocks.addEventListener("click", hideAllBlocks);
  elements.undoAction.addEventListener("click", undo);
  elements.exportAction.addEventListener("click", exportGlyphs);
  elements.importInput.addEventListener("change", importGlyphs);
  elements.sendToCht.addEventListener("click", sendSelectedBlockToCht);

  window.addEventListener("storage", (event) => {
    if (event.key !== BRIDGE_CONTEXT_KEY) return;
    ui.bridgeTarget = readBridgeTarget();
    renderBridge();
  });
}

function createDefaultData() {
  const title = createBlock("Glyph CHT 360°‰", "single", "ring", 7, 8, "Název Glyph CHT");
  const earth = createBlock("Země Paměť", "double", "bracket", 11, 43, "Země Paměť");
  const slot = createBlock("Slot 1", "single", "rail", 59, 27, "Slot 1");
  const language = createBlock("Jazyk 4/70", "double", "capsule", 41, 68, "Jazyk 4/70");

  return {
    version: 2,
    titleBlockId: title.id,
    selectedBlockId: title.id,
    keyboardLayout: DEFAULT_KEYBOARD_LAYOUT,
    customTokens: [],
    blocks: [title, earth, slot, language],
    updatedAt: new Date().toISOString()
  };
}

function createBlock(text, mode, style, x, y, name) {
  const cleanMode = MODES.includes(mode) ? mode : "single";

  return {
    id: makeId("block"),
    name: String(name || text || "Glyph").slice(0, 80),
    mode: cleanMode,
    style: STYLES.includes(style) ? style : "ring",
    active: true,
    x: clampNumber(x, 4, 84, 8),
    y: clampNumber(y, 4, 86, 8),
    units: unitsFromText(text, cleanMode)
  };
}

function loadData() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return hydrateData(raw);
  } catch (error) {
    return createDefaultData();
  }
}

function hydrateData(raw) {
  if (!raw || typeof raw !== "object") return createDefaultData();

  const blocks = Array.isArray(raw.blocks)
    ? raw.blocks.map(normalizeBlock).filter(Boolean)
    : [];

  if (!blocks.length) return createDefaultData();

  const customTokens = unique(
    (Array.isArray(raw.customTokens) ? raw.customTokens : [])
      .map((value) => normalizeSmallToken(value))
      .filter(Boolean)
  ).slice(-MAX_CUSTOM_TOKENS);

  const titleBlockId = blocks.some((block) => block.id === raw.titleBlockId)
    ? raw.titleBlockId
    : blocks[0].id;

  const selectedBlockId = blocks.some((block) => block.id === raw.selectedBlockId)
    ? raw.selectedBlockId
    : titleBlockId;

  return {
    version: 2,
    titleBlockId,
    selectedBlockId,
    keyboardLayout: KEYBOARD_LAYOUTS[raw.keyboardLayout]
      ? raw.keyboardLayout
      : DEFAULT_KEYBOARD_LAYOUT,
    customTokens,
    blocks,
    updatedAt: validDate(raw.updatedAt) ? raw.updatedAt : new Date().toISOString()
  };
}

function normalizeBlock(raw, index) {
  if (!raw || typeof raw !== "object") return null;

  const mode = MODES.includes(raw.mode) ? raw.mode : "single";
  const units = normalizeUnits(raw.units, mode);
  const fallbackText = String(raw.text || raw.name || "Glyph").trim();
  const resolvedUnits = units.length ? units : unitsFromText(fallbackText, mode);

  if (!resolvedUnits.length) return null;

  return {
    id: String(raw.id || makeId("block")),
    name: String(raw.name || fallbackText || "Glyph " + (index + 1)).slice(0, 80),
    mode,
    style: STYLES.includes(raw.style) ? raw.style : "ring",
    active: raw.active !== false,
    x: clampNumber(raw.x, 2, 88, 8 + (index * 13) % 65),
    y: clampNumber(raw.y, 2, 88, 8 + (index * 17) % 66),
    units: resolvedUnits
  };
}

function normalizeUnits(rawUnits, mode) {
  if (!Array.isArray(rawUnits)) return [];

  const units = [];

  rawUnits.forEach((raw) => {
    if (!raw || typeof raw !== "object") return;

    if (raw.gap) {
      if (!units.length || units[units.length - 1].gap) return;
      units.push({ id: makeId("gap"), gap: true });
      return;
    }

    const sourceCells = Array.isArray(raw.cells) ? raw.cells : [];
    const maximum = mode === "word" ? MAX_WORD_GRAPHEMES : MAX_SMALL_TOKEN_GRAPHEMES;

    const cells = sourceCells
      .map((value) => normalizeToken(value, maximum))
      .slice(0, mode === "double" ? 2 : 1);

    if (mode === "double") {
      while (cells.length < 2) cells.push("");
    }

    if (!cells.length) return;

    units.push({
      id: String(raw.id || makeId("unit")),
      cells
    });
  });

  return units;
}

function unitsFromText(value, mode) {
  const text = String(value || "").trim();
  if (!text) return [];

  const units = [];
  const pieces = text.split(/(\s+)/u);

  pieces.forEach((piece) => {
    if (!piece) return;

    if (/^\s+$/u.test(piece)) {
      if (units.length && !units[units.length - 1].gap) {
        units.push({ id: makeId("gap"), gap: true });
      }
      return;
    }

    if (mode === "word") {
      units.push({
        id: makeId("unit"),
        cells: [normalizeToken(piece, MAX_WORD_GRAPHEMES)]
      });
      return;
    }

    const letters = glyphsOf(piece);

    if (mode === "double") {
      for (let index = 0; index < letters.length; index += 2) {
        units.push({
          id: makeId("unit"),
          cells: [
            normalizeSmallToken(letters[index]),
            normalizeSmallToken(letters[index + 1] || "")
          ]
        });
      }

      return;
    }

    letters.forEach((letter) => {
      units.push({
        id: makeId("unit"),
        cells: [normalizeSmallToken(letter)]
      });
    });
  });

  return units;
}

function glyphsOf(value) {
  const text = String(value || "");

  try {
    if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
      const segmenter = new Intl.Segmenter("cs", { granularity: "grapheme" });
      return Array.from(segmenter.segment(text), (entry) => entry.segment);
    }
  } catch (error) {
    return Array.from(text);
  }

  return Array.from(text);
}

function normalizeToken(value, maximum) {
  const text = String(value === undefined || value === null ? "" : value)
    .replace(/[\r\n]+/gu, " ")
    .trim();

  return glyphsOf(text).slice(0, maximum).join("");
}

function normalizeSmallToken(value) {
  return normalizeToken(value, MAX_SMALL_TOKEN_GRAPHEMES);
}

function unique(values) {
  return Array.from(new Set(values));
}

function validDate(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function makeId(prefix) {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return prefix + "-" + window.crypto.randomUUID();
  }

  return prefix + "-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

function ensureSelection() {
  if (!data.blocks.length) {
    data = createDefaultData();
  }

  if (!data.blocks.some((block) => block.id === data.titleBlockId)) {
    data.titleBlockId = data.blocks[0].id;
  }

  if (!data.blocks.some((block) => block.id === data.selectedBlockId)) {
    data.selectedBlockId = data.titleBlockId;
  }

  if (ui.selectedCell && !findCell(ui.selectedCell)) {
    ui.selectedCell = null;
  }
}

function saveData(updateTime) {
  if (updateTime !== false) data.updatedAt = new Date().toISOString();

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableData()));
    ui.storageFailed = false;
    return true;
  } catch (error) {
    ui.storageFailed = true;
    return false;
  }
}

function serializableData() {
  return {
    version: 2,
    titleBlockId: data.titleBlockId,
    selectedBlockId: data.selectedBlockId,
    keyboardLayout: data.keyboardLayout,
    customTokens: data.customTokens,
    blocks: data.blocks,
    updatedAt: data.updatedAt
  };
}

function rememberCurrentState() {
  const snapshot = JSON.stringify(serializableData());

  if (ui.history[ui.history.length - 1] === snapshot) return;

  ui.history.push(snapshot);

  if (ui.history.length > 40) {
    ui.history.shift();
  }
}

function rememberSnapshot(snapshot) {
  if (!snapshot || ui.history[ui.history.length - 1] === snapshot) return;

  ui.history.push(snapshot);

  if (ui.history.length > 40) {
    ui.history.shift();
  }
}

function mutate(change, message) {
  rememberCurrentState();
  change();
  ensureSelection();
  saveData();

  if (message) ui.message = message;

  renderAll();
}

function getSelectedBlock() {
  return data.blocks.find((block) => block.id === data.selectedBlockId) || null;
}

function getBlockById(id) {
  return data.blocks.find((block) => block.id === id) || null;
}

function getBlockText(block) {
  if (!block) return "";

  return block.units.map((unit) => {
    if (unit.gap) return " ";
    return unit.cells.join("");
  }).join("");
}

function findCell(reference) {
  if (!reference) return null;

  const block = getBlockById(reference.blockId);
  if (!block) return null;

  const unit = block.units.find((item) => {
    return item.id === reference.unitId && !item.gap;
  });

  if (!unit) return null;

  const cellIndex = Number(reference.cellIndex);

  if (!Number.isInteger(cellIndex) || cellIndex < 0 || cellIndex >= unit.cells.length) {
    return null;
  }

  return { block, unit, cellIndex };
}

function getCellChoices(block, unit, cellIndex) {
  let choices = block.mode === "word" ? getWordTokens() : getTokenLibrary();
  const current = unit.cells[cellIndex] || "";

  if (current && !choices.includes(current)) {
    choices = [current].concat(choices);
  }

  return choices.length ? choices : [current || "·"];
}

function getKeyboardLayout() {
  return KEYBOARD_LAYOUTS[data.keyboardLayout] ||
    KEYBOARD_LAYOUTS[DEFAULT_KEYBOARD_LAYOUT];
}

function getKeyboardTokens() {
  return getKeyboardLayout().tokens;
}

function getTokenLibrary() {
  return unique(getKeyboardTokens().concat(data.customTokens)).filter(Boolean);
}

function getWordTokens() {
  const words = [];

  data.blocks.forEach((block) => {
    block.units.forEach((unit) => {
      if (unit.gap || !unit.cells[0]) return;

      if (block.mode === "word") {
        words.push(unit.cells[0]);
      } else {
        const word = unit.cells.join("");
        if (word) words.push(word);
      }
    });
  });

  return unique(words).filter(Boolean);
}

function displayToken(value) {
  return value === "" ? "·" : String(value);
}

function formatRowCount(count) {
  const ending = count === 1
    ? "řádek"
    : (count >= 2 && count <= 4 ? "řádky" : "řádků");

  return String(count) + " " + ending;
}

function renderAll() {
  ensureSelection();
  renderTitle();
  renderKeyboardLayout();
  renderTokenShelf();
  renderWorkspace();
  renderInspector();
  renderArchive();
  renderBridge();
  renderState();
  renderMessage();
}

function renderKeyboardLayout() {
  if (!elements.keyboardLayout) return;

  if (!elements.keyboardLayout.options.length) {
    Object.entries(KEYBOARD_LAYOUTS).forEach(([id, layout]) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = layout.label;
      elements.keyboardLayout.append(option);
    });
  }

  elements.keyboardLayout.value = data.keyboardLayout;
  elements.keyboardDescription.textContent = getKeyboardLayout().description;
}

function renderTitle() {
  elements.titleGlyphs.textContent = "";

  const titleBlock = getBlockById(data.titleBlockId);
  const titleUnits = titleBlock
    ? titleBlock.units
    : unitsFromText(APP_NAME, "single");

  titleUnits.forEach((unit) => {
    if (unit.gap) {
      const gap = document.createElement("span");
      gap.className = "title-gap";
      gap.setAttribute("aria-hidden", "true");
      elements.titleGlyphs.append(gap);
      return;
    }

    unit.cells.forEach((cell) => {
      const token = document.createElement("button");
      token.type = "button";
      token.className = "title-token";
      token.textContent = displayToken(cell);
      token.title = "Otevřít tento řádek na ploše";

      token.addEventListener("click", () => {
        selectBlock(data.titleBlockId);
      });

      elements.titleGlyphs.append(token);
    });
  });
}

function renderTokenShelf() {
  elements.tokenShelf.textContent = "";

  const custom = new Set(data.customTokens);

  getTokenLibrary().forEach((token) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "token-button" + (custom.has(token) ? " is-custom" : "");
    button.dataset.token = token;
    button.textContent = displayToken(token);
    button.setAttribute(
      "aria-label",
      "Nastavit " + displayToken(token) + " do vybraného okénka"
    );

    elements.tokenShelf.append(button);
  });
}
function getVisibleBlocks() {
  return data.blocks.filter((block) => block.active !== false);
}

function getArchivedBlocks() {
  return data.blocks.filter((block) => block.active === false);
}

function renderWorkspace() {
  elements.workspace.textContent = "";

  const visibleBlocks = getVisibleBlocks();

  if (!visibleBlocks.length) {
    const empty = document.createElement("p");
    empty.className = "workspace-message workspace-empty";
    empty.textContent = "Plocha je čistá. Odložené bubínky můžeš kdykoli vrátit níže.";
    elements.workspace.append(empty);
    return;
  }

  visibleBlocks.forEach((block) => {
    const card = document.createElement("article");
    const grip = document.createElement("div");
    const dots = document.createElement("span");
    const number = document.createElement("span");
    const tools = document.createElement("div");
    const hideButton = document.createElement("button");
    const deleteButton = document.createElement("button");
    const run = document.createElement("div");
    const index = data.blocks.indexOf(block);

    card.className = "glyph-block style-" + block.style + (
      block.id === data.selectedBlockId ? " is-selected" : ""
    );

    card.dataset.blockId = block.id;
    card.style.left = block.x + "%";
    card.style.top = block.y + "%";

    grip.className = "glyph-block-grip";
    grip.title = "Tažením přesuneš celý řádek";

    dots.className = "grip-dots";
    number.className = "glyph-block-index";
    number.textContent = String(index + 1).padStart(2, "0");

    tools.className = "glyph-block-tools";

    hideButton.type = "button";
    hideButton.className = "block-tool";
    hideButton.textContent = "×";
    hideButton.title = "Odložit řádek z plochy";
    hideButton.setAttribute("aria-label", "Odložit tento řádek z plochy");

    deleteButton.type = "button";
    deleteButton.className = "block-tool is-danger";
    deleteButton.textContent = "⌫";
    deleteButton.title = "Odstranit řádek";
    deleteButton.setAttribute("aria-label", "Odstranit tento řádek");

    [hideButton, deleteButton].forEach((button) => {
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
    });

    hideButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setBlockActive(block.id, false, "Řádek je odložený. Zůstává zachovaný níže.");
    });

    deleteButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      deleteBlockById(block.id, true);
    });

    tools.append(hideButton, deleteButton);
    grip.append(dots, number, tools);

    run.className = "drum-run";

    block.units.forEach((unit) => {
      if (unit.gap) {
        const gap = document.createElement("span");
        gap.className = "glyph-space";
        gap.setAttribute("aria-hidden", "true");
        run.append(gap);
        return;
      }

      run.append(createDrum(block, unit));
    });

    card.append(grip, run);

    card.addEventListener("click", (event) => {
      if (event.target.closest(".reel, .glyph-block-tools")) return;
      selectBlock(block.id);
    });

    attachBlockDrag(grip, card, block);
    elements.workspace.append(card);
  });
}

function createDrum(block, unit) {
  const drum = document.createElement("div");
  const count = unit.cells.length;

  drum.className =
    "glyph-drum" +
    (count === 2 ? " is-double" : "") +
    (block.mode === "word" ? " is-word" : "");

  drum.dataset.unitId = unit.id;

  unit.cells.forEach((value, cellIndex) => {
    if (cellIndex > 0 && count === 2) {
      const divider = document.createElement("span");
      divider.className = "double-divider";
      divider.textContent = ":";
      drum.append(divider);
    }

    const reel = document.createElement("button");
    const previous = document.createElement("span");
    const current = document.createElement("strong");
    const next = document.createElement("span");

    const reference = {
      blockId: block.id,
      unitId: unit.id,
      cellIndex
    };

    reel.type = "button";
    reel.className = "reel";
    reel.dataset.blockId = block.id;
    reel.dataset.unitId = unit.id;
    reel.dataset.cellIndex = String(cellIndex);

    previous.className = "reel-ghost";
    previous.dataset.reel = "previous";

    current.className = "reel-current";
    current.dataset.reel = "current";

    next.className = "reel-ghost";
    next.dataset.reel = "next";

    reel.append(previous, current, next);

    renderReelContent(reel, block, unit, cellIndex);
    attachReelInteraction(reel, reference);

    drum.append(reel);
  });

  return drum;
}

function renderReelContent(reel, block, unit, cellIndex) {
  const current = unit.cells[cellIndex] || "";
  const choices = getCellChoices(block, unit, cellIndex);
  const initialIndex = choices.indexOf(current);
  const index = initialIndex >= 0 ? initialIndex : 0;

  const previous = choices[positiveModulo(index - 1, choices.length)];
  const next = choices[positiveModulo(index + 1, choices.length)];

  reel.querySelector("[data-reel='previous']").textContent = displayToken(previous);
  reel.querySelector("[data-reel='current']").textContent = displayToken(current);
  reel.querySelector("[data-reel='next']").textContent = displayToken(next);
  reel.setAttribute("aria-label", "Bubínek: " + displayToken(current));
}

function attachReelInteraction(reel, reference) {
  let drag = null;

  reel.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    selectCell(reference);

    drag = {
      pointerId: event.pointerId,
      startY: event.clientY,
      lastStep: 0,
      moved: false,
      historySaved: false,
      snapshot: JSON.stringify(serializableData())
    };

    if (typeof reel.setPointerCapture === "function") {
      reel.setPointerCapture(event.pointerId);
    }
  });

  reel.addEventListener("pointermove", (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;

    const nextStep = Math.trunc((drag.startY - event.clientY) / 17);

    if (nextStep === drag.lastStep) return;

    if (!drag.historySaved) {
      rememberSnapshot(drag.snapshot);
      drag.historySaved = true;
    }

    rotateCell(reference, nextStep - drag.lastStep, reel);

    drag.lastStep = nextStep;
    drag.moved = true;
  });

  const finish = (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (!drag.moved) {
      rememberSnapshot(drag.snapshot);
      rotateCell(reference, 1, reel);
    }

    if (typeof reel.releasePointerCapture === "function") {
      reel.releasePointerCapture(event.pointerId);
    }

    drag = null;
  };

  reel.addEventListener("pointerup", finish);
  reel.addEventListener("pointercancel", finish);

  reel.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  reel.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

    event.preventDefault();
    rememberCurrentState();

    rotateCell(
      reference,
      event.key === "ArrowUp" ? 1 : -1,
      reel
    );
  });
}

function attachBlockDrag(grip, card, block) {
  let drag = null;

  grip.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    selectBlock(block.id);

    const bounds = elements.workspace.getBoundingClientRect();

    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      blockX: block.x,
      blockY: block.y,
      width: bounds.width,
      height: bounds.height,
      cardWidth: card.offsetWidth,
      cardHeight: card.offsetHeight,
      snapshot: JSON.stringify(serializableData()),
      moved: false
    };

    if (typeof grip.setPointerCapture === "function") {
      grip.setPointerCapture(event.pointerId);
    }

    grip.classList.add("is-dragging");
  });

  grip.addEventListener("pointermove", (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;

    const width = Math.max(1, drag.width);
    const height = Math.max(1, drag.height);
    const maxX = Math.max(1, 100 - drag.cardWidth / width * 100);
    const maxY = Math.max(1, 100 - drag.cardHeight / height * 100);

    const nextX = clampNumber(
      drag.blockX + (event.clientX - drag.startX) / width * 100,
      1,
      maxX,
      block.x
    );

    const nextY = clampNumber(
      drag.blockY + (event.clientY - drag.startY) / height * 100,
      1,
      maxY,
      block.y
    );

    if (Math.abs(nextX - block.x) < .05 && Math.abs(nextY - block.y) < .05) {
      return;
    }

    block.x = Math.round(nextX * 10) / 10;
    block.y = Math.round(nextY * 10) / 10;

    card.style.left = block.x + "%";
    card.style.top = block.y + "%";

    drag.moved = true;
  });

  const finish = (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (typeof grip.releasePointerCapture === "function") {
      grip.releasePointerCapture(event.pointerId);
    }

    grip.classList.remove("is-dragging");

    if (drag.moved) {
      rememberSnapshot(drag.snapshot);
      saveData();

      ui.message = "Řádek je přesunutý. Jeho bubínky zůstávají samostatné.";

      renderState();
      renderMessage();
    }

    drag = null;
  };

  grip.addEventListener("pointerup", finish);
  grip.addEventListener("pointercancel", finish);
}

function rotateCell(reference, amount, reel) {
  const found = findCell(reference);
  if (!found || !amount) return;

  const choices = getCellChoices(found.block, found.unit, found.cellIndex);
  const current = found.unit.cells[found.cellIndex] || "";
  const index = Math.max(0, choices.indexOf(current));

  found.unit.cells[found.cellIndex] =
    choices[positiveModulo(index + amount, choices.length)];

  saveData();

  if (reel && reel.isConnected) {
    renderReelContent(reel, found.block, found.unit, found.cellIndex);

    reel.dataset.direction = amount < 0 ? "-1" : "1";
    reel.classList.remove("is-spinning");

    void reel.offsetWidth;

    reel.classList.add("is-spinning");

    window.setTimeout(() => {
      reel.classList.remove("is-spinning");
    }, 260);
  }

  if (found.block.id === data.titleBlockId) {
    renderTitle();
  }

  renderInspector();
  renderState();

  ui.message =
    "Bubínek se otočil na " +
    displayToken(found.unit.cells[found.cellIndex]) +
    ".";

  renderMessage();
}

function selectBlock(id) {
  if (!getBlockById(id)) return;

  data.selectedBlockId = id;
  ui.selectedCell = null;

  saveData(false);
  updateWorkspaceSelection();
  renderInspector();
}

function selectCell(reference) {
  const found = findCell(reference);
  if (!found) return;

  data.selectedBlockId = reference.blockId;

  ui.selectedCell = {
    blockId: reference.blockId,
    unitId: reference.unitId,
    cellIndex: reference.cellIndex
  };

  saveData(false);
  updateWorkspaceSelection();
  renderInspector();
}

function updateWorkspaceSelection() {
  elements.workspace.querySelectorAll(".glyph-block").forEach((card) => {
    card.classList.toggle(
      "is-selected",
      card.dataset.blockId === data.selectedBlockId
    );
  });

  elements.workspace.querySelectorAll(".reel").forEach((reel) => {
    const selected =
      ui.selectedCell &&
      reel.dataset.blockId === ui.selectedCell.blockId &&
      reel.dataset.unitId === ui.selectedCell.unitId &&
      Number(reel.dataset.cellIndex) === ui.selectedCell.cellIndex;

    reel.classList.toggle("is-selected", Boolean(selected));
  });
}

function renderInspector() {
  const block = getSelectedBlock();

  if (!block) {
    elements.emptySelection.hidden = false;
    elements.inspectorForm.hidden = true;
    elements.selectedBadge.textContent = "—";
    elements.toggleBlock.disabled = true;
    elements.removeSelectedDrum.disabled = true;
    return;
  }

  elements.emptySelection.hidden = true;
  elements.inspectorForm.hidden = false;
  elements.selectedBadge.textContent =
    String(data.blocks.indexOf(block) + 1).padStart(2, "0");

  elements.selectedName.value = block.name;
  elements.toggleBlock.disabled = false;
  elements.toggleBlock.textContent = block.active === false
    ? "Vrátit na plochu"
    : "Vypnout na ploše";

  syncChoiceGroup(
    elements.selectedModeChoices,
    "data-selected-mode",
    block.mode
  );

  syncChoiceGroup(
    elements.selectedStyleChoices,
    "data-selected-style",
    block.style
  );

  const found = findCell(ui.selectedCell);

  if (!found || found.block.id !== block.id) {
    elements.selectedCellInfo.textContent =
      "Vyber konkrétní okénko bubínku přímo na ploše.";

    elements.selectedCellValue.value = "";
    elements.selectedCellValue.disabled = true;
    elements.applyCellValue.disabled = true;
    elements.removeSelectedDrum.disabled = true;
    return;
  }

  const index =
    found.block.units
      .filter((unit) => !unit.gap)
      .findIndex((unit) => unit.id === found.unit.id) + 1;

  const part = found.block.mode === "double"
    ? (found.cellIndex === 0 ? "levé okénko" : "pravé okénko")
    : "okénko";

  const limit = found.block.mode === "word"
    ? MAX_WORD_GRAPHEMES
    : MAX_SMALL_TOKEN_GRAPHEMES;

  elements.selectedCellInfo.textContent =
    "Bubínek " +
    index +
    " · " +
    part +
    " · nejvýše " +
    (found.block.mode === "word" ? "celé slovo" : "dva znaky") +
    ".";

  elements.selectedCellValue.value = found.unit.cells[found.cellIndex] || "";
  elements.selectedCellValue.maxLength = limit * 8;
  elements.selectedCellValue.disabled = false;
  elements.applyCellValue.disabled = false;
  elements.removeSelectedDrum.disabled = false;
}

function renderState() {
  const visible = getVisibleBlocks().length;
  const archived = getArchivedBlocks().length;

  elements.blockCount.textContent =
    formatRowCount(visible) +
    (archived ? " · " + archived + " odloženo" : "");

  if (ui.storageFailed) {
    elements.storageState.textContent = "nelze uložit";
  } else if (ui.storagePersistent) {
    elements.storageState.textContent = "trvale uloženo";
  } else {
    elements.storageState.textContent = "uloženo v zařízení";
  }

  elements.undoAction.disabled = ui.history.length === 0;
}

function renderMessage() {
  elements.workspaceMessage.textContent = ui.message;
}

function syncChoiceGroup(container, attribute, selectedValue) {
  container.querySelectorAll("button").forEach((button) => {
    button.classList.toggle(
      "is-selected",
      button.getAttribute(attribute) === selectedValue
    );
  });
}
function chooseNewMode(event) {
  const button = event.target.closest("button[data-new-mode]");
  if (!button) return;

  ui.newMode = button.dataset.newMode;

  syncChoiceGroup(
    elements.newModeChoices,
    "data-new-mode",
    ui.newMode
  );
}

function chooseNewStyle(event) {
  const button = event.target.closest("button[data-new-style]");
  if (!button) return;

  ui.newStyle = button.dataset.newStyle;

  syncChoiceGroup(
    elements.newStyleChoices,
    "data-new-style",
    ui.newStyle
  );
}

function changeKeyboardLayout() {
  const next = elements.keyboardLayout.value;

  if (!KEYBOARD_LAYOUTS[next] || next === data.keyboardLayout) {
    return;
  }

  mutate(() => {
    data.keyboardLayout = next;
  }, "Sada bubínků je přepnutá na „" + KEYBOARD_LAYOUTS[next].label + "“.");
}

function chooseSelectedMode(event) {
  const button = event.target.closest("button[data-selected-mode]");
  const block = getSelectedBlock();

  if (!button || !block) return;

  const mode = button.dataset.selectedMode;

  if (mode === block.mode) return;

  mutate(() => {
    const text = getBlockText(block);

    block.mode = mode;
    block.units = unitsFromText(text, mode);

    ui.selectedCell = null;
  }, "Řádek má nový typ bubínků.");
}

function chooseSelectedStyle(event) {
  const button = event.target.closest("button[data-selected-style]");
  const block = getSelectedBlock();

  if (!button || !block) return;

  const style = button.dataset.selectedStyle;

  if (style === block.style) return;

  mutate(() => {
    block.style = style;
  }, "Tělo bubínků je změněné.");
}

function createNewBlock(event) {
  event.preventDefault();

  const text = String(elements.newText.value || "").trim();

  if (!text) {
    ui.message = "Nejdřív napiš text, který se má rozložit na bubínky.";
    renderMessage();
    elements.newText.focus();
    return;
  }

  if (data.blocks.length >= MAX_BLOCKS) {
    ui.message =
      "Dílna má bezpečný strop " +
      MAX_BLOCKS +
      " řádků. Některý zbytečný řádek nejdřív odeber nebo vyexportuj.";
    renderMessage();
    return;
  }

  const willBeVisible = getVisibleBlocks().length < MAX_VISIBLE_BLOCKS;

  mutate(() => {
    const position = findNewPosition();

    const block = createBlock(
      text,
      ui.newMode,
      ui.newStyle,
      position.x,
      position.y,
      text
    );

    block.active = willBeVisible;
    data.blocks.push(block);
    data.selectedBlockId = block.id;
    ui.selectedCell = null;
  }, willBeVisible
    ? "Nový řádek je na ploše. Tažením mu určíš místo."
    : "Plocha už má mnoho řádků. Nový je bezpečně odložený níže; jedním klepnutím ho vrátíš."
  );
}

function findNewPosition() {
  const index = data.blocks.length;

  return {
    x: 8 + (index * 17) % 62,
    y: 10 + (index * 19) % 66
  };
}

function addCustomToken() {
  const raw = String(elements.customToken.value || "").trim();
  const glyphs = glyphsOf(raw);

  if (!glyphs.length) {
    ui.message = "Vlož svůj Glyph. Prázdné okénko nemá co přidat.";
    renderMessage();
    return;
  }

  if (glyphs.length > MAX_SMALL_TOKEN_GRAPHEMES) {
    ui.message = "Malý bubínek unese nejvýše dva znaky. Pro celé slovo použij řádek typu „slovo“.";
    renderMessage();
    return;
  }

  const token = glyphs.join("");
  const target = findCell(ui.selectedCell);
  const canApply = target && target.block.mode !== "word";

  mutate(() => {
    if (!data.customTokens.includes(token)) {
      data.customTokens.push(token);
      data.customTokens = data.customTokens.slice(-MAX_CUSTOM_TOKENS);
    }

    if (canApply) {
      target.unit.cells[target.cellIndex] = token;
    }
  }, canApply
    ? "Vlastní Glyph je vložený jen do vybraného okénka."
    : "Vlastní Glyph čeká v sadě bubínků."
  );

  elements.customToken.value = "";
}

function applyShelfToken(event) {
  const button = event.target.closest("button[data-token]");
  if (!button) return;

  const token = button.dataset.token || "";
  const found = findCell(ui.selectedCell);

  if (!found) {
    ui.message = "Nejdřív vyber konkrétní okénko bubínku, teprve potom ho lze nahradit.";
    renderMessage();
    return;
  }

  mutate(() => {
    found.unit.cells[found.cellIndex] = token;
  }, "Vybraný bubínek nyní nese " + displayToken(token) + ".");
}

function updateSelectedName() {
  const block = getSelectedBlock();
  if (!block) return;

  const nextName = String(elements.selectedName.value || "")
    .trim()
    .slice(0, 80);

  if (!nextName || nextName === block.name) return;

  mutate(() => {
    block.name = nextName;
  }, "Jméno řádku je uložené.");
}

function applyCellValue() {
  const found = findCell(ui.selectedCell);
  if (!found) return;

  const maximum = found.block.mode === "word"
    ? MAX_WORD_GRAPHEMES
    : MAX_SMALL_TOKEN_GRAPHEMES;

  const raw = String(elements.selectedCellValue.value || "");
  const glyphs = glyphsOf(raw.trim());

  if (glyphs.length > maximum) {
    ui.message = found.block.mode === "word"
      ? "Tento velký bubínek unese jedno slovo do 80 znaků."
      : "Toto okénko unese nejvýše dva znaky.";

    renderMessage();
    return;
  }

  const value = glyphs.join("");

  mutate(() => {
    found.unit.cells[found.cellIndex] = value;

    if (
      value &&
      found.block.mode !== "word" &&
      !getKeyboardTokens().includes(value) &&
      !data.customTokens.includes(value)
    ) {
      data.customTokens.push(value);
      data.customTokens = data.customTokens.slice(-MAX_CUSTOM_TOKENS);
    }
  }, "Hodnota je vyměněná pouze v tomto místě.");
}

function duplicateSelectedBlock() {
  const block = getSelectedBlock();
  if (!block) return;

  if (data.blocks.length >= MAX_BLOCKS) {
    ui.message = "Dílna má už bezpečný strop " + MAX_BLOCKS + " řádků.";
    renderMessage();
    return;
  }

  const willBeVisible =
    block.active !== false && getVisibleBlocks().length < MAX_VISIBLE_BLOCKS;

  mutate(() => {
    const copy = cloneBlock(block);

    copy.x = clampNumber(block.x + 4, 2, 84, block.x);
    copy.y = clampNumber(block.y + 5, 2, 86, block.y);
    copy.active = willBeVisible;

    data.blocks.push(copy);
    data.selectedBlockId = copy.id;
    ui.selectedCell = null;
  }, willBeVisible
    ? "Řádek je zdvojený. Každý z nich se teď pohybuje zvlášť."
    : "Řádek je zdvojený a uložený mezi odloženými bubínky.");
}

function cloneBlock(block) {
  return {
    id: makeId("block"),
    name: String(block.name || "Glyph") + " 2",
    mode: block.mode,
    style: block.style,
    active: block.active !== false,
    x: block.x,
    y: block.y,
    units: block.units.map((unit) => {
      if (unit.gap) {
        return {
          id: makeId("gap"),
          gap: true
        };
      }

      return {
        id: makeId("unit"),
        cells: unit.cells.slice()
      };
    })
  };
}

function setBlockActive(id, active, message) {
  const block = getBlockById(id);

  if (!block || block.active === active) return false;

  if (active && getVisibleBlocks().length >= MAX_VISIBLE_BLOCKS) {
    ui.message =
      "Na ploše už je " +
      MAX_VISIBLE_BLOCKS +
      " řádků. Nejdřív některý odlož, aby zůstala přehledná.";
    renderMessage();
    return false;
  }

  mutate(() => {
    block.active = active;
    data.selectedBlockId = block.id;
    ui.selectedCell = null;
  }, message || (active
    ? "Řádek je zpět na ploše."
    : "Řádek je odložený. Jeho data zůstávají zachovaná."));

  return true;
}

function toggleSelectedBlock() {
  const block = getSelectedBlock();
  if (!block) return;

  setBlockActive(
    block.id,
    block.active === false,
    block.active === false
      ? "Řádek je zpět na ploše."
      : "Řádek je odložený. Kdykoli ho vrátíš z přehledu pod plochou."
  );
}

function hideAllBlocks() {
  const visible = getVisibleBlocks();

  if (!visible.length) {
    ui.message = "Na ploše už není žádný řádek.";
    renderMessage();
    return;
  }

  if (!window.confirm("Odložit z plochy všech " + visible.length + " řádků? Nic se nemaže.")) {
    return;
  }

  mutate(() => {
    visible.forEach((block) => {
      block.active = false;
    });
    ui.selectedCell = null;
  }, "Plocha je čistá. Všechny řádky čekají bezpečně v odložených bubíncích.");
}

function arrangeVisibleBlocks() {
  const blocks = getVisibleBlocks();

  if (!blocks.length) {
    ui.message = "Není co uspořádat. Vrať nejdřív řádek z odložených bubínků.";
    renderMessage();
    return;
  }

  const columns = blocks.length > 12 ? 4 : (blocks.length > 5 ? 3 : 2);
  const rows = Math.ceil(blocks.length / columns);

  mutate(() => {
    blocks.forEach((block, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const horizontal = columns === 1 ? 8 : 5 + column * (82 / (columns - 1));
      const vertical = rows === 1 ? 9 : 8 + row * (72 / (rows - 1));

      block.x = Math.round(horizontal * 10) / 10;
      block.y = Math.round(vertical * 10) / 10;
    });
  }, "Řádky jsou uspořádané. Každý můžeš dál přetáhnout kamkoli.");
}

function trimBlockGaps(units) {
  const result = (units || []).filter((unit) => {
    return unit && (unit.gap || (Array.isArray(unit.cells) && unit.cells.length));
  });

  while (result[0]?.gap) result.shift();
  while (result[result.length - 1]?.gap) result.pop();

  return result.filter((unit, index) => {
    return !unit.gap || !result[index - 1]?.gap;
  });
}

function removeSelectedDrum() {
  const found = findCell(ui.selectedCell);

  if (!found) {
    ui.message = "Nejdřív vyber konkrétní bubínek, který chceš odebrat.";
    renderMessage();
    return;
  }

  const block = found.block;
  const unitIndex = block.units.findIndex((unit) => unit.id === found.unit.id);

  if (unitIndex < 0) return;

  const isLastDrum = block.units.filter((unit) => !unit.gap).length === 1;
  const question = isLastDrum
    ? "Je to poslední bubínek řádku. Odebrat celý řádek?"
    : "Odebrat vybraný bubínek z tohoto řádku?";

  if (!window.confirm(question)) return;

  mutate(() => {
    if (isLastDrum) {
      data.blocks = data.blocks.filter((item) => item.id !== block.id);
    } else {
      block.units.splice(unitIndex, 1);
      block.units = trimBlockGaps(block.units);
    }

    if (!data.blocks.length) {
      data = createDefaultData();
    }

    if (data.titleBlockId === block.id) {
      data.titleBlockId = data.blocks[0].id;
    }

    data.selectedBlockId = data.blocks[0].id;
    ui.selectedCell = null;
  }, isLastDrum
    ? "Poslední bubínek zmizel spolu s prázdným řádkem. Poslední krok lze vrátit."
    : "Vybraný bubínek je odebraný. Ostatní zůstaly na místě.");
}

function deleteBlockById(id, askForConfirmation) {
  const block = getBlockById(id);
  if (!block) return false;

  if (askForConfirmation) {
    const question =
      "Odebrat tento pohyblivý řádek? Zůstane možné vrátit ho šipkou zpět.";
    if (!window.confirm(question)) return false;
  }

  mutate(() => {
    data.blocks = data.blocks.filter((item) => item.id !== block.id);

    if (!data.blocks.length) {
      data = createDefaultData();
    }

    if (data.titleBlockId === block.id) {
      data.titleBlockId = data.blocks[0].id;
    }

    data.selectedBlockId = data.blocks[0].id;
    ui.selectedCell = null;
  }, "Řádek je odebraný. Poslední krok lze vrátit.");

  return true;
}

function deleteSelectedBlock() {
  const block = getSelectedBlock();
  if (!block) return;
  deleteBlockById(block.id, true);
}

function renderArchive() {
  const archived = getArchivedBlocks();

  elements.archivePanel.hidden = !archived.length;
  elements.archiveCount.textContent = String(archived.length);
  elements.archiveList.textContent = "";

  archived.forEach((block) => {
    const row = document.createElement("article");
    const copy = document.createElement("div");
    const title = document.createElement("strong");
    const detail = document.createElement("small");
    const restore = document.createElement("button");
    const remove = document.createElement("button");

    row.className = "archive-row";
    title.textContent = block.name || "Glyph";
    detail.textContent = getBlockText(block) || "prázdný řádek";
    copy.append(title, detail);

    restore.type = "button";
    restore.className = "quiet-button";
    restore.textContent = "Vrátit";
    restore.addEventListener("click", () => {
      setBlockActive(block.id, true, "Řádek je zpět na ploše.");
    });

    remove.type = "button";
    remove.className = "danger-button";
    remove.textContent = "Smazat";
    remove.addEventListener("click", () => deleteBlockById(block.id, true));

    row.append(copy, restore, remove);
    elements.archiveList.append(row);
  });
}

function readBridgeTarget() {
  const query = new URLSearchParams(window.location.search);
  let stored = null;

  try {
    stored = JSON.parse(localStorage.getItem(BRIDGE_CONTEXT_KEY) || "null");
  } catch (error) {
    stored = null;
  }

  const coreId = String(query.get("core") || stored?.coreId || "");
  const slotId = Number(query.get("slot") || stored?.slotId);

  if (!CORE_NAMES[coreId] || !Number.isInteger(slotId) || slotId < 1 || slotId > 70) {
    return null;
  }

  const requestedReturn = String(query.get("returnTo") || stored?.returnTo || "../index.html");
  const returnTo = requestedReturn.startsWith("../") && !requestedReturn.includes("://")
    ? requestedReturn
    : "../index.html";

  return {
    coreId,
    slotId,
    returnTo
  };
}

function renderBridge() {
  const target = ui.bridgeTarget;

  elements.transferCard.hidden = !target;

  if (!target) return;

  elements.transferTarget.textContent =
    CORE_NAMES[target.coreId] +
    " · slot " +
    target.slotId +
    " — vybraný řádek se vloží podle zvoleného způsobu.";

  elements.returnToCht.href = target.returnTo;
}

function sendSelectedBlockToCht() {
  const target = ui.bridgeTarget;
  const block = getSelectedBlock();

  if (!target) {
    ui.message = "Nejdřív otevři dílnu přímo z vybraného slotu CHT 360°‰.";
    renderMessage();
    return;
  }

  if (!block) {
    ui.message = "Nejdřív vyber řádek, který chceš poslat do Paměti.";
    renderMessage();
    return;
  }

  const text = getBlockText(block).trim();

  if (!text) {
    ui.message = "Prázdný řádek do Paměti neposílám.";
    renderMessage();
    return;
  }

  const transfer = {
    schema: "cht360-glyph-transfer-v1",
    id: "glyph-transfer-" + Date.now() + "-" + Math.random().toString(16).slice(2),
    createdAt: new Date().toISOString(),
    coreId: target.coreId,
    slotId: target.slotId,
    mode: elements.transferMode.value === "replace" ? "replace" : "append",
    name: block.name,
    text,
    block: {
      id: block.id,
      name: block.name,
      mode: block.mode,
      style: block.style,
      units: block.units
    }
  };

  try {
    localStorage.setItem(BRIDGE_TRANSFER_KEY, JSON.stringify(transfer));
    localStorage.setItem(BRIDGE_CONTEXT_KEY, JSON.stringify({
      ...target,
      lastSentId: transfer.id,
      updatedAt: transfer.createdAt
    }));

    window.dispatchEvent(new CustomEvent("cht.glyph.transfer.ready", {
      detail: transfer
    }));

    ui.message =
      "Řádek je připravený pro " +
      CORE_NAMES[target.coreId] +
      " · slot " +
      target.slotId +
      ". Vrať se do CHT a vloží se bezpečně.";
  } catch (error) {
    ui.message = "Přenos do Paměti se nepodařilo připravit v tomto prohlížeči.";
  }

  renderMessage();
}

function undo() {
  const snapshot = ui.history.pop();

  if (!snapshot) return;

  try {
    data = hydrateData(JSON.parse(snapshot));
    ui.selectedCell = null;

    saveData(false);

    ui.message = "Poslední změna je vrácená.";

    renderAll();
  } catch (error) {
    ui.message = "Poslední změnu se nepodařilo vrátit.";
    renderMessage();
  }
}

function exportGlyphs() {
  const backup = {
    app: APP_NAME,
    version: 1,
    exportedAt: new Date().toISOString(),
    data: serializableData()
  };

  downloadJson(
    backup,
    "glyph-cht-360-" + new Date().toISOString().slice(0, 10) + ".json"
  );

  ui.message = "Záloha pohyblivých Glyphů je připravená.";
  renderMessage();
}

async function importGlyphs(event) {
  const file = event.target.files && event.target.files[0];

  event.target.value = "";

  if (!file) return;

  try {
    const parsed = JSON.parse(await readTextFile(file));
    const incoming = hydrateData(parsed && parsed.data ? parsed.data : parsed);

    rememberCurrentState();

    data = incoming;
    ui.selectedCell = null;

    saveData();

    ui.message = "Glyphy jsou načtené a každý řádek zůstal samostatný.";

    renderAll();
  } catch (error) {
    ui.message = "Tento soubor neobsahuje čitelnou zálohu Glyphů.";
    renderMessage();
  }
}

function readTextFile(file) {
  if (file && typeof file.text === "function") {
    return file.text();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(String(reader.result || ""));
    };

    reader.onerror = () => {
      reject(reader.error || new Error("Soubor nelze přečíst."));
    };

    reader.readAsText(file, "UTF-8");
  });
}

function downloadJson(value, filename) {
  const blob = new Blob(
    [JSON.stringify(value, null, 2)],
    { type: "application/json;charset=utf-8" }
  );

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

async function requestPersistentStorage() {
  try {
    if (!navigator.storage || typeof navigator.storage.persist !== "function") {
      return;
    }

    ui.storagePersistent = await navigator.storage.persist();

    renderState();
  } catch (error) {
    ui.storagePersistent = false;
    renderState();
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      ui.message = "Dílna běží, ale offline vrstva se zatím nepodařila zapnout.";
      renderMessage();
    });
  });
}
