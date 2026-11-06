/* CHT 360°‰. — místní archiv zpráv grid95 × grid96.
   Append-only IndexedDB. Žádný síťový přenos; nemaže existující chaty ani sloty.
   Rozhraní: window.CHT360MessageArchive.openPanel() / .add(channel, message). */
(() => {
  "use strict";
  if (window.CHT360MessageArchive) return;
  const DB_NAME = "VaFTCHT360MessageArchive";
  const STORE = "messages";
  const CHANNELS = new Set(["braska", "revia"]);
  let dbPromise;
  let visible = 100;
  let overlay;
  let renderVersion = 0;
  const $ = (id) => document.getElementById(id);
  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(resolve => {
      if (!window.indexedDB) { resolve(null); return; }
      try {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains(STORE)) {
            const store = request.result.createObjectStore(STORE, { keyPath: "id" });
            store.createIndex("byChannel", "channel", { unique: false });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
        request.onblocked = () => resolve(null);
      } catch (error) {
        console.warn("[CHT Archiv] IndexedDB nelze otevřít", error);
        resolve(null);
      }
    });
    return dbPromise;
  }
  function hash(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h = Math.imul(h ^ text.charCodeAt(i), 16777619);
    }
    return (h >>> 0).toString(36);
  }
  function normalize(channel, message, position = 0) {
    if (!CHANNELS.has(channel) || !message || typeof message.text !== "string") return null;
    const text = message.text.trim();
    if (!text) return null;
    const role = message.role === "user" ? "user" : channel;
    const identity = (typeof message.id === "string" && message.id)
      ? message.id : "legacy-" + position + "-" + hash(role + "|" + text);
    const date = typeof message.at === "string" && !Number.isNaN(Date.parse(message.at))
      ? message.at : null;
    return {
      id: channel + ":" + identity, channel, role, text,
      at: date, capturedAt: new Date().toISOString(),
      source: date ? "chat" : "původní chat – čas nebyl uveden"
    };
  }
  async function add(channel, message, position = 0) {
    const entry = normalize(channel, message, position);
    if (!entry) return false;
    const db = await openDB();
    if (!db) throw new Error("IndexedDB není dostupná");
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, "readwrite");
      const request = transaction.objectStore(STORE).add(entry);
      request.onsuccess = () => resolve(true);
      request.onerror = (event) => {
        if (request.error?.name === "ConstraintError") {
          event.preventDefault();
          event.stopPropagation();
          resolve(false);
        } else reject(request.error || new Error("Zápis selhal"));
      };
      transaction.onerror = () => reject(transaction.error || new Error("Transakce selhala"));
    });
  }
  async function all() {
    const db = await openDB();
    if (!db) throw new Error("IndexedDB není dostupná");
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error || new Error("Čtení selhalo"));
    });
  }
  async function importOldChat(key, channel) {
    let messages = [];
    try {
      const raw = JSON.parse(localStorage.getItem(key) || "{}");
      if (Array.isArray(raw.messages)) messages = raw.messages;
    } catch (error) { console.warn("[CHT Archiv] Nelze číst starý chat", key, error); }
    let added = 0;
    for (let i = 0; i < messages.length; i++) {
      try { if (await add(channel, messages[i], i)) added++; }
      catch (error) { console.warn("[CHT Archiv] Migrace se přerušila", error); break; }
    }
    return added;
  }
  async function migrate() {
    const added = await importOldChat("cht360_braska_chat_v2", "braska")
      + await importOldChat("cht360_revia_chat_v1", "revia");
    if (added && overlay && !overlay.hidden) await render();
  }
  function download(content, filename) {
    const url = URL.createObjectURL(new Blob([content], { type: "application/json;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = filename;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  async function exportJSON() {
    const messages = await all();
    download(JSON.stringify({ schema: "cht360-message-archive-v1", exported: new Date().toISOString(), messages }, null, 2), "CHT360-archiv-zprav.json");
    message("Záloha všech " + messages.length + " archivovaných zpráv byla připravena ke stažení.");
  }
  function message(text) {
    const el = $("chtArchiveStatus");
    if (el) el.textContent = text;
  }
  function buildPanel() {
    if (overlay) return;
    const css = document.createElement("style");
    css.textContent = \`
    #chtArchiveOverlay{position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.83);display:grid;place-items:center;padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom));font:14px system-ui,-apple-system,sans-serif;color:#ffe2ad}
    #chtArchiveOverlay[hidden]{display:none}
    #chtArchivePanel{width:min(840px,100%);height:min(720px,92dvh);display:flex;flex-direction:column;overflow:hidden;border:1px solid #9b7137;border-radius:16px;background:#070d1d;box-shadow:0 15px 65px #000}
    #chtArchivePanel header{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px;border-bottom:1px solid #57432f}
    #chtArchivePanel h2{font-size:18px;margin:0}#chtArchivePanel .archActions{display:flex;flex-wrap:wrap;gap:7px;padding:10px}
    #chtArchivePanel button,#chtArchivePanel select,#chtArchivePanel input{background:#141e31;color:#ffe2ad;border:1px solid #80653e;border-radius:8px;padding:9px;font-size:14px}
    #chtArchiveSearch{flex:1;min-width:160px}#chtArchiveCount{padding:0 12px;color:#d6bb8a}
    #chtArchiveStatus{padding:5px 12px;color:#ffdfa3;font-size:12px;min-height:26px}
    #chtArchiveList{overflow-y:auto;flex:1;min-height:0;padding:10px;overscroll-behavior:contain}
    #chtArchiveList article{border:1px solid #383e45;border-radius:10px;margin-bottom:8px;padding:10px;background:#101729}
    #chtArchiveList .archMeta{font-size:11px;color:#c29a61;margin-bottom:4px}#chtArchiveList p{margin:0;color:#f5e9d5;white-space:pre-wrap;overflow-wrap:anywhere}
    #chtArchivePanel footer{display:flex;justify-content:center;border-top:1px solid #57432f;padding:8px}
    \`;
    document.head.append(css);
    overlay = document.createElement("div");
    overlay.id = "chtArchiveOverlay";
    overlay.hidden = true;
    overlay.innerHTML = \`
      <section id="chtArchivePanel" role="dialog" aria-modal="true" aria-label="Archiv zpráv CHT">
        <header><h2>CHT 360°‰. · Archiv zpráv</h2><button id="chtArchiveClose" type="button">Zavřít</button></header>
        <div class="archActions">
          <input id="chtArchiveSearch" type="search" placeholder="Hledat ve zprávách…">
          <select id="chtArchiveFilter" aria-label="Vybrat chat"><option value="">Bráška + Revia</option><option value="braska">Bráška</option><option value="revia">Revia</option></select>
          <button id="chtArchiveExport" type="button">Záloha JSON</button>
          <button id="chtArchiveImport" type="button">Import JSON</button>
          <input id="chtArchiveFile" type="file" accept=".json,application/json" hidden>
        </div>
        <div id="chtArchiveCount"></div><div id="chtArchiveStatus"></div>
        <div id="chtArchiveList"></div><footer><button id="chtArchiveMore" type="button">Starší zprávy</button></footer>
      </section>\`;
    document.body.append(overlay);
    $("chtArchiveClose").addEventListener("click", () => { overlay.hidden = true; });
    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.hidden = true; });
    $("chtArchiveSearch").addEventListener("input", () => { visible = 100; render(); });
    $("chtArchiveFilter").addEventListener("change", () => { visible = 100; render(); });
    $("chtArchiveMore").addEventListener("click", () => { visible += 100; render(); });
    $("chtArchiveExport").addEventListener("click", () => exportJSON().catch(e => message(e.message)));
    $("chtArchiveImport").addEventListener("click", () => { $("chtArchiveFile").value = ""; $("chtArchiveFile").click(); });
    $("chtArchiveFile").addEventListener("change", async e => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 30 * 1024 * 1024) { message("Soubor je příliš velký (max. 30 MB)."); return; }
      try {
        const data = JSON.parse(await file.text());
        if (data?.schema !== "cht360-message-archive-v1" || !Array.isArray(data.messages)) throw new Error("Nesprávný formát archivu");
        let count = 0;
        for (const item of data.messages.slice(0, 30000)) {
          if (!CHANNELS.has(item?.channel) || typeof item?.text !== "string" || item.text.length > 100000) continue;
          const id = String(item.id || "");
          const normalizedID = id.startsWith(item.channel + ":") ? id.slice(item.channel.length + 1) : id;
          if (await add(item.channel, { id: normalizedID, role: item.role, text: item.text, at: item.at })) count++;
        }
        message("Importováno " + count + " nových zpráv. Původní zůstaly zachovány.");
        visible = 100; await render();
      } catch (err) { message("Import neproběhl: " + err.message); }
    });
    window.addEventListener("keydown", e => { if (e.key === "Escape" && overlay && !overlay.hidden) overlay.hidden = true; });
  }
  async function render() {
    if (!overlay || overlay.hidden) return;
    const stamp = ++renderVersion;
    try {
      const allMessages = await all();
      if (stamp !== renderVersion) return;
      const q = $("chtArchiveSearch").value.trim().toLocaleLowerCase("cs");
      const channel = $("chtArchiveFilter").value;
      const matches = allMessages.filter(x =>
        (!channel || x.channel === channel) &&
        (!q || x.text.toLocaleLowerCase("cs").includes(q))
      ).sort((a, b) => String(b.at || b.capturedAt).localeCompare(String(a.at || a.capturedAt)));
      $("chtArchiveCount").textContent = matches.length + " zpráv · zobrazeno max. " + Math.min(visible, matches.length);
      const list = $("chtArchiveList"); list.replaceChildren();
      for (const item of matches.slice(0, visible)) {
        const article = document.createElement("article");
        const meta = document.createElement("div"); meta.className = "archMeta";
        meta.textContent = (item.channel === "braska" ? "Bráška" : "Revia") + " · " +
          (item.role === "user" ? "Ty" : item.channel) + " · " + (item.at ? new Date(item.at).toLocaleString("cs-CZ") : "čas neznámý");
        const text = document.createElement("p"); text.textContent = item.text;
        article.append(meta, text); list.append(article);
      }
      $("chtArchiveMore").disabled = matches.length <= visible;
    } catch (error) { message("Archiv nejde načíst: " + error.message); }
  }
  async function openPanel() {
    buildPanel(); overlay.hidden = false;
    message("Zprávy se ukládají lokálně do IndexedDB. Před vymazáním Safari stáhni zálohu.");
    await migrate(); await render();
  }
  window.CHT360MessageArchive = Object.freeze({ add, all, openPanel, exportJSON, migrate });
  window.addEventListener("cht360:message-created", (e) => {
    const { channel, message } = e.detail || {};
    add(channel, message).catch(error => console.warn("[CHT Archiv] Zápis zprávy selhal", error));
  });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => migrate().catch(console.warn), { once: true });
  } else migrate().catch(console.warn);
})();
