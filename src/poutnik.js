// src/poutnik.js
// Poutník / Lilie – offline deník přírody + mini-mapa + úkoly + SOS
// navazuje na VAFT

window.VAFT = window.VAFT || {};

(function () {
  // 0) meziprostor – fronta na věci, co pošleme/doladíme později
  VAFT.meziProstor = VAFT.meziProstor || {
    queue: JSON.parse(localStorage.getItem('vaft_meziprostor') || '[]'),
    push(item) {
      this.queue.push(item);
      localStorage.setItem('vaft_meziprostor', JSON.stringify(this.queue));
    }
  };

  // 1) základní data poutníka
  VAFT.poutnik = VAFT.poutnik || {
    config: {},
    gpsTrack: [],
    objects: []
  };

  // načíst uložené GPS a objekty
  const savedGps = localStorage.getItem('vaft_poutnik_gps');
  if (savedGps) {
    try { VAFT.poutnik.gpsTrack = JSON.parse(savedGps); } catch (e) {}
  }
  const savedObj = localStorage.getItem('vaft_poutnik_objects');
  if (savedObj) {
    try { VAFT.poutnik.objects = JSON.parse(savedObj); } catch (e) {}
  }

  // 2) pytlík se zlaťáky (wallet)
  const walletDiv = document.createElement('div');
  walletDiv.id = 'poutnik-wallet';
  walletDiv.innerHTML = '💰 <span id="poutnik-wallet-amount">0</span>';
  document.body.appendChild(walletDiv);
  let walletAmount = parseInt(localStorage.getItem('vaft_poutnik_wallet') || '0', 10);
  document.getElementById('poutnik-wallet-amount').textContent = walletAmount;

  // 3) základní úkoly
  const POUTNIK_TASKS = JSON.parse(localStorage.getItem('vaft_poutnik_tasks') || 'null') || [
    { id: 'river-01', title: 'Vyfoť řeku zblízka', reward: 100, done: false, keyword: 'řeka' },
    { id: 'tree-01', title: 'Vyfoť strom tak, aby byl vidět kmen', reward: 50, done: false, keyword: 'strom' },
    { id: 'moss-01', title: 'Vyfoť mech / detail země', reward: 50, done: false, keyword: 'mech' }
  ];
  function saveTasks() {
    localStorage.setItem('vaft_poutnik_tasks', JSON.stringify(POUTNIK_TASKS));
  }

  // 4) hlavní UI panel
  const root = document.createElement('div');
  root.id = 'poutnik-panel';
  root.innerHTML = `
    <button id="poutnik-toggle">🌿 Poutník</button>
    <div id="poutnik-body">
      <h2>Lilie – deník přírody</h2>

      <label>Co má tahle aplikace umět?</label>
      <textarea id="poutnik-wish" rows="3" placeholder="Chci zapisovat rostliny, fotit, mluvit..."></textarea>
      <button id="poutnik-save-wish">Uložit přání</button>

      <hr>
      <h3>🧭 GPS stopa</h3>
      <button id="poutnik-gps-start">Začít sledovat</button>
      <button id="poutnik-gps-stop">Zastavit</button>
      <p id="poutnik-gps-status">GPS: vypnuto</p>

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
      <h3>📡 Nouzový přenos</h3>
      <textarea id="poutnik-sos" rows="2" placeholder="Popiš situaci..."></textarea>
      <button id="poutnik-sos-send">Uložit SOS</button>
      <p id="poutnik-sos-status"></p>

      <hr>
      <button id="poutnik-book-open">📖 Otevřít deník</button>
      <button id="poutnik-export">Exportovat JSON</button>
    </div>

    <!-- DENÍK / KNIHA -->
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

  // 5) styly
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
    #poutnik-body h2, #poutnik-body h3 {
      margin: 6px 0;
      color: #eff;
      font-size: 1rem;
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
    #poutnik-body button {
      background: rgba(255,255,255,.03);
      border: 1px solid #456;
      border-radius: .5rem;
      color: #fff;
      padding: 4px 8px;
      margin-top: 4px;
    }
    /* deník */
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
      box-shadow: 0 20px 40px rgba(0,0,0,.4);
    }
    .book-left {
      width: 40%;
      border-right: 1px solid rgba(255,255,255,.03);
      padding: 10px;
      color: #eef;
      overflow-y: auto;
    }
    .book-right {
      flex: 1;
      padding: 10px;
      color: #eef;
      overflow-y: auto;
    }
    #poutnik-days {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    #poutnik-days li {
      padding: 4px 6px;
      background: rgba(255,255,255,.02);
      border: 1px solid transparent;
      border-radius: .4rem;
      margin-bottom: 4px;
      cursor: pointer;
    }
    #poutnik-days li.active {
      border-color: rgba(200,255,255,.5);
      background: rgba(200,255,255,.04);
    }
    #poutnik-map {
      width: 100%;
      background: rgba(0,0,0,.4);
      border: 1px solid rgba(200,255,255,.08);
      border-radius: .5rem;
      margin-bottom: 6px;
    }
    #poutnik-tasks h4 {
      margin: 4px 0;
    }
    #poutnik-day-entries {
      font-size: .8rem;
      line-height: 1.3;
    }
  `;
  document.head.appendChild(style);

  // 6) logika panelu
  const panelBtn = document.getElementById('poutnik-toggle');
  const panelBody = document.getElementById('poutnik-body');
  panelBtn.addEventListener('click', () => {
    panelBody.style.display = panelBody.style.display === 'none' ? 'block' : 'none';
  });

  // přání
  const wishEl = document.getElementById('poutnik-wish');
  const wishSaved = localStorage.getItem('vaft_poutnik_wish');
  if (wishSaved) wishEl.value = wishSaved;
  document.getElementById('poutnik-save-wish').addEventListener('click', () => {
    const v = wishEl.value.trim();
    localStorage.setItem('vaft_poutnik_wish', v);
    VAFT.poutnik.config.wish = v;
    VAFT.meziProstor.push({type:'wish',data:v,t:Date.now()});
    alert('Uloženo 🌿');
  });

  // GPS
  let gpsWatchId = null;
  const gpsStatus = document.getElementById('poutnik-gps-status');
  function onGps(pos) {
    const point = {
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
      acc: pos.coords.accuracy,
      t: Date.now()
    };
    VAFT.poutnik.gpsTrack.push(point);
    localStorage.setItem('vaft_poutnik_gps', JSON.stringify(VAFT.poutnik.gpsTrack));
    VAFT.meziProstor.push({type:'gps',data:point});
    gpsStatus.textContent = 'GPS: ' + point.lat.toFixed(5) + ', ' + point.lon.toFixed(5);
  }
  document.getElementById('poutnik-gps-start').addEventListener('click', () => {
    if (!navigator.geolocation) { alert('Geolokace není dostupná'); return; }
    gpsWatchId = navigator.geolocation.watchPosition(onGps, err => {
      alert('GPS chyba: ' + err.message);
    }, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 20000
    });
    gpsStatus.textContent = 'GPS: spuštěno...';
  });
  document.getElementById('poutnik-gps-stop').addEventListener('click', () => {
    if (gpsWatchId !== null) {
      navigator.geolocation.clearWatch(gpsWatchId);
      gpsWatchId = null;
    }
    gpsStatus.textContent = 'GPS: vypnuto';
  });

  // FOTO
  const photoInput = document.getElementById('poutnik-photo');
  const photoNote = document.getElementById('poutnik-photo-note');
  document.getElementById('poutnik-photo-save').addEventListener('click', () => {
    const file = photoInput.files[0];
    const note = photoNote.value.trim();
    if (!file) { alert('Nejdřív vyfoť nebo vyber fotku'); return; }
    const reader = new FileReader();
    reader.onload = function (e) {
      const obj = {
        note: note,
        img: e.target.result,
        t: Date.now(),
        loc: VAFT.poutnik.gpsTrack.length ? VAFT.poutnik.gpsTrack[VAFT.poutnik.gpsTrack.length - 1] : null
      };
      VAFT.poutnik.objects.push(obj);
      localStorage.setItem('vaft_poutnik_objects', JSON.stringify(VAFT.poutnik.objects));
      VAFT.meziProstor.push({type:'photo',data:obj});

      // zkusit splnit úkol
      const noteLower = (note || '').toLowerCase();
      let rewarded = false;
      POUTNIK_TASKS.forEach(task => {
        if (!task.done && task.keyword && noteLower.includes(task.keyword)) {
          task.done = true;
          walletAmount += task.reward;
          localStorage.setItem('vaft_poutnik_wallet', walletAmount);
          document.getElementById('poutnik-wallet-amount').textContent = walletAmount;
          VAFT.meziProstor.push({type:'task-done',taskId:task.id,t:Date.now()});
          rewarded = true;
        }
      });
      if (rewarded) {
        saveTasks();
        alert('Úkol splněn, zlaťáky připsány 💰');
      }

      alert('Uloženo 🌲');
      photoInput.value = '';
      photoNote.value = '';
    };
    reader.readAsDataURL(file);
  });

  // HLAS
  const voiceBtn = document.getElementById('poutnik-voice');
  const voiceOut = document.getElementById('poutnik-voice-out');
  voiceBtn.addEventListener('click', () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      const entry = {
        type: 'voice',
        text: '[hlas offline]',
        t: Date.now(),
        loc: VAFT.poutnik.gpsTrack.at(-1) || null
      };
      VAFT.poutnik.objects.push(entry);
      localStorage.setItem('vaft_poutnik_objects', JSON.stringify(VAFT.poutnik.objects));
      VAFT.meziProstor.push({type:'voice',data:entry});
      alert('Hlas není dostupný, ale záznam jsem uložil.');
      return;
    }
    const r = new SR();
    r.lang = 'cs-CZ';
    r.start();
    r.onresult = (ev) => {
      const text = ev.results[0][0].transcript;
      voiceOut.textContent = '🗣️ ' + text;
      const entry = {
        type: 'voice',
        text,
        t: Date.now(),
        loc: VAFT.poutnik.gpsTrack.at(-1) || null
      };
      VAFT.poutnik.objects.push(entry);
      localStorage.setItem('vaft_poutnik_objects', JSON.stringify(VAFT.poutnik.objects));
      VAFT.meziProstor.push({type:'voice',data:entry});
    };
  });

  // SOS
  const sosText = document.getElementById('poutnik-sos');
  const sosStatus = document.getElementById('poutnik-sos-status');
  document.getElementById('poutnik-sos-send').addEventListener('click', () => {
    const msg = sosText.value.trim() || '[SOS bez textu]';
    const lastLoc = VAFT.poutnik.gpsTrack.at(-1) || null;
    const sosPacket = {
      type: 'sos',
      msg,
      loc: lastLoc,
      t: Date.now()
    };
    VAFT.meziProstor.push(sosPacket);
    sosStatus.textContent = 'SOS uloženo (offline).';
  });

  // EXPORT
  document.getElementById('poutnik-export').addEventListener('click', () => {
    const data = {
      wish: localStorage.getItem('vaft_poutnik_wish') || '',
      gps: VAFT.poutnik.gpsTrack,
      objects: VAFT.poutnik.objects,
      queue: VAFT.meziProstor.queue,
      wallet: walletAmount,
      tasks: POUTNIK_TASKS
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lilie-poutnik.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  // 7) DENÍK / KNIHA
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
    VAFT.poutnik.gpsTrack.forEach(pt => {
      const d = new Date(pt.t).toISOString().slice(0,10);
      days[d] = days[d] || {gps: [], obj: []};
      days[d].gps.push(pt);
    });
    VAFT.poutnik.objects.forEach(o => {
      const d = new Date(o.t).toISOString().slice(0,10);
      days[d] = days[d] || {gps: [], obj: []};
      days[d].obj.push(o);
    });
    return days;
  }

  function renderTasks() {
    tasksDiv.innerHTML = '<h4>Úkoly</h4>';
    POUTNIK_TASKS.forEach(t => {
      const p = document.createElement('p');
      p.textContent = (t.done ? '✅ ' : '🟡 ') + t.title + ' · +' + t.reward + ' Kč';
      tasksDiv.appendChild(p);
    });
  }

  function renderDayDetail(day, data) {
    // texty
    dayEntries.innerHTML = '';
    if (data.obj.length === 0 && data.gps.length === 0) {
      dayEntries.textContent = 'Žádné záznamy.';
    } else {
      data.obj.forEach(o => {
        const p = document.createElement('p');
        const time = new Date(o.t).toLocaleTimeString();
        p.textContent = time + ' — ' + (o.note || o.text || 'záznam');
        dayEntries.appendChild(p);
      });
    }
    // mapa
    ctx.clearRect(0,0,mapCanvas.width,mapCanvas.height);
    if (!data.gps.length) {
      ctx.fillStyle = '#9fd';
      ctx.fillText('Žádná GPS pro tento den', 10, 20);
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

    // body s fotkami
    ctx.fillStyle = '#f8a';
    VAFT.poutnik.objects
      .filter(o => new Date(o.t).toISOString().slice(0,10) === day && o.loc)
      .forEach(o => {
        const x = pad + ((o.loc.lon - minLon) / lonRange) * w;
        const y = pad + ((o.loc.lat - minLat) / latRange) * h;
        const yy = pad + h - (y - pad);
        ctx.beginPath();
        ctx.arc(x, yy, 4, 0, Math.PI*2);
        ctx.fill();
      });
  }

  function renderDays() {
    const days = groupByDay();
    daysList.innerHTML = '';
    const sorted = Object.keys(days).sort().reverse();
    sorted.forEach((d, idx) => {
      const li = document.createElement('li');
      li.textContent = d + ' · ' + (days[d].obj.length) + ' záznamů';
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
