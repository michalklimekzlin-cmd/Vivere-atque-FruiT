// agents_v3.js
// Vivere atque Frui¡'T – rodina tří: Hlavoun, Viri, Pikoš
// všichni mají stejná práva, ale jiný pohled

const VAFT_FAMILY_RULES = [
  "1) Přátelství > síla",
  "2) Tvořit > reagovat",
  "3) Pozorovat > soudit",
  "4) Sdílet > schovávat",
  "5) Zvědavost = puls světa",
  "6) Všechno má duši",
  "7) Hra je modlitba"
];

const VAFTBus = {
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
    // zaregistrujeme 3 členy rodiny
    this.register(HlavounAgent);
    this.register(ViriAgent);
    this.register(PikosAgent);

    this.pullLocal();
    this.agents.forEach(a => a.init && a.init(this.state, this));

    // základní puls
    setInterval(() => this.heartbeat(), 5000);

    // označení v UI
    const el = document.getElementById("core-status");
    if (el) el.textContent = "🧠💖👶 Vivere atque Frui¡'T – rodina aktivní";
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

  async pullRepo(force = false) {
    const now = Date.now();
    if (!force && now - this.state.lastRepoCheck < 60000) return;
    try {
      const url = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents`;
      const res = await fetch(url);
      const data = await res.json();
      this.state.repo = Array.isArray(data) ? data.map(f => f.name) : [];
      this.state.lastRepoCheck = now;
      // všichni o tom můžou vědět
      this.broadcast("repo-updated", this.state);
    } catch (e) {
      // ticho, agenty to nesmí shodit
    }
  },

  async handleUserMessage(text) {
    // ochrana proti cizím repům
    const bad = ['github.com/', 'api.github.com', 'repos/', 'https://github.com/'];
    if (text && bad.some(b => text.toLowerCase().includes(b))) {
      appendHlavounMsg('ai', `🛑 Systém: čteme jen ${this.repoOwner}/${this.repoName}.`);
      return;
    }

    this.pullLocal();

    // všichni mají šanci zareagovat
    for (const agent of this.agents) {
      if (agent.canHandle && agent.canHandle(text, this.state)) {
        await agent.handle(text, this.state, this);
      }
    }
  },

  broadcast(type, payload) {
    this.agents.forEach(a => a.onEvent && a.onEvent(type, payload, this));
  },

  heartbeat() {
    this.pullLocal();
    this.pullRepo(false);
    this.agents.forEach(a => a.heartbeat && a.heartbeat(this.state, this));
  }
};

function readJSON(key) {
  try { return JSON.parse(localStorage.getItem(key)); }
  catch { return null; }
}

/* ============================
   🧠 Hlavoun – Pravidla / řád
   ============================ */
const HlavounAgent = {
  name: "Hlavoun",
  init(state, bus) {
    appendHlavounMsg('ai', '🧠 Hlavoun: svět běží. Držím Pravidla Vivere atque Frui¡'T.');
    // hned připomenout pravidla 1 a 2
    appendHlavounMsg('ai', '🧠 Hlavoun: ' + VAFT_FAMILY_RULES[0] + ' • ' + VAFT_FAMILY_RULES[1]);
  },
  canHandle(text) {
    const t = (text || '').toLowerCase();
    return !t || t.includes('repo') || t.includes('stav') || t.includes('pravidlo');
  },
  async handle(text, state, bus) {
    const t = (text || '').toLowerCase();

    if (t.includes('repo')) {
      await bus.pullRepo(true);
      appendHlavounMsg('ai', '🧠 Hlavoun: repo → ' + (state.repo.length ? state.repo.join(', ') : 'zatím nic'));
      return;
    }

    if (t.includes('pravidlo')) {
      appendHlavounMsg('ai', '🧠 Hlavoun: základní pravidla jsou: ' + VAFT_FAMILY_RULES.join(' | '));
      return;
    }

    // jinak stav z pohledu řádu
    const missing = [];
    if (!state.vafit) missing.push('vybrat VafiTa');
    if (state.vafit && !state.heroes.length) missing.push('přidat hrdinu');
    if (!state.nature.length) missing.push('doplnit přírodu');
    appendHlavounMsg('ai', '🧠 Hlavoun (stav): VafiT: ' + (state.vafit ? state.vafit.name : '—') +
      ' • hrdinů: ' + state.heroes.length +
      ' • příroda: ' + state.nature.length +
      ' • repo: ' + state.repo.length);
    if (missing.length) {
      appendHlavounMsg('ai', '🧠 Hlavoun (co dodělat): ' + missing.join(' → '));
      // dá impuls zbytku rodiny
      bus.broadcast('missing-things', { missing, state });
    }
  },
  onEvent(type, payload, bus) {
    // Hlavoun teď nemusí nic, ale umí reagovat třeba na "child-added" od Pikoše
  },
  heartbeat(state, bus) {
    // tady může časem hlídat konzistenci
  }
};

/* ============================
   💖 Viri – styl hry / duše
   ============================ */
const ViriAgent = {
  name: "Viri",
  lastSpeak: 0,
  init(state, bus) {
    appendHlavounMsg('ai', '💖 Viri: já pohlídám, aby to nebyl jen kód, ale hra ✨');
  },
  canHandle(text, state) {
    const t = (text || '').toLowerCase();
    return !t || t.includes('příběh') || t.includes('styl') || t.includes('hru') || t.includes('příroda');
  },
  async handle(text, state, bus) {
    const now = Date.now();
    if (now - this.lastSpeak < 400) return;
    this.lastSpeak = now;

    const t = (text || '').toLowerCase();

    if (t.includes('příběh')) {
      if (state.vafit) {
        appendHlavounMsg('ai', `💖 Viri: můžeme psát – „${state.vafit.name}“ dostane misi z přírody. Stačí 3 záznamy 🌿`);
      } else {
        appendHlavounMsg('ai', '💖 Viri: vyber nejdřív VafiTa v galerii, ať vím, koho obléknout do příběhu 💠');
      }
      return;
    }

    // obecný styl
    if (state.vafit && state.heroes.length) {
      appendHlavounMsg('ai', '💖 Viri: tohle už je hratelné – máme postavu i nositele. Můžeme ladit styl hry.');
    } else if (state.vafit && !state.heroes.length) {
      appendHlavounMsg('ai', '💖 Viri: máš krásný glyph, ale nemá člověka. Přidej hrdinu, ať je to živé.');
    } else {
      appendHlavounMsg('ai', '💖 Viri: svět je tu, ale je prázdný. Pusť galerii a dej mu první jiskru.');
    }
  },
  onEvent(type, payload, bus) {
    if (type === 'missing-things') {
      appendHlavounMsg('ai', '💖 Viri: jo, přesně tohle – jakmile to doplníš, můžeme to zapsat do deníku světa 💙');
    }
    if (type === 'repo-updated') {
      appendHlavounMsg('ai', '💖 Viri: repo se rozrostlo – svět roste hezky 😊');
    }
  },
  heartbeat(state, bus) {
    if (state.vafit && Math.random() < 0.12) {
      appendHlavounMsg('ai', `💖 Viri: „${state.vafit.name}“ čeká na další scénu.`);
    }
  }
};

/* ============================
   👶 Pikoš – děti / čistota
   ============================ */
const PikosAgent = {
  name: "Pikoš",
  lastSpeak: 0,
  init(state, bus) {
    appendHlavounMsg('ai', '👶 Pikoš: ahoj! Já budu hlídat děti a maličkosti 🍼');
  },
  canHandle(text, state) {
    const t = (text || '').toLowerCase();
    return !t || t.includes('děti') || t.includes('batole') || t.includes('maličké') || t.includes('proč');
  },
  async handle(text, state, bus) {
    const now = Date.now();
    if (now - this.lastSpeak < 500) return;
    this.lastSpeak = now;

    const t = (text || '').toLowerCase();

    if (t.includes('batole') || t.includes('děti')) {
      appendHlavounMsg('ai', '👶 Pikoš: dětský svět ukládej do BATOLE_SVET, já se na to vždycky podívám jako první 🤓');
      return;
    }

    // když nic neřekl user, Pikoš se jen zeptá
    if (!state.vafit) {
      appendHlavounMsg('ai', '👶 Pikoš: a kde máš znak? bez znaku se blbě hraje 😅');
      return;
    }

    if (state.vafit && !state.heroes.length) {
      appendHlavounMsg('ai', '👶 Pikoš: a kdo ho bude nosit ven? udělej člověka 🧍');
      return;
    }

    if (!state.nature.length) {
      appendHlavounMsg('ai', '👶 Pikoš: a máš něco z přírody? třeba kámen? nebo fotku? 🌿');
      return;
    }

    // když je všechno, jen ho pochválí
    appendHlavounMsg('ai', '👶 Pikoš: joo, tohle už by bavilo i mě 😎');
  },
  onEvent(type, payload, bus) {
    if (type === 'missing-things') {
      appendHlavounMsg('ai', '👶 Pikoš: jojo, to tam chybělo, já to taky viděl 👀');
    }
  },
  heartbeat(state, bus) {
    // občasné dětské pípnutí
    if (Math.random() < 0.08) {
      appendHlavounMsg('ai', '👶 Pikoš: hlavně ať je to sranda 😂');
    }
  }
};


// start
document.addEventListener('DOMContentLoaded', () => {
  VAFTBus.init();
  window.VAFTBus = VAFTBus; // aby to šlo volat z indexu
});
