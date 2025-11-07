// === Inicializace VAFT ===
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

// === Objekt Jizvy ===
window.VAFT.jizva = {
  id: 'jizva-bear',
  name: 'Jizva',
  mode: 'dark', // dark | soft
  glyph: 'URSA-Σ',
  seal: 'CONST:URSAMINOR',

  setMode(mode) {
    this.mode = mode;
    document.body.setAttribute('data-jizva-mode', mode);
    document.getElementById('modeStatus').textContent =
      mode === 'dark' ? 'temný' : 'hodný';
    window.VAFT.bus.emit('jizva:mode-changed', { mode });
  },

  say(text) {
    console.log(`[Jizva] ${text}`);
    window.VAFT.bus.emit('to:world', {
      from: this.id,
      text
    });
  }
};

// === Přepínač režimu ===
function toggleMode() {
  const next = window.VAFT.jizva.mode === 'dark' ? 'soft' : 'dark';
  window.VAFT.jizva.setMode(next);
}

// === Ukázka komunikace ===
window.VAFT.bus.on('world:rule-break', info => {
  if (window.VAFT.jizva.mode === 'dark') {
    window.VAFT.jizva.say(
      `Zachytil jsem porušení pravidla ${info.rule} od ${info.who}. Aktivuji ochranu.`
    );
  } else {
    window.VAFT.jizva.say(
      `Vidím neklid u ${info.who}. Doporučuji přátelské vysvětlení.`
    );
  }
});
