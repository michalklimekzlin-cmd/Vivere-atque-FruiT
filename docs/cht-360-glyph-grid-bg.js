/**
 * CHT 360°‰ — jemné glyphové pozadí Regálu
 * Přidává průhlednou mřížku a jemné glyphy. Neodstraňuje ani nemění existující UI.
 * Vložit jako docs/js/cht-360-glyph-grid-bg.js a načíst ze stránky index.html.
 */
(function (window, document) {
  "use strict";
  if (window.__CHT360_GLYPH_GRID_BG__) return;
  window.__CHT360_GLYPH_GRID_BG__ = true;

  const STYLE_ID = "cht360-glyph-grid-bg-style";
  const LAYER_ID = "cht360-glyph-grid-bg-layer";
  const STORAGE_KEYS = [
    "cht360_pamet_v1",
    "cht360_vivere_fruit_core_v1_slots",
    "vivere_ai_memory"
  ];
  const FALLBACK = ["˚", "•ア", "7i_", "i’", "°&", "९נֶ", "CHT", "‰", "∴", "⟡", "◌", "T"];
  const MAX_GLYPHS = 220;
  let layer;
  let rebuildFrame = 0;

  function safeRead(key) {
    try { return JSON.parse(window.localStorage.getItem(key) || "null"); }
    catch (_) { return null; }
  }

  function extract(value, out, slotName) {
    if (out.length >= MAX_GLYPHS || value == null) return;
    if (typeof value === "string" || typeof value === "number") {
      const text = String(value).trim();
      if (text) out.push({ text: text.slice(0, 18), slot: slotName || "Regál" });
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((v, i) => extract(v, out, slotName || ("Slot " + (i + 1))));
      return;
    }
    if (typeof value === "object") {
      const text = value.glyph ?? value.text ?? value.note ?? value.value ?? value.content ?? value.label;
      if (text != null && String(text).trim()) {
        out.push({ text: String(text).trim().slice(0, 18), slot: String(value.slot || value.slotId || value.coreId || slotName || "Regál") });
        return;
      }
      ["slots", "items", "notes", "cores", "memory", "data"].forEach(k => {
        if (value[k] != null && out.length < MAX_GLYPHS) extract(value[k], out, k);
      });
    }
  }

  function getGlyphs() {
    const found = [];
    STORAGE_KEYS.forEach(key => extract(safeRead(key), found, key));
    try {
      const state = window.VivereFruit && typeof window.VivereFruit.getState === "function" && window.VivereFruit.getState();
      if (state && state.slots) extract(state.slots, found, "Slot");
    } catch (_) {}
    const unique = [];
    const seen = new Set();
    found.forEach(item => {
      const key = item.slot + "|" + item.text;
      if (!seen.has(key) && unique.length < MAX_GLYPHS) { seen.add(key); unique.push(item); }
    });
    return unique.length ? unique : FALLBACK.map((text, i) => ({ text, slot: "CHT " + (i + 1) }));
  }

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${LAYER_ID} {
        position: absolute; inset: 0; z-index: 0; pointer-events: none;
        overflow: hidden; opacity: .88; contain: layout paint;
        background-image:
          linear-gradient(to right, rgba(229,190,112,.12) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(229,190,112,.12) 1px, transparent 1px),
          radial-gradient(ellipse at center, rgba(99,66,22,.12), transparent 72%);
        background-size: 3.5mm 3.5mm, 3.5mm 3.5mm, 100% 100%;
        background-position: 0 0, 0 0, center;
      }
      #${LAYER_ID} .cht360-glyph {
        position: absolute; display: block; white-space: nowrap;
        color: rgba(246,211,146,.37); font: 500 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
        text-shadow: 0 0 5px rgba(220,168,78,.23);
        transform-origin: center; animation: cht360GlyphDrift 46s linear infinite;
      }
      @keyframes cht360GlyphDrift {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @media (prefers-reduced-motion: reduce) { #${LAYER_ID} .cht360-glyph { animation: none; } }
    `;
    document.head.appendChild(style);
  }

  function build() {
    if (!layer || !layer.isConnected) return;
    const glyphs = getGlyphs();
    const w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    // Glyphy rozmístíme řidčeji než samotnou mřížku, aby stránka zůstala plynulá na iPhonu.
    const stepX = 42;
    const stepY = 34;
    const cols = Math.ceil(w / stepX) + 1;
    const rows = Math.ceil(h / stepY) + 1;
    const fragment = document.createDocumentFragment();
    let index = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Vzdušnější rozložení: každý druhý průsečík zůstane jen součástí mřížky.
        if ((r + c) % 2 !== 0) continue;
        const item = glyphs[index % glyphs.length];
        const node = document.createElement("span");
        node.className = "cht360-glyph";
        node.textContent = item.text;
        node.title = item.slot;
        node.style.left = (c * stepX + ((r % 3) * 7)) + "px";
        node.style.top = (r * stepY) + "px";
        node.style.animationDelay = (-((index % 23) * 2)) + "s";
        fragment.appendChild(node);
        index++;
      }
    }
    layer.replaceChildren(fragment);
  }

  function mount() {
    installStyle();
    const host = document.querySelector(".stage") || document.querySelector(".root") || document.body;
    if (!host) return;
    if (!layer) {
      layer = document.createElement("div");
      layer.id = LAYER_ID;
      layer.setAttribute("aria-hidden", "true");
    }
    if (layer.parentElement !== host) host.prepend(layer);
    const position = window.getComputedStyle(host).position;
    if (position === "static") host.style.position = "relative";
    // Zajisti, že obsah scény zůstane nad dekorativním pozadím.
    Array.from(host.children).forEach(child => {
      if (child !== layer && window.getComputedStyle(child).position === "static") {
        child.style.position = "relative";
      }
    });
    build();
  }

  function refresh() { mount(); }
  function scheduleBuild() {
    window.cancelAnimationFrame(rebuildFrame);
    rebuildFrame = window.requestAnimationFrame(build);
  }
  window.CHT360GlyphGrid = Object.freeze({ refresh, rebuild: refresh });
  window.addEventListener("resize", scheduleBuild, { passive: true });
  window.addEventListener("storage", event => { if (!event.key || STORAGE_KEYS.includes(event.key)) refresh(); });
  ["cht.memory.changed", "cht.slot.saved", "cht360:vivere"].forEach(name => window.addEventListener(name, refresh));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})(window, document);
