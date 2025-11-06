// Revia – logika přepínání
(function () {
  const root = document.querySelector('.revia-main');
  const toggleBtn = document.getElementById('reviaToggle');
  const slot1 = document.getElementById('reviaSlot1');
  const glyphSpan = document.getElementById('reviaGlyph');

  // dva přesně tvoje glyphy
  const GLYPHS = ["「Ī’𞋒", "「Ī’☆"];
  let glyphIndex = 0;

  // klik na první slot -> přepni glyph
  if (slot1 && glyphSpan) {
    slot1.addEventListener('click', () => {
      glyphIndex = (glyphIndex + 1) % GLYPHS.length;
      glyphSpan.textContent = GLYPHS[glyphIndex];
    });
  }

  // klik na tlačítko dole -> přepni pozadí
  if (toggleBtn && root) {
    toggleBtn.addEventListener('click', () => {
      const current = root.getAttribute('data-mode') || 'angel';
      const next = current === 'angel' ? 'daemon' : 'angel';
      root.setAttribute('data-mode', next);
    });
  }
})();
