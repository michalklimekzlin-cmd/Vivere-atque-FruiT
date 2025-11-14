// vaft-swloader.js
(function () {
  if (!('serviceWorker' in navigator)) {
    console.log('[VAFT SW] Service worker nepodporován');
    return;
  }

  window.addEventListener('load', () => {
    try {
      // zjistíme cestu k tomuhle souboru
      const script = document.currentScript;
      let basePath = '';

      if (script && script.src) {
        const url = new URL(script.src, window.location.origin);
        // adresář, kde leží vaft-swloader.js
        basePath = url.pathname.replace(/\/[^\/]*$/, '/');
      } else {
        basePath = '/';
      }

      const ver = window.V || Date.now();
      const swUrl = basePath + 'service-worker.js?v=' + ver;

      console.log('[VAFT SW] Registruji', swUrl);

      navigator.serviceWorker
        .register(swUrl)
        .then(reg => {
          console.log('[VAFT SW] OK', reg.scope);
        })
        .catch(err => {
          console.warn('[VAFT SW] Chyba registrace', err);
        });
    } catch (e) {
      console.warn('[VAFT SW] Výjimka při registraci', e);
    }
  });
})();
