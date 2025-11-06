// Revia client mini
(function () {
  const reviaRoot = document.querySelector('.revia-main');
  const toggleBtn = document.getElementById('revToggle');
  const toast = document.getElementById('revToast');

  // 1) přepínání anděl / démon
  toggleBtn?.addEventListener('click', () => {
    const cur = reviaRoot.getAttribute('data-mode') || 'angel';
    const next = cur === 'angel' ? 'daemon' : 'angel';
    reviaRoot.setAttribute('data-mode', next);
    showToast(next === 'angel' ? 'režim: anděl' : 'režim: démon');
  });

  // 2) slot 1 – přepínací glyph
  const slot1 = document.getElementById('slot1');
  const slot1Glyph = document.getElementById('slot1Glyph');
  const GLYPHS = ['Ī’𞋒', 'Ī’☆'];
  let gIndex = 0;

  slot1?.addEventListener('click', () => {
    gIndex = (gIndex + 1) % GLYPHS.length;
    slot1Glyph.textContent = GLYPHS[gIndex];
    slot1.classList.add('active');
    setTimeout(() => slot1.classList.remove('active'), 200);
    showToast('glyph: ' + GLYPHS[gIndex]);
  });

  // 3) zápisník z křídla
  const wing = document.getElementById('revWing');
  const notes = document.getElementById('revNotes');
  const notesClose = document.getElementById('notesClose');
  const notesText = document.getElementById('notesText');
  const NOTES_KEY = 'revia-wing-notes';

  // načíst
  const saved = localStorage.getItem(NOTES_KEY);
  if (saved) notesText.value = saved;

  wing?.addEventListener('click', () => {
    notes.classList.toggle('show');
  });
  notesClose?.addEventListener('click', () => {
    notes.classList.remove('show');
  });
  notesText?.addEventListener('input', () => {
    localStorage.setItem(NOTES_KEY, notesText.value);
  });

  // 4) pomocník
  const help = document.getElementById('revHelp');
  help?.addEventListener('click', () => {
    showToast('Revia: první slot střídá glyph, dole střídá pozadí.');
  });

  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }
})();
