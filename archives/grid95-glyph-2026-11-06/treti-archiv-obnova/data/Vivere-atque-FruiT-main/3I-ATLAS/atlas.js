// tlačítko signál
const btn = document.getElementById('signalBtn');
const toast = document.getElementById('atlasToast');

if (btn) {
  btn.addEventListener('click', () => {
    toast.classList.add('show');

    // kdyby existoval VAFT kernel:
    if (window.VAFT && VAFT.world && typeof VAFT.world.detect === 'function') {
      VAFT.world.detect({ source: '3I-ATLAS', kind: 'interstellar' });
    }

    setTimeout(() => toast.classList.remove('show'), 2600);
  });
}

function goBack() {
  // pokus o návrat do hlavního rámce
  if (window.top !== window.self) {
    // jsme v iframe → jen zavřít
    window.parent.postMessage({ type: 'close-app', app: '3I-ATLAS' }, '*');
  } else {
    // klasicky zpět
    window.history.back();
  }
}
