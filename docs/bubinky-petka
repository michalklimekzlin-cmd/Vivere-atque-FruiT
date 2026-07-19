"use strict";

/*
 * Pojistka pětky pro CHT 360°‰.
 * Připojuje se až po původních skriptech a přebírá pouze bubínky.
 */
(() => {
  const STORAGE_KEY = "cht360_glyph_five_guard_v1";
  const COUNT = 5;
  const EMPTY = "·";
  const TARGET_TIMEOUT = 5000;
  const DEFAULT_VALUES = ["7i_", "ī´", "ˇ°i°ˇ", ".•cU•.", EMPTY];
  const BASE_TOKENS = [
    EMPTY,
    ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    ..."0123456789",
    "Á", "Č", "Ď", "É", "Ě", "Í", "Ň", "Ó", "Ř", "Š", "Ť", "Ú", "Ů", "Ý",
    "°", "‰", "•", "_", "-", "/", "´", "ˇ", "ī", "ı", "ï", "ø",
    "7i_", "ī´", "ˇ°i°ˇ", ".•cU•.", "7/¯", "}{", "•N", "7₹"
  ];

  let state = null;
  let selectedIndex = null;
  let targetTimer = null;
  let dom = null;

  if (document.readyState === "complete") {
    boot();
  } else {
    window.addEventListener("load", boot, { once: true });
  }

  function boot() {
    const rack = document.getElementById("glyphDrums");
    const inputBefore = document.getElementById("glyphCustom");
    const addBefore = document.getElementById("glyphAddToken");
    const actions = document.querySelector(".glyphActions");

    if (!rack || !inputBefore || !addBefore || !actions) return;

    state = loadState(rack);
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
    addBefore.replaceWith(addButton);

    ["glyphAddDrum", "glyphInsert", "glyphReset", "glyphRemoveToken"].forEach(id => {
      document.getElementById(id)?.remove();
    });

    const removeButton = document.createElement("button");
    removeButton.id = "glyphRemoveToken";
    removeButton.type = "button";
    removeButton.textContent = "Odebrat Glyph";
    actions.prepend(removeButton);

    const hint = document.querySelector(".glyphComposerTop span");
    if (hint) hint.setAttribute("aria-live", "polite");

    rack.classList.add("glyphFiveGuard");
    rack.setAttribute("aria-label", "Pět pevných Glyph bubínků");

    dom = { rack, input, addButton, removeButton, hint };

    addButton.addEventListener("click", addGlyph);
    removeButton.addEventListener("click", removeGlyph);
    input.addEventListener("keydown", event => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      addGlyph();
    });

    render();
    setHint("Vyber bubínek. Rozsvítí se jako cíl pro Glyph.");
  }

  function loadState(rack) {
    const saved = readJson(STORAGE_KEY);
    const visible = Array.from(
      rack.querySelectorAll(".glyphDrumCurrent"),
      node => cleanGlyph(node.textContent)
    ).filter(Boolean);

    const savedValues = Array.isArray(saved?.values)
      ? saved.values.map(cleanGlyph).filter(Boolean)
      : [];

    const rawValues = savedValues.length
      ? savedValues
      : (visible.length ? visible : DEFAULT_VALUES);

    const values = Array.from(
      { length: COUNT },
      (_, index) => rawValues[index] || EMPTY
    );

    const custom = Array.isArray(saved?.custom)
      ? unique(saved.custom.map(cleanGlyph).filter(Boolean)).slice(-80)
      : [];

    return { values, custom };
  }

  function render() {
    if (!dom || !state) return;

    dom.rack.textContent = "";

    state.values.forEach((glyph, index) => {
      const button = document.createElement("button");
      const previous = document.createElement("span");
      const current = document.createElement("strong");
      const next = document.createElement("span");

      button.type = "button";
      button.className = "glyphDrum glyphFiveGuardDrum";
      button.dataset.glyphFiveIndex = String(index);
      button.dataset.glyphSize = glyphSize(glyph);

      previous.className = "glyphDrumGhost";
      previous.textContent = tokenAt(index, -1);

      current.className = "glyphDrumCurrent";
      current.textContent = glyph;
      current.title = glyph;

      next.className = "glyphDrumGhost";
      next.textContent = tokenAt(index, 1);

      button.append(previous, current, next);
      bindDrum(button, index);
      dom.rack.append(button);
    });

    paintTarget();
  }

  function bindDrum(button, index) {
    let pointerId = null;
    let startY = 0;

    button.addEventListener("pointerdown", event => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      event.preventDefault();
      pointerId = event.pointerId;
      startY = event.clientY;
      button.setPointerCapture?.(pointerId);
      select(index);
      button.classList.add("is-dragging");
    });

    button.addEventListener("pointerup", event => {
      if (pointerId !== event.pointerId) return;

      const steps = Math.trunc((startY - event.clientY) / 18);

      if (button.hasPointerCapture?.(pointerId)) {
        button.releasePointerCapture(pointerId);
      }

      pointerId = null;
      button.classList.remove("is-dragging");

      if (steps) rotate(index, steps);
    });

    button.addEventListener("pointercancel", event => {
      if (pointerId !== event.pointerId) return;

      if (button.hasPointerCapture?.(pointerId)) {
        button.releasePointerCapture(pointerId);
      }

      pointerId = null;
      button.classList.remove("is-dragging");
    });

    button.addEventListener("keydown", event => {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        rotate(index, 1);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        rotate(index, -1);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        select(index);
      }
    });
  }

  function select(index) {
    selectedIndex = index;
    clearTimeout(targetTimer);

    targetTimer = window.setTimeout(() => {
      selectedIndex = null;
      paintTarget();
      setHint("Výběr zhasl. Klepni na bubínek, kam chceš Glyph.");
    }, TARGET_TIMEOUT);

    paintTarget();
    setHint("Bubínek " + (index + 1) + " svítí pět vteřin.");
  }

  function paintTarget() {
    if (!dom) return;

    dom.rack.querySelectorAll("[data-glyph-five-index]").forEach(button => {
      const index = Number(button.dataset.glyphFiveIndex);
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

  function rotate(index, steps) {
    const tokens = tokenPool();
    const current = tokens.indexOf(state.values[index]);

    state.values[index] = tokens[
      modulo((current < 0 ? 0 : current) + steps, tokens.length)
    ];

    save();
    select(index);
    render();
  }

  function addGlyph() {
    if (!selected()) return;

    const glyph = cleanGlyph(dom.input.value);

    if (!glyph) {
      setHint("Napiš Glyph, který chceš vložit.");
      dom.input.focus();
      return;
    }

    if (!BASE_TOKENS.includes(glyph) && !state.custom.includes(glyph)) {
      state.custom.push(glyph);
      state.custom = state.custom.slice(-80);
    }

    state.values[selectedIndex] = glyph;
    dom.input.value = "";
    save();
    render();
    select(selectedIndex);
    setHint("Glyph je vložený do bubínku " + (selectedIndex + 1) + ".");
  }

  function removeGlyph() {
    if (!selected()) return;

    state.values[selectedIndex] = EMPTY;
    save();
    render();
    select(selectedIndex);
    setHint("Glyph je odebraný z bubínku " + (selectedIndex + 1) + ".");
  }

  function selected() {
    if (selectedIndex !== null) return true;

    setHint("Nejdřív klepni na bubínek.");
    return false;
  }

  function tokenPool() {
    return unique([...BASE_TOKENS, ...state.custom]);
  }

  function tokenAt(index, offset) {
    const tokens = tokenPool();
    const current = tokens.indexOf(state.values[index]);

    return tokens[
      modulo((current < 0 ? 0 : current) + offset, tokens.length)
    ];
  }

  function glyphSize(glyph) {
    const length = Array.from(glyph).length;
    return length > 3 ? "wide" : length > 1 ? "medium" : "normal";
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {
      setHint("Změna je vidět, ale Safari ji teď nemůže uložit.");
    }
  }

  function setHint(message) {
    if (dom?.hint) dom.hint.textContent = message;
  }

  function cleanGlyph(value) {
    return Array.from(
      String(value || "").trim().normalize("NFC")
    ).slice(0, 8).join("");
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

  function modulo(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
  }

  function injectStyles() {
    if (document.getElementById("glyph-five-guard-style")) return;

    const style = document.createElement("style");
    style.id = "glyph-five-guard-style";
    style.textContent = `
      .glyphComposer .glyphFiveGuard {
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

      .glyphComposer .glyphFiveGuard .glyphFiveGuardDrum {
        flex: 1 1 0;
        min-width: 0;
        max-width: 21%;
        height: 78px;
        min-height: 78px;
        margin: 0;
        overflow: hidden;
        touch-action: none;
      }

      .glyphComposer .glyphFiveGuard .glyphFiveGuardDrum[data-glyph-size="medium"] {
        flex-grow: 1.16;
      }

      .glyphComposer .glyphFiveGuard .glyphFiveGuardDrum[data-glyph-size="wide"] {
        flex-grow: 1.3;
        max-width: 24%;
      }

      .glyphComposer .glyphFiveGuard .glyphDrumCurrent,
      .glyphComposer .glyphFiveGuard .glyphDrumGhost {
        max-width: calc(100% - 10px);
        padding: 0 3px;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .glyphComposer .glyphFiveGuard .glyphFiveGuardDrum[data-glyph-size="medium"] .glyphDrumCurrent {
        font-size: clamp(12px, 1.8vw, 15px);
      }

      .glyphComposer .glyphFiveGuard .glyphFiveGuardDrum[data-glyph-size="wide"] .glyphDrumCurrent {
        font-size: clamp(10px, 1.55vw, 13px);
      }

      .glyphComposer .glyphFiveGuard .glyphFiveGuardDrum.is-glyph-target {
        border-color: #fff0c5;
        background:
          radial-gradient(circle at 50% 50%, rgba(255, 228, 168, .31), transparent 58%),
          rgba(15, 11, 6, .93);
        box-shadow:
          0 0 0 2px rgba(255, 220, 150, .40),
          0 0 28px rgba(255, 206, 113, .78),
          inset 0 0 21px rgba(255, 235, 190, .22);
        animation: glyphFiveTargetPulse 1.08s ease-in-out infinite;
      }

      .glyphComposer .glyphFiveGuard .glyphFiveGuardDrum.is-glyph-target .glyphDrumCurrent {
        color: #fff8e7;
        text-shadow: 0 0 16px rgba(255, 233, 181, 1);
      }

      @keyframes glyphFiveTargetPulse {
        50% {
          transform: translateY(-1px) scale(1.025);
          filter: brightness(1.13);
        }
      }

      .glyphComposer #glyphRemoveToken {
        border-color: rgba(255, 169, 169, .36);
        color: #ffdada;
      }

      .glyphComposer #glyphRemoveToken:disabled,
      .glyphComposer #glyphAddToken:disabled {
        opacity: .45;
        cursor: not-allowed;
      }

      @media (max-width: 560px) {
        .glyphComposer .glyphFiveGuard {
          gap: 5px;
        }

        .glyphComposer .glyphFiveGuard .glyphFiveGuardDrum {
          height: 72px;
          min-height: 72px;
        }
      }
    `;

    document.head.append(style);
  }
})();