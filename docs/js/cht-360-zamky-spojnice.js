"use strict";

/*
 * CHT 360°‰. — pět spojovacích zámků
 * Samostatný doplněk: nepřepisuje index.html, aplikace.js, bubínky ani Paměť.
 */
(() => {
  const ROOT_ID = "cht360-spojovaci-zamky";
  const STYLE_ID = "cht360-spojovaci-zamky-style";
  const STORAGE_KEY = "cht360_spojovaci_zamky_v1";
  const SOURCE_KEYS = [
    "cht360_glyph_fixed_five_v1",
    "cht360_glyph_five_guard_v1"
  ];
  const COUNT = 5;
  const EMPTY = "·";
  const STEP_PX = 18;
  const DEFAULT_VALUES = ["7i_", "ī´", "ˇ°i°ˇ", ".•cU•.", EMPTY];
  const TOKENS = [
    EMPTY,
    ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    ..."0123456789",
    "ア", "°", "‰", "•", "_", "-", "/", "´", "ˇ", "ī", "ı", "ï", "ø",
    "7i_", "ī´", "ˇ°i°ˇ", ".•cU•.", "7/¯", "}{", "•N", "7₹"
  ];

  let values = loadValues();
  let root = null;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  function boot() {
    if (document.getElementById(ROOT_ID)) return;

    const stage = document.querySelector(".stage");
    if (!stage) return;

    injectStyles();

    root = document.createElement("section");
    root.id = ROOT_ID;
    root.className = "cht360SpojovaciZamky";
    root.setAttribute(
      "aria-label",
      "Pět spojovacích bubínkových zámků mezi Revií a Oběhem"
    );

    stage.append(root);
    render();

    window.addEventListener("cht.glyph.drums.changed", event => {
      const incoming = event?.detail?.values;
      if (!Array.isArray(incoming) || incoming.length < COUNT) return;

      values = normalise(incoming);
      save("synchronizace s bubínky");
      render();
    });
  }

  function render() {
    if (!root) return;
    root.textContent = "";

    values.forEach((glyph, index) => {
      const lock = document.createElement("button");
      const previous = document.createElement("span");
      const current = document.createElement("strong");
      const next = document.createElement("span");

      lock.type = "button";
      lock.className = "cht360SpojovaciZamek glyphDrum";
      lock.dataset.index = String(index);
      lock.dataset.size = glyphSize(glyph);
      lock.setAttribute(
        "aria-label",
        `Zámek ${index + 1}. Glyph ${glyph}. Táhni prstem nahoru nebo dolů.`
      );

      previous.className = "glyphDrumGhost cht360ZamekGhost";
      previous.textContent = at(index, -1);

      current.className = "glyphDrumCurrent cht360ZamekCurrent";
      current.textContent = glyph;
      current.title = glyph;

      next.className = "glyphDrumGhost cht360ZamekGhost";
      next.textContent = at(index, 1);

      lock.append(previous, current, next);
      bind(lock, index);
      root.append(lock);
    });
  }

  function bind(lock, index) {
    let drag = null;

    lock.addEventListener("pointerdown", event => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      event.preventDefault();
      event.stopPropagation();

      drag = {
        id: event.pointerId,
        y: event.clientY,
        step: 0,
        moved: false
      };

      lock.setPointerCapture?.(event.pointerId);
      lock.classList.add("is-dragging");
    });

    lock.addEventListener("pointermove", event => {
      if (!drag || drag.id !== event.pointerId) return;

      const step = Math.trunc((drag.y - event.clientY) / STEP_PX);
      if (step === drag.step) return;

      rotate(index, step - drag.step);
      drag.step = step;
      drag.moved = true;
    });

    const finish = event => {
      if (!drag || drag.id !== event.pointerId) return;

      if (lock.hasPointerCapture?.(event.pointerId)) {
        lock.releasePointerCapture(event.pointerId);
      }

      const moved = drag.moved;
      drag = null;
      lock.classList.remove("is-dragging");

      if (!moved) rotate(index, 1);
    };

    lock.addEventListener("pointerup", finish);
    lock.addEventListener("pointercancel", finish);

    lock.addEventListener("keydown", event => {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        rotate(index, 1);
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        rotate(index, -1);
      }
    });
  }

  function rotate(index, amount) {
    const pool = tokenPool();
    const current = pool.indexOf(values[index]);

    values[index] = pool[
      modulo((current < 0 ? 0 : current) + amount, pool.length)
    ];

    save("otočení zámku");
    render();
  }

  function loadValues() {
    const own = readJson(STORAGE_KEY);
    if (Array.isArray(own?.values)) return normalise(own.values);

    for (const key of SOURCE_KEYS) {
      const source = readJson(key);
      if (Array.isArray(source?.values)) return normalise(source.values);
    }

    return [...DEFAULT_VALUES];
  }

  function save(reason) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 1,
        values: [...values],
        updatedAt: new Date().toISOString()
      }));
    } catch (_) {}

    window.dispatchEvent(new CustomEvent("cht.connector.locks.changed", {
      detail: {
        source: "spojovaci-zamky",
        reason,
        values: [...values]
      }
    }));
  }

  function normalise(raw) {
    const clean = Array.isArray(raw)
      ? raw.map(cleanGlyph).filter(Boolean).slice(0, COUNT)
      : [];

    while (clean.length < COUNT) clean.push(EMPTY);
    return clean;
  }

  function cleanGlyph(value) {
    return Array.from(
      String(value || "").trim().normalize("NFC")
    ).slice(0, 8).join("");
  }

  function tokenPool() {
    return Array.from(new Set([...TOKENS, ...values].filter(Boolean)));
  }

  function at(index, offset) {
    const pool = tokenPool();
    const current = pool.indexOf(values[index]);

    return pool[
      modulo((current < 0 ? 0 : current) + offset, pool.length)
    ];
  }

  function glyphSize(glyph) {
    const size = Array.from(glyph).length;
    return size > 3 ? "wide" : size > 1 ? "medium" : "normal";
  }

  function modulo(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
  }

  function readJson(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      .cht360SpojovaciZamky {
        position: absolute;
        z-index: 6;
        left: 50%;
        top: calc(51% + clamp(68px, 10vw, 112px));
        display: flex;
        align-items: stretch;
        justify-content: center;
        gap: clamp(5px, .8vw, 9px);
        width: min(46vw, 330px);
        min-width: 216px;
        transform: translateX(-50%);
        pointer-events: auto;
      }

      .cht360SpojovaciZamky::before,
      .cht360SpojovaciZamky::after {
        position: absolute;
        top: 50%;
        width: clamp(17px, 3vw, 38px);
        height: 1px;
        content: "";
        pointer-events: none;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 226, 173, .58)
        );
      }

      .cht360SpojovaciZamky::before {
        right: calc(100% + 4px);
      }

      .cht360SpojovaciZamky::after {
        left: calc(100% + 4px);
        transform: rotate(180deg);
      }

      .cht360SpojovaciZamek.glyphDrum {
        position: relative;
        flex: 1 1 0;
        min-width: 42px;
        max-width: 64px;
        min-height: 52px;
        height: clamp(52px, 7.4vw, 64px);
        margin: 0;
        padding: 0;
        overflow: hidden;
        border: 1px solid rgba(255, 226, 173, .38);
        border-radius: 10px;
        color: #fff0c5;
        background:
          radial-gradient(
            circle at 50% 48%,
            rgba(255, 224, 164, .18),
            transparent 56%
          ),
          rgba(4, 5, 10, .91);
        box-shadow:
          0 0 0 1px rgba(111, 66, 28, .28),
          inset 0 0 17px rgba(255, 226, 173, .08);
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        -webkit-tap-highlight-color: transparent;
      }

      .cht360SpojovaciZamek.glyphDrum::before,
      .cht360SpojovaciZamek.glyphDrum::after {
        position: absolute;
        left: 7px;
        right: 7px;
        height: 1px;
        content: "";
        pointer-events: none;
        background: rgba(255, 226, 173, .18);
      }

      .cht360SpojovaciZamek.glyphDrum::before {
        top: 16px;
      }

      .cht360SpojovaciZamek.glyphDrum::after {
        bottom: 16px;
      }

      .cht360SpojovaciZamek .cht360ZamekGhost,
      .cht360SpojovaciZamek .cht360ZamekCurrent {
        display: block;
        width: 100%;
        overflow: hidden;
        text-align: center;
        text-overflow: ellipsis;
        white-space: nowrap;
        pointer-events: none;
      }

      .cht360SpojovaciZamek .cht360ZamekGhost {
        height: 16px;
        color: rgba(255, 240, 197, .28);
        font-size: 8px;
        line-height: 16px;
      }

      .cht360SpojovaciZamek .cht360ZamekCurrent {
        height: calc(100% - 32px);
        color: #fff0c5;
        font-size: 13px;
        font-weight: 900;
        line-height: calc(100% - 32px);
        letter-spacing: .02em;
        text-shadow: 0 0 12px rgba(255, 218, 147, .7);
      }

      .cht360SpojovaciZamek[data-size="medium"] .cht360ZamekCurrent {
        font-size: 11px;
      }

      .cht360SpojovaciZamek[data-size="wide"] .cht360ZamekCurrent {
        font-size: 9px;
      }

      .cht360SpojovaciZamek.is-dragging {
        border-color: #fff0c5;
        box-shadow:
          0 0 0 2px rgba(255, 220, 150, .28),
          0 0 22px rgba(255, 206, 113, .64),
          inset 0 0 17px rgba(255, 226, 173, .17);
        transform: translateY(-1px);
      }

      @media (max-height: 430px) {
        .cht360SpojovaciZamky {
          top: calc(51% + 58px);
          width: min(45vw, 292px);
          min-width: 205px;
          gap: 5px;
        }

        .cht360SpojovaciZamek.glyphDrum {
          min-width: 39px;
          min-height: 48px;
          height: 48px;
        }

        .cht360SpojovaciZamek.glyphDrum::before {
          top: 14px;
        }

        .cht360SpojovaciZamek.glyphDrum::after {
          bottom: 14px;
        }

        .cht360SpojovaciZamek .cht360ZamekGhost {
          height: 14px;
          line-height: 14px;
        }

        .cht360SpojovaciZamek .cht360ZamekCurrent {
          height: calc(100% - 28px);
          line-height: calc(100% - 28px);
        }
      }
    `;

    document.head.append(style);
  }
})();