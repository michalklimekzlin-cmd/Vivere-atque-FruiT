// ===== VAFT INIT =====
window.VAFT = window.VAFT || {};
window.VAFT.bus = window.VAFT.bus || {
  listeners: {},
  on(type, fn) {
    (this.listeners[type] = this.listeners[type] || []).push(fn);
  },
  emit(type, payload) {
    (this.listeners[type] || []).forEach(fn => fn(payload));
  }
};

// klíče pro localStorage
const JIZVA_CHAR_KEY = 'VAFT_JIZVA_CHARACTER';
const JIZVA_SKILLS_KEY = 'VAFT_JIZVA_SKILLS';

// ===== OBJEKT JIZVY =====
window.VAFT.jizva = {
  id: 'jizva-bear',
  name: 'Jizva',
  mode: 'dark', // 'dark' | 'soft'
  glyph: 'URSA-Σ',
  seal: 'CONST:URSAMINOR',

  setMode(mode) {
    this.mode = mode;
    document.body.setAttribute('data-jizva-mode', mode);

    // přepnout text
    const ms = document.getElementById('modeStatus');
    if (ms) ms.textContent = mode === 'dark' ? 'temný' : 'hodný';

    // přepnout tlačítka
    const btnSoft = document.getElementById('btn-soft');
    const btnDark = document.getElementById('btn-dark');
    if (btnSoft && btnDark) {
      btnSoft.classList.toggle('active', mode === 'soft');
      btnDark.classList.toggle('active', mode === 'dark');
    }

    // vyslat do světa
    window.VAFT.bus.emit('jizva:mode-changed', { mode });
  },

  say(text) {
    // můžeš si to pak napojit na UI
    console.log('[Jizva]', text);
    window.VAFT.bus.emit('to:world', {
      from: this.id,
      text,
      mode: this.mode
    });
  }
};

// ===== FUNKCE PRO UI =====
function setJizvaMode(mode) {
  window.VAFT.jizva.setMode(mode);
}

function sendToJizva() {
  const el = document.getElementById('inputBox');
  const status = document.getElementById('sendStatus');
  const text = el.value.trim();
  if (!text) {
    status.textContent = 'Není co poslat.';
    return;
  }
  // Jizva na to může reagovat jinak podle módu
  if (window.VAFT.jizva.mode === 'dark') {
    window.VAFT.jizva.say('Přijal jsem zprávu v temném režimu. Budu hlídat.');
  } else {
    window.VAFT.jizva.say('Díky za zprávu, ukládám do mechu.');
  }
  status.textContent = 'Zpráva odeslána Jizvovi.';
  el.value = '';
}

// ===== ULOŽENÍ CHARAKTERU =====
function saveChar() {
  const box = document.getElementById('charBox');
  const status = document.getElementById('charStatus');
  const text = box.value.trim();
  localStorage.setItem(JIZVA_CHAR_KEY, text);
  status.textContent = 'Charakter uložen.';
}

// ===== ULOŽENÍ DOVEDNOSTÍ =====
function saveSkills() {
  const box = document.getElementById('skillsBox');
  const status = document.getElementById('skillsStatus');
  const text = box.value.trim();
  localStorage.setItem(JIZVA_SKILLS_KEY, text);
  status.textContent = 'Dovednosti uloženy.';
}

// ===== NAČTENÍ PŘI STARTU =====
window.addEventListener('DOMContentLoaded', () => {
  // načti režim default
  window.VAFT.jizva.setMode('dark');

  // načti charakter
  const char = localStorage.getItem(JIZVA_CHAR_KEY);
  if (char) {
    const box = document.getElementById('charBox');
    if (box) box.value = char;
  }

  // načti dovednosti
  const skills = localStorage.getItem(JIZVA_SKILLS_KEY);
  if (skills) {
    const box = document.getElementById('skillsBox');
    if (box) box.value = skills;
  }
});

// ===== Jizva reaguje na porušení pravidel ve světě =====
window.VAFT.bus.on('world:rule-break', info => {
  if (window.VAFT.jizva.mode === 'dark') {
    window.VAFT.jizva.say(
      `Zachytil jsem porušení pravidla ${info.rule} od ${info.who}. Přepínám do ochrany.`
    );
  } else {
    window.VAFT.jizva.say(
      `Vidím neklid u ${info.who}. Navrhuji přátelskou opravu.`
    );
  }
});
