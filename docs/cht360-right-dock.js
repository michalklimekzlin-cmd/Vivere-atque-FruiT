/* =========================================================
   CHT 360°‰ — RIGHT DOCK (oprava)
   Oběh · Bráška · Revia
   ---------------------------------------------------------
   - jen 3 tlačítka vpravo dole
   - nepřepisuje původní funkce
   - neskryvá tlačítka po kliknutí
   - odstraňuje duplicity
   Verze: 1.1.0
   ========================================================= */

(() => {
  "use strict";

  if (window.__CHT360_RIGHT_DOCK_V11__) return;
  window.__CHT360_RIGHT_DOCK_V11__ = true;

  const STYLE_ID = "cht360-right-dock-style-v11";

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const css = `
/* CHT 360 Right Dock v1.1 */
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
.openLifePanel {
  bottom: calc(120px + env(safe-area-inset-bottom, 0px)) !important;
}

/* Bráška — uprostřed */
#openBraskaPanel,
.openBraskaPanel,
button[aria-label*="Bráška"],
button[aria-label*="Braska"] {
  bottom: calc(66px + env(safe-area-inset-bottom, 0px)) !important;
}

/* Revia — nejníž */
#openReviaPanel,
.openReviaPanel {
  bottom: calc(12px + env(safe-area-inset-bottom, 0px)) !important;
}

/* Skrýt jasné duplicity, které vznikly dřív */
body > button.openBraskaPanel:nth-of-type(n+2),
body > #openBraskaPanel:nth-of-type(n+2) {
  display: none !important;
}
`;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function hideDuplicates() {
    // Nech jen jedno tlačítko Bráška vpravo
    const braskaCandidates = Array.from(document.querySelectorAll(
      '#openBraskaPanel, .openBraskaPanel, button[aria-label*="Bráška"], button[aria-label*="Braska"]'
    )).filter(el => {
      const r = el.getBoundingClientRect();
      return r.right > window.innerWidth * 0.6; // jen pravá strana
    });

    braskaCandidates.forEach((el, i) => {
      if (i > 0) {
        el.style.display = "none";
        el.setAttribute("data-dock-hidden", "1");
      }
    });
  }

  function ensureVisible(selList) {
    for (const sel of selList) {
      const el = document.querySelector(sel);
      if (el) {
        el.style.display = "";
        el.style.opacity = "1";
        el.style.visibility = "visible";
        el.style.pointerEvents = "auto";
        el.removeAttribute("aria-hidden");
        return el;
      }
    }
    return null;
  }

  function start() {
    injectStyles();

    // Jen zajisti, že existující tlačítka jsou vidět — nevytvářej nová
    ensureVisible(["#openLifePanel", ".openLifePanel"]);
    ensureVisible(["#openReviaPanel", ".openReviaPanel"]);
    ensureVisible([
      "#openBraskaPanel",
      ".openBraskaPanel",
      'button[aria-label*="Bráška"]',
      'button[aria-label*="Braska"]'
    ]);

    hideDuplicates();

    // Po krátké chvíli znovu (když se DOM ještě mění)
    setTimeout(() => {
      injectStyles();
      hideDuplicates();
    }, 600);

    setTimeout(() => {
      injectStyles();
      hideDuplicates();
    }, 1800);

    console.log("🌱 CHT 360 Right Dock v1.1 — 3 tlačítka, bez rozbití funkcí");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  window.addEventListener("load", start);
})();