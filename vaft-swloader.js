// ===== Vivere atque FruiT • SW Loader (automatická registrace) =====
// Detekuje, v jaké složce se nacházíme, a zaregistruje centrálního workera.
// Michal & Kovošrot 2025 🦾

(function () {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    // zkusíme zaregistrovat centrálního workera z kořene
    const swURL = new URL('./vaft-sw.js?v=1', window.location.href).toString();

    navigator.serviceWorker
      .register(swURL)
      .then((reg) => {
        console.log('[VAFT-Loader] registrován →', reg.scope);

        // pokud už čeká nová verze, aktivuj ji
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        // detekce nových verzí během běhu
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              console.log('[VAFT-Loader] dostupná nová verze workera');
              // volitelně:
              // location.reload();
            }
          });
        });
      })
      .catch((err) =>
        console.warn('[VAFT-Loader] registrace selhala:', err)
      );
  });
})();
