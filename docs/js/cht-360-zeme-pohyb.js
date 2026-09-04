(() => {
  "use strict";

  const STYLE_ID = "cht360-zeme-pohyb-style";
  const ROOT_SELECTOR = ".cht360-zeme";
  const HOST_SELECTOR = "[data-cht360-zeme]";
  const DRAG_DISTANCE = 8;
  const EDGE_GAP = 38;

  function pridejStyl() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      ${HOST_SELECTOR}.cht360-zeme--pohyblivy {
        margin: 0 !important;
        will-change: left, top;
      }

      ${ROOT_SELECTOR}.cht360-zeme--pohybliva {
        cursor: grab;
        touch-action: none;
      }

      ${ROOT_SELECTOR}.cht360-zeme--pohybliva.is-presouvana {
        cursor: grabbing;
      }

      ${ROOT_SELECTOR}.cht360-zeme--pohybliva.is-presouvana .cht360-zeme__glyphy,
      ${ROOT_SELECTOR}.cht360-zeme--pohybliva.is-presouvana .cht360-zeme__glyph,
      ${ROOT_SELECTOR}.cht360-zeme--pohybliva.is-presouvana .cht360-zeme__puls {
        animation-play-state: paused;
      }
    `;

    document.head.appendChild(style);
  }

  function omez(hodnota, minimum, maximum) {
    return Math.min(Math.max(hodnota, minimum), maximum);
  }

  function hranice(stage, root) {
    const stageRect = stage.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const pulSirka = Math.min(stageRect.width / 2, rootRect.width / 2 + EDGE_GAP);
    const pulVyska = Math.min(stageRect.height / 2, rootRect.height / 2 + EDGE_GAP);

    return {
      stageRect,
      minimumX: Math.min(pulSirka, stageRect.width / 2),
      maximumX: Math.max(stageRect.width - pulSirka, stageRect.width / 2),
      minimumY: Math.min(pulVyska, stageRect.height / 2),
      maximumY: Math.max(stageRect.height - pulVyska, stageRect.height / 2)
    };
  }

  function nastavStred(host, x, y) {
    host.style.left = `${Math.round(x)}px`;
    host.style.top = `${Math.round(y)}px`;
    host.style.transform = "translate(-50%, -50%)";
  }

  function pripravHost(host, stage, root) {
    const stageRect = stage.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const stredX = rootRect.left + rootRect.width / 2 - stageRect.left;
    const stredY = rootRect.top + rootRect.height / 2 - stageRect.top;

    host.classList.add("cht360-zeme--pohyblivy");
    host.style.position = "absolute";
    nastavStred(host, stredX, stredY);
  }

  function pripoj(root) {
    if (!(root instanceof Element) || root.dataset.cht360Pohyb === "ano") return;

    const host = root.closest(HOST_SELECTOR);
    const stage = host?.closest(".stage");
    if (!host || !stage) return;

    root.dataset.cht360Pohyb = "ano";
    root.classList.add("cht360-zeme--pohybliva");
    pripravHost(host, stage, root);

    let tah = null;
    let blokujKliknuti = false;

    root.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary || event.button !== 0) return;

      const stageRect = stage.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();

      tah = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        centerX: rootRect.left + rootRect.width / 2 - stageRect.left,
        centerY: rootRect.top + rootRect.height / 2 - stageRect.top,
        presun: false
      };

      try {
        root.setPointerCapture(event.pointerId);
      } catch (_) {
        // Přetažení funguje i v prohlížeči, který nepodporuje zachycení ukazatele.
      }
    });

    root.addEventListener("pointermove", (event) => {
      if (!tah || event.pointerId !== tah.pointerId) return;

      const rozdilX = event.clientX - tah.startX;
      const rozdilY = event.clientY - tah.startY;

      if (!tah.presun && Math.hypot(rozdilX, rozdilY) < DRAG_DISTANCE) return;

      tah.presun = true;
      root.classList.add("is-presouvana");

      const limity = hranice(stage, root);
      const x = omez(tah.centerX + rozdilX, limity.minimumX, limity.maximumX);
      const y = omez(tah.centerY + rozdilY, limity.minimumY, limity.maximumY);

      nastavStred(host, x, y);
      event.preventDefault();
    }, { passive: false });

    function ukonciTah(event) {
      if (!tah || event.pointerId !== tah.pointerId) return;

      blokujKliknuti = tah.presun;
      root.classList.remove("is-presouvana");

      try {
        root.releasePointerCapture(event.pointerId);
      } catch (_) {
        // Ukazatel už mohl být uvolněný prohlížečem.
      }

      tah = null;

      window.setTimeout(() => {
        blokujKliknuti = false;
      }, 0);
    }

    root.addEventListener("pointerup", ukonciTah);
    root.addEventListener("pointercancel", ukonciTah);

    root.addEventListener("click", (event) => {
      if (!blokujKliknuti) return;

      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);

    window.addEventListener("resize", () => {
      const limity = hranice(stage, root);
      const rootRect = root.getBoundingClientRect();
      const x = rootRect.left + rootRect.width / 2 - limity.stageRect.left;
      const y = rootRect.top + rootRect.height / 2 - limity.stageRect.top;

      nastavStred(
        host,
        omez(x, limity.minimumX, limity.maximumX),
        omez(y, limity.minimumY, limity.maximumY)
      );
    });
  }

  function pripojVse() {
    pridejStyl();
    document.querySelectorAll(ROOT_SELECTOR).forEach(pripoj);
  }

  window.CHT360ZemePohyb = Object.freeze({ pripojVse });
  window.addEventListener("cht360:zeme-pripojena", pripojVse);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", pripojVse, { once: true });
  } else {
    pripojVse();
  }
})();
