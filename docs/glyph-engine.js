"use strict";

/*
 * Glyph CHT 360°‰.
 * Samostatná dílna v čistém UTF-8. Nevytváří Glyphy sama – vzniknou pouze
 * z textu nebo znaku, který napíše člověk.
 */
const CHTGlyphEngine = (() => {
  const STORAGE_KEY = "cht360_glyph_engine_v3";
  const LEGACY_CUSTOM_KEY = "cht360_glyph_drums_custom_v1";
  const MAX_ROWS = 50;
  const MAX_CUSTOM = 160;
  const MAX_TEXT = 240;

  const COMMON = Object.freeze([
    ".", ",", ":", ";", "!", "?", "…", "°", "‰", "•", "·", "_", "-", "+", "=",
    "/", "\\", "(", ")", "[", "]", "{", "}", "<", ">", "←", "→", "↑", "↓", "×", "÷",
    "○", "□", "△", "◇", "☆", "★", "ア"
  ]);

  const ALPHABETS = Object.freeze({
    cs: Object.freeze(unique([
      ...graphemes("AÁBCČDĎEÉĚFGHIÍJKLMNŇOÓPQRŘSŠTŤUÚŮVWXYÝZŽ"),
      ...graphemes("aábcčdďeéěfghiíjklmnňoópqrřsštťuúůvwxyýzž"),
      ...graphemes("0123456789"),
      ...COMMON
    ])),
    symbols: Object.freeze(unique([
      ...graphemes("0123456789"),
      ...COMMON
    ]))
  });

  const dom = {
    shell: byId("glyphEngine"),
    open: byId("openGlyphEngine"),
    close: byId("closeGlyphEngine"),
    form: byId("glyphEngineCreateForm"),
    input: byId("glyphEngineText"),
    modes: byId("glyphEngineModes"),
    alphabet: byId("glyphEngineAlphabet"),
    custom: byId("glyphEngineCustom"),
    addCustom: byId("glyphEngineAddCustom"),
    shelf: byId("glyphEngineShelf"),
    rows: byId("glyphEngineRows"),
    status: byId("glyphEngineStatus"),
    send: byId("glyphEngineSend"),
    export: byId("glyphEngineExport"),
    import: byId("glyphEngineImport"),
    closeTargets: Array.from(document.querySelectorAll("[data-glyph-engine-close]"))
  };

  if (!dom.shell) {
    return Object.freeze({ open: () => false, close: () => false, getState: () => null });
  }

  let state = loadState();
  let mode = "single";
  let selected = null;
  let pointer = null;

  bindEvents();
  renderAll();
  publish("dílna připravena");

  function byId(id) {
    return document.getElementById(id);
  }

  function graphemes(value) {
    const text = String(value || "").normalize("NFC");
    if (typeof Intl !== "undefined" && Intl.Segmenter) {
      return Array.from(new Intl.Segmenter("cs", { granularity: "grapheme" }).segment(text), item => item.segment);
    }
    return Array.from(text);
  }

  function normaliseText(value, limit = MAX_TEXT) {
    return graphemes(String(value || "").replace(/\uFFFD/g, "").trim()).slice(0, limit).join("");
  }

  function normaliseToken(value, limit = 2) {
    return graphemes(normaliseText(value, limit)).slice(0, limit).join("");
  }

  function unique(values) {
    return Array.from(new Set(values.filter(Boolean)));
  }

  function makeId(prefix) {
    const random = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 10);
    return prefix + "-" + random;
  }

  function modulo(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
  }

  function readJson(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function emptyState() {
    return { version: 3, alphabet: "cs", customTokens: [], rows: [], updatedAt: new Date().toISOString() };
  }

  function loadState() {
    const saved = readJson(STORAGE_KEY);
    if (saved) return normaliseState(saved);

    const legacyCustom = readJson(LEGACY_CUSTOM_KEY);
    return normaliseState({
      ...emptyState(),
      customTokens: Array.isArray(legacyCustom) ? legacyCustom : []
    });
  }

  function normaliseState(raw) {
    const candidate = raw && typeof raw === "object" ? raw : {};
    const customTokens = unique(
      (Array.isArray(candidate.customTokens) ? candidate.customTokens : [])
        .map(value => normaliseToken(value))
        .filter(Boolean)
    ).slice(-MAX_CUSTOM);
    const rows = (Array.isArray(candidate.rows) ? candidate.rows : [])
      .map(normaliseRow)
      .filter(Boolean)
      .slice(-MAX_ROWS);

    return {
      version: 3,
      alphabet: ALPHABETS[candidate.alphabet] ? candidate.alphabet : "cs",
      customTokens,
      rows,
      updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : new Date().toISOString()
    };
  }

  function normaliseRow(raw) {
    if (!raw || typeof raw !== "object") return null;
    const rowMode = raw.mode === "double" ? "double" : "single";
    const units = Array.isArray(raw.units)
      ? raw.units.map(normaliseUnit).filter(Boolean)
      : unitsFromText(raw.text || raw.name || "", rowMode);

    if (!units.some(unit => !unit.space && unit.value)) return null;

    const phrase = units.map(unit => unit.space ? " " : unit.value).join("");
    return {
      id: String(raw.id || makeId("row")),
      name: normaliseText(raw.name || phrase, 80) || "Glyph řádek",
      mode: rowMode,
      units,
      createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString()
    };
  }

  function normaliseUnit(raw) {
    if (!raw || typeof raw !== "object") return null;
    if (raw.space) return { id: String(raw.id || makeId("space")), space: true };
    const value = normaliseToken(raw.value || raw.text || "");
    return value ? { id: String(raw.id || makeId("unit")), value } : null;
  }

  function unitsFromText(text, rowMode) {
    const units = [];
    const buffer = [];
    const width = rowMode === "double" ? 2 : 1;

    const flush = () => {
      while (buffer.length) {
        units.push({ id: makeId("unit"), value: buffer.splice(0, width).join("") });
      }
    };

    graphemes(normaliseText(text)).forEach(character => {
      if (/\s/u.test(character)) {
        flush();
        if (!units.length || !units[units.length - 1].space) units.push({ id: makeId("space"), space: true });
      } else {
        buffer.push(character);
      }
    });
    flush();
    return units;
  }

  function tokenPool() {
    return unique([...(ALPHABETS[state.alphabet] || ALPHABETS.cs), ...state.customTokens]);
  }

  function findRow(rowId) {
    return state.rows.find(row => row.id === rowId) || null;
  }

  function findUnit(rowId, unitId) {
    const row = findRow(rowId);
    return row?.units.find(unit => unit.id === unitId) || null;
  }

  function save(reason) {
    state.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {
      setStatus("Změna je vidět, ale Safari ji teď nemůže trvale uložit.");
    }
    publish(reason);
  }

  function publish(reason) {
    window.dispatchEvent(new CustomEvent("cht.glyph.engine.changed", {
      detail: { reason, rows: state.rows.length, customTokens: [...state.customTokens] }
    }));
  }

  function setStatus(message) {
    if (dom.status) dom.status.textContent = message;
  }

  function bindEvents() {
    dom.open?.addEventListener("click", open);
    dom.close?.addEventListener("click", close);
    dom.closeTargets.forEach(target => target.addEventListener("click", close));

    dom.form?.addEventListener("submit", event => {
      event.preventDefault();
      createRow();
    });

    dom.modes?.addEventListener("click", event => {
      const button = event.target.closest("[data-glyph-mode]");
      if (!button) return;
      mode = button.dataset.glyphMode === "double" ? "double" : "single";
      renderModes();
    });

    dom.alphabet?.addEventListener("change", () => {
      state.alphabet = ALPHABETS[dom.alphabet.value] ? dom.alphabet.value : "cs";
      save("změna sady");
      renderShelf();
    });

    dom.addCustom?.addEventListener("click", addCustom);
    dom.custom?.addEventListener("keydown", event => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      addCustom();
    });

    dom.shelf?.addEventListener("click", event => {
      const button = event.target.closest("[data-glyph-token]");
      if (button) applyToken(button.dataset.glyphToken || "");
    });

    dom.rows?.addEventListener("click", event => {
      const remove = event.target.closest("[data-glyph-remove-row]");
      if (remove) {
        removeRow(remove.dataset.glyphRemoveRow);
        return;
      }

      const drum = event.target.closest("[data-glyph-unit]");
      if (!drum || drum.dataset.ignoreGlyphClick === "true") {
        delete drum?.dataset.ignoreGlyphClick;
        return;
      }
      selectUnit(drum.dataset.glyphRow, drum.dataset.glyphUnit);
      rotateUnit(drum.dataset.glyphRow, drum.dataset.glyphUnit, 1);
    });

    dom.rows?.addEventListener("pointerdown", event => {
      const drum = event.target.closest("[data-glyph-unit]");
      if (!drum || event.button > 0) return;
      event.preventDefault();
      pointer = { rowId: drum.dataset.glyphRow, unitId: drum.dataset.glyphUnit, y: event.clientY, drum };
      drum.setPointerCapture?.(event.pointerId);
    });

    dom.rows?.addEventListener("pointerup", event => {
      if (!pointer) return;
      const gesture = pointer;
      pointer = null;
      const delta = event.clientY - gesture.y;
      if (gesture.drum.hasPointerCapture?.(event.pointerId)) gesture.drum.releasePointerCapture(event.pointerId);
      if (Math.abs(delta) < 14) return;
      gesture.drum.dataset.ignoreGlyphClick = "true";
      selectUnit(gesture.rowId, gesture.unitId);
      rotateUnit(gesture.rowId, gesture.unitId, delta < 0 ? 1 : -1);
    });

    dom.rows?.addEventListener("pointercancel", () => { pointer = null; });
    dom.send?.addEventListener("click", sendToSlot);
    dom.export?.addEventListener("click", exportState);
    dom.import?.addEventListener("change", importState);

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !dom.shell.hidden) close();
    });
  }

  function open() {
    dom.shell.hidden = false;
    dom.shell.setAttribute("aria-hidden", "false");
    document.body.classList.add("glyph-engine-open");
    window.requestAnimationFrame(() => dom.input?.focus());
    return true;
  }

  function close() {
    dom.shell.hidden = true;
    dom.shell.setAttribute("aria-hidden", "true");
    document.body.classList.remove("glyph-engine-open");
    dom.open?.focus();
    return true;
  }

  function createRow() {
    const text = normaliseText(dom.input?.value || "");
    if (!text) {
      setStatus("Nejdřív napiš text pro svůj Glyph řádek.");
      dom.input?.focus();
      return;
    }
    if (state.rows.length >= MAX_ROWS) {
      setStatus("Dílna má už maximum " + MAX_ROWS + " řádků.");
      return;
    }

    const row = {
      id: makeId("row"),
      name: normaliseText(text, 80),
      mode,
      units: unitsFromText(text, mode),
      createdAt: new Date().toISOString()
    };
    state.rows.push(row);
    selected = firstUnit(row);
    dom.input.value = "";
    save("nový Glyph řádek");
    renderRows();
    setStatus("Řádek je vytvořený. Klepnutí otočí bubínek, tažení nahoru nebo dolů mění směr.");
  }

  function firstUnit(row) {
    const unit = row.units.find(item => !item.space);
    return unit ? { rowId: row.id, unitId: unit.id } : null;
  }

  function addCustom() {
    const value = normaliseToken(dom.custom?.value || "");
    if (!value) {
      setStatus("Napiš vlastní Glyph: jeden nebo dva znaky.");
      dom.custom?.focus();
      return;
    }
    if (state.customTokens.includes(value)) {
      setStatus("Tento vlastní Glyph už v sadě je.");
      return;
    }
    if (state.customTokens.length >= MAX_CUSTOM) {
      setStatus("Sada má už maximum vlastních Glyphů.");
      return;
    }
    state.customTokens.push(value);
    dom.custom.value = "";
    save("vlastní Glyph");
    renderShelf();
    setStatus("Vlastní Glyph je přidaný. Nikam se nevložil automaticky.");
  }

  function selectUnit(rowId, unitId) {
    const unit = findUnit(rowId, unitId);
    if (!unit || unit.space) return;
    selected = { rowId, unitId };
    renderRows();
  }

  function applyToken(value) {
    if (!selected) {
      setStatus("Nejdřív vyber bubínek, do kterého Glyph patří.");
      return;
    }
    const unit = findUnit(selected.rowId, selected.unitId);
    const glyph = normaliseToken(value);
    if (!unit || unit.space || !glyph) return;
    unit.value = glyph;
    save("vložení Glyphu");
    renderRows();
    setStatus("Glyph je vložený jen do vybraného bubínku.");
  }

  function rotateUnit(rowId, unitId, direction) {
    const unit = findUnit(rowId, unitId);
    if (!unit || unit.space) return;
    const size = Math.max(1, graphemes(unit.value).length);
    const pool = tokenPool();
    const sizedPool = pool.filter(item => graphemes(item).length === size);
    const choices = sizedPool.length ? sizedPool : pool;
    const current = choices.indexOf(unit.value);
    unit.value = choices[modulo((current < 0 ? 0 : current) + direction, choices.length)];
    save("otočení bubínku");
    renderRows();
  }

  function removeRow(rowId) {
    const row = findRow(rowId);
    if (!row) return;
    state.rows = state.rows.filter(item => item.id !== rowId);
    if (selected?.rowId === rowId) selected = null;
    save("odebrání Glyph řádku");
    renderRows();
    setStatus("Řádek je odebraný jen z Glyph dílny.");
  }

  function rowText(row) {
    return row.units.map(unit => unit.space ? " " : unit.value).join("").trim();
  }

  function sendToSlot() {
    const text = state.rows.map(rowText).filter(Boolean).join("\n");
    if (!text) {
      setStatus("Dílna je prázdná. První Glyph vytvoříš ty.");
      return;
    }

    const transfer = { schema: "cht360-glyph-engine-transfer-v1", text, createdAt: new Date().toISOString() };
    try { localStorage.setItem("cht360_glyph_engine_transfer_v1", JSON.stringify(transfer)); } catch (_) {}
    window.dispatchEvent(new CustomEvent("cht.glyph.engine.transfer", { detail: transfer }));

    const slot = byId("slotContent");
    const saveSlot = byId("saveSlot");
    const editor = byId("slotEditor");
    if (!slot || !saveSlot || !editor?.classList.contains("open")) {
      setStatus("Glyph je bezpečně uložený v dílně. Pro vložení nejdřív otevři konkrétní slot.");
      return;
    }

    const start = Number.isFinite(slot.selectionStart) ? slot.selectionStart : slot.value.length;
    const end = Number.isFinite(slot.selectionEnd) ? slot.selectionEnd : start;
    slot.value = slot.value.slice(0, start) + text + slot.value.slice(end);
    const cursor = start + text.length;
    slot.focus();
    slot.setSelectionRange(cursor, cursor);
    slot.dispatchEvent(new Event("input", { bubbles: true }));
    saveSlot.click();
    setStatus("Glyph je vložený do otevřeného slotu a uložený.");
  }

  function exportState() {
    const payload = { format: "cht360-glyph-engine", version: 3, exportedAt: new Date().toISOString(), data: state };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "glyph-cht-360.json";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
    setStatus("Glyphy jsou exportované v čistém UTF-8.");
  }

  async function importState(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const raw = JSON.parse(await file.text());
      state = normaliseState(raw?.data || raw);
      selected = null;
      save("import Glyphů");
      renderAll();
      setStatus("Glyphy jsou načtené. Nic mimo dílnu se nepřepsalo.");
    } catch (_) {
      setStatus("Soubor Glyphů se nepodařilo načíst. Původní stav zůstal beze změny.");
    } finally {
      event.target.value = "";
    }
  }

  function renderAll() {
    renderModes();
    renderAlphabet();
    renderShelf();
    renderRows();
  }

  function renderModes() {
    dom.modes?.querySelectorAll("[data-glyph-mode]").forEach(button => {
      button.classList.toggle("is-active", button.dataset.glyphMode === mode);
    });
  }

  function renderAlphabet() {
    if (dom.alphabet) dom.alphabet.value = state.alphabet;
  }

  function renderShelf() {
    if (!dom.shelf) return;
    dom.shelf.textContent = "";
    tokenPool().forEach(value => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "glyph-engine__token";
      button.dataset.glyphToken = value;
      button.textContent = value;
      button.setAttribute("aria-label", "Vložit " + value + " do vybraného bubínku");
      dom.shelf.append(button);
    });
  }

  function renderRows() {
    if (!dom.rows) return;
    dom.rows.textContent = "";
    if (!state.rows.length) {
      const empty = document.createElement("p");
      empty.className = "glyph-engine__empty";
      empty.textContent = "Ještě tu není žádný řádek. První Glyph určíš ty.";
      dom.rows.append(empty);
      return;
    }

    state.rows.forEach(row => {
      const card = document.createElement("article");
      card.className = "glyph-engine__row";
      const head = document.createElement("header");
      head.className = "glyph-engine__row-head";
      const title = document.createElement("strong");
      title.textContent = row.name;
      const meta = document.createElement("span");
      meta.textContent = row.mode === "double" ? "2 znaky / bubínek" : "1 znak / bubínek";
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "glyph-engine__row-remove";
      remove.dataset.glyphRemoveRow = row.id;
      remove.textContent = "Odebrat";
      head.append(title, meta, remove);

      const rail = document.createElement("div");
      rail.className = "glyph-engine__drums";
      rail.setAttribute("aria-label", row.name);
      row.units.forEach(unit => {
        if (unit.space) {
          const space = document.createElement("span");
          space.className = "glyph-engine__space";
          space.setAttribute("aria-hidden", "true");
          rail.append(space);
          return;
        }
        const button = document.createElement("button");
        button.type = "button";
        button.className = "glyph-engine__drum";
        button.dataset.glyphRow = row.id;
        button.dataset.glyphUnit = unit.id;
        button.classList.toggle("is-selected", selected?.rowId === row.id && selected?.unitId === unit.id);
        const pool = tokenPool();
        const size = Math.max(1, graphemes(unit.value).length);
        const choices = pool.filter(item => graphemes(item).length === size);
        const visiblePool = choices.length ? choices : pool;
        const index = visiblePool.indexOf(unit.value);
        const current = index < 0 ? 0 : index;
        [visiblePool[modulo(current - 1, visiblePool.length)], unit.value, visiblePool[modulo(current + 1, visiblePool.length)]].forEach((value, index) => {
          const label = document.createElement("span");
          label.className = index === 1 ? "glyph-engine__current" : "glyph-engine__ghost";
          label.textContent = value;
          button.append(label);
        });
        button.setAttribute("aria-label", "Bubínek " + unit.value + ". Klepnutím otočíš další Glyph.");
        rail.append(button);
      });
      card.append(head, rail);
      dom.rows.append(card);
    });
  }

  return Object.freeze({
    open,
    close,
    getState: () => JSON.parse(JSON.stringify(state))
  });
})();

window.CHTGlyphEngine = CHTGlyphEngine;
