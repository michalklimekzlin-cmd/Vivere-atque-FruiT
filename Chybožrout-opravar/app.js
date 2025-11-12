/* Chybožrout-Opravář 2.0 — multi-scan + napojení na původního Chybožrouta */
(function () {
  const $ = (s) => document.querySelector(s);

  const scanBtn = $('#scanBtn');
  const resultsEl = $('#results');
  const logEl = $('#log');
  const probe = $('#probe');
  const exportBtn = $('#exportBtn');
  const clearBtn = $('#clearBtn');
  const toggleLogBtn = $('#toggleLog');
  const targetInput = $('#targetUrl');
  const installBtn = $('#installBtn');

  // --- PWA instalace
  let deferredPrompt, showLog = true;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.disabled = false;
  });
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  });

  // --- připojení původního Chybožrouta z hlavní appky
  (function importLegacy() {
    const s = document.createElement('script');
    s.src = '../vaft.chybozrout.js?v=live';
    s.onload = () => console.log('[Chybožrout] původní jádro připojeno');
    s.onerror = () => console.warn('[Chybožrout] nepodařilo se načíst ../vaft.chybozrout.js');
    document.head.appendChild(s);
  })();

  // --- stav
  const state = {
    queue: [],
    current: null,
    issuesByPath: {},
    logsByPath: {},
    allIssues: [],
    allLogs: [],
  };

  // --- pomocné funkce
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
    if (showLog) {
      logEl.textContent += `[${path}] ${line}\n`;
      logEl.scrollTop = logEl.scrollHeight;
    }
  }
  function renderIssues() {
    if (!state.allIssues.length) {
      resultsEl.innerHTML = '<div class="muted">Žádné problémy nenalezeny ✅</div>';
      return;
    }
    const blocks = Object.entries(state.issuesByPath).map(([path, list]) => {
      const items = list.map(i => {
        const c = i.type === 'error' ? '#ff6a6a' : i.type === 'warn' ? '#ffc46a' : '#9fe29f';
        return `<div class="issue"><span class="dot" style="background:${c}"></span><b>${i.type.toUpperCase()}</b> — ${i.msg}</div>`;
      }).join('');
      return `<div class="card" style="margin-top:8px"><h4 style="margin:0 0 6px">${path}</h4>${items}</div>`;
    }).join('');
    resultsEl.innerHTML = blocks;
  }
  function reset() {
    state.queue = [];
    state.current = null;
    state.issuesByPath = {};
    state.logsByPath = {};
    state.allIssues = [];
    state.allLogs = [];
    resultsEl.innerHTML = 'Připravuji sken…';
    logEl.textContent = '';
  }

  // --- hook konzole cílového okna
  function hookConsole(win, path) {
    if (!win || !win.console) return;
    try {
      const orig = { log: win.console.log, warn: win.console.warn, error: win.console.error };
      win.console.log = (...a) => { addLog(path, 'log', a.join(' ')); orig.log.apply(win.console, a); };
      win.console.warn = (...a) => { addLog(path, 'warn', a.join(' ')); orig.warn.apply(win.console, a); };
      win.console.error = (...a) => { addLog(path, 'error', a.join(' ')); orig.error.apply(win.console, a); };
      win.addEventListener('error', e => addLog(path, 'error', `${e.message} @${e.filename}:${e.lineno}`));
      win.addEventListener('unhandledrejection', e => addLog(path, 'error', 'Promise: ' + (e.reason && e.reason.message || String(e.reason))));
    } catch {}
  }

  // --- strukturální audit
  function structuralScan(win, path) {
    try {
      const doc = win.document;
      const html = doc.documentElement.outerHTML || '';
      const scripts = Array.from(doc.querySelectorAll('script')).map(s => s.textContent || '');

      const swCount = scripts.filter(t => /navigator\.serviceWorker\.register\(/.test(t)).length;
      if (swCount > 1) addIssue(path, 'error', `Vícenásobná registrace Service Workeru: ${swCount}×`);
      else if (swCount === 1) addIssue(path, 'info', 'Service Worker registrace OK');
      else addIssue(path, 'warn', 'Service Worker neregistrován');

      const tabDefs = scripts.filter(t => /function\s+vaftSwitchPanel\s*\(/.test(t)).length;
      if (tabDefs > 1) addIssue(path, 'warn', `Duplicitní vaftSwitchPanel: ${tabDefs}×`);

      const coreDefs = scripts.filter(t => /VAFT_CORE/.test(t)).length;
      if (coreDefs > 1) addIssue(path, 'warn', `VAFT_CORE definován ${coreDefs}×`);

      const opens = (html.match(/<script\b/gi) || []).length;
      const closes = (html.match(/<\/script>/gi) || []).length;
      if (opens !== closes) addIssue(path, 'error', `Nesouhlasí počet <script> (${opens}) a </script> (${closes})`);
      if (html.includes('<script><script>')) addIssue(path, 'error', 'Vnořený <script> nalezen');

      const intervals = scripts.reduce((n, t) => n + (t.match(/setInterval\s*\(/g) || []).length, 0);
      if (intervals > 2) addIssue(path, 'warn', `Hodně setInterval(): ${intervals}×`);
      if (scripts.some(t => /function\s+tick\s*\(/.test(t))) addIssue(path, 'info', 'Nalezen tick()');

      const hudHints = scripts.filter(t => /#vaft-hud|status orchestr|beings/.test(t)).length;
      if (hudHints > 1) addIssue(path, 'warn', 'Více HUD implementací');

      const tail = html.split('</html>')[1];
      if (tail && tail.trim().length) addIssue(path, 'error', 'Obsah po </html>');
    } catch (e) { addIssue(path, 'error', 'Sken se nepovedl: ' + e.message); }
  }

  // --- volání starého Chybožrouta
  async function legacyScan(win, path) {
    try {
      if (win.VAFT_CHYBOZROUT && typeof win.VAFT_CHYBOZROUT.scan === 'function') {
        const res = await Promise.resolve(win.VAFT_CHYBOZROUT.scan());
        if (Array.isArray(res)) res.forEach(r => addIssue(path, r.type || 'info', r.msg || JSON.stringify(r)));
      }
    } catch (e) { addIssue(path, 'warn', 'Legacy scan selhal: ' + e.message); }
  }

  // --- zpracování fronty
  function nextInQueue() {
    if (!state.queue.length) { addLog('SUM', 'log', 'Sken dokončen'); renderIssues(); return; }
    const path = state.queue.shift();
    state.current = path;
    try { probe.src = path; } catch { addIssue(path, 'error', 'Neplatná adresa'); nextInQueue(); }
  }

  // --- po načtení iframu
  probe.addEventListener('load', () => {
    const path = state.current;
    const win = probe.contentWindow;
    try { void win.document.title; } catch { addIssue(path, 'error', 'Jiný původ (doména)'); return nextInQueue(); }
    addLog(path, 'log', 'Načteno ' + win.location.href);
    hookConsole(win, path);
    structuralScan(win, path);
    legacyScan(win, path).finally(() => setTimeout(nextInQueue, 300));
  });

  // --- ovládání
  scanBtn.addEventListener('click', () => {
    reset();
    const paths = parsePaths(targetInput.value.trim());
    const origin = location.origin;
    if (paths.some(u => new URL(u).origin !== origin)) {
      resultsEl.innerHTML = `<div class="issue"><span class="dot" style="background:#f55"></span><b>ERROR</b> — Některá cesta není na stejném původu (${origin})</div>`;
      return;
    }
    state.queue = paths;
    resultsEl.innerHTML = 'Skenuji…';
    nextInQueue();
  });

  exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({
      generatedAt: new Date().toISOString(),
      issuesByPath: state.issuesByPath,
      logsByPath: state.logsByPath
    }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vaft-chybozrout-report.json';
    a.click();
  });

  clearBtn.addEventListener('click', () => { reset(); resultsEl.innerHTML = 'Vyčištěno'; });
  toggleLogBtn.addEventListener('click', () => {
    showLog = !showLog;
    if (showLog) {
      logEl.textContent = '';
      for (const [path, lines] of Object.entries(state.logsByPath))
        lines.forEach(line => logEl.textContent += `[${path}] ${line}\n`);
    }
  });

  // --- service worker pro Chybožrouta
  if ('serviceWorker' in navigator)
    window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
})();
