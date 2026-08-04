"use strict";

/* CHT 360°‰. — osm bubínků se v úsměvu postupně zasouvá do stran CHT. */
(() => {
  const ROOT_ID = "cht360-oblouk-osmi-zamku";
  const STORAGE_KEY = "cht360_bubinky_kolotoc_v1";
  const SNAPSHOT_KEY = "cht360_bubinky_kolotoc_snapshots_v1";
  const DRUM_COUNT = 8;
  const SMILE = [0, 15, 29, 38, 38, 29, 15, 0];
  const RAIL_LIFT = -8;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const previous = read(STORAGE_KEY);
  const hadSide = [-1, 0, 1].includes(Number(previous?.side));
  const state = {
    ...(previous && typeof previous === "object" ? previous : {}),
    version: 2,
    side: hadSide ? Number(previous.side) : 0
  };

  if (previous && !hadSide) {
    snapshot(previous);
    save("přechod z kolotoče na zasouvání bubínků");
  }

  function read(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch (_) {
      return null;
    }
  }

  function snapshot(value) {
    try {
      const current = read(SNAPSHOT_KEY);
      const items = Array.isArray(current?.items) ? current.items : [];

      items.push({
        id: `bubinky-${Date.now()}`,
        at: new Date().toISOString(),
        sourceKey: STORAGE_KEY,
        reason: "před zasouváním bubínků do levé a pravé strany",
        value
      });

      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({
        version: 1,
        items: items.slice(-3)
      }));
    } catch (_) {}
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

  function drums(root) {
    return Array.from(root.querySelectorAll("[data-lock-index]"))
      .filter(node => {
        const index = Number(node.dataset.lockIndex);
        return index >= 0 && index < DRUM_COUNT;
      })
      .sort((a, b) => Number(a.dataset.lockIndex) - Number(b.dataset.lockIndex));
  }

  function sequenceProgress(progress, index, direction) {
    const rank = direction < 0 ? index : DRUM_COUNT - 1 - index;
    return clamp((progress - rank * 0.105) / 0.265, 0, 1);
  }

  function paint(root, side = state.side, amount = Math.abs(side)) {
    const direction = side < 0 ? -1 : side > 0 ? 1 : 0;
    const progress = clamp(amount, 0, 1);

    drums(root).forEach((node, index) => {
      const localProgress = direction === 0
        ? 0
        : sequenceProgress(progress, index, direction);

      node.style.setProperty("--smile-y", `${SMILE[index]}px`);
      node.style.setProperty("--cht-rail-lift", `${RAIL_LIFT}px`);
      node.style.setProperty("--cht-inset-x", `${direction * localProgress * 74}px`);
      node.style.setProperty("--cht-inset-y", "0px");
      node.style.setProperty("--cht-inset-scale", "1");
      node.style.setProperty("--cht-inset-opacity", "1");

      const isLeftPocket = direction < 0 && index < 2;
      const isRightPocket = direction > 0 && index > DRUM_COUNT - 3;

      node.dataset.chtPocket = isLeftPocket ? "left" : isRightPocket ? "right" : "open";
      node.style.setProperty("--cht-pocket-left", isLeftPocket ? `${localProgress * 48}%` : "0%");
      node.style.setProperty("--cht-pocket-right", isRightPocket ? `${localProgress * 48}%` : "0%");
    });

    root.dataset.chtInsetSide =
      direction === -1 ? "left" :
      direction === 1 ? "right" :
      "open";
  }

  function injectStyle() {
    if (document.getElementById("cht360-bubinky-vsouvani-style")) return;

    const style = document.createElement("style");
    style.id = "cht360-bubinky-vsouvani-style";
    style.textContent = `
      #${ROOT_ID}::before { height: 96px !important; }

      #${ROOT_ID},
      #${ROOT_ID} .cht360OsmZamek {
        touch-action: pan-y;
      }

      #${ROOT_ID} .cht360OsmZamek {
        transform: translate3d(
          var(--cht-inset-x, 0px),
          calc(var(--smile-y, 0px) + var(--cht-rail-lift, -8px) + var(--cht-inset-y, 0px)),
          0
        ) scale(var(--cht-inset-scale, 1)) !important;

        opacity: var(--cht-inset-opacity, 1);
        clip-path: inset(
          0
          var(--cht-pocket-right, 0%)
          0
          var(--cht-pocket-left, 0%)
        );

        transition:
          transform .68s cubic-bezier(.18,.82,.2,1),
          clip-path .68s cubic-bezier(.18,.82,.2,1),
          opacity .48s ease,
          filter .24s ease;

        will-change: transform, opacity;
      }

      #${ROOT_ID}.is-cht-system-dragging .cht360OsmZamek {
        transition: none;
        filter: brightness(1.16);
      }
    `;

    document.head.append(style);
  }

  function dragVisual(drag, dx) {
    const moved = clamp(Math.abs(dx) / 124, 0, 1);

    if (drag.startSide === 0) {
      return {
        side: dx < 0 ? -1 : 1,
        amount: moved,
        pullsOut: false
      };
    }

    if (Math.sign(dx) === -drag.startSide) {
      return {
        side: drag.startSide,
        amount: 1 - moved,
        pullsOut: true
      };
    }

    return {
      side: drag.startSide,
      amount: 1,
      pullsOut: false
    };
  }

  function bind(root) {
    if (root.dataset.chtInsetBound === "true") return;
    root.dataset.chtInsetBound = "true";

    let drag = null;

    root.addEventListener("pointerdown", event => {
      const element = event.target instanceof Element
        ? event.target.closest(".cht360OsmZamek")
        : null;

      if (element && !root.contains(element)) return;

      drag = {
        id: event.pointerId,
        target: element || root,
        startX: event.clientX,
        startY: event.clientY,
        startSide: state.side,
        horizontal: false,
        visual: {
          side: state.side,
          amount: Math.abs(state.side),
          pullsOut: false
        }
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

      drag.visual = dragVisual(drag, dx);
      paint(root, drag.visual.side, drag.visual.amount);
      root.classList.add("is-cht-system-dragging");

      event.preventDefault();
      event.stopPropagation();
    }, true);

    const finish = event => {
      if (!drag || drag.id !== event.pointerId) return;

      const current = drag;
      drag = null;

      if (!current.horizontal) return;

      let nextSide = current.startSide;

      if (event.type !== "pointercancel") {
        if (current.startSide === 0) {
          nextSide = current.visual.amount >= 0.46
            ? current.visual.side
            : 0;
        } else if (current.visual.pullsOut) {
          nextSide = current.visual.amount <= 0.54
            ? 0
            : current.startSide;
        }
      }

      state.side = nextSide;

      save(
        nextSide === 0
          ? "vysunutí bubínků z CHT"
          : nextSide < 0
            ? "zasunutí bubínků vlevo do CHT"
            : "zasunutí bubínků vpravo do CHT"
      );

      paint(root, nextSide, Math.abs(nextSide));
      root.classList.remove("is-cht-system-dragging");

      current.target.releasePointerCapture?.(event.pointerId);
      current.target.classList.remove?.("is-dragging");

      event.preventDefault();
      event.stopPropagation();
    };

    root.addEventListener("pointerup", finish, true);
    root.addEventListener("pointercancel", finish, true);

    root.addEventListener("keydown", event => {
      if (!event.target.closest?.(".cht360OsmZamek")) return;

      if (event.key === "Escape") {
        state.side = 0;
      } else if (event.key === "ArrowLeft") {
        state.side = -1;
      } else if (event.key === "ArrowRight") {
        state.side = 1;
      } else {
        return;
      }

      event.preventDefault();
      save("ovládání bubínků klávesou");
      paint(root, state.side, Math.abs(state.side));
    }, true);
  }

  function removeCards() {
    document.getElementById("cht360-arc")?.remove();
  }

  function refresh() {
    removeCards();

    const root = document.getElementById(ROOT_ID);
    if (!root) return;

    bind(root);
    paint(root, state.side, Math.abs(state.side));
  }

  function boot() {
    injectStyle();

    [0, 120, 550].forEach(delay => {
      setTimeout(refresh, delay);
    });

    window.addEventListener("cht.glyph.drums.changed", () => {
      setTimeout(refresh, 0);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();