// vaft.world.map.js
window.VAFT = window.VAFT || {};

(function() {
  // vytvoříme svět, pokud ještě není
  VAFT.world = VAFT.world || {};

  // základ mapy
  const state = {
    house: { x: 210, y: 320, w: 80, h: 60 },
    trees: []
  };

  // hlavní modul mapy
  VAFT.mapWorld = {
    init() {
      const canvas = document.getElementById("map");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      this.canvas = canvas;
      this.ctx = ctx;

      // jeden dům už máme ve state
      this.loop();
    },

    loop() {
      requestAnimationFrame(() => this.loop());
      this.render();
    },

    render() {
      const ctx = this.ctx;
      const c = this.canvas;
      if (!ctx || !c) return;

      // vyčistit
      ctx.clearRect(0, 0, c.width, c.height);

      // background
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.fillRect(0, 0, c.width, c.height);

      // dům
      drawHouse(ctx, state.house);

      // stromy
      state.trees.forEach(t => drawTree(ctx, t));
    }
  };

  // přidáme do VAFT.world spawn funkci, aby na ni mohl sáhnout spell
  VAFT.world.spawn = function(opts) {
    const { type, count = 1, near = null } = opts || {};
    if (type === "tree") {
      for (let i = 0; i < count; i++) {
        addTreeNear(near || "house");
      }
    }
  };

  function addTreeNear(place) {
    // aktuálně známe jen "house"
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

})();
