// Hlavoun / pulzující mřížka
(function () {
  const GRID_COUNT = 89;          // kolik buněk
  const ACTIVE_MS = 950;          // jak dlouho svítí jedna buňka
  const TICK_MS = 420;            // jak často to dělá náhodný impuls

  // 1) najdi hlavní obal
  const root = document.querySelector('.hlavoun-main');
  if (!root) return;

  // 2) najdi nebo vytvoř mřížku
  let grid = document.querySelector('.hlavoun-grid');
  if (!grid) {
    grid = document.createElement('div');
    grid.className = 'hlavoun-grid';
    root.appendChild(grid);
  }

  // 3) vytvoř 89 buněk
  const cells = [];
  for (let i = 0; i < GRID_COUNT; i++) {
    const c = document.createElement('div');
    c.className = 'hlavoun-cell';
    // jemná náhodná počáteční průhlednost
    c.style.opacity = (Math.random() * 0.25 + 0.08).toFixed(2);
    grid.appendChild(c);
    cells.push(c);
  }

  // helper – přečti VAFT mód (jestli existuje)
  function getVaftMode() {
    try {
      const raw = localStorage.getItem('vaft-state');
      if (!raw) return 'angel';
      const data = JSON.parse(raw);
      return data.mode || 'angel';
    } catch (e) {
      return 'angel';
    }
  }

  // podle módu lehce uprav odstín buněk
  function applyMode(mode) {
    cells.forEach((c) => {
      if (mode === 'daemon') {
        c.style.borderColor = 'rgba(255,118,118,.35)';
        c.style.background = 'radial-gradient(circle, rgba(255,118,118,.25), rgba(6,10,15,0))';
      } else {
        c.style.borderColor = 'rgba(206,236,255,.25)';
        c.style.background = 'radial-gradient(circle, rgba(165,207,255,.22), rgba(6,10,15,0))';
      }
    });
  }

  applyMode(getVaftMode());

  // 4) funkce na rozsvícení jedné buňky
  function flashCell(cell, boost = false) {
    cell.classList.add('on');
    if (boost) {
      cell.style.transition = 'opacity .25s ease, transform .25s ease, border .25s ease';
      cell.style.opacity = '0.95';
    }
    setTimeout(() => {
      cell.classList.remove('on');
      // vrať mírně náhodnou pasivní opacitu
      cell.style.opacity = (Math.random() * 0.25 + 0.08).toFixed(2);
      cell.style.transition = ''; // reset
    }, ACTIVE_MS + Math.random() * 300);
  }

  // 5) náhodný impuls
  function randomImpulse() {
    const idx = Math.floor(Math.random() * cells.length);
    flashCell(cells[idx]);

    // občas udělej vlnu
    if (Math.random() < 0.26) {
      const start = Math.floor(Math.random() * cells.length);
      const waveLen = Math.floor(Math.random() * 4) + 3; // 3–6 buněk
      for (let i = 0; i < waveLen; i++) {
        const c = cells[(start + i) % cells.length];
        setTimeout(() => flashCell(c, true), i * 110);
      }
    }
  }

  // 6) pravidelné tikání
  setInterval(randomImpulse, TICK_MS);

  // 7) poslouchej případné změny z broadcast channelu VAFT
  try {
    const ch = new BroadcastChannel('vaft-channel');
    ch.onmessage = (ev) => {
      if (!ev || !ev.data) return;
      if (ev.data.type === 'vaft-mode-change') {
        applyMode(ev.data.mode);
      }
    };
  } catch (e) {
    // když BroadcastChannel není, nic se neděje
  }
})();
