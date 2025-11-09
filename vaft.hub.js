// vaft.hub.js – mobilní spodní panel
(function() {
  if (document.getElementById("vaft-hub-trigger")) return;

  // tvoje skupiny podle repa
  const GROUPS = [
    {
      name: "🧠 Core / AI / Hlava",
      items: [
        { name: "Braska-Hlava", url: "./Braska-Hlava/" },
        { name: "Hlavoun", url: "./Hlavoun/" },
        { name: "Michal-AI-Al-Klimek", url: "./Michal-AI-Al-Klimek/" },
        { name: "Meziprostor-Core", url: "./Meziprostor-Core/" }
      ]
    },
    {
      name: "🛠 VAFT moduly",
      items: [
        { name: "VAFT-LetterLab", url: "./VAFT-LetterLab/" },
        { name: "VAFT-Game", url: "./VAFT-Game/" },
        { name: "VAFT-Doll", url: "./VAFT-Doll/" },
        { name: "VAFT-BearHead", url: "./VAFT-BearHead/" },
        { name: "VAFT-Lady", url: "./VAFT-Lady/" },
        { name: "VAFT-Jizva", url: "./VAFT-Jizva/" }
      ]
    },
    {
      name: "🌍 Mapy / světy",
      items: [
        { name: "Vivere", url: "./Vivere/" },
        { name: "mapa", url: "./mapa/" },
        { name: "mapa-3d", url: "./mapa-3d/" },
        { name: "VAFT-MapWorld", url: "./VAFT-MapWorld/" }
      ]
    },
    {
      name: "🎭 Postavy / vizuál",
      items: [
        { name: "VAFT-GhostGirl", url: "./VAFT-GhostGirl/" },
        { name: "VAFT-Girls", url: "./VAFT-Girls/" },
        { name: "VAFT-Lilies", url: "./VAFT-Lilies/" },
        { name: "VAFT-StarSkull", url: "./VAFT-StarSkull/" }
      ]
    },
    {
      name: "⚗️ Build / test",
      items: [
        { name: "build", url: "./build/" }
      ]
    }
  ];

  // 1) malý trigger dole (pásek)
  const trigger = document.createElement("div");
  trigger.id = "vaft-hub-trigger";
  trigger.innerHTML = `VAFT – tvoje appky`;
  document.body.appendChild(trigger);

  // 2) samotný panel (skrytý)
  const panel = document.createElement("div");
  panel.id = "vaft-hub-panel";
  panel.innerHTML = `
    <div id="vaft-hub-top">
      <div>Vivere atque FruiT • vše v jednom</div>
      <button id="vaft-hub-close">✕</button>
    </div>
    <div id="vaft-hub-groups"></div>
    <div id="vaft-hub-actions">
      <button data-act="fuel">palivo</button>
      <button data-act="spell">kouzlo</button>
      <button data-act="tree">strom</button>
    </div>
  `;
  document.body.appendChild(panel);

  // 3) styly
  const style = document.createElement("style");
  style.textContent = `
    #vaft-hub-trigger {
      position: fixed;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,.65);
      border: 1px solid rgba(255,255,255,.04);
      border-radius: 999px;
      padding: 6px 14px 5px;
      font-family: system-ui,-apple-system,sans-serif;
      font-size: 12px;
      color: #fff;
      z-index: 9998;
      backdrop-filter: blur(10px);
    }
    #vaft-hub-panel {
      position: fixed;
      left: 0;
      right: 0;
      bottom: -100%;
      height: 62vh;
      background: rgba(1,2,6,.92);
      border-top: 1px solid rgba(255,255,255,.03);
      backdrop-filter: blur(18px);
      z-index: 9999;
      transition: bottom .25s ease;
      display: flex;
      flex-direction: column;
      font-family: system-ui,-apple-system,sans-serif;
    }
    #vaft-hub-panel.open {
      bottom: 0;
    }
    #vaft-hub-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px 6px;
      font-size: 12px;
      font-weight: 600;
    }
    #vaft-hub-top button {
      background: none;
      border: none;
      color: #fff;
      font-size: 16px;
      cursor: pointer;
    }
    #vaft-hub-groups {
      flex: 1;
      overflow-y: auto;
      padding: 4px 10px 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .vaft-group {
      background: rgba(255,255,255,.01);
      border: 1px solid rgba(255,255,255,.01);
      border-radius: 10px;
    }
    .vaft-group-head {
      display: flex;
      justify-content: space-between;
      padding: 5px 8px 4px;
      font-size: 11px;
      cursor: pointer;
    }
    .vaft-group-body {
      display: none;
      padding: 2px 6px 6px;
      display: none;
      flex-direction: column;
      gap: 4px;
    }
    .vaft-app {
      background: rgba(255,255,255,.01);
      border-radius: 7px;
      padding: 4px 6px 3px;
      font-size: 11px;
    }
    .vaft-app small { opacity: .5; font-size: 9px; display:block; }
    #vaft-hub-actions {
      border-top: 1px solid rgba(255,255,255,.02);
      padding: 6px 10px 10px;
      display: flex;
      gap: 6px;
    }
    #vaft-hub-actions button {
      background: rgba(156,200,255,.06);
      border: 1px solid rgba(156,200,255,.3);
      border-radius: 9px;
      color: #fff;
      font-size: 11px;
      padding: 4px 8px 3px;
    }
    @media (min-width: 900px) {
      #vaft-hub-panel {
        left: auto;
        right: 10px;
        width: 320px;
        height: 72vh;
        border-radius: 14px 14px 0 0;
      }
    }
  `;
  document.head.appendChild(style);

  // naplnit skupiny
  const groupsContainer = panel.querySelector("#vaft-hub-groups");
  GROUPS.forEach(group => {
    const g = document.createElement("div");
    g.className = "vaft-group";
    const head = document.createElement("div");
    head.className = "vaft-group-head";
    head.innerHTML = `<span>${group.name}</span><span>＋</span>`;
    const body = document.createElement("div");
    body.className = "vaft-group-body";

    group.items.forEach(app => {
      const a = document.createElement("div");
      a.className = "vaft-app";
      a.innerHTML = `${app.name}${app.desc ? `<small>${app.desc}</small>` : ""}`;
      a.addEventListener("click", () => openApp(app.url));
      body.appendChild(a);
    });

    head.addEventListener("click", () => {
      const opened = body.style.display === "flex";
      body.style.display = opened ? "none" : "flex";
      head.querySelector("span:last-child").textContent = opened ? "＋" : "－";
    });

    g.appendChild(head);
    g.appendChild(body);
    groupsContainer.appendChild(g);
  });

  // otevření panelu
  trigger.addEventListener("click", () => {
    panel.classList.add("open");
  });
  panel.querySelector("#vaft-hub-close").addEventListener("click", () => {
    panel.classList.remove("open");
  });

  // akce
  panel.querySelectorAll("#vaft-hub-actions button").forEach(btn => {
    btn.addEventListener("click", () => {
      const act = btn.dataset.act;
      if (act === "fuel") showFuel();
      if (act === "spell") doSpell();
      if (act === "tree") addTree();
    });
  });

  function openApp(url) {
    const frame = document.getElementById("app-frame");
    if (frame) {
      frame.src = url;
      panel.classList.remove("open");
    } else {
      window.location.href = url;
    }
  }

  function showFuel() {
    if (window.VAFT && VAFT.fuel && typeof VAFT.fuel.getBag === "function") {
      alert("Palivo:\n" + JSON.stringify(VAFT.fuel.getBag(), null, 2));
    } else {
      alert("Palivo není načtené.");
    }
  }

  function doSpell() {
    if (window.VAFT && VAFT.spell && typeof VAFT.spell.cast === "function") {
      VAFT.spell.cast("2 stromy u baráku");
    } else {
      alert("Spell modul není načtený.");
    }
  }

  function addTree() {
    if (window.VAFT && VAFT.ALL && typeof VAFT.ALL.spawn === "function") {
      VAFT.ALL.spawn({ type: "tree", count: 1, near: "house" });
    } else if (window.VAFT && VAFT.world && typeof VAFT.world.spawn === "function") {
      VAFT.world.spawn({ type: "tree", count: 1, near: "house" });
    } else {
      alert("Nemám modul světa pro strom.");
    }
  }

  console.log("VAFT HUB (mobilní spodní) aktivní");
})();
