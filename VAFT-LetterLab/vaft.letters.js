window.VAFT = window.VAFT || {};

VAFT.letters = (function() {
  const nodes = [
    { id: "house1", name: "Dům / Barák", letters: ["D","U","M"], cooldown: 8000, last: 0 },
    { id: "lab1", name: "Laboratoř", letters: ["L","A","B"], cooldown: 12000, last: 0 },
    { id: "tree1", name: "Strom", letters: ["S","T","R","O","M"], cooldown: 15000, last: 0 },
    { id: "ai-core", name: "AI jádro", letters: ["A","I"], cooldown: 6000, last: 0 }
  ];

  let bag = loadBag();

  const recipes = [
    { id: "build_house2", word: "DUM", label: "Vylepšit dům (DUM)", desc: "Odemkne lepší budovu." },
    { id: "lab_upgrade", word: "LAB", label: "Upgrade laboratoře (LAB)", desc: "Lepší výzkum." },
    { id: "ai_bros", word: "MIZA", label: "Posílit AI brášku (MIZA)", desc: "Propojení s AI týmem." },
    { id: "vivere", word: "VIVERE", label: "Vivere boost (VIVERE)", desc: "Symbolické vylepšení světa." }
  ];

  function init() {
    renderLetterBar();
    renderNodes();
    renderRecipes();
  }

  function renderLetterBar() {
    const bar = document.getElementById("letter-bar");
    if (!bar) return;
    bar.innerHTML = "";
    const keys = Object.keys(bag).sort();
    if (!keys.length) {
      bar.textContent = "Nemáš zatím žádná písmenka. Klepni na Dům, Laboratoř nebo Strom.";
      return;
    }
    keys.forEach(k => {
      const span = document.createElement("span");
      span.className = "letter-pill";
      span.textContent = k + " × " + bag[k];
      bar.appendChild(span);
    });
  }

  function renderNodes() {
    const wrap = document.getElementById("node-list");
    if (!wrap) return;
    wrap.innerHTML = "";
    const now = Date.now();

    nodes.forEach(n => {
      const div = document.createElement("div");
      div.className = "node";
      const left = document.createElement("div");
      left.innerHTML = `<strong>${n.name}</strong><br><small>${n.letters.join(" • ")}</small>`;
      const right = document.createElement("div");
      const ready = now - n.last >= n.cooldown;
      right.textContent = ready ? "➕" : "…";
      if (!ready) right.style.opacity = ".35";

      div.appendChild(left);
      div.appendChild(right);
      div.addEventListener("click", () => collectFromNode(n));
      wrap.appendChild(div);
    });
  }

  function renderRecipes() {
    const wrap = document.getElementById("recipe-list");
    if (!wrap) return;
    wrap.innerHTML = "";

    recipes.forEach(r => {
      const div = document.createElement("div");
      div.className = "recipe";
      const can = canCraftWord(r.word);
      div.innerHTML = `
        <div><strong>${r.label}</strong></div>
        <div style="font-size:11px;opacity:.7">Potřebuješ: ${prettyWord(r.word)}</div>
        <div style="font-size:11px;opacity:.5">${r.desc || ""}</div>
      `;
      const btn = document.createElement("button");
      btn.textContent = can ? "Vytvořit / Zaplatit" : "Chybí písmenka";
      btn.disabled = !can;
      btn.addEventListener("click", () => craft(r));
      div.appendChild(btn);
      wrap.appendChild(div);
    });
  }

  function collectFromNode(node) {
    const now = Date.now();
    if (now - node.last < node.cooldown) {
      log(`⏳ ${node.name} ještě není připravený.`);
      return;
    }
    node.last = now;
    addLetters(node.letters);
    renderNodes();
    log(`📦 Získal jsi: ${node.letters.join(", ")}`);
  }

  function addLetters(lettersArr) {
    lettersArr.forEach(l => {
      const up = l.toUpperCase();
      bag[up] = (bag[up] || 0) + 1;
    });
    saveBag();
    renderLetterBar();
  }

  function canCraftWord(word) {
    const need = {};
    word.toUpperCase().split("").forEach(ch => {
      need[ch] = (need[ch] || 0) + 1;
    });
    for (const ch in need) {
      if ((bag[ch] || 0) < need[ch]) return false;
    }
    return true;
  }

  function consumeWord(word) {
    word.toUpperCase().split("").forEach(ch => {
      bag[ch] -= 1;
      if (bag[ch] <= 0) delete bag[ch];
    });
    saveBag();
    renderLetterBar();
  }

  function craft(recipe) {
    if (!canCraftWord(recipe.word)) {
      log("❌ Nemáš dost písmen.");
      return;
    }
    consumeWord(recipe.word);
    log("✅ Zaplaceno slovem: " + recipe.word.toUpperCase() + " → tady může svět reagovat.");

    // TADY se to může napojit na tvoje ostatní moduly:
    // if (window.VAFT && VAFT.world && typeof VAFT.world.apply === "function") {
    //   VAFT.world.apply(recipe.id);
    // }

    renderRecipes();
  }

  function saveBag() {
    try { localStorage.setItem("VAFT_LETTERS_BAG", JSON.stringify(bag)); } catch (e) {}
  }
  function loadBag() {
    try {
      const raw = localStorage.getItem("VAFT_LETTERS_BAG");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  }

  function prettyWord(w) {
    return w.toUpperCase().split("").join(" • ");
  }

  function log(msg) {
    const el = document.getElementById("lab-log");
    if (!el) return;
    el.textContent = msg;
  }

  return {
    init,
    addLetters,
    canCraftWord
  };
})();
