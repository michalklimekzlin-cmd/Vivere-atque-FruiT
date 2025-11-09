// vaft.spell.js
// jednoduchý "řečový" modul pro Vivere atque FruiT
// čte věty typu: "2 stromy u baráku" a volá akci ve světě

window.VAFT = window.VAFT || {};

VAFT.spell = (function() {

  // malý slovník objektů, ať víme, co je co
  const OBJECT_ALIASES = {
    "strom": "tree",
    "stromy": "tree",
    "stromek": "tree",
    "stromky": "tree",

    "barak": "house",
    "baráku": "house",
    "dům": "house",
    "dum": "house",

    "lampa": "lamp",
    "lampy": "lamp"
  };

  // malý slovník míst
  const PLACE_ALIASES = {
    "u baraku": "house",
    "u baráku": "house",
    "u domu": "house",
    "u dum": "house"
  };

  // hlavní vstup
  function cast(phrase) {
    if (!phrase || typeof phrase !== "string") return;

    const raw = phrase.trim().toLowerCase();

    // najdeme číslo (pokud tam není, bereme 1)
    const numMatch = raw.match(/(\d+)/);
    const count = numMatch ? parseInt(numMatch[1], 10) : 1;

    // zjistíme, jaký objekt
    const objWord = findObjectWord(raw);
    const placeKey = findPlace(raw);

    // bezpečnost
    if (!objWord) {
      console.warn("spell: nenašel jsem objekt ve větě:", phrase);
      return;
    }

    const obj = OBJECT_ALIASES[objWord] || objWord;

    // palivo – zkusíme, jestli vůbec máme písmena na tohle kouzlo
    if (!hasFuelFor(obj)) {
      console.warn("spell: nedostatek paliva pro", obj);
      // tady můžeš dát UI hlášku
      return;
    }

    // a teď zavoláme svět
    if (window.VAFT && VAFT.world) {
      // pokud máme speciální spawn podle místa
      if (typeof VAFT.world.spawn === "function") {
        VAFT.world.spawn({
          type: obj,
          count: count,
          near: placeKey || null
        });
      } else if (typeof VAFT.world["spawn" + capitalize(obj)] === "function") {
        // např. VAFT.world.spawnTree(...)
        VAFT.world["spawn" + capitalize(obj)](count, placeKey || null);
      } else {
        console.log("spell: svět zatím neumí spawnout", obj, "→ jen loguju.");
      }
    } else {
      console.log("spell: VAFT.world není definován, ale kouzlo jsem přečetl:", {obj, count, placeKey});
    }
  }

  // najde slovo, které odpovídá objektu
  function findObjectWord(text) {
    const words = text.split(/\s+/);
    for (let w of words) {
      w = normalize(w);
      if (OBJECT_ALIASES[w]) return w;
    }
    return null;
  }

  // najde místo
  function findPlace(text) {
    text = text.replace(/\s+/g, " ").trim();
    for (const k in PLACE_ALIASES) {
      if (text.includes(k)) {
        return PLACE_ALIASES[k];
      }
    }
    return null;
  }

  // zkontroluje palivo (hodně zjednodušené)
  function hasFuelFor(obj) {
    if (!window.VAFT || !VAFT.fuel || typeof VAFT.fuel.hasWord !== "function") {
      return true; // když není fuel, neblokujeme
    }
    // pro strom čekáme slovo STROM, pro dům DUM, atd.
    if (obj === "tree") {
      return VAFT.fuel.hasWord("STROM");
    }
    if (obj === "house") {
      return VAFT.fuel.hasWord("DUM") || VAFT.fuel.hasWord("BARAK");
    }
    return true;
  }

  function normalize(w) {
    return w
      .toLowerCase()
      .replace("á","a")
      .replace("é","e")
      .replace("í","i")
      .replace("ý","y")
      .replace("ů","u")
      .replace("ú","u")
      .replace("ó","o")
      .replace("ř","r")
      .replace("č","c")
      .replace("š","s")
      .replace("ž","z")
      .replace("ť","t")
      .replace("ď","d")
      .replace("ň","n");
  }

  function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  // veřejné API
  return {
    cast
  };
})();
