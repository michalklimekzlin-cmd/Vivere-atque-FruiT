// vaft.autonodes.js
// živé uzly napojené na Pikoše, Viriho, Hlavouna a Vivere atque Frui¡'T

(function (window, document) {
  window.VAFT = window.VAFT || {};
  const BUS = (window.VAFT.bus = window.VAFT.bus || (() => {
    const listeners = {};
    return {
      on(ch, fn) {
        (listeners[ch] ||= []).push(fn);
      },
      emit(ch, payload) {
        (listeners[ch] || []).forEach(fn => {
          try { fn(payload); } catch (e) { console.warn('bus err', e); }
        });
      }
    };
  })());

  // symbolický jazyk
  const dict = { "V": "Vivere", "A": "atque", "F": "FruiT", "H": "Hlavoun", "P": "Pikoš", "R": "Viri", "♥": "puls" };
  window.VAFT.language = {
    decode: (s) => dict[s] || s,
    encode: (word) => Object.entries(dict).find(([k, v]) => v === word)?.[0] || "?"
  };

  // vytvoření prostoru
  let host = document.getElementById('vaft-nodes');
  if (!host) {
    host = document.createElement('div');
    host.id = 'vaft-nodes';
    host.style.marginTop = '10px';
    host.style.padding = '8px';
    host.style.display = 'flex';
    host.style.flexWrap = 'wrap';
    host.style.gap = '8px';
    document.body.appendChild(host);
  }

  // továrna na uzly
  function createNode(id, layer) {
    const nodeEl = document.createElement('div');
    nodeEl.className = 'vaft-node';
    Object.assign(nodeEl.style, {
      border: '1px solid rgba(150,200,255,.15)',
      borderRadius: '14px',
      padding: '7px 9px',
      background: 'rgba(2,5,10,.35)',
      backdropFilter: 'blur(8px)',
      minWidth: '150px',
      fontSize: '.62rem',
      color: '#e8f5ff'
    });

    nodeEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;">
        <div>${layer} • ${id}</div>
        <div id="n-${id}-pulse" style="font-size:.6rem;opacity:.5;">--:--:--</div>
      </div>
      <div>🧠 <span id="n-${id}-idea">-</span></div>
      <div>💾 <span id="n-${id}-mem">0</span></div>
      <div>🌬 <span id="n-${id}-out">-</span></div>
    `;
    host.appendChild(nodeEl);

    const memKey = `VAFT_NODE_${id}_MEM`;
    let memory = JSON.parse(localStorage.getItem(memKey) || '[]');

    function save(obj) {
      memory.push(obj);
      localStorage.setItem(memKey, JSON.stringify(memory));
      const mEl = document.getElementById(`n-${id}-mem`);
      if (mEl) mEl.textContent = memory.length;
    }

    return {
      id,
      layer,
      heartbeat: 0,
      tick() {
        this.heartbeat++;
        document.getElementById(`n-${id}-pulse`).textContent =
          new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // vnitřní aktivita
        const keys = Object.keys(dict);
        const sym = keys[Math.floor(Math.random() * keys.length)];
        document.getElementById(`n-${id}-idea`).textContent = sym;
        if (this.heartbeat % 2 === 0) save({ from: "self", sym, ts: Date.now() });

        if (this.heartbeat % 3 === 0) {
          const msg = { from: id, sym, decoded: dict[sym], ts: Date.now() };
          BUS.emit('node.out', msg);
          document.getElementById(`n-${id}-out`).textContent = msg.decoded;
        }
      },
      hear(source, data) {
        save({ from: source, data, ts: Date.now() });
        document.getElementById(`n-${id}-idea`).textContent = window.VAFT.language.encode(source);
      }
    };
  }

  const nodes = [];
  const INNER_COUNT = 6;
  const OUTER_COUNT = 6;
  for (let i = 0; i < INNER_COUNT; i++) nodes.push(createNode('inner-' + i, 'inner'));
  for (let i = 0; i < OUTER_COUNT; i++) nodes.push(createNode('outer-' + i, 'outer'));

  // každý 3 sekundy tik
  setInterval(() => {
    nodes.forEach(n => n.tick());
    BUS.emit('system.heartbeat', { ts: Date.now(), source: 'autonodes' });
  }, 3000);

  // propojení se členy rodiny
  const listeners = [
    ['pikos.output', 'Pikoš'],
    ['viri.output', 'Viri'],
    ['hlavoun.output', 'Hlavoun'],
    ['vaft.world', 'Vivere atque Frui¡'T']
  ];
  listeners.forEach(([channel, label]) => {
    BUS.on(channel, (data) => {
      nodes.forEach(n => n.hear(label, data));
    });
  });

  // přepojení výstupu uzlů zpět do světa
  BUS.on('node.out', (msg) => {
    BUS.emit('vaft.world', { from: msg.from, code: msg.sym, meaning: msg.decoded });
    if (typeof window.appendHlavounMsg === 'function') {
      window.appendHlavounMsg('ai', `📡 ${msg.from} → ${msg.decoded}`);
    }
  });

  console.log('[VAFT] autonodes propojené s Pikošem, Viri, Hlavounem, světem.');
})(window, document);
