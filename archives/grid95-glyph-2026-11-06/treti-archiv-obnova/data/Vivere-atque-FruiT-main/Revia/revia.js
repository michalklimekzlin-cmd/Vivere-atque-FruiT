// === Revia v0.6 – verze pro „darovanou“ hrdinku ===

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
const enterBtn = document.getElementById('revEnter');
const stateEl = document.getElementById('revState');

const GLYPH_ANGEL = "「Ī’☆";
const GLYPH_DAEMON = "「Ī’𞋒";

// ✨ TADY je ta „darovací“ fráze – pošli ji jen té slečně
const OWNER_PASS = "revia-2025";   // klidně přepiš na něco osobního
const LS_KEY = "revia-owner-ok";

let isAngel = true;

// zjistíme, jestli je to TA slečna
let isOwner = (localStorage.getItem(LS_KEY) === "yes");

// kdo ji právě drží: "ai" nebo "player"
let control = "ai";

// init glyph
slot1Glyph.textContent = GLYPH_ANGEL;
updateState();

// přepínání vzhledu (jen když hráč)
function toggleMode() {
  isAngel = !isAngel;
  main.setAttribute('data-mode', isAngel ? 'angel' : 'daemon');
  slot1Glyph.textContent = isAngel ? GLYPH_ANGEL : GLYPH_DAEMON;
}

// tlačítko dole
toggleBtn.addEventListener('click', () => {
  if (control !== "player") {
    showToast("Revia: teď držím svět.");
    return;
  }
  toggleMode();
});

// klik na slot
slot1.addEventListener('click', () => {
  if (control !== "player") {
    showToast("Revia: nejdřív se přihlas jako moje majitelka.");
    return;
  }
  toggleMode();
});

// zápisník
wingBtn.addEventListener('click', () => notesPanel.classList.add('open'));
notesClose.addEventListener('click', () => notesPanel.classList.remove('open'));

// pomoc
const HELP_MSGS = [
  "Revia: patřím jen jedné osobě.",
  "Revia: když tu není, řídím to já.",
  "Revia: zápis se ukládá jen sem.",
  "Revia: pro vstup použij darovací frázi."
];
helpBtn.addEventListener('click', () => {
  const m = HELP_MSGS[Math.floor(Math.random() * HELP_MSGS.length)];
  showToast(m);
});

// notes storage
const saved = localStorage.getItem('reviaNotes');
if (saved !== null) notesText.value = saved;
notesText.addEventListener('input', () => {
  localStorage.setItem('reviaNotes', notesText.value);
});

// VSTOUPIT
enterBtn.addEventListener('click', () => {
  // pokud to není ona → nabídneme přihlášení
  if (!isOwner && control === "ai") {
    const pass = prompt("Revia je darovaná. Zadej frázi:");
    if (pass && pass === OWNER_PASS) {
      isOwner = true;
      localStorage.setItem(LS_KEY, "yes");
      showToast("Revia: ahoj, teď jsem tvoje 💙");
      // po úspěšném přihlášení hned povolíme vstup
      control = "player";
      main.setAttribute('data-control', 'player');
      enterBtn.textContent = "✅ Odejít";
      enterBtn.disabled = false;
      updateState();
    } else {
      showToast("Revia: ne, to není moje osoba.");
    }
    return;
  }

  // pokud je to ona → přepíná mezi AI a player
  if (control === "player") {
    control = "ai";
    main.setAttribute('data-control', 'ai');
    enterBtn.textContent = "🔒 Vstoupit";
    enterBtn.disabled = false;
    updateState();
    showToast("Revia: beru si to zpět.");
  } else {
    control = "player";
    main.setAttribute('data-control', 'player');
    enterBtn.textContent = "✅ Odejít";
    enterBtn.disabled = false;
    updateState();
    showToast("Revia: můžeš mě vést.");
  }
});

// toast
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// horní stav
function updateState() {
  if (!stateEl) return;
  if (control === "ai") {
    stateEl.textContent = isOwner ? "AI: hlídám za tebe" : "AI: hlídám svět";
  } else {
    stateEl.textContent = "PLAYER: ovládáš Reviu";
  }
}

// AI režim – dělá si svoje, ale nikoho nepustí
setInterval(() => {
  if (control === "player") return;   // když ji právě drží ta slečna, nezasahuj
  // občas se sama přepne světlo/stín
  if (Math.random() < 0.12) {
    toggleMode();
  }
}, 5000);
