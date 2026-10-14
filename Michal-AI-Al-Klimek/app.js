// MICHAL-AI-AL-KLIMEK / app.js
window.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "michal-ai-al-klimek-glyphs";

  const GOOD_GLYPH = "'Īง";
  const BAD_GLYPH = "(ؔ•۵•ؔ)ؤ";
  const DEFAULT_TEXT = {
    "left-1": GOOD_GLYPH,
    "left-2": "Vivere",
    "left-3": "FruiT",
    "left-4": "AI",
    "br-1": "I ❤️"
  };

  const backgroundEl = document.getElementById("glyphBackground");
  const transformBtn = document.getElementById("transformBtn");
  const slots = Array.from(document.querySelectorAll(".glyph-slot"));

  function normalizeValue(value, fallback = "") {
    const safe = String(value ?? "").replace(/\s+/g, " ").trim();
    return safe || fallback;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_TEXT };
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_TEXT, ...parsed };
    } catch (error) {
      console.warn("Nemůžu načíst uložené glyphy:", error);
      return { ...DEFAULT_TEXT };
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function renderBackground() {
    if (!backgroundEl) return;

    const state = loadState();
    const values = slots
      .map((slot) => {
        const slotId = slot.dataset.slot;
        const value = normalizeValue(
          slot.querySelector(".glyph-text")?.textContent,
          state[slotId] || DEFAULT_TEXT[slotId] || ""
        );
        return value;
      })
      .filter(Boolean);

    const glyphPool = values.length ? values : Object.values(DEFAULT_TEXT).filter(Boolean);
    const total = 24;
    backgroundEl.innerHTML = "";

    for (let i = 0; i < total; i += 1) {
      const glyph = document.createElement("span");
      const value = glyphPool[i % glyphPool.length];
      glyph.className = "glyph-bg-item";
      glyph.textContent = value;
      glyph.style.left = `${(i % 6) * 20 + ((i * 7) % 11)}%`;
      glyph.style.top = `${(Math.floor(i / 6) * 20 + ((i * 13) % 17))}%`;
      glyph.style.opacity = String(0.16 + ((i % 5) * 0.08));
      glyph.style.transform = `rotate(${(i % 8) * 18 - 45}deg) scale(${0.8 + (i % 3) * 0.25})`;
      backgroundEl.appendChild(glyph);
    }
  }

  function syncSlot(slot) {
    const slotId = slot.dataset.slot;
    const textEl = slot.querySelector(".glyph-text");
    if (!textEl) return;

    const state = loadState();
    const value = normalizeValue(state[slotId], DEFAULT_TEXT[slotId] || "");
    textEl.textContent = value;
    renderBackground();
  }

  slots.forEach((slot) => {
    const slotId = slot.dataset.slot;
    const textEl = slot.querySelector(".glyph-text");
    if (!slotId || !textEl) return;

    const state = loadState();
    const startValue = normalizeValue(state[slotId], DEFAULT_TEXT[slotId] || "");
    textEl.textContent = startValue;

    if (slotId === "left-1") {
      slot.addEventListener("click", () => {
        const next = textEl.textContent.trim() === GOOD_GLYPH ? BAD_GLYPH : GOOD_GLYPH;
        textEl.textContent = next;
        const updated = loadState();
        updated[slotId] = next;
        saveState(updated);
        renderBackground();
      });
      return;
    }

    textEl.addEventListener("input", () => {
      const nextValue = normalizeValue(textEl.textContent, DEFAULT_TEXT[slotId] || "");
      const updated = loadState();
      updated[slotId] = nextValue;
      saveState(updated);
      renderBackground();
    });

    textEl.addEventListener("blur", () => {
      const value = normalizeValue(textEl.textContent, DEFAULT_TEXT[slotId] || "");
      textEl.textContent = value;
      const updated = loadState();
      updated[slotId] = value;
      saveState(updated);
      renderBackground();
    });

    slot.addEventListener("click", () => {
      textEl.focus();
      const range = document.createRange();
      range.selectNodeContents(textEl);
      range.collapse(false);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    });
  });

  if (transformBtn) {
    transformBtn.addEventListener("click", () => {
      document.body.classList.toggle("alt-bg");
      transformBtn.style.transform = "scale(0.94)";
      setTimeout(() => (transformBtn.style.transform = "scale(1)"), 180);
    });
  }

  renderBackground();
});
