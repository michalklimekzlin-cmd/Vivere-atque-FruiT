const SLOT_LIMIT = 70;
const STORAGE_PREFIX = "VaFiT_360_SLOT_";
const EXPORT_VERSION = 1;

const WORLDS = {
  earth: {
    name: "ZEMĚ",
    hint: "Paměť světa a úhlu pohledu",
    color: "#9b9f7e",
  },
  language: {
    name: "JAZYK",
    hint: "Slova, symboly a jejich význam",
    color: "#c79b33",
  },
  game: {
    name: "HRA",
    hint: "Pravidla, světy a pohyblivé modely",
    color: "#f0c96d",
  },
  control: {
    name: "ŘÍZENÍ",
    hint: "Spojení, plán a systémové moduly",
    color: "#b4aa92",
  },
};

const $ = (id) => document.getElementById(id);
const canvas = $("towerCanvas");
const stage = canvas?.closest(".tower-stage");
const ctx = canvas?.getContext("2d");

if (!canvas || !stage || !ctx) {
  throw new Error("VaF'i'T 360°‰: chybí towerCanvas.");
}

const ui = {
  activeWorldName: $("activeWorldName"),
  activeWorldHint: $("activeWorldHint"),
  status: $("status"),
  slotModal: $("slotModal"),
  slotForm: $("slotForm"),
  slotWorld: $("slotWorld"),
  slotTitle: $("slotTitle"),
  slotLabel: $("slotLabel"),
  slotType: $("slotType"),
  slotIcon: $("slotIcon"),
  slotColor: $("slotColor"),
  slotUrl: $("slotUrl"),
  slotContent: $("slotContent"),
  slotBudget: $("slotBudget"),
  clearSlotButton: $("clearSlotButton"),
  openSlotButton: $("openSlotButton"),
  exportButton: $("exportButton"),
  importButton: $("importButton"),
  importInput: $("importInput"),
};

const profile = [
  { x: -1.22, z: 0.62, depth: 1 },
  { x: -0.61, z: -0.56, depth: 0.2 },
  { x: 0, z: 0.62, depth: 1 },
  { x: 0.61, z: -0.56, depth: 0.2 },
  { x: 1.22, z: 0.62, depth: 1 },
];

const scene = {
  world: "game",
  yaw: -0.12,
  pitch: -0.08,
  zoom: 1,
  width: 0,
  height: 0,
  dpr: 1,
  hitSlots: [],
  editing: { world: "game", index: 0 },
  pointers: new Map(),
  drag: null,
  multiGesture: null,
  lastFrame: performance.now(),
};

const slots = Object.fromEntries(
  Object.keys(WORLDS).map((world) => [world, Array.from({ length: SLOT_LIMIT }, (_, index) => loadSlot(world, index))]),
);

installCanvasFallback();
bindUi();
resizeCanvas();
selectWorld("game", false);
setStatus("360°‰ je připraveno · ležatá trojka čeká na modely.");
requestAnimationFrame(render);

function installCanvasFallback() {
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.touchAction = "none";
  canvas.style.cursor = "grab";

  if (getComputedStyle(stage).position === "static") {
    stage.style.position = "relative";
  }
}

function storageKey(world, index) {
  return `${STORAGE_PREFIX}${world}_${index}`;
}

function emptySlot(world, index) {
  return {
    id: `${world}-${index + 1}`,
    label: "",
    type: "TEXT",
    icon: "",
    color: WORLDS[world].color,
    url: "",
    content: "",
    created: null,
    updated: null,
  };
}

function normalizeSlot(value, world, index) {
  const base = emptySlot(world, index);

  if (!value || typeof value !== "object") return base;

  return {
    ...base,
    ...value,
    id: base.id,
    label: String(value.label || "").slice(0, 80),
    type: String(value.type || "TEXT").toUpperCase(),
    icon: String(value.icon || "").slice(0, 8),
    color: /^#[0-9a-f]{6}$/i.test(value.color || "") ? value.color : base.color,
    url: String(value.url || ""),
    content: String(value.content || "").slice(0, 240000),
  };
}

function loadSlot(world, index) {
  try {
    const raw = localStorage.getItem(storageKey(world, index));
    return raw ? normalizeSlot(JSON.parse(raw), world, index) : emptySlot(world, index);
  } catch {
    return emptySlot(world, index);
  }
}

function saveSlot(world, index, value) {
  const slot = normalizeSlot(value, world, index);
  const existing = slots[world][index];
  const now = new Date().toISOString();

  slot.created = existing.created || now;
  slot.updated = now;
  slots[world][index] = slot;
  localStorage.setItem(storageKey(world, index), JSON.stringify(slot));
  updateCounts();
  return slot;
}

function clearSlot(world, index) {
  localStorage.removeItem(storageKey(world, index));
  slots[world][index] = emptySlot(world, index);
  updateCounts();
}

function isFilled(slot) {
  return Boolean(
    slot.label.trim() ||
      slot.url.trim() ||
      slot.content.trim() ||
      slot.icon.trim() ||
      slot.type !== "TEXT",
  );
}

function countFilled(world) {
  return slots[world].filter(isFilled).length;
}

function updateCounts() {
  Object.keys(WORLDS).forEach((world) => {
    const count = $("count-" + world);
    if (count) count.textContent = `${countFilled(world)}/${SLOT_LIMIT}`;
  });
}

function bindUi() {
  document.querySelectorAll(".core-pill[data-world]").forEach((button) => {
    button.addEventListener("click", () => selectWorld(button.dataset.world));
  });

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", closeSlot);
  });

  ui.slotForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    saveCurrentForm();
    closeSlot();
  });

  ui.slotContent?.addEventListener("input", updateBudget);

  ui.clearSlotButton?.addEventListener("click", () => {
    const { world, index } = scene.editing;
    clearSlot(world, index);
    openSlot(world, index);
    setStatus(`Slot ${index + 1} v jádru ${WORLDS[world].name} je vyčištěný.`);
  });

  ui.openSlotButton?.addEventListener("click", () => {
    const slot = saveCurrentForm();
    const target = slot.url.trim();

    if (!target) {
      setStatus("Tomuto slotu zatím chybí odkaz nebo cesta aplikace.");
      return;
    }

    window.open(target, "_blank", "noopener");
  });

  ui.exportButton?.addEventListener("click", exportCore);
  ui.importButton?.addEventListener("click", () => ui.importInput?.click());
  ui.importInput?.addEventListener("change", importCore);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSlot();
  });

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      scene.zoom = clamp(scene.zoom - event.deltaY * 0.001, 0.72, 1.62);
    },
    { passive: false },
  );

  window.addEventListener("resize", resizeCanvas);
  new ResizeObserver(resizeCanvas).observe(stage);
}

function selectWorld(world, announce = true) {
  if (!WORLDS[world]) return;

  scene.world = world;
  ui.activeWorldName.textContent = WORLDS[world].name;
  ui.activeWorldHint.textContent = WORLDS[world].hint;

  document.querySelectorAll(".core-pill[data-world]").forEach((button) => {
    const active = button.dataset.world === world;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  updateCounts();
  if (announce) setStatus(`Aktivní jádro: ${WORLDS[world].name}.`);
}

function openSlot(world, index) {
  const slot = slots[world][index];
  scene.editing = { world, index };

  ui.slotWorld.textContent = WORLDS[world].name;
  ui.slotTitle.textContent = `Slot ${index + 1}`;
  ui.slotLabel.value = slot.label;
  ui.slotType.value = slot.type;
  ui.slotIcon.value = slot.icon;
  ui.slotColor.value = slot.color;
  ui.slotUrl.value = slot.url;
  ui.slotContent.value = slot.content;
  updateBudget();

  ui.slotModal.hidden = false;
  requestAnimationFrame(() => ui.slotLabel.focus());
}

function closeSlot() {
  if (ui.slotModal) ui.slotModal.hidden = true;
}

function currentFormValue() {
  const { world, index } = scene.editing;
  return normalizeSlot(
    {
      label: ui.slotLabel.value,
      type: ui.slotType.value,
      icon: ui.slotIcon.value,
      color: ui.slotColor.value,
      url: ui.slotUrl.value.trim(),
      content: ui.slotContent.value,
    },
    world,
    index,
  );
}

function saveCurrentForm() {
  const { world, index } = scene.editing;
  const slot = saveSlot(world, index, currentFormValue());
  setStatus(`Slot ${index + 1} je uložený v jádru ${WORLDS[world].name}.`);
  return slot;
}

function updateBudget() {
  if (!ui.slotBudget || !ui.slotContent) return;
  ui.slotBudget.textContent = `Obsah: ${ui.slotContent.value.length.toLocaleString("cs-CZ")} / 240 000 znaků`;
}

function exportCore() {
  const payload = {
    app: "VaF'i'T 360°‰",
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    slots,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = `VaFiT-360-pamet-${dateStamp()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  setStatus("Export Paměti je hotový.");
}

async function importCore(event) {
  const [file] = event.target.files || [];
  event.target.value = "";
  if (!file) return;

  try {
    const data = JSON.parse(await file.text());
    if (!data || typeof data !== "object" || !data.slots || typeof data.slots !== "object") {
      throw new Error("Soubor neobsahuje rozpoznatelnou Paměť.");
    }

    let imported = 0;
    Object.keys(WORLDS).forEach((world) => {
      const source = Array.isArray(data.slots[world]) ? data.slots[world] : [];
      source.slice(0, SLOT_LIMIT).forEach((item, index) => {
        const slot = normalizeSlot(item, world, index);
        if (!isFilled(slot)) return;
        slots[world][index] = slot;
        localStorage.setItem(storageKey(world, index), JSON.stringify(slot));
        imported += 1;
      });
    });

    updateCounts();
    setStatus(`Import hotový: ${imported} ${plural(imported, "slot", "sloty", "slotů")}.`);
  } catch (error) {
    setStatus(`Import se nepovedl: ${error.message}`);
  }
}

function onPointerDown(event) {
  canvas.setPointerCapture?.(event.pointerId);
  scene.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (scene.pointers.size === 1) {
    scene.drag = {
      x: event.clientX,
      y: event.clientY,
      started: performance.now(),
      moved: false,
      multi: false,
    };
  } else {
    scene.drag.multi = true;
    scene.multiGesture = null;
  }

  canvas.style.cursor = "grabbing";
}

function onPointerMove(event) {
  if (!scene.pointers.has(event.pointerId)) return;

  const previous = scene.pointers.get(event.pointerId);
  scene.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (scene.pointers.size === 1) {
    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    scene.yaw += dx * 0.009;
    scene.pitch = clamp(scene.pitch + dy * 0.007, -0.62, 0.48);

    if (scene.drag && Math.hypot(event.clientX - scene.drag.x, event.clientY - scene.drag.y) > 8) {
      scene.drag.moved = true;
    }
    return;
  }

  const points = [...scene.pointers.values()];
  const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  const center = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };

  if (scene.multiGesture) {
    scene.zoom = clamp(scene.zoom + (distance - scene.multiGesture.distance) * 0.003, 0.72, 1.62);
    scene.yaw += (center.x - scene.multiGesture.center.x) * 0.004;
    scene.pitch = clamp(scene.pitch + (center.y - scene.multiGesture.center.y) * 0.004, -0.62, 0.48);
  }

  scene.multiGesture = { distance, center };
}

function onPointerUp(event) {
  if (!scene.pointers.has(event.pointerId)) return;

  const wasTap =
    scene.pointers.size === 1 &&
    scene.drag &&
    !scene.drag.moved &&
    !scene.drag.multi &&
    performance.now() - scene.drag.started < 360;

  scene.pointers.delete(event.pointerId);
  canvas.releasePointerCapture?.(event.pointerId);

  if (scene.pointers.size < 2) scene.multiGesture = null;
  if (scene.pointers.size === 0) {
    canvas.style.cursor = "grab";
    if (wasTap) pickSlot(event.clientX, event.clientY);
    scene.drag = null;
  }
}

function pickSlot(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const match = scene.hitSlots
    .map((hit) => ({ ...hit, distance: Math.hypot(hit.x - x, hit.y - y) }))
    .filter((hit) => hit.distance <= hit.radius + 12)
    .sort((a, b) => a.distance - b.distance)[0];

  if (match) {
    openSlot(scene.world, match.index);
  } else {
    setStatus("Klepni na bod dráhy — otevře se k němu připojený slot.");
  }
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, rect.width || stage.clientWidth || 320);
  const height = Math.max(1, rect.height || stage.clientHeight || 460);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  scene.width = width;
  scene.height = height;
  scene.dpr = dpr;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function render(now) {
  const elapsed = Math.min((now - scene.lastFrame) / 1000, 0.05);
  scene.lastFrame = now;
  drawScene(now / 1000, elapsed);
  requestAnimationFrame(render);
}

function drawScene(time) {
  const { width, height } = scene;
  if (!width || !height) return;

  const color = hexToRgb(WORLDS[scene.world].color);
  const background = ctx.createRadialGradient(width * 0.5, height * 0.44, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.8);
  background.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.16)`);
  background.addColorStop(0.48, "#0d0d0a");
  background.addColorStop(1, "#050504");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  drawAmbientDust(time, color);
  drawThreeSurface(color);
  drawRails(time, color);
  drawSockets(time, color);
  drawSlotMarkers(color);
  drawRunners(time, color);
}

function drawAmbientDust(time, color) {
  ctx.save();
  for (let index = 0; index < 28; index += 1) {
    const phase = index * 17.31;
    const x = ((Math.sin(time * 0.13 + phase) + 1) / 2) * scene.width;
    const y = ((Math.cos(time * 0.18 + phase * 0.71) + 1) / 2) * scene.height;
    const radius = 0.45 + (index % 4) * 0.23;
    ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.07 + (index % 3) * 0.025})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawThreeSurface(color) {
  const rows = [-0.92, -0.48, 0, 0.48, 0.92];

  ctx.save();
  for (let row = 0; row < rows.length - 1; row += 1) {
    for (let segment = 0; segment < profile.length - 1; segment += 1) {
      const a = profile[segment];
      const b = profile[segment + 1];
      const points = [
        project({ x: a.x, y: rows[row], z: a.z }),
        project({ x: b.x, y: rows[row], z: b.z }),
        project({ x: b.x, y: rows[row + 1], z: b.z }),
        project({ x: a.x, y: rows[row + 1], z: a.z }),
      ];
      const brightness = 0.055 + ((a.depth + b.depth) / 2) * 0.1 + (row % 2) * 0.015;

      polygon(points, `rgba(${color.r}, ${color.g}, ${color.b}, ${brightness})`, `rgba(${color.r}, ${color.g}, ${color.b}, 0.19)`);
    }
  }

  rows.forEach((row, index) => {
    drawProfileLine(row, 0.012, `rgba(${color.r}, ${color.g}, ${color.b}, ${index === 2 ? 0.48 : 0.2})`, index === 2 ? 1.3 : 0.7);
  });

  [-1.22, 1.22].forEach((x) => {
    const anchor = profile.find((point) => point.x === x);
    const from = project({ x, y: -0.92, z: anchor.z });
    const to = project({ x, y: 0.92, z: anchor.z });
    line(from, to, `rgba(${color.r}, ${color.g}, ${color.b}, 0.34)`, 1.1);
  });
  ctx.restore();
}

function drawRails(time, color) {
  ctx.save();
  [-0.47, 0.47].forEach((lane, laneIndex) => {
    drawProfileLine(lane, 0.1, `rgba(${color.r}, ${color.g}, ${color.b}, 0.78)`, 1.6);
    drawProfileLine(lane + (laneIndex ? -0.03 : 0.03), 0.07, `rgba(255, 238, 192, 0.22)`, 0.6);
  });

  const pulse = 0.45 + Math.sin(time * 1.5) * 0.16;
  drawProfileLine(0, 0.13, `rgba(255, 233, 179, ${pulse})`, 1.2);
  ctx.restore();
}

function drawSockets(time, color) {
  ctx.save();
  profile.forEach((point, index) => {
    [-0.47, 0.47].forEach((lane, laneIndex) => {
      const position = project({ x: point.x, y: lane, z: point.z + 0.13 });
      const pulse = 0.75 + Math.sin(time * 1.8 + index + laneIndex) * 0.12;
      const radius = Math.max(3.4, 7 * position.scale * pulse);

      ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.9)`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.28)`;
      ctx.beginPath();
      ctx.arc(position.x, position.y, radius * 0.42, 0, Math.PI * 2);
      ctx.fill();
    });
  });
  ctx.restore();
}

function drawSlotMarkers(color) {
  const activeSlots = slots[scene.world];
  scene.hitSlots = [];

  for (let index = 0; index < SLOT_LIMIT; index += 1) {
    const position = slotPosition(index);
    const point = project(position);
    const slot = activeSlots[index];
    const filled = isFilled(slot);
    const selected = scene.editing.world === scene.world && scene.editing.index === index && !ui.slotModal.hidden;
    const radius = clamp(2 + point.scale * 3.8, 2.5, 6.5);

    if (point.x < -15 || point.x > scene.width + 15 || point.y < -15 || point.y > scene.height + 15) continue;

    ctx.save();
    if (filled) {
      const glow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius * 3.8);
      glow.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.55)`);
      glow.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius * 3.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = filled ? `rgba(${color.r}, ${color.g}, ${color.b}, 0.96)` : "rgba(255, 247, 224, 0.12)";
    ctx.fill();
    ctx.lineWidth = selected ? 2 : 0.85;
    ctx.strokeStyle = selected ? "#fff0c5" : `rgba(${color.r}, ${color.g}, ${color.b}, 0.68)`;
    ctx.stroke();
    ctx.restore();

    scene.hitSlots.push({ index, x: point.x, y: point.y, radius });
  }
}

function drawRunners(time, color) {
  const runners = [
    { phase: 0.04, speed: 0.045, lane: -0.47, size: 1 },
    { phase: 0.37, speed: 0.028, lane: 0.47, size: 0.86 },
    { phase: 0.68, speed: 0.06, lane: 0, size: 0.72 },
  ];

  runners.forEach((runner) => {
    const position = sampleProfile((runner.phase + time * runner.speed) % 1);
    const point = project({ x: position.x, y: runner.lane, z: position.z + 0.16 });
    const radius = Math.max(3, 6.5 * point.scale * runner.size);

    const glow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius * 4);
    glow.addColorStop(0, "rgba(255, 246, 213, 0.95)");
    glow.addColorStop(0.25, `rgba(${color.r}, ${color.g}, ${color.b}, 0.65)`);
    glow.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius * 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff0c5";
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius * 0.52, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawProfileLine(y, zOffset, strokeStyle, width) {
  ctx.beginPath();
  for (let step = 0; step <= 80; step += 1) {
    const point = sampleProfile(step / 80);
    const screen = project({ x: point.x, y, z: point.z + zOffset });
    if (step === 0) ctx.moveTo(screen.x, screen.y);
    else ctx.lineTo(screen.x, screen.y);
  }
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = width;
  ctx.stroke();
}

function slotPosition(index) {
  const pair = Math.floor(index / 2);
  const u = pair / 34;
  const base = sampleProfile(u);
  const lane = index % 2 ? 0.47 : -0.47;
  return { x: base.x, y: lane, z: base.z + 0.12 };
}

function sampleProfile(u) {
  const bounded = clamp(u, 0, 1);
  const scaled = bounded * (profile.length - 1);
  const index = Math.min(profile.length - 2, Math.floor(scaled));
  const local = scaled - index;
  const eased = local * local * (3 - 2 * local);
  const from = profile[index];
  const to = profile[index + 1];
  return {
    x: lerp(from.x, to.x, local),
    z: lerp(from.z, to.z, eased),
  };
}

function project(point) {
  const yawCos = Math.cos(scene.yaw);
  const yawSin = Math.sin(scene.yaw);
  const pitchCos = Math.cos(scene.pitch);
  const pitchSin = Math.sin(scene.pitch);

  const yawX = point.x * yawCos - point.z * yawSin;
  const yawZ = point.x * yawSin + point.z * yawCos;
  const pitchY = point.y * pitchCos - yawZ * pitchSin;
  const pitchZ = point.y * pitchSin + yawZ * pitchCos;
  const perspective = Math.max(0.12, 4.55 - pitchZ);
  const scale = (Math.min(scene.width, scene.height) * 0.79 * scene.zoom) / perspective;

  return {
    x: scene.width / 2 + yawX * scale,
    y: scene.height / 2 - pitchY * scale,
    scale: scale / Math.min(scene.width, scene.height),
    z: pitchZ,
  };
}

function polygon(points, fillStyle, strokeStyle) {
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 0.65;
  ctx.stroke();
}

function line(from, to, strokeStyle, width) {
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = width;
  ctx.stroke();
}

function setStatus(message) {
  if (ui.status) ui.status.textContent = message;
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function plural(value, one, few, many) {
  if (value === 1) return one;
  if (value >= 2 && value <= 4) return few;
  return many;
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
