// repairnet.js — v2.3-stable (safe crawler + detectors + iOS-friendly)
(function () {
  // ——— nastavení ———
  const MAX_FILES   = 200;          // tvrdý strop
  const PAUSE_MS    = 150;          // malý oddech mezi requesty (iOS stabilita)
  const START_PATHS = [
    './',                           // KOŘEN TOHOTO REPA (správně!)
    './Revia/',
    './Braska-Hlava/',
    './Hlavoun/',
    './Meziprostor-Core/',
    './VAFT-Network/'
  ];

  // základ: drž se v rámci stejného repa a stejného originu
  const ORIGIN = location.origin;
  const BASE   = new URL('./', location.href);   // <— klíčová změna z ../ na ./

  // util
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  function sameOrigin(u){ try{ return new URL(u, BASE).origin === ORIGIN; }catch{ return false; } }
  function norm(u){ return new URL(u, BASE).href; }

  // vytáhni odkazy a skripty z HTML
  function extractLinks(html, baseHref) {
    const out = { htmls: [], jss: [] };

    // hrefs (a, link)
    const hrefs = [...html.matchAll(/href=["']([^"']+)["']/gi)].map(m=>m[1]);
    hrefs.forEach(h => {
      if (!h || h.startsWith('#') || h.startsWith('mailto:') || h.startsWith('tel:')) return;
      const url = new URL(h, baseHref);
      if (!sameOrigin(url)) return;
      if (!url.pathname.startsWith(BASE.pathname)) return;
      if (url.pathname.endsWith('/'))      out.htmls.push(url.href + 'index.html');
      else if (url.pathname.endsWith('.html')) out.htmls.push(url.href);
      else if (url.pathname.endsWith('.js'))   out.jss.push(url.href);
    });

    // <script src="">
    const srcs = [...html.matchAll(/<script[^>]*src=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1]);
    srcs.forEach(s => {
      const url = new URL(s, baseHref);
      if (sameOrigin(url) && url.pathname.startsWith(BASE.pathname) && url.pathname.endsWith('.js')) {
        out.jss.push(url.href);
      }
    });

    out.htmls = [...new Set(out.htmls)];
    out.jss   = [...new Set(out.jss)];
    return out;
  }

  // detektory problémů
  function analyzeHTML(url, html) {
    const issues = [];
    const opens  = (html.match(/<script\b/gi) || []).length;
    const closes = (html.match(/<\/script>/gi) || []).length;
    if (opens !== closes) issues.push({type:'error', msg:`${url}: Nesedí počet <script> (${opens}) vs </script> (${closes})`});
    if (html.includes('<script><script>')) issues.push({type:'error', msg:`${url}: Vnořený <script> nalezen`});

    const tail = html.split('</html>')[1];
    if (tail && tail.trim().length) issues.push({type:'error', msg:`${url}: Obsah/scripty za </html>`});

    const swBlocks = (html.match(/navigator\.serviceWorker\.register\(/g) || []).length;
    if (swBlocks > 1) issues.push({type:'warn', msg:`${url}: Více Service Worker registrací: ${swBlocks}× (ponech jen jednu)`});

    const switchDefs = (html.match(/function\s+vaftSwitchPanel\s*\(/g) || []).length;
    if (switchDefs > 1) issues.push({type:'warn', msg:`${url}: Duplicitní vaftSwitchPanel: ${switchDefs}×`});

    const coreDefs = (html.match(/VAFT_CORE/g) || []).length;
    if (coreDefs > 1) issues.push({type:'warn', msg:`${url}: Vícenásobné zmínky VAFT_CORE: ${coreDefs}× (zkontroluj definici)`});

    const hudHints = (html.match(/#vaft-hud|status orchestr|beings/gi) || []).length;
    if (hudHints > 1) issues.push({type:'warn', msg:`${url}: Více HUD implementací (sjednotit)`});

    return issues;
  }

  function analyzeJS(url, js) {
    const issues = [];
    const intervals = (js.match(/setInterval\s*\(/g) || []).length;
    if (intervals > 2) issues.push({type:'warn', msg:`${url}: Hodně setInterval(): ${intervals}× — zvaž CalmPulse (rAF + setTimeout)`});

    if (/location\.reload\s*\(\s*\)/.test(js) && /serviceWorker/.test(js)) {
      issues.push({type:'warn', msg:`${url}: SW + hard reload → možné smyčky (na iOS přidej debounce)`});
    }

    const switchDefs = (js.match(/function\s+vaftSwitchPanel\s*\(/g) || []).length;
    if (switchDefs > 1) issues.push({type:'warn', msg:`${url}: Duplicitní vaftSwitchPanel v JS: ${switchDefs}×`});
    const coreDefs = (js.match(/VAFT_CORE/g) || []).length;
    if (coreDefs > 1) issues.push({type:'warn', msg:`${url}: Duplicitní VAFT_CORE zmínky v JS: ${coreDefs}×`});

    return issues;
  }

  async function fetchText(url) {
    try {
      // cache-bust + same-origin only
      const sep = url.includes('?') ? '&' : '?';
      const r = await fetch(url + sep + 'v=' + Date.now(), { credentials:'same-origin' });
      if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
      return await r.text();
    } catch (e) {
      return { __error: e.message || String(e) };
    }
  }

  async function crawl(startUrls) {
    const Q = [...new Set(startUrls.map(norm))];
    const seen = new Set();
    const htmlFiles = [];
    const jsFiles   = [];
    const issues    = [];
    let scanned     = 0;

    while (Q.length && (htmlFiles.length + jsFiles.length) < MAX_FILES) {
      const raw = Q.shift();
      const u   = raw.endsWith('/') ? (raw + 'index.html') : raw;
      if (seen.has(u)) continue;
      seen.add(u);
      scanned++;

      const txt = await fetchText(u);
      await sleep(PAUSE_MS);  // iOS-friendly

      if (typeof txt === 'object' && txt.__error) {
        issues.push({type:'error', msg:`${u}: Nelze načíst (${txt.__error})`});
        continue;
      }

      if (u.endsWith('.html')) {
        htmlFiles.push(u);
        issues.push(...analyzeHTML(u, txt));
        const found = extractLinks(txt, u);
        found.htmls.forEach(h => { if (!seen.has(h)) Q.push(h); });
        found.jss.forEach(j => { if (!seen.has(j)) Q.push(j); });
      } else if (u.endsWith('.js')) {
        jsFiles.push(u);
        issues.push(...analyzeJS(u, txt));
      }
    }

    return { htmlFiles, jsFiles, issues, scanned, capped: (htmlFiles.length + jsFiles.length) >= MAX_FILES };
  }

  // veřejné API pro UI Chybožrouta
  window.RepairNet = {
    version: '2.3-stable',
    async scanDeep() {
      const start = START_PATHS.map(p => new URL(p, BASE).href);
      const res = await crawl(start);

      // naučící mód, když běží „armáda“
      try {
        if (window.VAFT_REPAIRNET && res.issues) {
          res.issues.forEach(i => VAFT_REPAIRNET.learn({ path:'(deep)', kind:'issue', type:i.type, msg:i.msg }));
        }
      } catch {}

      const lines = [];
      lines.push(`Nalezeno HTML: ${res.htmlFiles.length}, JS: ${res.jsFiles.length}, skenováno objektů: ${res.scanned}${res.capped?' (limit dosažen)':''}`);
      res.issues.forEach(i => lines.push(`${i.type === 'error' ? '❌' : i.type === 'warn' ? '⚠️' : 'ℹ️'} ${i.msg}`));
      if (!res.issues.length) lines.push('✅ Bez zjevných problémů.');

      const risk = res.issues.some(i =>
        i.msg.includes('Service Worker') || i.msg.includes('vaftSwitchPanel') ||
        i.msg.includes('Obsah/scripty za </html>') || i.msg.includes('setInterval')
      );
      if (risk) {
        lines.push('💡 Tip: Pády na iOS často způsobí: vícenásobný Service Worker, duplicitní vaftSwitchPanel/VAFT_CORE, obsah po </html>, přemíra setInterval.');
      }
      return lines;
    }
  };
})();
