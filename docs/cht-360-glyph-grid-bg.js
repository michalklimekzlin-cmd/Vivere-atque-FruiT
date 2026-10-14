/**
 * CHT 360°‰. — živé glyphové pozadí ze slotů Paměti
 *
 * Čte obsah z localStorage klíče "cht360_pamet_v1".
 * Pokud je Paměť prázdná, zobrazí náhradní glyphy.
 * Vytváří jemnou, pomalu se otáčející mřížku přes celou obrazovku.
 *
 * Použití v docs/index.html:
 * <script src="./js/cht-360-glyph-grid-bg.js" defer></script>
 */
(function (window, document) {
  "use strict";

  const MEMORY_KEY = "cht360_pamet_v1";
  const GRID_MM = 3.5;
  const ROTATION_DURATION = 48;
  const MAX_GLYPHS = 280;

  const FALLBACK_GLYPHS = [
    "˚&", "'i'", "7¡", "`९נֶ", "•ア", "7i_",
    "°&", "j’", "i’", "¿", ",!,", ",_."
  ];

  const CORES = ["earth", "language", "game", "control"];
  const STYLE_ID = "cht360-glyph-grid-style";
  const LAYER_ID = "cht360-glyph-grid-layer";

  let layer = null;
  let resizeFrame = 0;
  let refreshFrame = 0;

  function mmToPx(mm) {
    return mm * 3.779527559;
  }

  /* ---------- čtení Paměti ---------- */
  function readMemory() {
    try {
      const raw = window.localStorage.getItem(MEMORY_KEY);
      if (!raw) return null;

      const data = JSON.parse(raw);
      return data && typeof data === "object" ? data : null;
    } catch (error) {
      console.warn("[CHT 360°‰.] Paměť se nepodařilo přečíst.", error);
      return null;
    }
  }

  function collectSlotContents(memory) {
    const items = [];
    if (!memory) return items;

    const cores = memory.cores || memory;

    CORES.forEach((coreId) => {
      const core = cores[coreId];
      if (!core) return;

      const slots = Array.isArray(core.slots) ? core.slots
        : Array.isArray(core.items) ? core.items
        : Array.isArray(core) ? core
        : [];

      slots.forEach((slot, index) => {
        if (slot == null || slot === "") return;

        let text = "";

        if (typeof slot === "string") {
          text = slot.trim();
        } else if (typeof slot === "object") {
          text = String(
            slot.glyph || slot.text || slot.note ||
            slot.value || slot.content || ""
          ).trim();
        }

        if (text) {
          items.push({
            coreId,
            slotId: index + 1,
            text: text.slice(0, 24)
          });
        }
      });
    });

    return items.slice(0, MAX_GLYPHS);
  }

  /* ---------- CSS pozadí ---------- */
  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${LAYER_ID} {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        overflow: hidden;
        background: transparent;
        contain: strict;
        user-select: none;
        -webkit-user-select: none;
      }

      #${LAYER_ID} .cht360-glyph-cell {
        position: absolute;
        width: ${mmToPx(GRID_MM)}px;
        height: ${mmToPx(GRID_MM)}px;
        display: grid;
        place-items: center;
        overflow: visible;
        color: rgba(196, 220, 177, 0.24);
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: clamp(9px, 1.8vw, 13px);
        line-height: 1;
        white-space: nowrap;
        text-shadow: 0 0 5px rgba(120, 180, 125, 0.10);
        transform-origin: center;
        animation: cht360GlyphDrift ${ROTATION_DURATION}s linear infinite;
        will-change: transform;
      }

      @keyframes cht360GlyphDrift {
        from { transform: rotate(0deg); }
        to   { transform: rotate(-360deg); }
      }

      @media (prefers-reduced-motion: reduce) {
        #${LAYER_ID} .cht360-glyph-cell {
          animation: none;
        }
      }
    `;

    (document.head || document.documentElement).appendChild(style);
  }

  function ensureLayer() {
    layer = document.getElementById(LAYER_ID);
    if (layer) return;

    layer = document.createElement("div");
    layer.id = LAYER_ID;
    layer.setAttribute("aria-hidden", "true");

    // Vložit na začátek body, aby se vrstva chovala jako pozadí.
    const parent = document.body || document.documentElement;
    parent.insertBefore(layer, parent.firstChild);
  }

  /* ---------- vykreslení mřížky ---------- */
  function buildGrid() {
    if (!layer) return;

    const memory = readMemory();
    let contents = collectSlotContents(memory);

    if (contents.length === 0) {
      contents = FALLBACK_GLYPHS.map((glyph, index) => ({
        coreId: CORES[index % CORES.length],
        slotId: index + 1,
        text: glyph
      }));
    }

    const gap = mmToPx(GRID_MM);
    const width = Math.max(window.innerWidth, 1);
    const height = Math.max(window.innerHeight, 1);
    const cols = Math.ceil(width / gap) + 2;
    const rows = Math.ceil(height / gap) + 2;

    // Omezíme počet prvků na mobilu, aby animace zbytečně nezatěžovala Safari.
    const total = Math.min(cols * rows, MAX_GLYPHS);
    const fragment = document.createDocumentFragment();

    for (let index = 0; index < total; index++) {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const item = contents[index % contents.length];

      const cell = document.createElement("span");
      cell.className = "cht360-glyph-cell";
      cell.textContent = item.text;
      cell.title = `${item.coreId} · slot ${item.slotId}`;
      cell.style.left = `${col * gap - gap}px`;
      cell.style.top = `${row * gap - gap}px`;
      cell.style.animationDelay =
        `${-(index % 17) * (ROTATION_DURATION / 17)}s`;

      fragment.appendChild(cell);
    }

    layer.replaceChildren(fragment);
  }

  function scheduleBuild() {
    if (refreshFrame) window.cancelAnimationFrame(refreshFrame);
    refreshFrame = window.requestAnimationFrame(() => {
      refreshFrame = 0;
      buildGrid();
    });
  }

  function scheduleResize() {
    if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = 0;
      scheduleBuild();
    });
  }

  function init() {
    ensureStyle();
    ensureLayer();
    buildGrid();

    window.addEventListener("resize", scheduleResize, { passive: true });
    window.addEventListener("orientationchange", scheduleResize, { passive: true });
    window.addEventListener("storage", (event) => {
      if (!event.key || event.key === MEMORY_KEY) scheduleBuild();
    });

    // Vlastní události používané částmi CHT/Paměti.
    [
      "cht.memory.changed",
      "cht.slot.saved",
      "cht360:memory-changed",
      "cht360:slot-saved"
    ].forEach((eventName) => {
      window.addEventListener(eventName, scheduleBuild);
      document.addEventListener(eventName, scheduleBuild);
    });

    // Veřejná funkce pro ruční obnovení po uložení slotu.
    window.CHT360GlyphGridBackground = Object.freeze({
      refresh: scheduleBuild,
      rebuild: buildGrid
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})(window, document);
