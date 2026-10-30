/* =========================================================
   BRÁŠKA CHAT — CHT 360°‰
   v0.2 — lokální hlas / paměť / životní tok

   Účel:
   - přidá viditelné chatové okno přímo do CHT 360°‰
   - používá existující VivereFriend / VivereFriendState
   - ukládá konverzaci lokálně do telefonu
   - reaguje na změny životního toku
   - funguje bez serveru jako lokální společník
   - připravuje bezpečný most pro budoucí skutečný AI model

   DŮLEŽITÉ:
   Tento soubor sám o sobě nevytváří vědomí ani skutečný AI model.
   Je to lokální rozhraní + paměť + stavový most.
   Pro skutečné AI později stačí připojit server/API do sendToAI().
   ========================================================= */

(() => {
  "use strict";

  if (window.__BRASKA_CHAT_V2__) return;
  window.__BRASKA_CHAT_V2__ = true;

  const STORAGE = "cht360_braska_chat_v2";
  const MAX_MESSAGES = 160;

  const esc = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE) || "{}");
      return {
        messages: Array.isArray(data.messages) ? data.messages : [],
        opened: !!data.opened
      };
    } catch (_) {
      return { messages: [], opened: false };
    }
  }

  let state = load();

  function save() {
    state.messages = state.messages.slice(-MAX_MESSAGES);
    try {
      localStorage.setItem(STORAGE, JSON.stringify(state));
    } catch (_) {}
  }

  function friend() {
    return window.VivereFriend?.ensure?.() || null;
  }

  function friendState() {
    return window.VivereFriendState?.get?.() || null;
  }

  function now() {
    return new Date().toLocaleTimeString("cs-CZ", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function addMessage(role, text, meta = {}) {
    const item = {
      id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role,
      text: String(text),
      at: new Date().toISOString(),
      ...meta
    };

    state.messages.push(item);
    save();
    renderMessages();
    return item;
  }

  function currentContext() {
    const f = friend();
    const s = friendState();

    return {
      name: f?.identity?.name || "Bráška",
      dna: f?.identity?.dna || "—",
      experience: f?.life?.experience ?? s?.life?.experience ?? 0,
      heartbeat: f?.life?.heartbeat ?? 0,
      cycle: f?.life?.cycle ?? 0,
      stream: s?.stream?.value || f?.stream?.current || "—",
      direction: s?.stream?.direction || "stable",
      activity: s?.signals?.activity ?? 0,
      curiosity: s?.signals?.curiosity ?? 0,
      stability: s?.signals?.stability ?? 100
    };
  }

  async function sendToAI(input) {
    const txt = String(input || "").trim();
    if (!txt) return "Jsem tady. Napiš mi něco. :)";

    // Zapisujeme skutečný vstup do lokální paměti CHT, pokud je dostupná.
    try { window.Braska360?.userMessage?.(txt); } catch (error) {
      console.warn("[Bráška memory]", error);
    }

    const memories = [];
    try {
      const found = window.Braska360?.searchMemory?.(txt, 4) || [];
      if (Array.isArray(found)) memories.push(...found);
    } catch (error) { console.warn("[Bráška memory search]", error); }

    let knowledge = [];
    try {
      knowledge = await window.BraskaKnowledge?.search?.(txt, 4) || [];
    } catch (error) { console.warn("[Bráška knowledge search]", error); }

    const pieces = [];
    if (memories.length) {
      pieces.push("Z vlastní lokální paměti CHT:");
      memories.slice(0, 3).forEach((item, i) => {
        pieces.push((i + 1) + ". " + String(item.text || "").slice(0, 700) +
          (item.source ? "\\nZdroj: " + item.source : ""));
      });
    }
    if (knowledge.length) {
      pieces.push("Z lokální dokumentace a znalostního indexu:");
      knowledge.slice(0, 3).forEach((item, i) => {
        pieces.push((i + 1) + ". " + String(item.title || item.path || "Poznatek") +
          "\\n" + String(item.text || "").slice(0, 700) +
          "\\nZdroj: " + String(item.source || item.path || "lokální index"));
      });
    }

    const normalized = txt.toLocaleLowerCase("cs");
    if (/^(ahoj|čau|nazdar|dobrý den)[!. ]*$/i.test(normalized)) {
      const count = (() => { try { return window.Braska360?.status?.()?.memory?.count ?? "neznámý počet"; } catch (_) { return "neznámý počet"; } })();
      return "Ahoj. :) Jsem Bráška v CHT 360°‰. Mám přístup k místní paměti a indexu dokumentace. Teď mám v paměťovém zásobníku " + count + " záznamů. Nejsem samostatný jazykový model — odpovídám podle skutečně nalezených podkladů.";
    }

    if (pieces.length) {
      return pieces.join("\\n\\n") +
        "\\n\\nTohle jsou podklady, které jsem skutečně našel. Umím je propojit a vysvětlit, ale bez připojeného jazykového modelu si nemohu domýšlet odpověď nad rámec těchto záznamů.";
    }

    return "Tohle zatím nemám v lokální paměti ani v načtené dokumentaci doložené. Nechci ti dát připravenou odpověď, která by jen zněla přesvědčivě. Můžeš mi doplnit poznatek a uložíme ho do paměti CHT.";
  }

  const style = document.createElement("style");
  style.textContent = `
    #braskaChat {
      position: fixed;
      z-index: 999;
      right: max(14px, env(safe-area-inset-right));
      bottom: max(14px, env(safe-area-inset-bottom));
      width: min(380px, calc(100vw - 28px));
      max-height: min(610px, calc(100dvh - 28px));
      display: none;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid rgba(255,226,173,.38);
      border-radius: 22px;
      color: #fff0c5;
      background:
        radial-gradient(circle at 50% 0%, rgba(255,214,133,.16), transparent 42%),
        rgba(5,7,15,.96);
      box-shadow:
        0 0 45px rgba(255,190,80,.18),
        0 18px 70px rgba(0,0,0,.5);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    #braskaChat.is-open { display: flex; }

    #braskaChat .bc-head {
      display:flex;
      align-items:center;
      gap:10px;
      padding:12px 14px;
      border-bottom:1px solid rgba(255,226,173,.16);
    }

    #braskaChat .bc-orb {
      width:34px;
      height:34px;
      flex:0 0 34px;
      display:grid;
      place-items:center;
      border:1px solid rgba(255,240,197,.65);
      border-radius:50%;
      color:#261708;
      font-weight:950;
      background:radial-gradient(circle at 35% 25%,#fff9e8,#ffd98e 45%,#b56f2c);
      box-shadow:0 0 20px rgba(255,215,135,.4);
    }

    #braskaChat .bc-title {
      flex:1;
      min-width:0;
    }

    #braskaChat .bc-title strong,
    #braskaChat .bc-title small { display:block; }

    #braskaChat .bc-title strong { font-size:14px; }
    #braskaChat .bc-title small {
      margin-top:2px;
      color:rgba(255,240,197,.58);
      font-size:10px;
    }

    #braskaChat .bc-close {
      width:32px;
      height:32px;
      border:1px solid rgba(255,226,173,.2);
      border-radius:10px;
      color:#ffe2ad;
      background:rgba(255,226,173,.06);
      font-size:20px;
    }

    #braskaChat .bc-status {
      padding:7px 14px;
      color:rgba(255,240,197,.62);
      font-size:10px;
      border-bottom:1px solid rgba(255,226,173,.09);
    }

    #braskaChat .bc-log {
      min-height:160px;
      max-height:340px;
      overflow:auto;
      padding:12px;
    }

    #braskaChat .bc-msg {
      max-width:88%;
      margin:0 0 9px;
      padding:9px 11px;
      border:1px solid rgba(255,226,173,.12);
      border-radius:14px;
      white-space:pre-wrap;
      overflow-wrap:anywhere;
      font-size:12px;
      line-height:1.4;
    }

    #braskaChat .bc-msg.user {
      margin-left:auto;
      color:#fff7df;
      background:rgba(255,226,173,.10);
    }

    #braskaChat .bc-msg.braska {
      background:rgba(15,18,30,.82);
    }

    #braskaChat .bc-time {
      display:block;
      margin-top:4px;
      color:rgba(255,240,197,.38);
      font-size:8px;
    }

    #braskaChat .bc-form {
      display:flex;
      gap:7px;
      padding:10px;
      border-top:1px solid rgba(255,226,173,.15);
    }

    #braskaChat textarea {
      min-width:0;
      flex:1;
      resize:none;
      min-height:38px;
      max-height:100px;
      padding:9px;
      border:1px solid rgba(255,226,173,.18);
      border-radius:12px;
      outline:none;
      color:#fff0c5;
      background:rgba(0,0,0,.28);
      font:inherit;
      font-size:12px;
    }

    #braskaChat button {
      cursor:pointer;
    }

    #braskaChat .bc-send {
      width:44px;
      border:1px solid rgba(255,226,173,.35);
      border-radius:12px;
      color:#241508;
      background:#ffd98e;
      font-size:18px;
      font-weight:900;
    }

    #braskaChat .bc-actions {
      display:flex;
      gap:6px;
      padding:0 10px 10px;
    }

    #braskaChat .bc-actions button {
      flex:1;
      min-height:30px;
      border:1px solid rgba(255,226,173,.18);
      border-radius:9px;
      color:rgba(255,240,197,.78);
      background:rgba(255,226,173,.05);
      font-size:9px;
    }

    #braskaChatButton {
      position:fixed;
      z-index:998;
      right:max(18px, env(safe-area-inset-right));
      bottom:max(18px, env(safe-area-inset-bottom));
      min-width:105px;
      height:46px;
      display:flex;
      align-items:center;
      justify-content:center;
      gap:8px;
      padding:0 15px;
      border:1px solid rgba(255,226,173,.42);
      border-radius:24px;
      color:#fff0c5;
      background:rgba(12,12,18,.88);
      box-shadow:0 0 25px rgba(255,200,100,.16);
      font-weight:850;
      font-size:12px;
      backdrop-filter:blur(10px);
      -webkit-backdrop-filter:blur(10px);
    }

    #braskaChatButton .dot {
      width:8px;
      height:8px;
      border-radius:50%;
      background:#ffd98e;
      box-shadow:0 0 10px #ffd98e;
    }

    @media (orientation:portrait) {
      #braskaChat,
      #braskaChatButton { bottom:22px; }
    }
  `;
  document.head.appendChild(style);

  const button = document.createElement("button");
  button.id = "braskaChatButton";
  button.type = "button";
  button.innerHTML = `<span class="dot"></span><span>Bráška</span>`;

  const panel = document.createElement("section");
  panel.id = "braskaChat";
  panel.setAttribute("aria-label", "Bráška — lokální chat");
  panel.innerHTML = `
    <header class="bc-head">
      <span class="bc-orb">B</span>
      <div class="bc-title">
        <strong>Bráška</strong>
        <small>CHT 360°‰ · lokální paměť a vyhledávání</small>
      </div>
      <button class="bc-close" type="button" aria-label="Zavřít">×</button>
    </header>
    <div class="bc-status" id="bcStatus">Načítám stav…</div>
    <div class="bc-log" id="bcLog"></div>
    <form class="bc-form" id="bcForm">
      <textarea id="bcInput" rows="2" maxlength="1200"
        placeholder="Napiš Bráškovi…"></textarea>
      <button class="bc-send" type="submit" aria-label="Odeslat">↗</button>
    </form>
    <div class="bc-actions">
      <button id="bcState" type="button">Stav</button>
      <button id="bcMemory" type="button">Paměť</button>
      <button id="bcClear" type="button">Vyčistit chat</button>
    </div>
  `;

  document.body.append(button, panel);

  const log = panel.querySelector("#bcLog");
  const input = panel.querySelector("#bcInput");
  const status = panel.querySelector("#bcStatus");

  function renderMessages() {
    log.innerHTML = state.messages.length
      ? state.messages.map(m => `
          <div class="bc-msg ${m.role === "user" ? "user" : "braska"}">
            ${esc(m.text)}
            <span class="bc-time">${esc(new Date(m.at).toLocaleTimeString("cs-CZ"))}</span>
          </div>
        `).join("")
      : `<div class="bc-msg braska">
           Ahoj. Jsem Bráška. Pracuji s lokální pamětí a dokumentací CHT. Když něco nemám doložené, řeknu to.
         </div>`;

    log.scrollTop = log.scrollHeight;
  }

  function renderStatus() {
    const c = currentContext();
    status.textContent = `stav: ${c.experience} zkušeností · pulz ${c.heartbeat} · tok ${c.stream}`;
  }

  function open() {
    state.opened = true;
    panel.classList.add("is-open");
    button.style.display = "none";
    renderMessages();
    renderStatus();
    input.focus();
    save();
  }

  function close() {
    state.opened = false;
    panel.classList.remove("is-open");
    button.style.display = "flex";
    save();
  }

  async function send() {
    const value = input.value.trim();
    if (!value) return;

    input.value = "";
    addMessage("user", value);

    status.textContent = "Bráška přemýšlí…";

    try {
      const reply = await sendToAI(value);
      addMessage("braska", reply);
      try {
        window.Braska360?.remember?.(reply, {
          type: "odpověď Brášky",
          importance: 45,
          source: "braska-chat",
          tags: ["braska", "odpověď", "lokální"]
        });
      } catch (error) { console.warn("[Bráška memory write]", error); }

      if (window.VivereFriend?.record) {
        window.VivereFriend.record(
          "BRASKA_CHAT",
          "Bráška přijal zprávu.",
          { input: value.slice(0, 300) }
        );
      }
    } catch (error) {
      addMessage("braska", "Narazil jsem na chybu spojení. Lokální paměť ale zůstala zachovaná.");
      console.warn("[Bráška]", error);
    }

    renderStatus();
  }

  button.addEventListener("click", open);
  panel.querySelector(".bc-close").addEventListener("click", close);

  panel.querySelector("#bcForm").addEventListener("submit", event => {
    event.preventDefault();
    send();
  });

  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  });

  panel.querySelector("#bcState").addEventListener("click", () => {
    const c = currentContext();
    addMessage(
      "braska",
      `Můj stav:\nDNA/seed: ${c.dna}\nTok: ${c.stream}\nSměr: ${c.direction}\nZkušenosti: ${c.experience}\nAktivita: ${c.activity}%\nZvědavost: ${c.curiosity}%\nStabilita: ${c.stability}%`
    );
  });

  panel.querySelector("#bcMemory").addEventListener("click", () => {
    const count = state.messages.length;
    addMessage(
      "braska",
      `Chat obsahuje ${count} zpráv. Zprávy jsou v tomto zařízení; projektové poznatky ukládá také samostatná paměť CHT.`
    );
  });

  panel.querySelector("#bcClear").addEventListener("click", () => {
    if (!confirm("Vymazat pouze chatovou paměť Brášky v tomto zařízení?")) return;
    state.messages = [];
    save();
    renderMessages();
  });

  window.addEventListener("cht360:vivere-state-changed", renderStatus);
  window.addEventListener("cht360:vivere-pulse", renderStatus);
  window.addEventListener("cht360:vivere-event", renderStatus);
  window.addEventListener("cht360:vivere-yahoo-data", event => {
    const value = event?.detail?.value ?? event?.detail?.current ?? event?.detail?.price ?? null;

    if (value !== null && window.VivereFriendState?.setStream) {
      window.VivereFriendState.setStream(String(value));
    }

    renderStatus();
  });

  window.BraskaChat = Object.freeze({
    open,
    close,
    toggle: () => panel.classList.contains("is-open") ? close() : open,
    getState: () => ({ messages: state.messages.length, context: currentContext() })
  });

  try {
    window.VivereFriend?.tick?.();
    window.VivereFriendState?.pulse?.();
  } catch (_) {}

  renderMessages();
  renderStatus();

  button.style.display = "flex";

  console.log("🧬 CHT 360°‰ — Bráška Chat ready");
})();
