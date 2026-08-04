/* CHT 360°‰. — oblý kryt kapsiček pro krajní bubínky. */
(() => {
  const ROOT_ID = "cht360-oblouk-osmi-zamku";
  const STEP_DISTANCE = 74;

  function numberValue(node, property) {
    const value = node.style.getPropertyValue(property)
      || getComputedStyle(node).getPropertyValue(property);

    return Number.parseFloat(value) || 0;
  }

  function ensureCover(node) {
    let cover = node.querySelector(".cht360PocketCover");

    if (cover) return cover;

    cover = document.createElement("span");
    cover.className = "cht360PocketCover";
    cover.setAttribute("aria-hidden", "true");
    node.append(cover);

    return cover;
  }

  function syncPocket(node) {
    const side = node.dataset.chtPocket || "open";
    const cover = ensureCover(node);

    const isPocket = side === "left" || side === "right";
    const x = numberValue(node, "--cht-inset-x");
    const y = numberValue(node, "--cht-inset-y");
    const progress = isPocket
      ? Math.min(Math.abs(x) / STEP_DISTANCE, 1)
      : 0;

    const shellX = side === "left"
      ? -STEP_DISTANCE
      : side === "right"
        ? STEP_DISTANCE
        : 0;

    cover.dataset.side = side;
    cover.style.left = `calc(${shellX}px + ${side === "right" ? "47%" : "0%"})`;
    cover.style.opacity = String(progress);

    /* Kapsička stojí ve stěně, i když bubínek dělá svůj krok nahoru a dolů. */
    cover.style.transform = `translate3d(${-x}px, ${-y}px, 0)`;
  }

  function refresh() {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;

    root.querySelectorAll("[data-lock-index]").forEach(syncPocket);
  }

  function injectStyle() {
    if (document.getElementById("cht360-kapsicky-style")) return;

    const style = document.createElement("style");
    style.id = "cht360-kapsicky-style";
    style.textContent = `
      #${ROOT_ID} .cht360OsmZamek {
        position: relative !important;
        overflow: visible !important;
        isolation: isolate;
        clip-path: none !important;
      }

      #${ROOT_ID} .cht360PocketCover {
        display: block;
        position: absolute;
        z-index: 8;
        top: 5px;
        bottom: 5px;
        width: 53%;
        pointer-events: none;

        border: 1px solid rgba(248, 213, 139, .62);
        box-shadow:
          inset 0 0 0 2px rgba(8, 6, 3, .56),
          inset 0 0 13px rgba(255, 190, 71, .16),
          0 0 8px rgba(255, 190, 71, .18);

        background:
          repeating-linear-gradient(
            0deg,
            rgba(255, 232, 171, .17) 0 1px,
            transparent 1px 7px
          ),
          linear-gradient(
            90deg,
            #0e0a06 0%,
            #4d3617 29%,
            #1b1209 75%,
            #080604 100%
          );

        transition:
          transform .86s cubic-bezier(.16,.86,.2,1),
          opacity .42s ease;
      }

      #${ROOT_ID} .cht360PocketCover[data-side="left"] {
        border-radius: 13px 3px 3px 13px;
      }

      #${ROOT_ID} .cht360PocketCover[data-side="right"] {
        border-radius: 3px 13px 13px 3px;
        background:
          repeating-linear-gradient(
            0deg,
            rgba(255, 232, 171, .17) 0 1px,
            transparent 1px 7px
          ),
          linear-gradient(
            270deg,
            #0e0a06 0%,
            #4d3617 29%,
            #1b1209 75%,
            #080604 100%
          );
      }

      /* Dvě tenké svislé kolejnice kapsičky. */
      #${ROOT_ID} .cht360PocketCover::before,
      #${ROOT_ID} .cht360PocketCover::after {
        content: "";
        position: absolute;
        top: 5px;
        bottom: 5px;
        width: 3px;
        border-radius: 4px;
        background: linear-gradient(
          180deg,
          rgba(255, 226, 158, .8),
          rgba(109, 69, 21, .35)
        );
        box-shadow: 0 0 5px rgba(255, 201, 91, .4);
      }

      #${ROOT_ID} .cht360PocketCover::before {
        left: 5px;
      }

      #${ROOT_ID} .cht360PocketCover::after {
        right: 5px;
      }

      #${ROOT_ID}.is-cht-system-dragging .cht360PocketCover {
        transition:
          transform .16s ease-out,
          opacity .16s ease-out;
      }
    `;

    document.head.append(style);
  }

  function boot() {
    injectStyle();
    refresh();

    const root = document.getElementById(ROOT_ID);
    if (!root) return;

    new MutationObserver(refresh).observe(root, {
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "data-cht-pocket"]
    });

    window.addEventListener("cht.glyph.drums.changed", refresh);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();