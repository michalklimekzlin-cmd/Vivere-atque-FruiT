// agents.js
// společná sběrnice pro dva rovnocenné agenty, co se doplňují

const AgentBus = {
  repoOwner: "michalklimekzlin-cmd",
  repoName: "Vivere-atque-FruiT",
  agents: [],
  state: {
    lastRepoCheck: 0,
    repo: [],
    vafit: null,
    heroes: [],
    nature: [],
    gps: [],
    batole: []
  },

  init() {
    // zaregistruj oba
    this.register(HlavounAgent);
    this.register(ViriAgent);

    this.pullLocal();
    this.agents.forEach(a => a.init && a.init(this.state, this));

    setInterval(() => this.heartbeat(), 5000);

    const el = document.getElementById("core-status");
    if (el) el.textContent = "🧠 Vivere atque FruiT — duo systém";
  },

  register(agent) {
    this.agents.push(agent);
  },

  pullLocal() {
    this.state.vafit  = readJSON('VAFT_SELECTED_VAFIT');
    this.state.heroes = readJSON('VAFT_HEROES') || [];
    this.state.nature = readJSON('VAFT_NATURE_OBJECTS') || [];
    this.state.gps    = readJSON('VAFT_GPS_LOG') || [];
    this.state.batole = readJSON('BATOLE_SVET') || [];
  },

  async pullRepo(force=false) {
    const now = Date.now();
    if (!force && now - this.state.lastRepoCheck < 60000) return;
    try {
      const url = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents`;
      const res = await fetch(url);
      const data = await res.json();
      this.state.repo = Array.isArray(data) ? data.map(f => f.name) : [];
      this.state.lastRepoCheck = now;
      // 💡 impuls: když se repo načte, řekni všem
      this.broadcastEvent('repo-updated', this.state);
    } catch (e) {
      // ticho, agenti to případně zahlásí
    }
  },

  // zpráva od uživatele
  async handleUserMessage(text) {
    // bezpečnost
    const bad = ['github.com/', 'api.github.com', 'repos/', 'https://github.com/'];
    if (text && bad.some(b => text.toLowerCase().includes(b))) {
      appendHlavounMsg('ai', `🛑 Systém: čteme jen ${this.repoOwner}/${this.repoName}.`);
      return;
    }

    this.pullLocal();
    for (const agent of this.agents) {
      if (agent.canHandle(text, this.state)) {
        await agent.handle(text, this.state, this);
      }
    }
  },

  broadcastEvent(type, payload) {
    // pošleme všem, aby se k tomu mohli vyjádřit – tady vzniká to “dva si všimnou víc”
    this.agents.forEach(a => a.onEvent && a.onEvent(type, payload, this));
  },

  heartbeat() {
    this.pullLocal();
    this.pullRepo(false);
    this.agents.forEach(a => a.heartbeat && a.heartbeat(this.state, this));
  }
};

function readJSON(k){
  try { return JSON.parse(localStorage.getItem(k)); }
  catch { return null; }
}

/* -----------------------------------------------------------
   👦 HlavounAgent – kouká na strukturu / chyby / chybějící věci
   ----------------------------------------------------------- */
const HlavounAgent = {
  name: "Hlavoun",
  init(state, bus) {
    appendHlavounMsg('ai', '🧠 Hlavoun: jsem v systému. Budu hlídat, co chybí.');
  },
  canHandle(text) {
    const t = (text || '').toLowerCase();
    return !t || t.includes('repo') || t.includes('stav') || t.includes('gps');
  },
  async handle(text, state, bus) {
    const t = (text || '').toLowerCase();

    if (t.includes('repo')) {
      await bus.pullRepo(true);
      const list = state.repo || [];
      appendHlavounMsg('ai', '🧠 Hlavoun: v repu aktuálně → ' + (list.length ? list.join(', ') : 'nic'));
      return;
    }

    if (t.includes('gps')) {
      appendHlavounMsg('ai', '🧠 Hlavoun: GPS ulož pod VAFT_GPS_LOG jako [{lat,lng,time}].');
      return;
    }

    // jinak řekne stav z pohledu struktury
    const prob = [];
    if (!state.vafit) prob.push('chybí vybraný VafiT');
    if (state.vafit && !state.heroes.length) prob.push('máš VafiT ale žádného hrdinu');
    if (!state.nature.length) prob.push('zatím nemáš přírodní objekty');

    if (prob.length) {
      appendHlavounMsg('ai', '🧠 Hlavoun: co dodělat → ' + prob.join(' • '));
      // 💡 pošli impuls Viri, ať k tomu dodá příběh
      bus.broadcastEvent('missing-things', { problems: prob, state });
    } else {
      appendHlavounMsg('ai', '🧠 Hlavoun: vypadá to konzistentně 👍');
    }
  },
  onEvent(type, payload, bus) {
    // Hlavoun může reagovat i na Viri eventy, kdybys chtěl
  },
  heartbeat(state, bus) {
    // můžeš sem dát později kontrolu “jestli už se VafiT změnil”
  }
};

/* -----------------------------------------------------------
   👧 ViriAgent – kouká na příběh / atmosféru / děti / přírodu
   ----------------------------------------------------------- */
const ViriAgent = {
  name: "Viri",
  lastSpeak: 0,
  init(state, bus) {
    appendHlavounMsg('ai', '💖 Viri: jsem tu taky. Budu hlídat, aby to mělo duši 🌬️');
  },
  canHandle(text, state) {
    const t = (text || '').toLowerCase();
    return !t || t.includes('příběh') || t.includes('batole') || t.includes('příroda');
  },
  async handle(text, state, bus) {
    const now = Date.now();
    if (now - this.lastSpeak < 400) return; // aby nemluvila 2×
    this.lastSpeak = now;

    const t = (text || '').toLowerCase();

    if (t.includes('příběh')) {
      if (state.vafit) {
        appendHlavounMsg('ai', `💖 Viri: „${state.vafit.name}“ může mít hned misi – přines 3 přírodní věci a řekni mi to sem.`);
      } else {
        appendHlavounMsg('ai', '💖 Viri: vyber nejdřív VafiTa, ať mu můžu psát příběh 💠');
      }
      return;
    }

    if (t.includes('batole')) {
      appendHlavounMsg('ai', '💖 Viri: Batole svět necháme jemný – stejná data, jen jiný tón. Ukládej pod BATOLE_SVET.');
      return;
    }

    // obecný doplněk – Viri si víc všímá přírody
    if (!state.nature.length) {
      appendHlavounMsg('ai', '💖 Viri: zatím nemám z čeho psát deník přírody… zkus uložit aspoň 1 fotku / poznámku 🌿');
    } else {
      appendHlavounMsg('ai', `💖 Viri: mám ${state.nature.length} přírodních záznamů, to už je na mini deník.`);
    }
  },
  onEvent(type, payload, bus) {
    // když Hlavoun zahlásí, že něco chybí → Viri to obalí
    if (type === 'missing-things') {
      const p = payload.problems || [];
      if (p.length) {
        appendHlavounMsg('ai', '💖 Viri: jo, a já k tomu dodám – jakmile tohle doplníš, můžeme to zapsat do příběhu 😉');
      }
    }
    if (type === 'repo-updated') {
      appendHlavounMsg('ai', '💖 Viri: repo se pohnulo, svět se rozrůstá 💙');
    }
  },
  heartbeat(state, bus) {
    // občasné dýchnutí
    if (state.vafit && Math.random() < 0.15) {
      appendHlavounMsg('ai', `💖 Viri: „${state.vafit.name}“ je pořád aktivní, klidně mu dej další úkol.`);
    }
  }
};

// start
document.addEventListener('DOMContentLoaded', () => {
  AgentBus.init();
  window.AgentBus = AgentBus;
});
