(() => {
  "use strict";

  const STORAGE_KEY = "cht360_jadra_pracovni_deska_v1";
  const CORE_ORDER = ["game", "control", "earth", "language"];
  const COMPACT_SCALES = [0.15, 0.18, 0.22, 0.25];
  const CORE_META = {
    game: { label: "Hra", color: "#ffe2ad", expanded: { x: -0.42, y: -0.31, z: 0.06 }, compact: { x: -0.12, y: -0.14, z: 0.18 } },
    control: { label: "Řízení", color: "#f3d091", expanded: { x: -0.05, y: -0.10, z: 0.36 }, compact: { x: 0.13, y: -0.10, z: 0.38 } },
    earth: { label: "Země", color: "#e4c584", expanded: { x: -0.43, y: 0.27, z: 0.10 }, compact: { x: -0.14, y: 0.13, z: 0.28 } },
    language: { label: "Jazyk", color: "#e9d0a0", expanded: { x: -0.04, y: 0.37, z: 0.30 }, compact: { x: 0.12, y: 0.15, z: 0.26 } }
  };

  const canvas = document.getElementById("coreCanvas");
  const ctx = canvas.getContext("2d");
  const workbench = document.getElementById("workbench");
  const toggleCores = document.getElementById("toggleCores");
  const toggleLabel = document.getElementById("toggleLabel");
  const gestureHint = document.getElementById("gestureHint");
  const selectedCoreLabel = document.getElementById("selectedCoreLabel");
  const selectedCoreCounter = document.getElementById("selectedCoreCounter");
  const note = document.getElementById("coreNote");
  const saveStatus = document.getElementById("saveStatus");
  const clearNote = document.getElementById("clearNote");
  const restoreCores = document.getElementById("restoreCores");
  const tabs = [...document.querySelectorAll(".core-tab")];

  let state = loadState();
  let width = 0;
  let height = 0;
  let dpr = 1;
  let currentCollapse = state.collapsed ? 1 : 0;
  let targetCollapse = currentCollapse;
  let view = { yaw: -0.14, pitch: -0.08, zoom: 1 };
  let lastTime = performance.now();
  let renderedCores = [];
  let pointer = null;
  let pinch = null;
  let activePointers = new Map();
  let saveTimer = null;

  function makeDefaultState() {
    return {
      collapsed: false,
      activeCore: "earth",
      notes: {
        game: "",
        control: "",
        earth: "",
        language: ""
      },
      updatedAt: new Date().toISOString()
    };
  }

  function loadState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const fallback = makeDefaultState();
      if (!stored || typeof stored !== "object") return fallback;
      return {
        ...fallback,
        ...stored,
        notes: { ...fallback.notes, ...(stored.notes || {}) }
      };
    } catch {
      return makeDefaultState();
    }
  }

  function saveState(message) {
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setSaveStatus(message || "Uloženo do tohoto jádra");
    emitChange();
  }

  function emitChange() {
    const detail = getPublicState();
    window.dispatchEvent(new CustomEvent("cht.coreDeck.changed", { detail }));
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "cht.coreDeck.changed", detail }, "*");
    }
  }

  function getPublicState() {
    return JSON.parse(JSON.stringify({
      version: 1,
      activeCore: state.activeCore,
      collapsed: Boolean(state.collapsed),
      cores: CORE_ORDER.map((id) => ({
        id,
        label: CORE_META[id].label,
        note: state.notes[id]
      })),
      updatedAt: state.updatedAt
    }));
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function setSaveStatus(message) {
    saveStatus.textContent = message;
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      saveStatus.textContent = "Ukládá se odděleně";
    }, 1900);
  }

  function selectCore(id) {
    if (!CORE_META[id]) return;
    state.activeCore = id;
    note.value = state.notes[id] || "";
    selectedCoreLabel.textContent = CORE_META[id].label;
    selectedCoreCounter.textContent = (state.notes[id] ? "1" : "0") + " / 70 slotů";
    tabs.forEach((tab) => {
      const active = tab.dataset.core === id;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    saveState("Vybráno: " + CORE_META[id].label);
  }

  function setCollapsed(value) {
    targetCollapse = value ? 1 : 0;
    state.collapsed = Boolean(value);
    toggleCores.setAttribute("aria-pressed", String(value));
    toggleLabel.textContent = value ? "Rozvinout jádra" : "Skrýt jádra";
    workbench.classList.toggle("is-open", value);
    workbench.setAttribute("aria-hidden", String(!value));
    gestureHint.style.opacity = value ? ".36" : "1";
    saveState(value ? "Jádra jsou v centru" : "Jádra jsou rozvinutá");
  }

  function easeInOut(value) {
    return value < .5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
  }

  function cubicPoint(a, b, c, d, t) {
    const mt = 1 - t;
    return {
      x: mt * mt * mt * a.x + 3 * mt * mt * t * b.x + 3 * mt * t * t * c.x + t * t * t * d.x,
      y: mt * mt * mt * a.y + 3 * mt * mt * t * b.y + 3 * mt * t * t * c.y + t * t * t * d.y,
      z: mt * mt * mt * a.z + 3 * mt * mt * t * b.z + 3 * mt * t * t * c.z + t * t * t * d.z
    };
  }

  function crescentTarget(id) {
    const index = CORE_ORDER.indexOf(id);
    const progress = [0.06, 0.34, 0.66, 0.94][index];
    const angle = (220 + progress * 270) * Math.PI / 180;
    return {
      x: -0.13 + Math.cos(angle) * 0.55,
      y: Math.sin(angle) * 0.46,
      z: 0.23 + Math.sin(progress * Math.PI) * 0.18,
      angle
    };
  }

  function compactPath(id, amount) {
    const core = CORE_META[id];
    const index = CORE_ORDER.indexOf(id);
    const target = crescentTarget(id);
    const tangent = {
      x: -Math.sin(target.angle),
      y: Math.cos(target.angle)
    };
    const controlA = {
      x: core.expanded.x + 0.17 + index * 0.028,
      y: core.expanded.y - 0.22 - index * 0.025,
      z: core.expanded.z + 0.37
    };
    const controlB = {
      x: target.x - tangent.x * 0.24,
      y: target.y - tangent.y * 0.24,
      z: target.z + 0.22
    };
    return cubicPoint(core.expanded, controlA, controlB, target, easeInOut(amount));
  }

  function rotatePoint(point) {
    const cy = Math.cos(view.yaw);
    const sy = Math.sin(view.yaw);
    const cx = Math.cos(view.pitch);
    const sx = Math.sin(view.pitch);
    const x1 = point.x * cy - point.z * sy;
    const z1 = point.x * sy + point.z * cy;
    return {
      x: x1,
      y: point.y * cx - z1 * sx,
      z: point.y * sx + z1 * cx
    };
  }

  function project(point) {
    const rotated = rotatePoint(point);
    const size = Math.min(width, height);
    const perspective = 1 + rotated.z * .20;
    return {
      x: width * .5 + rotated.x * size * .72 * view.zoom,
      y: height * .48 + rotated.y * size * .72 * view.zoom,
      z: rotated.z,
      scale: perspective * view.zoom
    };
  }

  function drawBackground(time) {
    const sky = ctx.createRadialGradient(width * .48, height * .46, 0, width * .48, height * .46, Math.max(width, height) * .72);
    sky.addColorStop(0, "rgba(164,111,46,.105)");
    sky.addColorStop(.36, "rgba(42,29,22,.025)");
    sky.addColorStop(1, "rgba(1,1,5,0)");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width * .5, height * .48);
    ctx.rotate(-.24 + view.yaw * .08);
    ctx.strokeStyle = "rgba(255,226,173,.105)";
    ctx.lineWidth = 1;
    const orbital = Math.min(width, height) * .30;
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.ellipse(0, 0, orbital + i * 74, (orbital + i * 74) * .34, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = "rgba(255,235,195,.44)";
    for (let i = 0; i < 42; i += 1) {
      const x = ((i * 199 + Math.sin(time * .00017 + i) * 53) % (width + 80)) - 40;
      const y = ((i * 131 + Math.cos(time * .00013 + i * 2) * 44) % (height + 60)) - 30;
      const radius = i % 8 === 0 ? 1.4 : .6;
      ctx.globalAlpha = .18 + (i % 4) * .08;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawCore(core, point, radius, isSelected, amount, time) {
    const { x, y, z, scale } = point;
    const r = Math.max(11, radius * scale);
    const pulse = 1 + Math.sin(time * .003 + CORE_ORDER.indexOf(core.id) * 1.8) * .025;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);

    const glow = ctx.createRadialGradient(0, 0, r * .08, 0, 0, r * 1.7);
    glow.addColorStop(0, "rgba(255,236,193,.17)");
    glow.addColorStop(.43, "rgba(213,168,78,.085)");
    glow.addColorStop(1, "rgba(213,168,78,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isSelected ? "rgba(255,233,185,.93)" : "rgba(255,225,168,.72)";
    ctx.lineWidth = isSelected ? 1.65 : 1.15;
    ctx.shadowColor = "rgba(255,205,113,.55)";
    ctx.shadowBlur = isSelected ? 18 : 10;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = "rgba(255,231,185,.54)";
    ctx.lineWidth = .72;
    ctx.rotate(view.yaw * .32 + z * .28);
    for (let i = -3; i <= 3; i += 1) {
      ctx.beginPath();
      ctx.ellipse(0, i * r * .27, r * .95, r * .28, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.rotate(Math.PI / 2.45);
    for (let i = -3; i <= 3; i += 1) {
      ctx.beginPath();
      ctx.ellipse(0, i * r * .28, r * .96, r * .27, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = "rgba(255,231,185,.42)";
    ctx.lineWidth = .65;
    ctx.beginPath();
    ctx.arc(0, 0, r * .84, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,243,213,.92)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 " + Math.max(9, r * .21) + "px ui-rounded, system-ui, sans-serif";
    ctx.fillText(core.label, 0, -r * .075);
    ctx.fillStyle = "rgba(255,235,195,.68)";
    ctx.font = "500 " + Math.max(7, r * .135) + "px ui-rounded, system-ui, sans-serif";
    const count = state.notes[core.id] ? "1/70" : "0/70";
    ctx.fillText(count, 0, r * .22);

    if (amount > .72) {
      ctx.fillStyle = "rgba(255,228,174,.77)";
      ctx.beginPath();
      ctx.arc(r * .43, -r * .43, Math.max(1.5, r * .045), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function draw(time) {
    const delta = Math.min(33, time - lastTime);
    lastTime = time;
    if (!pointer && !pinch) view.yaw += delta * .000055;
    currentCollapse += (targetCollapse - currentCollapse) * Math.min(1, delta * .0054);
    if (Math.abs(targetCollapse - currentCollapse) < .001) currentCollapse = targetCollapse;

    ctx.clearRect(0, 0, width, height);
    drawBackground(time);

    const baseRadius = Math.min(width, height) * .137;
    renderedCores = CORE_ORDER.map((id) => {
      const local = compactPath(id, currentCollapse);
      const screen = project(local);
      const index = CORE_ORDER.indexOf(id);
      const compactScale = COMPACT_SCALES[index];
      return {
        id,
        ...screen,
        radius: baseRadius * (1 + (compactScale - 1) * currentCollapse),
        local
      };
    }).sort((a, b) => a.z - b.z);

    for (const rendered of renderedCores) {
      drawCore(
        { id: rendered.id, label: CORE_META[rendered.id].label },
        rendered,
        rendered.radius,
        rendered.id === state.activeCore,
        currentCollapse,
        time
      );
    }

    requestAnimationFrame(draw);
  }

  function findCoreAt(x, y) {
    for (let i = renderedCores.length - 1; i >= 0; i -= 1) {
      const core = renderedCores[i];
      const radius = core.radius * core.scale * 1.14;
      if (Math.hypot(x - core.x, y - core.y) < radius) return core.id;
    }
    return null;
  }

  function onPointerDown(event) {
    canvas.setPointerCapture(event.pointerId);
    const point = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      moved: false
    };
    activePointers.set(event.pointerId, point);
    if (activePointers.size === 2) {
      const points = [...activePointers.values()];
      points.forEach((activePoint) => {
        activePoint.wasPinching = true;
      });
      pinch = {
        distance: distance(points[0], points[1]),
        zoom: view.zoom,
        midX: (points[0].x + points[1].x) / 2,
        midY: (points[0].y + points[1].y) / 2
      };
      pointer = null;
      return;
    }
    pointer = point;
  }

  function onPointerMove(event) {
    const point = activePointers.get(event.pointerId);
    if (!point) return;
    point.x = event.clientX;
    point.y = event.clientY;

    if (pinch && activePointers.size === 2) {
      const points = [...activePointers.values()];
      const currentDistance = distance(points[0], points[1]);
      const midX = (points[0].x + points[1].x) / 2;
      const midY = (points[0].y + points[1].y) / 2;
      view.zoom = Math.max(.70, Math.min(1.46, pinch.zoom * (currentDistance / pinch.distance)));
      view.yaw += (midX - pinch.midX) * .0032;
      view.pitch = Math.max(-.85, Math.min(.72, view.pitch + (midY - pinch.midY) * .0026));
      pinch.midX = midX;
      pinch.midY = midY;
      pinch.distance = currentDistance;
      pinch.zoom = view.zoom;
      return;
    }

    if (!pointer || event.pointerId !== pointer.id) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) pointer.moved = true;
    view.yaw += dx * .0085;
    view.pitch = Math.max(-.85, Math.min(.72, view.pitch + dy * .0068));
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  }

  function onPointerUp(event) {
    const released = activePointers.get(event.pointerId);
    const wasPinching = Boolean(pinch);
    activePointers.delete(event.pointerId);
    if (activePointers.size < 2) pinch = null;
    if (!released) return;

    if (pointer && event.pointerId === pointer.id) pointer = null;
    if (!released.moved && !wasPinching && !released.wasPinching) {
      const rect = canvas.getBoundingClientRect();
      const id = findCoreAt(event.clientX - rect.left, event.clientY - rect.top);
      if (id) {
        selectCore(id);
        if (!state.collapsed) setCollapsed(true);
      }
    }
  }

  function distance(first, second) {
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  function installBridge() {
    window.CHT360CoreDeck = {
      version: 1,
      getState: getPublicState,
      setActiveCore(id) {
        selectCore(id);
      },
      setCollapsed(value) {
        setCollapsed(Boolean(value));
      },
      setNotes(notes) {
        if (!notes || typeof notes !== "object") return;
        CORE_ORDER.forEach((id) => {
          if (typeof notes[id] === "string") state.notes[id] = notes[id];
        });
        selectCore(state.activeCore);
        saveState("Napojení aktualizovalo jádra");
      }
    };

    window.addEventListener("message", (event) => {
      const data = event.data;
      if (!data || data.type !== "cht.memory.snapshot") return;
      window.CHT360CoreDeck.setNotes(data.notes);
    });
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  toggleCores.addEventListener("click", () => setCollapsed(!state.collapsed));
  restoreCores.addEventListener("click", () => setCollapsed(false));
  tabs.forEach((tab) => tab.addEventListener("click", () => selectCore(tab.dataset.core)));
  note.addEventListener("input", () => {
    state.notes[state.activeCore] = note.value;
    selectedCoreCounter.textContent = (note.value ? "1" : "0") + " / 70 slotů";
    saveState("Uloženo do jádra: " + CORE_META[state.activeCore].label);
  });
  clearNote.addEventListener("click", () => {
    state.notes[state.activeCore] = "";
    note.value = "";
    selectedCoreCounter.textContent = "0 / 70 slotů";
    saveState("Jádro je vyčištěné");
  });
  window.addEventListener("resize", resize);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.collapsed) setCollapsed(false);
  });

  resize();
  installBridge();
  selectCore(state.activeCore);
  setCollapsed(state.collapsed);
  requestAnimationFrame(draw);
})();
