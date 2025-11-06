// Revia – logika, sync s VAFT
(function () {
  const root = document.querySelector('.revia-main');
  const toggleBtn = document.getElementById('reviaToggle');
  const slot1 = document.getElementById('reviaSlot1');
  const glyphSpan = document.getElementById('reviaGlyph');

  const GLYPHS = ["「Ī’𞋒", "「Ī’☆"];
  let glyphIndex = 0;

  // načíst, pokud už si hráč něco zvolil dřív
  function loadState() {
    try {
      const raw = localStorage.getItem('vaft_revia_state');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (typeof data.glyphIndex === 'number') glyphIndex = data.glyphIndex;
      if (data.mode && root) root.setAttribute('data-mode', data.mode);
      if (glyphSpan) glyphSpan.textContent = GLYPHS[glyphIndex];
    } catch (e) {
      console.warn('Revia: nejde načíst stav', e);
    }
  }

  function saveState(mode, glyphIndex) {
    const payload = {
      mode,
      glyphIndex,
      ts: Date.now()
    };
    localStorage.setItem('vaft_revia_state', JSON.stringify(payload));

    // jednoduchý “heartbeat” do světa – můžeš si to v hlavní appce číst
    localStorage.setItem('vaft_last_revia', JSON.stringify({
      who: 'revia',
      mode,
      glyph: GLYPHS[glyphIndex],
      at: new Date().toISOString()
    }));
  }

  function applyModeFromGlyph(index) {
    if (!root) return;
    const mode = index === 0 ? 'angel' : 'daemon';
    root.setAttribute('data-mode', mode);
    saveState(mode, index);
  }

  // klik na slot 1
  if (slot1 && glyphSpan) {
    slot1.addEventListener('click', () => {
      glyphIndex = (glyphIndex + 1) % GLYPHS.length;
      glyphSpan.textContent = GLYPHS[glyphIndex];
      applyModeFromGlyph(glyphIndex);
    });
  }

  // dolní tlačítko
  if (toggleBtn && root && glyphSpan) {
    toggleBtn.addEventListener('click', () => {
      const current = root.getAttribute('data-mode') || 'angel';
      const next = current === 'angel' ? 'daemon' : 'angel';
      root.setAttribute('data-mode', next);

      // srovnání glyphu
      glyphIndex = next === 'angel' ? 0 : 1;
      glyphSpan.textContent = GLYPHS[glyphIndex];
      saveState(next, glyphIndex);
    });
  }

  // inicializace
  loadState();
  // kdyby nebyl žádný stav
  applyModeFromGlyph(glyphIndex);
})();
