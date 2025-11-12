/* VAFT RepairNet — roj verzí Chybožroutů (učí se z nálezů a oprav) */
(function (win) {
  const LS_AGENTS   = 'VAFT_REPAIRNET_AGENTS';
  const LS_PATTERNS = 'VAFT_REPAIRNET_PATTERNS';
  const LS_HISTORY  = 'VAFT_FIX_HISTORY';
  const LS_LASTSCAN = 'VAFT_REPAIRNET_LASTSCAN';

  function load(key, def){ try{ return JSON.parse(localStorage.getItem(key)||'') || def; }catch{ return def; } }
  function save(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch{} }

  const net = win.VAFT_REPAIRNET = win.VAFT_REPAIRNET || {
    agents:   load(LS_AGENTS, []),
    patterns: load(LS_PATTERNS, []),
    history:  load(LS_HISTORY, []),

    register(agent){                   // {id, version, parent, skills:[], motto}
      const exists = this.agents.find(a=>a.id===agent.id);
      if (!exists) { this.agents.push({...agent, ts: Date.now()}); save(LS_AGENTS, this.agents); }
      return agent.id;
    },

    learn(event){                      // {path, kind:'issue|fix', type, msg, data}
      const rec = {...event, ts: Date.now()};
      this.history.push(rec); save(LS_HISTORY, this.history);

      // jednoduché pravidlo učení → generuj/posiluj patterny
      const key = (rec.type||rec.msg||'').slice(0,64);
      if (!key) return;

      let p = this.patterns.find(x=>x.key===key);
      if (!p) {
        // předpřipravené regexy pro naše typy (SAFE)
        const presets = {
          'sw-multi': { name:'Více SW registrací', rx:/navigator\.serviceWorker\.register\(/g, kind:'detect', safe:true, active:true, fix:'sw-singleton' },
          'tail-after-html': { name:'Obsah po </html>', rx:/<\/html>[\s\S]+$/i, kind:'detect', safe:true, active:true, fix:'trim-after-html' },
          'vaftSwitchPanel-dup': { name:'Duplicitní vaftSwitchPanel', rx:/function\s+vaftSwitchPanel\s*\(/g, kind:'detect', safe:true, active:true, fix:'keep-last-def' },
          'VAFT_CORE-dup': { name:'Duplicitní VAFT_CORE', rx:/VAFT_CORE/g, kind:'detect', safe:true, active:true, fix:'keep-last-core' },
          'script-mismatch': { name:'Nesoulad <script>', rx:/<script\b|<\/script>/ig, kind:'detect', safe:true, active:false }
        };
        const preset = presets[rec.type] || null;
        p = { key, count:0, ...(preset||{ name:key, rx:null, kind:'detect', safe:true, active:true }) };
        this.patterns.push(p);
      }
      p.count++; save(LS_PATTERNS, this.patterns);
    },

    getPatterns({safeOnly=true}={}){ return this.patterns.filter(p=>p.active && (!safeOnly || p.safe)); },

    shouldDailyScan(){
      const last = localStorage.getItem(LS_LASTSCAN);
      const today = new Date().toISOString().slice(0,10);
      if (last === today) return false;
      localStorage.setItem(LS_LASTSCAN, today);
      return true;
    }
  };

  // zaregistruj aktuálního opraváře (tahle PWA)
  net.register({
    id: 'chybozrout-2.1-safe',
    version: '2.1',
    parent: '2.0',
    skills: ['scan-multi','fix-sw-singleton','fix-trim-after-html','learn-history'],
    motto: 'Víc hlav, víc ví.'
  });

})(window);
