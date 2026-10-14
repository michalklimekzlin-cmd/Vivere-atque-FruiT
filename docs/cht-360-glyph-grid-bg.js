/**
 * CHT 360°‰. — živé glyphové pozadí ze slotů Paměti
 * Soubor: docs/js/cht-360-glyph-grid-bg.js
 * Zachované veřejné funkce: refresh(), rebuild()
 */
(function (window, document) {
  "use strict";

  if (window.CHT360GlyphGridBackground?.__ready) {
    window.CHT360GlyphGridBackground.refresh();
    return;
  }

  const MEMORY_KEY = "cht360_pamet_v1";
  const GRID_MM = 3.5;
  const ROTATION_DURATION = 48;
  const MAX_GLYPHS = 700;
  const CORES = ["earth", "game", "language", "control"];
  const FALLBACK_GLYPHS = ["˚&", "'i'", "7¡", "`९נֶ", "•ア", "7i_", "°&", "j’", "i’", "¿", ",!,", ",_."];

  let layer = null;
  let resizeTimer = 0;
  let lastSignature = "";

  function mmToPx(mm) {
    // Přibližný převod; skutečné fyzické mm se na telefonech liší.
    return mm * 96 / 25.4;
  }

  function readMemory() {
    try {
      const raw = window.localStorage.getItem(MEMORY_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data && typeof data === "object" ? data : null;
    } catch (error) {
      console.warn("[CHT 360°‰.] Paměť nelze přečíst:", error);
      return null;
    }
  }

  function extractText(slot) {
    if (slot == null) return "";
    if (typeof slot === "string" || typeof slot === "number") return String(slot).trim();
    if (typeof slot !== "object") return "";
    for (const key of ["glyph", "text", "content", "value", "note", "name", "label"]) {
      if (slot[key] != null && String(slot[key]).trim()) return String(slot[key]).trim();
    }
    return "";
  }

  function collectSlotContents(memory) {
    const items = [];
    if (!memory) return items;
    const roots = memory.cores || memory.jadra || memory;
    const aliases = {
      earth: ["earth", "zeme", "země", "slot1", "slot_1"],
      game: ["game", "hra", "slot2", "slot_2"],
      language: ["language", "jazyk", "mluva", "slot3", "slot_3"],
      control: ["control", "ovladani", "ovládání", "system"]
    };

    for (const coreId of CORES) {
      let core = null;
      for (const alias of aliases[coreId]) {
        if (roots && roots[alias] != null) { core = roots[alias]; break; }
      }
      if (core == null) continue;

      let slots = Array.isArray(core) ? core :
        (Array.isArray(core.slots) ? core.slots :
        (Array.isArray(core.items) ? core.items :
        (Array.isArray(core.sloty) ? core.sloty : null)));

      if (!slots && typeof core === "object") {
        slots = [];
        for (let i = 1; i <= 70; i++) slots.push(core["slot" + i] ?? core["slot_" + i] ?? null);
      }
      if (!slots) continue;

      slots.forEach((slot, index) => {
        const text = extractText(slot);
        if (text) items.push({
          coreId,
          slotId: Number(slot && slot.id) || index + 1,
          text: text.slice(0, 48)
        });
      });
    }

    if (!items.length) {
      const flat = memory.slots || memory.sloty || memory.items;
      if (Array.isArray(flat)) flat.forEach((slot, index) => {
        const text = extractText(slot);
        if (text) items.push({
          coreId: String(slot && (slot.coreId || slot.core || slot.jadro) || "memory"),
          slotId: Number(slot && slot.id) || index + 1,
          text: text.slice(0, 48)
        });
      });
    }
    return items.slice(0, MAX_GLYPHS);
  }

  function ensureStyle() {
    if (document.getElementById("cht360-glyph-grid-style")) return;
    const style = document.createElement("style");
    style.id = "cht360-glyph-grid-style";
    style.textContent = `
      #cht360-glyph-grid-layer {
        position: fixed; inset: 0; z-index: 1; pointer-events: none;
        overflow: hidden; contain: layout paint style; background: transparent;
        opacity: .76;
      }
      #cht360-glyph-grid-layer .cht360-trace {
        position: absolute; display: block; pointer-events: none;
        transform-origin: center;
        background: linear-gradient(90deg, transparent, rgba(255,220,155,.10), transparent);
      }
      #cht360-glyph-grid-layer .cht360-trace.vertical {
        width: 1px; height: 140%; top: -20%;
        background: linear-gradient(180deg, transparent, rgba(255,220,155,.12), transparent);
      }
      #cht360-glyph-grid-layer .cht360-trace.horizontal {
        height: 1px; width: 140%; left: -20%;
      }
      #cht360-glyph-grid-layer .cht360-glyph-cell {
        position: absolute; display: grid; place-items: center;
        width: ${mmToPx(GRID_MM)}px; height: ${mmToPx(GRID_MM)}px;
        overflow: visible; color: rgba(255,226,173,.56);
        font: 600 clamp(7px, 1.5vw, 11px)/1 system-ui, sans-serif;
        text-shadow: 0 0 5px rgba(255,198,95,.24);
        white-space: nowrap; transform-origin: center;
        animation: cht360GlyphDrift ${ROTATION_DURATION}s linear infinite;
      }
      #cht360-glyph-grid-layer .cht360-glyph-cell[data-core="earth"] { color: rgba(175,224,169,.72); }
      #cht360-glyph-grid-layer .cht360-glyph-cell[data-core="game"] { color: rgba(255,206,125,.74); }
      #cht360-glyph-grid-layer .cht360-glyph-cell[data-core="language"] { color: rgba(192,211,255,.72); }
      #cht360-glyph-grid-layer .cht360-glyph-cell[data-user-content="true"] {
        font-weight: 800; text-shadow: 0 0 7px rgba(255,220,150,.52);
      }
      @keyframes cht360GlyphDrift { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
      @media (prefers-reduced-motion: reduce) {
        #cht360-glyph-grid-layer .cht360-glyph-cell { animation: none; }
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function ensureLayer() {
    layer = document.getElementById("cht360-glyph-grid-layer");
    if (!layer) {
      layer = document.createElement("div");
      layer.id = "cht360-glyph-grid-layer";
      layer.setAttribute("aria-hidden", "true");
      (document.body || document.documentElement).appendChild(layer);
    }
    const stage = document.querySelector(".stage");
    if (stage && stage.parentNode && layer.parentNode !== stage.parentNode) {
      stage.parentNode.insertBefore(layer, stage);
    }
  }

  function buildGrid() {
    if (!layer) return;
    const items = collectSlotContents(readMemory());
    const fallback = items.length === 0;
    const contents = fallback ? FALLBACK_GLYPHS.map((text, i) => ({
      coreId: CORES[i % CORES.length], slotId: i + 1, text
    })) : items;

    const width = Math.max(window.innerWidth || 320, 320);
    const height = Math.max(window.innerHeight || 568, 568);
    const gap = mmToPx(GRID_MM);
    const signature = JSON.stringify(contents) + "|" + width + "x" + height;
    if (signature === lastSignature && layer.childElementCount) return;
    lastSignature = signature;
    layer.replaceChildren();

    // Jemná doplňková síť. Lehké úhly připomínají trajektorie původního rozhraní.
    const traces = document.createDocumentFragment();
    const traceGap = gap * 4;
    for (let x = traceGap; x < width; x += traceGap) {
      const line = document.createElement("i");
      line.className = "cht360-trace vertical";
      line.style.left = x + "px";
      line.style.transform = "rotate(" + (Math.sin(x / 145) * 1.8) + "deg)";
      traces.appendChild(line);
    }
    for (let y = traceGap; y < height; y += traceGap) {
      const line = document.createElement("i");
      line.className = "cht360-trace horizontal";
      line.style.top = y + "px";
      line.style.transform = "rotate(" + (Math.sin(y / 125) * .8) + "deg)";
      traces.appendChild(line);
    }
    layer.appendChild(traces);

    // Rozumný limit prvků pro iPhone; pozice zůstávají v pravidelné síti.
    const rawCols = Math.ceil(width / gap) + 1;
    const rawRows = Math.ceil(height / gap) + 1;
    const stride = Math.max(1, Math.ceil(Math.sqrt((rawCols * rawRows) / MAX_GLYPHS)));
    const cellGap = gap * stride;
    const cols = Math.ceil(width / cellGap) + 1;
    const rows = Math.ceil(height / cellGap) + 1;
    const fragment = document.createDocumentFragment();
    let index = 0;

    for (let row = 0; row < rows && index < MAX_GLYPHS; row++) {
      for (let col = 0; col < cols && index < MAX_GLYPHS; col++) {
        const item = contents[index % contents.length];
        const el = document.createElement("span");
        el.className = "cht360-glyph-cell";
        el.textContent = item.text;
        el.title = item.coreId + " · Slot " + item.slotId;
        el.dataset.core = String(item.coreId || "memory").toLowerCase();
        el.dataset.userContent = fallback ? "false" : "true";
        el.style.left = (col * cellGap) + "px";
        el.style.top = (row * cellGap) + "px";
        el.style.animationDelay = (-(index % 17) * (ROTATION_DURATION / 17)) + "s";
        fragment.appendChild(el);
        index++;
      }
    }
    layer.appendChild(fragment);
  }

  function refresh() {
    ensureStyle();
    ensureLayer();
    buildGrid();
  }

  function rebuild() {
    lastSignature = "";
    refresh();
  }

  window.CHT360GlyphGridBackground = {
    __ready: true,
    refresh,
    rebuild,
    gridMillimeters: GRID_MM
  };

  function scheduleRebuild() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(rebuild, 120);
  }
  function onMemoryEvent() { lastSignature = ""; refresh(); }

  window.addEventListener("resize", scheduleRebuild, { passive: true });
  window.addEventListener("orientationchange", scheduleRebuild, { passive: true });
  window.addEventListener("storage", function (event) {
    if (!event || !event.key || event.key === MEMORY_KEY) onMemoryEvent();
  });

  [
    "cht.memory.changed", "cht.slot.saved",
    "cht360:memory-changed", "cht360:slot-saved",
    "cht360:braska-live-ready"
  ].forEach(name => document.addEventListener(name, onMemoryEvent));

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refresh, { once: true });
  } else {
    refresh();
  }
})(window, document);
