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

const cores = [
  { id: "earth", title: "Země", subtitle: "Modeling, světy a úhel pohledu", angle: -Math.PI * .72, radius: 50 },
  { id: "language", title: "Jazyk", subtitle: "Písmena, symboly, glyphy a význam", angle: -Math.PI * .18, radius: 50 },
  { id: "game", title: "Hra", subtitle: "Pravidla, události a postup", angle: Math.PI * .34, radius: 50 },
  { id: "control", title: "Řízení", subtitle: "Směrování, jednotky a propojení", angle: Math.PI * .86, radius: 50 }
];

let memory = loadMemory();
let width = 0;
let height = 0;
let pixelRatio = 1;
let rotation = 0;
let rotationVelocity = .00055;
let selectedCore = null;
let selectedSlotIndex = null;
let dragging = false;
let movedDuringDrag = false;
let previousPointerX = 0;
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

function getCorePosition(core) {
  const rozlozeni = {
    earth:    { sloupec: 0, radek: 0 },
    language: { sloupec: 1, radek: 0 },
    game:     { sloupec: 0, radek: 1 },
    control:  { sloupec: 1, radek: 1 }
  };

  const misto = rozlozeni[core.id];
  const vzdalenost = 126;

  // Levý horní roh; pravý horní roh zůstává volný pro druhou skupinu.
  const levyOkraj = Math.max(
    86,
    Math.min(width * .10, width - vzdalenost - 70)
  );

  const horniOkraj = Math.max(
    92,
    Math.min(height * .22, height - vzdalenost - 70)
  );

  return {
    x: levyOkraj + misto.sloupec * vzdalenost,
    y: horniOkraj + misto.radek * vzdalenost,
    depth: .72
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

  for (let ring = 1; ring < 5; ring += 1) {
    context.beginPath();
    context.ellipse(
      position.x,
      position.y,
      radius,
      radius * ring / 5,
      0,
      0,
      Math.PI * 2
    );

    context.strokeStyle = `rgba(255,220,160,${active ? .30 : .17})`;
    context.lineWidth = .7;
    context.stroke();
  }

  for (let line = 0; line < 8; line += 1) {
    const angle = line / 8 * Math.PI;

    context.beginPath();
    context.ellipse(
      position.x,
      position.y,
      Math.abs(Math.cos(angle)) * radius,
      radius,
      0,
      0,
      Math.PI * 2
    );

    context.strokeStyle = `rgba(255,220,160,${active ? .25 : .13})`;
    context.lineWidth = .7;
    context.stroke();
  }

  const pulse = radius + 7 + Math.sin(time * .003 + core.angle) * 3;

  context.beginPath();
  context.arc(position.x, position.y, pulse, 0, Math.PI * 2);
  context.strokeStyle = active
    ? "rgba(255,235,195,.34)"
    : "rgba(255,220,160,.10)";
  context.stroke();

  context.fillStyle = "#fff0cf";
  context.font = `800 ${Math.round(11 * scale)}px system-ui`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(core.title, position.x, position.y - 4);

  const stats = getCoreStats(core.id);

  context.fillStyle = "rgba(255,240,210,.65)";
  context.font = `${Math.max(8, Math.round(9 * scale))}px system-ui`;
  context.fillText(`${stats.used}/70`, position.x, position.y + 12);

  context.restore();

  core.position = position;
  core.drawRadius = radius;
}

function render(time) {
  context.clearRect(0, 0, width, height);

  drawBackground();
  drawTerraAxis(time);

  const ordered = [...cores].sort((first, second) => {
    return getCorePosition(first).depth - getCorePosition(second).depth;
  });

  for (const core of ordered) {
    drawCore(core, time);
  }

  if (!dragging) {
    rotation += rotationVelocity;
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

canvas.addEventListener("pointerdown", (event) => {
  dragging = true;
  movedDuringDrag = false;
  previousPointerX = event.clientX;

  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (!dragging) {
    return;
  }

  const deltaX = event.clientX - previousPointerX;

  if (Math.abs(deltaX) > 2) {
    movedDuringDrag = true;
  }

  rotation += deltaX * .007;
  previousPointerX = event.clientX;
});

canvas.addEventListener("pointerup", (event) => {
  const bounds = canvas.getBoundingClientRect();
  const x = event.clientX - bounds.left;
  const y = event.clientY - bounds.top;

  dragging = false;

  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }

  if (!movedDuringDrag) {
    const core = findCoreAt(x, y);

    if (core) {
      openCore(core);
    }
  }
});

canvas.addEventListener("pointercancel", () => {
  dragging = false;
});

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
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
        "[360°‰.] Service worker se nepodařilo spustit.",
        error
      );
    }
  });
}