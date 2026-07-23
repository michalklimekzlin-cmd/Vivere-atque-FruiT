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
const SLOT_COUNT = 240;
const SCENE_KEY = "vaft_pamet_scene_v2";
const MIN_SCENE_SPREAD = .96;
const MAX_SCENE_SPREAD = 2.8;

const TROJKA_MODEL_STORAGE_KEY = "cht360_trojka_models_v1";

const GLYPH_DRUM_STORAGE_KEY = "cht360_glyph_drums_v1";
const GLYPH_DRUM_CUSTOM_STORAGE_KEY = "cht360_glyph_drums_custom_v1";
const PHONE_SETTINGS_KEY = "cht360_iphone14_settings_v1";
const PHONE_APP_LIMIT = 240;

const GLYPH_DRUM_TOKENS = Object.freeze([
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  ..."0123456789",
  "Á", "Č", "Ď", "É", "Ě", "Í", "Ň", "Ó", "Ř", "Š", "Ť", "Ú", "Ů", "Ý",
  "ア", "°", "‰", "•", "_", "-", "/", "\`", "´", "ˇ", "ī", "ı",
  "ï", "ø", "Ō", "Ï", "¯", "&", "(", ")", "*", "}", "{", "₹",
  "7i_", "ī´", "ˇ°i°ˇ", "._;´/`", ",!", "ïø", "°Ō°", ".•cU•.",
  "-:x:-", "7/¯", "ı>o", "°&", "(\\*/)", "Ïo", "}{", "•N", "7₹"
]);

const CORE_CIPHER_TOKENS = Object.freeze([
  ..."0123456789",
  "7", "i", "_", "ī", "´", "ˇ", "°", ".", ";", "/", "\`", ",", "!",
  "ï", "ø", "Ō", "•", "c", "U", "-", ":", "x", "¯", "ı", ">", "o",
  "&", "(", ")", "*", "Ï", "}", "{", "N", "₹", "ア"
]);

const TROJKA_PROFILE = [
  { id: "leva-hrana", label: "Levá hrana", x: -1.28, z: .76, depth: 1 },
  { id: "levy-propad", label: "Levý propad", x: -.64, z: -.58, depth: .2 },
  { id: "stred", label: "Střed", x: 0, z: .76, depth: 1 },
  { id: "pravy-propad", label: "Pravý propad", x: .64, z: -.58, depth: .2 },
  { id: "prava-hrana", label: "Pravá hrana", x: 1.28, z: .76, depth: 1 }
];

const TROJKA_RAILS = [
  { id: "horni-kolej", label: "Horní kolej", y: -.47 },
  { id: "dolni-kolej", label: "Dolní kolej", y: .47 }
];

let trojkaModels = loadTrojkaModels();
let customGlyphTokens = loadCustomGlyphTokens();
let glyphDrumValues = loadGlyphDrumValues();
let slotAutosaveTimer = null;

const cores = [
  {
    id: "earth",
    title: "Země",
    subtitle: "Modelování, světy a úhel pohledu",
    radius: 50
  },
  {
    id: "language",
    title: "Jazyk",
    subtitle: "Písmena, symboly, znaky a význam",
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
    title: "iPhone 14",
    subtitle: "Červený uzel CHT · lokální PWA",
    radius: 54,
    type: "iphone14"
  }
];

let memory = loadMemory();
let scene = loadScene();
let phoneSettings = loadPhoneSettings();
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
    console.warn(`Paměť v klíči ${key} se nepodařilo načíst.`, error);
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
      /* Jednotlivý starý slot nesmí zastavit načtení celé Paměti. */
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
    console.warn("Paměť se nepodařilo bezpečně zapsat.", error);
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
  const safeValue = Number.isFinite(value) ? value : 0;
  const circle = Math.PI * 2;
  return ((safeValue + Math.PI) % circle + circle) % circle - Math.PI;
}

function createDefaultPhoneSettings() {
  return {
    angle: 0,
    apps: []
  };
}

function normalisePhoneApp(app, index) {
  const source = app && typeof app === "object" ? app : {};

  return {
    id: typeof source.id === "string" && source.id
      ? source.id
      : "app-" + Date.now() + "-" + index,
    name: typeof source.name === "string"
      ? source.name.trim().slice(0, 48)
      : "",
    url: typeof source.url === "string"
      ? source.url.trim().slice(0, 500)
      : ""
  };
}

function loadPhoneSettings() {
  const fallback = createDefaultPhoneSettings();

  try {
    const raw = localStorage.getItem(PHONE_SETTINGS_KEY);

    if (!raw) {
      return fallback;
    }

    const saved = JSON.parse(raw);

    return {
      angle: normaliseAngle(saved?.angle),
      apps: Array.isArray(saved?.apps)
        ? saved.apps
          .map(normalisePhoneApp)
          .filter(app => app.name || app.url)
          .slice(0, PHONE_APP_LIMIT)
        : []
    };
  } catch (error) {
    console.warn("iPhone 14: nastavení se nepodařilo načíst.", error);
    return fallback;
  }
}

function savePhoneSettings() {
  try {
    phoneSettings.angle = normaliseAngle(phoneSettings.angle);
    localStorage.setItem(PHONE_SETTINGS_KEY, JSON.stringify(phoneSettings));
  } catch (error) {
    console.warn("iPhone 14: nastavení se nepodařilo uložit.", error);
  }
}

function isAllowedPhoneUrl(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return false;
  }

  if (/^https?:\/\//i.test(raw)) {
    return true;
  }

  return /^[a-z][a-z0-9+.-]*:/i.test(raw) &&
    !/^(javascript|data|file):/i.test(raw);
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
    console.warn("Rozložení scény bylo obnoveno.", error);
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
    pill.textContent = `${core.title.toUpperCase()} · ${stats.used}/${SLOT_COUNT}`;
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
      label: "Signál levá",
      kind: "jezdec",
      rail: "horni-kolej",
      progress: .08,
      speed: .000012,
      color: "#ffe2ad",
      moving: true
    },
    {
      id: "signal-stred",
      label: "Signál střed",
      kind: "jezdec",
      rail: "dolni-kolej",
      progress: .46,
      speed: .000018,
      color: "#c79b33",
      moving: true
    },
    {
      id: "signal-prava",
      label: "Signál pravá",
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
    label: String(source.label || "Zásuvný model").slice(0, 80),
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
    console.warn("Trojka byla obnovena do výchozího stavu.", error);
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

  saveTrojkaModels("připojení");
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

  saveTrojkaModels("odpojení");
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
    Stěna je vždy větší než displej o malý přesah.
    Po otočení nebo změně velikosti se propočítá znovu,
    takže vede skutečně od rohu k rohu.
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
  const defaults = ["7i_", "ī´", "ˇ°i°ˇ", ".•cU•."];

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
    /* Vlastní glyph nesmí zastavit Paměť. */
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
    /* Výběr bubínků je vedlejší pohodlí, ne kritická data. */
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

function roundedRectPath(x, y, rectWidth, rectHeight, radius) {
  const safeRadius = Math.min(radius, rectWidth / 2, rectHeight / 2);

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + rectWidth - safeRadius, y);
  context.quadraticCurveTo(x + rectWidth, y, x + rectWidth, y + safeRadius);
  context.lineTo(x + rectWidth, y + rectHeight - safeRadius);
  context.quadraticCurveTo(x + rectWidth, y + rectHeight, x + rectWidth - safeRadius, y + rectHeight);
  context.lineTo(x + safeRadius, y + rectHeight);
  context.quadraticCurveTo(x, y + rectHeight, x, y + rectHeight - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function drawAppleMark(x, y, size) {
  context.save();
  context.fillStyle = "rgba(255,255,255,.94)";
  context.beginPath();
  context.moveTo(x, y - size * .06);
  context.bezierCurveTo(x - size * .28, y - size * .38, x - size * .64, y - size * .24, x - size * .62, y + size * .15);
  context.bezierCurveTo(x - size * .60, y + size * .56, x - size * .26, y + size * .69, x, y + size * .43);
  context.bezierCurveTo(x + size * .25, y + size * .69, x + size * .60, y + size * .55, x + size * .62, y + size * .15);
  context.bezierCurveTo(x + size * .64, y - size * .24, x + size * .28, y - size * .38, x, y - size * .06);
  context.fill();

  context.beginPath();
  context.ellipse(x + size * .16, y - size * .44, size * .20, size * .08, -.65, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function ensureIPhoneSettingsPanel() {
  let phonePanel = document.getElementById("iphoneSettingsPanel");

  if (phonePanel) {
    return phonePanel;
  }

  const style = document.createElement("style");
  style.id = "iphoneSettingsPanelStyle";
  style.textContent = [
    "#iphoneSettingsPanel{position:fixed;inset:0;z-index:1005;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.66);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}",
    "#iphoneSettingsPanel.is-open{display:flex}",
    ".iphoneSettingsCard{width:min(430px,100%);max-height:min(720px,calc(100dvh - 36px));overflow:auto;border:1px solid rgba(255,255,255,.24);border-radius:26px;color:#fff;background:linear-gradient(145deg,#1c1d20,#050506 58%,#291014);box-shadow:0 26px 80px rgba(0,0,0,.66),0 0 42px rgba(222,35,45,.22)}",
    ".iphoneSettingsHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:20px 20px 14px;border-bottom:1px solid rgba(255,255,255,.12)}",
    ".iphoneSettingsHead strong{display:block;font-size:20px;letter-spacing:.03em}.iphoneSettingsHead span{display:block;margin-top:4px;color:#c9c9ce;font-size:13px;line-height:1.35}",
    ".iphoneSettingsClose,.iphoneSettingsButton{border:1px solid rgba(255,255,255,.18);border-radius:13px;color:#fff;background:#242529;font:inherit;font-weight:800;cursor:pointer}",
    ".iphoneSettingsClose{width:36px;height:36px;font-size:22px;line-height:1}.iphoneSettingsBody{padding:16px 20px 20px}",
    ".iphoneSettingsState{margin-bottom:14px;padding:11px 12px;border:1px solid rgba(255,255,255,.15);border-radius:14px;color:#e2e2e5;background:rgba(255,255,255,.055);font-size:13px;line-height:1.4}",
    ".iphoneSettingsRow{display:flex;gap:8px;flex-wrap:wrap}.iphoneSettingsButton{min-height:40px;padding:9px 11px}.iphoneSettingsButton.primary{border-color:#ed3741;background:linear-gradient(135deg,#e42530,#a20e16)}",
    ".iphoneSettingsTitle{margin:20px 0 8px;color:#fff;font-size:14px;letter-spacing:.04em}.iphoneSettingsField{width:100%;min-height:42px;margin-top:8px;padding:10px 11px;border:1px solid rgba(255,255,255,.18);border-radius:12px;outline:none;color:#fff;background:#17181b;font:inherit}",
    ".iphoneSettingsField:focus{border-color:#ec3d47;box-shadow:0 0 0 3px rgba(236,61,71,.15)}",
    ".iphoneAppList{display:grid;gap:8px;margin-top:10px}.iphoneAppItem{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:7px;align-items:center;padding:9px;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:rgba(255,255,255,.045)}",
    ".iphoneAppItem strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.iphoneAppItem span{display:block;margin-top:2px;overflow:hidden;color:#aeb0b5;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.iphoneAppItem button{min-height:31px;padding:6px 8px;border:1px solid rgba(255,255,255,.16);border-radius:9px;color:#fff;background:#292a2e;font:inherit;font-size:11px;font-weight:800;cursor:pointer}.iphoneAppItem button:last-child{color:#ffb4b8}",
    ".iphoneSettingsEmpty{padding:12px;border:1px dashed rgba(255,255,255,.18);border-radius:13px;color:#bfc0c5;font-size:13px;line-height:1.4}"
  ].join("\n");

  phonePanel = document.createElement("section");
  phonePanel.id = "iphoneSettingsPanel";
  phonePanel.setAttribute("role", "dialog");
  phonePanel.setAttribute("aria-modal", "true");
  phonePanel.setAttribute("aria-label", "Nastavení iPhone 14 v CHT 360°‰.");
  phonePanel.innerHTML = [
    "<div class=\"iphoneSettingsCard\">",
    "  <div class=\"iphoneSettingsHead\">",
    "    <div><strong>iPhone 14 · CHT 360°‰.</strong><span>Červený uzel v oběhu Paměti.</span></div>",
    "    <button class=\"iphoneSettingsClose\" type=\"button\" aria-label=\"Zavřít nastavení\">×</button>",
    "  </div>",
    "  <div class=\"iphoneSettingsBody\">",
    "    <div class=\"iphoneSettingsState\" id=\"iphoneSettingsState\"></div>",
    "    <div class=\"iphoneSettingsRow\">",
    "      <button class=\"iphoneSettingsButton primary\" id=\"iphoneRotate\" type=\"button\">Otočit iPhone</button>",
    "      <button class=\"iphoneSettingsButton\" id=\"iphoneStraighten\" type=\"button\">Narovnat</button>",
    "    </div>",
    "    <h2 class=\"iphoneSettingsTitle\">Napojení AI aplikací</h2>",
    "    <input class=\"iphoneSettingsField\" id=\"iphoneAppName\" maxlength=\"48\" placeholder=\"Název aplikace\">",
    "    <input class=\"iphoneSettingsField\" id=\"iphoneAppUrl\" maxlength=\"500\" placeholder=\"https://... nebo odkaz aplikace\">",
    "    <div class=\"iphoneSettingsRow\" style=\"margin-top:8px\"><button class=\"iphoneSettingsButton primary\" id=\"iphoneAppAdd\" type=\"button\">Přidat do iPhonu</button></div>",
    "    <div id=\"iphoneAppList\" class=\"iphoneAppList\"></div>",
    "  </div>",
    "</div>"
  ].join("");

  document.head.appendChild(style);
  document.body.appendChild(phonePanel);

  phonePanel.querySelector(".iphoneSettingsClose").addEventListener("click", closeIPhoneSettings);
  phonePanel.addEventListener("click", event => {
    if (event.target === phonePanel) {
      closeIPhoneSettings();
    }
  });

  phonePanel.querySelector("#iphoneRotate").addEventListener("click", () => {
    phoneSettings.angle = normaliseAngle(phoneSettings.angle + Math.PI / 2);
    savePhoneSettings();
    renderIPhoneSettings();
  });

  phonePanel.querySelector("#iphoneStraighten").addEventListener("click", () => {
    phoneSettings.angle = 0;
    savePhoneSettings();
    renderIPhoneSettings();
  });

  phonePanel.querySelector("#iphoneAppAdd").addEventListener("click", addIPhoneApp);
  return phonePanel;
}

function renderIPhoneSettings() {
  const phonePanel = ensureIPhoneSettingsPanel();
  const state = phonePanel.querySelector("#iphoneSettingsState");
  const list = phonePanel.querySelector("#iphoneAppList");
  const appCount = phoneSettings.apps.length;
  const onlineText = navigator.onLine ? "PWA je online" : "PWA je bez připojení";

  state.textContent = onlineText + " · otočení je uložené · AI aplikace: " + appCount + "/" + PHONE_APP_LIMIT;
  list.replaceChildren();

  if (!appCount) {
    const empty = document.createElement("div");
    empty.className = "iphoneSettingsEmpty";
    empty.textContent = "Zatím tu nejsou žádné AI aplikace. Přidej název a její odkaz; CHT jej uloží pouze do tohoto iPhonu.";
    list.appendChild(empty);
    return;
  }

  phoneSettings.apps.forEach(app => {
    const item = document.createElement("div");
    const info = document.createElement("div");
    const name = document.createElement("strong");
    const url = document.createElement("span");
    const open = document.createElement("button");
    const remove = document.createElement("button");

    item.className = "iphoneAppItem";
    name.textContent = app.name || "AI aplikace";
    url.textContent = app.url || "Doplň odkaz";
    open.type = "button";
    open.textContent = "Otevřít";
    open.disabled = !isAllowedPhoneUrl(app.url);
    open.addEventListener("click", () => {
      if (isAllowedPhoneUrl(app.url)) {
        window.open(app.url, "_blank", "noopener");
      }
    });
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", "Odebrat " + (app.name || "aplikaci"));
    remove.addEventListener("click", () => {
      phoneSettings.apps = phoneSettings.apps.filter(entry => entry.id !== app.id);
      savePhoneSettings();
      renderIPhoneSettings();
    });

    info.append(name, url);
    item.append(info, open, remove);
    list.appendChild(item);
  });
}

function addIPhoneApp() {
  const phonePanel = ensureIPhoneSettingsPanel();
  const nameInput = phonePanel.querySelector("#iphoneAppName");
  const urlInput = phonePanel.querySelector("#iphoneAppUrl");
  const name = nameInput.value.trim();
  const url = urlInput.value.trim();

  if (!name || !isAllowedPhoneUrl(url)) {
    phonePanel.querySelector("#iphoneSettingsState").textContent = "Napiš název a platný odkaz aplikace.";
    return;
  }

  phoneSettings.apps.unshift({
    id: "app-" + Date.now(),
    name,
    url
  });
  phoneSettings.apps = phoneSettings.apps.slice(0, PHONE_APP_LIMIT);
  savePhoneSettings();
  nameInput.value = "";
  urlInput.value = "";
  renderIPhoneSettings();
}

function openIPhoneSettings() {
  const phonePanel = ensureIPhoneSettingsPanel();
  renderIPhoneSettings();
  phonePanel.classList.add("is-open");
}

function closeIPhoneSettings() {
  document.getElementById("iphoneSettingsPanel")?.classList.remove("is-open");
}

function drawIPhoneCore(core, time) {
  const position = getCorePosition(core);
  const scale = (.72 + position.depth * .40) * position.perspective;
  const radius = core.radius * scale;
  const phoneWidth = radius * 1.02;
  const phoneHeight = radius * 1.72;
  const phoneX = position.x - phoneWidth / 2;
  const phoneY = position.y - phoneHeight / 2;
  const pulse = .5 + (Math.sin(time * .0032) + 1) * .25;
  const online = navigator.onLine;
  const deviceStatus = phoneSettings.apps.length
    ? "AI · " + phoneSettings.apps.length
    : online ? "PWA · PŘIPOJENO" : "PWA · BEZ PŘIPOJENÍ";
  const anchor = getSceneAnchor();
  const hubX = anchor.centerX + scene.panX;
  const hubY = anchor.centerY + scene.panY;

  context.save();
  context.globalAlpha = .50 + position.depth * .50;

  const link = context.createLinearGradient(position.x, position.y, hubX, hubY);
  link.addColorStop(0, "rgba(244,50,58,.58)");
  link.addColorStop(.45, "rgba(238,238,238,.26)");
  link.addColorStop(1, "rgba(130,130,136,0)");
  context.strokeStyle = link;
  context.lineWidth = 1;
  context.setLineDash([3, 8]);
  context.beginPath();
  context.moveTo(position.x, position.y);
  context.lineTo(hubX, hubY);
  context.stroke();
  context.setLineDash([]);

  context.beginPath();
  context.arc(position.x, position.y, radius * 1.42 + Math.sin(time * .0024) * 2, 0, Math.PI * 2);
  context.strokeStyle = "rgba(242,56,64," + (.22 + pulse * .24) + ")";
  context.lineWidth = 1.25;
  context.stroke();

  const glow = context.createRadialGradient(position.x, position.y, 4, position.x, position.y, radius * 1.45);
  glow.addColorStop(0, "rgba(255,255,255,.16)");
  glow.addColorStop(.38, "rgba(237,43,53,.22)");
  glow.addColorStop(1, "rgba(237,43,53,0)");
  context.fillStyle = glow;
  context.beginPath();
  context.arc(position.x, position.y, radius * 1.45, 0, Math.PI * 2);
  context.fill();

  context.save();
  context.translate(position.x, position.y);
  context.rotate(phoneSettings.angle);
  context.translate(-position.x, -position.y);

  context.shadowColor = "rgba(0,0,0,.68)";
  context.shadowBlur = radius * .34;
  context.shadowOffsetY = radius * .14;
  roundedRectPath(phoneX, phoneY, phoneWidth, phoneHeight, radius * .19);
  context.fillStyle = "#d61f2b";
  context.fill();
  context.shadowColor = "transparent";

  roundedRectPath(phoneX + radius * .045, phoneY + radius * .045, phoneWidth - radius * .09, phoneHeight - radius * .09, radius * .16);
  const frame = context.createLinearGradient(phoneX, phoneY, phoneX + phoneWidth, phoneY + phoneHeight);
  frame.addColorStop(0, "#f24952");
  frame.addColorStop(.45, "#8e1018");
  frame.addColorStop(1, "#e82f3a");
  context.fillStyle = frame;
  context.fill();

  const screenInset = radius * .105;
  const screenX = phoneX + screenInset;
  const screenY = phoneY + screenInset;
  const screenWidth = phoneWidth - screenInset * 2;
  const screenHeight = phoneHeight - screenInset * 2;
  roundedRectPath(screenX, screenY, screenWidth, screenHeight, radius * .125);
  const screen = context.createLinearGradient(screenX, screenY, screenX, screenY + screenHeight);
  screen.addColorStop(0, "#25262a");
  screen.addColorStop(.48, "#070708");
  screen.addColorStop(1, "#17181b");
  context.fillStyle = screen;
  context.fill();
  context.strokeStyle = "rgba(255,255,255,.24)";
  context.lineWidth = .8;
  context.stroke();

  const notchWidth = screenWidth * .42;
  const notchHeight = radius * .095;
  roundedRectPath(position.x - notchWidth / 2, screenY + radius * .045, notchWidth, notchHeight, notchHeight / 2);
  context.fillStyle = "#050506";
  context.fill();
  context.fillStyle = "rgba(194,194,198,.72)";
  context.fillRect(position.x - notchWidth * .12, screenY + radius * .082, notchWidth * .24, 1);

  drawAppleMark(position.x, position.y - radius * .06, radius * .25);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#ffffff";
  context.font = "900 " + Math.max(7, Math.round(radius * .18)) + "px system-ui";
  context.fillText("CHT", position.x, position.y + radius * .29);
  context.fillStyle = "rgba(214,214,218,.84)";
  context.font = "700 " + Math.max(6, Math.round(radius * .11)) + "px system-ui";
  context.fillText("360°‰.", position.x, position.y + radius * .45);
  context.fillStyle = online ? "#f4f4f5" : "#a3a3a8";
  context.font = "700 " + Math.max(5, Math.round(radius * .085)) + "px system-ui";
  context.fillText(deviceStatus, position.x, phoneY + phoneHeight - radius * .20);

  context.fillStyle = "rgba(255,255,255,.68)";
  roundedRectPath(position.x - screenWidth * .16, phoneY + phoneHeight - radius * .12, screenWidth * .32, radius * .025, radius * .02);
  context.fill();

  context.restore();
  context.fillStyle = "#ffffff";
  context.font = "900 " + Math.max(8, Math.round(radius * .19)) + "px system-ui";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("iPhone 14", position.x, phoneY + phoneHeight + radius * .20);
  context.restore();

  core.position = position;
  core.drawRadius = Math.max(phoneWidth, phoneHeight) * .56;
}

function drawCore(core, time) {
  if (core.type === "iphone14") {
    drawIPhoneCore(core, time);
    return;
  }
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
  context.fillText(stats.used + "/" + SLOT_COUNT, position.x, position.y + 12);

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
  panel.dataset.chtCore = core.id;
  slotEditor.dataset.chtCore = core.id;
  delete slotEditor.dataset.chtSlot;

  panelTitle.textContent = `${core.title} · Paměť`;
  panelSub.textContent = SLOT_COUNT + " slotů · samostatné uložení";

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

  slotEditor.dataset.chtCore = selectedCore.id;
  slotEditor.dataset.chtSlot = String(index + 1);

  slotName.value = slot.name;
  slotContent.value = slot.content;

  renderGlyphDrums();
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
    `${selectedCore.title}: obsazeno ${stats.used}/${SLOT_COUNT} · ` +
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

function getGlyphTokenAt(value) {
  const tokens = getGlyphDrumTokens();

  return tokens[positiveModulo(value, tokens.length)] || "•";
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
    "Bubínek " + (index + 1) + ": " + token
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

function saveSelectedSlot(message = "uloženo", reason = "save") {
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
      "automaticky uloženo",
      "autosave"
    );
  }, 600);
}

function insertGlyphPhrase() {
  if (!selectedCore || selectedSlotIndex === null) {
    updateStatus("nejdřív vyber slot");
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
  saveSelectedSlot("glyph vložen a uložen", "glyph");
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
  saveSelectedSlot("uloženo", "save");
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

          return normaliseSlot(source, index);
        }
      );

      saveMemory();
      renderSlots();
      updateStatus("jádro importováno");
    } else {
      if (!data.cores) {
        throw new Error("Soubor neobsahuje celou Paměť");
      }

      const importedMemory = normaliseMemory(data);

      if (!importedMemory) {
        throw new Error("Soubor neobsahuje platnou Paměť");
      }

      writeMemoryCopies(importedMemory);
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
    hints[0].textContent = "1 prst: 3D otáčení";
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

    if (core?.type === "iphone14") {
      openIPhoneSettings();
    } else if (core) {
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
        "[CHT 360°‰.] Service worker se nepodařilo spustit.",
        error
      );
    }
  });
}





/* Veřejný most pro Mluvu: drží zápisy ve stejné živé Paměti jako otevřené CHT. */
function createMemoryBridgeSummary() {
  return {
    slotCount: SLOT_COUNT,
    updatedAt: memory.updatedAt,
    cores: cores.map((core) => {
      const slots = memory.cores[core.id] || [];
      const used = slots.filter(slotIsUsed).length;

      return {
        id: core.id,
        label: core.title,
        used,
        total: SLOT_COUNT
      };
    })
  };
}

function readMemoryBridgeSlot({ coreId = "language", slotId } = {}) {
  const safeCoreId = cores.some((core) => core.id === coreId) ? coreId : "language";
  const safeSlotId = Number.parseInt(slotId, 10);

  if (!Number.isInteger(safeSlotId) || safeSlotId < 1 || safeSlotId > SLOT_COUNT) {
    return null;
  }

  const slot = memory.cores[safeCoreId][safeSlotId - 1];

  return slot ? { ...slot } : null;
}

function writeMemoryBridgeSlot({
  coreId = "language",
  slotId,
  name = "",
  content = "",
  reason = "mluva"
} = {}) {
  const safeCoreId = cores.some((core) => core.id === coreId) ? coreId : "language";
  const safeSlotId = Number.parseInt(slotId, 10);

  if (!Number.isInteger(safeSlotId) || safeSlotId < 1 || safeSlotId > SLOT_COUNT) {
    throw new Error("Číslo slotu je mimo rozsah Paměti.");
  }

  const index = safeSlotId - 1;
  const finalName = String(name || "").trim() || "Slot " + safeSlotId;
  const finalContent = String(content || "");

  writeSlotValues(
    safeCoreId,
    index,
    finalName,
    finalContent,
    "Mluva uložila slot " + safeSlotId,
    reason
  );

  const slot = memory.cores[safeCoreId][index];

  window.dispatchEvent(
    new CustomEvent("cht.memory.changed", {
      detail: {
        reason,
        coreId: safeCoreId,
        slotId: safeSlotId,
        updatedAt: slot.updatedAt
      }
    })
  );

  return { ...slot };
}

window.CHT360Memory = Object.freeze({
  version: 1,
  slotCount: SLOT_COUNT,
  summary: createMemoryBridgeSummary,
  snapshot: () => JSON.parse(JSON.stringify(memory)),
  readSlot: readMemoryBridgeSlot,
  writeSlot: writeMemoryBridgeSlot
});

window.dispatchEvent(
  new CustomEvent("cht.memory.ready", {
    detail: createMemoryBridgeSummary()
  })
);

