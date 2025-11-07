// jednoduchý logger
const logEl = document.getElementById('hlavounLog');
const inputEl = document.getElementById('hlavounCmd');
const runBtn  = document.getElementById('hlavounRun');

function logLine(prefix, text) {
  const p = document.createElement('p');
  p.innerHTML = `<b>[${prefix}]</b> ${text}`;
  logEl.appendChild(p);
  logEl.scrollTop = logEl.scrollHeight;
}

// odeslání příkazu
function runCmd() {
  const cmd = inputEl.value.trim();
  if (!cmd) return;
  logLine('you', cmd);

  // tady můžeš časem napojit skutečné zpracování
  logLine('sys', 'Přijato. Zpracovávám…');

  // broadcast do VAFTu (stejně jako Revia)
  if (window.vaftBroadcast) {
    window.vaftBroadcast({
      from: 'hlavoun',
      type: 'note',
      payload: cmd,
      t: Date.now()
    });
  }

  inputEl.value = '';
}

runBtn.addEventListener('click', runCmd);
inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') runCmd();
});

// tlačítka dole
document.getElementById('hlavounMode').addEventListener('click', () => {
  logLine('sys', 'Žádost: přepni Revii.');
  if (window.vaftBroadcast) {
    window.vaftBroadcast({ from: 'hlavoun', type: 'toggle-revia' });
  }
});

document.getElementById('hlavounNote').addEventListener('click', () => {
  logLine('sys', 'Žádost: otevři křídlo / zápisník.');
  if (window.vaftBroadcast) {
    window.vaftBroadcast({ from: 'hlavoun', type: 'open-notes' });
  }
});
