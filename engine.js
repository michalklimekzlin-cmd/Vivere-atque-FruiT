// engine.js
// "meziprostor" – něco mezi světem a týmy, do budoucna sem jde WebGuardian, Iskry, Shop

const VAF_engine = (() => {
  const listeners = [];
  let logEl = null;

  function init(logElementId) {
    logEl = document.getElementById(logElementId);
    log("Meziprostor inicializován.");
  }

  function log(msg) {
    const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
    if (logEl) {
      logEl.textContent = line + "\n" + logEl.textContent;
    } else {
      console.log(line);
    }
  }

  // jednoduchý pub/sub – můžou se na to napojit týmy, guardian, shop...
  function subscribe(cb) {
    listeners.push(cb);
  }

  function pulse(from = "world", payload = {}) {
    log(`pulse od: ${from}`);
    listeners.forEach(cb => cb({ from, payload, at: Date.now() }));
  }

  // "virtuální soubory" – jen v localStorage, ne v reálném FS
  function saveModule(mod) {
    const mods = loadModules();
    const existing = mods.find(m => m.name === mod.name);
    if (existing) {
      existing.state = mod.state;
    } else {
      mods.push(mod);
    }
    localStorage.setItem("VAF_modules", JSON.stringify(mods));
    log(`modul ${mod.name} → ${mod.state}`);
    return mods;
  }

  function loadModules() {
    return JSON.parse(localStorage.getItem("VAF_modules") || "[]");
  }

  return {
    init,
    log,
    pulse,
    subscribe,
    saveModule,
    loadModules
  };
})();
