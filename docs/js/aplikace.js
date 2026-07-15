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
const glyphDrumsElement = document.getElementById("glyphDrums");
const glyphAddDrum = document.getElementById("glyphAddDrum");
const glyphInsert = document.getElementById("glyphInsert");
const glyphReset = document.getElementById("glyphReset");
const glyphCustom = document.getElementById("glyphCustom");
const glyphAddToken = document.getElementById("glyphAddToken");

const STORAGE_KEY = "cht360_pamet_v1";
const LEGACY_STORAGE_KEYS = ["vaft_pamet_v1"];
const MEMORY_SNAPSHOT_KEY = "cht360_pamet_snapshots_v1";
const CHYBOZROUT_BACKUP_KEY = "cht360_samoopravovna_backup_v1";
const LEGACY_SLOT_PREFIX = "VaFiT_SLOT_";
const SLOT_COUNT = 70;
const SCENE_KEY = "vaft_pamet_scene_v2";
const MIN_SCENE_SPREAD = .96;
const MAX_SCENE_SPREAD = 2.8;

const TROJKA_MODEL_STORAGE_KEY = "cht360_trojka_models_v1";

const GLYPH_DRUM_STORAGE_KEY = "cht360_glyph_drums_v1";
const GLYPH_DRUM_CUSTOM_STORAGE_KEY = "cht360_glyph_drums_custom_v1";

const GLYPH_DRUM_TOKENS = Object.freeze([
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  ..."0123456789",
  "Ã", "Ä", "Ä", "Ã", "Ä", "Ã", "Å", "Ã", "Å", "Å ", "Å¤", "Ã", "Å®", "Ã",
  "ã¢", "Â°", "â°", "â¢", "_", "-", "/", "\`", "Â´", "Ë", "Ä«", "Ä±",
  "Ã¯", "Ã¸", "Å", "Ã", "Â¯", "&", "(", ")", "*", "}", "{", "â¹",
  "7i_", "Ä«Â´", "ËÂ°iÂ°Ë", "._;Â´/`", ",!", "Ã¯Ã¸", "Â°ÅÂ°", ".â¢cUâ¢.",
  "-:x:-", "7/Â¯", "Ä±>o", "Â°&", "(\\*/)", "Ão", "}{", "â¢N", "7â¹"
]);

const CORE_CIPHER_TOKENS = Object.freeze([
  ..."0123456789",
  "7", "i", "_", "Ä«", "Â´", "Ë", "Â°", ".", ";", "/", "\`", ",", "!",
  "Ã¯", "Ã¸", "Å", "â¢", "c", "U", "-", ":", "x", "Â¯", "Ä±", ">", "o",
  "&", "(", ")", "*", "Ã", "}", "{", "N", "â¹", "ã¢"
]);

const TROJKA_PROFILE = [
  { id: "leva-hrana", label: "LevÃ¡ hrana", x: -1.28, z: .76, depth: 1 },
  { id: "levy-propad", label: "LevÃ½ propad", x: -.64, z: -.58, depth: .2 },
  { id: "stred", label: "StÅed", x: 0, z: .76, depth: 1 },
  { id: "pravy-propad", label: "PravÃ½ propad", x: .64, z: -.58, depth: .2 },
  { id: "prava-hrana", label: "PravÃ¡ hrana", x: 1.28, z: .76, depth: 1 }
];

const TROJKA_RAILS = [
  { id: "horni-kolej", label: "HornÃ­ kolej", y: -.47 },
  { id: "dolni-kolej", label: "DolnÃ­ kolej", y: .47 }
];

let trojkaModels = loadTrojkaModels();
let customGlyphTokens = loadCustomGlyphTokens();
let glyphDrumValues = loadGlyphDrumValues();
let slotAutosaveTimer = null;

const cores = [
  {
    id: "earth",
    title: "ZemÄ",
    subtitle: "Modeling, svÄty a Ãºhel pohledu",
    radius: 50
  },
  {
    id: "language",
    title: "Jazyk",
    subtitle: "PÃ­smena, symboly, glyphy a vÃ½znam",
    radius: 50
  },
  {
    id: "game",
    title: "Hra",
    subtitle: "Pravidla, udÃ¡losti a postup",
    radius: 50
  },
  {
    id: "control",
    title: "ÅÃ­zenÃ­",
    subtitle: "SmÄrovÃ¡nÃ­, jednotky a propojenÃ­",
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
  return Array.from(
    { length: SLOT_COUNT },
    (_, index) => createEmptySlot(index)
  );
}

function createEmptyMemory() {
  return {
    version: 2,
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

function normaliseSlot(source, index) {
  const fallback = createEmptySlot(index);
  const value = source && typeof source === "object" ? source : {};
  const customName = typeof value.name === "string" && value.name.trim()
    ? value.name.trim()
    : (
      typeof value.label === "string" && value.label.trim()
        ? value.label.trim()
        : fallback.name
    );

  let content = typeof value.content === "string" ? value.content : "";

  if (!content && typeof value.url === "string" && value.url.trim()) {
    content = JSON.stringify({
      url: value.url,
      app: value.app || "",
      icon: value.icon || "",
      color: value.color || "",
      action: value.action || "open"
    }, null, 2);
  }

  return {
    ...value,
    id: index + 1,
    name: customName,
    content,
    updatedAt: typeof value.updatedAt === "string"
      ? value.updatedAt
      : null
  };
}

function normaliseMemory(source) {
  if (
    !source ||
    typeof source !== "object" ||
    !source.cores ||
    typeof source.cores !== "object"
  ) {
    return null;
  }

  const normalised = {
    version: 2,
    createdAt: typeof source.createdAt === "string"
      ? source.createdAt
      : new Date().toISOString(),
    updatedAt: typeof source.updatedAt === "string"
      ? source.updatedAt
      : new Date().toISOString(),
    cores: {}
  };

  for (const coreId of ["earth", "language", "game", "control"]) {
    const savedSlots = Array.isArray(source.cores[coreId])
      ? source.cores[coreId]
      : [];

    normalised.cores[coreId] = Array.from(
      { length: SLOT_COUNT },
      (_, index) => normaliseSlot(savedSlots[index], index)
    );
  }

  return normalised;
}

function slotIsUsed(slot) {
  const id = Number(slot?.id) || 0;
  const name = String(slot?.name || "").trim();
  const content = String(slot?.content || "").trim();

  return Boolean(content || (name && name !== `Slot ${id}`));
}

function slotTimestamp(slot) {
  const timestamp = Date.parse(slot?.updatedAt || "");

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function readStoredMemory(key) {
  try {
    const raw = localStorage.getItem(key);

    return raw ? normaliseMemory(JSON.parse(raw)) : null;
  } catch (error) {
    console.warn(`PamÄÅ¥ v klÃ­Äi ${key} se nepodaÅilo naÄÃ­st.`, error);
    return null;
  }
}

function readSnapshotMemories() {
  try {
    const snapshots = JSON.parse(
      localStorage.getItem(MEMORY_SNAPSHOT_KEY) || "[]"
    );

    if (!Array.isArray(snapshots)) {
      return [];
    }

    return snapshots
      .slice(-3)
      .reverse()
      .map(snapshot => {
        if (!snapshot?.data) {
          return null;
        }

        return normaliseMemory(JSON.parse(snapshot.data));
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function readChybozroutBackupMemories() {
  try {
    const backup = JSON.parse(
      localStorage.getItem(CHYBOZROUT_BACKUP_KEY) || "null"
    );

    if (!backup?.values || typeof backup.values !== "object") {
      return [];
    }

    return [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]
      .map(key => {
        const raw = backup.values[key];

        return raw ? normaliseMemory(JSON.parse(raw)) : null;
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function readLegacySlotMemory() {
  const memory = createEmptyMemory();
  let hasData = false;

  for (let index = 0; index < SLOT_COUNT; index += 1) {
    try {
      const raw = localStorage.getItem(LEGACY_SLOT_PREFIX + (index + 1));

      if (!raw) {
        continue;
      }

      const slot = normaliseSlot(JSON.parse(raw), index);

      if (slotIsUsed(slot)) {
        memory.cores.earth[index] = slot;
        hasData = true;
      }
    } catch {
      /* JednotlivÃ½ starÃ½ slot nesmÃ­ zastavit naÄtenÃ­ celÃ© PamÄti. */
    }
  }

  return hasData ? memory : null;
}

function mergeMemoryCandidates(candidates) {
  const merged = createEmptyMemory();
  let hasData = false;

  for (const candidate of candidates.filter(Boolean)) {
    for (const coreId of ["earth", "language", "game", "control"]) {
      const incomingSlots = candidate.cores?.[coreId] || [];

      incomingSlots.forEach((sourceSlot, index) => {
        const incoming = normaliseSlot(sourceSlot, index);

        if (!slotIsUsed(incoming)) {
          return;
        }

        const current = merged.cores[coreId][index];

        if (
          !slotIsUsed(current) ||
          slotTimestamp(incoming) > slotTimestamp(current)
        ) {
          merged.cores[coreId][index] = incoming;
        }

        hasData = true;
      });
    }
  }

  return { memory: merged, hasData };
}

function writeMemoryCopies(value, createSnapshot = true) {
  const serialised = JSON.stringify(value);

  try {
    localStorage.setItem(STORAGE_KEY, serialised);

    for (const key of LEGACY_STORAGE_KEYS) {
      localStorage.setItem(key, serialised);
    }

    if (!createSnapshot) {
      return;
    }

    let snapshots = [];

    try {
      const saved = JSON.parse(
        localStorage.getItem(MEMORY_SNAPSHOT_KEY) || "[]"
      );

      snapshots = Array.isArray(saved) ? saved : [];
    } catch {
      snapshots = [];
    }

    if (snapshots.at(-1)?.data !== serialised) {
      snapshots.push({
        savedAt: new Date().toISOString(),
        data: serialised
      });
    }

    localStorage.setItem(
      MEMORY_SNAPSHOT_KEY,
      JSON.stringify(snapshots.slice(-3))
    );
  } catch (error) {
    console.warn("PamÄÅ¥ se nepodaÅilo bezpeÄnÄ zapsat.", error);
  }
}

function loadMemory() {
  const currentCandidates = [
    readStoredMemory(STORAGE_KEY),
    ...LEGACY_STORAGE_KEYS.map(readStoredMemory),
    ...readSnapshotMemories(),
    ...readChybozroutBackupMemories(),
    readLegacySlotMemory()
  ];

  const merged = mergeMemoryCandidates(currentCandidates);

  if (merged.hasData) {
    writeMemoryCopies(merged.memory);
    return merged.memory;
  }

  return createEmptyMemory();
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
      pitch: normaliseAngle(
        Number.isFinite(saved.pitch) ? saved.pitch : fallback.pitch
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
    console.warn("RozloÅ¾enÃ­ scÃ©ny bylo obnoveno.", error);
    return fallback;
  }
}

function saveScene() {
  localStorage.setItem(
    SCENE_KEY,
    JSON.stringify({
      yaw: normaliseAngle(scene.yaw),
      pitch: normaliseAngle(scene.pitch),
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

  writeMemoryCopies(memory);
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
    return String(slot.content || "").trim() || String(slot.name || "").trim() !== `Slot ${slot.id}`;
  }).length;

  const size = byteSize(JSON.stringify(slots));
  return { used, size };
}

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  const nextWidth = Number(bounds.width);
  const nextHeight = Number(bounds.height);

  if (
    !Number.isFinite(nextWidth) ||
    !Number.isFinite(nextHeight) ||
    nextWidth <= 0 ||
    nextHeight <= 0
  ) {
    width = 0;
    height = 0;
    return false;
  }

  const devicePixelRatio = Number(window.devicePixelRatio);
  pixelRatio = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0
    ? Math.min(devicePixelRatio, 2)
    : 1;

  width = nextWidth;
  height = nextHeight;

  canvas.width = Math.max(1, Math.round(width * pixelRatio));
  canvas.height = Math.max(1, Math.round(height * pixelRatio));
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  return true;
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


function createDefaultTrojkaModels() {
  return [
    {
      id: "signal-leva",
      label: "SignÃ¡l levÃ¡",
      kind: "jezdec",
      rail: "horni-kolej",
      progress: .08,
      speed: .000012,
      color: "#ffe2ad",
      moving: true
    },
    {
      id: "signal-stred",
      label: "SignÃ¡l stÅed",
      kind: "jezdec",
      rail: "dolni-kolej",
      progress: .46,
      speed: .000018,
      color: "#c79b33",
      moving: true
    },
    {
      id: "signal-prava",
      label: "SignÃ¡l pravÃ¡",
      kind: "jezdec",
      rail: "horni-kolej",
      progress: .77,
      speed: .000009,
      color: "#fff0c5",
      moving: true
    }
  ];
}

function normaliseTrojkaModel(model, index) {
  const source = model && typeof model === "object" ? model : {};
  const allowedRails = TROJKA_RAILS.map((rail) => rail.id);
  const fallbackId = "model-" + Date.now() + "-" + index;
  const rawProgress = Number(source.progress);
  const rawSpeed = Number(source.speed);
  const progress = Number.isFinite(rawProgress) ? rawProgress : 0;
  const color = /^#[0-9a-f]{6}$/i.test(source.color || "")
    ? source.color
    : "#ffe2ad";

  return {
    id: String(source.id || fallbackId),
    label: String(source.label || "ZÃ¡suvnÃ½ model").slice(0, 80),
    kind: String(source.kind || "model").slice(0, 40),
    rail: allowedRails.includes(source.rail)
      ? source.rail
      : TROJKA_RAILS[index % TROJKA_RAILS.length].id,
    progress: positiveModulo(progress, 1),
    speed: Number.isFinite(rawSpeed) ? rawSpeed : 0,
    color,
    moving: source.moving !== false
  };
}

function loadTrojkaModels() {
  try {
    const raw = localStorage.getItem(TROJKA_MODEL_STORAGE_KEY);

    if (!raw) {
      return createDefaultTrojkaModels();
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return createDefaultTrojkaModels();
    }

    return parsed
      .slice(0, 48)
      .map((model, index) => normaliseTrojkaModel(model, index));
  } catch (error) {
    console.warn("Trojka byla obnovena do vÃ½chozÃ­ho stavu.", error);
    return createDefaultTrojkaModels();
  }
}

function saveTrojkaModels(reason) {
  localStorage.setItem(
    TROJKA_MODEL_STORAGE_KEY,
    JSON.stringify(trojkaModels)
  );

  window.dispatchEvent(new CustomEvent("cht.track.changed", {
    detail: {
      reason,
      models: trojkaModels.map((model) => ({ ...model }))
    }
  }));
}

function attachTrojkaModel(model) {
  const candidate = normaliseTrojkaModel(model, trojkaModels.length);
  const existingIndex = trojkaModels.findIndex(
    (item) => item.id === candidate.id
  );

  if (existingIndex >= 0) {
    trojkaModels[existingIndex] = candidate;
  } else {
    trojkaModels.push(candidate);
  }

  saveTrojkaModels("pÅipojenÃ­");
  return { ...candidate };
}

function moveTrojkaModel(id, patch) {
  const index = trojkaModels.findIndex((model) => model.id === id);

  if (index < 0) {
    return null;
  }

  trojkaModels[index] = normaliseTrojkaModel(
    { ...trojkaModels[index], ...(patch || {}), id },
    index
  );

  saveTrojkaModels("posun");
  return { ...trojkaModels[index] };
}

function detachTrojkaModel(id) {
  const before = trojkaModels.length;
  trojkaModels = trojkaModels.filter((model) => model.id !== id);

  if (trojkaModels.length === before) {
    return false;
  }

  saveTrojkaModels("odpojenÃ­");
  return true;
}

function installTrojkaBridge() {
  window.CHT360Track = {
    version: 1,
    shape: "100-20-100-20-100",
    get anchors() {
      return TROJKA_PROFILE.map((point) => ({
        id: point.id,
        label: point.label,
        depth: Math.round(point.depth * 100),
        sockets: TROJKA_RAILS.map((rail) => ({
          id: point.id + "-" + rail.id,
          rail: rail.id
        }))
      }));
    },
    get rails() {
      return TROJKA_RAILS.map((rail) => ({ ...rail }));
    },
    listModels() {
      return trojkaModels.map((model) => ({ ...model }));
    },
    attach(model) {
      return attachTrojkaModel(model);
    },
    move(id, patch) {
      return moveTrojkaModel(id, patch);
    },
    detach(id) {
      return detachTrojkaModel(id);
    }
  };

  window.dispatchEvent(new CustomEvent("cht.track.ready", {
    detail: window.CHT360Track
  }));
}

function getTrojkaCamera() {
  /*
    StÄna je vÅ¾dy vÄtÅ¡Ã­ neÅ¾ displej o malÃ½ pÅesah.
    Po otoÄenÃ­ nebo zmÄnÄ velikosti se propoÄÃ­tÃ¡ znovu,
    takÅ¾e vede skuteÄnÄ od rohu k rohu.
  */
  const base = Math.max(width * .88, height * 1.16);
  const projection = base / 3.78;

  return {
    centerX: width * .50,
    centerY: height * .50,
    base,
    wallScaleX: Math.max(
      1,
      width * .54 / (1.28 * projection)
    ),
    wallScaleY: Math.max(
      1,
      height * .56 / (.92 * projection)
    ),
    yaw: 0,
    pitch: 0,
    roll: 0
  };
}

function projectTrojkaPoint(point) {
  const camera = getTrojkaCamera();
  const yawCos = Math.cos(camera.yaw);
  const yawSin = Math.sin(camera.yaw);
  const pitchCos = Math.cos(camera.pitch);
  const pitchSin = Math.sin(camera.pitch);
  const rollCos = Math.cos(camera.roll);
  const rollSin = Math.sin(camera.roll);

  const yawX = point.x * yawCos - point.z * yawSin;
  const yawZ = point.x * yawSin + point.z * yawCos;
  const pitchY = point.y * pitchCos - yawZ * pitchSin;
  const pitchZ = point.y * pitchSin + yawZ * pitchCos;
  const perspective = 1 / Math.max(2.9, 3.78 - pitchZ);
  const localX =
    yawX * camera.base * camera.wallScaleX * perspective;
  const localY =
    pitchY * camera.base * camera.wallScaleY * perspective;

  return {
    x: camera.centerX + localX * rollCos - localY * rollSin,
    y: camera.centerY + localX * rollSin + localY * rollCos,
    scale: camera.base * perspective / Math.max(width, height),
    depth: pitchZ
  };
}

function sampleTrojkaProfile(progress) {
  const bounded = clamp(Number(progress) || 0, 0, 1);
  const scaled = bounded * (TROJKA_PROFILE.length - 1);
  const index = Math.min(
    TROJKA_PROFILE.length - 2,
    Math.floor(scaled)
  );
  const local = scaled - index;
  const eased = local * local * (3 - 2 * local);
  const from = TROJKA_PROFILE[index];
  const to = TROJKA_PROFILE[index + 1];

  return {
    x: from.x + (to.x - from.x) * local,
    z: from.z + (to.z - from.z) * eased,
    depth: from.depth + (to.depth - from.depth) * eased
  };
}

function drawTrojkaTrack(time) {
  const rows = [-.92, -.46, 0, .46, .92];

  context.save();

  for (let row = 0; row < rows.length - 1; row += 1) {
    for (let segment = 0; segment < TROJKA_PROFILE.length - 1; segment += 1) {
      const from = TROJKA_PROFILE[segment];
      const to = TROJKA_PROFILE[segment + 1];
      const depth = (from.depth + to.depth) / 2;
      const points = [
        projectTrojkaPoint({ x: from.x, y: rows[row], z: from.z }),
        projectTrojkaPoint({ x: to.x, y: rows[row], z: to.z }),
        projectTrojkaPoint({ x: to.x, y: rows[row + 1], z: to.z }),
        projectTrojkaPoint({ x: from.x, y: rows[row + 1], z: from.z })
      ];

      const alpha = .032 + depth * .085 + (row % 2) * .012;

      fillTrojkaPolygon(
        points,
        "rgba(199,155,51," + alpha + ")",
        "rgba(255,226,173,.16)",
        .65
      );
    }
  }

  rows.forEach((row, index) => {
    drawTrojkaProfileLine(
      row,
      .012,
      index === 2
        ? "rgba(255,235,191,.48)"
        : "rgba(199,155,51,.22)",
      index === 2 ? 1.25 : .68
    );
  });

  drawTrojkaRails(time);
  drawTrojkaSockets(time);
  drawTrojkaModels(time);

  context.restore();
}

function drawTrojkaRails(time) {
  TROJKA_RAILS.forEach((rail, index) => {
    drawTrojkaProfileLine(
      rail.y,
      .11,
      "rgba(255,226,173,.82)",
      1.55
    );

    drawTrojkaProfileLine(
      rail.y + (index === 0 ? .032 : -.032),
      .075,
      "rgba(199,155,51,.36)",
      .72
    );
  });

  const pulse = .34 + Math.sin(time * .0016) * .13;

  drawTrojkaProfileLine(
    0,
    .13,
    "rgba(255,240,197," + pulse + ")",
    1.05
  );
}

function drawTrojkaSockets(time) {
  TROJKA_PROFILE.forEach((anchor, anchorIndex) => {
    TROJKA_RAILS.forEach((rail, railIndex) => {
      const point = projectTrojkaPoint({
        x: anchor.x,
        y: rail.y,
        z: anchor.z + .13
      });
      const pulse = .88 + Math.sin(time * .0018 + anchorIndex + railIndex) * .13;
      const radius = clamp(8 * point.scale * pulse, 3.4, 8.8);

      context.save();
      context.strokeStyle = "rgba(255,232,181,.90)";
      context.lineWidth = 1.05;
      context.beginPath();
      context.arc(point.x, point.y, radius, 0, Math.PI * 2);
      context.stroke();

      context.fillStyle = "rgba(199,155,51,.28)";
      context.beginPath();
      context.arc(point.x, point.y, radius * .43, 0, Math.PI * 2);
      context.fill();
      context.restore();
    });
  });
}

function drawTrojkaModels(time) {
  trojkaModels.forEach((model) => {
    const rail = TROJKA_RAILS.find((item) => item.id === model.rail)
      || TROJKA_RAILS[0];
    const progress = model.moving
      ? positiveModulo(model.progress + time * model.speed, 1)
      : model.progress;
    const base = sampleTrojkaProfile(progress);
    const point = projectTrojkaPoint({
      x: base.x,
      y: rail.y,
      z: base.z + .18
    });
    const rgb = trojkaColorToRgb(model.color);
    const radius = clamp(9 * point.scale, 3.5, 9.5);

    context.save();

    const glow = context.createRadialGradient(
      point.x,
      point.y,
      0,
      point.x,
      point.y,
      radius * 4
    );

    glow.addColorStop(0, "rgba(255,246,213,.96)");
    glow.addColorStop(
      .30,
      "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.70)"
    );
    glow.addColorStop(
      1,
      "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",0)"
    );

    context.fillStyle = glow;
    context.beginPath();
    context.arc(point.x, point.y, radius * 4, 0, Math.PI * 2);
    context.fill();

    context.translate(point.x, point.y);
    context.rotate(time * .0008 + progress * Math.PI * 2);
    context.fillStyle = model.color;
    context.strokeStyle = "#fff0c5";
    context.lineWidth = 1;

    context.beginPath();
    context.moveTo(0, -radius);
    context.lineTo(radius * .72, 0);
    context.lineTo(0, radius);
    context.lineTo(-radius * .72, 0);
    context.closePath();
    context.fill();
    context.stroke();

    context.restore();
  });
}

function drawTrojkaProfileLine(y, zOffset, strokeStyle, lineWidth) {
  context.beginPath();

  for (let step = 0; step <= 80; step += 1) {
    const profilePoint = sampleTrojkaProfile(step / 80);
    const point = projectTrojkaPoint({
      x: profilePoint.x,
      y,
      z: profilePoint.z + zOffset
    });

    if (step === 0) {
      context.moveTo(point.x, point.y);
    } else {
      context.lineTo(point.x, point.y);
    }
  }

  context.lineCap = "round";
  context.strokeStyle = strokeStyle;
  context.lineWidth = lineWidth;
  context.stroke();
}

function fillTrojkaPolygon(points, fillStyle, strokeStyle, lineWidth) {
  context.beginPath();

  points.forEach((point, index) => {
    if (index === 0) {
      context.moveTo(point.x, point.y);
    } else {
      context.lineTo(point.x, point.y);
    }
  });

  context.closePath();
  context.fillStyle = fillStyle;
  context.fill();
  context.strokeStyle = strokeStyle;
  context.lineWidth = lineWidth;
  context.stroke();
}

function trojkaColorToRgb(color) {
  const value = (/^#[0-9a-f]{6}$/i.test(color || ""))
    ? color.slice(1)
    : "ffe2ad";

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16)
  };
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function getGlyphDrumTokens() {
  return [...GLYPH_DRUM_TOKENS, ...customGlyphTokens];
}

function createDefaultGlyphDrumValues() {
  const tokens = getGlyphDrumTokens();
  const defaults = ["7i_", "Ä«Â´", "ËÂ°iÂ°Ë", ".â¢cUâ¢."];

  return defaults.map(token => Math.max(0, tokens.indexOf(token)));
}

function loadCustomGlyphTokens() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(GLYPH_DRUM_CUSTOM_STORAGE_KEY) || "[]"
    );

    if (!Array.isArray(saved)) {
      return [];
    }

    return saved
      .map(token => String(token || "").trim().slice(0, 24))
      .filter(Boolean)
      .slice(-64);
  } catch {
    return [];
  }
}

function saveCustomGlyphTokens() {
  try {
    localStorage.setItem(
      GLYPH_DRUM_CUSTOM_STORAGE_KEY,
      JSON.stringify(customGlyphTokens)
    );
  } catch {
    /* VlastnÃ­ glyph nesmÃ­ zastavit PamÄÅ¥. */
  }
}

function loadGlyphDrumValues() {
  const tokens = getGlyphDrumTokens();

  try {
    const saved = JSON.parse(
      localStorage.getItem(GLYPH_DRUM_STORAGE_KEY) || "null"
    );

    if (!Array.isArray(saved) || !saved.length) {
      return createDefaultGlyphDrumValues();
    }

    return saved
      .slice(0, 14)
      .map(value => positiveModulo(Number(value) || 0, tokens.length));
  } catch {
    return createDefaultGlyphDrumValues();
  }
}

function saveGlyphDrumValues() {
  try {
    localStorage.setItem(
      GLYPH_DRUM_STORAGE_KEY,
      JSON.stringify(glyphDrumValues)
    );
  } catch {
    /* VÃ½bÄr bubÃ­nkÅ¯ je vedlejÅ¡Ã­ pohodlÃ­, ne kritickÃ¡ data. */
  }
}

function getCipherSeed(value) {
  return Array.from(String(value)).reduce(
    (total, character) => total + character.codePointAt(0),
    0
  );
}

function drawCipherCoreTitle(title, x, y, scale, time, active, coreId) {
  const characters = Array.from(title);
  const seed = getCipherSeed(coreId);
  const phase = (time * .001 + seed * .031) % 8;
  const locked = active || phase > 6.25;
  const manualOffset = Math.round(scene.yaw * 9 + scene.pitch * 4);
  const fontSize = Math.max(9, Math.round(11 * scale));
  const cellWidth = Math.max(9, Math.round(fontSize * 1.03));
  const cellHeight = Math.max(14, Math.round(fontSize * 1.45));
  const startX = x - (characters.length - 1) * cellWidth * .5;

  context.font = "800 " + fontSize + "px system-ui";
  context.textAlign = "center";
  context.textBaseline = "middle";

  characters.forEach((target, index) => {
    const centerX = startX + index * cellWidth;
    const reelBase = Math.floor(
      time * .020 + seed * 1.7 + index * 5 + manualOffset
    );
    const current = locked
      ? target
      : CORE_CIPHER_TOKENS[
        positiveModulo(reelBase, CORE_CIPHER_TOKENS.length)
      ];
    const previous = locked
      ? target
      : CORE_CIPHER_TOKENS[
        positiveModulo(reelBase - 1, CORE_CIPHER_TOKENS.length)
      ];
    const next = locked
      ? target
      : CORE_CIPHER_TOKENS[
        positiveModulo(reelBase + 1, CORE_CIPHER_TOKENS.length)
      ];
    const shift = locked
      ? 0
      : positiveModulo(time * .09 + seed + index * 7, cellHeight) -
        cellHeight * .5;

    context.save();
    context.beginPath();
    context.rect(
      centerX - cellWidth * .56,
      y - cellHeight * .58,
      cellWidth * 1.12,
      cellHeight * 1.16
    );
    context.clip();

    context.globalAlpha = locked ? .98 : .26;
    context.fillText(previous, centerX, y - cellHeight + shift);

    context.globalAlpha = .98;
    context.fillText(current, centerX, y + shift);

    context.globalAlpha = locked ? .98 : .28;
    context.fillText(next, centerX, y + cellHeight + shift);

    context.restore();
  });
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
  const surfaceTilt = scene.pitch;

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
  drawCipherCoreTitle(
    core.title,
    position.x,
    position.y - 4,
    scale,
    time,
    active,
    core.id
  );

  const stats = getCoreStats(core.id);

  context.fillStyle = "rgba(255,240,210,.74)";
  context.font = Math.max(8, Math.round(9 * scale)) + "px system-ui";
  context.fillText(stats.used + "/70", position.x, position.y + 12);

  context.restore();

  core.position = position;
  core.drawRadius = radius;
}

function render(time) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    requestAnimationFrame(render);
    return;
  }

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
  drawTrojkaTrack(time);

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

  renderGlyphDrums();
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

function getGlyphTokenAt(value) {
  const tokens = getGlyphDrumTokens();

  return tokens[positiveModulo(value, tokens.length)] || "â¢";
}

function updateGlyphDrumButton(button, index) {
  const current = positiveModulo(
    glyphDrumValues[index] || 0,
    getGlyphDrumTokens().length
  );
  const previous = getGlyphTokenAt(current - 1);
  const token = getGlyphTokenAt(current);
  const next = getGlyphTokenAt(current + 1);

  button.querySelector("[data-glyph-reel='previous']").textContent = previous;
  button.querySelector("[data-glyph-reel='current']").textContent = token;
  button.querySelector("[data-glyph-reel='next']").textContent = next;
  button.setAttribute(
    "aria-label",
    "BubÃ­nek " + (index + 1) + ": " + token
  );
}

function stepGlyphDrum(index, amount) {
  const tokens = getGlyphDrumTokens();

  glyphDrumValues[index] = positiveModulo(
    (glyphDrumValues[index] || 0) + amount,
    tokens.length
  );

  saveGlyphDrumValues();

  const button = glyphDrumsElement?.querySelector(
    "[data-glyph-drum='" + index + "']"
  );

  if (button) {
    updateGlyphDrumButton(button, index);
    button.classList.remove("is-stepping");
    void button.offsetWidth;
    button.classList.add("is-stepping");
  }
}

function attachGlyphDrumPointer(button, index) {
  let drag = null;

  button.addEventListener("pointerdown", event => {
    event.preventDefault();

    drag = {
      pointerId: event.pointerId,
      startY: event.clientY,
      lastStep: 0,
      moved: false
    };

    button.setPointerCapture(event.pointerId);
    button.classList.add("is-dragging");
  });

  button.addEventListener("pointermove", event => {
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const step = Math.trunc((drag.startY - event.clientY) / 18);

    if (step === drag.lastStep) {
      return;
    }

    stepGlyphDrum(index, step - drag.lastStep);
    drag.lastStep = step;
    drag.moved = true;
  });

  const finish = (event, cancelled = false) => {
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    if (!cancelled && !drag.moved) {
      stepGlyphDrum(index, 1);
    }

    if (button.hasPointerCapture(event.pointerId)) {
      button.releasePointerCapture(event.pointerId);
    }

    drag = null;
    button.classList.remove("is-dragging");
  };

  button.addEventListener("pointerup", event => finish(event));
  button.addEventListener("pointercancel", event => finish(event, true));

  button.addEventListener("keydown", event => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      stepGlyphDrum(index, 1);
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      stepGlyphDrum(index, -1);
    }
  });
}

function renderGlyphDrums() {
  if (!glyphDrumsElement) {
    return;
  }

  glyphDrumsElement.textContent = "";

  glyphDrumValues.forEach((value, index) => {
    const button = document.createElement("button");
    const previous = document.createElement("span");
    const current = document.createElement("strong");
    const next = document.createElement("span");

    button.type = "button";
    button.className = "glyphDrum";
    button.dataset.glyphDrum = String(index);

    previous.className = "glyphDrumGhost";
    previous.dataset.glyphReel = "previous";
    current.className = "glyphDrumCurrent";
    current.dataset.glyphReel = "current";
    next.className = "glyphDrumGhost";
    next.dataset.glyphReel = "next";

    button.append(previous, current, next);
    glyphDrumsElement.appendChild(button);

    updateGlyphDrumButton(button, index);
    attachGlyphDrumPointer(button, index);
  });
}

function addGlyphDrum() {
  if (glyphDrumValues.length >= 14) {
    return;
  }

  glyphDrumValues.push(0);
  saveGlyphDrumValues();
  renderGlyphDrums();
}

function resetGlyphDrums() {
  glyphDrumValues = createDefaultGlyphDrumValues();
  saveGlyphDrumValues();
  renderGlyphDrums();
}

function addCustomGlyphToken() {
  const token = String(glyphCustom?.value || "").trim().slice(0, 24);

  if (!token) {
    return;
  }

  const tokens = getGlyphDrumTokens();

  if (!tokens.includes(token)) {
    customGlyphTokens.push(token);
    customGlyphTokens = customGlyphTokens.slice(-64);
    saveCustomGlyphTokens();
  }

  const nextTokens = getGlyphDrumTokens();
  glyphDrumValues[glyphDrumValues.length - 1] = nextTokens.indexOf(token);
  glyphCustom.value = "";
  saveGlyphDrumValues();
  renderGlyphDrums();
}

function writeSlotValues(coreId, index, name, content, message, reason) {
  const slot = memory.cores?.[coreId]?.[index];

  if (!slot) {
    return;
  }

  const nextName = String(name || "").trim() || `Slot ${index + 1}`;
  const nextContent = String(content || "");
  const changed =
    slot.name !== nextName ||
    slot.content !== nextContent;

  if (changed) {
    slot.name = nextName;
    slot.content = nextContent;
    slot.updatedAt = new Date().toISOString();
    saveMemory(reason);
  }

  if (selectedCore?.id === coreId) {
    renderSlots();

    if (selectedSlotIndex === index && message) {
      updateStatus(message);
    }
  }
}

function saveSelectedSlot(message = "uloÅ¾eno", reason = "save") {
  if (!selectedCore || selectedSlotIndex === null) {
    return;
  }

  writeSlotValues(
    selectedCore.id,
    selectedSlotIndex,
    slotName.value,
    slotContent.value,
    message,
    reason
  );
}

function scheduleSlotAutosave() {
  if (!selectedCore || selectedSlotIndex === null) {
    return;
  }

  const coreId = selectedCore.id;
  const slotIndex = selectedSlotIndex;
  const name = slotName.value;
  const content = slotContent.value;

  clearTimeout(slotAutosaveTimer);

  slotAutosaveTimer = window.setTimeout(() => {
    writeSlotValues(
      coreId,
      slotIndex,
      name,
      content,
      "automaticky uloÅ¾eno",
      "autosave"
    );
  }, 600);
}

function insertGlyphPhrase() {
  if (!selectedCore || selectedSlotIndex === null) {
    updateStatus("nejdÅÃ­v vyber slot");
    return;
  }

  const phrase = glyphDrumValues
    .map(getGlyphTokenAt)
    .join("");

  if (!phrase) {
    return;
  }

  const start = Number.isFinite(slotContent.selectionStart)
    ? slotContent.selectionStart
    : slotContent.value.length;
  const end = Number.isFinite(slotContent.selectionEnd)
    ? slotContent.selectionEnd
    : start;

  slotContent.value =
    slotContent.value.slice(0, start) +
    phrase +
    slotContent.value.slice(end);

  const cursor = start + phrase.length;

  slotContent.focus();
  slotContent.setSelectionRange(cursor, cursor);
  clearTimeout(slotAutosaveTimer);
  saveSelectedSlot("glyph vloÅ¾en a uloÅ¾en", "glyph");
}

function initialiseGlyphDrums() {
  renderGlyphDrums();

  glyphAddDrum?.addEventListener("click", addGlyphDrum);
  glyphInsert?.addEventListener("click", insertGlyphPhrase);
  glyphReset?.addEventListener("click", resetGlyphDrums);
  glyphAddToken?.addEventListener("click", addCustomGlyphToken);

  glyphCustom?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      addCustomGlyphToken();
    }
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
  clearTimeout(slotAutosaveTimer);
  saveSelectedSlot("uloÅ¾eno", "save");
});

slotName.addEventListener("input", scheduleSlotAutosave);
slotContent.addEventListener("input", scheduleSlotAutosave);

clearSlot.addEventListener("click", () => {
  clearTimeout(slotAutosaveTimer);

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

      const importedMemory = normaliseMemory(data);

      if (!importedMemory) {
        throw new Error("Soubor neobsahuje platnou PamÄÅ¥");
      }

      writeMemoryCopies(importedMemory);
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

function getPointerAngle(first, second) {
  return Math.atan2(
    second.y - first.y,
    second.x - first.x
  );
}

function updateGestureHint() {
  const hints = document.querySelectorAll(".hud span");

  if (hints.length >= 3) {
    hints[0].textContent = "1 prst: 3D otÃ¡ÄenÃ­";
    hints[1].textContent = "2 prsty: posun Â· zoom Â· Å¡ejdr";
    hints[2].textContent = "klepnutÃ­: otevÅÃ­t jÃ¡dro";
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

    scene.pitch = normaliseAngle(
      scene.pitch + deltaY * .010
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

installTrojkaBridge();
resizeCanvas();
constrainScene();
updatePills();
updateGestureHint();
initialiseGlyphDrums();
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
        "[CHT 360Â°â°.] Service worker se nepodaÅilo spustit.",
        error
      );
    }
  });
}


