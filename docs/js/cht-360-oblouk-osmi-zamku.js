"use strict";

/*
 * CHT 360°‰. — oblouk osmi bubínkových zámků
 *
 * Připojitelný doplněk. Nemaže ani nepřepisuje index, Paměť, původní bubínky
 * ani pokojíčky. Osm zámků sedí dole na zlaté lince mezi Revií a Oběhem.
 *
 * Klepnutí: otevře přiřazenou funkci.
 * Tah prstem nahoru/dolů: změní Glyph.
 * Po výběru dveří na prstenci se tažený Glyph bezpečně zapíše do vybraného
 * pokojíčku; před prvním takovým zápisem se vytvoří vratný místní snímek.
 */
(() => {
  const ROOT_ID = "cht360-oblouk-osmi-zamku";
  const STYLE_ID = "cht360-oblouk-osmi-zamku-style";
  const LEGACY_ROOT_ID = "cht360-spojovaci-zamky";
  const STORAGE_KEY = "cht360_osm_zamku_oblouk_v1";
  const GLYPH_CONTEXT_KEY = "cht360_osm_zamku_glyph_context_v1";
  const ROOM_KEY = "cht360_room_orbit_v1";
  const ROOM_SNAPSHOTS_KEY = "cht360_osm_zamku_room_snapshots_v1";
  const LEGACY_GLYPH_KEYS = [
    "cht360_glyph_fixed_five_v1",
    "cht360_glyph_five_guard_v1"
  ];
  const EMPTY = "·";
  const STEP_PX = 18;
  const DEFAULT_VALUES = ["7i_", "ī´", "ˇ°i°ˇ", ".•cU•.", "•", "ア", "°", EMPTY];
  const TOKENS = [
    EMPTY,
    ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    ..."0123456789",
    "Á", "Č", "Ď", "É", "Ě", "Í", "Ň", "Ó", "Ř", "Š", "Ť", "Ú", "Ů", "Ý",
    "ア", "°", "‰", "•", "_", "-", "/", "´", "ˇ", "ī", "ı", "ï", "ø",
    "7i_", "ī´", "ˇ°i°ˇ", ".•cU•.", "7/¯", "}{", "•N", "7₹"
  ];

  /* Šest požadovaných cest + dvě skutečné karty CHT: Úložiště a Jádra. */
  const LOCKS = Object.freeze([
    { id: "cht-mluva", label: "Mluva", path: "mluva-cht-360/" },
    { id: "glyph-cht-360", label: "Glyphy", path: "glyph-cht-360/" },
    { id: "glyph-pokojicku-cht-360", label: "Pokojíčky", path: "glyph-pokojicku-cht-360/" },
    { id: "cht-360-bubinky", label: "Bubínky", path: "bubinky/" },
    { id: "signal-360", label: "Signál", path: "signal-360/" },
    { id: "cht-puls-360", label: "Puls", path: "cht-puls-360/" },
    { id: "cht-storage", label: "Úložiště", path: "cht-storage/" },
    { id: "cht-360-jadra", label: "Jádra", path: "cht360-jadra-pracovni-deska/" }
  ]);

  let state = loadState();
  let root = null;
  let activeRoomId = null;
  let roomSnapshotMade = false;

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
    document.getElementById(LEGACY_ROOT_ID)?.setAttribute("aria-hidden", "true");

    root = document.createElement("nav");
    root.id = ROOT_ID;
    root.className = "cht360OsmZamku";
    root.setAttribute("aria-label", "Osm bubínkových zámků CHT 360°‰.");
    stage.append(root);
    render();

    window.addEventListener("cht.room.selected", event => {
      activeRoomId = event?.detail?.id || null;
    });

    window.addEventListener("cht.glyph.drums.changed", event => {
      const incoming = event?.detail?.values;
      if (!Array.isArray(incoming) || !incoming.length) return;

      incoming.slice(0, 5).forEach((glyph, index) => {
        state.values[index] = cleanGlyph(glyph) || state.values[index];
      });

      save("synchronizace s původní pětkou");
      render();
    });
  }

  function render() {
    if (!root) return;
    root.textContent = "";

    LOCKS.forEach((action, index) => {
      const lock = document.createElement("button");
      const label = document.createElement("span");
      const previous = document.createElement("span");
      const current = document.createElement("strong");
      const next = document.createElement("span");
      const glyph = state.values[index];

      lock.type = "button";
      lock.className = "cht360OsmZamek";
      lock.dataset.lockIndex = String(index);
      lock.dataset.size = glyphSize(glyph);
      lock.style.setProperty("--smile-y", smileOffset(index) + "px");
      lock.setAttribute(
        "aria-label",
        action.label + ". Klepnutím otevřeš funkci. Tažením změníš Glyph " + glyph + "."
      );

      label.className = "cht360OsmZamekLabel";
      label.textContent = action.label;

      previous.className = "cht360OsmZamekGhost";
      previous.textContent = tokenAt(index, -1);

      current.className = "cht360OsmZamekGlyph";
      current.textContent = glyph;
      current.title = glyph;

      next.className = "cht360OsmZamekGhost";
      next.textContent = tokenAt(index, 1);

      lock.append(label, previous, current, next);
      bind(lock, index, action);
      root.append(lock);
    });
  }

  function bind(lock, index, action) {
    let drag = null;

    lock.addEventListener("pointerdown", event => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      event.preventDefault();
      event.stopPropagation();
      drag = { id: event.pointerId, startY: event.clientY, step: 0, moved: false };
      lock.setPointerCapture?.(event.pointerId);
      lock.classList.add("is-dragging");
    });

    lock.addEventListener("pointermove", event => {
      if (!drag || drag.id !== event.pointerId) return;

      const step = Math.trunc((drag.startY - event.clientY) / STEP_PX);
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

      const wasMoved = drag.moved;
      drag = null;
      lock.classList.remove("is-dragging");

      if (!wasMoved) openAction(action);
    };

    lock.addEventListener("pointerup", finish);
    lock.addEventListener("pointercancel", finish);
    lock.addEventListener("keydown", event => {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        rotate(index, 1);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        rotate(index, -1);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openAction(action);
      }
    });
  }

  function rotate(index, amount) {
    const pool = tokenPool();
    const current = pool.indexOf(state.values[index]);
    const glyph = pool[modulo((current < 0 ? 0 : current) + amount, pool.length)];

    state.values[index] = glyph;
    save("otočení Glyphu");
    refreshLock(index);
    shareGlyph(index, glyph);
  }

  function refreshLock(index) {
    const lock = root?.querySelector("[data-lock-index='" + index + "']");
    if (!lock) {
      render();
      return;
    }

    const glyph = state.values[index];
    const ghosts = lock.querySelectorAll(".cht360OsmZamekGhost");
    const current = lock.querySelector(".cht360OsmZamekGlyph");

    lock.dataset.size = glyphSize(glyph);
    if (ghosts[0]) ghosts[0].textContent = tokenAt(index, -1);
    if (current) {
      current.textContent = glyph;
      current.title = glyph;
      current.classList.remove("is-stepping");
      void current.offsetWidth;
      current.classList.add("is-stepping");
    }
    if (ghosts[1]) ghosts[1].textContent = tokenAt(index, 1);
  }

  function openAction(action) {
    const module = window.CHT360Config?.modules?.find(item => item.id === action.id);
    const url = module?.url || new URL(action.path, window.location.href).toString();
    window.location.assign(url);
  }

  function shareGlyph(index, glyph) {
    const action = LOCKS[index];
    const detail = {
      source: "cht360-osm-zamku",
      index,
      lock: action.id,
      label: action.label,
      glyph,
      updatedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(GLYPH_CONTEXT_KEY, JSON.stringify(detail));
    } catch (_) {}

    window.dispatchEvent(new CustomEvent("cht.glyph.lock.changed", { detail }));

    if (!activeRoomId || !window.CHTRoomOrbit?.assignGlyph) return;

    snapshotRoomOrbit();
    window.CHTRoomOrbit.assignGlyph(glyph);
  }

  function snapshotRoomOrbit() {
    if (roomSnapshotMade) return;

    try {
      const raw = localStorage.getItem(ROOM_KEY);
      const snapshots = readJson(ROOM_SNAPSHOTS_KEY);
      const list = Array.isArray(snapshots?.items) ? snapshots.items : [];

      list.push({
        at: new Date().toISOString(),
        sourceKey: ROOM_KEY,
        reason: "před prvním přiřazením Glyphu z oblouku osmi zámků",
        value: raw
      });

      localStorage.setItem(ROOM_SNAPSHOTS_KEY, JSON.stringify({
        version: 1,
        items: list.slice(-3)
      }));
    } catch (_) {}

    roomSnapshotMade = true;
  }

  function loadState() {
    const saved = readJson(STORAGE_KEY);
    if (Array.isArray(saved?.values)) {
      return {
        version: 1,
        values: normalise(saved.values),
        history: Array.isArray(saved.history) ? saved.history.slice(-8) : []
      };
    }

    const inherited = [...DEFAULT_VALUES];
    for (const key of LEGACY_GLYPH_KEYS) {
      const source = readJson(key);
      if (!Array.isArray(source?.values)) continue;

      source.values.slice(0, 5).forEach((glyph, index) => {
        inherited[index] = cleanGlyph(glyph) || inherited[index];
      });
      break;
    }

    return { version: 1, values: inherited, history: [] };
  }

  function save(reason) {
    const snapshot = {
      at: new Date().toISOString(),
      reason,
      values: [...state.values]
    };

    state.history = [...state.history, snapshot].slice(-8);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 1,
        values: [...state.values],
        history: state.history,
        updatedAt: snapshot.at
      }));
    } catch (_) {}

    window.dispatchEvent(new CustomEvent("cht.connector.locks.changed", {
      detail: { source: "osm-zamku", reason, values: [...state.values] }
    }));
  }

  function normalise(values) {
    const result = Array.isArray(values)
      ? values.map(cleanGlyph).filter(Boolean).slice(0, LOCKS.length)
      : [];

    while (result.length < LOCKS.length) {
      result.push(DEFAULT_VALUES[result.length] || EMPTY);
    }

    return result;
  }

  function cleanGlyph(value) {
    return Array.from(String(value || "").trim().normalize("NFC")).slice(0, 8).join("");
  }

  function tokenPool() {
    return Array.from(new Set([...TOKENS, ...state.values].filter(Boolean)));
  }

  function tokenAt(index, offset) {
    const pool = tokenPool();
    const current = pool.indexOf(state.values[index]);
    return pool[modulo((current < 0 ? 0 : current) + offset, pool.length)];
  }

  function glyphSize(glyph) {
    const length = Array.from(glyph).length;
    return length > 3 ? "wide" : length > 1 ? "medium" : "normal";
  }

  function smileOffset(index) {
    return [0, 5, 10, 14, 14, 10, 5, 0][index] || 0;
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
      #${LEGACY_ROOT_ID} { display: none !important; }

      .cht360OsmZamku {
        position: absolute;
        z-index: 7;
        left: 50%;
        bottom: max(34px, calc(env(safe-area-inset-bottom) + 19px));
        display: flex;
        align-items: flex-start;
        justify-content: center;
        gap: clamp(3px, .55vw, 7px);
        width: min(54vw, 460px);
        min-width: 320px;
        transform: translateX(-50%);
        pointer-events: auto;
      }

      .cht360OsmZamku::before {
        position: absolute;
        z-index: -1;
        bottom: 10px;
        left: -5%;
        width: 110%;
        height: 46px;
        border-bottom: 2px solid rgba(255, 232, 172, .55);
        border-radius: 0 0 50% 50%;
        box-shadow: 0 13px 18px rgba(221, 166, 75, .16);
        content: "";
        pointer-events: none;
      }

      .cht360OsmZamek {
        position: relative;
        display: grid;
        flex: 1 1 0;
        grid-template-rows: 11px 11px minmax(17px, 1fr) 11px;
        min-width: 38px;
        max-width: 57px;
        height: clamp(48px, 6vw, 58px);
        margin: 0;
        padding: 2px 1px 1px;
        overflow: hidden;
        border: 1px solid rgba(255, 226, 173, .40);
        border-radius: 10px;
        color: #fff0c5;
        cursor: pointer;
        transform: translateY(var(--smile-y));
        background:
          radial-gradient(circle at 50% 50%, rgba(255, 224, 164, .19), transparent 56%),
          rgba(4, 5, 10, .92);
        box-shadow:
          0 0 0 1px rgba(111, 66, 28, .25),
          inset 0 0 16px rgba(255, 226, 173, .08);
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        -webkit-tap-highlight-color: transparent;
      }

      .cht360OsmZamek::before,
      .cht360OsmZamek::after {
        position: absolute;
        right: 6px;
        left: 6px;
        height: 1px;
        content: "";
        pointer-events: none;
        background: rgba(255, 226, 173, .16);
      }

      .cht360OsmZamek::before { top: 23px; }
      .cht360OsmZamek::after { bottom: 11px; }

      .cht360OsmZamekLabel,
      .cht360OsmZamekGhost,
      .cht360OsmZamekGlyph {
        display: block;
        width: 100%;
        overflow: hidden;
        text-align: center;
        text-overflow: ellipsis;
        white-space: nowrap;
        pointer-events: none;
      }

      .cht360OsmZamekLabel {
        color: rgba(255, 229, 172, .82);
        font-size: 7px;
        font-weight: 900;
        line-height: 11px;
        letter-spacing: .01em;
      }

      .cht360OsmZamekGhost {
        color: rgba(255, 240, 197, .28);
        font-size: 7px;
        line-height: 11px;
      }

      .cht360OsmZamekGlyph {
        align-self: center;
        color: #fff0c5;
        font-size: 12px;
        font-weight: 900;
        line-height: 1;
        letter-spacing: .02em;
        text-shadow: 0 0 11px rgba(255, 218, 147, .72);
      }

      .cht360OsmZamek[data-size="medium"] .cht360OsmZamekGlyph { font-size: 10px; }
      .cht360OsmZamek[data-size="wide"] .cht360OsmZamekGlyph { font-size: 8px; }

      .cht360OsmZamek.is-dragging {
        border-color: #fff0c5;
        box-shadow:
          0 0 0 2px rgba(255, 220, 150, .28),
          0 0 22px rgba(255, 206, 113, .64),
          inset 0 0 17px rgba(255, 226, 173, .17);
        filter: brightness(1.12);
      }

      .cht360OsmZamekGlyph.is-stepping {
        animation: cht360OsmZamkuStep .17s ease-out;
      }

      @keyframes cht360OsmZamkuStep {
        from { transform: translateY(7px); opacity: .26; }
        to { transform: translateY(0); opacity: 1; }
      }

      .cht360OsmZamek:focus-visible {
        outline: 2px solid #fff0c5;
        outline-offset: 2px;
      }

      @media (max-height: 430px) {
        .cht360OsmZamku {
          bottom: max(27px, calc(env(safe-area-inset-bottom) + 13px));
          gap: 3px;
          width: min(55vw, 430px);
          min-width: 308px;
        }

        .cht360OsmZamku::before { bottom: 8px; }

        .cht360OsmZamek {
          grid-template-rows: 10px 10px minmax(16px, 1fr) 10px;
          min-width: 37px;
          height: 47px;
          border-radius: 9px;
        }

        .cht360OsmZamekLabel,
        .cht360OsmZamekGhost { line-height: 10px; }
        .cht360OsmZamekLabel { font-size: 6.5px; }
        .cht360OsmZamekGhost { font-size: 6px; }
        .cht360OsmZamek::before { top: 21px; }
        .cht360OsmZamek::after { bottom: 10px; }
      }
    `;

    document.head.append(style);
  }
})();
