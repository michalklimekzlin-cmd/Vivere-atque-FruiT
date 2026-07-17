/*
 * CHT 360°‰. — most mezi hlavní Pamětí a dílnou Glyphů.
 *
 * Most pracuje jen uvnitř stejného prohlížeče a stejné domény. Do Paměti
 * zapíše pouze řádek, který uživatel výslovně odešle z dílny.
 */
(function () {
  "use strict";

  const MEMORY_KEY = "cht360_pamet_v1";
  const LEGACY_MEMORY_KEY = "vaft_pamet_v1";
  const CONTEXT_KEY = "cht360_glyph_context_v1";
  const TRANSFER_KEY = "cht360_glyph_transfer_v1";
  const APPLIED_KEY = "cht360_glyph_transfer_applied_v1";
  const NOTICE_KEY = "cht360_glyph_bridge_notice_v1";
  const CORE_NAMES = Object.freeze({
    earth: "Země",
    language: "Jazyk",
    game: "Hra",
    control: "Řízení"
  });

  function readJson(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value && typeof value === "object" ? value : null;
    } catch (error) {
      return null;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function validTarget(coreId, slotId) {
    return Boolean(CORE_NAMES[coreId]) &&
      Number.isInteger(Number(slotId)) &&
      Number(slotId) >= 1 &&
      Number(slotId) <= 70;
  }

  function readAppliedIds() {
    const value = readJson(APPLIED_KEY);
    return Array.isArray(value?.ids) ? value.ids.map(String).slice(-40) : [];
  }

  function wasApplied(id) {
    return readAppliedIds().includes(String(id || ""));
  }

  function markApplied(id) {
    const ids = readAppliedIds().filter((item) => item !== String(id));
    ids.push(String(id));
    writeJson(APPLIED_KEY, { ids: ids.slice(-40), updatedAt: new Date().toISOString() });
  }

  function setNotice(message) {
    try {
      sessionStorage.setItem(NOTICE_KEY, String(message || ""));
    } catch (error) {
      /* Oznámení nesmí blokovat samotný přenos. */
    }
  }

  function showNotice() {
    let message = "";

    try {
      message = sessionStorage.getItem(NOTICE_KEY) || "";
      sessionStorage.removeItem(NOTICE_KEY);
    } catch (error) {
      return;
    }

    if (!message) return;

    window.setTimeout(() => {
      const status = document.getElementById("statusBox");
      if (status) status.textContent = message;
    }, 180);
  }

  function mergeTransfer(transfer) {
    if (!transfer || transfer.schema !== "cht360-glyph-transfer-v1") {
      return { ok: false, reason: "invalid-transfer" };
    }

    const coreId = String(transfer.coreId || "");
    const slotId = Number(transfer.slotId);
    const text = String(transfer.text || "").trim();

    if (!validTarget(coreId, slotId) || !text) {
      return { ok: false, reason: "invalid-target" };
    }

    const memory = readJson(MEMORY_KEY) || readJson(LEGACY_MEMORY_KEY);
    const slots = memory?.cores?.[coreId];
    const index = slotId - 1;

    if (!Array.isArray(slots) || !slots[index] || typeof slots[index] !== "object") {
      return { ok: false, reason: "missing-memory" };
    }

    const slot = slots[index];
    const current = String(slot.content || "");
    const mode = transfer.mode === "replace" ? "replace" : "append";
    const next = mode === "replace"
      ? text
      : (current ? current.replace(/\s*$/u, "") + "\n" + text : text);

    slot.content = next;
    slot.updatedAt = new Date().toISOString();
    memory.updatedAt = slot.updatedAt;

    if (!writeJson(MEMORY_KEY, memory)) {
      return { ok: false, reason: "storage-failed" };
    }

    /* Starší kostry Paměti ještě čtou záložní klíč, proto ho držíme shodný. */
    writeJson(LEGACY_MEMORY_KEY, memory);

    return {
      ok: true,
      coreId,
      slotId,
      mode,
      name: String(transfer.name || "Glyph")
    };
  }

  function applyPendingTransfer() {
    const transfer = readJson(TRANSFER_KEY);

    if (!transfer?.id || wasApplied(transfer.id)) return false;

    const result = mergeTransfer(transfer);
    if (!result.ok) return false;

    markApplied(transfer.id);
    localStorage.removeItem(TRANSFER_KEY);

    const message =
      "Glyph „" +
      result.name +
      "“ je " +
      (result.mode === "replace" ? "vložený do" : "přidaný do") +
      " " +
      CORE_NAMES[result.coreId] +
      " · slotu " +
      result.slotId +
      ".";

    setNotice(message);

    /*
     * Hlavní aplikace načítá Paměť při startu. Jedno bezpečné obnovení jí
     * předá nový obsah bez sahání do jejích vnitřních proměnných.
     */
    window.setTimeout(() => window.location.reload(), 25);
    return true;
  }

  function targetFromEditor() {
    const editor = document.getElementById("slotEditor");
    const coreId = String(editor?.dataset?.chtCore || "");
    const slotId = Number(editor?.dataset?.chtSlot);

    if (!validTarget(coreId, slotId)) return null;
    return { coreId, slotId };
  }

  function setStatus(message) {
    const status = document.getElementById("statusBox");
    if (status) status.textContent = message;
  }

  function openWorkshop() {
    const target = targetFromEditor();

    if (!target) {
      setStatus("Nejdřív otevři jádro a vyber konkrétní slot. Potom lze spustit dílnu bubínků.");
      return;
    }

    const context = {
      schema: "cht360-glyph-context-v1",
      source: "cht360",
      coreId: target.coreId,
      slotId: target.slotId,
      returnTo: "../index.html",
      createdAt: new Date().toISOString()
    };

    if (!writeJson(CONTEXT_KEY, context)) {
      setStatus("Dílnu teď nelze propojit, protože prohlížeč odmítl lokální uložení.");
      return;
    }

    const url = new URL("./glyph-cht-360/", window.location.href);
    url.searchParams.set("core", context.coreId);
    url.searchParams.set("slot", String(context.slotId));
    url.searchParams.set("returnTo", context.returnTo);
    window.location.assign(url.href);
  }

  function installLauncher() {
    const actions = document.querySelector(".glyphActions");
    if (!actions || document.getElementById("glyphOpenWorkshop")) return;

    const button = document.createElement("button");
    button.id = "glyphOpenWorkshop";
    button.type = "button";
    button.textContent = "Otevřít dílnu";
    button.title = "Otevřít Glyph CHT pro právě vybraný slot";
    button.addEventListener("click", openWorkshop);
    actions.append(button);
  }

  function openMluva() {
    const url = new URL("./mluva-cht-360/", window.location.href);
    window.location.assign(url.href);
  }

  function installMluvaLauncher() {
    const actions = document.querySelector(".glyphActions");
    if (!actions || document.getElementById("openChtMluva")) return;

    const button = document.createElement("button");
    button.id = "openChtMluva";
    button.type = "button";
    button.textContent = "Mluva";
    button.title = "Otevřít offline Mluvu CHT";
    button.addEventListener("click", openMluva);
    actions.append(button);
  }

  function initialise() {
    if (applyPendingTransfer()) return;
    installLauncher();
    installMluvaLauncher();
    showNotice();
  }

  window.CHTGlyphBridge = {
    open: openWorkshop,
    openMluva,
    apply: applyPendingTransfer,
    target: targetFromEditor,
    keys: {
      context: CONTEXT_KEY,
      transfer: TRANSFER_KEY
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise, { once: true });
  } else {
    initialise();
  }
})();
