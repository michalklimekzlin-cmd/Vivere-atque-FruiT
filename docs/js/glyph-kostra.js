"use strict";

/*
  CHT Glyph Drums v1
  ------------------
  Samostatná kostra bubínků. Nezná Paměť ani kreslicí plátno – s nimi
  komunikuje jen přes DOM a události. Díky tomu ji lze později připojit
  ke koulím, slotům, zvuku i dalším modulům bez přepisování jádra.
*/

const CHT_GLYPH_DRUMS_STORAGE_KEY = "cht360_glyph_drums_kostra_v1";
const CHT_GLYPH_DRUMS_MAX_DRUMS = 12;
const CHT_GLYPH_DRUMS_MAX_CUSTOM = 64;

const CHT_GLYPH_DRUMS_BASE_TOKENS = Object.freeze([
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  ..."0123456789",
  "Á", "Č", "Ď", "É", "Ě", "Í", "Ň", "Ó", "Ř", "Š", "Ť", "Ú", "Ů", "Ý",
  "ア", "°", "‰", "•", "_", "-", "/", "`", "´", "ˇ", "ī", "ı",
  "ï", "ø", "Ō", "Ï", "¯", "&", "(", ")", "*", "}", "{", "₹",
  "7i_", "ī´", "ˇ°i°ˇ", "._;´/`", ",!", "ïø", "°Ō°", ".•cU•.",
  "-:x:-", "7/¯", "ı>o", "°&", "(\\*/)", "Ïo", "}{", "•N", "7₹"
]);

/* Hravé znaky se přidají pouze v dětském režimu Kokinka. */
const CHT_GLYPH_DRUMS_KOKINKA_TOKENS = Object.freeze([
  "☼", "✦", "♥", "☺", "☁", "✿", "●", "○", "☆", "☘"
]);

const glyphDrumsUi = {
  panel: document.getElementById("glyphLab"),
  open: document.getElementById("openGlyphLab"),
  close: document.getElementById("closeGlyphLab"),
  rack: document.getElementById("glyphIndexRack"),
  add: document.getElementById("glyphKitAddDrum"),
  remove: document.getElementById("glyphKitRemoveDrum"),
  rotateLeft: document.getElementById("glyphSphereLeft"),
  rotateRight: document.getElementById("glyphSphereRight"),
  sphere: document.getElementById("glyphSphere"),
  sphereTokens: document.getElementById("glyphSphereTokens"),
  sphereValue: document.getElementById("glyphSphereValue"),
  custom: document.getElementById("glyphKitCustom"),
  addGlyph: document.getElementById("glyphKitAddGlyph"),
  insert: document.getElementById("glyphKitInsert"),
  mode: document.getElementById("glyphKitMode"),
  status: document.getElementById("glyphKitStatus")
};

function glyphDrumsPositiveModulo(value, divisor) {
  if (!Number.isFinite(value) || !Number.isFinite(divisor) || divisor <= 0) {
    return 0;
  }

  return ((value % divisor) + divisor) % divisor;
}

function glyphDrumsInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : fallback;
}

function glyphDrumsSafeToken(value) {
  return String(value || "").trim().slice(0, 24);
}

function glyphDrumsTokenPoolFor(mode, customTokens) {
  return [
    ...CHT_GLYPH_DRUMS_BASE_TOKENS,
    ...(mode === "kokinka" ? CHT_GLYPH_DRUMS_KOKINKA_TOKENS : []),
    ...customTokens
  ];
}

function glyphDrumsNewId(position) {
  return "drum-" + String(position).padStart(2, "0") + "-" +
    Math.random().toString(36).slice(2, 7);
}

function glyphDrumsCreateDefaultKit() {
  const pool = glyphDrumsTokenPoolFor("cht", []);
  const defaults = ["7i_", "ī´", "ˇ°i°ˇ", ".•cU•."];

  return {
    version: 1,
    mode: "cht",
    sphereTurn: 0,
    customTokens: [],
    drums: defaults.map((token, index) => ({
      id: "drum-" + String(index + 1).padStart(2, "0"),
      index: index + 1,
      tokenIndex: Math.max(0, pool.indexOf(token))
    }))
  };
}

function glyphDrumsNormaliseKit(candidate) {
  if (!candidate || typeof candidate !== "object") {
    return glyphDrumsCreateDefaultKit();
  }

  const mode = candidate.mode === "kokinka" ? "kokinka" : "cht";
  const customTokens = Array.isArray(candidate.customTokens)
    ? candidate.customTokens
      .map(glyphDrumsSafeToken)
      .filter(Boolean)
      .filter((token, index, array) => array.indexOf(token) === index)
      .slice(-CHT_GLYPH_DRUMS_MAX_CUSTOM)
    : [];
  const pool = glyphDrumsTokenPoolFor(mode, customTokens);
  const rawDrums = Array.isArray(candidate.drums)
    ? candidate.drums.slice(0, CHT_GLYPH_DRUMS_MAX_DRUMS)
    : [];
  const drums = rawDrums.map((drum, position) => ({
    id: typeof drum?.id === "string" && drum.id
      ? drum.id.slice(0, 80)
      : glyphDrumsNewId(position + 1),
    index: position + 1,
    tokenIndex: glyphDrumsPositiveModulo(
      glyphDrumsInteger(drum?.tokenIndex),
      pool.length
    )
  }));

  if (!drums.length) {
    return glyphDrumsCreateDefaultKit();
  }

  return {
    version: 1,
    mode,
    sphereTurn: glyphDrumsPositiveModulo(
      glyphDrumsInteger(candidate.sphereTurn),
      360
    ),
    customTokens,
    drums
  };
}

function glyphDrumsLoadKit() {
  try {
    return glyphDrumsNormaliseKit(
      JSON.parse(localStorage.getItem(CHT_GLYPH_DRUMS_STORAGE_KEY) || "null")
    );
  } catch {
    return glyphDrumsCreateDefaultKit();
  }
}

let glyphDrumsKit = glyphDrumsLoadKit();

function glyphDrumsSaveKit() {
  try {
    localStorage.setItem(
      CHT_GLYPH_DRUMS_STORAGE_KEY,
      JSON.stringify(glyphDrumsKit)
    );
  } catch {
    /* Bubínky zůstanou použitelné i v omezeném soukromém režimu Safari. */
  }
}

function glyphDrumsPool() {
  return glyphDrumsTokenPoolFor(
    glyphDrumsKit.mode,
    glyphDrumsKit.customTokens
  );
}

function glyphDrumsCurrentToken(drum) {
  const pool = glyphDrumsPool();
  return pool[glyphDrumsPositiveModulo(drum?.tokenIndex || 0, pool.length)] || "•";
}

function glyphDrumsPhrase() {
  return glyphDrumsKit.drums.map(glyphDrumsCurrentToken).join("");
}

function glyphDrumsSnapshot() {
  return {
    version: glyphDrumsKit.version,
    mode: glyphDrumsKit.mode,
    sphereTurn: glyphDrumsKit.sphereTurn,
    customTokens: [...glyphDrumsKit.customTokens],
    drums: glyphDrumsKit.drums.map(drum => ({ ...drum, token: glyphDrumsCurrentToken(drum) })),
    phrase: glyphDrumsPhrase()
  };
}

function glyphDrumsNotify(reason) {
  window.dispatchEvent(new CustomEvent("cht.glyph.drums.changed", {
    detail: { reason, ...glyphDrumsSnapshot() }
  }));
}

function glyphDrumsSetStatus(message) {
  if (glyphDrumsUi.status) {
    glyphDrumsUi.status.textContent = message;
  }
}

function glyphDrumsFind(id) {
  return glyphDrumsKit.drums.find(drum => drum.id === id) || null;
}

function glyphDrumsStep(id, amount, reason = "otočení") {
  const drum = glyphDrumsFind(id);
  const pool = glyphDrumsPool();

  if (!drum || !pool.length) {
    return null;
  }

  drum.tokenIndex = glyphDrumsPositiveModulo(
    drum.tokenIndex + glyphDrumsInteger(amount),
    pool.length
  );
  glyphDrumsSaveKit();
  glyphDrumsRender();
  glyphDrumsNotify(reason);
  return { ...drum, token: glyphDrumsCurrentToken(drum) };
}

function glyphDrumsRotateSphere(amount, reason = "otočení koule") {
  const step = glyphDrumsInteger(amount);

  if (!step) {
    return;
  }

  const pool = glyphDrumsPool();
  glyphDrumsKit.sphereTurn = glyphDrumsPositiveModulo(
    glyphDrumsKit.sphereTurn + step * 14,
    360
  );

  glyphDrumsKit.drums.forEach(drum => {
    drum.tokenIndex = glyphDrumsPositiveModulo(drum.tokenIndex + step, pool.length);
  });

  glyphDrumsSaveKit();
  glyphDrumsRender();
  glyphDrumsNotify(reason);
}

function glyphDrumsAddDrum(token) {
  if (glyphDrumsKit.drums.length >= CHT_GLYPH_DRUMS_MAX_DRUMS) {
    glyphDrumsSetStatus("Koule má zatím maximum 12 bubínků.");
    return null;
  }

  const pool = glyphDrumsPool();
  const exactTokenIndex = typeof token === "string" ? pool.indexOf(token) : -1;
  const last = glyphDrumsKit.drums[glyphDrumsKit.drums.length - 1];
  const drum = {
    id: glyphDrumsNewId(glyphDrumsKit.drums.length + 1),
    index: glyphDrumsKit.drums.length + 1,
    tokenIndex: exactTokenIndex >= 0
      ? exactTokenIndex
      : glyphDrumsPositiveModulo((last?.tokenIndex || 0) + 1, pool.length)
  };

  glyphDrumsKit.drums.push(drum);
  glyphDrumsSaveKit();
  glyphDrumsRender();
  glyphDrumsSetStatus("Přidán bubínek #" + String(drum.index).padStart(2, "0") + ".");
  glyphDrumsNotify("přidán bubínek");
  return { ...drum, token: glyphDrumsCurrentToken(drum) };
}

function glyphDrumsRemoveLast() {
  if (glyphDrumsKit.drums.length <= 1) {
    glyphDrumsSetStatus("Poslední bubínek nechávám jako základ koule.");
    return false;
  }

  glyphDrumsKit.drums.pop();
  glyphDrumsSaveKit();
  glyphDrumsRender();
  glyphDrumsSetStatus("Poslední bubínek je odpojený, ale není smazán z Paměti.");
  glyphDrumsNotify("odpojen bubínek");
  return true;
}

function glyphDrumsAddCustomGlyph(rawToken) {
  const token = glyphDrumsSafeToken(rawToken);

  if (!token) {
    glyphDrumsSetStatus("Napiš nejdřív glyph nebo vlastní znak.");
    return null;
  }

  const basePool = glyphDrumsTokenPoolFor(glyphDrumsKit.mode, []);

  if (!basePool.includes(token) && !glyphDrumsKit.customTokens.includes(token)) {
    glyphDrumsKit.customTokens.push(token);
    glyphDrumsKit.customTokens = glyphDrumsKit.customTokens.slice(
      -CHT_GLYPH_DRUMS_MAX_CUSTOM
    );
  }

  const added = glyphDrumsAddDrum(token);

  if (!added) {
    const last = glyphDrumsKit.drums[glyphDrumsKit.drums.length - 1];
    const tokenIndex = glyphDrumsPool().indexOf(token);

    if (last && tokenIndex >= 0) {
      last.tokenIndex = tokenIndex;
      glyphDrumsSaveKit();
      glyphDrumsRender();
      glyphDrumsNotify("přidán glyph");
    }
  }

  if (glyphDrumsUi.custom) {
    glyphDrumsUi.custom.value = "";
  }

  glyphDrumsSetStatus("Glyph „" + token + "“ je na bubínku a v kouli.");
  return token;
}

function glyphDrumsSetMode(mode) {
  glyphDrumsKit.mode = mode === "kokinka" ? "kokinka" : "cht";
  const pool = glyphDrumsPool();

  glyphDrumsKit.drums.forEach(drum => {
    drum.tokenIndex = glyphDrumsPositiveModulo(drum.tokenIndex, pool.length);
  });

  glyphDrumsSaveKit();
  glyphDrumsRender();
  glyphDrumsSetStatus(
    glyphDrumsKit.mode === "kokinka"
      ? "Kokinka: hravý dětský režim je zapnutý."
      : "CHT: noční režim je zpět."
  );
  glyphDrumsNotify("změna režimu");
}

function glyphDrumsInsertIntoSlot() {
  const content = document.getElementById("slotContent");
  const editor = document.getElementById("slotEditor");
  const save = document.getElementById("saveSlot");
  const phrase = glyphDrumsPhrase();

  if (!content || !editor?.classList.contains("open")) {
    glyphDrumsSetStatus("Nejdřív otevři slot — pak koule vloží šifru přímo do něj.");
    return false;
  }

  const start = Number.isFinite(content.selectionStart)
    ? content.selectionStart
    : content.value.length;
  const end = Number.isFinite(content.selectionEnd)
    ? content.selectionEnd
    : start;

  content.value = content.value.slice(0, start) + phrase + content.value.slice(end);
  const cursor = start + phrase.length;
  content.focus();
  content.setSelectionRange(cursor, cursor);
  content.dispatchEvent(new Event("input", { bubbles: true }));
  save?.click();
  glyphDrumsSetStatus("Koule vložena do slotu a ihned uložená.");
  glyphDrumsNotify("glyph vložen do slotu");
  return true;
}

function glyphDrumsButton(text, label, handler, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", handler);
  return button;
}

function glyphDrumsAttachDrumDrag(reel, drumId) {
  let drag = null;

  reel.addEventListener("pointerdown", event => {
    event.preventDefault();
    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      lastStep: 0,
      moved: false
    };
    reel.setPointerCapture(event.pointerId);
    reel.classList.add("is-dragging");
  });

  reel.addEventListener("pointermove", event => {
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const nextStep = Math.trunc((event.clientX - drag.startX) / 18);

    if (nextStep === drag.lastStep) {
      return;
    }

    glyphDrumsStep(drumId, nextStep - drag.lastStep, "tažení bubínku");
    drag.lastStep = nextStep;
    drag.moved = true;
  });

  const finish = (event, cancelled = false) => {
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    if (!cancelled && !drag.moved) {
      glyphDrumsStep(drumId, 1, "klepnutí bubínku");
    }

    if (reel.hasPointerCapture(event.pointerId)) {
      reel.releasePointerCapture(event.pointerId);
    }

    drag = null;
    reel.classList.remove("is-dragging");
  };

  reel.addEventListener("pointerup", event => finish(event));
  reel.addEventListener("pointercancel", event => finish(event, true));
  reel.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      glyphDrumsStep(drumId, -1, "klávesa vlevo");
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      glyphDrumsStep(drumId, 1, "klávesa vpravo");
    }
  });
}

function glyphDrumsRenderRack() {
  const rack = glyphDrumsUi.rack;

  if (!rack) {
    return;
  }

  rack.textContent = "";

  glyphDrumsKit.drums.forEach(drum => {
    const card = document.createElement("article");
    const number = document.createElement("span");
    const reel = document.createElement("button");
    const previous = document.createElement("span");
    const current = document.createElement("strong");
    const next = document.createElement("span");
    const token = glyphDrumsCurrentToken(drum);
    const pool = glyphDrumsPool();

    card.className = "indexedDrum";
    card.dataset.drumId = drum.id;
    number.className = "indexedDrumNumber";
    number.textContent = "#" + String(drum.index).padStart(2, "0");

    reel.type = "button";
    reel.className = "indexedDrumReel";
    reel.setAttribute("aria-label", "Bubínek " + drum.index + ": " + token);
    reel.title = "Táhni vlevo nebo vpravo";

    previous.className = "indexedDrumGhost";
    previous.textContent = pool[glyphDrumsPositiveModulo(drum.tokenIndex - 1, pool.length)];
    current.textContent = token;
    next.className = "indexedDrumGhost";
    next.textContent = pool[glyphDrumsPositiveModulo(drum.tokenIndex + 1, pool.length)];
    reel.append(previous, current, next);

    card.append(
      number,
      glyphDrumsButton("‹", "Bubínek " + drum.index + " doleva", () => {
        glyphDrumsStep(drum.id, -1, "bubínek doleva");
      }, "indexedDrumArrow"),
      reel,
      glyphDrumsButton("›", "Bubínek " + drum.index + " doprava", () => {
        glyphDrumsStep(drum.id, 1, "bubínek doprava");
      }, "indexedDrumArrow")
    );

    rack.appendChild(card);
    glyphDrumsAttachDrumDrag(reel, drum.id);
  });
}

function glyphDrumsRenderSphere() {
  const tokensRoot = glyphDrumsUi.sphereTokens;
  const sphere = glyphDrumsUi.sphere;

  if (!tokensRoot || !sphere) {
    return;
  }

  tokensRoot.textContent = "";
  const count = glyphDrumsKit.drums.length || 1;
  const baseTurn = glyphDrumsKit.sphereTurn * Math.PI / 180;

  glyphDrumsKit.drums.forEach((drum, index) => {
    const phase = baseTurn + index / count * Math.PI * 2;
    const depth = (Math.cos(phase) + 1) / 2;
    const x = 50 + Math.sin(phase) * (20 + depth * 17);
    const y = 50 + Math.cos(phase) * 24;
    const token = document.createElement("span");

    token.className = "glyphSphereToken";
    token.textContent = glyphDrumsCurrentToken(drum);
    token.style.left = x.toFixed(2) + "%";
    token.style.top = y.toFixed(2) + "%";
    token.style.opacity = (0.35 + depth * 0.65).toFixed(2);
    token.style.zIndex = String(2 + Math.round(depth * 12));
    token.style.transform = "translate(-50%, -50%) scale(" +
      (0.72 + depth * 0.46).toFixed(2) + ")";
    tokensRoot.appendChild(token);
  });

  if (glyphDrumsUi.sphereValue) {
    glyphDrumsUi.sphereValue.textContent = glyphDrumsPhrase() || "•";
  }
}

function glyphDrumsRender() {
  const isKokinka = glyphDrumsKit.mode === "kokinka";

  glyphDrumsUi.panel?.classList.toggle("is-kokinka", isKokinka);

  if (glyphDrumsUi.mode) {
    glyphDrumsUi.mode.textContent = isKokinka
      ? "CHT · noční režim"
      : "Kokinka · dětský režim";
  }

  glyphDrumsRenderRack();
  glyphDrumsRenderSphere();
}

function glyphDrumsAttachSphereDrag() {
  const sphere = glyphDrumsUi.sphere;

  if (!sphere) {
    return;
  }

  let drag = null;

  sphere.addEventListener("pointerdown", event => {
    event.preventDefault();
    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      lastStep: 0,
      moved: false
    };
    sphere.setPointerCapture(event.pointerId);
    sphere.classList.add("is-dragging");
  });

  sphere.addEventListener("pointermove", event => {
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const nextStep = Math.trunc((event.clientX - drag.startX) / 24);

    if (nextStep === drag.lastStep) {
      return;
    }

    glyphDrumsRotateSphere(nextStep - drag.lastStep, "tažení glyphové koule");
    drag.lastStep = nextStep;
    drag.moved = true;
  });

  const finish = (event, cancelled = false) => {
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    if (!cancelled && !drag.moved) {
      glyphDrumsRotateSphere(1, "klepnutí na kouli");
    }

    if (sphere.hasPointerCapture(event.pointerId)) {
      sphere.releasePointerCapture(event.pointerId);
    }

    drag = null;
    sphere.classList.remove("is-dragging");
  };

  sphere.addEventListener("pointerup", event => finish(event));
  sphere.addEventListener("pointercancel", event => finish(event, true));
}

function glyphDrumsSetPanelOpen(open) {
  glyphDrumsUi.panel?.classList.toggle("open", open);
  glyphDrumsUi.panel?.setAttribute("aria-hidden", String(!open));

  if (open) {
    glyphDrumsRender();
    glyphDrumsSetStatus("Každý bubínek má svůj index. Táhni nebo použij šipky.");
  }
}

function glyphDrumsInitialise() {
  if (!glyphDrumsUi.panel || !glyphDrumsUi.rack) {
    return;
  }

  glyphDrumsUi.open?.addEventListener("click", () => glyphDrumsSetPanelOpen(true));
  glyphDrumsUi.close?.addEventListener("click", () => glyphDrumsSetPanelOpen(false));
  glyphDrumsUi.add?.addEventListener("click", () => glyphDrumsAddDrum());
  glyphDrumsUi.remove?.addEventListener("click", glyphDrumsRemoveLast);
  glyphDrumsUi.rotateLeft?.addEventListener("click", () => {
    glyphDrumsRotateSphere(-1, "koule doleva");
  });
  glyphDrumsUi.rotateRight?.addEventListener("click", () => {
    glyphDrumsRotateSphere(1, "koule doprava");
  });
  glyphDrumsUi.addGlyph?.addEventListener("click", () => {
    glyphDrumsAddCustomGlyph(glyphDrumsUi.custom?.value);
  });
  glyphDrumsUi.custom?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      glyphDrumsAddCustomGlyph(glyphDrumsUi.custom.value);
    }
  });
  glyphDrumsUi.insert?.addEventListener("click", glyphDrumsInsertIntoSlot);
  glyphDrumsUi.mode?.addEventListener("click", () => {
    glyphDrumsSetMode(glyphDrumsKit.mode === "kokinka" ? "cht" : "kokinka");
  });

  glyphDrumsAttachSphereDrag();
  glyphDrumsRender();

  window.CHTGlyphDrums = Object.freeze({
    version: 1,
    list: () => glyphDrumsSnapshot(),
    phrase: () => glyphDrumsPhrase(),
    step: (id, amount) => glyphDrumsStep(id, amount, "externí napojení"),
    rotate: amount => glyphDrumsRotateSphere(amount, "externí otočení koule"),
    add: token => glyphDrumsAddCustomGlyph(token),
    insert: () => glyphDrumsInsertIntoSlot(),
    setMode: mode => glyphDrumsSetMode(mode)
  });

  window.dispatchEvent(new CustomEvent("cht.glyph.drums.ready", {
    detail: window.CHTGlyphDrums
  }));
}

glyphDrumsInitialise();
