// vaft.fuel.js
// centrální nádrž paliva pro Vivere atque FruiT
// palivo = písmenka

window.VAFT = window.VAFT || {};

VAFT.fuel = (function() {
  // načteme dosavadní palivo z localStorage
  let bag = loadBag();

  // abeceda pro náhodné generování
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // init můžeš volat z index.html po VAFT.boot()
  function init() {
    // tady zatím nic automaticky nespouštíme,
    // generování dělá heartbeat (vaft.heartbeat.js)
    renderCallback && renderCallback();
  }

  // přidá jedno nebo víc písmen do nádrže
  function addLetters(lettersArr) {
    lettersArr.forEach(l => {
      const up = l.toUpperCase();
      bag[up] = (bag[up] || 0) + 1;
    });
    saveBag();
    renderCallback && renderCallback();
  }

  // vygeneruje náhodné písmeno – volá se z heartbeatu
  function generateRandom() {
    const ch = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    addLetters([ch]);
  }

  // zjistí, jestli máme palivo na dané slovo
  function hasWord(word) {
    const need = {};
    word.toUpperCase().split("").forEach(ch => {
      need[ch] = (need[ch] || 0) + 1;
    });
    for (const ch in need) {
      if ((bag[ch] || 0) < need[ch]) return false;
    }
    return true;
  }

  // spálí (spotřebuje) palivo – zaplatíš slovem
  function consumeWord(word) {
    word.toUpperCase().split("").forEach(ch => {
      bag[ch] -= 1;
      if (bag[ch] <= 0) {
        delete bag[ch];
      }
    });
    saveBag();
    renderCallback && renderCallback();
  }

  // vrátí kopii nádrže
  function getBag() {
    return Object.assign({}, bag);
  }

  // možnost, aby si appka (třeba LetterLab) řekla:
  // "když se palivo změní, zavolej tohle"
  let renderCallback = null;
  function onRender(fn) {
    renderCallback = fn;
  }

  // uložit do localStorage
  function saveBag() {
    try {
      localStorage.setItem("VAFT_FUEL_BAG", JSON.stringify(bag));
    } catch (e) {
      // ignore
    }
  }

  // načíst z localStorage
  function loadBag() {
    try {
      const raw = localStorage.getItem("VAFT_FUEL_BAG");
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      // ignore
    }
    return {};
  }

  // veřejné API
  return {
    init,
    addLetters,
    generateRandom,
    hasWord,
    consumeWord,
    getBag,
    onRender
  };
})();
