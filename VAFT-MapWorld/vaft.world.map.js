// vaft.world.map.js
// vykreslí dům + umí přidávat stromy
window.VAFT = window.VAFT || {};

(function() {
  const MW = {};
  const state = {
    house: { x: 210, y: 320, w: 80, h: 60 },
    trees: []
  };

  MW.init = function() {
    const canvas = document.getElementById("map");
    if (!canvas) {
      console.warn("MapWorld: nenašel jsem canvas #map");
      return;
    }
    MW.canvas = canvas;
    MW.ctx = canvas.getContext("2d");

    // pro jistotu jeden strom na start
    addTreeNearHouse();
    loop();
  };

  function loop() {
    requestAnimationFrame(loop);
    render();
  }

  function render() {
    if (!MW.ctx || !MW.canvas) return;
    const ctx = MW.ctx;
    const c = MW.canvas;

    ctx.clearRect(0, 0, c.width, c.height);

    // pozadí
    ctx.fillStyle = "#0b0f15";
    ctx.fillRect(0, 0, c.width, c.height);

    // dům
    drawHouse(ctx, state.house);

    // stromy
    state.trees.forEach(t => drawTree(ctx, t));
  }

  function addTreeNearHouse() {
    const base = state.house;
    const angle = Math.random() * Math.PI * 2;
    const radius = 90 + Math.random() * 40;
    const tx = base.x + Math.cos(angle) * radius;
    const ty = base.y + Math.sin(angle) * radius;
    state.trees.push({
      x: tx,
      y: ty,
      r: 14 + Math.random() * 6
    });
  }

  function drawHouse(ctx, house) {
    // tělo
    ctx.fillStyle = "#d9b38c";
    ctx.fillRect(house.x - house.w/2, house.y - house.h/2, house.w, house.h);

    // střecha
    ctx.beginPath();
    ctx.moveTo(house.x - house.w/2 - 4, house.y - house.h/2);
    ctx.lineTo(house.x, house.y - house.h/2 - 30);
    ctx.lineTo(house.x + house.w/2 + 4, house.y - house.h/2);
    ctx.closePath();
    ctx.fillStyle = "#8b4a3a";
    ctx.fill();
  }

  function drawTree(ctx, tree) {
    // kmen
    ctx.fillStyle = "#5e3a1c";
    ctx.fillRect(tree.x - 3, tree.y, 6, 16);
    // koruna
    ctx.beginPath();
    ctx.arc(tree.x, tree.y, tree.r, 0, Math.PI * 2);
    ctx.fillStyle = "#2fa368";
    ctx.fill();
  }

  // vystavíme pro tlačítko
  MW.addTreeNearHouse = addTreeNearHouse;

  // napojíme na VAFT.world, pokud ho máš
  VAFT.world = VAFT.world || {};
  VAFT.world.spawn = function(opts) {
    const { type, count = 1 } = opts || {};
    if (type === "tree") {
      for (let i = 0; i < count; i++) addTreeNearHouse();
    }
  };

  // dej to ven
  VAFT.mapWorld = MW;

  // auto-init po načtení
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => MW.init());
  } else {
    MW.init();
  }
})();
