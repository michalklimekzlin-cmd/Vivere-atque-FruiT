// app.js
// hlavní lepidlo – UI, hrdinové, puls, napojení na engine

window.addEventListener("DOMContentLoaded", () => {
  const heroForm = document.getElementById("heroForm");
  const heroName = document.getElementById("heroName");
  const heroTeam = document.getElementById("heroTeam");
  const heroList = document.getElementById("heroList");

  const ideasBox = document.getElementById("ideasBox");
  const saveIdeasBtn = document.getElementById("saveIdeas");
  const ideasStatus = document.getElementById("ideasStatus");

  const moduleForm = document.getElementById("moduleForm");
  const moduleName = document.getElementById("moduleName");
  const moduleState = document.getElementById("moduleState");
  const moduleList = document.getElementById("moduleList");

  const engineBtn = document.getElementById("enginePing");
  const pulseLabel = document.getElementById("worldPulse");

  // init engine (meziprostor)
  VAF_engine.init("engineLog");

  // načíst uložené nápady
  const savedIdeas = localStorage.getItem("VAF_ideas");
  if (savedIdeas) {
    ideasBox.value = savedIdeas;
    ideasStatus.textContent = "uloženo v prohlížeči ✅";
  }

  // načíst hrdiny
  const heroes = loadHeroes();
  renderHeroes(heroes);

  // načíst moduly
  renderModules(VAF_engine.loadModules());

  heroForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = heroName.value.trim();
    const team = heroTeam.value;
    if (!name) return;
    const newHero = {
      id: "hero_" + Date.now(),
      name,
      team,
      createdAt: Date.now()
    };
    heroes.push(newHero);
    saveHeroes(heroes);
    renderHeroes(heroes);
    heroForm.reset();
  });

  function renderHeroes(list) {
    heroList.innerHTML = "";
    list.forEach(h => {
      const li = document.createElement("li");
      const teamObj = (window.VAF_teams || []).find(t => t.id === h.team);
      li.innerHTML = `
        <span>${h.name}</span>
        <span class="badge">${teamObj ? teamObj.name : h.team}</span>
      `;
      heroList.appendChild(li);
    });
  }

  function saveHeroes(list) {
    localStorage.setItem("VAF_heroes", JSON.stringify(list));
  }

  function loadHeroes() {
    return JSON.parse(localStorage.getItem("VAF_heroes") || "[]");
  }

  // nápady uložit
  saveIdeasBtn.addEventListener("click", () => {
    localStorage.setItem("VAF_ideas", ideasBox.value);
    ideasStatus.textContent = "uloženo ✅ (" + new Date().toLocaleTimeString() + ")";
  });

  // moduly
  moduleForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const mod = {
      name: moduleName.value.trim(),
      state: moduleState.value
    };
    if (!mod.name) return;
    const mods = VAF_engine.saveModule(mod);
    renderModules(mods);
    moduleForm.reset();
  });

  function renderModules(mods) {
    moduleList.innerHTML = "";
    mods.forEach(m => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${m.name}</span>
        <span class="badge" style="background:${m.state === "enabled" ? "rgba(112,255,143,.2)" : "rgba(255,112,112,.2)"}">${m.state}</span>
      `;
      moduleList.appendChild(li);
    });
  }

  // engine ping
  engineBtn.addEventListener("click", () => {
    VAF_engine.pulse("ui", { action: "manual-ping" });
  });

  // engine může reagovat na pulsy
  VAF_engine.subscribe((evt) => {
    // tady do budoucna WebGuardian / shop / anti-bot
    // zatím jenom log
    // console.log("engine event", evt);
  });

  // světový puls – každé 3s
  setInterval(() => {
    const ts = new Date().toLocaleTimeString();
    pulseLabel.textContent = `🫀 svět: puls ${ts}`;
    VAF_engine.pulse("world", { ts });
  }, 3000);

  // jednoduché "vykreslení" světa – placeholder
  const canvas = document.getElementById("worldCanvas");
  const ctx = canvas.getContext("2d");
  resizeCanvas();
  drawWorld(ctx);
  window.addEventListener("resize", () => {
    resizeCanvas();
    drawWorld(ctx);
  });

  function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }

  function drawWorld(ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 4 rohy = 4 týmy
    const w = canvas.width;
    const h = canvas.height;
    const size = Math.min(w, h) * 0.08;
    const teams = window.VAF_teams || [];
    const positions = [
      { x: size*1.4, y: size*1.4 },
      { x: w - size*1.4, y: size*1.4 },
      { x: size*1.4, y: h - size*1.4 },
      { x: w - size*1.4, y: h - size*1.4 },
    ];
    teams.forEach((t, i) => {
      const p = positions[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI*2);
      ctx.strokeStyle = "rgba(112,255,143,.7)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.fill();
      ctx.fillStyle = "#dbe2ff";
      ctx.font = "10px system-ui";
      ctx.fillText(t.name, p.x - size*1.1, p.y + size + 10);
    });

    // střed = core
    ctx.beginPath();
    ctx.arc(w/2, h/2, size*1.1, 0, Math.PI*2);
    ctx.strokeStyle = "rgba(13,164,255,.6)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.fill();
    ctx.fillStyle = "#dbe2ff";
    ctx.font = "11px system-ui";
    ctx.fillText("Vivere atque FruiT • core", w/2 - 80, h/2 + 3);
  }
});
