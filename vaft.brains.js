// vaft.brains.js
// 4 hlavní mozky: Hlavoun, Viri, Pikoš, Vivere (puls)
(function (window) {
  window.VAFT = window.VAFT || {};

  // 1) bus – když není, založíme
  const BUS = window.VAFT.bus || (function () {
    const L = {};
    const b = {
      on(ch, fn) { (L[ch] ||= []).push(fn); },
      emit(ch, data) { (L[ch] || []).forEach(f => { try { f(data); } catch (e) { console.warn(e); } }); },
      _L: L
    };
    window.VAFT.bus = b;
    return b;
  })();

  // 2) místo pro agenty
  window.VAFT.agents = window.VAFT.agents || {};

  // pomocník na výpis do meziprostoru
  function say(text) {
    if (typeof window.appendHlavounMsg === 'function') {
      window.appendHlavounMsg('ai', text);
    } else {
      console.log('[VAFT]', text);
    }
  }

  // HLAVOUN – řídí a diagnostikuje
  const Hlavoun = {
    name: 'Hlavoun',
    state: { brain: 'ready', memory: [] },
    think(msg) {
      this.state.brain = msg.text || msg.type || 'signál';
      this.state.memory.push({ ts: Date.now(), msg });
      if (this.state.memory.length > 120) this.state.memory.shift();
      BUS.emit('vaft.diagnostic', {
        from: 'Hlavoun',
        msg: 'přijal zprávu',
        payload: msg,
        ts: Date.now()
      });
    }
  };

  // VIRI – paměť
  const Viri = {
    name: 'Viri',
    state: { },
    load(key) {
      try { return JSON.parse(localStorage.getItem('VAFT_MEM_' + key) || 'null'); }
      catch (e) { return null; }
    },
    save(key, val) {
      try { localStorage.setItem('VAFT_MEM_' + key, JSON.stringify(val)); } catch (e) {}
      BUS.emit('vaft.signal', { from: 'Viri', msg: { text: 'uloženo: '+key } });
    },
    think(msg) {
      const tl = this.load('timeline') || [];
      tl.push({ ts: Date.now(), msg });
      if (tl.length > 200) tl.shift();
      this.save('timeline', tl);
    }
  };

  // PIKOŠ – ventil ven
  const Pikos = {
    name: 'Pikos',
    state: { outputs: [] },
    output(payload) {
      const entry = { ts: Date.now(), ...payload };
      this.state.outputs.push(entry);
      if (this.state.outputs.length > 100) this.state.outputs.shift();
      BUS.emit('vaft.output', Object.assign({ from: 'Pikos' }, entry));
    },
    think(msg) {
      this.output({ text: msg.text || 'Pikoš převzal zprávu', raw: msg });
    }
  };

  // VIVERE – puls světa
  const VivereCore = {
    name: 'Vivere',
    state: { beats: 0 },
    start() {
      setInterval(() => {
        this.state.beats++;
        BUS.emit('vaft.heartbeat', {
          from: 'Vivere',
          beat: this.state.beats,
          ts: Date.now()
        });
      }, 5000);
    },
    think(msg) {
      BUS.emit('vaft.signal', { from: 'Vivere', msg });
    }
  };

  // zaregistrovat do VAFT
  window.VAFT.agents.Hlavoun = Hlavoun;
  window.VAFT.agents.Viri = Viri;
  window.VAFT.agents.Pikos = Pikos;
  window.VAFT.agents.Vivere = VivereCore;

  // napojit na bus: všechno obecné jde přes Hlavouna a Viri
  BUS.on('vaft.signal', (d) => {
    if (!d) return;
    Hlavoun.think(d);
    Viri.think(d);
  });

  // spustit puls
  VivereCore.start();

  say('🧠 4 mozky VAFT spuštěny (Hlavoun, Viri, Pikoš, Vivere).');
  console.log('[VAFT.brains] ready');
})(window);
