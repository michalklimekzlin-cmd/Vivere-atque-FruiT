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
  {
    id: "earth",
    title: "Země",
    subtitle: "Modeling, světy a úhel pohledu",
    radius: 50
  },
  {
    id: "language",
    title: "Jazyk",
    subtitle: "Písmena, symboly, glyphy a význam",
    radius: 50
  },
  {
    id: "game",
    title: "Hra",
    subtitle: "Pravidla, události a postup",
    radius: 50
  },
  {
    id: "control",
    title: "Řízení",
    subtitle: "Směrování, jednotky a propojení",
    radius: 50
  }
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
      throw new Error("Neplatná struktura");
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
    console.warn("Paměť byla obnovena do výchozího stavu.", error);
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
    roll: 0,
    zoom: 1,
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
        -.45,
        .45
      ),
      roll: Number.isFinite(saved.roll) ? saved.roll : fallback.roll,
      zoom: clamp(
        Number.isFinite(saved.zoom)
          ? saved.zoom
          : (
            Number.isFinite(saved.spread)
              ? saved.spread
              : fallback.zoom
          ),
        .92,
        2
      ),
      panX: Number.isFinite(saved.panX) ? saved.panX : fallback.panX,
      panY: Number.isFinite(saved.panY) ? saved.panY : fallback.panY
    };
  } catch (error) {
    console.warn("Rozložení scény bylo obnoveno.", error);
    return fallback;
  }
}

function saveScene() {
  localStorage.setItem(
    SCENE_KEY,
    JSON.stringify({
      yaw: normaliseAngle(scene.yaw),
      pitch: scene.pitch,
      roll: normaliseAngle(scene.roll),
      zoom: scene.zoom,
      spread: scene.zoom,
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
    pill.textContent = `${core.title.toUpperCase()} · ${stats.used}/70`;
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
  const baseDistance = 124;
  const baseRadius = baseDistance * Math.SQRT1_2 + 12;

  return {
    baseDistance,
    baseRadius,
    centerX: Math.max(
      baseRadius + 68,
      Math.min(width * .18, width - baseRadius - 68)
    ),
    centerY: Math.max(
      baseRadius + 78,
      Math.min(height * .35, height - baseRadius - 68)
    )
  };
}

function getMaxSceneZoom() {
  if (!width || !height) {
    return 2;
  }

  const anchor = getSceneAnchor();
  const centerX = anchor.centerX + scene.panX;
  const centerY = anchor.centerY + scene.panY;

  const availableX = Math.min(
    centerX - 68,
    width - centerX - 68
  );

  const availableY = Math.min(
    centerY - 68,
    height - centerY - 68
  );

  return Math.max(
    .92,
    Math.min(
      2,
      availableX / anchor.baseRadius,
      availableY / anchor.baseRadius
    )
  );
}

function constrainScene() {
  if (!width || !height) {
    return;
  }

  const anchor = getSceneAnchor();

  scene.zoom = clamp(
    scene.zoom,
    .92,
    getMaxSceneZoom()
  );

  const groupRadius =
    anchor.baseRadius * scene.zoom * 1.16 +
    64;

  const minPanX = groupRadius - anchor.centerX;
  const maxPanX = width - groupRadius - anchor.centerX;
  const minPanY = groupRadius - anchor.centerY;
  const maxPanY = height - groupRadius - anchor.centerY;

  scene.panX = minPanX <= maxPanX
    ? clamp(scene.panX, minPanX, maxPanX)
    : (minPanX + maxPanX) / 2;

  scene.panY = minPanY <= maxPanY
    ? clamp(scene.panY, minPanY, maxPanY)
    : (minPanY + maxPanY) / 2;
}

function getCorePosition(core) {
  const rozlozeni = {
    earth: { sloupec: 0, radek: 0 },
    language: { sloupec: 1, radek: 0 },
    game: { sloupec: 0, radek: 1 },
    control: { sloupec: 1, radek: 1 }
  };

  const misto = rozlozeni[core.id];
  const anchor = getSceneAnchor();
  const distance = anchor.baseDistance * scene.zoom;
  const localX = (misto.sloupec - .5) * distance;
  const localY = (misto.radek - .5) * distance;

  const yawCos = Math.cos(scene.yaw);
  const yawSin = Math.sin(scene.yaw);
  const planeX = localX * yawCos - localY * yawSin;
  const planeY = localX * yawSin + localY * yawCos;

  const tiltedY = planeY * Math.cos(scene.pitch);
  const depthZ = planeY * Math.sin(scene.pitch);

  const rollCos = Math.cos(scene.roll);
  const rollSin = Math.sin(scene.roll);
  const rotatedX = planeX * rollCos - tiltedY * rollSin;
  const rotatedY = planeX * rollSin + tiltedY * rollCos;

  const perspective = clamp(
    1 + depthZ / 480,
    .78,
    1.24
  );

  return {
    x: anchor.centerX + scene.panX + rotatedX * perspective,
    y: anchor.centerY + scene.panY + rotatedY * perspective,
    depth: clamp(
      .68 + depthZ / (distance || 1) * .18,
      .48,
      .86
    ),
    perspective
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
  const centerX = width * .91;
  const centerY = height * .50;
  const outerX = width * .78;
  const outerY = height * .70;
  const startAngle = Math.PI * .50;
  const endAngle = Math.PI * 1.50;

  context.save();

  const glow = context.createRadialGradient(
    width * .42,
    height * .50,
    18,
    width * .50,
    height * .50,
    Math.max(width, height) * .68
  );

  glow.addColorStop(0, "rgba(255,220,155,.055)");
  glow.addColorStop(.55, "rgba(199,155,51,.018)");
  glow.addColorStop(1, "rgba(0,0,0,0)");

  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  for (let ring = 0; ring < 5; ring += 1) {
    const inset = ring * .105;

    context.beginPath();
    context.ellipse(
      centerX - ring * 6,
      centerY,
      outerX * (1 - inset),
      outerY * (1 - inset),
      0,
      startAngle,
      endAngle
    );

    context.strokeStyle = "rgba(255,220,160," +
      (.16 - ring * .022) +
      ")";

    context.lineWidth = ring === 0 ? 1.2 : .7;
    context.stroke();
  }

  context.setLineDash([3, 11]);
  context.globalAlpha = .28;

  for (let curve = 1; curve <= 3; curve += 1) {
    const amount = curve / 4;
    const bendX = centerX - outerX * amount;

    context.beginPath();
    context.moveTo(centerX, centerY - outerY + 14);
    context.quadraticCurveTo(
      bendX - outerX * .14,
      centerY,
      centerX,
      centerY + outerY - 14
    );

    context.strokeStyle = "rgba(255,220,160,.10)";
    context.lineWidth = .65;
    context.stroke();
  }

  context.setLineDash([]);

  const sweep =
    startAngle +
    (Math.sin(time * .00012) + 1) * Math.PI / 2;

  context.globalAlpha = .72;
  context.fillStyle = "#ffe2ad";
  context.beginPath();
  context.arc(
    centerX + Math.cos(sweep) * outerX,
    centerY + Math.sin(sweep) * outerY,
    1.6,
    0,
    Math.PI * 2
  );
  context.fill();

  context.restore();
}

function drawCore(core, time) {
  const position = getCorePosition(core);
  const scale =
    (.72 + position.depth * .40) *
    position.perspective;

  const radius = core.radius * scale;
  const active = selectedCore && selectedCore.id === core.id;

  context.save();
  context.globalAlpha = .58 + position.depth * .36;

  const glow = context.createRadialGradient(
    position.x,
    position.y,
    2,
    position.x,
    position.y,
    radius * 1.52
  );

  glow.addColorStop(
    0,
    active
      ? "rgba(255,247,220,.98)"
      : "rgba(255,226,176,.76)"
  );

  glow.addColorStop(
    .26,
    active
      ? "rgba(255,185,95,.54)"
      : "rgba(255,185,95,.28)"
  );

  glow.addColorStop(1, "rgba(255,185,95,0)");

  context.fillStyle = glow;
  context.beginPath();
  context.arc(position.x, position.y, radius * 1.52, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = active
    ? "rgba(255,246,214,.98)"
    : "rgba(255,224,170,.72)";

  context.lineWidth = active ? 2 : 1.3;
  context.beginPath();
  context.arc(position.x, position.y, radius, 0, Math.PI * 2);
  context.stroke();

  const surfaceSpin = scene.yaw + scene.roll * .30;
  const surfaceTilt = scene.pitch * .58;

  context.save();
  context.translate(position.x, position.y);
  context.rotate(surfaceTilt);

  for (let latitude = -3; latitude <= 3; latitude += 1) {
    const ratio = latitude / 4;
    const y = ratio * radius;
    const horizontalRadius =
      Math.sqrt(Math.max(0, 1 - ratio * ratio)) *
      radius;

    const verticalRadius = Math.max(
      2,
      horizontalRadius * .15
    );

    context.beginPath();
    context.ellipse(
      0,
      y,
      horizontalRadius,
      verticalRadius,
      0,
      0,
      Math.PI * 2
    );

    context.strokeStyle = active
      ? "rgba(255,241,202,.56)"
      : "rgba(255,222,164,.34)";

    context.lineWidth = active ? 1 : .8;
    context.stroke();
  }

  for (let longitude = 0; longitude < 9; longitude += 1) {
    const phase =
      longitude / 9 * Math.PI +
      surfaceSpin;

    const longitudeRadius = Math.max(
      radius * .075,
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

    context.strokeStyle = active
      ? "rgba(255,242,205,.54)"
      : "rgba(255,222,164,.32)";

    context.lineWidth = active ? 1 : .78;
    context.stroke();
  }

  context.restore();

  const signalX =
    position.x +
    Math.cos(surfaceSpin) * radius * .78;

  const signalY =
    position.y +
    Math.sin(surfaceSpin) * radius * .52;

  context.fillStyle = active
    ? "rgba(255,250,226,.98)"
    : "rgba(255,231,182,.84)";

  context.beginPath();
  context.arc(
    signalX,
    signalY,
    active ? 2.2 : 1.55,
    0,
    Math.PI * 2
  );
  context.fill();

  const pulse =
    radius +
    7 +
    Math.sin(time * .003) * 3;

  context.beginPath();
  context.arc(position.x, position.y, pulse, 0, Math.PI * 2);
  context.strokeStyle = active
    ? "rgba(255,235,195,.38)"
    : "rgba(255,220,160,.14)";
  context.lineWidth = 1;
  context.stroke();

  context.fillStyle = "#fff0cf";
  context.font = "800 " + Math.round(11 * scale) + "px system-ui";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(core.title, position.x, position.y - 4);

  const stats = getCoreStats(core.id);

  context.fillStyle = "rgba(255,240,210,.74)";
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
    scene.yaw = normaliseAngle(
      scene.yaw + elapsed * .000042
    );
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

  panelTitle.textContent = `${core.title} · Paměť`;
  panelSub.textContent = "70 slotů · samostatné uložení";

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
      <span>${slot.content.trim() ? "obsazeno" : "prázdné"}</span>
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
    statusBox.textContent = "Vyber jádro.";
    return;
  }

  const stats = getCoreStats(selectedCore.id);

  let text =
    `${selectedCore.title}: obsazeno ${stats.used}/70 · ` +
    `velikost ${formatBytes(stats.size)}`;

  if (selectedSlotIndex !== null) {
    text += ` · otevřen slot ${selectedSlotIndex + 1}`;
  }

  if (message) {
    text += ` · ${message}`;
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
  updateStatus("uloženo");
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
  updateStatus("vymazáno");
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
        throw new Error("Není vybrané jádro");
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
      updateStatus("jádro importováno");
    } else {
      if (!data.cores) {
        throw new Error("Soubor neobsahuje celou Paměť");
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      memory = loadMemory();

      saveMemory();
      renderSlots();
      updateStatus("celá Paměť importována");
    }
  } catch (error) {
    alert(`Import se nezdařil: ${error.message}`);
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

function getPointerAngle(first, second) {
  return Math.atan2(
    second.y - first.y,
    second.x - first.x
  );
}

function updateGestureHint() {
  const hints = document.querySelectorAll(".hud span");

  if (hints.length >= 3) {
    hints[0].textContent = "1 prst: 3D otočení";
    hints[1].textContent = "2 prsty: posun · zoom · šejdr";
    hints[2].textContent = "klepnutí: otevřít jádro";
  }
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
    center: getPointerCenter(first, second),
    angle: getPointerAngle(first, second)
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

      scene.yaw = normaliseAngle(
        scene.yaw + deltaX * .012
      );

      scene.pitch = clamp(
        scene.pitch + deltaY * .006,
        -.45,
        .45
      );
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
  const angle = getPointerAngle(first, second);

  if (gesture.distance > 0 && distance > 0) {
    scene.zoom = clamp(
      scene.zoom * distance / gesture.distance,
      .92,
      getMaxSceneZoom()
    );
  }

  const moveX = center.x - gesture.center.x;
  const moveY = center.y - gesture.center.y;
  const turn = normaliseAngle(angle - gesture.angle);

  scene.panX += moveX;
  scene.panY += moveY;
  scene.roll = normaliseAngle(scene.roll + turn);

  if (
    Math.abs(moveX) > .5 ||
    Math.abs(moveY) > .5 ||
    Math.abs(distance - gesture.distance) > .5 ||
    Math.abs(turn) > .004
  ) {
    gesture.moved = true;
  }

  constrainScene();

  gesture.distance = distance;
  gesture.center = center;
  gesture.angle = angle;
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
updateGestureHint();
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
        "[360°‰.] Service worker se nepodařilo spustit.",
        error
      );
    }
  });
}