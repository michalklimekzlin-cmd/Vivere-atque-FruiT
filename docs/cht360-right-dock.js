/* =========================================================
   CHT 360°‰ — RIGHT DOCK
   Oběh · Bráška · Revia
   ---------------------------------------------------------
   - 3 tlačítka nad sebou vpravo dole
   - zachovává původní vzhled
   - vylepšuje a stabilizuje funkčnost
   - nepřepisuje celý systém, jen most + pozice
   Verze: 1.0.0
   ========================================================= */

(() => {
  "use strict";

  if (window.__CHT360_RIGHT_DOCK__) return;
  window.__CHT360_RIGHT_DOCK__ = true;

  const STYLE_ID = "cht360-right-dock-style";

  /* -------------------------------------------------------
     1) CSS — pozice tří tlačítek vpravo dole
     ------------------------------------------------------- */
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const css = `
/* === CHT 360 Right Dock === */
#openLifePanel,
.openLifePanel,
#openBraskaPanel,
.openBraskaPanel,
#openReviaPanel,
.openReviaPanel {
  position: fixed !important;
  right: 10px !important;
  left: auto !important;
  z-index: 40 !important;
  margin: 0 !important;
}

/* Oběh (nejvýš) */
#openLifePanel,
.openLifePanel {
  bottom: calc(118px + env(safe-area-inset-bottom, 0px)) !important;
}

/* Bráška (uprostřed) */
#openBraskaPanel,
.openBraskaPanel {
  bottom: calc(64px + env(safe-area-inset-bottom, 0px)) !important;
}

/* Revia (nejníž) */
#openReviaPanel,
.openReviaPanel {
  bottom: calc(12px + env(safe-area-inset-bottom, 0px)) !important;
}

/* když je landscape a málo výšky */
@media (orientation: landscape) and (max-height: 430px) {
  #openLifePanel,
  .openLifePanel {
    bottom: calc(96px + env(safe-area-inset-bottom, 0px)) !important;
  }
  #openBraskaPanel,
  .openBraskaPanel {
    bottom: calc(52px + env(safe-area-inset-bottom, 0px)) !important;
  }
  #openReviaPanel,
  .openReviaPanel {
    bottom: calc(10px + env(safe-area-inset-bottom, 0px)) !important;
  }
}
`;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* -------------------------------------------------------
     2) Pomocné funkce
     ------------------------------------------------------- */
  const $ = (sel) => document.querySelector(sel);

  function ensureButton({ id, className, html, title }) {
    let btn = document.getElementById(id) || document.querySelector("." + className);
    if (btn) return btn;

    btn = document.createElement("button");
    btn.id = id;
    btn.className = className;
    btn.type = "button";
    btn.title = title || "";
    btn.innerHTML = html;
    document.body.appendChild(btn);
    return btn;
  }

  function openPanel(el) {
    if (!el) return;
    el.classList.add("open", "is-open");
    el.setAttribute("aria-hidden", "false");
    el.style.display = el.style.display === "none" ? "" : el.style.display;
  }

  function closePanel(el) {
    if (!el) return;
    el.classList.remove("open", "is-open");
    el.setAttribute("aria-hidden", "true");
  }

  function togglePanel(el) {
    if (!el) return;
    const isOpen = el.classList.contains("open") || el.classList.contains("is-open") || el.getAttribute("aria-hidden") === "false";
    if (isOpen) closePanel(el);
    else openPanel(el);
  }

  /* -------------------------------------------------------
     3) Najít / vytvořit tři tlačítka
     ------------------------------------------------------- */
  function setupButtons() {
    // Oběh (Chybožrout) — už existuje
    const btnOběh = ensureButton({
      id: "openLifePanel",
      className: "openLifePanel",
      title: "Oběh · Chybožrout",
      html: `[◉_◉]<span>Oběh</span>`
    });

    // Bráška — pokud neexistuje, vytvoříme kompatibilní tlačítko
    const btnBraska = ensureButton({
      id: "openBraskaPanel",
      className: "openBraskaPanel",
      title: "Bráška",
      html: `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#ffe2ad;margin-right:6px;box-shadow:0 0 10px rgba(255,226,173,.8)"></span>Bráška`
    });

    // Revia — už existuje
    const btnRevia = ensureButton({
      id: "openReviaPanel",
      className: "openReviaPanel",
      title: "Revia",
      html: `<span class="reviaOrb" aria-hidden="true">R</span><span>Revia</span>`
    });

    // Základní vzhled Brášky, ať sedí k ostatním
    if (btnBraska && !btnBraska.dataset.styled) {
      Object.assign(btnBraska.style, {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        minWidth: "74px",
        minHeight: "48px",
        padding: "7px 11px",
        border: "1px solid rgba(255,220,160,.4)",
        borderRadius: "18px",
        background: "rgba(5,5,8,.94)",
        color: "#ffe2ad",
        boxShadow: "0 12px 32px rgba(0,0,0,.58)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        fontSize: "12px",
        fontWeight: "800",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent"
      });
      btnBraska.dataset.styled = "1";
    }

    return { btnOběh, btnBraska, btnRevia };
  }

  /* -------------------------------------------------------
     4) Vylepšené napojení funkcí
     ------------------------------------------------------- */
  function wireFunctions({ btnOběh, btnBraska, btnRevia }) {
    // --- Oběh / Chybožrout ---
    const repairPanel = $("#repairPanel");
    const lifePanel = $(".lifePanel");

    btnOběh.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Preferuj repairPanel (Chybožrout), jinak lifePanel
      if (repairPanel) {
        togglePanel(repairPanel);
        // zavři ostatní, ať se nepřekrývají
        if (lifePanel) closePanel(lifePanel);
        const revia = $("#reviaPanel");
        if (revia) closePanel(revia);
        return;
      }

      if (lifePanel) {
        togglePanel(lifePanel);
        return;
      }

      // Fallback — vyvolej existující event, pokud něco poslouchá
      window.dispatchEvent(new CustomEvent("cht360:open-oběh"));
    });

    // --- Revia ---
    const reviaPanel = $("#reviaPanel");

    btnRevia.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (reviaPanel) {
        togglePanel(reviaPanel);
        if (repairPanel) closePanel(repairPanel);
        if (lifePanel) closePanel(lifePanel);
        return;
      }

      // Kompatibilita se starším kódem
      window.dispatchEvent(new CustomEvent("cht360:open-revia"));
      if (typeof window.openRevia === "function") {
        try { window.openRevia(); } catch (_) {}
      }
    });

    // Zavírací tlačítka, pokud existují
    const closeRevia = $("#closeReviaPanel");
    if (closeRevia) {
      closeRevia.addEventListener("click", () => closePanel(reviaPanel));
    }
    const closeRepair = $("#closeRepairPanel");
    if (closeRepair) {
      closeRepair.addEventListener("click", () => closePanel(repairPanel));
    }

    // --- Bráška ---
    btnBraska.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      // 1) Pokud existuje VivereFruit / Braska360 respond
      if (window.VivereFruit && typeof window.VivereFruit.respond === "function") {
        // otevři / zaměř chat, pokud je panel
        const braskaPanel = $("#braskaPanel") || $(".braska-panel") || $("#vivere-friend-root");
        if (braskaPanel) {
          togglePanel(braskaPanel);
        }

        // jemný signál do systému
        window.dispatchEvent(new CustomEvent("cht360:braska-activate", {
          detail: { source: "right-dock" }
        }));

        // volitelně krátká odpověď do konzole / statusu
        try {
          window.VivereFruit.respond("Jsem tady.");
        } catch (_) {}
        return;
      }

      // 2) Klasická Braska360
      if (window.Braska360 && typeof window.Braska360.respond === "function") {
        window.dispatchEvent(new CustomEvent("cht360:braska-activate"));
        try { window.Braska360.respond("Jsem tady."); } catch (_) {}
        return;
      }

      // 3) Fallback
      window.dispatchEvent(new CustomEvent("cht360:open-braska"));
    });
  }

  /* -------------------------------------------------------
     5) Start
     ------------------------------------------------------- */
  function start() {
    injectStyles();
    const buttons = setupButtons();
    wireFunctions(buttons);
    console.log("🌱 CHT 360 Right Dock ready — Oběh · Bráška · Revia");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  // pro jistotu ještě po načtení všech skriptů
  window.addEventListener("load", () => {
    injectStyles();
    setupButtons();
  });
})();