// 🧠 Hlavoun v2 – stavový mozek Vivere atque FruiT + Batole svět
// dělá 4 věci:
// 1) načte localStorage (hrdinové, vafit, příroda, gps, batole)
// 2) 1× za čas načte repo a uloží si, co tam je
// 3) reaguje na zprávy z chatu (příběh, gps, repo, batole)
// 4) má vlastní stav (this.state), aby věděl, co už říkal

const HlavounSystem = {
  REPO_OWNER: "michalklimekzlin-cmd",
  REPO_NAME: "Vivere-atque-FruiT",
  state: {
    lastRepoCheck: 0,
    repo: [],
    heroesCount: 0,
    hasVafit: false,
    hasNature: false,
    hasGPS: false,
    hasBatole: false
  },

  init() {
    this.markActive();
    this.loadChatLog();
    this.refreshLocalState();
    this.think(""); // první analýza

    // malý heartbeat – každé 4s zkusí něco připomenout
    setInterval(() => this.heartbeat(), 4000);

    // a rovnou se zaregistrujeme serviceworker (pro jistotu)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
    }
  },

  markActive() {
    const el = document.getElementById("core-status");
    if (el) el.textContent = "🧠 Hlavoun systém • aktivní";
  },

  loadChatLog() {
    const log = JSON.parse(localStorage.getItem('VAFT_HLAVOUN_LOG') || '[]');
    if (log.length) {
      log.forEach(m => appendHlavounMsg(m.role, m.text));
    } else {
      appendHlavounMsg('ai', 'Jsem Hlavoun v2. Vidím tvůj svět. Klidně napiš „příběh“, „gps“, „repo“ nebo „batole svět“.');
    }
  },

  // přečti localStorage a zapiš do stavu
  refreshLocalState() {
    const vafit  = this.safeJSON('VAFT_SELECTED_VAFIT');
    const heroes = this.safeJSON('VAFT_HEROES') || [];
    const nature = this.safeJSON('VAFT_NATURE_OBJECTS') || [];
    const gps    = this.safeJSON('VAFT_GPS_LOG') || [];
    const batole = this.safeJSON('BATOLE_SVET') || [];

    this.state.hasVafit = !!vafit;
    this.state.heroesCount = heroes.length;
    this.state.hasNature = nature.length > 0;
    this.state.hasGPS = gps.length > 0;
    this.state.hasBatole = batole.length > 0;
  },

  // hlavní mozek – volá se při zprávě od uživatele
  async think(userText) {
    this.refreshLocalState();

    // zablokuj pokusy o jiné repa
    const banned = ['github.com/', 'api.github.com', 'repos/', 'https://github.com/'];
    if (userText && banned.some(b => userText.includes(b))) {
      appendHlavounMsg('ai', `Čtu jen ${this.REPO_OWNER}/${this.REPO_NAME}.`);
      return;
    }

    // explicitní příkazy
    if (userText) {
      const t = userText.toLowerCase();
      if (t.includes('příběh')) {
        return this.handleStory();
      }
      if (t.includes('gps')) {
        return this.handleGPS();
      }
      if (t.includes('repo')) {
        return this.readRepo(true); // vynucené
      }
      if (t.includes('batole')) {
        return this.handleBatole();
      }
    }

    // automatická logika
    if (!this.state.hasVafit) {
      appendHlavounMsg('ai', 'Ještě nemáš vybraného VafiTa. Otevři „VafiT galerie“ v Systému a klikni na nějaký glyph.');
      return;
    }
    if (this.state.hasVafit && this.state.heroesCount === 0) {
      appendHlavounMsg('ai', 'Máš VafiTa, ale nemáš hrdinu. V záložce Hrdinové přidej člověka, ať má kdo ten glyph nosit.');
      return;
    }
    if (this.state.hasVafit && this.state.heroesCount > 0) {
      let msg = `Vidím VafiTa i hrdiny.`;
      if (!this.state.hasNature) msg += ' Přidej „objekt z přírody“, ať víme, že svět chodí ven.';
      if (this.state.hasGPS) msg += ' Máš GPS – můžeme dělat výpravy.';
      appendHlavounMsg('ai', msg);
    }
  },

  // běží pravidelně – připomíná, co chybí
  heartbeat() {
    // když ještě nikdy nečetl repo nebo je to starší než 60s → přečti
    const now = Date.now();
    if (now - this.state.lastRepoCheck > 60000) {
      this.readRepo(false);
    }
  },

  async readRepo(force) {
    const now = Date.now();
    if (!force && now - this.state.lastRepoCheck < 60000) return; // už je čerstvé

    try {
      const url = `https://api.github.com/repos/${this.REPO_OWNER}/${this.REPO_NAME}/contents`;
      const res = await fetch(url);
      const data = await res.json();
      this.state.repo = Array.isArray(data) ? data.map(f => f.name) : [];
      this.state.lastRepoCheck = now;

      // první výpis
      appendHlavounMsg('ai', '📁 V repu vidím: ' + this.state.repo.join(', '));

      if (!this.state.repo.includes('VafiT-gallery')) {
        appendHlavounMsg('ai', 'Chybí VafiT-gallery, bez ní nevybereš glyphy.');
      }
      if (!this.state.repo.includes('Revia')) {
        appendHlavounMsg('ai', 'Nevidím složku Revia — pokud tam má být, pushni ji.');
      }
    } catch (e) {
      appendHlavounMsg('ai', 'Repo teď nemůžu načíst (možná limit nebo offline).');
    }
  },

  handleStory() {
    const vafit = this.safeJSON('VAFT_SELECTED_VAFIT');
    if (!vafit) {
      appendHlavounMsg('ai', 'Nejdřív si vyber VafiTa v galerii, ať vím pro koho příběh.');
      return;
    }
    appendHlavounMsg('ai', `Příběh: „${vafit.name}“ je nosič signálů. Úkol 1: ulož 3 objekty z přírody. Úkol 2: přidej hrdinu, co je bude sbírat. Úkol 3: exportuj JSON.`);
  },

  handleGPS() {
    appendHlavounMsg('ai', 'GPS ukládej jako [{lat,lng,time}] do VAFT_GPS_LOG. Já to pak uvidím a můžu ti říct „doplň 5 bodů“ nebo „zobraz trasu”.');
  },

  handleBatole() {
    this.state.hasBatole = true;
    appendHlavounMsg('ai', 'Batole svět: můžeme vést paralelní deník pro dítě. Ukládej pod BATOLE_SVET a já to budu hlásit stejně jako přírodu.');
  },

  safeJSON(key) {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch { return null; }
  }
};

// start
document.addEventListener('DOMContentLoaded', () => {
  HlavounSystem.init();
});
