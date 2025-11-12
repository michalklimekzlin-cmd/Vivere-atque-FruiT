/* Chybožrout-Opravář 2.0 — multi-sken + napojení na původního Chybožrouta */
(function () {
  const $ = (s) => document.querySelector(s);

  const scanBtn     = $('#scanBtn');
  const resultsEl   = $('#results');
  const logEl       = $('#log');
  const probe       = $('#probe');
  const exportBtn   = $('#exportBtn');
  const clearBtn    = $('#clearBtn');
  const toggleLogBtn= $('#toggleLog');
  const targetInput = $('#targetUrl');
  const installBtn  = $('#installBtn');

  // ---- PWA install --------------------------------------------------------
  let deferredPrompt, showLog = true;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e; installBtn.disabled = false;
  });
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null;
  });

  // ---- Připojení původního Chybožrouta z hlavní appky --------------------
  (function importLegacy() {
    const s = document.createElement('script');
    s.src = '../vaft.chybozrout.js?v=live';
    s.onload = () => console.log('[Chybožrout] Původní jádro připojeno.');
    s.onerror = () => console.warn('[Chybožrout] Nepodařilo se načíst ../vaft.chybozrout.js (pokračuji bez něj).');
    document.head.appendChild(s);
  })();

  // ---- Stav přes víc cest -------------------------------------------------
  const state = {
    queue: [],
    current: null,
    issuesByPath: {},
    logsByPath: {},
    allIssues: [],
    allLogs: [],
  };

  // ---- Pomocné funkce -----------------------------------------------------
  function parsePaths(input) {
    const raw = input.split(',').map(s => s.trim()).filter(Boolean);
    const list = raw.length ? raw : ['/'];
    return list.map(p => new URL(p, location.href).href);
  }
  function addIssue(path, type, msg) {
    const item = { t: Date.now(), type, msg, path };
    (state.issuesByPath[path] ||= []).push(item);
    state.allIssues.push(item);
    renderIssues();
  }
  function addLog(path, kind, msg) {
    const line = `[${new Date().toLocaleTimeString()}] ${kind.toUpperCase()} ${msg}`;
    (state.logsByPath[path] ||= []).push(line);
    state.allLogs.push({ path, line });
    if (showLog) { logEl.textContent += `[${path}] ${line}\n`; logEl.scrollTop = logEl.scrollHeight; }
  }
  function renderIssues() {
    if (!state.allIssues.length) { resultsEl.innerHTML = '<div class="muted">Žádné problémy nenalezeny ✅</div>'; return; }
    const blocks = Object.entries(state.issuesByPath).map(([path, list]) => {
      const items = list.map(i => {
        const c = i.type === 'error' ? '#ff6a6a' : i.type === 'warn' ? '#ffc46a' : '#9fe29f';
        return `<div class="issue"><span class="dot" style="background:${c}"></span><b>${i.type.toUpperCase()}</b> — ${i.msg}</div>`;
      }).join('');
      return `<div class="card" style="margin-top:8px"><h4 style="margin:0 0 6px">${path}</h4>${items || '<div class="muted">Bez problémů</div>'}</div>`;
    }).join('');
    resultsEl.innerHTML = blocks;
  }
  function reset() {
    state.queue = []; state.current = null;
    state.issuesByPath = {}; state.logsByPath = {};
    state.allIssues = []; state.allLogs = [];
    resultsEl.innerHTML = 'Připravuji sken…'; logEl.textContent = '';
  }

  // ---- Hook konzole v cílovém okně (same-origin) --------------------------
  function hookConsole(win, path) {
    if (!win || !win.console) return;
    try {
      const orig = { log: win.console.log, warn: win.console.warn, error: win.console.error };
      win.console.log  = (...a)=>{ addLog(path,'log',  a.join(' ')); try{orig.log.apply(win.console,a);}catch{} };
      win.console.warn = (...a)=>{ addLog(path,'warn', a.join(' ')); try{orig.warn.apply(win.console,a);}catch{} };
      win.console.error= (...a)=>{ addLog(path,'error',a.join(' ')); try{orig.error.apply(win.console,a);}catch{} };
      win.addEventListener('error', e => addLog(path,'error', `${e.message} @${e.filename}:${e.lineno}`));
      win.addEventListener('unhandledrejection', e => addLog(path,'error', 'Promise: '+(e.reason && e.reason.message || String(e.reason))));
    } catch {}
  }

  // ---- Strukturální audit dokumentu --------------------------------------
  function structuralScan(win, path) {
    try {
      const doc = win.document;
      const html = doc.documentElement.outerHTML || '';
      const scripts = Array.from(doc.querySelectorAll('script')).map(s => s.textContent || '');

      // 1) Service Worker registrace
      const swCount = scripts.filter(t => /navigator\.serviceWorker\.register\(/.test(t)).length;
      if (swCount > 1) addIssue(path,'error',`Vícenásobná registrace Service Workeru: ${swCount}× (ponech jen jednu).`);
      else if (swCount === 1) addIssue(path,'info','Service Worker registrace: 1× (OK).');
      else addIssue(path,'warn','Service Worker neregistrován (zvaž PWA).');

      // 2) Duplicitní vaftSwitchPanel
      const tabDefs = scripts.filter(t => /function\s+vaftSwitchPanel\s*\(/.test(t)).length;
      if (tabDefs > 1) addIssue(path,'warn',`Duplicitní definice vaftSwitchPanel: ${tabDefs}× (ponech jednu).`);

      // 3) VAFT_CORE vícekrát
      const coreDefs = scripts.filter(t => /win\.VAFT_CORE|window\.VAFT_CORE/.test(t)).length;
      if (coreDefs > 1) addIssue(path,'warn',`VAFT_CORE definován ${coreDefs}× (ponech 1 nejnovější).`);

      // 4) Tagy <script> — otevřené/uzavřené a vnoření
      const opens  = (html.match(/<script\b/gi)   || []).length;
      const closes = (html.match(/<\/script>/gi)  || []).length;
      if (opens !== closes) addIssue(path,'error',`Nesouhlasí počet <script> (${opens}) a </script> (${closes}).`);
      if (html.includes('<script><script>')) addIssue(path,'error','Vnořený <script> nalezen – oprav uzavírání bloků.');

      // 5) Intervalová zátěž
      const intervals = scripts.reduce((n,t)=> n + (t.match(/setInterval\s*\(/g)||[]).length, 0);
      if (intervals > 2) addIssue(path,'warn',`Hodně setInterval(): ${intervals}× – zvaž CalmPulse (rAF + setTimeout).`);
      if (scripts.some(t => /function\s+tick\s*\(/.test(t))) addIssue(path,'info','Nalezen tick() – preferuj rAF orchestrace.');

      // 6) Více HUDů
      const hudHints = scripts.filter(t => /#vaft-hud|status orchestr|beings/.test(t)).length;
      if (hudHints > 1) addIssue(path,'warn','Více HUD implementací – sjednoť na jednu variantu.');

      // 7) Obsah za </html>
      const tail = html.split('</html>')[1];
      if (tail && tail.trim().length) addIssue(path,'error','Obsah/skripty za </html> – odstraň vše po uzavření dokumentu.');
    } catch (e) {
      addIssue(path,'error','Sken se nepovedl: '+(e.message || e));
    }
  }

  // ---- Pokus o runtime sken přes původního Chybožrouta -------------------
  async function legacyScan(win, path) {
    try {
      if (win.VAFT_CHYBOZROUT && typeof win.VAFT_CHYBOZROUT.scan === 'function') {
        const res = await Promise.resolve(win.VAFT_CHYBOZROUT.scan());
        if (Array.isArray(res)) {
          res.forEach(r => addIssue(path, (r.type || 'info'), r.msg || JSON.stringify(r)));
          addLog(path,'log','Legacy scan hotov ('+res.length+' záznamů).');
        } else {
          addLog(path,'warn','Legacy scan nevrátil pole (OK, pokračuji).');
        }
      } else {
        addLog(path,'log','Legacy skener nenalezen na strán
