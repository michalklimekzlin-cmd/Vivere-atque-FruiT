/**
 * CHT 360°‰ — Holá stěna Glyphů
 *
 * Dvě verze: sypaná (~112) a lehká mřížka.
 * Pomalé otáčení proti směru hodin.
 * Ukládá do localStorage: cht360_glyph_stena_v1
 *
 * Použití:
 *   <link rel="stylesheet" href="css/cht360-glyph-stena.css">
 *   <script src="js/cht360-glyph-stena.js"></script>
 *   a v HTML:
 *   <div id="cht360-stena-wall"></div>
 *   (volitelně toolbar + hint)
 */
(function (window, document) {
  "use strict";

  const STORAGE_KEY = "cht360_glyph_stena_v1";
  const TARGET_COUNT = 112;
  const FALLBACK = ["•ア", "7i_", "°&", "j’", "i’", "¿", ",!,", ",_.", "˚&", "'i'", "7¡"];

  const wall = document.getElementById("cht360-stena-wall");
  if (!wall) {
    console.warn("[cht360-stena] #cht360-stena-wall nenalezen");
    return;
  }

  const statusEl = document.getElementById("cht360-stena-status");
  const btnScatter = document.getElementById("btn-scatter");
  const btnGrid = document.getElementById("btn-grid");
  const btnClear = document.getElementById("btn-clear");

  let mode = "scatter";   // "scatter" | "grid"
  let slots = [];

  /* ---------- úložiště ---------- */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function save() {
    const payload = {
      mode,
      slots: slots.map((el) => ({
        id: el.dataset.id,
        text: (el.textContent || "").trim(),
        x: parseFloat(el.style.left) || 0,
        y: parseFloat(el.style.top) || 0
      }))
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    updateStatus();
  }

  /* ---------- generování pozic ---------- */
  function generateScatterPositions(count) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const margin = 28;
    const minDist = 38;
    const positions = [];
    let attempts = 0;

    while (positions.length < count && attempts < count * 40) {
      attempts++;
      const x = margin + Math.random() * (w - margin * 2);
      const y = margin + 50 + Math.random() * (h - margin * 2 - 50);

      let ok = true;
      for (const p of positions) {
        const dx = p.x - x;
        const dy = p.y - y;
        if (dx * dx + dy * dy < minDist * minDist) {
          ok = false;
          break;
        }
      }
      if (ok) positions.push({ x, y });
    }
    while (positions.length < count) {
      positions.push({
        x: margin + Math.random() * (w - margin * 2),
        y: margin + 50 + Math.random() * (h - margin * 2 - 50)
      });
    }
    return positions;
  }

  function generateGridPositions(count) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cols = Math.ceil(Math.sqrt(count * (w / h)));
    const rows = Math.ceil(count / cols);
    const gapX = (w - 40) / (cols + 1);
    const gapY = (h - 80) / (rows + 1);
    const positions = [];

    let idx = 0;
    for (let r = 0; r < rows && idx < count; r++) {
      for (let c = 0; c < cols && idx < count; c++) {
        const jitterX = (Math.random() - 0.5) * gapX * 0.24;
        const jitterY = (Math.random() - 0.5) * gapY * 0.24;
        positions.push({
          x: 20 + gapX * (c + 1) + jitterX,
          y: 56 + gapY * (r + 1) + jitterY
        });
        idx++;
      }
    }
    return positions;
  }

  /* ---------- stavba stěny ---------- */
  function build(forceNewPositions) {
    wall.innerHTML = "";
    slots = [];

    const saved = load();
    const useSaved = saved && saved.slots && saved.slots.length && !forceNewPositions;

    let positions;
    if (mode === "scatter") {
      positions = useSaved && saved.mode === "scatter"
        ? saved.slots.map((s) => ({ x: s.x, y: s.y }))
        : generateScatterPositions(TARGET_COUNT);
    } else {
      positions = generateGridPositions(TARGET_COUNT);
    }

    const texts = useSaved
      ? saved.slots.map((s) => s.text || "")
      : Array(TARGET_COUNT).fill("");

    const allEmpty = texts.every((t) => !t);
    if (allEmpty) {
      for (let i = 0; i < Math.min(18, TARGET_COUNT); i++) {
        texts[i] = FALLBACK[i % FALLBACK.length];
      }
    }

    for (let i = 0; i < TARGET_COUNT; i++) {
      const el = document.createElement("span");
      el.className = "cht360-glyph-slot";
      el.contentEditable = "true";
      el.spellcheck = false;
      el.dataset.id = String(i);
      el.textContent = texts[i] || "";
      el.style.left = positions[i].x + "px";
      el.style.top = positions[i].y + "px";
      el.style.animationDelay = `${-(i % 23) * (52 / 23)}s`;

      el.addEventListener("blur", () => save());
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          el.blur();
        }
      });

      wall.appendChild(el);
      slots.push(el);
    }

    wall.classList.toggle("mode-scatter", mode === "scatter");
    wall.classList.toggle("mode-grid", mode === "grid");
    updateStatus();
    if (!useSaved || forceNewPositions) save();
  }

  function updateStatus() {
    if (!statusEl) return;
    const filled = slots.filter((el) => (el.textContent || "").trim()).length;
    statusEl.textContent = `${filled} / ${TARGET_COUNT}`;
  }

  /* ---------- ovládání (pokud existují tlačítka) ---------- */
  if (btnScatter) {
    btnScatter.addEventListener("click", () => {
      if (mode === "scatter") return;
      mode = "scatter";
      btnScatter.classList.add("active");
      if (btnGrid) btnGrid.classList.remove("active");
      build(true);
    });
  }

  if (btnGrid) {
    btnGrid.addEventListener("click", () => {
      if (mode === "grid") return;
      mode = "grid";
      btnGrid.classList.add("active");
      if (btnScatter) btnScatter.classList.remove("active");
      build(true);
    });
  }

  if (btnClear) {
    btnClear.addEventListener("click", () => {
      if (!confirm("Opravdu vymazat všechny glyphy na stěně?")) return;
      slots.forEach((el) => { el.textContent = ""; });
      save();
    });
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (mode === "grid") build(true);
    }, 180);
  });

  /* ---------- start ---------- */
  const saved = load();
  if (saved && saved.mode) {
    mode = saved.mode;
    if (mode === "grid") {
      if (btnGrid) btnGrid.classList.add("active");
      if (btnScatter) btnScatter.classList.remove("active");
    }
  }
  build(false);

  // veřejné API (pro pozdější napojení na Paměť / relay)
  window.CHT360Stena = {
    rebuild: build,
    save,
    getSlots: () => slots.map((el) => ({
      id: el.dataset.id,
      text: (el.textContent || "").trim()
    })),
    setMode: (m) => {
      if (m !== "scatter" && m !== "grid") return;
      mode = m;
      build(true);
    }
  };
})(window, document);
