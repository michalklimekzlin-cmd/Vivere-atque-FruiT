"use strict";

/* CHT 360°‰. — pohybový kolotoč osmi spodních bubínků. */
(() => {
  const ROOT_ID = "cht360-oblouk-osmi-zamku";
  const STORAGE_KEY = "cht360_bubinky_kolotoc_v1";
  const DRUM_COUNT = 8;

  let state = load();

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      const allowed = Array.from({ length: DRUM_COUNT }, (_, index) => index);

      const order = Array.isArray(saved?.order)
        ? saved.order.map(Number).filter(index => allowed.includes(index))
        : [];

      return {
        version: 1,
        order: [...new Set([...order, ...allowed])]
      };
    } catch (_) {
      return {
        version: 1,
        order: Array.from({ length: DRUM_COUNT }, (_, index) => index)
      };
    }
  }

  function save(reason) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...state,
        updatedAt: new Date().toISOString(),
        reason
      }));
    } catch (_) {}
  }

  function injectStyle() {
    if (document.getElementById("cht360-bubinky-kolotoc-style")) return;

    const style = document.createElement("style");
    style.id = "cht360-bubinky-kolotoc-style";
    style.textContent = `
      #${ROOT_ID} {
        transform: translateX(calc(-50% + var(--cht-carousel-x, 0px))) !important;
        transition: transform .22s cubic-bezier(.22,.8,.22,1), filter .18s ease;
        will-change: transform;
      }

      #${ROOT_ID}.is-cht-carousel-dragging {
        transition: none;
        filter: brightness(1.16);
      }
    `;

    document.head.append(style);
  }

  function mainDrums(root) {
    return Array.from(root.querySelectorAll("[data-lock-index]"))
      .filter(node => {
        const index = Number(node.dataset.lockIndex);
        return index >= 0 && index < DRUM_COUNT;
      });
  }

  function applyOrder(root) {
    const byIndex = new Map(
      mainDrums(root).map(node => [Number(node.dataset.lockIndex), node])
    );

    const firstExtra = root.querySelector(".cht360ExtraDrum");

    state.order.forEach(index => {
      const node = byIndex.get(index);

      if (node) {
        root.insertBefore(node, firstExtra || null);
      }
    });
  }

  function turn(root, direction, steps) {
    for (let index = 0; index < steps; index += 1) {
      if (direction < 0) {
        state.order.push(state.order.shift());
      } else {
        state.order.unshift(state.order.pop());
      }
    }

    save(direction < 0 ? "kolotoč doleva" : "kolotoč doprava");
    applyOrder(root);
  }

  function bind(root) {
    if (root.dataset.chtCarouselBound === "true") return;

    root.dataset.chtCarouselBound = "true";

    let drag = null;

    root.addEventListener("pointerdown", event => {
      const target = event.target.closest(".cht360OsmZamek");
      if (!target) return;

      drag = {
        id: event.pointerId,
        target,
        startX: event.clientX,
        startY: event.clientY,
        horizontal: false
      };
    }, true);

    root.addEventListener("pointermove", event => {
      if (!drag || drag.id !== event.pointerId) return;

      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;

      if (!drag.horizontal && Math.abs(dx) > Math.abs(dy) + 8) {
        drag.horizontal = true;
      }

      if (!drag.horizontal) return;

      root.style.setProperty(
        "--cht-carousel-x",
        Math.max(-110, Math.min(110, dx)) + "px"
      );

      root.classList.add("is-cht-carousel-dragging");

      event.preventDefault();
      event.stopPropagation();
    }, true);

    const finish = event => {
      if (!drag || drag.id !== event.pointerId) return;

      const current = drag;
      drag = null;

      if (!current.horizontal) return;

      const dx = event.clientX - current.startX;

      root.style.setProperty("--cht-carousel-x", "0px");
      root.classList.remove("is-cht-carousel-dragging");

      current.target.releasePointerCapture?.(event.pointerId);
      current.target.classList.remove("is-dragging");

      if (event.type !== "pointercancel" && Math.abs(dx) >= 34) {
        turn(
          root,
          dx > 0 ? 1 : -1,
          Math.max(1, Math.round(Math.abs(dx) / 70))
        );
      }

      event.preventDefault();
      event.stopPropagation();
    };

    root.addEventListener("pointerup", finish, true);
    root.addEventListener("pointercancel", finish, true);

    root.addEventListener("keydown", event => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (!event.target.closest(".cht360OsmZamek")) return;

      event.preventDefault();
      turn(root, event.key === "ArrowRight" ? 1 : -1, 1);
    }, true);
  }

  function boot() {
    injectStyle();

    [0, 120, 500].forEach(delay => {
      setTimeout(() => {
        const root = document.getElementById(ROOT_ID);
        if (!root) return;

        bind(root);
        applyOrder(root);
      }, delay);
    });

    window.addEventListener("cht.glyph.drums.changed", () => {
      setTimeout(() => {
        const root = document.getElementById(ROOT_ID);
        if (root) applyOrder(root);
      }, 0);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();