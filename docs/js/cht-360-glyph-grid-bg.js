/**
 * CHT 360°‰. — živé glyphové pozadí ze slotů Paměti
 *
 * Čte non-empty sloty z cht360_pamet_v1.
 * Na každém křížení mřížky (~3.5 mm) zobrazí obsah slotu (Glyph / text).
 * Všechny glyphy se pomalu otáčejí proti směru hodinových ručiček (1h → 8h).
 * Aktualizuje se při cht.memory.changed, cht.slot.saved a storage eventech.
 *
 * Použití:
 *   <script src="js/cht-360-glyph-grid-bg.js"></script>
 */
(function (window, document) {
  "use strict";

  const MEMORY_KEY = "cht360_pamet_v1";
  const GRID_MM = 3.5;                    // rozestup mřížky v mm
  const ROTATION_DURATION = 48;           // sekundy na jedno otočení
  const MAX_GLYPHS = 280;                 // max. počet viditelných (4×70)
  const FALLBACK_GLYPHS = [
    "˚&", "'i'", "7¡", "`९נֶ", "•ア", "7i_",
    "°&", "j’", "i’", "¿", ",!,", ",_."
  ];

  const CORES = ["earth", "language", "game", "control"];

  let layer = null;

  /* ---------- čtení Paměti ---------- */
  function readMemory() {
    try {
      const raw = localStorage.getItem(MEMORY_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data && typeof data === "object" ? data : null;
    } catch {
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
                  : Array.isArray(core) ? core : [];

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

  /* ---------- mřížka ---------- */
  function mmToPx(mm) {
    return mm * 3.779527559;
  }

  function buildGrid() {
    if (!layer) return;
    layer.innerHTML = "";

    const memory = readMemory();
    let contents = collectSlotContents(memory);

    // když je Paměť prázdná, použij fallback glyphy
    if (contents.length === 0) {
      contents = FALLBACK_GLYPHS.map((g, i) => ({
        coreId: CORES[i % 4],
        slotId: i + 1,
        text: g
      }));
    }

    const gap = mmToPx(GRID_MM);
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cols = Math.ceil(w / gap) + 2;
    const rows = Math.ceil(h / gap) + 2;

    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const item = contents[idx % contents.length];
        idx++;

        const el = document.createElement("span");
        el.className = "cht360-glyph-cell";
        el.textContent = item.text;
        el.title = `${item.coreId} · slot ${item.slotId}`;
        el.style.left = `${c * gap - gap}px`;
        el.style.top  = `${r * gap - gap}px`;
        // různé fáze, aby otáčení nevypadalo synchronně
        el.style.animationDelay = `${-(idx % 17) * (ROTATION_DURATION / 17)}s`;
        layer.appendChild(el);
      }
    }
  }

  /* ---------- styl + vrstva ---------- */
  function ensureStyle() {
    if (document.getElementById("cht360-glyph-grid-style")) return;

    const style = document.createElement("style");
    style.id = "cht360-glyph-grid-style";
    style.textContent = `
      #cht360-glyph-grid-layer {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        overflow: hidden;
        background: transparent;
      }
      .cht360-glyph-cell {
        position: absolute;
        width: ${mmToPx(GRID_MM)}px;
        height: ${mmToPx(GRID_MM)}px;
        display: grid;
        place-items: center;
        font-size: clamp(9px, 1.8vw, 13px);