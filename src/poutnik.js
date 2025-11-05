// src/poutnik.js
// Lilie – soukromý Poutník
// vše (GPS, fotky, poznámky, úkoly, peněženka) šifrujeme heslem
// SOS necháváme otevřené
// máme i pytlík se zlaťáky 💰

window.VAFT = window.VAFT || {};

(function () {
  // ====== 0) nastavení ======
  // deterministický "parťák" klíč – abys to uměl rozšifrovat i ty
  const PARTNER_SEED = "michalklimekzlin-cmd/Vivere-atque-FruiT";

  // ====== 1) WebCrypto pomocné funkce ======
  function bufToB64(buf) {
    return btoa(String.fromCharCode(...new Uint8Array(buf)));
  }
  function b64ToBuf(b64) {
    const bin = atob(b64);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return buf;
  }
  async function deriveKeyFromPass(pass, saltStr) {
    const enc = new TextEncoder();
    const material = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
    const salt = enc.encode(saltStr);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }
  async function aesEncryptJson(key, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = new TextEncoder().encode(JSON.stringify(obj));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
    return { iv: Array.from(iv), data: bufToB64(ct) };
  }
  async function aesDecryptJson(key, payload) {
    const iv = new Uint8Array(payload.iv);
    const ct = b64ToBuf(payload.data);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return JSON.parse(new TextDecoder().decode(plain));
  }

  // ====== 2) globální stav (ale prázdný, naplníme až po hesle) ======
  let USER_PASS = null;         // heslo, které zadá Lilie
  let userKey = null;           // z něj odvozený klíč
  let partnerKey = null;        // z našeho seedu, pro tebe
  let vaftStore = {             // takhle to budeme ukládat
    wish: null,
    gps: [],
    objects: [],
    wallet: 0,
    tasks: null,
    sos: []                     // SOS necháme plain
  };

  // ====== 3) UI: pytlík hned zobrazíme ======
  const walletDiv = document.createElement('div');
  walletDiv.id = 'poutnik-wallet';
  walletDiv.innerHTML = '💰 <span id="poutnik-wallet-amount">0</span>';
  document.body.appendChild(walletDiv);

  // ====== 4) UI: panel + deník ======
  const root = document.createElement('div');
  root.id = 'poutnik-panel';
  root.innerHTML = `
    <button id="poutnik-toggle">🌿 Poutník</button>
    <div id="poutnik-body">
      <h2>Lilie – deník přírody</h2>

      <label>Tvoje přání:</label>
      <textarea id="poutnik-wish" rows="3" placeholder="Chci zapisovat rostliny, fotit, mluvit..."></textarea>
      <button id="poutnik-save-wish">Uložit přání</button>

      <hr>
      <h3>🧭 GPS stopa</h3>
      <button id="poutnik-gps-start">Začít sledovat</button>
      <button id="poutnik-gps-stop">Zastavit</button>
      <p id="poutnik-gps-status">GPS: čekám...</p>

      <hr>
      <h3>📷 Objekt z přírody</h3>
      <input id="poutnik-photo" type="file" accept="image/*" capture="environment">
      <input id="poutnik-photo-note" type="text" placeholder="Název / poznámka">
      <button id="poutnik-photo-save">Uložit objekt</button>

      <hr>
      <h3>🎙️ Hlasová poznámka</h3>
      <button id="poutnik-voice">Nahrát hlas</button>
      <p id="poutnik-voice-out"></p>

      <hr>
      <h3>📡 SOS (veřejné)</h3>
      <textarea id="poutnik-sos" rows="2" placeholder="Popiš situaci..."></textarea>
      <button id="poutnik-sos-send">Uložit SOS</button>
      <p id="poutnik-sos-status"></p>

      <hr>
      <button id="poutnik-book-open">📖 Otevřít deník</button>
      <button id="poutnik-export">Exportovat JSON</button>
    </div>

    <div id="poutnik-book">
      <div class="book-inner">
        <div class="book-left">
          <h3>Tvoje dny</h3>
          <ul id="poutnik-days"></ul>
        </div>
        <div class="book-right">
          <h3>Mapa dne</h3>
          <canvas id="poutnik-map" width="240" height="180"></canvas>
          <div id="poutnik-tasks"></div>
          <div id="poutnik-day-entries"></div>
          <button id="poutnik-book-close">Zavřít</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  // ====== 5) styly ======
  const style = document.createElement('style');
  style.textContent = `
    #poutnik-wallet {
      position: fixed;
      top: 16px;
      right: 16px;
      background: rgba(5,5,7,.85);
      border: 1px solid #463;
      border-radius: .7rem;
      padding: 4px 10px;
      color: #ffe9a6;
      font-weight: 600;
      z-index: 1200;
    }
    #poutnik-panel {
      position: fixed;
      top: 16px;
      left: 16px;
      z-index: 1000;
      font-family: system-ui,-apple-system,sans-serif;
    }
    #poutnik-toggle {
      background: rgba(10,12,14,.8);
      color: #dff;
      border: 1px solid #345;
      padding: 6px 12px;
      border-radius: .7rem;
    }
    #poutnik-body {
      margin-top: 8px;
      background: rgba(3,5,7,.92);
      border: 1px solid #243;
      border-radius: .9rem;
      padding: 10px 12px;
      width: 270px;
      max-height: 75vh;
      overflow-y: auto;
      display: none;
    }
    #poutnik-body textarea, #poutnik-body input[type="text"] {
      width: 100%;
      background: rgba(255,255,255,.02);
      border: 1px solid #345;
      border-radius: .5rem;
      color: #fff;
      padding: 4px 6px;
      margin-bottom: 6px;
    }
    #poutnik-book {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.4);
      display: none;
      z-index: 1500;
      backdrop-filter: blur(3px);
    }
    #poutnik-book .book-inner {
      background: radial-gradient(circle at top, #1d2428, #0b0d0f);
      border: 1px solid #234;
      border-radius: 1rem;
      width: min(90vw, 520px);
      height: min(85vh, 420px);
      margin: 4vh auto 0;
      display: flex;
      overflow: hidden;
    }
    .book-left { width: 40%; padding: 10px; overflow-y: auto; }
    .book-right { flex: 1; padding: 10px; overflow-y: auto; }
    #poutnik-days { list-style:none; padding:0; margin:0; }
    #poutnik-days li { padding:4px 6px; background:rgba(255,255,255,.02); margin-bottom:4px; cursor:pointer; border-radius:.4rem; }
    #poutnik-days li.active { background:rgba(200,255,255,.04); border:1px solid rgba(200,255,255,.4); }
    #poutnik-map { width:100%; background:rgba(0,0,0,.4); border:1px solid rgba(200,255,255,.08); border-radius:.5rem; margin-bottom:6px; }
  `;
  document.head.appendChild(style);

  // ====== 6) Úvodní heslo – modální prompt ======
  async function askForPasswordAndInit() {
    // jednoduchý prompt – můžeš nahradit vlastním UI
    USER_PASS = prompt("Zadej heslo Lilie:");
    if (!USER_PASS) {
      alert("Bez hesla tohle album nejde otevřít.");
      return;
    }
    // odvoď user klíč
    userKey = await deriveKeyFromPass(USER_PASS, "vaft-lilie-user");
    // odvoď partner klíč (aby sis uměl rozšifrovat export)
    partnerKey = await deriveKeyFromPass(PARTNER_SEED, "vaft-lilie-partner");

    // zkus načíst data z localStorage
    const raw = localStorage.getItem("vaft_lilie_secure");
    if (raw) {
      try {
        const encObj = JSON.parse(raw);
        // první pokus – uživatelské heslo
        try {
          vaftStore = await aesDecryptJson(userKey, encObj);
        } catch (e) {
          // druhý pokus – parťák
          vaftStore = await aesDecryptJson(partnerKey, encObj);
        }
      } catch (e) {
        console.warn("Nelze dešifrovat stará data", e);
      }
    } else {
      // inicializace základních úkolů
      vaftStore = {
        wish: null,
        gps: [],
        objects: [],
        wallet: 0,
        tasks: [
          { id: 'river-01', title: 'Vyfoť řeku zblízka', reward: 100, done: false, keyword: 'řeka' },
          { id: 'tree-01', title: 'Vyfoť strom s kmenem', reward: 50, done: false, keyword: 'strom' },
          { id: 'moss-01', title: 'Vyfoť mech', reward: 50, done: false, keyword: 'mech' }
        ],
        sos: []
      };
    }
    // nastav pytlík
    document.getElementById('poutnik-wallet-amount').textContent = vaftStore.wallet || 0;
  }

  // uložit celý stav šifrovaně
  async function saveAllEncrypted() {
    if (!userKey) return;
    const enc = await aesEncryptJson(userKey, vaftStore);
    localStorage.setItem("vaft_lilie_secure", JSON.stringify(enc));
  }

  // ====== 7) zbytek logiky (už počítáme s tím, že máme heslo) ======
  askForPasswordAndInit();

  // toggle panelu
  document.getElementById('poutnik-toggle').addEventListener('click', () => {
    const b = document.getElementById('poutnik-body');
    b.style.display = b.style.display === 'none' ? 'block' : 'none';
  });

  // přání
  document.getElementById('poutnik-save-wish').addEventListener('click', async () => {
    const v = document.getElementById('poutnik-wish').value.trim();
    vaftStore.wish = v;
    await saveAllEncrypted();
    alert('Uloženo 🌿');
  });

  // GPS
  let gpsWatchId = null;
  const gpsStatus = document.getElementById('poutnik-gps-status');
  function getLastGps() {
    return vaftStore.gps.length ? vaftStore.gps[vaftStore.gps.length - 1] : null;
  }
  document.getElementById('poutnik-gps-start').addEventListener('click', () => {
    if (!navigator.geolocation) { alert('Geolokace není dostupná'); return; }
    gpsWatchId = navigator.geolocation.watchPosition(async pos => {
      const point = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        acc: pos.coords.accuracy,
        t: Date.now()
      };
      vaftStore.gps.push(point);
      gpsStatus.textContent = 'GPS: ' + point.lat.toFixed(5) + ', ' + point.lon.toFixed(5);
      await saveAllEncrypted();
    }, err => {
      alert('GPS chyba: ' + err.message);
    }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 });
    gpsStatus.textContent = 'GPS: spuštěno...';
  });
  document.getElementById('poutnik-gps-stop').addEventListener('click', () => {
    if (gpsWatchId !== null) navigator.geolocation.clearWatch(gpsWatchId);
    gpsStatus.textContent = 'GPS: vypnuto';
  });

  // FOTO
  document.getElementById('poutnik-photo-save').addEventListener('click', () => {
    const file = document.getElementById('poutnik-photo').files[0];
    const note = document.getElementById('poutnik-photo-note').value.trim();
    if (!file) { alert('Nejdřív vyfoť nebo vyber fotku'); return; }
    const reader = new FileReader();
    reader.onload = async function (e) {
      const obj = {
        type: 'photo',
        note: note,
        img: e.target.result,
        t: Date.now(),
        loc: getLastGps()
      };
      vaftStore.objects.push(obj);

      // zkusí splnit úkoly
      const noteLower = (note || '').toLowerCase();
      let rewarded = false;
      if (vaftStore.tasks) {
        vaftStore.tasks.forEach(task => {
          if (!task.done && task.keyword && noteLower.includes(task.keyword)) {
            task.done = true;
            vaftStore.wallet = (vaftStore.wallet || 0) + task.reward;
            document.getElementById('poutnik-wallet-amount').textContent = vaftStore.wallet;
            rewarded = true;
          }
        });
      }
      await saveAllEncrypted();
      alert(rewarded ? 'Úkol splněn, zlaťáky připsány 💰' : 'Uloženo 🌲');

      document.getElementById('poutnik-photo').value = '';
      document.getElementById('poutnik-photo-note').value = '';
    };
    reader.readAsDataURL(file);
  });

  // HLAS
  document.getElementById('poutnik-voice').addEventListener('click', () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      const entry = {
        type: 'voice',
        text: '[hlas offline]',
        t: Date.now(),
        loc: getLastGps()
      };
      vaftStore.objects.push(entry);
      saveAllEncrypted();
      alert('Hlas není dostupný, ale záznam jsem uložil.');
      return;
    }
    const r = new SR();
    r.lang = 'cs-CZ';
    r.start();
    r.onresult = async (ev) => {
      const text = ev.results[0][0].transcript;
      document.getElementById('poutnik-voice-out').textContent = '🗣️ ' + text;
      vaftStore.objects.push({
        type: 'voice',
        text,
        t: Date.now(),
        loc: getLastGps()
      });
      await saveAllEncrypted();
    };
  });

  // SOS – NEŠIFRUJEME
  document.getElementById('poutnik-sos-send').addEventListener('click', () => {
    const msg = document.getElementById('poutnik-sos').value.trim() || '[SOS]';
    const sosItem = {
      type: 'sos',
      msg,
      loc: getLastGps(),
      t: Date.now()
    };
    // uložíme plain do localStorage zvlášť
    const old = JSON.parse(localStorage.getItem('vaft_lilie_sos_plain') || '[]');
    old.push(sosItem);
    localStorage.setItem('vaft_lilie_sos_plain', JSON.stringify(old));
    document.getElementById('poutnik-sos-status').textContent = 'SOS uloženo (veřejné).';
  });

  // EXPORT
  document.getElementById('poutnik-export').addEventListener('click', async () => {
    // export chceme šifrovaný i s daty
    const enc = await aesEncryptJson(userKey, vaftStore);
    const blob = new Blob([JSON.stringify(enc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lilie-secure.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  // DENÍK
  const book = document.getElementById('poutnik-book');
  const bookOpen = document.getElementById('poutnik-book-open');
  const bookClose = document.getElementById('poutnik-book-close');
  const daysList = document.getElementById('poutnik-days');
  const dayEntries = document.getElementById('poutnik-day-entries');
  const tasksDiv = document.getElementById('poutnik-tasks');
  const mapCanvas = document.getElementById('poutnik-map');
  const ctx = mapCanvas.getContext('2d');

  function groupByDay() {
    const days = {};
    (vaftStore.gps || []).forEach(pt => {
      const d = new Date(pt.t).toISOString().slice(0,10);
      days[d] = days[d] || { gps: [], obj: [] };
      days[d].gps.push(pt);
    });
    (vaftStore.objects || []).forEach(o => {
      const d = new Date(o.t).toISOString().slice(0,10);
      days[d] = days[d] || { gps: [], obj: [] };
      days[d].obj.push(o);
    });
    return days;
  }
  function renderTasks() {
    tasksDiv.innerHTML = '<h4>Úkoly</h4>';
    (vaftStore.tasks || []).forEach(t => {
      const p = document.createElement('p');
      p.textContent = (t.done ? '✅ ' : '🟡 ') + t.title + ' +' + t.reward + ' Kč';
      tasksDiv.appendChild(p);
    });
  }
  function renderDayDetail(day, data) {
    dayEntries.innerHTML = '';
    if (!data.obj.length) {
      dayEntries.textContent = 'Žádné záznamy.';
    } else {
      data.obj.forEach(o => {
        const p = document.createElement('p');
        const time = new Date(o.t).toLocaleTimeString();
        p.textContent = time + ' — ' + (o.note || o.text || o.type);
        dayEntries.appendChild(p);
      });
    }
    ctx.clearRect(0,0,mapCanvas.width,mapCanvas.height);
    if (!data.gps.length) {
      ctx.fillStyle = '#9fd';
      ctx.fillText('Žádná GPS', 10, 20);
      return;
    }
    let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
    data.gps.forEach(pt => {
      if (pt.lat < minLat) minLat = pt.lat;
      if (pt.lat > maxLat) maxLat = pt.lat;
      if (pt.lon < minLon) minLon = pt.lon;
      if (pt.lon > maxLon) maxLon = pt.lon;
    });
    const pad = 10;
    const w = mapCanvas.width - pad*2;
    const h = mapCanvas.height - pad*2;
    const latRange = maxLat - minLat || 0.00001;
    const lonRange = maxLon - minLon || 0.00001;
    ctx.strokeStyle = '#aff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.gps.forEach((pt, idx) => {
      const x = pad + ((pt.lon - minLon) / lonRange) * w;
      const y = pad + ((pt.lat - minLat) / latRange) * h;
      const yy = pad + h - (y - pad);
      if (idx === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    });
    ctx.stroke();
  }
  function renderDays() {
    const days = groupByDay();
    daysList.innerHTML = '';
    const sorted = Object.keys(days).sort().reverse();
    sorted.forEach((d, idx) => {
      const li = document.createElement('li');
      li.textContent = d + ' · ' + days[d].obj.length + ' záznamů';
      if (idx === 0) li.classList.add('active');
      li.addEventListener('click', () => {
        [...daysList.children].forEach(c => c.classList.remove('active'));
        li.classList.add('active');
        renderDayDetail(d, days[d]);
      });
      daysList.appendChild(li);
      if (idx === 0) renderDayDetail(d, days[d]);
    });
  }
  bookOpen.addEventListener('click', () => {
    renderDays();
    renderTasks();
    book.style.display = 'block';
  });
  bookClose.addEventListener('click', () => {
    book.style.display = 'none';
  });

})();
