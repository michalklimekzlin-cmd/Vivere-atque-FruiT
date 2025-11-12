/* Chybožrout-Opravář – sken stejného původu */
(function () {
  const $ = (sel) => document.querySelector(sel);
  const targetInput = $('#targetUrl');
  const scanBtn = $('#scanBtn');
  const resultsEl = $('#results');
  const logEl = $('#log');
  const probe = $('#probe');
  const exportBtn = $('#exportBtn');
  const clearBtn = $('#clearBtn');
  const toggleLogBtn = $('#toggleLog');

  let issues = [];
  let logs = [];
  let showLog = true;
  let deferredPrompt;

  // PWA install
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    $('#installBtn').disabled = false;
  });
  $('#installBtn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  });

  function addIssue(type, msg) {
    issues.push({ t: Date.now(), type, msg });
    renderIssues();
  }
  function addLog(kind, msg) {
    const line = `[${new Date().toLocaleTimeString()}] ${kind.toUpperCase()} ${msg}`;
    logs.push(line);
    if (showLog) {
      logEl.textContent += line + '\n';
      logEl.scrollTop = logEl.scrollHeight;
    }
  }
  function renderIssues() {
    if (!issues.length) {
      resultsEl.innerHTML = '<div class="muted">Žádné problémy nenalezeny ✅</div>';
      return;
    }
    resultsEl.innerHTML = issues.map(i => {
      const color = i.type === 'error' ? '#ff6a6a' : (i.type === 'warn' ? '#ffc46a' : '#9fe29f');
      return `<div class="issue"><span class="dot" style="background:${color}"></span><b>${i.type.toUpperCase()}</b> — ${i.msg}</div>`;
    }).join('');
  }
  function reset() {
    issues = [];
    logs = [];
    resultsEl.innerHTML = 'Skenuji…';
    logEl.textContent = '';
  }

  // ZACHYTÁVÁNÍ LOGŮ uvnitř cílové stránky (jen same-origin)
  function hookConsole(win) {
    if (!win || !win.console) return;
    try {
      const orig = { log: win.console.log, warn: win.console.warn, error: win.console.error };
      win.console.log = (...a)=>{ addLog('log', a.join(' ')); try{orig.log.apply(win.console,a);}catch{} };
      win.console.warn = (...a)=>{ addLog('warn', a.join(' ')); try{orig.warn.apply(win.console,a);}catch{} };
      win.console.error= (...a)=>{ addLog('error',a.join(' ')); try{orig.error.apply(win.console,a);}catch{} };
      win.addEventListener('error', e => addLog('error', `${e.message} @${e.filename}:${e.lineno}`));
      win.addEventListener('unhandledrejection', e => addLog('error', 'Promise: ' + (e.reason && e.reason.message || String(e.reason))));
    } catch {}
  }

  // VLASTNÍ SKEN – čte HTML a skripty stránky
  function runScans(win) {
    try {
      const doc = win.document;
      const html = doc.documentElement.outerHTML || '';
      const scripts = Array.from(doc.querySelectorAll('script'))
        .map(s => s.textContent || '');

      // 1) SW registrace
      const swCount = scripts.filter(t => /navigator\.serviceWorker\.register\(/.test(t)).length;
      if (swCount > 1) addIssue('error', `Vícenásobná registrace Service Workeru: ${swCount}× (ponech jen jednu).`);
      else if (swCount === 1) addIssue('info', 'Service Worker registrace: 1× (OK).');
      else addIssue('warn', 'Service Worker neregistrován (zvaž PWA).');

      // 2) Duplicitní vaftSwitchPanel
      const tabDefs = scripts.filter(t => /function\s+vaftSwitchPanel\s*\(/.test(t)).length;
      if (tabDefs > 1) addIssue('warn', `Duplicitní definice vaftSwitchPanel: ${tabDefs}× (ponech jednu).`);

      // 3) VAFT_CORE vícekrát
      const coreDefs = scripts.filter(t => /win\.VAFT_CORE|window\.VAFT_CORE/.test(t)).length;
      if (coreDefs > 1) addIssue('warn', `VAFT_CORE definován ${coreDefs}× (ponech 1 nejnovější).`);

      // 4) Vnořené <script> nebo neuzavřené tagy
      const opens = (html.match(/<script\b/gi) || []).length;
      const closes = (html.match(/<\/script>/gi) || []).length;
      if (opens !== closes) addIssue('error', `Nesouhlasí počet <script> (${opens}) a </script> (${closes}).`);
      if (html.includes('<script><script>')) addIssue('error', 'Vnořený <script> nalezen – oprav uzavírání bloků.');

      // 5) Tickery a pulsy (hrubý signál)
      const intervals = scripts.reduce((n,t)=> n + (t.match(/setInterval\s*\(/g)||[]).length, 0);
      if (intervals > 2) addIssue('warn', `Mnoho setInterval(): ${intervals}× – zvaž CalmPulse (rAF+setTimeout).`);
      // indikace "tick()" použití
      if (scripts.some(t => /function\s+tick\s*\(/.test(t))) addIssue('info', 'Nalezen tick() – zkontroluj způsob volání (rAF doporučen).');

      // 6) Více HUDů
      const hudHints = scripts.filter(t => /#vaft-hud|hud\.style|status orchestr|beings/.test(t)).length;
      if (hudHints > 1) addIssue('warn', 'Více HUD implementací – sjednoť na jednu variantu.');

      // 7) Obsah za </html>
      const tail = html.split('</html>')[1];
      if (tail && tail.trim().length) addIssue('error', 'Obsah/skripty za </html> – odstraň vše po uzavření dokumentu.');

      renderIssues();
    } catch (e) {
      addIssue('error', 'Sken se nepovedl: ' + (e.message || e));
    }
  }

  // Ovládání
  scanBtn.addEventListener('click', () => {
    reset();
    const url = targetInput.value.trim() || '../';
    // pokud zadáš relativní cestu, převedeme na absolutní v rámci stejného původu
    try {
      const abs = new URL(url, location.href).href;
      probe.src = abs;
    } catch {
      addIssue('error', 'Neplatná adresa.');
    }
  });

  probe.addEventListener('load', () => {
    const win = probe.contentWindow;
    // kontrola stejného původu
    try {
      void win.document.title; // vyvolá DOMException na cizím původu
    } catch {
      addIssue('error', 'Cílová adresa není na stejném původu (doméně) – z bezpečnostních důvodů nemohu skenovat.');
      return;
    }
    hookConsole(win);
    addLog('log', 'Cílová stránka načtena: ' + win.location.href);
    runScans(win);
  });

  exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ issues, logs }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vaft-chybozrout-report.json';
    a.click();
  });

  clearBtn.addEventListener('click', () => {
    issues = [];
    logs = [];
    renderIssues();
    logEl.textContent = '';
  });

  toggleLogBtn.addEventListener('click', () => {
    showLog = !showLog;
    if (showLog) {
      logEl.textContent = logs.join('\n') + (logs.length ? '\n' : '');
    }
  });

  // SW pro samotného Chybožrouta
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
    });
  }
})();
