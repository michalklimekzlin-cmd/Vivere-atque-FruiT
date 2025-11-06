// Revia UI skript
(function(){
  const askBtn = document.getElementById('reviaAskBtn');

  // sem později napojíme VAFT heartbeat / AI
  const MESSAGES = [
    "Dýchej. Svět teprve vzniká.",
    "Nedokončené srdce je taky srdce.",
    "「Ī’♡ – tvůj podpis ve světě.",
    "Když je chaos, zavolám sama."
  ];

  askBtn?.addEventListener('click', () => {
    const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    showReviaToast(msg);
  });

  function showReviaToast(text){
    let el = document.createElement('div');
    el.className = 'revia-toast';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(()=> el.classList.add('show'), 10);
    setTimeout(()=> {
      el.classList.remove('show');
      setTimeout(()=> el.remove(), 300);
    }, 3000);
  }
})();
