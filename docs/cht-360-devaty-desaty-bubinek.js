"use strict";

/* CHT 360°‰. — připojitelný devátý a desátý bubínek. */
(() => {
  const ROOT = "cht360-oblouk-osmi-zamku";
  const STATE = "cht360_extra_bubinky_v1";
  const AI_STATE = "cht360_ai_brana_v1";
  const PANEL = "cht360-ai-brana-panel";
  const DRUMS = [
    { label: "Ladění", glyphs: ["⌁", "⚙", "•ア", "°"], action: "debug" },
    { label: "A|lı.", glyphs: ["🫡°)", "🫡°)7/", "谷", "す", "宇"], action: "ai" }
  ];
  const SMILE = [0, 8, 17, 25, 25, 17, 8, 0];
  const mod = (value, size) => ((value % size) + size) % size;
  const json = key => { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (_) { return null; } };
  let state = json(STATE) || { version: 1, indices: [0, 0], history: [] };
  state.indices = Array.isArray(state.indices) ? [Number(state.indices[0]) || 0, Number(state.indices[1]) || 0] : [0, 0];
  let ai = json(AI_STATE) || { version: 1, status: "odpojeno", provider: "", activeGlyph: DRUMS[1].glyphs[0] };

  const glyph = index => DRUMS[index].glyphs[mod(state.indices[index], DRUMS[index].glyphs.length)];
  function save(reason) {
    state.updatedAt = new Date().toISOString();
    try { localStorage.setItem(STATE, JSON.stringify(state)); } catch (_) {}
    window.dispatchEvent(new CustomEvent("cht.extra.drum.changed", { detail: { reason, values: [glyph(0), glyph(1)] } }));
  }
  function saveAI(reason) {
    ai.updatedAt = new Date().toISOString();
    try { localStorage.setItem(AI_STATE, JSON.stringify({ ...ai, reason })); } catch (_) {}
    window.dispatchEvent(new CustomEvent("cht.ai.bridge.changed", { detail: { ...ai, reason, source: "cht360-devaty-desaty-bubinek" } }));
  }
  function step(index, amount, button) {
    state.indices[index] = mod(state.indices[index] + amount, DRUMS[index].glyphs.length);
    state.history = [...(Array.isArray(state.history) ? state.history : []), { at: new Date().toISOString(), glyph: glyph(index), index }].slice(-8);
    if (index === 1) { ai.activeGlyph = glyph(index); saveAI("změna glyphu A|lı."); }
    save("otočení bubínku");
    paint(button, index);
  }
  function paint(button, index) {
    const values = DRUMS[index].glyphs, at = state.indices[index];
    button.dataset.size = Array.from(glyph(index)).length > 3 ? "wide" : Array.from(glyph(index)).length > 1 ? "medium" : "normal";
    button.querySelector("[data-reel='prev']").textContent = values[mod(at - 1, values.length)];
    button.querySelector("[data-reel='now']").textContent = glyph(index);
    button.querySelector("[data-reel='next']").textContent = values[mod(at + 1, values.length)];
  }
  function open(index) {
    if (DRUMS[index].action === "debug") {
      if (window.CHT360UI?.openDebug) window.CHT360UI.openDebug();
      else window.dispatchEvent(new CustomEvent("cht.ui.debug.open"));
      return;
    }
    openAI();
  }
  function bind(button, index) {
    let drag;
    button.addEventListener("pointerdown", event => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault(); event.stopPropagation();
      drag = { id: event.pointerId, y: event.clientY, step: 0, moved: false };
      button.setPointerCapture?.(event.pointerId); button.classList.add("is-dragging");
    });
    button.addEventListener("pointermove", event => {
      if (!drag || drag.id !== event.pointerId) return;
      const next = Math.trunc((drag.y - event.clientY) / 18);
      if (next === drag.step) return;
      step(index, next - drag.step, button); drag.step = next; drag.moved = true;
    });
    const finish = event => {
      if (!drag || drag.id !== event.pointerId) return;
      button.releasePointerCapture?.(event.pointerId); const moved = drag.moved; drag = null; button.classList.remove("is-dragging");
      if (!moved) open(index);
    };
    button.addEventListener("pointerup", finish); button.addEventListener("pointercancel", finish);
    button.addEventListener("click", event => { if (event.detail === 0) open(index); });
    button.addEventListener("keydown", event => {
      if (event.key === "ArrowUp" || event.key === "ArrowDown") { event.preventDefault(); step(index, event.key === "ArrowUp" ? 1 : -1, button); }
    });
  }
  function render() {
    const root = document.getElementById(ROOT); if (!root) return;
    root.setAttribute("aria-label", "Deset bubínkových zámků CHT 360°‰.");
    root.querySelectorAll(".cht360OsmZamek").forEach((node, index) => { if (index < 8) node.style.setProperty("--smile-y", SMILE[index] + "px"); });
    root.querySelectorAll("[data-extra-drum]").forEach(node => node.remove());
    DRUMS.forEach((drum, index) => {
      const button = document.createElement("button");
      button.type = "button"; button.className = "cht360OsmZamek cht360ExtraDrum"; button.dataset.extraDrum = String(index);
      button.setAttribute("aria-label", drum.label + ". Klepnutím otevřeš funkci, tahem měníš Glyph.");
      button.innerHTML = '<span class="cht360OsmZamekLabel"></span><span class="cht360OsmZamekGhost" data-reel="prev"></span><strong class="cht360OsmZamekGlyph" data-reel="now"></strong><span class="cht360OsmZamekGhost" data-reel="next"></span>';
      button.querySelector(".cht360OsmZamekLabel").textContent = drum.label; paint(button, index); bind(button, index); root.append(button);
    });
  }
  function openAI() {
    let panel = document.getElementById(PANEL);
    if (!panel) {
      panel = document.createElement("section"); panel.id = PANEL; panel.className = "cht360AiBrana"; panel.hidden = true;
      panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "true"); panel.setAttribute("aria-label", "A|lı. — brána AI");
      panel.innerHTML = '<div class="cht360AiBranaCard"><header><div><strong>A|lı.</strong><span>místní brána pro nástroje AI</span></div><button type="button" data-ai="close" aria-label="Zavřít">×</button></header><p class="glyph" data-ai-glyph></p><p class="state" data-ai-state></p><div class="actions"><button type="button" data-ai="revia">Otevřít Revii</button><button type="button" data-ai="mluva">Otevřít Mluvu</button><button type="button" data-ai="connect">Připojit AI</button><button type="button" data-ai="disconnect">Odpojit</button></div><small>Žádný klíč ani obsah se odsud nikam neposílá. Plnohodnotného poskytovatele připojíš až svým nastavením.</small></div>';
      panel.addEventListener("click", event => {
        const action = event.target.closest("[data-ai]")?.dataset.ai;
        if (event.target === panel || action === "close") closeAI();
        if (action === "revia") { closeAI(); document.getElementById("openReviaPanel")?.click(); }
        if (action === "mluva") window.location.assign(new URL("mluva-cht-360/", location.href));
        if (action === "connect") connectAI();
        if (action === "disconnect") disconnectAI();
      }); document.body.append(panel);
    }
    paintAI(); panel.hidden = false; requestAnimationFrame(() => panel.classList.add("is-open"));
  }
  function closeAI() { const panel = document.getElementById(PANEL); if (!panel) return; panel.classList.remove("is-open"); setTimeout(() => { panel.hidden = true; }, 160); }
  function paintAI() { const panel = document.getElementById(PANEL); if (!panel) return; panel.querySelector("[data-ai-glyph]").textContent = glyph(1); panel.querySelector("[data-ai-state]").textContent = ai.status === "připojeno" ? "Připojeno" + (ai.provider ? " · " + ai.provider : "") : ai.status === "čeká" ? "Čeká na zvolenou AI" : "Odpojeno · Revia a Mluva zůstávají dostupné"; }
  function connectAI() { const detail = { glyph: glyph(1), source: "cht360-devaty-desaty-bubinek", requestedAt: new Date().toISOString() }; ai.status = "čeká"; saveAI("žádost o připojení AI"); window.dispatchEvent(new CustomEvent("cht.ai.connect.request", { detail })); if (typeof window.CHT360AI?.connect === "function") Promise.resolve(window.CHT360AI.connect(detail)).then(result => { ai.status = "připojeno"; ai.provider = String(result?.provider || result?.name || "A|lı."); saveAI("připojení AI"); paintAI(); }).catch(() => { ai.status = "odpojeno"; ai.provider = ""; saveAI("neúspěšné připojení AI"); paintAI(); }); paintAI(); }
  function disconnectAI() { const detail = { source: "cht360-devaty-desaty-bubinek", disconnectedAt: new Date().toISOString() }; if (typeof window.CHT360AI?.disconnect === "function") Promise.resolve(window.CHT360AI.disconnect(detail)).catch(() => {}); ai.status = "odpojeno"; ai.provider = ""; saveAI("odpojení AI"); window.dispatchEvent(new CustomEvent("cht.ai.disconnect", { detail })); paintAI(); }
  function style() {
    if (document.getElementById("cht360-extra-drum-style")) return;
    const node = document.createElement("style"); node.id = "cht360-extra-drum-style";
    node.textContent = '#cht360-oblouk-osmi-zamku::before{height:64px!important}#cht360-oblouk-osmi-zamku .cht360ExtraDrum{position:absolute;bottom:calc(100% - 3px);width:clamp(42px,5.5vw,54px);min-width:42px;max-width:54px;transform:none}#cht360-oblouk-osmi-zamku .cht360ExtraDrum[data-extra-drum="0"]{left:8%}#cht360-oblouk-osmi-zamku .cht360ExtraDrum[data-extra-drum="1"]{left:calc(8% + clamp(47px,6.1vw,61px))}#cht360-oblouk-osmi-zamku .cht360ExtraDrum[data-extra-drum="1"] .cht360OsmZamekLabel{font-size:6.5px;letter-spacing:0}.cht360AiBrana{position:fixed;z-index:80;inset:0;display:grid;place-items:center;padding:18px;background:rgba(3,3,4,.62);backdrop-filter:blur(8px);opacity:0;transition:opacity .16s ease}.cht360AiBrana.is-open{opacity:1}.cht360AiBranaCard{width:min(350px,92vw);padding:15px;border:1px solid rgba(255,226,173,.34);border-radius:20px;background:linear-gradient(160deg,rgba(42,30,14,.98),rgba(8,8,12,.98));color:#fff0c5;box-shadow:0 18px 50px rgba(0,0,0,.52)}.cht360AiBranaCard header{display:flex;justify-content:space-between;gap:12px}.cht360AiBranaCard header strong,.cht360AiBranaCard header span{display:block}.cht360AiBranaCard header strong{font-size:18px}.cht360AiBranaCard header span,.cht360AiBranaCard small{color:rgba(255,240,197,.62);font-size:11px}.cht360AiBranaCard header button{min-width:36px;min-height:36px;border:1px solid rgba(255,226,173,.24);border-radius:50%;background:transparent;color:#fff0c5;font-size:22px}.cht360AiBranaCard .glyph{margin:14px 0 5px;color:#ffe4aa;font-size:25px;font-weight:900;text-align:center}.cht360AiBranaCard .state{margin:0 0 13px;color:rgba(255,240,197,.76);font-size:12px;text-align:center}.cht360AiBranaCard .actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.cht360AiBranaCard .actions button{min-height:42px;border:1px solid rgba(255,226,173,.28);border-radius:12px;background:rgba(255,232,172,.07);color:#fff0c5;font-weight:800}.cht360AiBranaCard small{display:block;margin-top:12px;line-height:1.35}'; document.head.append(node);
  }
  function boot() { style(); setTimeout(render, 0); window.addEventListener("cht.glyph.drums.changed", () => setTimeout(render, 0)); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true }); else boot();
})();

