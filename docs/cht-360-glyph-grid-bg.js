/**
 * CHT 360°‰. — živé glyphové pozadí ze slotů Paměti
 * Zachovává existující scénu a ovládání; vrstva je dekorativní a neblokuje dotyky.
 */
(function (window, document) {
  "use strict";
  if (window.__CHT360_GLYPH_GRID_BG__) return;
  window.__CHT360_GLYPH_GRID_BG__ = true;

  const MEMORY_KEYS = ["cht360_pamet_v1", "cht360_vivere_fruit_core_v1_slots", "vivere_ai_memory"];
  const GRID_MM = 3.5;
  const ROTATION_DURATION = 48;
  const MAX_GLYPHS = 280;
  const FALLBACK = ["˚&", "'i'", "7¡", "`९נֶ", "•ア", "7i_", "°&", "j’", "i’", "¿", ",!,", ",_."];

  function readStored(key) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (_) {
      return null;
    }
  }

  function collect(value, output, coreName) {
    if (!value || output.length >= MAX_GLYPHS) return;
    if (typeof value === "string" || typeof value === "number") {
      const text = String(value).trim();
      if (text) output.push({ coreId: coreName || "memory", slotId: output.length + 1, text: text.slice(0, 24) });
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (output.length < MAX_GLYPHS) collect(item, output, coreName || ("slot-" + (index + 1)));
      });
      return;
    }
    if (typeof value === "object") {
      const direct = value.glyph ?? value.text ?? value.note ?? value.value ?? value.content;
      if (direct != null && String(direct).trim()) {
        output.push({
          coreId: coreName || value.coreId || value.id || "memory",
          slotId: value.slotId || value.id || output.length + 1,
          text: String(direct).trim().slice(0, 24)
        });
        return;
      }
      const nested = value.cores || value.slots || value.items || value.notes || value;
      Object.keys(nested).forEach(key => {
        if (output.length < MAX_GLYPHS && !["createdAt", "updatedAt", "version", "deviceId"].includes(key)) {
          collect(nested[key], output, key);
        }
      });
    }
  }

  function getContents() {
    const output = [];
    MEMORY_KEYS.forEach(key => collect(readStored(key), output, key));
    try {
      const state = window.VivereFruit && window.VivereFruit.getState && window.VivereFruit.getState();
      if (state && state.slots) collect(state.slots, output, "slot");
    } catch (_) {}
    const unique = [];
    const seen = new Set();
    output.forEach(item => {
      const key = item.coreId + "|" + item.slotId + "|" + item.text;
      if (!seen.has(key) && unique.length < MAX_GLYPHS) {
        seen.add(key);
        unique.push(item);
      }
    });
    return unique.length ? unique : FALLBACK.map((text, i) => ({ coreId: "CHT", slotId: i + 1, text }));
  }

  function mmToPx(mm) { return mm * 96 / 25.4; }

  function ensureStyle() {
    if (document.getElementById("cht360-glyph-grid-style")) return;
    const style = document.createElement("style");
    style.id = "cht360-glyph-grid-style";
    style.textContent = `
      #cht360-glyph-grid-layer {
        position: absolute; inset: 0; z-index: 1; pointer-events: none;
        overflow: hidden; background: transparent; contain: layout paint;
      }
      .cht360-glyph-cell {
        position: absolute; width: ${mmToPx(GRID_MM)}px; height: ${mmToPx(GRID_MM)}px;
        display: grid; place-items: center; overflow: visible;
        color: rgba(244, 204, 125, .38);
        font: 500 clamp(8px, 1.8vw, 12px)/1 ui-monospace, monospace;
        text-shadow: 0 0 5px rgba(220, 169, 75, .25);
        transform-origin: center; animation: cht360-glyph-turn ${ROTATION_DURATION}s linear infinite;
        white-space: nowrap;
      }
      @keyframes cht360-glyph-turn { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
      @media (prefers-reduced-motion: reduce) { .cht360-glyph-cell { animation: none; } }
    `;
    document.head.appendChild(style);
  }

  let layer = null;
  let resizeFrame = 0;

  function buildGrid() {
    if (!layer || !layer.isConnected) return;
    const contents = getContents();
    const gap = mmToPx(GRID_MM);
    const width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const cols = Math.ceil(width / gap) + 2;
    const rows = Math.ceil(height / gap) + 2;
    const fragment = document.createDocumentFragment();
    let idx = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const item = contents[idx % contents.length];
        const el = document.createElement("span");
        el.className = "cht360-glyph-cell";
        el.textContent = item.text;
        el.title = String(item.coreId) + " · slot " + item.slotId;
        el.style.left = (c * gap - gap) + "px";
        el.style.top = (r * gap - gap) + "px";
        el.style.animationDelay = (-(idx % 17) * (ROTATION_DURATION / 17)) + "s";
        fragment.appendChild(el);
        idx++;
      }
    }
    layer.replaceChildren(fragment);
  }

  function mount() {
    ensureStyle();
    const host = document.querySelector(".stage") || document.querySelector(".root") || document.body;
    if (!host) return;

    if (!layer) {
      layer = document.createElement("div");
      layer.id = "cht360-glyph-grid-layer";
      layer.setAttribute("aria-hidden", "true");
    }
    if (layer.parentElement !== host) host.prepend(layer);
    if (host !== document.body && getComputedStyle(host).position === "static") {
      host.style.position = "relative";
    }
    buildGrid();
  }

  function refresh() { mount(); }
  function rebuild() { mount(); }
  window.CHT360GlyphGrid = Object.freeze({ refresh, rebuild });

  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(buildGrid);
  }, { passive: true });

  window.addEventListener("storage", event => {
    if (!event.key || MEMORY_KEYS.includes(event.key)) refresh();
  });

  ["cht.memory.changed", "cht.slot.saved", "cht360:vivere"].forEach(name => {
    window.addEventListener(name, refresh);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})(window, document);
