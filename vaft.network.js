// VAFT Network — živá síť uzlů Vivere atque Frui¡'T (bez pádu)
(function (window, document) {
  console.log("%c[VAFT-Network] startuje...", "color:#7fffd4");

  // malá interní sběrnice, pokud ještě není
  const BUS = (window.VAFT && window.VAFT.bus) || (() => {
    const listeners = {};
    return {
      on: (t, fn) => ((listeners[t] ||= []).push(fn)),
      emit: (t, d) => (listeners[t] || []).forEach(f => f(d)),
    };
  })();

  window.VAFT = window.VAFT || {};
  window.VAFT.bus = BUS;

  // panel v DOMu
  let panel = document.getElementById("vaft-nodes");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "vaft-nodes";
    document.body.appendChild(panel);
  }
  panel.style.display = "flex";
  panel.style.flexWrap = "wrap";
  panel.style.gap = "8px";

  // barvy uzlů
  const COLORS = {
    Hlavoun: "#7ec8ff",
    Viri:    "#9fff84",
    Pikos:   "#ffb347",
    Vivere:  "#c28bff",
    "?":     "#ff78a8"
  };

  // vytvoření uzlu v DOMu
  function makeNode(name, color) {
    const el = document.createElement("div");
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

  // vytvoření agenta
  function makeAgent(name, color) {
    makeNode(name, color);

    const state = { brain: "ticho", memory: [], heart: 0 };
    const upd = (k, v) => {
      const el = document.getElementById(`${name}-${k}`);
      if (el) el.textContent = v;
    };

    function think(msg) {
      const hops = msg.hops || 0;

      state.brain = msg.text || msg.type || "signál";
      state.memory.push(msg);
      upd("brain", state.brain);
      upd("mem", state.memory.length);

      try {
        localStorage.setItem(`VAFT_${name}_MEM`, JSON.stringify(state.memory));
      } catch (e) {
        console.warn("[VAFT-Network] localStorage problém:", e);
      }

      upd("vent", "vysláno");

      // aby se to nerozjelo do nekonečna:
      if (hops >= 3) return; // max 3 skoky

      // pošleme dál, ale jen jednou a lehce opožděně
      setTimeout(() => {
        BUS.emit("vaft.signal", {
          from: name,
          text: state.brain,
          hops: hops + 1
        });
      }, 200 + Math.random() * 600);
    }

    // puls srdce a motor
    setInterval(() => {
      const t = new Date().toLocaleTimeString("cs-CZ", {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      upd("motor", t);
      state.heart++;
      upd("heart", state.heart);

      BUS.emit("heartbeat", { name, heart: state.heart });
    }, 4000 + Math.random() * 1500);

    // reaguj na cizí signál – opatrně, ať to neexploduje
    BUS.on("vaft.signal", data => {
      if (data.from === name) return;          // nereaguj sám na sebe
      if ((data.hops || 0) >= 3) return;       // už to hodně cestovalo
      if (Math.random() < 0.25) {              // menší šance na odpověď
        setTimeout(() => {
          think({
            text: `${data.from} → ${name}`,
            hops: (data.hops || 0) + 1
          });
        }, 350 + Math.random() * 700);
      }
    });

    return { name, think };
  }

  // inicializace agentů
  const agents = ["Hlavoun", "Viri", "Pikos", "Vivere", "?"].map(
    n => makeAgent(n, COLORS[n])
  );

  // první startovní signál ze středu
  setTimeout(() => {
    BUS.emit("vaft.signal", {
      from: "Vivere",
      text: "Síť spuštěna",
      hops: 0
    });
  }, 2000);

  console.log("%c[VAFT-Network] aktivní – uzly propojeny (safe verze)", "color:#9fff84");
})(window, document);
