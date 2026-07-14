"use strict";

const canvas = document.getElementById("globe-canvas");
const context = canvas.getContext("2d");
const panel = document.getElementById("memoryPanel");
const panelTitle = document.getElementById("panelTitle");
const panelSub = document.getElementById("panelSub");
const closePanel = document.getElementById("closePanel");
const slotGrid = document.getElementById("slotGrid");
const slotEditor = document.getElementById("slotEditor");
const slotName = document.getElementById("slotName");
const slotContent = document.getElementById("slotContent");
const saveSlot = document.getElementById("saveSlot");
const clearSlot = document.getElementById("clearSlot");
const searchInput = document.getElementById("searchInput");
const exportCore = document.getElementById("exportCore");
const importCore = document.getElementById("importCore");
const exportAll = document.getElementById("exportAll");
const importAll = document.getElementById("importAll");
const fileInput = document.getElementById("fileInput");
const statusBox = document.getElementById("statusBox");

const STORAGE_KEY = "vaft_pamet_v1";
const SLOT_COUNT = 70;
const SCENE_KEY = "vaft_pamet_scene_v2";
const MIN_SCENE_SPREAD = .96;
const MAX_SCENE_SPREAD = 2.8;

const cores = [
  { id: "earth", title: "ZemÄ", subtitle: "Modeling, svÄty a Ãºhel pohledu", angle: -Math.PI * .72, radius: 50 },
  { id: "language", title: "Jazyk", subtitle: "PÃ­smena, symboly, glyphy a vÃ½znam", angle: -Math.PI * .18, radius: 50 },
  { id: "game", title: "Hra", subtitle: "Pravidla, udÃ¡losti a postup", angle: Math.PI * .34, radius: 50 },
  { id: "control", title: "ÅÃ­zenÃ­", subtitle: "SmÄrovÃ¡nÃ­, jednotky a propojenÃ­", angle: Math.PI * .86, radius: 50 }
];

let memory = loadMemory();
let scene = loadScene();
let width = 0;
let height = 0;
let pixelRatio = 1;
let lastFrameTime = 0;
let selectedCore = null;
let selectedSlotIndex = null;
let activePointers = new Map();
let gesture = null;
let importMode = "core";

function createEmptySlot(index) {
  return {
    id: index + 1,
    name: `Slot ${index + 1}`,
    content: "",
    updatedAt: null
  };
}

function createEmptyCore() {
  return Array.from({ length: SLOT_COUNT }, (_, index) => createEmptySlot(index));
}

function createEmptyMemory() {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cores: {
      earth: createEmptyCore(),
      language: createEmptyCore(),
      game: createEmptyCore(),
      control: createEmptyCore()
    }
  };
}

function loadMemory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return createEmptyMemory();
    }

    const parsed = JSON.parse(raw);

    if (!parsed.cores) {
      throw new Error("NeplatnÃ¡ struktura");
    }

    for (const coreId of ["earth", "language", "game", "control"]) {
      if (!Array.isArray(parsed.cores[coreId])) {
        parsed.cores[coreId] = createEmptyCore();
      }

      while (parsed.cores[coreId].length < SLOT_COUNT) {
        parsed.cores[coreId].push(createEmptySlot(parsed.cores[coreId].length));
      }

      parsed.cores[coreId] = parsed.cores[coreId].slice(0, SLOT_COUNT);
    }

    return parsed;
  } catch (error) {
    console.warn("PamÄÅ¥ byla obnovena do vÃ½chozÃ­ho stavu.", error);
    return createEmptyMemory();
  }
}


function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normaliseAngle(value) {
  const circle = Math.PI * 2;
  return ((value + Math.PI) % circle + circle) % circle - Math.PI;
}

function createDefaultScene() {
  return {
    yaw: 0,
    pitch: 0,
    spread: 1,
    panX: 0,
    panY: 0
  };
}

function loadScene() {
  const fallback = createDefaultScene();

  try {
    const raw = localStorage.getItem(SCENE_KEY);

    if (!raw) {
      return fallback;
    }

    const saved = JSON.parse(raw);

    return {
      yaw: Number.isFinite(saved.yaw) ? saved.yaw : fallback.yaw,
      pitch: clamp(
        Number.isFinite(saved.pitch) ? saved.pitch : fallback.pitch,
        -.86,
        .86
      ),
      spread: clamp(
        Number.isFinite(saved.spread) ? saved.spread : fallback.spread,
        MIN_SCENE_SPREAD,
        MAX_SCENE_SPREAD
      ),
      panX: Number.isFinite(saved.panX) ? saved.panX : fallback.panX,
      panY: Number.isFinite(saved.panY) ? saved.panY : fallback.panY
    };
  } catch (error) {
    console.warn("RozloÅ¾enÃ­ scÃ©ny bylo obnoveno.", error);
    return fallback;
  }
}

function saveScene() {
  localStorage.setItem(
    SCENE_KEY,
    JSON.stringify({
      yaw: normaliseAngle(scene.yaw),
      pitch: scene.pitch,
      spread: scene.spread,
      panX: scene.panX,
      panY: scene.panY
    })
  );
}

function saveMemory(reason = "save") {
  memory.updatedAt = new Date().toISOString();

  localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  updatePills();

  window.dispatchEvent(
    new CustomEvent("cht.memory.changed", {
      detail: {
        reason,
        coreId: selectedCore?.id || null,
        slotId: selectedSlotIndex === null ? null : selectedSlotIndex + 1,
        updatedAt: memory.updatedAt
      }
    })
  );
}

function byteSize(text) {
  return new Blob([text]).size;
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function updatePills() {
  for (const core of cores) {
    const pill = document.getElementById(`pill-${core.id}`);

    if (!pill) {
      continue;
    }

    const stats = getCoreStats(core.id);
    pill.textContent = `${core.title.toUpperCase()} Â· ${stats.used}/70`;
  }
}

function getCoreStats(coreId) {
  const slots = memory.cores[coreId];
  const used = slots.filter((slot) => {
    return slot.content.trim() || slot.name.trim() !== `Slot ${slot.id}`;
  }).length;

  const size = byteSize(JSON.stringify(slots));
  return { used, size };
}

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();

  if (!bounds.width || !bounds.height) {
    return;
  }

  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = bounds.width;
  height = bounds.height;

  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function getLandscapeLayout() {
  const isLandscape = width >= height;

  return {
    centerX: width * .5,
    centerY: height * (isLandscape ? .53 : .5),
    orbitX: isLandscape
      ? Math.min(width * .30, height * .66)
      : Math.min(width * .26, height * .40),
    orbitY: isLandscape
      ? Math.min(height * .18, width * .09)
      : Math.min(height * .27, width * .16)
  };
}

function getSceneAnchor() {
  const baseDistance = 126;

  return {
    baseDistance,
    left: Math.max(
      86,
      Math.min(width * .10, width - baseDistance - 70)
    ),
    top: Math.max(
      92,
      Math.min(height * .22, height - baseDistance - 70)
    )
  };
}

function getMaxSceneSpread() {
  if (!width || !height) {
    return MAX_SCENE_SPREAD;
  }

  const anchor = getSceneAnchor();

  return Math.max(
    MIN_SCENE_SPREAD,
    Math.min(
      MAX_SCENE_SPREAD,
      (width - anchor.left - 70) / anchor.baseDistance,
      (height - anchor.top - 70) / anchor.baseDistance
    )
  );
}

function constrainScene() {
  if (!width || !height) {
    return;
  }

  const anchor = getSceneAnchor();

  scene.spread = clamp(
    scene.spread,
    MIN_SCENE_SPREAD,
    getMaxSceneSpread()
  );

  const distance = anchor.baseDistance * scene.spread;
  const minPanX = 70 - anchor.left;
  const maxPanX = width - 70 - (anchor.left + distance);
  const minPanY = 70 - anchor.top;
  const maxPanY = height - 70 - (anchor.top + distance);

  scene.panX = minPanX <= maxPanX
    ? clamp(scene.panX, minPanX, maxPanX)
    : (minPanX + maxPanX) / 2;

  scene.panY = minPanY <= maxPanY
    ? clamp(scene.panY, minPanY, maxPanY)
    : (minPanY + maxPanY) / 2;
}

function getCorePosition(core) {
  const rozlozeni = {
    earth:    { sloupec: 0, radek: 0 },
    language: { sloupec: 1, radek: 0 },
    game:     { sloupec: 0, radek: 1 },
    control:  { sloupec: 1, radek: 1 }
  };

  const misto = rozlozeni[core.id];
  const anchor = getSceneAnchor();
  const distance = anchor.baseDistance * scene.spread;

  const horizontalDepth =
    (misto.sloupec === 0 ? -1 : 1) *
    Math.sin(scene.yaw) *
    .12;

  const verticalDepth =
    (misto.radek === 0 ? -1 : 1) *
    Math.sin(scene.pitch) *
    .09;

  return {
    x: anchor.left + scene.panX + misto.sloupec * distance,
    y: anchor.top + scene.panY + misto.radek * distance,
    depth: clamp(.68 + horizontalDepth + verticalDepth, .46, .88)
  };
}

function drawBackground() {
  const layout = getLandscapeLayout();

  const glow = context.createRadialGradient(
    layout.centerX,
    layout.centerY,
    10,
    layout.centerX,
    layout.centerY,
    Math.max(width, height) * .54
  );

  glow.addColorStop(0, "rgba(255,220,155,.10)");
  glow.addColorStop(.42, "rgba(199,155,51,.035)");
  glow.addColorStop(1, "rgba(0,0,0,0)");

  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  context.save();
  context.globalAlpha = .22;
  context.fillStyle = "#ffe2ad";

  for (let index = 0; index < 70; index += 1) {
    const x = (index * 83.71) % width;
    const y = (index * 47.29) % height;
    const size = index % 7 === 0 ? 1.3 : .55;

    context.beginPath();
    context.arc(x, y, size, 0, Math.PI * 2);
    context.fill();
  }

  context.restore();
}

function drawTerraAxis(time) {
  const layout = getLandscapeLayout();
  const left = width * .08;
  const right = width * .92;
  const wave = Math.sin(time * .0012) * 4;

  const gradient = context.createLinearGradient(
    left,
    layout.centerY,
    right,
    layout.centerY
  );

  gradient.addColorStop(0, "rgba(255,220,160,0)");
  gradient.addColorStop(.18, "rgba(255,220,160,.18)");
  gradient.addColorStop(.5, "rgba(255,238,195,.48)");
  gradient.addColorStop(.82, "rgba(255,220,160,.18)");
  gradient.addColorStop(1, "rgba(255,220,160,0)");

  context.save();
  context.strokeStyle = gradient;
  context.lineWidth = 1;

  context.beginPath();
  context.moveTo(left, layout.centerY + wave);
  context.bezierCurveTo(
    width * .30,
    layout.centerY - 12,
    width * .70,
    layout.centerY + 12,
    right,
    layout.centerY - wave
  );
  context.stroke();

  context.setLineDash([3, 9]);
  context.globalAlpha = .38;
  context.beginPath();
  context.moveTo(left, layout.centerY);
  context.lineTo(right, layout.centerY);
  context.stroke();

  context.restore();
}

function drawCore(core, time) {
  const position = getCorePosition(core);
  const scale = .72 + position.depth * .40;
  const radius = core.radius * scale;
  const active = selectedCore && selectedCore.id === core.id;

  context.save();
  context.globalAlpha = .48 + position.depth * .52;

  const glow = context.createRadialGradient(
    position.x,
    position.y,
    2,
    position.x,
    position.y,
    radius * 1.45
  );

  glow.addColorStop(
    0,
    active
      ? "rgba(255,245,215,.95)"
      : "rgba(255,225,175,.74)"
  );

  glow.addColorStop(
    .24,
    active
      ? "rgba(255,185,95,.52)"
      : "rgba(255,185,95,.25)"
  );

  glow.addColorStop(1, "rgba(255,185,95,0)");

  context.fillStyle = glow;
  context.beginPath();
  context.arc(position.x, position.y, radius * 1.45, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = active
    ? "rgba(255,240,205,.94)"
    : "rgba(255,220,160,.54)";

  context.lineWidth = active ? 1.8 : 1;
  context.beginPath();
  context.arc(position.x, position.y, radius, 0, Math.PI * 2);
  context.stroke();

  const surfaceSpin = scene.yaw + core.angle * .18;
  const surfaceTilt = scene.pitch * .72;

  context.save();
  context.translate(position.x, position.y);
  context.rotate(surfaceTilt);

  for (let ring = 1; ring < 5; ring += 1) {
    context.beginPath();
    context.ellipse(
      0,
      0,
      radius,
      radius * ring / 5,
      0,
      0,
      Math.PI * 2
    );

    context.strokeStyle = "rgba(255,220,160," +
      (active ? .30 : .17) +
      ")";

    context.lineWidth = .7;
    context.stroke();
  }

  for (let line = 0; line < 8; line += 1) {
    const phase = line / 8 * Math.PI + surfaceSpin;
    const longitudeRadius = Math.max(
      radius * .12,
      Math.abs(Math.cos(phase)) * radius
    );

    context.beginPath();
    context.ellipse(
      0,
      0,
      longitudeRadius,
      radius,
      0,
      0,
      Math.PI * 2
    );

    context.strokeStyle = "rgba(255,220,160," +
      (active ? .25 : .13) +
      ")";

    context.lineWidth = .7;
    context.stroke();
  }

  context.restore();

  const signalAngle = surfaceSpin;
  const signalX = position.x + Math.cos(signalAngle) * radius * .78;
  const signalY = position.y + Math.sin(signalAngle) * radius * .52;

  context.fillStyle = active
    ? "rgba(255,248,220,.96)"
    : "rgba(255,225,175,.72)";

  context.beginPath();
  context.arc(signalX, signalY, active ? 2 : 1.35, 0, Math.PI * 2);
  context.fill();

  const pulse = radius + 7 + Math.sin(time * .003 + core.angle) * 3;

  context.beginPath();
  context.arc(position.x, position.y, pulse, 0, Math.PI * 2);
  context.strokeStyle = active
    ? "rgba(255,235,195,.34)"
    : "rgba(255,220,160,.10)";
  context.stroke();

  context.fillStyle = "#fff0cf";
  context.font = "800 " + Math.round(11 * scale) + "px system-ui";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(core.title, position.x, position.y - 4);

  const stats = getCoreStats(core.id);

  context.fillStyle = "rgba(255,240,210,.65)";
  context.font = Math.max(8, Math.round(9 * scale)) + "px system-ui";
  context.fillText(stats.used + "/70", position.x, position.y + 12);

  context.restore();

  core.position = position;
  core.drawRadius = radius;
}

function render(time) {
  const elapsed = lastFrameTime
    ? Math.min(time - lastFrameTime, 48)
    : 16;

  lastFrameTime = time;

  if (activePointers.size === 0) {
    scene.yaw = normaliseAngle(scene.yaw + elapsed * .000035);
  }

  context.clearRect(0, 0, width, height);

  drawBackground();
  drawTerraAxis(time);

  const ordered = [...cores].sort((first, second) => {
    return getCorePosition(first).depth - getCorePosition(second).depth;
  });

  for (const core of ordered) {
    drawCore(core, time);
  }

  requestAnimationFrame(render);
}

function findCoreAt(x, y) {
  return [...cores]
    .sort((first, second) => {
      return getCorePosition(second).depth - getCorePosition(first).depth;
    })
    .find((core) => {
      if (!core.position) {
        return false;
      }

      return Math.hypot(
        x - core.position.x,
        y - core.position.y
      ) <= core.drawRadius + 16;
    });
}

function openCore(core) {
  selectedCore = core;
  selectedSlotIndex = null;

  panelTitle.textContent = `${core.title} Â· PamÄÅ¥`;
  panelSub.textContent = "70 slotÅ¯ Â· samostatnÃ© uloÅ¾enÃ­";

  panel.classList.add("open");
  slotEditor.classList.remove("open");
  searchInput.value = "";

  renderSlots();
  updateStatus();
}

function renderSlots() {
  if (!selectedCore) {
    return;
  }

  const query = searchInput.value.trim().toLowerCase();
  const slots = memory.cores[selectedCore.id];

  slotGrid.innerHTML = "";

  slots.forEach((slot, index) => {
    const searchable = `${slot.name} ${slot.content}`.toLowerCase();

    if (query && !searchable.includes(query)) {
      return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "slotBtn";

    const used = slot.content.trim() ||
      slot.name.trim() !== `Slot ${slot.id}`;

    if (used) {
      button.classList.add("obsazeny");
    }

    if (index === selectedSlotIndex) {
      button.classList.add("aktivni");
    }

    button.innerHTML = `
      <strong>${escapeHtml(slot.name || `Slot ${slot.id}`)}</strong>
      <span>${slot.content.trim() ? "obsazeno" : "prÃ¡zdnÃ©"}</span>
    `;

    button.addEventListener("click", () => selectSlot(index));
    slotGrid.appendChild(button);
  });
}

function selectSlot(index) {
  selectedSlotIndex = index;

  const slot = memory.cores[selectedCore.id][index];

  slotName.value = slot.name;
  slotContent.value = slot.content;

  slotEditor.classList.add("open");

  renderSlots();
  updateStatus();
}

function updateStatus(message = "") {
  if (!selectedCore) {
    statusBox.textContent = "Vyber jÃ¡dro.";
    return;
  }

  const stats = getCoreStats(selectedCore.id);

  let text =
    `${selectedCore.title}: obsazeno ${stats.used}/70 Â· ` +
    `velikost ${formatBytes(stats.size)}`;

  if (selectedSlotIndex !== null) {
    text += ` Â· otevÅen slot ${selectedSlotIndex + 1}`;
  }

  if (message) {
    text += ` Â· ${message}`;
  }

  statusBox.textContent = text;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (character) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;"
    }[character];
  });
}

function downloadJson(data, filename) {
  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

saveSlot.addEventListener("click", () => {
  if (!selectedCore || selectedSlotIndex === null) {
    return;
  }

  const slot = memory.cores[selectedCore.id][selectedSlotIndex];

  slot.name =
    slotName.value.trim() ||
    `Slot ${selectedSlotIndex + 1}`;

  slot.content = slotContent.value;
  slot.updatedAt = new Date().toISOString();

  saveMemory();
  renderSlots();
  updateStatus("uloÅ¾eno");
});

clearSlot.addEventListener("click", () => {
  if (!selectedCore || selectedSlotIndex === null) {
    return;
  }

  if (!confirm(`Vymazat slot ${selectedSlotIndex + 1}?`)) {
    return;
  }

  memory.cores[selectedCore.id][selectedSlotIndex] =
    createEmptySlot(selectedSlotIndex);

  saveMemory();

  slotName.value = `Slot ${selectedSlotIndex + 1}`;
  slotContent.value = "";

  renderSlots();
  updateStatus("vymazÃ¡no");
});

searchInput.addEventListener("input", renderSlots);

closePanel.addEventListener("click", () => {
  panel.classList.remove("open");
});

exportCore.addEventListener("click", () => {
  if (!selectedCore) {
    return;
  }

  downloadJson({
    typ: "jadro-pameti",
    jadro: selectedCore.id,
    nazev: selectedCore.title,
    sloty: memory.cores[selectedCore.id],
    exportovano: new Date().toISOString()
  }, `pamet_${selectedCore.id}.json`);
});

importCore.addEventListener("click", () => {
  if (!selectedCore) {
    return;
  }

  importMode = "core";
  fileInput.value = "";
  fileInput.click();
});

exportAll.addEventListener("click", () => {
  downloadJson(memory, "vaft_pamet_cela.json");
});

importAll.addEventListener("click", () => {
  importMode = "all";
  fileInput.value = "";
  fileInput.click();
});

fileInput.addEventListener("change", async () => {
  const file = fileInput.files && fileInput.files[0];

  if (!file) {
    return;
  }

  try {
    const data = JSON.parse(await file.text());

    if (importMode === "core") {
      if (!selectedCore) {
        throw new Error("NenÃ­ vybranÃ© jÃ¡dro");
      }

      const slots = Array.isArray(data.sloty)
        ? data.sloty
        : data;

      if (!Array.isArray(slots)) {
        throw new Error("Soubor neobsahuje sloty");
      }

      memory.cores[selectedCore.id] = Array.from(
        { length: SLOT_COUNT },
        (_, index) => {
          const source = slots[index] || {};

          return {
            id: index + 1,
            name:
              typeof source.name === "string" && source.name.trim()
                ? source.name
                : `Slot ${index + 1}`,
            content:
              typeof source.content === "string"
                ? source.content
                : "",
            updatedAt: source.updatedAt || null
          };
        }
      );

      saveMemory();
      renderSlots();
      updateStatus("jÃ¡dro importovÃ¡no");
    } else {
      if (!data.cores) {
        throw new Error("Soubor neobsahuje celou PamÄÅ¥");
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      memory = loadMemory();

      saveMemory();
      renderSlots();
      updateStatus("celÃ¡ PamÄÅ¥ importovÃ¡na");
    }
  } catch (error) {
    alert(`Import se nezdaÅil: ${error.message}`);
  }
});

function getActivePointerList() {
  return Array.from(activePointers.values());
}

function getPointerDistance(first, second) {
  return Math.hypot(
    second.x - first.x,
    second.y - first.y
  );
}

function getPointerCenter(first, second) {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2
  };
}

function beginRotationGesture(pointer) {
  gesture = {
    type: "rotate",
    moved: false,
    pointerId: pointer.id
  };
}

function beginTransformGesture() {
  const [first, second] = getActivePointerList();

  if (!first || !second) {
    return;
  }

  gesture = {
    type: "transform",
    moved: false,
    distance: getPointerDistance(first, second),
    center: getPointerCenter(first, second)
  };
}

function finishPointerGesture(event, cancelled) {
  const isTap =
    !cancelled &&
    activePointers.size === 1 &&
    gesture &&
    gesture.type === "rotate" &&
    !gesture.moved;

  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }

  activePointers.delete(event.pointerId);

  if (isTap) {
    const bounds = canvas.getBoundingClientRect();
    const core = findCoreAt(
      event.clientX - bounds.left,
      event.clientY - bounds.top
    );

    if (core) {
      openCore(core);
    }
  }

  if (activePointers.size === 0) {
    saveScene();
    gesture = null;
    return;
  }

  if (activePointers.size === 1) {
    beginRotationGesture(getActivePointerList()[0]);
    return;
  }

  beginTransformGesture();
}

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();

  const pointer = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY
  };

  activePointers.set(event.pointerId, pointer);
  canvas.setPointerCapture(event.pointerId);

  if (activePointers.size === 1) {
    beginRotationGesture(pointer);
  } else if (activePointers.size === 2) {
    beginTransformGesture();
  }
});

canvas.addEventListener("pointermove", (event) => {
  const pointer = activePointers.get(event.pointerId);

  if (!pointer) {
    return;
  }

  event.preventDefault();

  const previousX = pointer.x;
  const previousY = pointer.y;

  pointer.x = event.clientX;
  pointer.y = event.clientY;

  const deltaX = pointer.x - previousX;
  const deltaY = pointer.y - previousY;

  if (activePointers.size === 1 && gesture?.type === "rotate") {
    if (Math.abs(deltaX) > .5 || Math.abs(deltaY) > .5) {
      gesture.moved = true;
      scene.yaw = normaliseAngle(scene.yaw + deltaX * .012);
      scene.pitch = clamp(scene.pitch + deltaY * .010, -.86, .86);
    }

    return;
  }

  if (activePointers.size < 2) {
    return;
  }

  if (!gesture || gesture.type !== "transform") {
    beginTransformGesture();
  }

  const [first, second] = getActivePointerList();
  const distance = getPointerDistance(first, second);
  const center = getPointerCenter(first, second);

  if (gesture.distance > 0 && distance > 0) {
    scene.spread = clamp(
      scene.spread * distance / gesture.distance,
      MIN_SCENE_SPREAD,
      getMaxSceneSpread()
    );
  }

  const moveX = center.x - gesture.center.x;
  const moveY = center.y - gesture.center.y;

  scene.panX += moveX;
  scene.panY += moveY;

  if (
    Math.abs(moveX) > .5 ||
    Math.abs(moveY) > .5 ||
    Math.abs(distance - gesture.distance) > .5
  ) {
    gesture.moved = true;
  }

  constrainScene();

  gesture.distance = distance;
  gesture.center = center;
});

canvas.addEventListener("pointerup", (event) => {
  finishPointerGesture(event, false);
});

canvas.addEventListener("pointercancel", (event) => {
  finishPointerGesture(event, true);
});

window.addEventListener("resize", () => {
  resizeCanvas();
  constrainScene();
});

resizeCanvas();
constrainScene();
updatePills();
requestAnimationFrame(render);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        "./service-worker.js",
        { updateViaCache: "none" }
      );

      await registration.update();

      if (registration.waiting) {
        registration.waiting.postMessage({
          type: "SKIP_WAITING"
        });
      }

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;

        if (!newWorker) {
          return;
        }

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            newWorker.postMessage({
              type: "SKIP_WAITING"
            });
          }
        });
      });

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        const reloadKey = "cht360_worker_reloaded";

        if (sessionStorage.getItem(reloadKey)) {
          return;
        }

        sessionStorage.setItem(reloadKey, "1");
        window.location.reload();
      });

      window.setTimeout(() => {
        sessionStorage.removeItem("cht360_worker_reloaded");
      }, 5000);
    } catch (error) {
      console.warn(
        "[360Â°â°.] Service worker se nepodaÅilo spustit.",
        error
      );
    }
  });
}