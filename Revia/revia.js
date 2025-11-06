// Revia – logika UI
(function () {
  const root = document.querySelector('.revia-main');
  const toggleBtn = document.getElementById('revToggle');
  const slots = document.querySelectorAll('.revia-slot');

  // když není uložený režim, dáme anděla
  const savedMode = localStorage.getItem('rev-mode') || 'angel';
  root.dataset.mode = savedMode;

  // GLYPHY pro první slot
  const glyphs = ["「Ī’𞋒", "「Ī’☆"];
  let glyphIndex = Number(localStorage.getItem('rev-glyph-idx') || 0);

  // vykresli glyph do prvního slotu
  const firstGlyphEl = slots[0].querySelector('.revia-glyph');
  if (firstGlyphEl) {
    firstGlyphEl.textContent = glyphs[glyphIndex];
  }

  // klik na přepínač – přehodí anděl/ďábel
  toggleBtn?.addEventListener('click', () => {
    const current = root.dataset.mode === 'angel' ? 'daemon' : 'angel';
    root.dataset.mode = current;
    localStorage.setItem('rev-mode', current);
  });

  // klik na první slot – přehodí glyph
  if (slots[0]) {
    slots[0].addEventListener('click', () => {
      glyphIndex = (glyphIndex + 1) % glyphs.length;
      slots[0].querySelector('.revia-glyph').textContent = glyphs[glyphIndex];
      localStorage.setItem('rev-glyph-idx', String(glyphIndex));
    });
  }

  // ostatní sloty zatím prázdné – jen lehká animace na klik
  for (let i = 1; i < slots.length; i++) {
    slots[i].addEventListener('click', () => {
      slots[i].style.transform = 'translateY(-2px)';
      setTimeout(() => (slots[i].style.transform = ''), 160);
    });
  }
})();
