// app.js – VAFT Home router

window.VAFT = window.VAFT || {};
VAFT.apps = VAFT.apps || {};

// pomocná funkce pro moduly
window.VAFT_APP = function(id, config) {
  VAFT.apps[id] = config;
};

// otevření modulu
function openApp(id) {
  const app = VAFT.apps[id];
  if (!app) {
    alert('[' + id + '] zatím není napojený modul.');
    return;
  }
  if (typeof app.open === 'function') {
    app.open();
  } else {
    alert('[' + id + '] ' + (app.title || 'Modul') + ' – placeholder bez UI.');
  }
}

// navázání na Canvas boxy (#1–#12)
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-app]').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.app;
      openApp(id);
    });
  });
});
