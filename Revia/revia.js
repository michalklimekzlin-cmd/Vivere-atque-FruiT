// elementy
const main = document.querySelector('.revia-main');
const toggleBtn = document.getElementById('revToggle');
const slot1 = document.getElementById('slot1');
const slot1Glyph = document.getElementById('slot1Glyph');
const helpBtn = document.getElementById('revHelp');
const toast = document.getElementById('revToast');
const wingBtn = document.getElementById('revWing');
const notesPanel = document.getElementById('revNotes');
const notesClose = document.getElementById('notesClose');
const notesText = document.getElementById('notesText');

const GLYPH_ANGEL = "「Ī’☆";
const GLYPH_DAEMON = "「Ī’𞋒";

let isAngel = true;

// inicializace glyphu
slot1Glyph.textContent = GLYPH_ANGEL;

// přepínání režimu (tlačítko dole)
toggleBtn.addEventListener('click', () => {
  isAngel = !isAngel;
  main.setAttribute('data-mode', isAngel ? 'angel' : 'daemon');
  slot1Glyph.textContent = isAngel ? GLYPH_ANGEL : GLYPH_DAEMON;
});

// přepínání i kliknutím na první slot
slot1.addEventListener('click', () => {
  isAngel = !isAngel;
  main.setAttribute('data-mode', isAngel ? 'angel' : 'daemon');
  slot1Glyph.textContent = isAngel ? GLYPH_ANGEL : GLYPH_DAEMON;
});

// zápisník otevřít
wingBtn.addEventListener('click', () => {
  notesPanel.classList.add('open');
});

// zápisník zavřít
notesClose.addEventListener('click', () => {
  notesPanel.classList.remove('open');
});

// pomoc – náhodná zpráva
const HELP_MSGS = [
  "Revia: sleduju tvoje sloty.",
  "Glyph se váže na pozadí.",
  "Zápisník je jen v tomto zařízení.",
  "Přidej další sloty, až bude charakter.",
];
helpBtn.addEventListener('click', () => {
  const m = HELP_MSGS[Math.floor(Math.random() * HELP_MSGS.length)];
  toast.textContent = m;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
});

// localStorage pro zápisník
const saved = localStorage.getItem('reviaNotes');
if (saved !== null) {
  notesText.value = saved;
}
notesText.addEventListener('input', () => {
  localStorage.setItem('reviaNotes', notesText.value);
});
