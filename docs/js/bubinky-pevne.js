"use strict";

/*
 * Pevných pět bubínků pro CHT 360°‰.
 * Připojený doplněk: nepřepisuje aplikace.js ani Paměť.
 */
(() => {
  const STORAGE_KEY = "cht360_glyph_fixed_five_v1";
  const LEGACY_VALUES_KEY = "cht360_glyph_drums_v1";
  const LEGACY_CUSTOM_KEY = "cht360_glyph_drums_custom_v1";
  const FIXED_DRUM_COUNT = 5;
  const EMPTY_GLYPH = "·";
  const SELECTION_TIMEOUT = 5000;
  const MAX_GLYPH_GRAPHEMES = 8;

  const BASE_TOKENS = Object.freeze([
    ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    ..."0123456789",
    "Á", "Č", "Ď", "É", "Ě", "Í", "Ň", "Ó", "Ř", "Š", "Ť", "Ú", "Ů", "Ý",
    "ア", "°", "‰", "•", "_", "-", "/", "\`", "´", "ˇ", "ī", "ı",
    "ï", "ø", "Ō", "Ï", "¯", "&", "(", ")", "*", "}", "{", "₹",
    "7i_", "ī´", "ˇ°i°ˇ", "._;´/\`", ",!", "ïø", "°Ō°", ".•cU•.",
    "-:x:-", "7/¯", "ı>o", "°&", "(\\*/)", "Ïo", "}{", "•N", "7₹"
  ]);

  const DEFAULT_VALUES = Object.freeze([
    "7i_", "ī´", "ˇ°i°ˇ", ".•cU•.", EMPTY_GLYPH
  ]);

  let state = loadState();
  let selectedIndex = null;
  let selectionTimer = null;
  let dom = null;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startWhenReady, { once: true });
  } else {
    startWhenReady();
  }

  function startWhenReady() {
    let frames = 0;

    const waitForBaseDrums = () => {
      const rack = document.getElementById("glyphDrums");

      if (rack?.querySelector(".glyphDrum") || frames >= 120) {
        activate();
        return;
      }

      frames += 1;
      requestAnimationFrame(waitForBaseDrums);
    };

    waitForBaseDrums();
  }

  function activate() {
    const drumRack = document.getElementById("glyphDrums");
    const inputBefore = document.getElementById("glyphCustom");
    const addBefore = document.getElementById("glyphAddToken");
    const actions = document.querySelector(".glyphActions");

    if (!drumRack || !inputBefore || !addBefore || !actions) {
      return;
    }

    injectStyles();

    const input = inputBefore.cloneNode(true);
    input.id = "glyphCustom";
    input.value = "";
    input.placeholder = "Glyph pro vybraný bubínek";
    input.setAttribute("aria-label", "Glyph pro vybraný bubínek");
    inputBefore.replaceWith(input);

    const addButton = addBefore.cloneNode(false);
    addButton.id = "glyphAddToken";
    addButton.type = "button";
    addButton.textContent = "Přidat Glyph";
    addButton.setAttribute("aria-label", "Přidat Glyph do vybraného bubínku");
    addBefore.replaceWith(addButton);

    ["glyphAddDrum", "glyphInsert", "glyphReset"].forEach(id => {
      document.getElementById(id)?.remove();
    });

    const removeButton = document.createElement("button");
    removeButton.id = "glyphRemoveToken";
    removeButton.className = "glyphRemoveToken";
    removeButton.type = "button";
    removeButton.textContent = "Odebrat Glyph";
    removeButton.setAttribute("aria-label", "Odebrat Glyph z vybraného bubínku");
    actions.prepend(removeButton);

    const hint = document.querySelector(".glyphComposerTop span");
    if (hint) {
      hint.id = "glyphFixedHint";
      hint.setAttribute("aria-live", "polite");
    }

    drumRack.classList.add("glyphFixedFive");
    drumRack.setAttribute("aria-label", "Pět pevných Glyph bubínků");

    dom = { rack: drumRack, input, addButton, removeButton, hint };

    addButton.addEventListener("click", addGlyph);
    removeButton.addEventListener("click", removeGlyph);

    input.addEventListener("keydown", event => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      addGlyph();
    });

    render();
    setHint("Klepni na bubínek: rozsvítí se jako cíl pro Glyph.");
  }

  function loadState() {
    const saved = readJson(STORAGE_KEY);
    if (saved) return normaliseState(saved);

    const legacyCustom = readJson(LEGACY_CUSTOM_KEY);
    const customTokens = Array.isArray(legacyCustom)
      ? legacyCustom.map(normaliseGlyph).filter(Boolean)
      : [];

    const legacyValues = readJson(LEGACY_VALUES_KEY);
    const values = Array.isArray(legacyValues)
      ? legacyValues.slice(0, FIXED_DRUM_COUNT).map(value => {
          const index = Number(value);
          return BASE_TOKENS[positiveModulo(
            Number.isFinite(index) ? index : 0,
            BASE_TOKENS.length
          )] || EMPTY_GLYPH;
        })
      : [...DEFAULT_VALUES];

    return normaliseState({ values, customTokens });
  }

  function normaliseState(candidate) {
    const raw = candidate && typeof candidate === "object" ? candidate : {};
    const values = Array.isArray(raw.values)
      ? raw.values.map(normaliseGlyph).filter(Boolean).slice(0, FIXED_DRUM_COUNT)
      : [];

    while (values.length < FIXED_DRUM_COUNT) {
      values.push(EMPTY_GLYPH);
    }

    const customTokens = unique(
      Array.isArray(raw.customTokens)
        ? raw.customTokens.map(normaliseGlyph).filter(Boolean)
        : []
    ).slice(-96);

    return { values, customTokens };
  }

  function render() {
    if (!dom) return;

    dom.rack.textContent = "";

    state.values.forEach((glyph, index) => {
      const button = document.createElement("button");
      const previous = document.createElement("span");
      const current = document.createElement("strong");
      const next = document.createElement("span");
      const tier = glyphTier(glyph);

      button.type = "button";
      button.className = "glyphDrum glyphFixedDrum";
      button.dataset.glyphFixedIndex = String(index);
      button.dataset.glyphTier = String(tier);
      button.style.setProperty("--glyph-weight", String(glyphWeight(tier)));
      button.style.setProperty("--glyph-basis", glyphBasis(tier));
      button.classList.toggle("is-glyph-target", selectedIndex === index);

      previous.className = "glyphDrumGhost";
      previous.textContent = tokenAt(index, -1);

      current.className = "glyphDrumCurrent";
      current.textContent = glyph;
      current.title = glyph;

      next.className = "glyphDrumGhost";
      next.textContent = tokenAt(index, 1);

      button.append(previous, current, next);
      attachDrumGesture(button, index);
      dom.rack.append(button);
    });

    paintSelection();
  }

  function attachDrumGesture(button, index) {
    let drag = null;

    button.addEventListener("pointerdown", event => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      event.preventDefault();
      selectDrum(index);

      drag = {
        pointerId: event.pointerId,
        startY: event.clientY,
        lastStep: 0,
        moved: false
      };

      button.setPointerCapture?.(event.pointerId);
      button.classList.add("is-dragging");
    });

    button.addEventListener("pointermove", event => {
      if (!drag || drag.pointerId !== event.pointerId) return;

      const step = Math.trunc((drag.startY - event.clientY) / 20);
      if (step === drag.lastStep) return;

      rotateGlyph(index, step - drag.lastStep, false);
      drag.lastStep = step;
      drag.moved = true;
    });

    const finish = (event, cancelled = false) => {
      if (!drag || drag.pointerId !== event.pointerId) return;

      const didMove = drag.moved;

      if (button.hasPointerCapture?.(event.pointerId)) {
        button.releasePointerCapture(event.pointerId);
      }

      drag = null;
      button.classList.remove("is-dragging");

      if (!cancelled && !didMove) {
        rotateGlyph(index, 1);
      } else if (didMove) {
        render();
      }
    };

    button.addEventListener("pointerup", event => finish(event));
    button.addEventListener("pointercancel", event => finish(event, true));

    button.addEventListener("keydown", event => {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        rotateGlyph(index, 1);
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        rotateGlyph(index, -1);
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        rotateGlyph(index, 1);
      }
    });
  }

  function selectDrum(index) {
    selectedIndex = index;
    clearTimeout(selectionTimer);

    selectionTimer = window.setTimeout(() => {
      selectedIndex = null;
      paintSelection();
      setHint("Výběr zhasl. Klepni na bubínek, kam chceš přidat Glyph.");
    }, SELECTION_TIMEOUT);

    paintSelection();
    setHint("Vybraný bubínek " + (index + 1) + " svítí pět vteřin.");
  }

  function paintSelection() {
    if (!dom) return;

    dom.rack.querySelectorAll("[data-glyph-fixed-index]").forEach(button => {
      const index = Number(button.dataset.glyphFixedIndex);
      const active = selectedIndex === index;

      button.classList.toggle("is-glyph-target", active);
      button.setAttribute(
        "aria-label",
        "Bubínek " + (index + 1) + ": " + state.values[index] +
        (active ? ". Vybraný cíl pro Glyph." : "")
      );
    });

    dom.addButton.disabled = selectedIndex === null;
    dom.removeButton.disabled = selectedIndex === null;
  }

  function rotateGlyph(index, direction, renderAfter = true) {
    const pool = tokenPool();
    const current = pool.indexOf(state.values[index]);
    const target = positiveModulo(
      (current < 0 ? 0 : current) + direction,
      pool.length
    );

    state.values[index] = pool[target];
    selectDrum(index);
    save("otočení bubínku", renderAfter);

    if (!renderAfter) refreshDrum(index);
  }

  function refreshDrum(index) {
    const button = dom?.rack.querySelector(
      "[data-glyph-fixed-index='" + index + "']"
    );

    if (!button) {
      render();
      return;
    }

    const glyph = state.values[index];
    const tier = glyphTier(glyph);
    const previous = button.querySelector(".glyphDrumGhost:first-child");
    const current = button.querySelector(".glyphDrumCurrent");
    const next = button.querySelector(".glyphDrumGhost:last-child");

    button.dataset.glyphTier = String(tier);
    button.style.setProperty("--glyph-weight", String(glyphWeight(tier)));
    button.style.setProperty("--glyph-basis", glyphBasis(tier));
    button.classList.toggle("is-glyph-target", selectedIndex === index);

    if (previous) previous.textContent = tokenAt(index, -1);
    if (current) {
      current.textContent = glyph;
      current.title = glyph;
    }
    if (next) next.textContent = tokenAt(index, 1);
  }

  function addGlyph() {
    if (!requireSelectedTarget()) return;

    const glyph = normaliseGlyph(dom.input.value);
    if (!glyph) {
      setHint("Napiš nejdřív Glyph, který chceš vložit.");
      dom.input.focus();
      return;
    }

    if (!state.customTokens.includes(glyph) && !BASE_TOKENS.includes(glyph)) {
      state.customTokens.push(glyph);
      state.customTokens = state.customTokens.slice(-96);
    }

    state.values[selectedIndex] = glyph;
    dom.input.value = "";
    save("přidání Glyphu");
    selectDrum(selectedIndex);
    setHint("Glyph je vložený do bubínku " + (selectedIndex + 1) + ".");
  }

  function removeGlyph() {
    if (!requireSelectedTarget()) return;

    state.values[selectedIndex] = EMPTY_GLYPH;
    save("odebrání Glyphu");
    selectDrum(selectedIndex);
    setHint("Glyph je odebraný z bubínku " + (selectedIndex + 1) + ".");
  }

  function requireSelectedTarget() {
    if (selectedIndex !== null) return true;

    setHint("Nejdřív klepni na bubínek. Rozsvítí se jako místo pro Glyph.");
    return false;
  }

  function tokenPool() {
    return unique([EMPTY_GLYPH, ...BASE_TOKENS, ...state.customTokens]);
  }

  function tokenAt(index, offset) {
    const pool = tokenPool();
    const current = pool.indexOf(state.values[index]);

    return pool[positiveModulo((current < 0 ? 0 : current) + offset, pool.length)];
  }

  function glyphTier(glyph) {
    const count = graphemes(glyph).length;
    if (count <= 1) return 1;
    if (count <= 3) return 2;
    return 3;
  }

  function glyphWeight(tier) {
    return tier === 3 ? 1.28 : tier === 2 ? 1.14 : 1;
  }

  function glyphBasis(tier) {
    return tier === 3 ? "74px" : tier === 2 ? "66px" : "58px";
  }

  function save(reason, renderAfter = true) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 1,
        values: state.values,
        customTokens: state.customTokens,
        updatedAt: new Date().toISOString()
      }));
    } catch (_) {
      setHint("Změna je vidět, ale prohlížeč ji teď nemůže uložit.");
    }

    window.dispatchEvent(new CustomEvent("cht.glyph.drums.changed", {
      detail: {
        source: "fixed-five",
        reason,
        values: [...state.values],
        selectedIndex
      }
    }));

    if (renderAfter) render();
  }

  function setHint(message) {
    if (dom?.hint) dom.hint.textContent = message;
  }

  function normaliseGlyph(value) {
    const clean = String(value || "").trim().normalize("NFC");
    const parts = graphemes(clean);

    if (!parts.length || parts.length > MAX_GLYPH_GRAPHEMES) {
      return "";
    }

    return parts.join("");
  }

  function graphemes(value) {
    const source = String(value || "");

    if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
      return Array.from(
        new Intl.Segmenter("cs", { granularity: "grapheme" }).segment(source),
        item => item.segment
      );
    }

    return Array.from(source);
  }

  function readJson(key) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (_) {
      return null;
    }
  }

  function unique(values) {
    return Array.from(new Set(values.filter(Boolean)));
  }

  function positiveModulo(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
  }

  function injectStyles() {
    if (document.getElementById("glyph-fixed-five-style")) return;

    const style = document.createElement("style");
    style.id = "glyph-fixed-five-style";
    style.textContent = `
      .glyphComposer .glyphFixedFive {
        display: flex;
        align-items: stretch;
        justify-content: center;
        gap: clamp(5px, .9vw, 9px);
        width: 100%;
        max-width: 100%;
        min-width: 0;
        padding: 4px 0 7px;
        overflow: hidden;
        overscroll-behavior-x: none;
        contain: layout paint;
      }

      .glyphComposer .glyphFixedFive .glyphFixedDrum {
        flex: var(--glyph-weight, 1) 1 var(--glyph-basis, 58px);
        min-width: 0;
        max-width: min(108px, 23%);
        height: 78px;
        min-height: 78px;
        margin: 0;
        overflow: hidden;
        touch-action: none;
      }

      .glyphComposer .glyphFixedFive .glyphFixedDrum[data-glyph-tier="3"] {
        max-width: min(116px, 25%);
      }

      .glyphComposer .glyphFixedFive .glyphDrumCurrent {
        max-width: calc(100% - 10px);
        padding: 0 3px;
        overflow: hidden;
        font-size: clamp(13px, 2vw, 17px);
        line-height: 1.1;
        text-overflow: ellipsis;
      }

      .glyphComposer .glyphFixedFive .glyphFixedDrum[data-glyph-tier="2"] .glyphDrumCurrent {
        font-size: clamp(12px, 1.8vw, 15px);
      }

      .glyphComposer .glyphFixedFive .glyphFixedDrum[data-glyph-tier="3"] .glyphDrumCurrent {
        font-size: clamp(10px, 1.55vw, 13px);
      }

      .glyphComposer .glyphFixedFive .glyphDrumGhost {
        max-width: calc(100% - 10px);
        padding: 0 3px;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .glyphComposer .glyphFixedFive .glyphFixedDrum.is-glyph-target {
        border-color: #fff0c5;
        background:
          radial-gradient(circle at 50% 50%, rgba(255, 228, 168, .31), transparent 58%),
          rgba(15, 11, 6, .93);
        box-shadow:
          0 0 0 2px rgba(255, 220, 150, .40),
          0 0 28px rgba(255, 206, 113, .78),
          inset 0 0 21px rgba(255, 235, 190, .22);
        animation: glyphFixedTargetPulse 1.08s ease-in-out infinite;
      }

      .glyphComposer .glyphFixedFive .glyphFixedDrum.is-glyph-target .glyphDrumCurrent {
        color: #fff8e7;
        text-shadow: 0 0 16px rgba(255, 233, 181, 1);
      }

      @keyframes glyphFixedTargetPulse {
        50% {
          transform: translateY(-1px) scale(1.025);
          filter: brightness(1.13);
        }
      }

      .glyphComposer .glyphRemoveToken {
        border-color: rgba(255, 169, 169, .36);
        color: #ffdada;
      }

      .glyphComposer .glyphRemoveToken:disabled,
      .glyphComposer #glyphAddToken:disabled {
        opacity: .45;
        cursor: not-allowed;
      }

      @media (max-width: 560px) {
        .glyphComposer .glyphFixedFive {
          gap: 5px;
        }

        .glyphComposer .glyphFixedFive .glyphFixedDrum {
          height: 72px;
          min-height: 72px;
        }
      }
    `;

    document.head.append(style);
  }
})();