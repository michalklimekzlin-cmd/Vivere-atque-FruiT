// vaft.kernel.js — Vivere atque Frui¡'T – centrální inteligence
// verze jádra:
(function () {
  const KERNEL_VERSION = "1.1.0";

  // klíče v localStorage (společná krev)
  const LS_REGISTRY   = "vaft_registry_v1";     // kdo žije
  const LS_MATERIAL   = "vaft_materials_v1";    // digitální hmota
  const LS_LAST_TICK  = "vaft_last_tick_v1";    // poslední tep
  const LS_HUNGER     = "vaft_hunger_v1";       // hlad světa
  const LS_STATE      = "vaft_state_v1";        // mód: core-drive / distributed
  const LS_REMOTE_BUF = "vaft_remote_buf_v1";   // kam může internet něco přihodit

  // limity – ať se to hned nevysype
  const MAX_MATERIALS = 300;
  const MAX_REGISTRY  = 50;
  const MAX_REMOTE    = 100;

  // kdo jsem – podle cesty nebo title
  const CURRENT_ID = (() => {
    try {
      const parts = location.pathname.split("/").filter(Boolean);
      return parts[parts.length - 1] || (document.title || "VAFT-Unknown");
    } catch (e) {
      return "VAFT-Unknown";
    }
  })();

  // základní semínka světa – seed jazyk
  const SEEDS = [
    "Vivere atque Frui¡'T",
    "strom z meziprostoru",
    "panenka se srdcem",
    "duchová slečna",
    "medvědí hlava",
    "lilie světla",
    "hvězda s lebkou",
    "hodné holky",
    "brácha",
    "digitální batole",
    "glyph",
    "meziprostor žije"
  ];

  // utilky
  function loadJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || fallback); }
    catch (e) { return JSON.parse(fallback); }
  }
  function saveJSON(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // 1) registr – zapíše bytost a hned zkrátí
  function registerSelf(extra = {}) {
    const now = Date.now();
    let reg = loadJSON(LS_REGISTRY, "[]");

    const entry = {
      id: CURRENT_ID,
      title: document.title || CURRENT_ID,
      ts: now,
      ...extra
    };

    const idx = reg.findIndex(r => r.id === CURRENT_ID);
    if (idx >= 0) reg[idx] = entry;
    else reg.unshift(entry); // nejnovější dopředu

    if (reg.length > MAX_REGISTRY) reg = reg.slice(0, MAX_REGISTRY);
    saveJSON(LS_REGISTRY, reg);
    return reg;
  }

  // 2) materiál – tvorba digitálních kusů
  function makeMaterial(reason, nameFrom) {
    const pick = nameFrom || SEEDS[Math.floor(Math.random() * SEEDS.length)];
    return {
      id: "mat-" + Date.now() + "-" + Math.floor(Math.random() * 9999),
      name: pick,
      from: CURRENT_ID,
      reason: reason || "auto",
      kernel: KERNEL_VERSION,
      ts: Date.now()
    };
  }

  function getMaterials() {
    return loadJSON(LS_MATERIAL, "[]");
  }

  function pushMaterial(mat) {
    let mats = getMaterials();
    mats.unshift(mat);
    if (mats.length > MAX_MATERIALS) mats = mats.slice(0, MAX_MATERIALS); // MAZÁNÍ HNED
    saveJSON(LS_MATERIAL, mats);
  }

  // 3) vnitřní tep (čas + hlad + protipól)
  function internalPulse() {
    const now  = Date.now();
    const last = parseInt(localStorage.getItem(LS_LAST_TICK) || "0", 10);
    let hunger = parseInt(localStorage.getItem(LS_HUNGER)    || "0", 10);
    const reg  = loadJSON(LS_REGISTRY, "[]");
    const fewEntities = reg.length <= 2;

    // první spuštění
    if (!last) {
      pushMaterial(makeMaterial("first-boot", "první pulz Vivere"));
      localStorage.setItem(LS_LAST_TICK, String(now));
      localStorage.setItem(LS_HUNGER, "0");
      saveJSON(LS_STATE, { mode: "core-drive", ts: now, kernel: KERNEL_VERSION });
      return;
    }

    const diffMin = (now - last) / 60000;

    // hlad roste, když je ticho
    if (diffMin > 3) hunger += 1;
    else if (hunger > 0) hunger -= 1;

    // PROTIPÓL: když je málo bytostí nebo dlouho ticho → jádro pumpuje
    if (diffMin > 5 || hunger > 2 || fewEntities) {
      pushMaterial(makeMaterial("core-pulse"));
      saveJSON(LS_STATE, { mode: "core-drive", ts: now, kernel: KERNEL_VERSION });
    } else {
      saveJSON(LS_STATE, { mode: "distributed", ts: now, kernel: KERNEL_VERSION });
    }

    localStorage.setItem(LS_LAST_TICK, String(now));
    localStorage.setItem(LS_HUNGER, String(hunger));
  }

  // 4) volitelný net – když je, něco přihodí, ale hned zkrátí
  function tryFetchExtra() {
    if (!navigator.onLine) return;
    fetch("materials.json")
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        let buf = loadJSON(LS_REMOTE_BUF, "[]");
        data.forEach(item => {
          buf.unshift({ txt: item, ts: Date.now() });
        });
        if (buf.length > MAX_REMOTE) buf = buf.slice(0, MAX_REMOTE);
        saveJSON(LS_REMOTE_BUF, buf);
      })
      .catch(() => {});
  }

  // 5) reakční vrstvy – tuhle část můžeš v budoucnu rozšiřovat
  const REACTION_LAYERS = {
    "VAFT-GhostGirl": function () {
      const mats = getMaterials();
      if (!mats.length) return;
      const feedKey = "vaft_ghost_feed";
      let feed = loadJSON(feedKey, "[]");
      feed.unshift({ txt: "(šepot) " + mats[0].name, ts: Date.now() });
      if (feed.length > 80) feed = feed.slice(0, 80);
      saveJSON(feedKey, feed);
    },
    "VAFT-Lilies": function () {
      const mats = getMaterials();
      const pick =
        mats.find(m => /strom|lilie|příroda/i.test(m.name)) ||
        makeMaterial("nature-auto", "lilie světla");
      const feedKey = "vaft_lilies_feed";
      let feed = loadJSON(feedKey, "[]");
      feed.unshift({ txt: "🌸 " + pick.name, ts: Date.now() });
      if (feed.length > 80) feed = feed.slice(0, 80);
      saveJSON(feedKey, feed);
    },
    "VAFT-BearHead": function () {
      const reg = loadJSON(LS_REGISTRY, "[]");
      const feedKey = "vaft_bear_feed";
      let feed = loadJSON(feedKey, "[]");
      feed.unshift({
        txt: "🛡 hlídám: " + reg.map(r => r.id).join(", "),
        ts: Date.now()
      });
      if (feed.length > 80) feed = feed.slice(0, 80);
      saveJSON(feedKey, feed);
    },
    "VAFT-Star": function () {
      const mats = getMaterials();
      const last = mats[0] || makeMaterial("star-auto", "hrdinský úkol");
      const feedKey = "vaft_star_feed";
      let feed = loadJSON(feedKey, "[]");
      feed.unshift({ txt: "⭐ ÚKOL: použij " + last.name, ts: Date.now() });
      if (feed.length > 80) feed = feed.slice(0, 80);
      saveJSON(feedKey, feed);
    },
    "VAFT-Doll": function () {
      const mats = getMaterials();
      const last = mats[0] || makeMaterial("doll-auto", "vzpomínka");
      const feedKey = "vaft_doll_feed";
      let feed = loadJSON(feedKey, "[]");
      feed.unshift({ txt: "💗 " + last.name + " – chybíš mi", ts: Date.now() });
      if (feed.length > 80) feed = feed.slice(0, 80);
      saveJSON(feedKey, feed);
    },
    "VAFT-Lady": function () {
      const mats = getMaterials();
      const reg  = loadJSON(LS_REGISTRY, "[]");
      const feedKey = "vaft_lady_feed";
      let feed = loadJSON(feedKey, "[]");
      const comment = reg.length < 2
        ? "Tak málo bytostí? Elegance trpí."
        : "Svět je přijatelný. Materiálů: " + mats.length;
      feed.unshift({ txt: "🎭 " + comment, ts: Date.now() });
      if (feed.length > 80) feed = feed.slice(0, 80);
      saveJSON(feedKey, feed);
    },
    "Vivere": function () {
      // tady můžeš kreslit kuličku ve svojí hlavní appce
    }
  };

  // 6) mini view – ať i na mobilu vidíš stav
  function renderMiniView() {
    if (!document.body) return;
    const id = "vaftMiniView";
    if (document.getElementById(id)) return;
    const box = document.createElement("div");
    box.id = id;
    box.style.cssText = `
      position:fixed;top:8px;left:8px;z-index:9999;
      background:rgba(2,6,23,.75);color:#e2e8f0;
      font-family:system-ui,sans-serif;font-size:.65rem;
      padding:.4rem .6rem;border-radius:.5rem;max-width:220px;
    `;
    const mats  = getMaterials();
    const state = loadJSON(LS_STATE, '{"mode":"unknown"}');
    box.innerHTML = `<strong>${CURRENT_ID}</strong><br>
      mód: ${state.mode}<br>
      materiálů: ${mats.length}<br>
      jádro: ${KERNEL_VERSION}`;
    document.body.appendChild(box);
  }

  // 7) veřejné API – tohle budeš volat z index.html
  window.VAFT = {
    version: KERNEL_VERSION,
    boot(role) {
      const reg = registerSelf(role ? { role } : {});
      internalPulse();
      const layer = REACTION_LAYERS[CURRENT_ID];
      if (typeof layer === "function") layer();
      renderMiniView();
      tryFetchExtra();
      return {
        id: CURRENT_ID,
        registry: reg,
        materials: getMaterials()
      };
    },
    getMaterials,
    getRegistry() {
      return loadJSON(LS_REGISTRY, "[]");
    },
    registerLayer(name, fn) {
      REACTION_LAYERS[name] = fn;
    }
  };
})();
