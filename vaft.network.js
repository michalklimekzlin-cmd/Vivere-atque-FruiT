// VAFT Network — živá síť uzlů Vivere atque FruiT
(function (window, document) {
  console.log("%c[VAFT-Network] startuje...", "color:#7fffd4");

  // Pomocný EventBus
  const BUS = (window.VAFT && window.VAFT.bus) || (() => {
    const listeners = {};
    return {
      on: (t, fn) => ((listeners[t] ||= []).push(fn)),
      emit: (t, d) => (listeners[t] || []).forEach(f => f(d)),
    };
  })();
  window.VAFT = window.VAFT || {};
  window.VAFT.bus = BUS;

  // Kde se uzly vykreslí
  let panel = document.getElementById("vaft-nodes");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "vaft-nodes";
    document.body.appendChild(panel);
  }
  panel.style.display = "flex";
  panel.style.flexWrap = "wrap";
  panel.style.gap = "8px";

  // Barvy podle rolí
  const COLORS = {
    Hlavoun: "#7ec8ff",
    Viri: "#9fff84",
    Pikos: "#ffc979",
    Vivere: "#c28bff",
    Secret: "#ff78a8"
  };

  // Šablona uzlu
  function makeNode(name, color) {
    const el = document.createElement("div");
    el.className = "vaft-node";
    Object.assign(el.style, {
      border: `1px solid ${color}66`,
      background: "rgba(10,15,20,.4)",
      color,
      borderRadius: "10px",
      padding: "10px",
      width: "160px",
      fontSize: ".7rem"
    });
    el.innerHTML = `
      <div style="font-weight:600;font-size:.8rem;margin-bottom:4px;">${name}</div>
      <div>🧠 mozek: <span id="${name}-brain">...</span></div>
      <div>💾 paměť: <span id="${name}-mem">0</span></div>
      <div>⚙️ motor: <span id="${name}-motor">---</span></div>
      <div>❤️ srdce: <span id="${name}-heart">0</span></div>
      <div>💨 ventil: <span id="${name}-vent">---</span></div>`;
    panel.appendChild(el);
    return el;
  }

  // Logika uzlu
  function makeAgent(name, color) {
    const node = makeNode(name, color);
    const state = { brain: "ticho", memory: [], heart: 0 };
    const update = (k, v) => {
      const el = document.getElementById(`${name}-${k}`);
      if (el) el.textContent = v;
    };

    // Mozek: reaguje na zprávy
    function think(msg) {
      state.brain = msg.text || msg.type || "signál";
      state.memory.push(msg);
      update("brain", state.brain);
      update("mem", state.memory.length);
      localStorage.setItem(`VAFT_${name}_MEM`, JSON.stringify(state.memory));
      BUS.emit("vaft.signal", { from: name, msg });
      update("vent", "vysláno");
    }

    // Motor (heartbeat)
    setInterval(() => {
      const t = new Date().toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      update("motor", t);
      state.heart++;
      update("heart", state.heart);
      BUS.emit("heartbeat", { name, heart: state.heart });
    }, 4000 + Math.random() * 1500);

    BUS.on("vaft.signal", data => {
      if (data.from !== name && Math.random() < 0.4) think({ text: `${data.from}→${name}` });
    });

    return { name, think };
  }

  // Vytvoření uzlů
  const agents = [
    makeAgent("Hlavoun", COLORS.Hlavoun),
    makeAgent("Viri", COLORS.Viri),
    makeAgent("Pikos", COLORS.Pikos),
    makeAgent("Vivere", COLORS.Vivere),
    makeAgent("?", COLORS.Secret)
  ];

  // Iniciální pozdrav
  setTimeout(() => {
    BUS.emit("vaft.signal", { from: "Vivere", text: "Síť spuštěna" });
  }, 2000);

  console.log("%c[VAFT-Network] aktivní – uzly propojeny", "color:#9fff84");
})(window, document);
