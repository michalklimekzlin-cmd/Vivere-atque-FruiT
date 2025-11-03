// src/app.js
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

  // init engine
  VAF_engine.init("engineLog");

  // load ideas
  const savedIdeas = localStorage.getItem("VAF_ideas");
  if (savedIdeas) {
    ideasBox.value = savedIdeas;
    ideasStatus.textContent = "uloženo v prohlížeči ✅";
  }

  // heroes
  const heroes = loadHeroes();
  renderHeroes(heroes);

  // modules
  renderModules(VAF_engine.loadModules());

  heroForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = heroName.value.trim();
    if (!name) return;
    const newHero = {
      id: "hero_" + Date.now(),
      name,
      team: heroTeam.value,
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
      <button class="hero-del" data-id="${h.id}">×</button>
    `;
    heroList.appendChild(li);
  });

  // nasadit click na mazání
  const delBtns = heroList.querySelectorAll(".hero-del");
  delBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const idx = heroes.findIndex(h => h.id === id);
      if (idx !== -1) {
        heroes.splice(idx, 1);
        saveHeroes(heroes);
        renderHeroes(heroes);
      }
    });
  });
}

  function saveHeroes(list) { localStorage.setItem("VAF_heroes", JSON.stringify(list)); }
  function loadHeroes() { return JSON.parse(localStorage.getItem("VAF_heroes") || "[]"); }

  saveIdeasBtn.addEventListener("click", () => {
    localStorage.setItem("VAF_ideas", ideasBox.value);
    ideasStatus.textContent = "uloženo ✅ (" + new Date().toLocaleTimeString() + ")";
  });

  moduleForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const mod = { name: moduleName.value.trim(), state: moduleState.value };
    if (!mod.name) return;
    const mods = VAF_engine.saveModule(mod);
    renderModules(mods);
    moduleForm.reset();
  });

  function renderModules(mods) {
    moduleList.innerHTML = "";
    mods.forEach(m => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${m.name}</span><span class="badge">${m.state}</span>`;
      moduleList.appendChild(li);
    });
  }

  engineBtn.addEventListener("click", () => {
    VAF_engine.pulse("ui", { action: "manual-ping" });
  });

  // tabs
  const tabButtons = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".panel");
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      panels.forEach(p => p.id === target ? p.classList.add("active") : p.classList.remove("active"));
    });
  });

  // world pulse
  setInterval(() => {
    const ts = new Date().toLocaleTimeString();
    pulseLabel.textContent = `🫀 svět: puls ${ts}`;
    VAF_engine.pulse("world", { ts });
  }, 3000);

  // canvas draw
  const canvas = document.getElementById("worldCanvas");
  const ctx = canvas.getContext("2d");
  function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  function drawWorld() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width, h = canvas.height;
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
      // --- Střed: otáčející se koule ---
let coreRotation = 0; // úhel rotace koule

function drawWorld() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.width, h = canvas.height;
  const size = Math.min(w, h) * 0.08;

  // čtyři týmy jako dřív
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

  // --- NOVÝ STŘED ---
  const cx = w / 2;
  const cy = h / 2;
  const r = size * 1.1;

  // vytvoříme efekt "koule" (gradient + rotace)
  const grad = ctx.createRadialGradient(cx - r/4, cy - r/4, r/4, cx, cy, r);
  grad.addColorStop(0, "rgba(13,164,255,0.4)");
  grad.addColorStop(0.5, "rgba(13,164,255,0.15)");
  grad.addColorStop(1, "rgba(0,0,0,0.3)");

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(coreRotation);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = "rgba(13,164,255,.7)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // nápis - pevně uprostřed (nehýbe se)
  ctx.fillStyle = "#dbe2ff";
  ctx.font = "bold 13px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("Vivere", cx, cy - 8);
  ctx.fillText("atque FruiT", cx, cy + 12);

  // rotace jádra
  coreRotation += 0.01;
  if (coreRotation > Math.PI * 2) coreRotation = 0;
  requestAnimationFrame(drawWorld);
}

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
  resizeCanvas();
  drawWorld();
  window.addEventListener("resize", () => {
    resizeCanvas();
    drawWorld();
  });

  // PWA
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js")
      .then(() => console.log("SW registrován"))
      .catch(err => console.warn("SW chyba", err));
  }
});
