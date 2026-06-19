// vaft.all.js
// sjednocující startér pro celý Vivere atque Frui¡'T
// nic nepřepisuje, jen zapíná to, co v okně existuje

(function() {
  // zajistíme, že VAFT existuje
  window.VAFT = window.VAFT || {};

  // 1) spustit hlavní jádro, pokud je načtené
  if (typeof VAFT.boot === "function") {
    try {
      VAFT.boot();
      console.log("VAFT: boot OK");
    } catch (e) {
      console.warn("VAFT: boot selhal", e);
    }
  }

  // 2) palivo (písmena jako energie)
  if (VAFT.fuel && typeof VAFT.fuel.init === "function") {
    try {
      VAFT.fuel.init();
      console.log("VAFT: fuel init");
    } catch (e) {
      console.warn("VAFT: fuel init selhal", e);
    }
  }

  // 3) kouzla (text → akce ve světě)
  if (VAFT.spell && typeof VAFT.spell.cast === "function") {
    console.log("VAFT: spell modul připraven");
  }

  // 4) LetterLab (obchod / laboratoř s písmeny)
  if (VAFT.letters && typeof VAFT.letters.init === "function") {
    try {
      VAFT.letters.init();
      console.log("VAFT: letters init");
    } catch (e) {
      console.warn("VAFT: letters init selhal", e);
    }
  }

  // 5) mapový svět (dům + stromy)
  if (VAFT.mapWorld && typeof VAFT.mapWorld.init === "function") {
    try {
      VAFT.mapWorld.init();
      console.log("VAFT: mapWorld init");
    } catch (e) {
      console.warn("VAFT: mapWorld init selhal", e);
    }
  }

  // 6) připravíme jednotné API pro spawn
  // aby všechny moduly mohly říct: VAFT.ALL.spawn({type:"tree", ...})
  const ALL = {};

  ALL.spawn = function(opts) {
    // 1) zkus oficiální VAFT.world
    if (VAFT.world && typeof VAFT.world.spawn === "function") {
      return VAFT.world.spawn(opts);
    }
    // 2) zkus mapWorld
    if (VAFT.mapWorld && typeof VAFT.mapWorld.addTreeNearHouse === "function") {
      if (opts && opts.type === "tree") {
        for (let i = 0; i < (opts.count || 1); i++) {
          VAFT.mapWorld.addTreeNearHouse();
        }
      }
    }
  };

  // 7) sjednotíme práci s palivem
  ALL.hasFuel = function(word) {
    if (VAFT.fuel && typeof VAFT.fuel.hasWord === "function") {
      return VAFT.fuel.hasWord(word);
    }
    return true; // když není fuel, neblokujeme
  };

  ALL.consume = function(word) {
    if (VAFT.fuel && typeof VAFT.fuel.consumeWord === "function") {
      return VAFT.fuel.consumeWord(word);
    }
  };

  // 8) případné heartbeat napojení (když není už v tvém heartbeat)
  // tohle je jen záloha – když už to máš ve vaft.heartbeat.js, klidně smaž
  if (VAFT.fuel && typeof VAFT.fuel.generateRandom === "function") {
    // malý bezpečný timer, kdyby heartbeat nebyl načtený
    setInterval(function() {
      VAFT.fuel.generateRandom();
    }, 30000); // každých 30 s jedno písmeno
  }

  // vystavíme
  VAFT.ALL = ALL;

  console.log("VAFT: all-modul aktivní");
})();
