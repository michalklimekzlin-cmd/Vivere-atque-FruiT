/* =========================================================
   CHT 360°‰ — RIGHT DOCK (oprava)
   Oběh · Bráška · Revia
   ---------------------------------------------------------
   - jen 3 tlačítka vpravo dole
   - nepřepisuje původní funkce
   - neskryvá tlačítka po kliknutí
   - odstraňuje duplicity
   Verze: 1.2.0
   ========================================================= */

(() => {
  "use strict";

  const FLAG = "__CHT360_RIGHT_DOCK_V12__";
  const STYLE_ID = "cht360-right-dock-style-v12";

  if (window[FLAG]) return;
  window[FLAG] = true;

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const css = `
/* CHT 360 Right Dock v1.2 */
#openLifePanel,
.openLifePanel,
#openReviaPanel,
.openReviaPanel,
#openBraskaPanel,
.openBraskaPanel,
button[aria-label*="Bráška"],
button[aria-label*="Braska"] {
  position: fixed !important;
  right: 12px !important;
  left: auto !important;
  z-index: 42 !important;
  margin: 0 !important;
  transform: none !important;
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;
  display: inline-flex !important;
}

/* Oběh — nejvýš */
#openLifePanel,
.openLifePanel { bottom: calc(120px + env(safe-area-inset-bottom, 0px)) !important; }

/* Bráška — uprostřed */
#openBraskaPanel,
.openBraskaPanel,
button[aria-label*="Bráška"],
button[aria-label*="Braska"] { bottom: calc(66px + env(safe-area-inset-bottom, 0px)) !important; }

/* Revia — nejníž */
#openReviaPanel,
.openReviaPanel { bottom: calc(12px + env(safe-area-inset-bottom, 0px)) !important; }

/* Skrytí pouze označených duplicit */
[data-dock-hidden="1"] { display: none !important; }
`;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function getCandidates() {
    return Array.from(document.querySelectorAll(
      '#openLifePanel, .openLifePanel, #openReviaPanel, .openReviaPanel, #openBraskaPanel, .openBraskaPanel, button[aria-label*="Bráška"], button[aria-label*="Braska"]'
    ));
  }

  function restoreVisible(el) {
    if (!el) return;
    el.style.display = "";
    el.style.opacity = "1";
    el.style.visibility = "visible";
    el.style.pointerEvents = "auto";
    el.removeAttribute("aria-hidden");
    el.removeAttribute("data-dock-hidden");
  }

  function ensureButtons() {
    const life = document.querySelector("#openLifePanel, .openLifePanel");
    const revia = document.querySelector("#openReviaPanel, .openReviaPanel");
    const braska = document.querySelector(
      '#openBraskaPanel, .openBraskaPanel, button[aria-label*="Bráška"], button[aria-label*="Braska"]'
    );

    [life, revia, braska].forEach(restoreVisible);
  }

  function hideDuplicates() {
    try {
      const rightSide = [];
      getCandidates().forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.right > window.innerWidth * 0.6) rightSide.push(el);
      });

      rightSide.forEach((el, i) => {
        if (i > 0) {
          el.setAttribute("data-dock-hidden", "1");
          el.style.display = "none";
        } else {
          restoreVisible(el);
        }
      });
    } catch (err) {
      console.warn("CHT360 Right Dock: hideDuplicates selhal", err);
    }
  }

  function start() {
    injectStyles();
    ensureButtons();
    hideDuplicates();

    setTimeout(() => { injectStyles(); ensureButtons(); hideDuplicates(); }, 600);
    setTimeout(() => { injectStyles(); ensureButtons(); hideDuplicates(); }, 1800);

    const mo = new MutationObserver(() => { ensureButtons(); hideDuplicates(); });
    mo.observe(document.body || document.documentElement, { childList: true, subtree: true });

    console.log("🌱 CHT 360 Right Dock v1.2 — hotovo (3 tlačítka, bez rozbití funkcí)");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  window.addEventListener("load", start, { once: true });
})();
